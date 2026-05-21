import { Router, type IRouter } from "express";
import { db, groundEventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { getUncachableStripeClient } from "../stripeClient";

const router: IRouter = Router();

/**
 * Returns the base URL for this Replit deployment.
 * Used to build return/cancel/success URLs.
 */
function getBaseUrl(req: import("express").Request): string {
  const domain = (process.env.REPLIT_DOMAINS ?? "").split(",")[0];
  if (domain) return `https://${domain}`;
  return `${req.protocol}://${req.get("host") ?? "localhost"}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ground-events/:id/connect/start
//
// Creates a Stripe Express account for the host and returns the Stripe-hosted
// onboarding URL. The caller should redirect the host there.
// Idempotent: if stripe_connected_account_id is already set, a fresh
// account link is returned so the host can re-enter onboarding if needed.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/ground-events/:id/connect/start", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid event id" });
      return;
    }

    const [event] = await db
      .select()
      .from(groundEventsTable)
      .where(eq(groundEventsTable.id, id))
      .limit(1);

    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const baseUrl = getBaseUrl(req);
    const returnUrl = `${baseUrl}/stomping-grounds?tab=workshop&stripe_connect=success&eventId=${id}`;
    const refreshUrl = `${baseUrl}/stomping-grounds?tab=workshop&stripe_connect=refresh&eventId=${id}`;

    let accountId = event.stripeConnectedAccountId;

    // Create a new Express account if one doesn't exist yet
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        metadata: { ground_event_id: String(id) },
      });
      accountId = account.id;

      await db
        .update(groundEventsTable)
        .set({ stripeConnectedAccountId: accountId, updatedAt: new Date() })
        .where(eq(groundEventsTable.id, id));

      logger.info({ id, accountId }, "stripe-workshops: created Connect Express account");
    }

    // Create an onboarding link (valid for ~5 min)
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    res.json({ url: accountLink.url, accountId });
  } catch (err) {
    logger.error({ err }, "stripe-workshops: connect/start failed");
    res.status(500).json({ error: "Failed to start Stripe Connect onboarding" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ground-events/:id/connect/status
//
// Returns whether the host has completed Stripe Connect onboarding.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/ground-events/:id/connect/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid event id" });
      return;
    }

    const [event] = await db
      .select({
        stripeConnectedAccountId: groundEventsTable.stripeConnectedAccountId,
        ticketPriceCents: groundEventsTable.ticketPriceCents,
      })
      .from(groundEventsTable)
      .where(eq(groundEventsTable.id, id))
      .limit(1);

    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    if (!event.stripeConnectedAccountId) {
      res.json({ connected: false, chargesEnabled: false });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const account = await stripe.accounts.retrieve(event.stripeConnectedAccountId);

    res.json({
      connected: true,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
    });
  } catch (err) {
    logger.error({ err }, "stripe-workshops: connect/status failed");
    res.status(500).json({ error: "Failed to check Connect status" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ground-events/:id/checkout
//
// Creates a Stripe Checkout session for purchasing a ticket to a paid event.
// Calculates the platform application_fee_amount based on whether the
// current rsvp_count is above or below break_even_tickets:
//   - tickets ≤ break_even_tickets  → 0 % platform fee
//   - tickets > break_even_tickets  → platform_share_pct % of ticket price
// ─────────────────────────────────────────────────────────────────────────────
router.post("/ground-events/:id/checkout", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid event id" });
      return;
    }

    const [event] = await db
      .select()
      .from(groundEventsTable)
      .where(eq(groundEventsTable.id, id))
      .limit(1);

    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    if (!event.isApproved) {
      res.status(400).json({ error: "Event is not yet approved" });
      return;
    }
    if (!event.ticketPriceCents || event.ticketPriceCents <= 0) {
      res.status(400).json({ error: "This event is free — use the RSVP endpoint instead" });
      return;
    }
    if (!event.stripeConnectedAccountId) {
      res.status(400).json({
        error: "Host has not connected their Stripe account yet",
      });
      return;
    }

    // Check seating
    if (event.seats !== null && event.rsvpCount >= event.seats) {
      res.status(400).json({ error: "This event is sold out" });
      return;
    }

    // ── Surplus fee calculation ──────────────────────────────────────────────
    // If this ticket takes rsvp_count above break_even_tickets, it's a surplus
    // ticket and the platform takes its share.
    const isAboveBreakEven = event.rsvpCount >= event.breakEvenTickets;
    const platformSharePct = event.platformSharePct ?? 0;
    const applicationFeeAmount = isAboveBreakEven
      ? Math.round((event.ticketPriceCents * platformSharePct) / 100)
      : 0;

    const stripe = await getUncachableStripeClient();
    const baseUrl = getBaseUrl(req);

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: event.ticketPriceCents,
              product_data: {
                name: event.title,
                description: `${event.hostName} · ${event.eventDate}`,
              },
            },
            quantity: 1,
          },
        ],
        application_fee_amount: applicationFeeAmount,
        success_url: `${baseUrl}/stomping-grounds?tab=workshop&checkout=success&eventId=${id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/stomping-grounds?tab=workshop&checkout=cancelled&eventId=${id}`,
        metadata: {
          ground_event_id: String(id),
        },
      },
      {
        stripeAccount: event.stripeConnectedAccountId,
      },
    );

    logger.info(
      {
        id,
        sessionId: session.id,
        applicationFeeAmount,
        isAboveBreakEven,
      },
      "stripe-workshops: checkout session created",
    );

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    logger.error({ err }, "stripe-workshops: checkout failed");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

export default router;
