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
CREATE INDEX "nostr_ingestion_log_relay_idx" ON "nostr_ingestion_log" USING btree ("relay");
--> statement-breakpoint
CREATE INDEX "nostr_ingestion_log_ran_at_idx" ON "nostr_ingestion_log" USING btree ("ran_at" DESC);
