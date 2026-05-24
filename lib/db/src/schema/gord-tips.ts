import {
  pgTable,
  text,
  integer,
  timestamp,
  serial,
  index,
  unique,
} from "drizzle-orm/pg-core";

/**
 * Gord Tips — one row per completed Gord tip checkout session.
 * Written by the Stripe checkout.session.completed webhook when
 * session.metadata.source === "gord-tip".
 *
 * stripe_checkout_session_id is unique to guard against duplicate webhook delivery.
 */
export const gordTipsTable = pgTable(
  "gord_tips",
  {
    id: serial("id").primaryKey(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
    amountPaidCents: integer("amount_paid_cents").notNull().default(0),
    tipperEmail: text("tipper_email"),
    tipperName: text("tipper_name"),
    tippedAt: timestamp("tipped_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("gord_tips_tipped_at_idx").on(t.tippedAt),
  ],
);

export type GordTipRow = typeof gordTipsTable.$inferSelect;
export type InsertGordTipRow = typeof gordTipsTable.$inferInsert;
