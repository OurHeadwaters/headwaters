/**
 * Integration test for the kit purchase webhook flow.
 *
 * Covers two levels:
 *
 * 1. Full dispatch path — constructs a raw Buffer shaped like a real Stripe
 *    checkout.session.completed event, passes it through
 *    WebhookHandlers.processWebhook (signature verification mocked out), and
 *    confirms the route kit_slug → handleKitCheckoutComplete is taken.
 *
 * 2. Handler-level path — calls handleKitCheckoutComplete directly with a
 *    mock session object and verifies:
 *      a. row inserted in kit_purchases with correct kit_slug / buyer_email /
 *         amount_paid_cents
 *      b. sendKitWelcomeEmail called with the right arguments
 *      c. idempotency: duplicate session_id produces no second row and no
 *         second email
 *      d. missing-email guard: session without buyer email is a silent skip
 *
 * 3. HTTP guard — POST /api/stripe/webhook without stripe-signature → 400.
 *
 * The database connection is real so schema drift surfaces as a SQL error.
 * Only the Stripe client and the Resend email client are mocked.
 *
 * For manual end-to-end verification against a real Stripe test checkout see:
 *   artifacts/api-server/docs/kit-purchase-runbook.md
 */
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import request from "supertest";

/* ─── Mock: bypass Stripe signature verification ──────────────────────────────
 * verifyAndParseWebhookEvent is now the primary security gate in processWebhook.
 * Mock it to parse the raw Buffer payload directly (skipping HMAC verification)
 * so tests can inject arbitrary events without real Stripe credentials.
 *
 * getStripeSync is still mocked for the non-blocking background sync path.
 */
vi.mock("./stripeClient.js", () => ({
  verifyAndParseWebhookEvent: (_payload: Buffer, _sig: string) =>
    Promise.resolve(JSON.parse(_payload.toString()) as import("stripe").default.Event),
  getStripeSync: () =>
    Promise.resolve({
      processWebhook: (_payload: Buffer, _sig: string) => Promise.resolve({}),
    }),
  getUncachableStripeClient: () =>
    Promise.reject(new Error("getUncachableStripeClient not mocked")),
}));

/* ─── Mock: intercept email sends ─────────────────────────────────────────────
 * vi.hoisted() ensures spy references are available inside the vi.mock()
 * factory, which vitest hoists above all top-level const declarations.
 */
const { sendKitWelcomeEmailSpy, sendKitPurchaseAdminNotificationSpy } = vi.hoisted(() => ({
  sendKitWelcomeEmailSpy: vi.fn().mockResolvedValue({ sent: true }),
  sendKitPurchaseAdminNotificationSpy: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./lib/email.js", () => ({
  sendKitWelcomeEmail: sendKitWelcomeEmailSpy,
  sendKitPurchaseAdminNotification: sendKitPurchaseAdminNotificationSpy,
  sendGordTipNotificationEmail: vi.fn().mockResolvedValue(undefined),
  sendKitInquiryNotification: vi.fn().mockResolvedValue(undefined),
  sendKitAccessEmail: vi.fn().mockResolvedValue(undefined),
  generateKitAccessToken: vi.fn().mockReturnValue("test-token"),
  verifyKitAccessToken: vi.fn().mockReturnValue(false),
}));

/* ─── Mock auth layer ─────────────────────────────────────────────────────────
 * authMiddleware is wired into the app at import time; must be importable even
 * though webhook routes are unauthenticated.
 */
vi.mock("./lib/auth.js", () => ({
  SESSION_COOKIE: "sid",
  getSessionId: () => undefined,
  getSession: () => Promise.resolve(null),
  clearSession: vi.fn(),
  updateSession: vi.fn(),
}));

/* ─── Real DB + app imports (after mock declarations) ────────────────────── */

