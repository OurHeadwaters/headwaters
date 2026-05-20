# @workspace/db

Drizzle ORM schema, migrations, and database utilities for the TSP monorepo.

## Quick start

```bash
# Single entry-point for CI and production — always safe to run
pnpm db:setup

# Development: sync schema directly (no migration files generated)
pnpm push

# Development: force-apply (skips interactive confirmation)
pnpm push-force

# Generate a new migration file from schema changes, then apply
pnpm generate && pnpm db:setup

# Apply pending migrations standalone (also runs setup-functions first)
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
FUNCTION`. It is run automatically before **every** schema operation:

| Script | Runs setup-functions? | Drizzle command |
|---|---|---|
| `db:setup` | ✅ Yes | `drizzle-kit migrate` |
| `push` | ✅ Yes | `drizzle-kit push` |
| `push-force` | ✅ Yes | `drizzle-kit push --force` |
| `migrate` | ✅ Yes | `drizzle-kit migrate` |
| `generate` | — | `drizzle-kit generate` (no DB changes) |

This means:

- **Fresh database** — run `pnpm db:setup` (or `pnpm push` in dev) and
  everything is set up in the correct order with no manual steps.
- **Database reset** — run `pnpm db:setup` again; functions are recreated first.
- **CI / production** — `pnpm db:setup` is the single canonical entry-point;
  it is safe to run repeatedly.

If you ever need to create the functions in isolation (e.g. after a hot-patch
to a production DB), run:

```bash
pnpm setup-functions
```
