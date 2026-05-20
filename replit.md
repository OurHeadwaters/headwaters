# The Survival Podcast — Fan Redesign

A modern, rugged fan redesign of thesurvivalpodcast.com that pulls real episodes from Jack Spirko's public RSS feed.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (RSS proxy)
- `pnpm --filter @workspace/survival-podcast run dev` — run the web frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter, TanStack Query, Tailwind v4, shadcn/radix
- API: Express 5, fast-xml-parser for RSS parsing
- Validation: Zod (`zod/v4`)
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contracts
- `artifacts/api-server/src/lib/rss.ts` — RSS fetch + parse + in-memory cache (5 min TTL)
- `artifacts/api-server/src/routes/episodes.ts` — feed / episodes / categories / stats endpoints
- `artifacts/survival-podcast/src/` — React frontend
- `attached_assets/tsp/` — downloaded TSP brand assets (cover art, header)

## Architecture decisions

- No database. The TSP RSS feed (https://www.thesurvivalpodcast.com/feed/podcast) is the source of truth. The api-server fetches it, caches in memory for 5 minutes, and exposes pre-shaped JSON to the frontend so the browser never deals with raw XML or CORS.
- All hooks are codegen'd from the OpenAPI spec via Orval — never hand-write API types or hooks.
- Featured episodes / stats / categories are server-side aggregations over the cached feed.

## Product

A 5-page site over the real TSP archive: home (hero + stats + featured), browsable archive with search + category filter + pagination, episode detail page with a custom audio player playing the real MP3, all categories with counts, and an about page that surfaces Jack's tip URL from the feed.

## User preferences

- Jack is all-in on Bitcoin and calls XRP a "shit coin" — keep XRPL out unless explicitly asked.

## Gotchas

- The RSS feed has duplicate-cased categories ("friday flashbacks" vs "Friday Flashbacks", "lifestyle design" vs "lifestyle deisgn"). That's upstream data; we surface them as-is.
- After any OpenAPI change, re-run codegen before using updated types.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
