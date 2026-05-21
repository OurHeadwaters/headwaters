import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { groundEventsTable } from "./ground-events";

/**
 * Individual RSVP records for ground events.
 * Covers both free RSVPs (payment_status = 'free') and
 * paid ticket purchases confirmed via Stripe (payment_status = 'paid').
 *
 * Token-based deduplication: a stable device/session token is stored; the unique
 * constraint on (event_id, token) prevents a single device from inflating rsvp_count
 * across reinstalls. PostgreSQL treats NULL as distinct in unique constraints, so
 * email-only RSVPs (token = NULL) are not blocked by the constraint.
 */
export const groundEventRsvpsTable = pgTable(
  "ground_event_rsvps",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => groundEventsTable.id, { onDelete: "cascade" }),
    attendeeEmail: text("attendee_email"),
    attendeeName: text("attendee_name"),
    /** Stripe Checkout Session ID — set for paid tickets, null for free RSVPs */
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    /** 'free' | 'paid' */
    paymentStatus: text("payment_status").notNull().default("free"),
    /** Amount charged in cents (0 or null for free events) */
    amountPaidCents: integer("amount_paid_cents"),
    /** Stable device/session token for idempotent RSVP deduplication */
    token: text("token"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("ground_event_rsvps_event_token_uidx").on(t.eventId, t.token),
    index("ground_event_rsvps_event_id_idx").on(t.eventId),
    index("ground_event_rsvps_session_id_idx").on(t.stripeCheckoutSessionId),
    index("ground_event_rsvps_created_at_idx").on(t.createdAt),
    index("ground_event_rsvps_token_idx").on(t.token),
  ],
);

export type GroundEventRsvp = typeof groundEventRsvpsTable.$inferSelect;
export type InsertGroundEventRsvp = typeof groundEventRsvpsTable.$inferInsert;
