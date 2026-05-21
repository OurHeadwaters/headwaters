import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";

/**
 * Ground Events — community workshops hosted at / associated with The Stomping Path.
 *
 * Events have a title, description, host name, location, date, optional price,
 * and an RSVP count. Status: "upcoming" | "past" | "cancelled".
 */
export const groundEventsTable = pgTable(
  "ground_events",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    hostName: text("host_name").notNull(),
    location: text("location").notNull(),
    eventDate: text("event_date").notNull(),
    priceCents: integer("price_cents").notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    capacity: integer("capacity"),
    rsvpCount: integer("rsvp_count").notNull().default(0),
    status: text("status").notNull().default("upcoming"),
    tags: text("tags"),
    externalUrl: text("external_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ground_events_status_idx").on(t.status),
    index("ground_events_event_date_idx").on(t.eventDate),
    index("ground_events_created_at_idx").on(t.createdAt),
  ],
);

export type GroundEvent = typeof groundEventsTable.$inferSelect;
export type InsertGroundEvent = typeof groundEventsTable.$inferInsert;

/**
 * RSVP records for ground events.
 * One row per (eventId + sessionId) pair — anonymous-friendly.
 */
export const groundEventRsvpsTable = pgTable(
  "ground_event_rsvps",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id").notNull(),
    sessionId: text("session_id").notNull(),
    attendeeName: text("attendee_name"),
    attendeeEmail: text("attendee_email"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ground_event_rsvps_event_id_idx").on(t.eventId),
    index("ground_event_rsvps_session_idx").on(t.sessionId),
  ],
);

export type GroundEventRsvp = typeof groundEventRsvpsTable.$inferSelect;
export type InsertGroundEventRsvp = typeof groundEventRsvpsTable.$inferInsert;
