CREATE TABLE "nostr_ingestion_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"ran_at" timestamp with time zone DEFAULT now() NOT NULL,
	"relay" text NOT NULL,
	"status" text NOT NULL,
	"items_fetched" integer DEFAULT 0 NOT NULL,
	"items_inserted" integer DEFAULT 0 NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "user_lifestyle_maps" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"entry_mode" varchar DEFAULT 'free' NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb,
	"primary_zone" varchar,
	"secondary_zone" varchar,
	"rationale" text,
	"visited_zones" jsonb DEFAULT '[]'::jsonb,
	"surrender_mode" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_lifestyle_maps" ADD CONSTRAINT "user_lifestyle_maps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "nostr_ingestion_log_relay_idx" ON "nostr_ingestion_log" USING btree ("relay");--> statement-breakpoint
CREATE INDEX "nostr_ingestion_log_ran_at_idx" ON "nostr_ingestion_log" USING btree ("ran_at" DESC NULLS LAST);