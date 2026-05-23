import { Router, type IRouter } from "express";
import { db, groundEventsTable, groundEventRsvpsTable } from "@workspace/db";
import { eq, and, isNotNull } from "drizzle-orm";
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

    // Host authentication: require the private host management token.
    // This prevents any caller from hijacking Stripe payouts for an arbitrary event.
    const hostToken =
      typeof req.body?.token === "string" ? req.body.token.trim() :
      typeof req.query.token === "string" ? req.query.token.trim() : "";

    if (!hostToken) {
      res.status(401).json({ error: "Missing host token — include your management token in the request body as { token }" });
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

    if (!event.hostToken || event.hostToken !== hostToken) {
      res.status(403).json({ error: "Invalid host token" });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const baseUrl = getBaseUrl(req);
    // Include the host token in return/refresh URLs so the host lands directly
    // on their personal dashboard after completing Stripe onboarding.
    const returnUrl = `${baseUrl}/workshops/dashboard?id=${id}&token=${encodeURIComponent(event.hostToken!)}&stripe_connect=success`;
    const refreshUrl = `${baseUrl}/workshops/dashboard?id=${id}&token=${encodeURIComponent(event.hostToken!)}&stripe_connect=refresh`;

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

    // Persist charges_enabled back to DB so the public isStripeReady field reflects reality.
    // This is updated on every status poll (host lands back from Stripe onboarding).
    await db
      .update(groundEventsTable)
      .set({ stripeChargesEnabled: account.charges_enabled, updatedAt: new Date() })
      .where(eq(groundEventsTable.id, id));

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

    // Build the checkout session with correct Stripe Connect routing:
    // - on_behalf_of: charges appear on the connected account's dashboard
    // - payment_intent_data.transfer_data.destination: funds go to the host
    // - payment_intent_data.application_fee_amount: platform's surplus share (0 pre-break-even)
    const sessionParams: import("stripe").Stripe.Checkout.SessionCreateParams = {
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
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: event.stripeConnectedAccountId,
        },
      },
      success_url: `${baseUrl}/stomping-grounds?tab=workshop&checkout=success&eventId=${id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/stomping-grounds?tab=workshop&checkout=cancelled&eventId=${id}`,
      metadata: {
        ground_event_id: String(id),
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ground-events/:id/payout-summary
//
// Returns real Stripe payout data for the host:
//   - eventRevenueCents:   sum of amountPaidCents from confirmed paid RSVPs
//                         (set by Stripe webhook from session.amount_total)
//   - platformFeeCents:   our cut (break-even surplus logic)
//   - hostPayoutCents:    eventRevenue - platformFee
//   - accountBalance:     live available + pending balance from Stripe API
//   - recentPayouts:      last 5 bank transfers (settled amounts) from Stripe API
//
// Requires the host management token for authentication.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/ground-events/:id/payout-summary", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid event id" });
      return;
    }

    const hostToken =
      typeof req.query.token === "string" ? req.query.token.trim() :
      typeof req.body?.token === "string" ? req.body.token.trim() : "";

    if (!hostToken) {
      res.status(401).json({ error: "Missing host token" });
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

    if (!event.hostToken || event.hostToken !== hostToken) {
      res.status(403).json({ error: "Invalid host token" });
      return;
    }

    // ── Per-event revenue from DB (populated by Stripe webhook) ─────────────
    // amountPaidCents was set directly from session.amount_total in the webhook,
    // making this authoritative Stripe-sourced data, not a local estimate.
    const paidRsvps = await db
      .select({
        amountPaidCents: groundEventRsvpsTable.amountPaidCents,
        stripeCheckoutSessionId: groundEventRsvpsTable.stripeCheckoutSessionId,
      })
      .from(groundEventRsvpsTable)
      .where(
        and(
          eq(groundEventRsvpsTable.eventId, id),
          eq(groundEventRsvpsTable.paymentStatus, "paid"),
          isNotNull(groundEventRsvpsTable.stripeCheckoutSessionId),
        ),
      );

    const eventRevenueCents = paidRsvps.reduce(
      (sum, r) => sum + (r.amountPaidCents ?? 0),
      0,
    );

    // Break-even surplus fee calculation (matches checkout endpoint logic)
    const ticketPriceCents = event.ticketPriceCents ?? 0;
    const breakEvenTickets = event.breakEvenTickets ?? 0;
    const platformSharePct = event.platformSharePct ?? 0;
    const surplusTickets = Math.max(0, paidRsvps.length - breakEvenTickets);
    const platformFeeCents = Math.round(
      (surplusTickets * ticketPriceCents * platformSharePct) / 100,
    );
    const hostPayoutCents = eventRevenueCents - platformFeeCents;

    // ── Live Stripe account data ─────────────────────────────────────────────
    const accountId = event.stripeConnectedAccountId;
    if (!accountId || !event.stripeChargesEnabled) {
      // Stripe Connect not yet set up — return DB-only revenue data
      res.json({
        eventRevenueCents,
        platformFeeCents,
        hostPayoutCents,
        paidTicketCount: paidRsvps.length,
        surplusTickets,
        stripeConnected: false,
        accountBalance: null,
        recentPayouts: [],
      });
      return;
    }

    const stripe = await getUncachableStripeClient();

    // Fetch account balance and recent payouts in parallel.
    // stripeAccount is a request option (second arg), not a params field.
    const [balance, payoutsList] = await Promise.all([
      stripe.balance.retrieve({}, { stripeAccount: accountId }),
      stripe.payouts.list({ limit: 5 }, { stripeAccount: accountId }),
    ]);

    const availableCents = balance.available.reduce(
      (sum, b) => (b.currency === "usd" ? sum + b.amount : sum),
      0,
    );
    const pendingCents = balance.pending.reduce(
      (sum, b) => (b.currency === "usd" ? sum + b.amount : sum),
      0,
    );

    const recentPayouts = payoutsList.data.map((p) => ({
      id: p.id,
      amountCents: p.amount,
      status: p.status,
      arrivalDate: p.arrival_date,
      description: p.description ?? null,
    }));

    logger.info(
      { id, accountId, eventRevenueCents, hostPayoutCents, availableCents },
      "stripe-workshops: payout-summary fetched",
    );

    res.json({
      eventRevenueCents,
      platformFeeCents,
      hostPayoutCents,
      paidTicketCount: paidRsvps.length,
      surplusTickets,
      stripeConnected: true,
      accountBalance: {
        availableCents,
        pendingCents,
      },
      recentPayouts,
    });
  } catch (err) {
    logger.error({ err }, "stripe-workshops: payout-summary failed");
    res.status(500).json({ error: "Failed to fetch payout summary" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ground-events/:id/connect/express-login
//
// Generates a one-time Stripe Express dashboard login link for the host so they
// can view their balance, payouts, and transaction history directly in Stripe.
// Requires the host management token for authentication.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/ground-events/:id/connect/express-login", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid event id" });
      return;
    }

    const hostToken =
      typeof req.body?.token === "string" ? req.body.token.trim() :
      typeof req.query.token === "string" ? req.query.token.trim() : "";

    if (!hostToken) {
      res.status(401).json({ error: "Missing host token" });
      return;
    }

    const [event] = await db
      .select({
        hostToken: groundEventsTable.hostToken,
        stripeConnectedAccountId: groundEventsTable.stripeConnectedAccountId,
        stripeChargesEnabled: groundEventsTable.stripeChargesEnabled,
      })
      .from(groundEventsTable)
      .where(eq(groundEventsTable.id, id))
      .limit(1);

    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    if (!event.hostToken || event.hostToken !== hostToken) {
      res.status(403).json({ error: "Invalid host token" });
      return;
    }

    if (!event.stripeConnectedAccountId) {
      res.status(400).json({ error: "Stripe Connect onboarding has not been started for this event" });
      return;
    }

    if (!event.stripeChargesEnabled) {
      res.status(400).json({ error: "Stripe Connect onboarding is not yet complete" });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const loginLink = await stripe.accounts.createLoginLink(event.stripeConnectedAccountId);

    logger.info({ id, accountId: event.stripeConnectedAccountId }, "stripe-workshops: express login link created");

    res.json({ url: loginLink.url });
  } catch (err) {
    logger.error({ err }, "stripe-workshops: express-login failed");
    res.status(500).json({ error: "Failed to create Stripe Express login link" });
  }
});

export default router;
