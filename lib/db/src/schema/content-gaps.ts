import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * Anonymous content gap submissions.
 *
 * When a visitor searches for a topic on the homepage and finds no (or few)
 * matching episodes, they can anonymously "float" that topic as a suggestion.
 * No user identity is stored — only the normalised query text and a timestamp.
 *
 * Admins can browse these via GET /api/admin/gaps and mark gaps as covered
 * with the `resolved` flag once Jack records an episode on the topic.
 */
export const contentGapSubmissionsTable = pgTable(
  "content_gap_submissions",
  {
    id: serial("id").primaryKey(),
    queryText: text("query_text").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolved: boolean("resolved").notNull().default(false),
  },
  (t) => [
    index("content_gap_submissions_query_text_idx").on(t.queryText),
    index("content_gap_submissions_submitted_at_idx").on(t.submittedAt),
    index("content_gap_submissions_resolved_idx").on(t.resolved),
  ],
);

export type ContentGapSubmission =
  typeof contentGapSubmissionsTable.$inferSelect;
export type InsertContentGapSubmission =
  typeof contentGapSubmissionsTable.$inferInsert;
