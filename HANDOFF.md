# HANDOFF — Headwaters Zone 2 Repo
*A hempcrete brief. Mix it, cure it, build on it. Last set: May 2026.*

---

## Who You Are Building For

**Bobbie Parr** — practitioner, project author, northern Ontario. Headwaters is her system.
**Jack Spirko** — The Survival Podcast host. Bitcoin-only. Opposes XRP publicly ("shit coin"). Keep XRPL off TSP-facing content unless explicitly asked.

This repo is **Zone 2 of the Headwaters watershed** — The Bench/Trail, The Worn Path, Transition. It is where TSP listeners become practitioners. Everything here serves that crossing.

---

## The Watershed in One Paragraph

Headwaters is a northern Ontario self-reliance project network structured as a living watershed. Zone 0 (Salt Box) is the hearth — home, kitchen, family. Zone 1 (Lodge) is the spring — daily tools, learning, practitioner intake. Zone 2 (Bench/Trail) is the worn path — transition, digital tools, The Stomping Path. Zone 3 (The Clearing) is the circle — creative, storytelling, community. Zone 4 (Community Hall) is the market square — grants, exchange, studio, Deadfall. Zone 5 (The Wild) is the ridge — X-Buckets, horizon planning. The Mill is the un-numbered substrate — infrastructure, backups, local economy plumbing — the water table that keeps it all cycling.

**Circuit paragraph. Use it everywhere:**
> "From the Hearth (Zone 0) water rises at the Spring (1), runs the Worn Path (2), gathers in the Clearing (3), flows to the Market Square (4), and is held on the Ridge (5). The Mill keeps the entire watershed cycling."

---

## The Constitutional Rules (Lime — Never Moves)

### The Eave Rule
**No table, no foreign key, no join, no query path, and no stored reference may ever connect a Zone 3 wallet address to a Zone 1 household record.**

This is poured concrete. If a feature you are building would create that link, refuse it or redesign it before touching a file.

### The Three-Table Model
| Table | Zone | Register |
|---|---|---|
| Kitchen table | Z0–Z1 | Inside. Curtains. Deciding, curing, posture. |
| The Deck | Z2 | Your property, facing outward. Working in the open air. |
| Picnic table | Z3+ | Community land. No roof. You carried it out here. |

The Deck is Zone 2's metaphor. The Eave covers both kitchen and deck. The gate is at the deck's edge — the Z2↔Z3 boundary.

### Payments
- **Stripe = test mode only.** Never flip to live without Bobbie's explicit sign-off.
- **Real payments = Zaprite (Bitcoin / Lightning / XRP / RLUSD).** `ZAPRITE_WEBHOOK_SECRET` must be set in env before any real transaction goes live.
- Jack is Bitcoin-only. Do not put XRP language in TSP-facing copy.

### Tone
Warm northern. Practitioner. Quiet competence. Grounded poetry. No hype. No corporate gloss. No emoji unless the user asks. Write like someone who has split wood and knows what they're doing.

---

## What Is Built (The Aggregate)

### Artifacts
| Artifact | Zone | Framework | Auth | Path |
|---|---|---|---|---|
| `artifacts/survival-podcast` | 2 | React + Vite, wouter, TanStack Query, Tailwind v4, shadcn | Replit Auth | `/` |
| `artifacts/codetry` | 2 | React + Vite, Tailwind v4 | None | `/codetry/` |
| `artifacts/privacy-guide` | 2 | React + Vite, single-page | None (localStorage checklists) | `/privacy-guide/` |
| `artifacts/headwaters` | 1 | React + Vite, wouter | PIN/passphrase (`HEADWATERS_PASSPHRASE`) | `/headwaters/` |
| `artifacts/tsp-mobile` | 2 | Expo (React Native), Expo Router | Replit Auth OAuth | Expo domain |
| `artifacts/api-server` | The Mill | Express 5, Node.js 24, TypeScript | Replit Auth + `requireEditor` / `requireBrigade` | Port 8080 |

### Database
Shared PostgreSQL via Drizzle ORM. Schema in `lib/db/src/schema/`. Apply changes: `pnpm --filter @workspace/db run db:push`.

