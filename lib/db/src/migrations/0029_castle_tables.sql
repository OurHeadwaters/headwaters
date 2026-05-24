CREATE TABLE IF NOT EXISTS "castle_sessions" (
	"session_id" varchar(128) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "castle_members" (
	"session_id" varchar(128) NOT NULL,
	"faction_id" varchar(16) NOT NULL,
	"ip_address" varchar(64),
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "castle_members_session_id_pk" PRIMARY KEY("session_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "castle_members_ip_address_uidx" ON "castle_members" (ip_address) WHERE ip_address IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "castle_members_faction_idx" ON "castle_members" ("faction_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "castle_lesson_progress" (
	"session_id" varchar(128) NOT NULL,
	"lesson_id" varchar(256) NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "castle_lesson_progress_session_id_lesson_id_pk" PRIMARY KEY("session_id","lesson_id")
);
