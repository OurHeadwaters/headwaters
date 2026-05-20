/**
 * setup-functions.mjs
 *
 * Creates (or replaces) the PostgreSQL helper functions that the schema relies
 * on but that Drizzle's schema-push cannot express:
 *
 *   extract_month_utc(timestamptz) → int
 *   extract_day_utc(timestamptz)   → int
 *
 * These are IMMUTABLE wrappers around EXTRACT so that Postgres allows them
 * inside a functional btree index (content_items_month_day_idx). EXTRACT on
 * timestamptz is only STABLE because it depends on the session timezone;
 * locking evaluation to 'UTC' makes it IMMUTABLE.
 *
 * This script is run automatically before `drizzle-kit push` via the "push"
 * npm script, so the functions always exist before Drizzle tries to create the
 * functional index that references them. On a fresh database, or after a
 * database reset, re-running `pnpm push` is sufficient — no manual SQL steps
 * are needed.
 */

import pg from "pg";

const { Client } = pg;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("ERROR: DATABASE_URL is not set.");
  process.exit(1);
}

const client = new Client({ connectionString: url });
await client.connect();

try {
  await client.query(`
    CREATE OR REPLACE FUNCTION extract_month_utc(timestamptz)
      RETURNS int LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS
      $$ SELECT EXTRACT(MONTH FROM ($1 AT TIME ZONE 'UTC'))::int $$;
  `);

  await client.query(`
    CREATE OR REPLACE FUNCTION extract_day_utc(timestamptz)
      RETURNS int LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS
      $$ SELECT EXTRACT(DAY FROM ($1 AT TIME ZONE 'UTC'))::int $$;
  `);

  console.log("✓ extract_month_utc and extract_day_utc are ready.");
} finally {
  await client.end();
}
