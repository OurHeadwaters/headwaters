import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  serial,
  index,
} from "drizzle-orm/pg-core";

/**
 * Expert Council members — experts and practitioners affiliated with TSP
 * who are tagged to one or more zones.
 */
export const expertCouncilTable = pgTable(
  "expert_council",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    role: text("role").notNull(),
    description: text("description").notNull(),
    url: text("url").notNull(),
    zones: jsonb("zones").$type<string[]>().notNull().default([]),
    podcastFeedUrl: text("podcast_feed_url"),
    rssSlug: text("rss_slug"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("expert_council_slug_idx").on(t.slug),
    index("expert_council_sort_idx").on(t.sortOrder),
  ],
);

export type ExpertCouncilRow = typeof expertCouncilTable.$inferSelect;
export type InsertExpertCouncilRow = typeof expertCouncilTable.$inferInsert;

/**
 * ULG (Unloose the Goose) affiliated businesses — community members and
 * sponsors whose products/services are relevant to one or more zones.
 */
export const ulgBusinessesTable = pgTable(
  "ulg_businesses",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    tagline: text("tagline").notNull(),
    description: text("description").notNull(),
    url: text("url").notNull(),
    zones: jsonb("zones").$type<string[]>().notNull().default([]),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ulg_businesses_slug_idx").on(t.slug),
    index("ulg_businesses_sort_idx").on(t.sortOrder),
  ],
);

export type UlgBusinessRow = typeof ulgBusinessesTable.$inferSelect;
export type InsertUlgBusinessRow = typeof ulgBusinessesTable.$inferInsert;
