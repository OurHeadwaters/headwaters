import { getStripeSync } from "./stripeClient";
import { db, groundEventsTable, groundEventRsvpsTable, membershipsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "./lib/logger";
import type Stripe from "stripe";

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "STRIPE WEBHOOK ERROR: Payload must be a Buffer. " +
          "Received type: " +
          typeof payload +
          ". " +
          "This usually means express.json() parsed the body before reaching this handler. " +
          "FIX: Ensure webhook route is registered BEFORE app.use(express.json()).",
      );
    }

    // stripe-replit-sync validates the Stripe signature and handles all standard sync.
    // After this call, the payload has been cryptographically verified — safe to parse.
    const sync = await getStripeSync();
    const syncResult = await sync.processWebhook(payload, signature);

    // Parse the verified event from the raw payload buffer.
    // Signature verification was already performed above by stripe-replit-sync,
    // so a plain JSON.parse here is safe and does not bypass security.
    let event: Stripe.Event | null = null;
    try {
      // If the sync library returns the event object, use it directly.
      // Otherwise fall back to parsing the raw payload (already verified above).
      if (syncResult && typeof syncResult === "object" && "type" in syncResult) {
        event = syncResult as Stripe.Event;
      } else {
        event = JSON.parse(payload.toString()) as Stripe.Event;
      }
    } catch (parseErr) {
      logger.warn({ parseErr }, "webhookHandlers: failed to parse webhook payload — skipping custom logic");
      return;
    }

    if (event.type === "checkout.session.completed") {
      // Re-throw on failure: Stripe will retry the webhook, and our session-id unique
      // constraint makes handleCheckoutComplete idempotent against those retries.
      await WebhookHandlers.handleCheckoutComplete(
        event.data.object as Stripe.Checkout.Session,
      );
    }

    // ── Brigade subscription lifecycle ──────────────────────────────────────
    if (event.type === "customer.subscription.updated") {
      await WebhookHandlers.handleSubscriptionUpdated(
        event.data.object as Stripe.Subscription,
      );
    }

    if (event.type === "customer.subscription.deleted") {
      await WebhookHandlers.handleSubscriptionDeleted(
        event.data.object as Stripe.Subscription,
      );
    }
  }

  /**
   * On checkout.session.completed:
   * - Insert a paid RSVP row in ground_event_rsvps (for workshop checkouts)
   * - Increment rsvp_count atomically
   * - Activate Brigade membership (for brigade subscription checkouts)
   *
   * Idempotent: safe to call multiple times for the same session_id.
   */
  static async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    // ── Workshop checkout ────────────────────────────────────────────────────
    const eventIdStr = session.metadata?.ground_event_id;
    if (eventIdStr) {
      const eventId = parseInt(eventIdStr, 10);
      if (!Number.isFinite(eventId)) return;

      const attendeeEmail =
        session.customer_details?.email ?? session.customer_email ?? null;
      const attendeeName = session.customer_details?.name ?? null;
      const amountPaid = session.amount_total ?? 0;

      // Idempotency: skip if we already recorded an RSVP for this session
      const existing = await db
        .select({ id: groundEventRsvpsTable.id })
        .from(groundEventRsvpsTable)
        .where(eq(groundEventRsvpsTable.stripeCheckoutSessionId, session.id))
        .limit(1);

      if (existing.length > 0) {
        logger.info(
          { sessionId: session.id },
          "webhookHandlers: RSVP already recorded for this session (idempotent skip)",
        );
        return;
      }

      await db.transaction(async (tx) => {
        await tx.insert(groundEventRsvpsTable).values({
          eventId,
          attendeeEmail: attendeeEmail ?? "unknown@stripe",
          attendeeName: attendeeName ?? null,
          stripeCheckoutSessionId: session.id,
          paymentStatus: "paid",
          amountPaidCents: amountPaid,
        });
        await tx
          .update(groundEventsTable)
          .set({ rsvpCount: sql`${groundEventsTable.rsvpCount} + 1` })
          .where(eq(groundEventsTable.id, eventId));
      });

      logger.info(
        { eventId, attendeeEmail, amountPaid },
        "webhookHandlers: paid RSVP recorded via Stripe",
      );
      return;
    }

    // ── Brigade subscription checkout ────────────────────────────────────────
    const brigadeUserId = session.metadata?.brigade_user_id;
    const brigadePlan = session.metadata?.brigade_plan;

    if (brigadeUserId && brigadePlan && session.subscription) {
      await WebhookHandlers.handleBrigadeCheckoutComplete(
        session,
        brigadeUserId,
        brigadePlan,
      );
    }
  }

  /**
   * Activates a Brigade membership after a successful Checkout session.
   * Idempotent via stripe_subscription_id unique constraint.
   */
  static async handleBrigadeCheckoutComplete(
    session: Stripe.Checkout.Session,
    userId: string,
    plan: string,
  ): Promise<void> {
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;

    if (!subscriptionId || !customerId) {
      logger.warn(
        { sessionId: session.id },
        "webhookHandlers: brigade checkout missing subscription or customer id — skipping",
      );
      return;
    }

    // Retrieve the subscription to get current_period_end
    let periodEnd: Date;
    try {
      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      periodEnd = new Date(sub.current_period_end * 1000);
    } catch (err) {
      logger.warn(
        { err, subscriptionId },
        "webhookHandlers: failed to retrieve subscription — using 30d fallback",
      );
      periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    // Upsert: insert new row or update existing (handles idempotent retries
    // and the case where a user re-subscribes after cancelling).
    await db
      .insert(membershipsTable)
      .values({
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status: "active",
        plan: plan === "monthly" || plan === "annual" ? plan : "monthly",
        currentPeriodEnd: periodEnd,
      })
      .onConflictDoUpdate({
        target: membershipsTable.stripeSubscriptionId,
        set: {
          status: "active",
          currentPeriodEnd: periodEnd,
          updatedAt: new Date(),
        },
      });

    logger.info(
      { userId, plan, subscriptionId, periodEnd },
      "webhookHandlers: Brigade membership activated",
    );
  }

  /**
   * Syncs Brigade membership status on subscription.updated events.
   * Handles renewals (extends period), plan changes, and past_due transitions.
   */
  static async handleSubscriptionUpdated(sub: Stripe.Subscription): Promise<void> {
    const userId = sub.metadata?.brigade_user_id;
    if (!userId) return; // not a Brigade subscription

    const status = sub.status === "active"
      ? "active"
      : sub.status === "past_due"
      ? "past_due"
      : sub.status === "canceled"
      ? "cancelled"
      : sub.status;

    const periodEnd = new Date(sub.current_period_end * 1000);

    const plan =
      sub.metadata?.brigade_plan === "monthly" || sub.metadata?.brigade_plan === "annual"
        ? sub.metadata.brigade_plan
        : undefined;

    await db
      .update(membershipsTable)
      .set({
        status,
        currentPeriodEnd: periodEnd,
        ...(plan ? { plan } : {}),
        updatedAt: new Date(),
      })
      .where(eq(membershipsTable.stripeSubscriptionId, sub.id));

    logger.info(
      { subscriptionId: sub.id, userId, status, periodEnd },
      "webhookHandlers: Brigade membership updated",
    );
  }

  /**
   * Marks Brigade membership as cancelled on subscription.deleted.
   */
  static async handleSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
    const userId = sub.metadata?.brigade_user_id;
    if (!userId) return; // not a Brigade subscription

    await db
      .update(membershipsTable)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(membershipsTable.stripeSubscriptionId, sub.id));

    logger.info(
      { subscriptionId: sub.id, userId },
      "webhookHandlers: Brigade membership cancelled",
    );
  }
}
