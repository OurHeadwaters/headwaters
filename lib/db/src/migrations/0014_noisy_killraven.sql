DROP INDEX IF EXISTS "ground_event_rsvps_event_id_email_udx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ground_event_rsvps_event_id_email_idx" ON "ground_event_rsvps" USING btree ("event_id","attendee_email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ground_event_rsvps_free_email_udx" ON "ground_event_rsvps" USING btree ("event_id","attendee_email") WHERE payment_status = 'free';--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ground_event_rsvps_session_id_udx" ON "ground_event_rsvps" USING btree ("stripe_checkout_session_id") WHERE stripe_checkout_session_id IS NOT NULL;
