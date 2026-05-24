import {
  pgTable,
  text,
  boolean,
  timestamp,
  jsonb,
  serial,
  index,
} from "drizzle-orm/pg-core";

/**
 * Permaculture Practitioner Registry
 * Local practitioners who can do land surveys and zone placements.
 */
export const practitionersTable = pgTable(
  "practitioners",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    location: text("location").notNull(),
    region: text("region"),
    bio: text("bio").notNull(),
    specialties: jsonb("specialties").$type<string[]>().notNull().default([]),
    doesLandSurveys: boolean("does_land_surveys").notNull().default(false),
    contactUrl: text("contact_url"),
    contactEmail: text("contact_email"),
    photoUrl: text("photo_url"),
    websiteUrl: text("website_url"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("practitioners_slug_idx").on(t.slug),
    index("practitioners_active_idx").on(t.active),
    index("practitioners_surveys_idx").on(t.doesLandSurveys),
  ],
);

export type PractitionerRow = typeof practitionersTable.$inferSelect;
export type InsertPractitionerRow = typeof practitionersTable.$inferInsert;