import { db, kitPurchasesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import app from "./app.js";
import { WebhookHandlers } from "./webhookHandlers.js";

/* ─── Constants ──────────────────────────────────────────────────────────── */

const TEST_KIT_SLUG = "family-kit";
const TEST_BUYER_EMAIL = "webhook-integration-test@example.invalid";
const TEST_BUYER_NAME = "Webhook Test Buyer";
const TEST_AMOUNT_CENTS = 12700;

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/** Unique session id per test invocation to isolate DB rows across tests. */
function uniqueSessionId(): string {
  return `cs_test_webhook_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Minimal Stripe.Checkout.Session shape the handler reads from. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMockSession(sessionId: string, overrides: Record<string, unknown> = {}): any {
  return {
    id: sessionId,
    object: "checkout.session",
    amount_total: TEST_AMOUNT_CENTS,
    customer_email: TEST_BUYER_EMAIL,
    customer_details: {
      email: TEST_BUYER_EMAIL,
      name: TEST_BUYER_NAME,
    },
    metadata: { kit_slug: TEST_KIT_SLUG },
    payment_status: "paid",
    status: "complete",
    ...overrides,
  };
}

/**
 * Builds a raw Buffer shaped like a real Stripe checkout.session.completed
 * event. This is the same payload shape that processWebhook receives from the
 * express.raw middleware before any JSON parsing.
 */
function buildEventBuffer(sessionId: string, sessionOverrides: Record<string, unknown> = {}): Buffer {
  const event = {
    id: `evt_test_${Date.now()}`,
    object: "event",
    type: "checkout.session.completed",
    livemode: false,
    created: Math.floor(Date.now() / 1000),
    data: { object: buildMockSession(sessionId, sessionOverrides) },
  };
  return Buffer.from(JSON.stringify(event));
}

/* ─── DB cleanup ─────────────────────────────────────────────────────────── */

beforeAll(async () => {
  await db
    .delete(kitPurchasesTable)
    .where(eq(kitPurchasesTable.buyerEmail, TEST_BUYER_EMAIL));
});

afterAll(async () => {
  await db
    .delete(kitPurchasesTable)
    .where(eq(kitPurchasesTable.buyerEmail, TEST_BUYER_EMAIL));
});

beforeEach(() => {
  sendKitWelcomeEmailSpy.mockClear();
  sendKitPurchaseAdminNotificationSpy.mockClear();
});

/* ─── 1. Full dispatch path through processWebhook ───────────────────────── */

describe("processWebhook — full dispatch to kit purchase handler", () => {
  it("inserts a kit_purchases row when processWebhook receives a checkout.session.completed Buffer with kit_slug metadata", async () => {
    const sessionId = uniqueSessionId();
    const payload = buildEventBuffer(sessionId);

    // Call processWebhook with the raw Buffer — Stripe signature is mocked out.
    // This exercises event parsing, type routing, and handler dispatch.
    await WebhookHandlers.processWebhook(payload, "t=1,v1=test-mocked-sig");

    const rows = await db
      .select()
      .from(kitPurchasesTable)
      .where(
        and(
          eq(kitPurchasesTable.stripeCheckoutSessionId, sessionId),
          eq(kitPurchasesTable.kitSlug, TEST_KIT_SLUG),
        ),
      )
      .limit(1);

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.kitSlug).toBe(TEST_KIT_SLUG);
    expect(row.buyerEmail).toBe(TEST_BUYER_EMAIL.toLowerCase());
    expect(row.amountPaidCents).toBe(TEST_AMOUNT_CENTS);
    expect(row.stripeCheckoutSessionId).toBe(sessionId);
  });

  it("calls sendKitWelcomeEmail after a successful processWebhook dispatch", async () => {
    const sessionId = uniqueSessionId();
    const payload = buildEventBuffer(sessionId);

    await WebhookHandlers.processWebhook(payload, "t=1,v1=test-mocked-sig");

    expect(sendKitWelcomeEmailSpy).toHaveBeenCalledOnce();
    const args = sendKitWelcomeEmailSpy.mock.calls[0][0] as {
      buyerEmail: string;
      kitSlug: string;
      kitName: string;
    };
    expect(args.buyerEmail).toBe(TEST_BUYER_EMAIL.toLowerCase());
    expect(args.kitSlug).toBe(TEST_KIT_SLUG);
    expect(typeof args.kitName).toBe("string");
    expect(args.kitName.length).toBeGreaterThan(0);
  });
});

/* ─── 2. Handler-level integration tests ────────────────────────────────── */

describe("handleKitCheckoutComplete — DB insert, email, and guards", () => {
  it("inserts a kit_purchases row with the correct kit_slug, buyer_email, buyerName, and amount_paid_cents", async () => {
    const sessionId = uniqueSessionId();

    await WebhookHandlers.handleKitCheckoutComplete(
      buildMockSession(sessionId),
      TEST_KIT_SLUG,
    );

    const rows = await db
      .select()
      .from(kitPurchasesTable)
      .where(
        and(
          eq(kitPurchasesTable.stripeCheckoutSessionId, sessionId),
          eq(kitPurchasesTable.kitSlug, TEST_KIT_SLUG),
        ),
      )
      .limit(1);

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.kitSlug).toBe(TEST_KIT_SLUG);
    expect(row.buyerEmail).toBe(TEST_BUYER_EMAIL.toLowerCase());
    expect(row.buyerName).toBe(TEST_BUYER_NAME);
    expect(row.amountPaidCents).toBe(TEST_AMOUNT_CENTS);
    expect(row.purchasedAt).toBeInstanceOf(Date);
  });

  it("calls sendKitWelcomeEmail with buyer email, kit slug, and a non-empty kit name", async () => {
    const sessionId = uniqueSessionId();

    await WebhookHandlers.handleKitCheckoutComplete(
      buildMockSession(sessionId),
      TEST_KIT_SLUG,
    );

    expect(sendKitWelcomeEmailSpy).toHaveBeenCalledOnce();
    const callArgs = sendKitWelcomeEmailSpy.mock.calls[0][0] as {
      buyerEmail: string;
      buyerName: string | null;
      kitSlug: string;
      kitName: string;
    };
    expect(callArgs.buyerEmail).toBe(TEST_BUYER_EMAIL.toLowerCase());
    expect(callArgs.kitSlug).toBe(TEST_KIT_SLUG);
    expect(typeof callArgs.kitName).toBe("string");
    expect(callArgs.kitName.length).toBeGreaterThan(0);
  });

  it("is idempotent — replaying the same session_id produces no second row and no second email", async () => {
    const sessionId = uniqueSessionId();

    // First call
    await WebhookHandlers.handleKitCheckoutComplete(
      buildMockSession(sessionId),
      TEST_KIT_SLUG,
    );

    sendKitWelcomeEmailSpy.mockClear();

    // Replay — simulates Stripe sending the same event twice
    await WebhookHandlers.handleKitCheckoutComplete(
      buildMockSession(sessionId),
      TEST_KIT_SLUG,
    );

    const rows = await db
      .select({ id: kitPurchasesTable.id })
      .from(kitPurchasesTable)
      .where(eq(kitPurchasesTable.stripeCheckoutSessionId, sessionId));

    // onConflictDoNothing: still exactly one row
    expect(rows).toHaveLength(1);
    expect(sendKitWelcomeEmailSpy).not.toHaveBeenCalled();
  });

  it("skips insert and email when buyer email is absent from the session", async () => {
    const sessionId = uniqueSessionId();

    await WebhookHandlers.handleKitCheckoutComplete(
      buildMockSession(sessionId, { customer_email: null, customer_details: null }),
      TEST_KIT_SLUG,
    );

    const rows = await db
      .select({ id: kitPurchasesTable.id })
      .from(kitPurchasesTable)
      .where(eq(kitPurchasesTable.stripeCheckoutSessionId, sessionId));

    expect(rows).toHaveLength(0);
    expect(sendKitWelcomeEmailSpy).not.toHaveBeenCalled();
  });
});

/* ─── 3. HTTP guard ──────────────────────────────────────────────────────── */

describe("POST /api/stripe/webhook — stripe-signature guard", () => {
  it("returns 400 when the stripe-signature header is missing", async () => {
    const res = await request(app)
      .post("/api/stripe/webhook")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ type: "checkout.session.completed", data: { object: {} } }));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
