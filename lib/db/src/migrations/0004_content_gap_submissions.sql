CREATE TABLE IF NOT EXISTS "content_gap_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"query_text" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_gap_submissions_query_text_idx" ON "content_gap_submissions" USING btree ("query_text");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_gap_submissions_submitted_at_idx" ON "content_gap_submissions" USING btree ("submitted_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_gap_submissions_resolved_idx" ON "content_gap_submissions" USING btree ("resolved");
