import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  index,
  serial,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Unified content_items table. Every public TSP artifact (podcast episode,
 * written article, YouTube video, future forum thread, etc.) lives here under
 * a single shape so the library UI can search across kinds.
 *
 * `kind` discriminates the union. `source` records where it came from
 * (rss_feed, wordpress, youtube, ...). `sourceId` is unique within source.
 */
export const contentItemsTable = pgTable(
  "content_items",
  {
    id: serial("id").primaryKey(),
    source: text("source").notNull(),
    sourceId: text("source_id").notNull(),
    kind: text("kind").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    link: text("link").notNull(),
    summary: text("summary").notNull().default(""),
    bodyHtml: text("body_html").notNull().default(""),
    bodyText: text("body_text").notNull().default(""),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    durationSeconds: integer("duration_seconds"),
    audioUrl: text("audio_url"),
    audioType: text("audio_type"),
    videoUrl: text("video_url"),
    videoId: text("video_id"),
    artworkUrl: text("artwork_url"),
    episodeNumber: integer("episode_number"),
    categories: jsonb("categories").$type<string[]>().notNull().default([]),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    extra: jsonb("extra").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("content_items_source_source_id_idx").on(t.source, t.sourceId),
    index("content_items_published_at_idx").on(t.publishedAt.desc()),
    index("content_items_kind_idx").on(t.kind),
    index("content_items_slug_idx").on(t.slug),
    index("content_items_episode_number_idx").on(t.episodeNumber.desc()),
    index("content_items_categories_gin_idx").using("gin", t.categories),
    index("content_items_tags_gin_idx").using("gin", t.tags),
    index("content_items_search_idx").using(
      "gin",
      sql`to_tsvector('english', ${t.title} || ' ' || ${t.summary} || ' ' || ${t.bodyText})`,
    ),
    index("content_items_month_day_idx").on(
      sql`extract_month_utc(${t.publishedAt})`,
      sql`extract_day_utc(${t.publishedAt})`,
    ),
  ],
);

export type ContentItem = typeof contentItemsTable.$inferSelect;
export type InsertContentItem = typeof contentItemsTable.$inferInsert;

/**
 * Tracks the most recent successful sync for each source so we can throttle
 * refreshes and surface sync status in the admin UI.
 */
export const syncRunsTable = pgTable("sync_runs", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: text("status").notNull(),
  itemsSeen: integer("items_seen").notNull().default(0),
  itemsUpserted: integer("items_upserted").notNull().default(0),
  errorMessage: text("error_message"),
});

export type SyncRun = typeof syncRunsTable.$inferSelect;

/**
 * Editor-managed category descriptions.
 * These take priority over auto-generated descriptions derived from episode summaries.
 * Seeded from the static category-descriptions.ts file on first run.
 */
export const categoryDescriptionsTable = pgTable("category_descriptions", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  uniqueIndex("category_descriptions_category_idx").on(t.category),
]);

export type CategoryDescription = typeof categoryDescriptionsTable.$inferSelect;
export type InsertCategoryDescription = typeof categoryDescriptionsTable.$inferInsert;
