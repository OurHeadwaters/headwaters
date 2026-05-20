import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";

/**
 * Extracted gems of wisdom from TSP episodes.
 *
 * Each gem is a key phrase or soundbite pulled from an episode's show notes.
 * Gems are scored by heuristics (presence of principle/action language),
 * stored once, and served to the Wisdom Dig page.
 *
 * `anchorCount` — community "anchor" reactions (a favourite/save).
 * `featured` — manually promoted by admin.
 */
export const wisdomGemsTable = pgTable(
  "wisdom_gems",
  {
    id: serial("id").primaryKey(),
    episodeSlug: text("episode_slug").notNull(),
    episodeTitle: text("episode_title"),
    gemText: text("gem_text").notNull(),
    anchorCount: integer("anchor_count").notNull().default(0),
    featured: boolean("featured").notNull().default(false),
    extractedAt: timestamp("extracted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("wisdom_gems_episode_slug_idx").on(t.episodeSlug),
    index("wisdom_gems_anchor_count_idx").on(t.anchorCount),
    index("wisdom_gems_featured_idx").on(t.featured),
  ],
);

export type WisdomGem = typeof wisdomGemsTable.$inferSelect;
export type InsertWisdomGem = typeof wisdomGemsTable.$inferInsert;
