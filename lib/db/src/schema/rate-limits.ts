import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

/**
 * Persistent rate-limit windows.
 *
 * Each row represents one sliding window for one IP (or other key).
 * A single atomic UPSERT on every request keeps counters correct even
 * across server restarts and deploys.
 *
 * key      — rate-limit key (e.g. IP address + route namespace)
 * count    — requests made within the current window
 * reset_at — wall-clock time when the window expires and count resets
 */
export const rateLimitsTable = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(1),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

export type RateLimit = typeof rateLimitsTable.$inferSelect;
