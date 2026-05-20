import { integer, pgTable, primaryKey, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const userTrackProgressTable = pgTable(
  "user_track_progress",
  {
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    trackSlug: varchar("track_slug").notNull(),
    episodeId: integer("episode_id").notNull(),
    doneAt: timestamp("done_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.trackSlug, table.episodeId] })],
);
