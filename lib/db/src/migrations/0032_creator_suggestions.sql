CREATE TABLE IF NOT EXISTS "creator_suggestions" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" varchar NOT NULL,
        "creator_name" text NOT NULL,
        "website_url" text NOT NULL,
        "rss_feed_url" text,
        "social_links" text,
        "why_it_fits" text NOT NULL,
        "additional_notes" text,
        "kitchen_table_item_id" text,
        "kitchen_table_status" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "creator_suggestions" ADD CONSTRAINT "creator_suggestions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
