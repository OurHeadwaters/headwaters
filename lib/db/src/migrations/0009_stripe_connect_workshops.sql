ALTER TABLE "ground_events" ADD COLUMN IF NOT EXISTS "ticket_price_cents" integer;
--> statement-breakpoint
ALTER TABLE "ground_events" ADD COLUMN IF NOT EXISTS "break_even_tickets" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "ground_events" ADD COLUMN IF NOT EXISTS "platform_share_pct" smallint;
--> statement-breakpoint
ALTER TABLE "ground_events" ADD COLUMN IF NOT EXISTS "stripe_connected_account_id" text;
--> statement-breakpoint
ALTER TABLE "ground_event_rsvps" ADD COLUMN IF NOT EXISTS "stripe_checkout_session_id" text;
--> statement-breakpoint
ALTER TABLE "ground_event_rsvps" ADD COLUMN IF NOT EXISTS "payment_status" text DEFAULT 'free' NOT NULL;
--> statement-breakpoint
ALTER TABLE "ground_event_rsvps" ADD COLUMN IF NOT EXISTS "amount_paid_cents" integer;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ground_event_rsvps_session_id_idx" ON "ground_event_rsvps" USING btree ("stripe_checkout_session_id");
