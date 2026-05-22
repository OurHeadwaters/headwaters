CREATE TABLE "curated_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_type" text NOT NULL,
	"external_id" text NOT NULL,
	"raw_content" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "curated_items_source_type_external_id_udx" ON "curated_items" USING btree ("source_type","external_id");--> statement-breakpoint
CREATE INDEX "curated_items_source_type_idx" ON "curated_items" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "curated_items_created_at_idx" ON "curated_items" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "curated_items_tags_gin_idx" ON "curated_items" USING gin ("tags");