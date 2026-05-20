-- Add podcast feed ingestion columns to expert_council
-- Allows each council member to have their own podcast RSS feed URL and
-- an optional slug override for the content_items source key (council-{slug}).

ALTER TABLE "expert_council" ADD COLUMN IF NOT EXISTS "podcast_feed_url" text;
--> statement-breakpoint
ALTER TABLE "expert_council" ADD COLUMN IF NOT EXISTS "rss_slug" text;
