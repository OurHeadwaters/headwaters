# The Stomping Paths

## What this is today

The Stomping Paths is the flagship web app for **Zone 2 (Workbench — "The Worn Path")** of the Headwaters watershed. It's the public-facing home for The Survival Podcast (Jack Spirko) community: episode archive + full historical library, the Expert Council directory, the Kit system (self-reliance starter kits, $97 each, sold via Stripe/Bitcoin), cohorts/workshops, an AI guide ("Gord the Partridge"), and the on-ramp into Headwaters practitioner services.

It is not a separate product — it's the practitioner-facing storefront and community hub that the rest of the watershed (Headwaters intake, Codetry, Privacy Guide) links to and from.

## How it fits into the watershed

- **Zone 2 of 5** in the canonical Headwaters zone chain (0 Saltbox → 1 Kitchen Table → **2 Workbench** → 3 Greenhouse → 4 Clearing → 5 Edge). See root `replit.md` for the full chain and `HANDOFF.md` for the constitutional rules (Eave Rule, Three-Table Model) that govern what this app is and isn't allowed to connect.
- Content and commerce logic live in the shared API server (`artifacts/api-server`) and shared Postgres DB (`lib/db`) — this app is the frontend consumer.
- Two content sources feed it: TSP's live RSS feed (~400 recent episodes) and a full historical Postgres library (6,000+ items back to 2006). They coexist by design.
- Two Zone concepts exist and are **not the same thing** — don't conflate them:
  - The Headwaters watershed zones (0–5, Saltbox → Edge) — the whole-project framing in `replit.md`.
  - The TSP practitioner-journey zones (Z0=Self → Z5=Wild) used inside this app's own `src/lib/zones.ts` and `/zones` pages — a separate in-app taxonomy for episode/content classification.

## Current architecture

- **Stack:** React + Vite, `wouter` (routing), TanStack Query, Tailwind v4, shadcn/radix, Replit Auth. Framer Motion + GSAP for animation.
- **Entry points:**
  - `src/main.tsx` — app bootstrap
  - `src/App.tsx` — all routes (single source of truth for the route table — ~90 routes: public pages, admin pages, kit pages, council pages, castle/crypto tools, workshops, cohorts)
  - `src/components/layout.tsx` — shared nav/footer shell
- **Key folders:**
  - `src/pages/` — one file per route (public + `/admin/*` pages)
  - `src/components/` — shared UI (episode/library cards, audio player, Gord chat widget, Trailblazer chat, share modal, etc.)
  - `src/hooks/` — data-fetching hooks (kits, tracks, transformations, share counts, track progress, lifestyle maps)
  - `src/context/player-context.tsx` — global audio player state
  - `src/lib/` — zone definitions, kit finder logic, series theming, gord tips, playback progress, admin auth
  - `src/data/` — static starter-episode and category-description data
  - `e2e/` — Playwright tests (Gord chat context specs)
- **AI guides:** Gord the Partridge (`src/components/GordChat.tsx`) and Trailblazer (`src/components/trailblazer-chat.tsx`), both OpenAI gpt-4.1 via SSE streaming, backed by the API server.
- **Data:** all API calls go through codegen'd hooks (Orval, from `lib/api-spec/openapi.yaml`) — never hand-write API types.

## How to run it locally

This app is one artifact in the pnpm monorepo — it doesn't run standalone.

```bash
# Frontend (this app)
pnpm --filter @workspace/stomping-paths run dev

# Required: the shared API server, in parallel
pnpm --filter @workspace/api-server run dev
```

In this Replit workspace both are already wired up as workflows (`artifacts/stomping-paths: web` and `artifacts/api-server: API Server`) and start automatically. Other useful commands:

```bash
pnpm --filter @workspace/stomping-paths run typecheck
pnpm --filter @workspace/stomping-paths run test       # unit tests (src/lib/__tests__)
pnpm --filter @workspace/stomping-paths run test:e2e   # Playwright e2e
pnpm run typecheck   # across the whole monorepo
```

## Where to go for more context

- `replit.md` (root) — zone chain, stack, language/tone rules, open items, gotchas
- `HANDOFF.md` (root) — the canonical project brief: constitutional rules, what's built, what's missing, build-direction checklist
- `shared/stomping-path.md` — the three-stage trail doc (Doom Crowd → Ron Paul → Kitchen Table)
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema/` — DB schema
