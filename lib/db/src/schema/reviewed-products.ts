import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  serial,
  index,
  jsonb,
} from "drizzle-orm/pg-core";

export const reviewedProductsTable = pgTable(
  "reviewed_products",
  {
    id: serial("id").primaryKey(),
    wpPostId: integer("wp_post_id").notNull().unique(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url"),
    externalUrl: text("external_url").notNull(),
    zoneTags: jsonb("zone_tags").$type<string[]>().notNull().default([]),
    categoryTags: jsonb("category_tags").$type<string[]>().notNull().default([]),
    isVisible: boolean("is_visible").notNull().default(true),
    importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reviewed_products_wp_post_id_idx").on(t.wpPostId),
    index("reviewed_products_slug_idx").on(t.slug),
    index("reviewed_products_is_visible_idx").on(t.isVisible),
  ],
);

export type ReviewedProduct = typeof reviewedProductsTable.$inferSelect;
export type InsertReviewedProduct = typeof reviewedProductsTable.$inferInsert;
