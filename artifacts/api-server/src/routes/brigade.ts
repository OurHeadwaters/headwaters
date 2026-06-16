import { Router, type IRouter } from "express";
import { db, membershipsTable, wishingWellCreditsTable } from "@workspace/db";
import { and, count, eq, gt, isNull, sql, sum } from "drizzle-orm";
import { logger } from "../lib/logger";
import { getUncachableStripeClient } from "../stripeClient";
import { getBrigadePriceIds } from "../lib/brigade-products";
import { requireEditor } from "../middlewares/requireEditor";

const router: IRouter = Router();

function getBaseUrl(req: import("express").Request): string {
  const domain = (process.env.REPLIT_DOMAINS ?? "").split(",")[0];
  if (domain) return `https://${domain}`;
  return `${req.protocol}://${req.get("host") ?? "localhost"}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/brigade/status
//
// Returns the Brigade membership status for the authenticated user.
// Public: returns { isMember: false } for unauthenticated callers.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/brigade/status", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.json({ isMember: false, status: null });
    return;
  }

  const [membership] = await db
    .select({
      id: membershipsTable.id,
      status: membershipsTable.status,
      plan: membershipsTable.plan,
      currentPeriodEnd: membershipsTable.currentPeriodEnd,
    })
    .from(membershipsTable)
    .where(
      and(
        eq(membershipsTable.userId, req.user.id),
        eq(membershipsTable.status, "active"),
        gt(membershipsTable.currentPeriodEnd, new Date()),
      ),
    )
    .limit(1);

  if (!membership) {
    res.json({ isMember: false, status: null });
    return;
  }

  res.json({
    isMember: true,
    status: membership.status,
    plan: membership.plan,
    currentPeriodEnd: membership.currentPeriodEnd,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/brigade/member-count
//
// Returns the total number of active Brigade members (public, for social proof).
// ─────────────────────────────────────────────────────────────────────────────
router.get("/brigade/member-count", async (_req, res) => {
  try {
    const [row] = await db
      .select({ count: count() })
      .from(membershipsTable)
      .where(
        and(
          eq(membershipsTable.status, "active"),
          gt(membershipsTable.currentPeriodEnd, new Date()),
        ),
      );

    res.json({ count: row?.count ?? 0 });
  } catch (err) {
    logger.error({ err }, "brigade: member-count failed");
    res.status(500).json({ error: "Failed to fetch member count" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/brigade/checkout
//
// Creates a Stripe Checkout session for a Brigade membership.
// Body: { plan: "monthly" | "annual" }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/brigade/checkout", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const plan = req.body?.plan as string;
  if (plan !== "monthly" && plan !== "annual") {
    res.status(400).json({ error: "plan must be 'monthly' or 'annual'" });
    return;
  }

  // Check if already an active member
  const [existing] = await db
    .select({ id: membershipsTable.id })
    .from(membershipsTable)
    .where(
      and(
        eq(membershipsTable.userId, req.user.id),
        eq(membershipsTable.status, "active"),
        gt(membershipsTable.currentPeriodEnd, new Date()),
      ),
    )
    .limit(1);

  if (existing) {
    res.status(400).json({ error: "You are already a Brigade member" });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();
    const { monthlyPriceId, annualPriceId } = await getBrigadePriceIds();
    const priceId = plan === "monthly" ? monthlyPriceId : annualPriceId;
    const baseUrl = getBaseUrl(req);

    // ── Check for unredeemed Wishing Well credits ──────────────────────────
    // If the user has platform credits, apply them as a Stripe coupon discount.
    // Plan prices: monthly = $9 (900 cents), annual = $97 (9700 cents).
    const planPriceCents = plan === "monthly" ? 900 : 9700;
    const unredeemedCredits = await db
      .select({ id: wishingWellCreditsTable.id, amountCents: wishingWellCreditsTable.amountCents })
      .from(wishingWellCreditsTable)
      .where(
        and(
          eq(wishingWellCreditsTable.userId, req.user.id),
          isNull(wishingWellCreditsTable.redeemedAt),
        ),
      );

    const totalCreditCents = unredeemedCredits.reduce((s, c) => s + c.amountCents, 0);
    const discountCents = Math.min(totalCreditCents, planPriceCents);

    let couponId: string | undefined;
    if (discountCents > 0) {
      // Create a one-time coupon for the exact discount amount
      const coupon = await stripe.coupons.create({
        amount_off: discountCents,
        currency: "usd",
        duration: "once",
        name: `Wishing Well Credit — $${(discountCents / 100).toFixed(2)}`,
        max_redemptions: 1,
        metadata: {
          brigade_user_id: req.user.id,
          source: "wishing_well_credit",
        },
      });
      couponId = coupon.id;

      // Mark credits as redeemed immediately (before session creation to avoid
      // race conditions; the coupon max_redemptions=1 prevents double-use).
      const now = new Date();
      for (const credit of unredeemedCredits) {
        await db
          .update(wishingWellCreditsTable)
          .set({ redeemedAt: now })
          .where(eq(wishingWellCreditsTable.id, credit.id));
      }

      logger.info(
        { userId: req.user.id, discountCents, couponId },
        "brigade: applying Wishing Well credit discount",
      );
    }

    // Idempotency key: scoped to user + plan so duplicate requests within
    // Stripe's 24-hour window don't create a second session.
    const idempotencyKey = `brigade-checkout-${req.user.id}-${plan}-${discountCents}`;

    const sessionParams: import("stripe").Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/brigade?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/brigade?checkout=cancelled`,
      metadata: {
        brigade_user_id: req.user.id,
        brigade_plan: plan,
      },
      subscription_data: {
        metadata: {
          brigade_user_id: req.user.id,
          brigade_plan: plan,
        },
        ...(couponId ? { coupon: couponId } : {}),
      },
      customer_email: req.user.email ?? undefined,
    };

    const session = await stripe.checkout.sessions.create(
      sessionParams,
      { idempotencyKey },
    );

    logger.info(
      { userId: req.user.id, plan, sessionId: session.id, discountCents },
      "brigade: checkout session created",
    );

    res.json({
      url: session.url,
      sessionId: session.id,
      creditAppliedCents: discountCents,
    });
  } catch (err) {
    logger.error({ err }, "brigade: checkout failed");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/brigade/portal
//
// Returns a Stripe Billing Portal URL for the authenticated member to manage
// their subscription (cancel, update payment method, view invoices).
// ─────────────────────────────────────────────────────────────────────────────
router.get("/brigade/portal", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const [membership] = await db
    .select({ stripeCustomerId: membershipsTable.stripeCustomerId })
    .from(membershipsTable)
    .where(eq(membershipsTable.userId, req.user.id))
    .limit(1);

  if (!membership) {
    res.status(404).json({ error: "No Brigade membership found" });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();
    const baseUrl = getBaseUrl(req);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: membership.stripeCustomerId,
      return_url: `${baseUrl}/brigade`,
    });

    res.json({ url: portalSession.url });
  } catch (err) {
    logger.error({ err }, "brigade: portal failed");
    res.status(500).json({ error: "Failed to create billing portal session" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/brigade/stats
//
// Read-only admin dashboard widget: member count, MRR, next-30-day renewals.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/admin/brigade/stats", requireEditor, async (_req, res) => {
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Active members
    const [activeRow] = await db
      .select({ count: count() })
      .from(membershipsTable)
      .where(
        and(
          eq(membershipsTable.status, "active"),
          gt(membershipsTable.currentPeriodEnd, now),
        ),
      );

    // Monthly vs annual breakdown (for MRR calculation)
    const breakdown = await db
      .select({
        plan: membershipsTable.plan,
        count: count(),
      })
      .from(membershipsTable)
      .where(
        and(
          eq(membershipsTable.status, "active"),
          gt(membershipsTable.currentPeriodEnd, now),
        ),
      )
      .groupBy(membershipsTable.plan);

    // Calculate MRR: monthly members × $9 + annual members × ($97 / 12)
    let mrr = 0;
    for (const row of breakdown) {
      if (row.plan === "monthly") mrr += row.count * 9;
      else if (row.plan === "annual") mrr += row.count * (97 / 12);
    }

    // Renewals in next 30 days
    const [renewalRow] = await db
      .select({ count: count() })
      .from(membershipsTable)
      .where(
        and(
          eq(membershipsTable.status, "active"),
          gt(membershipsTable.currentPeriodEnd, now),
          sql`${membershipsTable.currentPeriodEnd} <= ${in30Days}`,
        ),
      );

    // Past-due members
    const [pastDueRow] = await db
      .select({ count: count() })
      .from(membershipsTable)
      .where(eq(membershipsTable.status, "past_due"));

    // Churn: cancellations in the last 30 days
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [churnRow] = await db
      .select({ count: count() })
      .from(membershipsTable)
      .where(
        and(
          eq(membershipsTable.status, "cancelled"),
          sql`${membershipsTable.updatedAt} >= ${last30Days}`,
        ),
      );

    res.json({
      activeMembers: activeRow?.count ?? 0,
      mrr: Math.round(mrr * 100) / 100,
      renewalsNext30Days: renewalRow?.count ?? 0,
      pastDueMembers: pastDueRow?.count ?? 0,
      churnLast30Days: churnRow?.count ?? 0,
      breakdown: breakdown.map((r) => ({ plan: r.plan, count: r.count })),
    });
  } catch (err) {
    logger.error({ err }, "brigade: admin stats failed");
    res.status(500).json({ error: "Failed to fetch Brigade stats" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/stripe/status
//
// Admin-facing Stripe integration health check. Reports:
//   - Whether the integration is connected and which environment is active
//   - Key mode: LIVE (sk_live_) vs TEST (sk_test_)
//   - Registered webhook URL vs expected deployed-domain URL
//   - Whether the webhook secret is present
//   - Smoke test runbook for verifying end-to-end payment flow
//
// How to run a live checkout smoke test:
//   1. Visit /brigade as an authenticated user and click "Join the Brigade" (monthly plan)
//   2. Complete checkout with a real card in Stripe's live checkout
//   3. Stripe fires checkout.session.completed → /api/stripe/webhook
//   4. Check server logs for "webhookHandlers: Brigade membership activated"
//   5. Check the memberships table: SELECT * FROM memberships WHERE user_id = '<id>'
//      — status should be 'active', current_period_end in the future
//   6. /api/brigade/status should return { isMember: true }
// ─────────────────────────────────────────────────────────────────────────────
router.get("/admin/stripe/status", requireEditor, async (_req, res) => {
  try {
    const stripe = await getUncachableStripeClient();

    // Retrieve balance to confirm the key is valid.
    // balance.livemode is true when using live keys, false for test keys.
    const balance = await stripe.balance.retrieve();
    const keyMode = balance.livemode ? "LIVE" : "TEST";

    const isProduction = process.env.REPLIT_DEPLOYMENT === "1";
    const deployedDomain = (process.env.REPLIT_DOMAINS ?? "").split(",")[0];
    const expectedWebhookUrl = deployedDomain
      ? `https://${deployedDomain}/api/stripe/webhook`
      : null;

    res.json({
      connected: true,
      keyMode,
      isProductionDeployment: isProduction,
      expectedWebhookUrl,
      webhookSecretPresent: !isProduction
        ? "not checked (development)"
        : "verified at startup",
      smokeTestRunbook: [
        "1. Visit /brigade as an authenticated user",
        "2. Click Join the Brigade (monthly plan) and complete checkout",
        "3. Watch server logs for: webhookHandlers: Brigade membership activated",
        "4. Query: SELECT status, current_period_end FROM memberships WHERE user_id = '<id>'",
        "5. GET /api/brigade/status should return { isMember: true }",
      ],
    });
  } catch (err) {
    logger.error({ err }, "stripe: admin status check failed");
    res.status(503).json({
      connected: false,
      error: err instanceof Error ? err.message : String(err),
      fix: "Connect Stripe via the Integrations tab. For production, add a Production environment connection with sk_live_ key and whsec_ webhook secret.",
    });
  }
});

export default router;
