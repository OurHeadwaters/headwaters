import { getStripeSync } from "./stripeClient";
import { db, groundEventsTable, groundEventRsvpsTable } from "@workspace/db";
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
  }

  /**
   * On checkout.session.completed:
   * - Insert a paid RSVP row in ground_event_rsvps
   * - Increment rsvp_count atomically
   *
   * The Checkout session metadata must contain:
   *   { ground_event_id: "42" }
   * Idempotent: safe to call multiple times for the same session_id.
   */
  static async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    const eventIdStr = session.metadata?.ground_event_id;
    if (!eventIdStr) return; // not a workshop checkout

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
  }
}
