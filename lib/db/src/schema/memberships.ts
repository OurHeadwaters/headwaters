import { pgTable, serial, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

/**
 * Brigade Memberships — platform-billed Stripe Subscriptions.
 *
 * Lifecycle:
 *   active     — subscription is current and paid
 *   past_due   — payment failed; Stripe is retrying (dunning)
 *   cancelled  — member cancelled or subscription ended
 *
 * Populated by webhook events:
 *   checkout.session.completed      → insert row (active)
 *   customer.subscription.updated   → update status / current_period_end
 *   customer.subscription.deleted   → set status = 'cancelled'
 */
export const membershipsTable = pgTable(
  "memberships",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    stripeCustomerId: varchar("stripe_customer_id").notNull(),
    stripeSubscriptionId: varchar("stripe_subscription_id").notNull().unique(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    plan: varchar("plan", { length: 10 }).notNull(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_memberships_user_id").on(table.userId),
    index("idx_memberships_stripe_customer_id").on(table.stripeCustomerId),
    index("idx_memberships_status").on(table.status),
  ],
);

export type Membership = typeof membershipsTable.$inferSelect;
export type InsertMembership = typeof membershipsTable.$inferInsert;
