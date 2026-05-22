import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Curated items ingested from two sources:
 *   - "nostr"  — kind-1 notes from Bobbie Parr's npub pulled from relay.damus.io / nos.lol
 *   - "audio"  — iPhone Voice Memo .m4a/.mp3 files transcribed via OpenAI Whisper
 *
 * Every row is auto-tagged with matching zone slugs and transformation slugs
 * by the field-note-classifier that runs after ingestion.
 */
export const curatedItemsTable = pgTable(
  "curated_items",
  {
    id: serial("id").primaryKey(),
    sourceType: text("source_type").notNull(),
    externalId: text("external_id").notNull(),
    rawContent: text("raw_content").notNull(),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    published: boolean("published").notNull().default(true),
    metaUrl: text("meta_url"),
    metaImageUrl: text("meta_image_url"),
    metaTitle: text("meta_title"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("curated_items_source_type_external_id_udx").on(
      t.sourceType,
      t.externalId,
    ),
    index("curated_items_source_type_idx").on(t.sourceType),
    index("curated_items_created_at_idx").on(t.createdAt.desc()),
    index("curated_items_tags_gin_idx").using("gin", t.tags),
  ],
);

export type CuratedItem = typeof curatedItemsTable.$inferSelect;
export type InsertCuratedItem = typeof curatedItemsTable.$inferInsert;
