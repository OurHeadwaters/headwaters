import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

/**
 * Individual tips submitted to the Wishing Well pot.
 *
 * Each tip carries a wish message. At the end of each day one tip is drawn
 * at random, and the day's pot splits 50/50 between the platform and the
 * winning listener.
 *
 * `amountUnits` is an integer count of "coins" tossed:
 *   - For crypto (XRP): number of XRP coins
 *   - For fiat (Stripe): dollar amount ($1 = 1 unit, $2 = 2 units, $5 = 5 units)
 *
 * `paymentMethod`:
 *   crypto — XRP/crypto coin (legacy default)
 *   stripe — paid via Stripe Checkout (card)
 *
 * `status` lifecycle:
 *   payment_pending — Stripe checkout created, waiting for payment confirmation
 *   pending         — in today's pot, draw not yet run
 *   drawn           — this tip was selected as the day's winner
 *   not_drawn       — the draw ran but this tip was not selected
 */
export const wishingWellTipsTable = pgTable(
  "wishing_well_tips",
  {
    id: serial("id").primaryKey(),
    amountUnits: integer("amount_units").notNull(),
    currency: text("currency").notNull().default("XRP"),
    paymentMethod: text("payment_method").notNull().default("crypto"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    wishText: text("wish_text").notNull(),
    listenerId: varchar("listener_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    listenerName: text("listener_name"),
    drawDate: text("draw_date").notNull(),
    episodeSlug: text("episode_slug"),
    status: text("status").notNull().default("pending"),
    stackCount: integer("stack_count").notNull().default(0),
    founderMatchTriggered: boolean("founder_match_triggered").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("wishing_well_tips_draw_date_idx").on(t.drawDate),
    index("wishing_well_tips_status_idx").on(t.status),
    index("wishing_well_tips_listener_id_idx").on(t.listenerId),
    index("wishing_well_tips_stack_count_idx").on(t.stackCount),
    index("wishing_well_tips_payment_method_idx").on(t.paymentMethod),
    uniqueIndex("wishing_well_tips_stripe_session_idx").on(t.stripeCheckoutSessionId),
  ],
);

/**
 * Tracks who stacked onto a wish (to prevent duplicate stacking per session).
 * Anonymous stacking is allowed — tracked by sessionId (client-generated UUID).
 */
export const wishStacksTable = pgTable(
  "wish_stacks",
  {
    id: serial("id").primaryKey(),
    tipId: integer("tip_id")
      .notNull()
      .references(() => wishingWellTipsTable.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull(),
    listenerId: varchar("listener_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("wish_stacks_tip_id_idx").on(t.tipId),
    index("wish_stacks_session_id_idx").on(t.sessionId),
  ],
);

export type WishStack = typeof wishStacksTable.$inferSelect;
export type InsertWishStack = typeof wishStacksTable.$inferInsert;

export type WishingWellTip = typeof wishingWellTipsTable.$inferSelect;
export type InsertWishingWellTip = typeof wishingWellTipsTable.$inferInsert;

/**
 * One record per day once the draw has been run.
 *
 * Records the total pot, the 50/50 split, and which tip won.
 * Winners can later add an `impactNote` describing what they did with
 * their share — this shows on the public Wishing Well Board.
 *
 * `payoutStatus`:
 *   pending       — not yet processed
 *   sent          — crypto payout initiated via crypto processor
 *   credit_issued — fiat winner received a platform credit (wishing_well_credits)
 *
 * `winnerPaymentMethod`: mirrors the winning tip's paymentMethod, used to
 * decide whether to issue crypto or a platform credit to the winner.
 */
export const wishingWellDistributionsTable = pgTable(
  "wishing_well_distributions",
  {
    id: serial("id").primaryKey(),
    drawDate: text("draw_date").notNull(),
    totalUnits: integer("total_units").notNull(),
    totalUsdCents: integer("total_usd_cents").notNull().default(0),
    creatorShareUnits: integer("creator_share_units").notNull(),
    winnerShareUnits: integer("winner_share_units").notNull(),
    winnerShareUsdCents: integer("winner_share_usd_cents").notNull().default(0),
    winnerTipId: integer("winner_tip_id").references(
      () => wishingWellTipsTable.id,
    ),
    winnerWishText: text("winner_wish_text"),
    winnerListenerName: text("winner_listener_name"),
    winnerListenerId: varchar("winner_listener_id"),
    winnerImpactNote: text("winner_impact_note"),
    winnerPaymentMethod: text("winner_payment_method").notNull().default("crypto"),
    payoutStatus: text("payout_status").notNull().default("pending"),
    currency: text("currency").notNull().default("XRP"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("wishing_well_distributions_draw_date_idx").on(t.drawDate),
    index("wishing_well_distributions_payout_status_idx").on(t.payoutStatus),
  ],
);

export type WishingWellDistribution =
  typeof wishingWellDistributionsTable.$inferSelect;
export type InsertWishingWellDistribution =
  typeof wishingWellDistributionsTable.$inferInsert;

/**
 * Platform credits awarded to fiat Wishing Well winners instead of crypto.
 *
 * Credits can be redeemed against Brigade membership or cohort enrollment
 * at checkout. Each credit row represents a single award; `redeemedAt` is set
 * when the credit is consumed at checkout.
 *
 * `source`: how the credit was earned (e.g. 'wishing_well_win').
 */
export const wishingWellCreditsTable = pgTable(
  "wishing_well_credits",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    source: text("source").notNull().default("wishing_well_win"),
    distributionId: integer("distribution_id").references(
      () => wishingWellDistributionsTable.id,
      { onDelete: "set null" },
    ),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("wishing_well_credits_user_id_idx").on(t.userId),
    index("wishing_well_credits_redeemed_at_idx").on(t.redeemedAt),
  ],
);

export type WishingWellCredit = typeof wishingWellCreditsTable.$inferSelect;
export type InsertWishingWellCredit = typeof wishingWellCreditsTable.$inferInsert;