Key tables: `content_items` (all TSP content — FTS via tsvector), `users` + `sessions` (Replit Auth), `kit_purchases` + `kit_inquiries`, `ground_events` + `ground_event_rsvps`, `cohorts` + `cohort_enrollments`, `memberships` (Brigade/Stripe), `expert_council`, `practitioners`, `headwaters_clients` + `headwaters_intake_submissions`, `track_progress`, `user_lifestyle_maps`, `wishing_well_tips`.

### The Kit System (Commercial Backbone)
8 kits. Single source of truth: `artifacts/api-server/src/lib/kits.ts`.

| Kit | Type | Price |
|---|---|---|
| Family Kit 🏡 | direct | $97 |
| Producer Kit 💼 | direct | $97 |
| Care Kit 🌱 | direct | $97 |
| Budget Kit 🪣 | direct | $97 |
| Digital Kit 🔐 | direct | $97 |
| Physical Kit ⚡ | direct | $97 |
| Practitioner Kit 🌿 | consultative | inquiry |
| Council Kit 🌊 | consultative | inquiry |

Two purchase paths per direct kit: Stripe (card) → `kit_purchases` row → welcome email; Zaprite (Bitcoin/Lightning/XRP) → `/api/zaprite/webhook` → same row → same email. Kit finder at `/kits/find` — 5 questions, deterministic `resolveKit()`, no AI.

### Expert Council
25 members seeded. Static registry: `artifacts/api-server/src/lib/expert-council-static.ts`. Core names: Jack Spirko, Steven Harris, Marjory Wildcraft, Paul Wheaton, Joel Salatin, Ben Falk, Dr. Ken Berry, Chris Martenson, John Lovell, Dave Ramsey, Dr. Joseph Mercola, and the Fireside Freedom crew (Brian Aleksivich, Lettie Loo, Tim 'Toolman' Cook, Ken Eash, Nate & Erin Lamaster, Amy, Hawkins J). Four members + two ULG businesses are `comingSoon: true`. Not seeded: Doc Bones & Nurse Amy, The Sauce, Michael Pugliano.

### AI Guides
- **Gord the Partridge** — Zone 2 AI guide. SSE streaming. Widget: `artifacts/survival-podcast/src/components/gord-guide.tsx`. Context: `shared/stomping-path-system-prompt.txt`.
- **Trailblazer** — separate chat context for the Stomping Path transformation flow. `artifacts/survival-podcast/src/components/trailblazer-chat.tsx`.
- Both use OpenAI gpt-4.1.

---

## What Is Missing (Build Here Next)

### High priority — ethos gaps
1. **`/mill` framing page** — No public explanation of The Mill's cross-zone substrate role exists. Every zone links to it eventually. Build it as a standalone route on survival-podcast: `src/pages/mill.tsx`. Tone: old northern mill, water table, hidden work. Circuit paragraph anchors it.
2. **"Zone X of 5" wayfinding** — Present in some hero badges, absent from most interior pages. Every artifact should carry this. Add it consistently before new features.
3. **Kit content gating** — `/api/kits/:slug/access` exists and works. The UI never calls it. Kit episodes and gear are publicly visible. Decision for Bobbie: should content require purchase? If yes, wire the access check to the episode/gear sections in `kit-detail.tsx`.

### Medium priority — incomplete artifacts
4. **Codetry workbench** — Codetry's copy describes XRPL tools, key custody, and community payment rails. None of these are built. The artifact is currently a landing/services site. The workbench is the promised second phase.
5. **Domain hygiene** — Zone 2 is at `xrpl-design-hub.replit.app`. Target is `stomping-path.replit.app` or a custom domain. No code change — Replit artifact config.
6. **Deadfall archiving** — Named, not built. Zone 4 (Community Hall) feature. Archiving of content, community documents, field notes into a structured long-term store.

### Lower priority — env vars to set
7. `ZAPRITE_WEBHOOK_SECRET` — not in env. Signature verification skipped with a warning. Set before real payments go live.
8. `KIT_STRIPE_PRICE_IDS` — not in env. Server auto-creates Stripe products on cold start. After first boot, log the price IDs and set this to skip future API calls.

---

