CREATE TABLE IF NOT EXISTS "cohort_waitlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"cohort_slug" text DEFAULT 'founding' NOT NULL,
	"source" text DEFAULT 'web' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cohort_waitlist_email_cohort_unique" UNIQUE("email","cohort_slug")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cohort_waitlist_cohort_idx" ON "cohort_waitlist" USING btree ("cohort_slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cohort_waitlist_created_idx" ON "cohort_waitlist" USING btree ("created_at");
