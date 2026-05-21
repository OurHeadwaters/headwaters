CREATE TABLE IF NOT EXISTS "ground_events" (
"id" serial PRIMARY KEY NOT NULL,
"title" text NOT NULL,
"description" text NOT NULL,
"host_name" text NOT NULL,
"event_date" text NOT NULL,
"location" text NOT NULL,
"is_online" boolean DEFAULT false NOT NULL,
"price_display" text DEFAULT 'Free' NOT NULL,
"seats" integer,
"contact_email" text,
"is_approved" boolean DEFAULT false NOT NULL,
"is_featured" boolean DEFAULT false NOT NULL,
"is_rejected" boolean DEFAULT false NOT NULL,
"rsvp_count" integer DEFAULT 0 NOT NULL,
"created_at" timestamp with time zone DEFAULT now() NOT NULL,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ground_events_is_approved_idx" ON "ground_events" USING btree ("is_approved");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ground_events_is_featured_idx" ON "ground_events" USING btree ("is_featured");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ground_events_is_rejected_idx" ON "ground_events" USING btree ("is_rejected");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ground_events_event_date_idx" ON "ground_events" USING btree ("event_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ground_events_created_at_idx" ON "ground_events" USING btree ("created_at");
