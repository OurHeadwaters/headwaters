import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  serial,
  index,
} from "drizzle-orm/pg-core";

/**
 * Expert Council members — experts and practitioners affiliated with TSP
 * who are tagged to one or more zones.
 */
export const expertCouncilTable = pgTable(
  "expert_council",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    role: text("role").notNull(),
    description: text("description").notNull(),
    url: text("url").notNull(),
    zones: jsonb("zones").$type<string[]>().notNull().default([]),
    crew: text("crew"),
    podcastFeedUrl: text("podcast_feed_url"),
    rssSlug: text("rss_slug"),
    sortOrder: integer("sort_order").notNull().default(0),

    // Paid listing fields
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    listingStatus: text("listing_status").$type<"pending" | "active" | "lapsed">(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    consultUrl: text("consult_url"),
    photoUrl: text("photo_url"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    contactEmail: text("contact_email"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("expert_council_slug_idx").on(t.slug),
    index("expert_council_sort_idx").on(t.sortOrder),
    index("expert_council_listing_status_idx").on(t.listingStatus),
    index("expert_council_stripe_sub_idx").on(t.stripeSubscriptionId),
  ],
);

export type ExpertCouncilRow = typeof expertCouncilTable.$inferSelect;
export type InsertExpertCouncilRow = typeof expertCouncilTable.$inferInsert;

/**
 * Listing applications — self-serve submissions from experts who want
 * a paid featured listing. Approved applications trigger a Stripe
 * Checkout session; the expert's council record is then linked.
 */
export const listingApplicationsTable = pgTable(
  "listing_applications",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    role: text("role").notNull(),
    bio: text("bio").notNull(),
    website: text("website").notNull(),
    podcastFeedUrl: text("podcast_feed_url"),
    consultUrl: text("consult_url"),
    photoUrl: text("photo_url"),
    zones: jsonb("zones").$type<string[]>().notNull().default([]),
    status: text("status").$type<"pending" | "approved" | "rejected">().notNull().default("pending"),

    // Set when admin approves: points to the expert_council record
    expertSlug: text("expert_slug"),

    // Stripe Checkout session URL sent to the expert after approval
    checkoutUrl: text("checkout_url"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("listing_apps_status_idx").on(t.status),
    index("listing_apps_email_idx").on(t.email),
  ],
);

export type ListingApplicationRow = typeof listingApplicationsTable.$inferSelect;
export type InsertListingApplicationRow = typeof listingApplicationsTable.$inferInsert;

/**
 * ULG (Unloose the Goose) affiliated businesses — community members and
 * sponsors whose products/services are relevant to one or more zones.
 */
export const ulgBusinessesTable = pgTable(
  "ulg_businesses",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    tagline: text("tagline").notNull(),
    description: text("description").notNull(),
    url: text("url").notNull(),
    zones: jsonb("zones").$type<string[]>().notNull().default([]),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ulg_businesses_slug_idx").on(t.slug),
    index("ulg_businesses_sort_idx").on(t.sortOrder),
  ],
);

export type UlgBusinessRow = typeof ulgBusinessesTable.$inferSelect;
export type InsertUlgBusinessRow = typeof ulgBusinessesTable.$inferInsert;
