import { getStripeSync, getUncachableStripeClient } from "./stripeClient";
import { db, groundEventsTable, groundEventRsvpsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "./lib/logger";

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

    // First: let stripe-replit-sync handle all standard Stripe data sync
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    // Second: parse the event ourselves to handle custom business logic
    try {
      const stripe = await getUncachableStripeClient();
      const event = stripe.webhooks.constructEventAsync
        ? await stripe.webhooks.constructEventAsync(payload, signature, "")
        : stripe.webhooks.constructEvent(payload.toString(), signature, "");

      if (event.type === "checkout.session.completed") {
        await WebhookHandlers.handleCheckoutComplete(
          event.data.object as import("stripe").Stripe.Checkout.Session,
        );
      }
    } catch (err) {
      // Non-fatal: stripe-replit-sync already processed the event above.
      // Custom logic failure is logged but does not reject the webhook response.
      logger.warn(
        { err },
        "webhookHandlers: custom event handling failed (stripe-replit-sync sync succeeded)",
      );
    }
  }

  /**
   * On checkout.session.completed:
   * - Insert a paid RSVP row in ground_event_rsvps
   * - Increment rsvp_count atomically
   *
   * The Checkout session metadata must contain:
   *   { ground_event_id: "42" }
   */
  static async handleCheckoutComplete(
    session: import("stripe").Stripe.Checkout.Session,
  ): Promise<void> {
    const eventIdStr = session.metadata?.ground_event_id;
    if (!eventIdStr) return; // not a workshop checkout

    const eventId = parseInt(eventIdStr, 10);
    if (!Number.isFinite(eventId)) return;

    const attendeeEmail =
      session.customer_details?.email ?? session.customer_email ?? null;
    const attendeeName = session.customer_details?.name ?? null;
    const amountPaid = session.amount_total ?? 0;

    // Upsert: only create if there's no existing RSVP with this session ID
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

    await Promise.all([
      db.insert(groundEventRsvpsTable).values({
        eventId,
        attendeeEmail: attendeeEmail ?? "unknown@stripe",
        attendeeName: attendeeName ?? null,
        stripeCheckoutSessionId: session.id,
        paymentStatus: "paid",
        amountPaidCents: amountPaid,
      }),
      db
        .update(groundEventsTable)
        .set({ rsvpCount: sql`${groundEventsTable.rsvpCount} + 1` })
        .where(eq(groundEventsTable.id, eventId)),
    ]);

    logger.info(
      { eventId, attendeeEmail, amountPaid },
      "webhookHandlers: paid RSVP recorded via Stripe",
    );
  }
}
