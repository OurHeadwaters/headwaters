import { pgTable, varchar, timestamp, index, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";

export const castleSessionsTable = pgTable("castle_sessions", {
  sessionId: varchar("session_id", { length: 128 }).primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const castleMembersTable = pgTable(
  "castle_members",
  {
    sessionId: varchar("session_id", { length: 128 }).notNull(),
    factionId: varchar("faction_id", { length: 16 }).notNull(),
    ipAddress: varchar("ip_address", { length: 64 }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.sessionId] }),
    index("castle_members_faction_idx").on(t.factionId),
    uniqueIndex("castle_members_ip_address_uidx").on(t.ipAddress),
  ],
);

export const castleLessonProgressTable = pgTable(
  "castle_lesson_progress",
  {
    sessionId: varchar("session_id", { length: 128 }).notNull(),
    lessonId: varchar("lesson_id", { length: 256 }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.lessonId] })],
);
