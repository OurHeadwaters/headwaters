import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const headwatersClientsTable = pgTable("headwaters_clients", {
  clientId: varchar("client_id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email"),
  connectedUserId: varchar("connected_user_id"),
  notes: text("notes"),
  primaryZone: varchar("primary_zone"),
  secondaryZone: varchar("secondary_zone"),
  riskProfile: integer("risk_profile"),
  lastDump: text("last_dump"),
  lastPushedAt: timestamp("last_pushed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type HeadwatersClient = typeof headwatersClientsTable.$inferSelect;
export type InsertHeadwatersClient = typeof headwatersClientsTable.$inferInsert;
