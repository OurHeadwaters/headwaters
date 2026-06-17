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
 * Kit Purchases — one row per completed kit purchase.
 * Written by the Stripe checkout.session.completed webhook (direct-purchase kits)
 * or manually for any other fulfilment path.
 *
 * user_id is nullable so unregistered buyers (email-only) can also be recorded.
 * stripe_checkout_session_id is unique to guard against duplicate webhook delivery.
 *
 * lastVerifiedAt   — updated each time the buyer's access token is successfully
 *                    verified via GET /api/kits/:slug/access.  Used to detect
 *                    sessions that are about to expire from inactivity.
 * expiryReminderSentAt — stamped when an expiry-warning email is sent so we
 *                    don't send more than one reminder per session cycle.
 */
export const kitPurchasesTable = pgTable(
  "kit_purchases",
  {
    id: serial("id").primaryKey(),
    kitSlug: text("kit_slug").notNull(),
    userId: text("user_id"),
    buyerEmail: text("buyer_email").notNull(),
    buyerName: text("buyer_name"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
    amountPaidCents: integer("amount_paid_cents").notNull().default(0),
    purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull().defaultNow(),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    expiryReminderSentAt: timestamp("expiry_reminder_sent_at", { withTimezone: true }),
  },
  (t) => [
    index("kit_purchases_kit_slug_idx").on(t.kitSlug),
    index("kit_purchases_user_id_idx").on(t.userId),
    index("kit_purchases_buyer_email_idx").on(t.buyerEmail),
    index("kit_purchases_purchased_at_idx").on(t.purchasedAt),
    index("kit_purchases_last_verified_at_idx").on(t.lastVerifiedAt),
  ],
);

export type KitPurchaseRow = typeof kitPurchasesTable.$inferSelect;
export type InsertKitPurchaseRow = typeof kitPurchasesTable.$inferInsert;

/**
 * Kit Inquiries — form submissions for consultative kits (Practitioner, Council).
 * Triggers a follow-up email to Bobbie.
 */
export const kitInquiriesTable = pgTable(
  "kit_inquiries",
  {
    id: serial("id").primaryKey(),
    kitSlug: text("kit_slug").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    notes: text("notes"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("kit_inquiries_kit_slug_idx").on(t.kitSlug),
    index("kit_inquiries_submitted_at_idx").on(t.submittedAt),
  ],
);

export type KitInquiryRow = typeof kitInquiriesTable.$inferSelect;
export type InsertKitInquiryRow = typeof kitInquiriesTable.$inferInsert;
