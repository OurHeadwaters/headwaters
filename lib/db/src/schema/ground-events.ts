import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * Ground Events — community workshops hosted at / associated with The Stomping Path.
 *
 * New submissions land with is_approved=false, is_rejected=false (pending queue).
 * Admin can: Approve (is_approved=true), Feature (is_approved+is_featured=true),
 *            Reject (is_rejected=true, is_approved=false), or Unfeature.
 * Public board only shows approved (and not rejected) events: featured first, then chronological.
 * Price is display-only text ("Free" or "$25") — no payment processing in MVP.
 */
export const groundEventsTable = pgTable(
  "ground_events",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    hostName: text("host_name").notNull(),
    eventDate: text("event_date").notNull(),
    location: text("location").notNull(),
    isOnline: boolean("is_online").notNull().default(false),
    priceDisplay: text("price_display").notNull().default("Free"),
    seats: integer("seats"),
    contactEmail: text("contact_email"),
    isApproved: boolean("is_approved").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    isRejected: boolean("is_rejected").notNull().default(false),
    rsvpCount: integer("rsvp_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ground_events_is_approved_idx").on(t.isApproved),
    index("ground_events_is_featured_idx").on(t.isFeatured),
    index("ground_events_is_rejected_idx").on(t.isRejected),
    index("ground_events_event_date_idx").on(t.eventDate),
    index("ground_events_created_at_idx").on(t.createdAt),
  ],
);

export type GroundEvent = typeof groundEventsTable.$inferSelect;
export type InsertGroundEvent = typeof groundEventsTable.$inferInsert;
