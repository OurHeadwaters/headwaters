import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const stompingPathHandlesTable = pgTable("stomping_path_handles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  handle: varchar("handle", { length: 100 }).notNull().unique(),
  assigned: integer("assigned").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StompingPathHandle = typeof stompingPathHandlesTable.$inferSelect;

export const stompingPathPoolEntriesTable = pgTable("stomping_path_pool_entries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  waterNameHandle: varchar("water_name_handle", { length: 100 }).notNull(),
  teachers: text("teachers").array().notNull().default(sql`ARRAY[]::text[]`),
  sessionToken: varchar("session_token", { length: 128 }).notNull().unique(),
  optedInAt: timestamp("opted_in_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StompingPathPoolEntry = typeof stompingPathPoolEntriesTable.$inferSelect;

export const stompingPathCompassEntriesTable = pgTable("stomping_path_compass_entries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionToken: varchar("session_token", { length: 128 }).notNull(),
  teacherName: varchar("teacher_name", { length: 255 }).notNull(),
  sourceType: varchar("source_type", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StompingPathCompassEntry = typeof stompingPathCompassEntriesTable.$inferSelect;

export const stompingPathCapturesTable = pgTable("stomping_path_captures", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionToken: varchar("session_token", { length: 128 }).notNull(),
  textContent: text("text_content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StompingPathCapture = typeof stompingPathCapturesTable.$inferSelect;

export const stompingPathCreatorSharesTable = pgTable("stomping_path_creator_shares", {
  shareId: varchar("share_id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  creatorName: varchar("creator_name", { length: 255 }).notNull(),
  teachers: text("teachers").array().notNull().default(sql`ARRAY[]::text[]`),
  overlapJson: text("overlap_json").notNull().default("[]"),
  poolSize: integer("pool_size").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StompingPathCreatorShare = typeof stompingPathCreatorSharesTable.$inferSelect;
