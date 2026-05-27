CREATE TABLE IF NOT EXISTS "stomping_path_handles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"handle" varchar(100) NOT NULL UNIQUE,
	"assigned" integer NOT NULL DEFAULT 0,
	"created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "stomping_path_pool_entries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"water_name_handle" varchar(100) NOT NULL,
	"teachers" text[] NOT NULL DEFAULT ARRAY[]::text[],
	"session_token" varchar(128) NOT NULL UNIQUE,
	"opted_in_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "stomping_path_compass_entries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"session_token" varchar(128) NOT NULL,
	"teacher_name" varchar(255) NOT NULL,
	"source_type" varchar(50),
	"created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "stomping_path_captures" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"session_token" varchar(128) NOT NULL,
	"text_content" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "stomping_path_creator_shares" (
	"share_id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
	"creator_name" varchar(255) NOT NULL,
	"teachers" text[] NOT NULL DEFAULT ARRAY[]::text[],
	"overlap_json" text NOT NULL DEFAULT '[]',
	"pool_size" integer NOT NULL DEFAULT 0,
	"created_at" timestamp with time zone NOT NULL DEFAULT now()
);
