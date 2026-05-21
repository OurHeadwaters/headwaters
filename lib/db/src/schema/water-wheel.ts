import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const waterWheelStateTable = pgTable("water_wheel_state", {
  userId: varchar("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  bucket: varchar("bucket", { length: 100 }).notNull().default(""),
  lifetimeSweeps: integer("lifetime_sweeps").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
