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
 * Extracted gems of wisdom from TSP episodes and Expert Council sources.
 *
 * `source`      — 'episode' for show-notes extraction, 'website' or 'x' for
 *                 scraped content from council member sites / X posts.
 * `attribution` — member name for scraped gems (null for episode-sourced gems).
 * `sourceUrl`   — direct URL to the scraped page or post.
 * `anchorCount` — community "anchor" reactions (a favourite/save).
 * `featured`    — manually promoted by admin.
 */
export const wisdomGemsTable = pgTable(
  "wisdom_gems",
  {
    id: serial("id").primaryKey(),
    episodeSlug: text("episode_slug").notNull().default(""),
    episodeTitle: text("episode_title"),
    gemText: text("gem_text").notNull(),
    anchorCount: integer("anchor_count").notNull().default(0),
    featured: boolean("featured").notNull().default(false),
    source: text("source").notNull().default("episode"),
    attribution: text("attribution"),
    sourceUrl: text("source_url"),
    extractedAt: timestamp("extracted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("wisdom_gems_episode_slug_idx").on(t.episodeSlug),
    index("wisdom_gems_anchor_count_idx").on(t.anchorCount),
    index("wisdom_gems_featured_idx").on(t.featured),
    index("wisdom_gems_source_idx").on(t.source),
  ],
);

export type WisdomGem = typeof wisdomGemsTable.$inferSelect;
export type InsertWisdomGem = typeof wisdomGemsTable.$inferInsert;

/**
 * Scrape run log — one row per source per run.
 * Tracks when each council member's site / X account was last scraped
 * and how many gems were extracted.
 */
export const wisdomScrapeLogTable = pgTable(
  "wisdom_scrape_log",
  {
    id: serial("id").primaryKey(),
    sourceId: text("source_id").notNull(),
    sourceName: text("source_name").notNull(),
    sourceType: text("source_type").notNull(),
    sourceUrl: text("source_url").notNull(),
    xHandle: text("x_handle"),
    lastScrapedAt: timestamp("last_scraped_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    gemCount: integer("gem_count").notNull().default(0),
    status: text("status").notNull().default("ok"),
    errorMsg: text("error_msg"),
  },
  (t) => [
    index("wisdom_scrape_log_source_id_idx").on(t.sourceId),
    index("wisdom_scrape_log_source_type_idx").on(t.sourceType),
  ],
);

export type WisdomScrapeLog = typeof wisdomScrapeLogTable.$inferSelect;
export type InsertWisdomScrapeLog = typeof wisdomScrapeLogTable.$inferInsert;
