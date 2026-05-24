CREATE TABLE IF NOT EXISTS "kit_purchases" (
        "id" serial PRIMARY KEY NOT NULL,
        "kit_slug" text NOT NULL,
        "user_id" text,
        "buyer_email" text NOT NULL,
        "buyer_name" text,
        "stripe_checkout_session_id" text UNIQUE,
        "amount_paid_cents" integer NOT NULL DEFAULT 0,
        "purchased_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kit_purchases_kit_slug_idx" ON "kit_purchases" ("kit_slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kit_purchases_user_id_idx" ON "kit_purchases" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kit_purchases_buyer_email_idx" ON "kit_purchases" ("buyer_email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kit_purchases_purchased_at_idx" ON "kit_purchases" ("purchased_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kit_inquiries" (
        "id" serial PRIMARY KEY NOT NULL,
        "kit_slug" text NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL,
        "notes" text,
        "submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kit_inquiries_kit_slug_idx" ON "kit_inquiries" ("kit_slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kit_inquiries_submitted_at_idx" ON "kit_inquiries" ("submitted_at");
