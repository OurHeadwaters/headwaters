/**
 * Integration test for GET /api/kits/my-purchases
 *
 * Uses a real database connection so that schema drift (e.g. renaming
 * purchasedAt → createdAt in kit_purchases) produces an actual SQL error and
 * fails the test before the change reaches users.
 *
 * Only the auth layer is mocked so the test does not require a real OIDC
 * session or a row in the sessions table.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import request from "supertest";

/* ─── Test identity ─────────────────────────────────────────────────────── */

const TEST_USER_ID = "test-integration-user-kits-my-purchases";
const TEST_EMAIL = "integration-test@example.invalid";
const TEST_KIT_SLUG = "family-kit";

/* ─── Mock auth layer only ───────────────────────────────────────────────────
 * authMiddleware reads getSessionId() from the request cookies and then calls
 * getSession() to retrieve the user. By stubbing both we inject req.user
 * without needing a real OIDC discovery or a sessions-table row.
 *
 * All other modules — including @workspace/db — use the real implementations
 * so the Drizzle query executes against the actual database.
 */
vi.mock("../lib/auth.js", () => ({
  SESSION_COOKIE: "sid",
  getSessionId: (req: { cookies?: Record<string, string> }) =>
    req.cookies?.["sid"],
  getSession: (sid: unknown) =>
    sid === "test-session-id"
      ? Promise.resolve({
          user: { id: TEST_USER_ID, username: "integration-test-user" },
          access_token: "fake-token",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        })
      : Promise.resolve(null),
  clearSession: vi.fn(),
  updateSession: vi.fn(),
}));

/* ─── Real DB imports (after mock declarations) ──────────────────────────── */

import { db, kitPurchasesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import app from "../app.js";

/* ─── Fixtures ───────────────────────────────────────────────────────────── */

let insertedId: number;

beforeAll(async () => {
  const [row] = await db
    .insert(kitPurchasesTable)
    .values({
      kitSlug: TEST_KIT_SLUG,
      userId: TEST_USER_ID,
      buyerEmail: TEST_EMAIL,
      amountPaidCents: 9700,
    })
    .returning({ id: kitPurchasesTable.id });

  insertedId = row.id;
});

afterAll(async () => {
  await db
    .delete(kitPurchasesTable)
    .where(eq(kitPurchasesTable.userId, TEST_USER_ID));
});

/* ─── Tests ──────────────────────────────────────────────────────────────── */

describe("GET /api/kits/my-purchases", () => {
  it("returns 200 with a purchases array when the user is authenticated", async () => {
    const res = await request(app)
      .get("/api/kits/my-purchases")
      .set("Cookie", "sid=test-session-id");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("purchases");
    expect(Array.isArray(res.body.purchases)).toBe(true);
  });

  it("returns the seeded purchase with the correct shape including purchasedAt", async () => {
    const res = await request(app)
      .get("/api/kits/my-purchases")
      .set("Cookie", "sid=test-session-id");

    expect(res.status).toBe(200);

    const purchase = (res.body.purchases as unknown[]).find(
      (p: unknown) => (p as { id: number }).id === insertedId,
    ) as {
      id: number;
      kitSlug: string;
      purchasedAt: string;
      kit: { slug: string; name: string; tagline: string } | null;
    };

    expect(purchase).toBeDefined();
    expect(purchase.id).toBe(insertedId);
    expect(purchase.kitSlug).toBe(TEST_KIT_SLUG);

    // purchasedAt must be present and parse as a valid date.
    // If the column is renamed (e.g. createdAt) this field will be missing.
    expect(purchase).toHaveProperty("purchasedAt");
    expect(typeof purchase.purchasedAt).toBe("string");
    expect(Number.isNaN(Date.parse(purchase.purchasedAt))).toBe(false);
  });

  it("does NOT include a createdAt field (guards against purchasedAt → createdAt rename)", async () => {
    const res = await request(app)
      .get("/api/kits/my-purchases")
      .set("Cookie", "sid=test-session-id");

    expect(res.status).toBe(200);

    const purchase = (res.body.purchases as unknown[]).find(
      (p: unknown) => (p as { id: number }).id === insertedId,
    );

    expect(purchase).toBeDefined();
    expect(purchase).not.toHaveProperty("createdAt");
  });

  it("includes kit metadata for known kit slugs", async () => {
    const res = await request(app)
      .get("/api/kits/my-purchases")
      .set("Cookie", "sid=test-session-id");

    expect(res.status).toBe(200);

    const purchase = (res.body.purchases as unknown[]).find(
      (p: unknown) => (p as { id: number }).id === insertedId,
    ) as { kit: { slug: string; name: string; tagline: string } | null };

    expect(purchase?.kit).not.toBeNull();
    expect(purchase?.kit?.slug).toBe(TEST_KIT_SLUG);
    expect(typeof purchase?.kit?.name).toBe("string");
    expect(typeof purchase?.kit?.tagline).toBe("string");
  });

  it("returns 401 when no session cookie is present", async () => {
    const res = await request(app).get("/api/kits/my-purchases");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });
});
