import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { contentItemsTable } from "./content";

export const firesideFlamesTable = pgTable(
  "fireside_flames",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    authorName: text("author_name"),
    episodeId: integer("episode_id").references(() => contentItemsTable.id, {
      onDelete: "set null",
    }),
    fanCount: integer("fan_count").notNull().default(0),
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("fireside_flames_created_at_idx").on(t.createdAt),
    index("fireside_flames_fan_count_idx").on(t.fanCount),
    index("fireside_flames_is_deleted_idx").on(t.isDeleted),
  ],
);

export const firesideFlameFansTable = pgTable(
  "fireside_flame_fans",
  {
    id: serial("id").primaryKey(),
    flameId: integer("flame_id")
      .notNull()
      .references(() => firesideFlamesTable.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("fireside_flame_fans_flame_session_idx").on(
      t.flameId,
      t.sessionId,
    ),
    index("fireside_flame_fans_flame_id_idx").on(t.flameId),
  ],
);

export type FiresideFlame = typeof firesideFlamesTable.$inferSelect;
export type InsertFiresideFlame = typeof firesideFlamesTable.$inferInsert;
export type FiresideFlameFan = typeof firesideFlameFansTable.$inferSelect;
export type InsertFiresideFlameFan =
  typeof firesideFlameFansTable.$inferInsert;
