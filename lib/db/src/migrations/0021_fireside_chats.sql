CREATE TABLE "fireside_flames" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"author_name" text,
	"episode_id" integer,
	"fan_count" integer DEFAULT 0 NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fireside_flame_fans" (
	"id" serial PRIMARY KEY NOT NULL,
	"flame_id" integer NOT NULL,
	"session_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fireside_flames" ADD CONSTRAINT "fireside_flames_episode_id_content_items_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."content_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fireside_flame_fans" ADD CONSTRAINT "fireside_flame_fans_flame_id_fireside_flames_id_fk" FOREIGN KEY ("flame_id") REFERENCES "public"."fireside_flames"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fireside_flames_created_at_idx" ON "fireside_flames" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "fireside_flames_fan_count_idx" ON "fireside_flames" USING btree ("fan_count");--> statement-breakpoint
CREATE INDEX "fireside_flames_is_deleted_idx" ON "fireside_flames" USING btree ("is_deleted");--> statement-breakpoint
CREATE UNIQUE INDEX "fireside_flame_fans_flame_session_idx" ON "fireside_flame_fans" USING btree ("flame_id","session_id");--> statement-breakpoint
CREATE INDEX "fireside_flame_fans_flame_id_idx" ON "fireside_flame_fans" USING btree ("flame_id");