## Build Direction (The Hemp — Gives It Strength)

When adding a feature, ask these questions in order:

**1. Which zone does this belong to?**
Name it and tag it. If it doesn't fit a zone, it doesn't belong in this repo.

**2. Does it carry water between zones?**
Good features are conduits — they move a person from one zone to the next, or surface one zone's content in another. The Stomping Path fan site leading to the Practitioner Kit leading to the Headwaters intake tool is a complete water path. Build in paths, not islands.

**3. Does it violate the Eave?**
If the feature touches both Zone 1 identity (household, name, family) and Zone 3 identity (wallet, community organization), stop. Redesign the boundary.

**4. Would Bobbie trust it with her name on it?**
Warm northern, practitioner, quiet competence. No growth hacks. No dark patterns. No fake urgency. The kit system charges $97 because that is what it's worth — not because of a timer.

**5. Does it work for someone on a slow connection outside Dryden?**
Northern Ontario constraints are real. Lazy-load, paginate, degrade gracefully. The library backfill runs on boot and takes ~30 seconds on a fresh DB — that's a known state, not a bug.

---

## Gotchas (Cures Faster If You Know These)

- **RSS duplicate-cased categories** — "friday flashbacks" vs "Friday Flashbacks" upstream in Jack's feed. Surfaced as-is. Don't try to normalize it in the DB.
- **WP REST API 500s** — Jack's WordPress server intermittently fails on deep pagination. Per-page upsert with backoff handles this. Don't change the strategy.
- **YouTube RSS 404s** — Per-channel RSS currently 404s. Logged, records zero items, does not fail the whole refresh.
- **Drizzle `inArray`** — Use `inArray(col, arr)` not `sql\`${col} = ANY(${arr}::text[])\`` — the latter serializes incorrectly in Drizzle.
- **API server must stay on port 8080** — Previous port collision was resolved. Don't change this without checking workflow config.
- **After any OpenAPI change** — Run `pnpm --filter @workspace/api-spec run codegen` before using updated hooks or types. All API hooks and Zod schemas are generated from `lib/api-spec/openapi.yaml`.
- **Library backfill** — Runs in background on boot. Fresh DBs show ~30s of partial state. Expected.
- **Two zone frameworks coexist** — The Headwaters system zone chain (0–5, Salt Box → The Wild) is different from the TSP practitioner journey zones (Z0=Self → Z5=Wild used in `zones.ts`). Both exist. Do not conflate them.

---

## Key Files — Read These First

| File | What It Contains |
|---|---|
| `replit.md` | Agent orientation — zone chain, stack, language rules, open items, gotchas |
| `HANDOFF.md` | This file — the hempcrete brief |
| `.local/headwaters-context-package.md` | Canonical watershed brief by Bobbie — zone chain, Mill definition, constitutional framework |
| `.local/kits-sales-context.md` | Canonical kit sales copy (Bobbie, May 2026), pricing, icon/color map, system gaps |
| `.local/headwaters-zone2-context-index.md` | Full master context index — all routes, all tables, all API routes, what's built vs missing |
| `lib/api-spec/openapi.yaml` | Single source of truth for all API contracts |
| `lib/db/src/schema/` | All Drizzle table definitions |
| `artifacts/api-server/src/lib/kits.ts` | All 8 kit definitions — slugs, copy, prices, Zaprite URLs, user manuals |
| `artifacts/api-server/src/lib/expert-council-static.ts` | All 25 Expert Council members + 12 ULG businesses |
| `artifacts/survival-podcast/src/App.tsx` | All frontend routes for The Stomping Path |
| `shared/stomping-path.md` | Three-stage trail doc (Doom Crowd → Ron Paul → Kitchen Table) |
| `shared/watershed-compact.md` | Full watershed compact + On-Ramp section |

---

## One-Line Mission

This project exists so that **people walking The Stomping Path — from TSP listener to sovereign practitioner — have one coherent Zone 2 watershed to move through: discovery, transition, digital tools, privacy, kits, and a practitioner intake door, all rooted in northern Ontario self-reliance and the Headwaters water-cycle framework.**

---

*Hempcrete cures stronger than it was poured. Build accordingly.*
