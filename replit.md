# The Survival Podcast — Fan Redesign

A modern, rugged fan redesign of thesurvivalpodcast.com built around a unified
"library" that indexes Jack Spirko's full public archive: podcast episodes,
written blog posts/Amazon reviews, and (when available) YouTube videos.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (RSS + library)
- `pnpm --filter @workspace/survival-podcast run dev` — web frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run db:push` — apply schema changes to Postgres (drizzle-kit push)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter, TanStack Query, Tailwind v4, shadcn/radix
- API: Express 5, fast-xml-parser
- DB: Postgres + Drizzle (`lib/db/`), JSONB for tags/categories, GIN + tsvector for FTS
- Validation: Zod (`zod/v4`)
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contracts
- `lib/db/src/schema/content.ts` — unified `content_items` (audio | article | video) + `sync_runs`
- `artifacts/api-server/src/lib/rss.ts` — RSS fetch + 5-min in-memory cache
- `artifacts/api-server/src/lib/sources/wordpress.ts` — WP REST paginator, per-page upsert with retry, skips 5xx pages
- `artifacts/api-server/src/lib/sources/youtube.ts` — YouTube Atom feed parser; degrades gracefully if RSS 404s
- `artifacts/api-server/src/lib/library.ts` — refresh orchestrator (6h throttle, runs on boot)
- `artifacts/api-server/src/routes/library.ts` — /library/search /stats /tags /items/:slug /refresh
- `artifacts/api-server/src/routes/episodes.ts` — feed / episodes / categories / stats endpoints
- `artifacts/survival-podcast/src/pages/library.tsx` + `library-item.tsx` — Library UI
- `attached_assets/tsp/` — downloaded TSP brand assets

## Architecture decisions

- **Two sources of truth**: the RSS feed (real-time, ~400 most recent episodes, used by /, /episodes, /episode/:slug) and the Postgres library (full archive: 6,018 items back to 2006, used by /library and /library/:slug). They coexist — the library is additive.
- **Per-page upsert** for WordPress sync: Jack's WP server intermittently 500s on deep pages (e.g. 113, 116). The fetcher upserts every page as it goes, retries 5xx with backoff, and skips pages it can't recover so partial progress is preserved. Up to 10 page failures tolerated per run.
- **YouTube graceful degradation**: per-channel RSS currently 404s for `UCFiM16ypErkTj6SNzhkmyxw`. The sync logs and records zero items rather than failing the whole refresh.
- **Full-text search** uses Postgres `to_tsvector('english', title || summary || body_text)` + `websearch_to_tsquery` with ts_rank for relevance sort.
- All hooks are codegen'd from the OpenAPI spec via Orval — never hand-write API types or hooks.

## Product

7 pages:
1. `/` — hero, stats, featured episodes, **Library CTA strip**, categories
2. `/episodes` — paginated archive of the last ~400 RSS episodes
3. `/episode/:slug` — RSS episode detail + custom audio player
4. `/categories` — all categories from RSS with counts
5. `/about` — about page with Jack's tip URL
6. `/library` — **the flagship**: search + filter (kind, tag, category) + sort across 6,000+ items
7. `/library/:slug` — unified detail for audio (custom player) / video (YouTube iframe) / article (prose body)

## User preferences

- Jack is all-in on Bitcoin and calls XRP a "shit coin" — keep XRPL out unless explicitly asked.

## Gotchas

- RSS has duplicate-cased categories ("friday flashbacks" vs "Friday Flashbacks"). Upstream data; surfaced as-is.
- WP REST taxonomy endpoints can also 500; the term-loader logs and skips bad pages.
- Library backfill runs on server boot in the background — fresh DBs show ~30s of partial state. The UI surfaces "Indexing the archive…" while < 100 items.
- After any OpenAPI change, re-run codegen before using updated types.
- Drizzle: use `inArray(col, arr)` not `sql\`${col} = ANY(${arr}::text[])\`` — the latter serializes the array as a comma-joined string.

## Pointers

- See the `pnpm-workspace` skill for workspace structure
- See the `database` skill for Postgres operations
