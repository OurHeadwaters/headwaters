CREATE TABLE IF NOT EXISTS "content_items" (
        "id" serial PRIMARY KEY NOT NULL,
        "source" text NOT NULL,
        "source_id" text NOT NULL,
        "kind" text NOT NULL,
        "slug" text NOT NULL,
        "title" text NOT NULL,
        "link" text NOT NULL,
        "summary" text DEFAULT '' NOT NULL,
        "body_html" text DEFAULT '' NOT NULL,
        "body_text" text DEFAULT '' NOT NULL,
        "published_at" timestamp with time zone NOT NULL,
        "duration_seconds" integer,
        "audio_url" text,
        "audio_type" text,
        "video_url" text,
        "video_id" text,
        "artwork_url" text,
        "episode_number" integer,
        "categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
        "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
        "extra" jsonb DEFAULT '{}'::jsonb NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_runs" (
        "id" serial PRIMARY KEY NOT NULL,
        "source" text NOT NULL,
        "started_at" timestamp with time zone DEFAULT now() NOT NULL,
        "finished_at" timestamp with time zone,
        "status" text NOT NULL,
        "items_seen" integer DEFAULT 0 NOT NULL,
        "items_upserted" integer DEFAULT 0 NOT NULL,
        "error_message" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "content_items_source_source_id_idx" ON "content_items" USING btree ("source","source_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_items_published_at_idx" ON "content_items" USING btree ("published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_items_kind_idx" ON "content_items" USING btree ("kind");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_items_slug_idx" ON "content_items" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_items_episode_number_idx" ON "content_items" USING btree ("episode_number" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_items_categories_gin_idx" ON "content_items" USING gin ("categories");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_items_tags_gin_idx" ON "content_items" USING gin ("tags");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_items_search_idx" ON "content_items" USING gin (to_tsvector('english', "title" || ' ' || "summary" || ' ' || "body_text"));
