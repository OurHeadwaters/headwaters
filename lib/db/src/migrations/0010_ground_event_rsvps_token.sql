ALTER TABLE "ground_event_rsvps" ADD COLUMN IF NOT EXISTS "token" text;
--> statement-breakpoint
ALTER TABLE "ground_event_rsvps" ALTER COLUMN "attendee_email" DROP NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ground_event_rsvps_event_token_uidx" ON "ground_event_rsvps" USING btree ("event_id","token") WHERE "token" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ground_event_rsvps_token_idx" ON "ground_event_rsvps" USING btree ("token");
