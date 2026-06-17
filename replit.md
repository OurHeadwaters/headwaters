# Headwaters — Living Watershed System
*Agent orientation file.*

> **New to this repo? Read `HANDOFF.md` first.** It is the hempcrete brief — the single load-bearing document that carries the ethos, the built system, the constitutional rules, and the build direction in one place. This file supplements it with operational detail.


---

## One-Sentence Mission

Help make Headwaters feel like one coherent, living watershed where Zone 0 stays warm, the water flows visibly between zones, and the Aquifer keeps everything reliable — all rooted in northern Ontario self-reliance.

---

## Canonical Zone Chain (0–5)

| Zone | Canonical Name | Terrain Tagline | Core Focus | Artifact / Domain |
|---|---|---|---|---|
| 0 | Saltbox | The Hearth · Home Center | Kitchen, preservation, Eave, Forge, root cellar | salt-box.replit.app |
| 1 | Kitchen Table | The Spring · Daily Tools | Learning, handbook, library, practitioner intake | northern-store-plan.replit.app |
| 2 | Workbench | The Worn Path · Transition | Stomping Path, privacy, Codetry tools | stomping-paths.replit.app *(rename repl in Replit dashboard to activate)* |
| 3 | Greenhouse | The Clearing · Circle | Creative, storytelling, making | creative-hub-xbucketsapp.replit.app |
| 4 | Clearing | The Market Square · Exchange | Knowledge hub, grants, market, studio, Deadfall | community-knowledge-hub.replit.app |
| 5 | Edge | The Ridge · Long View | X-Buckets vision, horizon planning | x-buckets-vision.replit.app |

**The Aquifer** = Cross-zone substrate (un-numbered). Not a zone — the hidden infrastructure that sustains all zones. Hosting, logistics, local economy plumbing, backups, 807-specific infrastructure, grant pipelines, archiving, physical–digital bridging.

**Circuit paragraph (use everywhere):**
> "From the Hearth (Zone 0) water rises at the Spring (1), runs the Worn Path (2), gathers in the Greenhouse (3), flows through the Clearing (4), and is held at the Edge (5). The Aquifer keeps the entire watershed cycling."

---

## Artifacts in This Repo

| Artifact | Zone | Role |
|---|---|---|
| `artifacts/stomping-paths` | Zone 2 | The Stomping Paths — multi-producer media platform |
| `artifacts/codetry` | Zone 2 | Codetry — digital sovereignty workbench |
| `artifacts/privacy-guide` | Zone 2 | Privacy Kit — Clearing & Lodge family guide |
| `artifacts/headwaters` | Zone 4 | Practitioner Intake Tool (Headwaters Core) |
| `artifacts/tsp-mobile` | Zone 2 | TSP Mobile (Expo) |
| `artifacts/api-server` | The Aquifer | Shared Express API — backbone for all artifacts |

