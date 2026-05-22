import { boolean, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const userLifestyleMapsTable = pgTable("user_lifestyle_maps", {
  userId: varchar("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  entryMode: varchar("entry_mode", { enum: ["guided", "free"] }).notNull().default("free"),
  answers: jsonb("answers").$type<Record<string, string>>().default({}),
  primaryZone: varchar("primary_zone"),
  secondaryZone: varchar("secondary_zone"),
  rationale: text("rationale"),
  visitedZones: jsonb("visited_zones").$type<string[]>().default([]),
  surrenderMode: boolean("surrender_mode").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type UserLifestyleMap = typeof userLifestyleMapsTable.$inferSelect;
export type InsertUserLifestyleMap = typeof userLifestyleMapsTable.$inferInsert;
