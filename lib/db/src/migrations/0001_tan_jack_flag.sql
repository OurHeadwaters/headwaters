-- Immutable wrapper functions required for the functional btree index below.
-- EXTRACT on timestamptz is only STABLE (session-timezone-dependent), so
-- Postgres refuses to index it directly. Wrapping in IMMUTABLE functions that
-- always interpret the timestamp in UTC makes functional indexing possible.
CREATE OR REPLACE FUNCTION extract_month_utc(timestamptz)
  RETURNS int LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS
  $$ SELECT EXTRACT(MONTH FROM ($1 AT TIME ZONE 'UTC'))::int $$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION extract_day_utc(timestamptz)
  RETURNS int LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS
  $$ SELECT EXTRACT(DAY FROM ($1 AT TIME ZONE 'UTC'))::int $$;
--> statement-breakpoint
-- Composite functional index on (month, day) extracted in UTC.
-- Turns the /api/episodes/this-day date-of-year lookup from a sequential scan
-- O(n) into an index scan O(log n) as the content_items archive grows.
CREATE INDEX IF NOT EXISTS "content_items_month_day_idx" ON "content_items" USING btree (extract_month_utc("published_at"),extract_day_utc("published_at"));