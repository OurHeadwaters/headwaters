import {
  pgTable,
  serial,
  text,
  integer,
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
 * `amountUnits` is an integer count of "coins" tossed. The denomination
 * (XRP, BTC, stablecoin, etc.) is tracked separately in `currency` and will
 * be finalised after legal review. The minimum is 1 unit.
 *
 * `status` lifecycle:
 *   pending   — in today's pot, draw not yet run
 *   drawn     — this tip was selected as the day's winner
 *   not_drawn — the draw ran but this tip was not selected
 */
export const wishingWellTipsTable = pgTable(
  "wishing_well_tips",
  {
    id: serial("id").primaryKey(),
    amountUnits: integer("amount_units").notNull(),
    currency: text("currency").notNull().default("XRP"),
    wishText: text("wish_text").notNull(),
    listenerId: varchar("listener_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    listenerName: text("listener_name"),
    drawDate: text("draw_date").notNull(),
    episodeSlug: text("episode_slug"),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("wishing_well_tips_draw_date_idx").on(t.drawDate),
    index("wishing_well_tips_status_idx").on(t.status),
    index("wishing_well_tips_listener_id_idx").on(t.listenerId),
  ],
);

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
 *   pending — crypto payout not yet sent (awaiting integration)
 *   sent    — payout initiated via crypto processor
 */
export const wishingWellDistributionsTable = pgTable(
  "wishing_well_distributions",
  {
    id: serial("id").primaryKey(),
    drawDate: text("draw_date").notNull(),
    totalUnits: integer("total_units").notNull(),
    creatorShareUnits: integer("creator_share_units").notNull(),
    winnerShareUnits: integer("winner_share_units").notNull(),
    winnerTipId: integer("winner_tip_id").references(
      () => wishingWellTipsTable.id,
    ),
    winnerWishText: text("winner_wish_text"),
    winnerListenerName: text("winner_listener_name"),
    winnerListenerId: varchar("winner_listener_id"),
    winnerImpactNote: text("winner_impact_note"),
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