---

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (port 8080)
- `pnpm --filter @workspace/stomping-paths run dev` — The Stomping Paths web frontend
- `pnpm --filter @workspace/codetry run dev` — Codetry web frontend
- `pnpm --filter @workspace/privacy-guide run dev` — Privacy Guide
- `pnpm --filter @workspace/headwaters run dev` — Headwaters Intake Tool
- `pnpm --filter @workspace/tsp-mobile run dev` — Expo mobile app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run db:push` — apply schema changes to Postgres (drizzle-kit push)

---

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter, TanStack Query, Tailwind v4, shadcn/radix
- Mobile: Expo (React Native)
- API: Express 5, fast-xml-parser
- DB: Postgres + Drizzle (`lib/db/`), JSONB for tags/categories, GIN + tsvector for FTS
- Validation: Zod (`zod/v4`)
- API codegen: Orval (from OpenAPI spec)
- AI: OpenAI gpt-4.1 (streaming SSE for Gord and Trailblazer chat)
- Payments: Stripe (test mode only — Jack is Bitcoin-only for real payments)

---

## Where Things Live

- `lib/api-spec/openapi.yaml` — single source of truth for API contracts
- `lib/db/src/schema/` — Drizzle schemas (content, gatekeeper, gord_tips, etc.)
- `artifacts/api-server/src/routes/` — all API routes (gord, trailblazer, library, episodes, etc.)
- `artifacts/api-server/src/lib/` — RSS, WordPress, YouTube sources, library orchestrator
- `artifacts/stomping-paths/src/pages/` — TSP pages (home, episodes, library, etc.)
- `artifacts/stomping-paths/src/components/gord-guide.tsx` — Gord AI chat widget
- `artifacts/stomping-paths/src/components/trailblazer-chat.tsx` — Trailblazer AI chat
- `artifacts/codetry/src/components/ForgeHero.tsx` — Codetry hero
- `artifacts/codetry/src/components/GordWidget.tsx` — Gord on Codetry
- `artifacts/privacy-guide/src/App.tsx` — Privacy Guide single-page app
- `shared/stomping-path.md` — Canonical three-stage trail doc (Doom Crowd → Ron Paul → Kitchen Table)
- `shared/stomping-path-system-prompt.txt` — ≤200-word agent prompt for Gord/Trailblazer
- `shared/watershed-compact.md` — Full watershed compact with On-Ramp section

---

## Key Language & Framing Rules

- **Always lead** with the watershed / water-cycle + permaculture lens.
- **Saltbox = Zone 0** is the unambiguous centre of the whole system.
- **The Aquifer** = infrastructure substrate, never a numbered zone. Never brand it after any external company.
- **Tone:** Practitioner, warm northern, quiet competence, grounded poetry. No hype, no corporate gloss.
- **Avoid:** Crypto signaling on Zone 2 pages, vague "feels" tester prompts, disconnected sub-sites that don't name their zone.
- **Wayfinding:** Every artifact should carry "Zone X of 5" somewhere visible.
- **Codetry explainer:** Needs to appear wherever Codetry is mentioned: *"the digital sovereignty workbench for Stomping Path practitioners — XRPL tools, key custody, community payment rails, and the code skills to run them yourself."*

---

## Constitutional Framework (load-bearing)

**The Eave Rule (poured concrete, non-negotiable):**
No table, no foreign key, no join, no query path, and no stored reference may ever connect a Zone 3 wallet address to a Zone 1 household record. Any feature that would create such a path must be refused or redesigned.

**Three-Table Model:**
| Table | Zone | Register |
|---|---|---|
| Kitchen table | Z0–Z1 | Inside. Curtains. Deciding, curing, posture. |
| The Deck | Z2 | Your property, facing outward. Working in the open air. |
| Picnic table | Z3+ | Community land. No roof. You carried it out here. |

**The Eave** is the structural seam between Zone 1 (Circle — private household identity) and Zone 3 (Community — above-board organizational identity). The gate sits at the edge of the Deck.

---

## Architecture Decisions

- **Two sources of truth for TSP content**: RSS feed (real-time, ~400 most recent episodes) and Postgres library (full archive: 6,000+ items back to 2006). They coexist — the library is additive.
- **Per-page upsert** for WordPress sync: Jack's WP server intermittently 500s on deep pages. Retries with backoff, skips unrecoverable pages.
- **YouTube graceful degradation**: per-channel RSS currently 404s. Logs and records zero items rather than failing the whole refresh.
- **Full-text search**: Postgres `to_tsvector('english', ...)` + `websearch_to_tsquery` with ts_rank.
- All API hooks are codegen'd from the OpenAPI spec via Orval — never hand-write API types or hooks.

---

## User Preferences

- Jack Spirko is all-in on Bitcoin. XRP is his "shit coin" — keep XRPL out of TSP-facing content unless explicitly asked.
- Bobbie Parr is the practitioner name for Headwaters / Intake work.
- Stripe is test mode only. Real payments = Bitcoin.
- Tone is always: warm northern, practitioner, grounded. Not corporate, not hype.
- Domain note: Zone 2's target domain is `stomping-paths.replit.app`. To activate it, rename the repl to `stomping-paths` in the Replit dashboard (Settings → Repl name). The artifact ID in `artifact.toml` is platform-immutable; only the repl rename changes the public URL.

---

## Open Items (as of May 24, 2026)

1. Build public `/aquifer` framing page — cross-zone substrate explanation.
2. Consistent wayfinding ("Zone X of 5") across all apps.
3. ~~Domain hygiene — Zone 2~~ Target domain is `stomping-paths.replit.app`; activate by renaming the repl to `stomping-paths` in Replit dashboard (Settings → Repl name). Artifact `id` is platform-immutable so this is a one-time manual step.
4. Populate thin zones — especially Zone 5 (Edge / Ridge).
5. Gord the owl access + cross-door links (Greenhouse ↔ Portal).
6. Full visual language alignment — celestial sky + earth terrain throughout.
7. Deadfall archiving (was "Deadhead" — renamed to Deadfall).

---

## Before Going Live — Payment Environment Checklist

All five secrets must be set in Replit Secrets before real money can flow. Missing any one of them produces a specific failure mode described below.

| Secret | Where to find it | Missing = |
|---|---|---|
| `ZAPRITE_WEBHOOK_SECRET` | Contact Zaprite support — secret not shown in dashboard UI | All Bitcoin/Lightning webhooks return **503** and are rejected — purchases not recorded |
| `ZAPRITE_API_KEY` | Zaprite dashboard → API Keys | Zaprite API calls fail (rate lookups, order status) |
| `STRIPE_SECRET_KEY` *(live)* | Set via Replit Integrations tab → Stripe → production environment | Stripe charges go to test mode; no real money moves |
| `STRIPE_WEBHOOK_SECRET` *(live)* | Stripe dashboard → Webhooks → signing secret (live endpoint) | Stripe webhook signature verification fails; purchases not recorded |
| `KIT_STRIPE_PRICE_IDS` | Copy the JSON printed in API server logs after first boot (`kit-products: set KIT_STRIPE_PRICE_IDS…`) | API auto-creates kit products on every cold start — idempotent but slow |

**How to pin kit price IDs (one-time setup):**
1. Start the API server once with Stripe connected.
2. In the logs, find the line `kit-products: set KIT_STRIPE_PRICE_IDS in Replit Secrets…`.
3. Copy the `KIT_STRIPE_PRICE_IDS` JSON value from that log line.
4. Set it as a Replit Secret. From then on, no Stripe API calls happen at cold start.

**Stripe live vs test mode** is controlled by the Replit Stripe integration:
- In development (`REPLIT_DEPLOYMENT` unset): uses the **development** Stripe connection (test keys).
- In production (`REPLIT_DEPLOYMENT=1`): uses the **production** Stripe connection (live keys).
- Switch to live keys by connecting a live Stripe account via the Integrations tab → Stripe → production environment.

---

## Environment Variables (API Server)

| Variable | Default | Description |
|---|---|---|
| `SHARE_DEDUP_SECONDS` | `60` | Deduplication window for share events. Shares from the same IP for the same surface+slug within this many seconds are collapsed into one. Set in Replit Secrets to tune without a code change. |

---

## Gotchas

- RSS has duplicate-cased categories ("friday flashbacks" vs "Friday Flashbacks"). Upstream data; surfaced as-is.
- WP REST taxonomy endpoints can also 500; the term-loader logs and skips bad pages.
- Library backfill runs on server boot in the background — fresh DBs show ~30s of partial state.
- After any OpenAPI change, re-run codegen before using updated types.
- Drizzle: use `inArray(col, arr)` not `sql\`${col} = ANY(${arr}::text[])\`` — the latter serializes incorrectly.
- API server must be on port 8080; a previous port collision was fixed by killing an orphan process.

---

## Pointers

- See `.local/headwaters-context-package.md` for the full canonical zone + watershed brief
- See `.local/context/kitchen-table-brief.md` for the constitutional framework + table model detail
- See `.local/notes/the-deck-z2-workbench-metaphor.md` for Deck / Z2 metaphor detail
- See `shared/stomping-path.md` for the three-stage trail doc
- See the `pnpm-workspace` skill for workspace structure
- See the `database` skill for Postgres operations
