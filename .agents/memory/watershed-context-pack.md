---
name: Headwaters Watershed — Project Context
description: Pointers to the full context pack and the key load-bearing facts any agent needs on entry
---

## Where to find the full pack

`.local/context-packages/watershed-full-context-pack.md` — compiled May 30, 2026. Complete: zone chain, artifact map, all routes, full DB schema, all API routes, constitutional framework, open items, gotchas, key files.

## Non-negotiable rules (load these first, every session)

**Eave Rule:** No table, foreign key, join, query path, or stored reference may ever connect a Zone 3 wallet address to a Zone 1 household record. Refuse or redesign any feature that would create that path.

**7-artifact limit reached.** New features go inside existing artifacts as new routes. Confirm with user before creating a new artifact.

**Jack Spirko = Bitcoin only.** Keep XRPL/XRP off TSP-facing pages unless explicitly asked. Stripe = test mode only. Real payments = Zaprite.

**After any OpenAPI spec change:** run `pnpm --filter @workspace/api-spec run codegen` before using updated types. Never hand-write API types or hooks.

**After any DB schema change:** run `pnpm --filter @workspace/db run db:push`.

## Zone chain (locked)
Zone 0 = Salt Box (Hearth) · Zone 1 = Lodge/Headwaters (Spring) · Zone 2 = Bench/Trail (Worn Path) · Zone 3 = Standby/Gathering (Clearing) · Zone 4 = Community Hall (Market Square) · Zone 5 = The Wild (Ridge) · The Mill = un-numbered infrastructure substrate

## Two zone frameworks — do not conflate
- **System zones 0–5** = Headwaters architecture (Salt Box to The Wild)
- **TSP practitioner journey zones** (Z0=Self, Z1=Home … Z5=Wild) = listener journey for Stomping Path content

## People
- Bobbie Parr = practitioner, project author, owns Headwaters intake tool
- Jack Spirko = TSP host, Bitcoin-only, XRP = "shit coin"
- Gord = deadpan owl/partridge mascot, Zone 2 AI guide

## Key open items (May 30, 2026)
1. `/mill` framing page — not built
2. "Zone X of 5" wayfinding — inconsistent
3. Domain hygiene — Zone 2 still at xrpl-design-hub.replit.app
4. `ZAPRITE_WEBHOOK_SECRET` not set — signature check skipped
5. Kit content gating — API exists, frontend never calls it

**Why:** This is load-bearing context that cannot be derived from the code alone — constitutional rules, framing conventions, and known gaps that affect every build decision.

**How to apply:** Read this file at the start of any session. Open the full pack for route/schema/API detail.
