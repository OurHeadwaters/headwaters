CREATE TABLE "headwaters_business_data" (
        "key" varchar PRIMARY KEY NOT NULL,
        "value" text DEFAULT 'null' NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
