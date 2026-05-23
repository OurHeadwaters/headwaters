import { getStripeSync } from "./stripeClient";
import {
  db,
  groundEventsTable,
  groundEventRsvpsTable,
  membershipsTable,
  expertCouncilTable,
  cohortsTable,
  cohortEnrollmentsTable,
  wishingWellTipsTable,
} from "@workspace/db";
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

    // ── Expert listing subscription lifecycle ────────────────────────────────
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await WebhookHandlers.handleSubscriptionChange(
        event.data.object as Stripe.Subscription,
        event.type,
      );
    }
  }

  /**
   * On checkout.session.completed:
   * - For workshop checkouts: Insert a paid RSVP row and increment rsvp_count
   * - For Brigade subscription checkouts: Activate Brigade membership
   * - For listing checkouts: Link the Stripe customer to the expert record
   *   (listing goes active only after the subscription webhook fires)
   *
   * Idempotent: safe to call multiple times for the same session_id.
   */
  static async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    // ── Workshop checkout ────────────────────────────────────────────────────
    const groundEventIdStr = session.metadata?.ground_event_id;
    if (groundEventIdStr) {
      const eventId = parseInt(groundEventIdStr, 10);
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

    // ── Cohort enrollment checkout ───────────────────────────────────────────
    const cohortIdStr = session.metadata?.cohort_id;
    const cohortUserId = session.metadata?.user_id;
    if (cohortIdStr && cohortUserId) {
      await WebhookHandlers.handleCohortCheckoutComplete(session, cohortIdStr, cohortUserId);
      return;
    }

    // ── Wishing Well fiat checkout ───────────────────────────────────────────
    if (session.metadata?.wishing_well === "true") {
      await WebhookHandlers.handleWishingWellCheckoutComplete(session);
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

    // ── Expert listing checkout ──────────────────────────────────────────────
    const expertSlug = session.metadata?.expert_slug;
    if (expertSlug && session.customer) {
      // Store customer ID AND subscription ID so the subscription webhook
      // fallback (lookup by stripe_subscription_id) works immediately even
      // before the first customer.subscription.updated fires.
      const customerId = typeof session.customer === "string"
        ? session.customer
        : session.customer.id;
      const subscriptionId = typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id ?? null;

      await db
        .update(expertCouncilTable)
        .set({
          stripeCustomerId: customerId,
          ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
          updatedAt: new Date(),
        })
        .where(eq(expertCouncilTable.slug, expertSlug));

      logger.info(
        { expertSlug, customerId, subscriptionId },
        "webhookHandlers: expert listing checkout complete — customer + subscription linked",
      );
    }
  }

  /**
   * Records a cohort enrollment after a successful Checkout session.
   * Idempotent via stripe_checkout_session_id unique constraint.
   */
  static async handleCohortCheckoutComplete(
    session: Stripe.Checkout.Session,
    cohortIdStr: string,
    userId: string,
  ): Promise<void> {
    const cohortId = parseInt(cohortIdStr, 10);
    if (!Number.isFinite(cohortId)) {
      logger.warn({ cohortIdStr }, "webhookHandlers: invalid cohort_id in metadata — skipping");
      return;
    }

    const existing = await db
      .select({ id: cohortEnrollmentsTable.id })
      .from(cohortEnrollmentsTable)
      .where(eq(cohortEnrollmentsTable.stripeCheckoutSessionId, session.id))
      .limit(1);

    if (existing.length > 0) {
      logger.info(
        { sessionId: session.id },
        "webhookHandlers: cohort enrollment already recorded (idempotent skip)",
      );
      return;
    }

    const amountPaid = session.amount_total ?? 0;

    await db.insert(cohortEnrollmentsTable).values({
      cohortId,
      userId,
      stripeCheckoutSessionId: session.id,
      amountPaidCents: amountPaid,
    });

    logger.info(
      { cohortId, userId, amountPaid },
      "webhookHandlers: cohort enrollment recorded via Stripe",
    );
  }

  /**
   * Inserts a fiat tip into wishing_well_tips once a Stripe checkout is confirmed.
   * Idempotent via unique constraint on stripe_checkout_session_id.
   */
  static async handleWishingWellCheckoutComplete(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const { metadata } = session;
    if (!metadata) return;

    const wishText = metadata.wish_text ?? "";
    const listenerName = metadata.listener_name ?? "Anonymous";
    const listenerId = metadata.listener_id || null;
    const amountUnits = parseInt(metadata.amount_units ?? "1", 10);
    const drawDate = metadata.draw_date ?? new Date().toISOString().slice(0, 10);

    if (!wishText || amountUnits < 1) {
      logger.warn(
        { sessionId: session.id },
        "webhookHandlers: wishing-well webhook missing required metadata — skipping",
      );
      return;
    }

    const [tip] = await db
      .insert(wishingWellTipsTable)
      .values({
        amountUnits,
        currency: "USD",
        paymentMethod: "stripe",
        stripeCheckoutSessionId: session.id,
        wishText,
        listenerId,
        listenerName,
        drawDate,
        status: "pending",
      })
      .onConflictDoNothing()
      .returning();

    if (tip) {
      logger.info(
        { tipId: tip.id, sessionId: session.id, amountUnits, drawDate },
        "webhookHandlers: wishing-well fiat tip inserted",
      );
    } else {
      logger.info(
        { sessionId: session.id },
        "webhookHandlers: wishing-well duplicate webhook, skipped",
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

  /**
   * On customer.subscription.created / updated / deleted:
   * Sync listing_status and current_period_end on the expert_council row.
   *
   * Only acts on subscriptions with expert_slug in metadata; Brigade
   * subscriptions (brigade_user_id metadata) are handled separately above.
   *
   * Falls back to looking up by stripe_subscription_id, then stripe_customer_id.
   */
  static async handleSubscriptionChange(
    subscription: Stripe.Subscription,
    eventType: string,
  ): Promise<void> {
    const expertSlug = subscription.metadata?.expert_slug;

    const isActive =
      eventType !== "customer.subscription.deleted" &&
      (subscription.status === "active" || subscription.status === "trialing");

    const newStatus: "active" | "lapsed" = isActive ? "active" : "lapsed";
    // In Stripe SDK v22, current_period_end is on subscription items, not
    // the top-level subscription object.
    const itemPeriodEnd = subscription.items?.data[0]?.current_period_end;
    const periodEnd = itemPeriodEnd ? new Date(itemPeriodEnd * 1000) : null;

    if (expertSlug) {
      await db
        .update(expertCouncilTable)
        .set({
          listingStatus: newStatus,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          currentPeriodEnd: periodEnd,
          approvedAt: isActive ? new Date() : undefined,
          updatedAt: new Date(),
        })
        .where(eq(expertCouncilTable.slug, expertSlug));

      logger.info(
        { expertSlug, newStatus, subscriptionId: subscription.id },
        "webhookHandlers: expert listing status synced",
      );
      return;
    }

    const customerId = typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

    // Fallback 1: find by stripe_subscription_id (set at checkout.session.completed)
    let rows = await db
      .select({ slug: expertCouncilTable.slug })
      .from(expertCouncilTable)
      .where(eq(expertCouncilTable.stripeSubscriptionId, subscription.id))
      .limit(1);

    // Fallback 2: find by stripe_customer_id (set whenever checkout completes)
    if (rows.length === 0 && customerId) {
      rows = await db
        .select({ slug: expertCouncilTable.slug })
        .from(expertCouncilTable)
        .where(eq(expertCouncilTable.stripeCustomerId, customerId))
        .limit(1);
    }

    if (rows.length > 0) {
      await db
        .update(expertCouncilTable)
        .set({
          listingStatus: newStatus,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          currentPeriodEnd: periodEnd,
          approvedAt: isActive ? new Date() : undefined,
          updatedAt: new Date(),
        })
        .where(eq(expertCouncilTable.slug, rows[0].slug));

      logger.info(
        { slug: rows[0].slug, newStatus },
        "webhookHandlers: expert listing status synced (fallback lookup)",
      );
    } else {
      logger.warn(
        { subscriptionId: subscription.id, customerId },
        "webhookHandlers: no expert row found for subscription — skipping listing sync",
      );
    }
  }
}
