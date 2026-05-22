import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * One row per relay per ingestion run.
 * Lets the admin page show per-relay health at a glance.
 */
export const nostrIngestionLogTable = pgTable(
  "nostr_ingestion_log",
  {
    id: serial("id").primaryKey(),
    ranAt: timestamp("ran_at", { withTimezone: true }).notNull().defaultNow(),
    relay: text("relay").notNull(),
    status: text("status").notNull(),
    itemsFetched: integer("items_fetched").notNull().default(0),
    itemsInserted: integer("items_inserted").notNull().default(0),
    errorMessage: text("error_message"),
  },
  (t) => [
    index("nostr_ingestion_log_relay_idx").on(t.relay),
    index("nostr_ingestion_log_ran_at_idx").on(t.ranAt.desc()),
  ],
);

export type NostrIngestionLog = typeof nostrIngestionLogTable.$inferSelect;
export type InsertNostrIngestionLog =
  typeof nostrIngestionLogTable.$inferInsert;
