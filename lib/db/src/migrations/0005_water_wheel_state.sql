CREATE TABLE "wish_stacks" (
	"id" serial PRIMARY KEY NOT NULL,
	"tip_id" integer NOT NULL,
	"session_id" text NOT NULL,
	"listener_id" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wisdom_gems" (
	"id" serial PRIMARY KEY NOT NULL,
	"episode_slug" text NOT NULL,
	"episode_title" text,
	"gem_text" text NOT NULL,
	"anchor_count" integer DEFAULT 0 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"extracted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviewed_products" (
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
CREATE TABLE "water_wheel_state" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"bucket" varchar(100) DEFAULT '' NOT NULL,
	"lifetime_sweeps" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expert_council" ADD COLUMN "podcast_feed_url" text;--> statement-breakpoint
ALTER TABLE "expert_council" ADD COLUMN "rss_slug" text;--> statement-breakpoint
ALTER TABLE "wishing_well_tips" ADD COLUMN "stack_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "wishing_well_tips" ADD COLUMN "founder_match_triggered" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "wish_stacks" ADD CONSTRAINT "wish_stacks_tip_id_wishing_well_tips_id_fk" FOREIGN KEY ("tip_id") REFERENCES "public"."wishing_well_tips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "water_wheel_state" ADD CONSTRAINT "water_wheel_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wish_stacks_tip_id_idx" ON "wish_stacks" USING btree ("tip_id");--> statement-breakpoint
CREATE INDEX "wish_stacks_session_id_idx" ON "wish_stacks" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "wisdom_gems_episode_slug_idx" ON "wisdom_gems" USING btree ("episode_slug");--> statement-breakpoint
CREATE INDEX "wisdom_gems_anchor_count_idx" ON "wisdom_gems" USING btree ("anchor_count");--> statement-breakpoint
CREATE INDEX "wisdom_gems_featured_idx" ON "wisdom_gems" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "reviewed_products_wp_post_id_idx" ON "reviewed_products" USING btree ("wp_post_id");--> statement-breakpoint
CREATE INDEX "reviewed_products_slug_idx" ON "reviewed_products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "reviewed_products_is_visible_idx" ON "reviewed_products" USING btree ("is_visible");--> statement-breakpoint
CREATE INDEX "wishing_well_tips_stack_count_idx" ON "wishing_well_tips" USING btree ("stack_count");