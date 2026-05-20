# @workspace/db

Drizzle ORM schema, migrations, and database utilities for the TSP monorepo.

## Quick start

```bash
# Apply schema to an existing or fresh database
pnpm push

# Force-apply (skips interactive confirmation)
pnpm push-force

# Generate a new migration file from schema changes
pnpm generate

# Apply pending migrations (alternative to push)
pnpm migrate
```

## Custom PostgreSQL functions

Two IMMUTABLE helper functions are required by the schema and cannot be
expressed in Drizzle's schema DSL:

| Function | Returns | Purpose |
|---|---|---|
| `extract_month_utc(timestamptz)` | `int` | Month extracted in UTC (1–12) |
| `extract_day_utc(timestamptz)` | `int` | Day-of-month extracted in UTC (1–31) |

These functions make `EXTRACT` IMMUTABLE by locking evaluation to the `UTC`
timezone. Postgres requires IMMUTABLE expressions inside functional btree
indexes; the `content_items_month_day_idx` index (used by the "This Day in
History" query) depends on them.

### How they are managed

`scripts/setup-functions.mjs` creates both functions with `CREATE OR REPLACE
FUNCTION` before every `push` / `push-force` run. This means:

- **Fresh database** — run `pnpm push` and everything is set up in the right
  order with no manual steps.
- **Database reset** — run `pnpm push` again; functions are recreated first.
- **Migration path** — `pnpm migrate` replays `0001_tan_jack_flag.sql` which
  also contains the `CREATE OR REPLACE FUNCTION` statements, so the migration
  workflow is equally self-contained.

If you ever need to create the functions in isolation (e.g. after a hot-patch
to a production DB), run:

```bash
pnpm setup-functions
```
