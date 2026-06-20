import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const fileMetadataTable = pgTable(
  "file_metadata",
  {
    id: serial("id").primaryKey(),
    fileKey: text("file_key").notNull().unique(),
    title: text("title"),
    description: text("description"),
    category: text("category"),
    tags: text("tags").array(),
    evidenceTier: integer("evidence_tier"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("file_metadata_file_key_idx").on(t.fileKey),
    index("file_metadata_category_idx").on(t.category),
  ],
);

export type FileMetadata = typeof fileMetadataTable.$inferSelect;
export type InsertFileMetadata = typeof fileMetadataTable.$inferInsert;
