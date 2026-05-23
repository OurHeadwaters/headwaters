CREATE TABLE "headwaters_intake_submissions" (
        "submission_id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" varchar NOT NULL,
        "email" varchar NOT NULL,
        "household_size" integer,
        "land_situation" text,
        "land_years" varchar,
        "key_skills" text,
        "primary_goals" text,
        "risk_tolerance" varchar,
        "additional_notes" text,
        "status" varchar DEFAULT 'new' NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
