CREATE TABLE "wisdom_nuggets" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"attribution" text DEFAULT 'Jack Spirko' NOT NULL,
	"source" text DEFAULT 'admin' NOT NULL,
	"track_slug" text,
	"track_position" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "wisdom_nuggets_track_slug_idx" ON "wisdom_nuggets" USING btree ("track_slug");--> statement-breakpoint
CREATE INDEX "wisdom_nuggets_created_at_idx" ON "wisdom_nuggets" USING btree ("created_at");