import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const creatorSuggestionsTable = pgTable("creator_suggestions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  creatorName: text("creator_name").notNull(),
  websiteUrl: text("website_url").notNull(),
  rssFeedUrl: text("rss_feed_url"),
  socialLinks: text("social_links"),
  whyItFits: text("why_it_fits").notNull(),
  additionalNotes: text("additional_notes"),
  kitchenTableItemId: text("kitchen_table_item_id"),
  kitchenTableStatus: text("kitchen_table_status"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CreatorSuggestion = typeof creatorSuggestionsTable.$inferSelect;
export type InsertCreatorSuggestion = typeof creatorSuggestionsTable.$inferInsert;
