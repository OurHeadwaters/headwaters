ALTER TABLE "ground_event_rsvps" ALTER COLUMN "attendee_email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ground_events" ADD COLUMN "host_token" text;--> statement-breakpoint
ALTER TABLE "ground_events" ADD COLUMN "ticket_price_cents" integer;--> statement-breakpoint
ALTER TABLE "ground_events" ADD COLUMN "break_even_tickets" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ground_events" ADD COLUMN "platform_share_pct" smallint;--> statement-breakpoint
ALTER TABLE "ground_events" ADD COLUMN "stripe_connected_account_id" text;--> statement-breakpoint
ALTER TABLE "ground_events" ADD COLUMN "stripe_charges_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ground_event_rsvps" ADD COLUMN "stripe_checkout_session_id" text;--> statement-breakpoint
ALTER TABLE "ground_event_rsvps" ADD COLUMN "payment_status" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "ground_event_rsvps" ADD COLUMN "amount_paid_cents" integer;--> statement-breakpoint
ALTER TABLE "ground_event_rsvps" ADD COLUMN "token" text;--> statement-breakpoint
CREATE INDEX "ground_event_rsvps_session_id_idx" ON "ground_event_rsvps" USING btree ("stripe_checkout_session_id");--> statement-breakpoint
CREATE INDEX "ground_event_rsvps_token_idx" ON "ground_event_rsvps" USING btree ("token");--> statement-breakpoint
ALTER TABLE "ground_event_rsvps" ADD CONSTRAINT "ground_event_rsvps_event_token_uidx" UNIQUE("event_id","token");