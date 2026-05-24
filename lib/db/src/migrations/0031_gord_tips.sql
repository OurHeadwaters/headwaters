CREATE TABLE IF NOT EXISTS "gord_tips" (
        "id" serial PRIMARY KEY NOT NULL,
        "stripe_checkout_session_id" text UNIQUE,
        "amount_paid_cents" integer NOT NULL DEFAULT 0,
        "tipper_email" text,
        "tipper_name" text,
        "tipped_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gord_tips_tipped_at_idx" ON "gord_tips" ("tipped_at");
