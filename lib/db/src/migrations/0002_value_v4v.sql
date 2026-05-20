-- Value-for-Value (V4V) tables for Lightning + XRPL tipping and creator splits

CREATE TABLE IF NOT EXISTS "creators" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "role" text NOT NULL DEFAULT 'host',
  "wallet_type" text NOT NULL,
  "wallet_address" text NOT NULL,
  "bio" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "episode_value_splits" (
  "id" serial PRIMARY KEY NOT NULL,
  "episode_slug" text NOT NULL,
  "creator_id" integer NOT NULL REFERENCES "creators"("id") ON DELETE CASCADE,
  "split_pct" real NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "default_value_splits" (
  "id" serial PRIMARY KEY NOT NULL,
  "creator_id" integer NOT NULL REFERENCES "creators"("id") ON DELETE CASCADE,
  "split_pct" real NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "creators_wallet_type_idx" ON "creators"("wallet_type");
CREATE INDEX IF NOT EXISTS "creators_name_idx" ON "creators"("name");
CREATE INDEX IF NOT EXISTS "episode_value_splits_slug_idx" ON "episode_value_splits"("episode_slug");
CREATE UNIQUE INDEX IF NOT EXISTS "episode_value_splits_slug_creator_idx" ON "episode_value_splits"("episode_slug", "creator_id");
CREATE UNIQUE INDEX IF NOT EXISTS "default_value_splits_creator_idx" ON "default_value_splits"("creator_id");

-- Seed Jack Spirko as default host creator
INSERT INTO "creators" ("name", "role", "wallet_type", "wallet_address", "bio")
VALUES (
  'Jack Spirko',
  'host',
  'lightning',
  'jack@spirko.me',
  'Host and founder of The Survival Podcast — the largest permaculture, prepping, and self-reliance podcast in the world.'
)
ON CONFLICT DO NOTHING;

-- Set Jack as 100% recipient in default splits (if creator was just inserted)
INSERT INTO "default_value_splits" ("creator_id", "split_pct")
SELECT id, 100.0 FROM "creators" WHERE "wallet_address" = 'jack@spirko.me'
ON CONFLICT DO NOTHING;
