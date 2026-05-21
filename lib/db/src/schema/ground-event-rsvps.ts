import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { groundEventsTable } from "./ground-events";

/**
 * Individual RSVP records for ground events.
 * Each row represents one attendee expressing interest, with their email
 * so the host can coordinate and follow up.
 */
export const groundEventRsvpsTable = pgTable(
  "ground_event_rsvps",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => groundEventsTable.id, { onDelete: "cascade" }),
    attendeeEmail: text("attendee_email").notNull(),
    attendeeName: text("attendee_name"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ground_event_rsvps_event_id_idx").on(t.eventId),
    index("ground_event_rsvps_created_at_idx").on(t.createdAt),
  ],
);

export type GroundEventRsvp = typeof groundEventRsvpsTable.$inferSelect;
export type InsertGroundEventRsvp = typeof groundEventRsvpsTable.$inferInsert;
