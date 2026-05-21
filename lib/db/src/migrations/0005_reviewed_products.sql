CREATE TABLE IF NOT EXISTS "reviewed_products" (
        "id" serial PRIMARY KEY NOT NULL,
        "wp_post_id" integer NOT NULL,
        "slug" text NOT NULL,
        "title" text NOT NULL,
        "description" text DEFAULT '' NOT NULL,
        "image_url" text,
        "external_url" text NOT NULL,
        "zone_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
        "category_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
        "is_visible" boolean DEFAULT true NOT NULL,
        "imported_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "reviewed_products_wp_post_id_unique" UNIQUE("wp_post_id"),
        CONSTRAINT "reviewed_products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviewed_products_wp_post_id_idx" ON "reviewed_products" USING btree ("wp_post_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviewed_products_slug_idx" ON "reviewed_products" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviewed_products_is_visible_idx" ON "reviewed_products" USING btree ("is_visible");
