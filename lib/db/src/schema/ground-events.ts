import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  smallint,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * Ground Events — community workshops hosted at / associated with The Stomping Path.
 *
 * Moderation states:
 *   Pending:  is_approved=false, is_rejected=false
 *   Approved: is_approved=true
 *   Featured: is_approved=true, is_featured=true
 *   Rejected: is_rejected=true, is_approved=false
 *
 * Payment model (Stripe Connect):
 *   Free events: ticket_price_cents=null, platform_share_pct=null
 *   Paid events: ticket_price_cents > 0, break_even_tickets, platform_share_pct (5/10/15)
 *   Surplus fee: for every ticket sold above break_even_tickets,
 *                platform receives (ticket_price_cents * platform_share_pct / 100) cents.
 *   stripe_connected_account_id: set once host completes Stripe Express onboarding.
 *   Public checkout only available once stripe_connected_account_id is set.
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
    externalUrl: text("external_url"),
    seats: integer("seats"),
    contactEmail: text("contact_email"),
    isApproved: boolean("is_approved").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    isRejected: boolean("is_rejected").notNull().default(false),
    hostToken: text("host_token"),
    rsvpCount: integer("rsvp_count").notNull().default(0),
    // Stripe Connect payment fields
    ticketPriceCents: integer("ticket_price_cents"),
    breakEvenTickets: integer("break_even_tickets").notNull().default(0),
    platformSharePct: smallint("platform_share_pct"),
    stripeConnectedAccountId: text("stripe_connected_account_id"),
    stripeChargesEnabled: boolean("stripe_charges_enabled").notNull().default(false),
    transformationSlug: text("transformation_slug"),
    zoneSlug: text("zone_slug"),
    confirmationEmailSent: boolean("confirmation_email_sent").notNull().default(false),
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
