import {
  pgTable,
  serial,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * Admin-authored wisdom nuggets.
 *
 * Short quotes or insights entered directly by the admin.
 * Nuggets optionally pin to a learning track at a position
 * (beginning / middle / end) and always appear in the Wisdom Dig pool.
 */
export const wisdomNuggetsTable = pgTable(
  "wisdom_nuggets",
  {
    id: serial("id").primaryKey(),
    text: text("text").notNull(),
    attribution: text("attribution").notNull().default("Jack Spirko"),
    source: text("source").notNull().default("admin"),
    trackSlug: text("track_slug"),
    trackPosition: text("track_position"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("wisdom_nuggets_track_slug_idx").on(t.trackSlug),
    index("wisdom_nuggets_created_at_idx").on(t.createdAt),
  ],
);

export type WisdomNugget = typeof wisdomNuggetsTable.$inferSelect;
export type InsertWisdomNugget = typeof wisdomNuggetsTable.$inferInsert;
