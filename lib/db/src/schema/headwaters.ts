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

export const headwatersBusinessDataTable = pgTable("headwaters_business_data", {
  key: varchar("key").primaryKey(),
  value: text("value").notNull().default("null"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type HeadwatersBusinessData = typeof headwatersBusinessDataTable.$inferSelect;

export const headwatersIntakeSubmissionsTable = pgTable("headwaters_intake_submissions", {
  submissionId: varchar("submission_id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  householdSize: integer("household_size"),
  landSituation: text("land_situation"),
  landYears: varchar("land_years"),
  keySkills: text("key_skills"),
  primaryGoals: text("primary_goals"),
  riskTolerance: varchar("risk_tolerance"),
  additionalNotes: text("additional_notes"),
  status: varchar("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type HeadwatersIntakeSubmission = typeof headwatersIntakeSubmissionsTable.$inferSelect;
export type InsertHeadwatersIntakeSubmission = typeof headwatersIntakeSubmissionsTable.$inferInsert;
