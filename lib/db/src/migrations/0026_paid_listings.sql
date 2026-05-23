ALTER TABLE "expert_council" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;
--> statement-breakpoint
ALTER TABLE "expert_council" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text;
--> statement-breakpoint
ALTER TABLE "expert_council" ADD COLUMN IF NOT EXISTS "listing_status" text;
--> statement-breakpoint
ALTER TABLE "expert_council" ADD COLUMN IF NOT EXISTS "current_period_end" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "expert_council" ADD COLUMN IF NOT EXISTS "consult_url" text;
--> statement-breakpoint
ALTER TABLE "expert_council" ADD COLUMN IF NOT EXISTS "photo_url" text;
--> statement-breakpoint
ALTER TABLE "expert_council" ADD COLUMN IF NOT EXISTS "approved_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "expert_council" ADD COLUMN IF NOT EXISTS "contact_email" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "listing_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"bio" text NOT NULL,
	"website" text NOT NULL,
	"podcast_feed_url" text,
	"consult_url" text,
	"photo_url" text,
	"zones" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expert_slug" text,
	"checkout_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expert_council_listing_status_idx" ON "expert_council" USING btree ("listing_status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expert_council_stripe_sub_idx" ON "expert_council" USING btree ("stripe_subscription_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listing_apps_status_idx" ON "listing_applications" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listing_apps_email_idx" ON "listing_applications" USING btree ("email");
