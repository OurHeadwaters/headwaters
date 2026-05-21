CREATE TABLE "wisdom_scrape_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"source_name" text NOT NULL,
	"source_type" text NOT NULL,
	"source_url" text NOT NULL,
	"x_handle" text,
	"last_scraped_at" timestamp with time zone DEFAULT now() NOT NULL,
	"gem_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'ok' NOT NULL,
	"error_msg" text
);
--> statement-breakpoint
CREATE TABLE "ground_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"host_name" text NOT NULL,
	"event_date" text NOT NULL,
	"location" text NOT NULL,
	"is_online" boolean DEFAULT false NOT NULL,
	"price_display" text DEFAULT 'Free' NOT NULL,
	"external_url" text,
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
CREATE TABLE "ground_event_rsvps" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"attendee_email" text NOT NULL,
	"attendee_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wisdom_gems" ALTER COLUMN "episode_slug" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "wisdom_gems" ADD COLUMN "source" text DEFAULT 'episode' NOT NULL;--> statement-breakpoint
ALTER TABLE "wisdom_gems" ADD COLUMN "attribution" text;--> statement-breakpoint
ALTER TABLE "wisdom_gems" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "ground_event_rsvps" ADD CONSTRAINT "ground_event_rsvps_event_id_ground_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."ground_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wisdom_scrape_log_source_id_idx" ON "wisdom_scrape_log" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "wisdom_scrape_log_source_type_idx" ON "wisdom_scrape_log" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "ground_events_is_approved_idx" ON "ground_events" USING btree ("is_approved");--> statement-breakpoint
CREATE INDEX "ground_events_is_featured_idx" ON "ground_events" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "ground_events_is_rejected_idx" ON "ground_events" USING btree ("is_rejected");--> statement-breakpoint
CREATE INDEX "ground_events_event_date_idx" ON "ground_events" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "ground_events_created_at_idx" ON "ground_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ground_event_rsvps_event_id_idx" ON "ground_event_rsvps" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "ground_event_rsvps_created_at_idx" ON "ground_event_rsvps" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "wisdom_gems_source_idx" ON "wisdom_gems" USING btree ("source");