import {
  pgTable,
  text,
  integer,
  timestamp,
  serial,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { expertCouncilTable } from "./expert-council";
import { usersTable } from "./auth";

/**
 * Transformation Path Cohorts — instructor-led cohort programs tied to a
 * transformation path. Created manually by the owner for MVP launch.
 *
 * status lifecycle:
 *   draft     → owner working on it, not yet visible
 *   approved  → visible on public /cohorts page, accepting enrollments
 *   active    → cohort has started (start_date passed)
 *   closed    → no more enrollments accepted
 */
export const cohortsTable = pgTable(
  "cohorts",
  {
    id: serial("id").primaryKey(),
    expertId: integer("expert_id")
      .notNull()
      .references(() => expertCouncilTable.id, { onDelete: "cascade" }),
    transformationSlug: text("transformation_slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    priceCents: integer("price_cents").notNull(),
    seats: integer("seats").notNull(),
    startDate: text("start_date").notNull(),
    status: text("status").notNull().default("draft"),
    stripePriceId: text("stripe_price_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("cohorts_status_idx").on(t.status),
    index("cohorts_transformation_idx").on(t.transformationSlug),
    index("cohorts_expert_idx").on(t.expertId),
  ],
);

export type CohortRow = typeof cohortsTable.$inferSelect;
export type InsertCohortRow = typeof cohortsTable.$inferInsert;

/**
 * Cohort Enrollments — one row per enrolled student per cohort.
 * Written by the Stripe checkout.session.completed webhook.
 * The (cohort_id, user_id) pair is unique so a student can't enroll twice.
 */
export const cohortEnrollmentsTable = pgTable(
  "cohort_enrollments",
  {
    id: serial("id").primaryKey(),
    cohortId: integer("cohort_id")
      .notNull()
      .references(() => cohortsTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    stripeCheckoutSessionId: text("stripe_checkout_session_id").notNull().unique(),
    amountPaidCents: integer("amount_paid_cents").notNull().default(0),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("cohort_enrollments_cohort_user_unique").on(t.cohortId, t.userId),
    index("cohort_enrollments_cohort_idx").on(t.cohortId),
    index("cohort_enrollments_user_idx").on(t.userId),
  ],
);

export type CohortEnrollmentRow = typeof cohortEnrollmentsTable.$inferSelect;
export type InsertCohortEnrollmentRow = typeof cohortEnrollmentsTable.$inferInsert;

/**
 * Cohort Waitlist — pre-launch email capture for the founding cohort.
 * Collected before Stripe / enrollment is live (Task #585).
 * email is unique per cohort slug so we never store duplicates.
 */
export const cohortWaitlistTable = pgTable(
  "cohort_waitlist",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    cohortSlug: text("cohort_slug").notNull().default("founding"),
    source: text("source").notNull().default("web"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("cohort_waitlist_email_cohort_unique").on(t.email, t.cohortSlug),
    index("cohort_waitlist_cohort_idx").on(t.cohortSlug),
    index("cohort_waitlist_created_idx").on(t.createdAt),
  ],
);

export type CohortWaitlistRow = typeof cohortWaitlistTable.$inferSelect;
export type InsertCohortWaitlistRow = typeof cohortWaitlistTable.$inferInsert;
