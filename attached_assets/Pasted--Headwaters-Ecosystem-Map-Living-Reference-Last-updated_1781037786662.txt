# Headwaters Ecosystem Map — Living Reference

*Last updated: June 2026. Canonical reference for the full Headwaters circuit: every zone, its activity, its target domain, its serving tools, and how it connects to the Aquifer.*

---

## Framing Principle — Zones Are Activity Terrains

**Zones are *activity terrains a person moves through*, not boxes that apps live in.** One enterprise flows across many zones (e.g. food is *produced* in Zone 2, *sold* in Zone 4, *funded* in Zone 3, *budgeted* in Zone 1, *eaten* in Zone 0).

**Dividing rule:** what a person actively *does* = its zone; what *runs itself / stores / moves money / orients* = the Aquifer.

---

## Circuit Paragraph

*"From the Hearth (Zone 0) water rises at the Spring (1), runs the Worn Path (2), grows in the Greenhouse (3), gathers in the Clearing (4), and is held in the Studio on The Edge (5). The Aquifer keeps the entire watershed cycling."*

---

## Zone Table — Full Ecosystem

| Zone | Domain | What you do here (activity) | Serving tools |
|------|--------|------------------------------|----------------|
| **0** Saltbox · The Hearth | saltboxhomes.ca | Live, raise family, homeschool, household sovereignty, preservation | salt-box; **Goodbye Kit** (family lifecycle) |
| **1** Kitchen Table · The Spring — *Headwaters Finance* | parrsjars.com | Budget every hat; plan income & lifestyle; money management | X-Buckets jar budgeting, Kitchen Table Reports, Money Machine, Eave budgeting (the Arc's money tools rise here) |
| **2** Workbench · The Worn Path | parrsjars.ca | Work in exchange for money — contracts & production | Local software contracts/services; **Parr's Jars food production** |
| **3** Greenhouse · The Member Circle | ourcommunitybenefits.com | Belong, pool, mutual aid, funding access | **807 Community Benefits** (white-label org layer + community tools); **Helping Hands** (labour-for-benefits option on member plans) |
| **4** The Clearing · The Market Square | thestompingpaths.com | Exchange (sell at market/online), self-develop, discuss, broadcast | Public Clearing / Stomping Path, market access, Survival Podcast, practitioner intake; **Goodbye Kit market face** (Crossing Guards) |
| **5** The Edge · Studio & Long View | codetry.ca | Create new things — design, blockchain, fringe/vibrational builds, the long view | Codetry (Forge, Discover, Blueprints), Learning (handbook/library), Edge Studios (XRPL Studio, Dam Days, Slim Evey), Black Hole Studios (kids), x-buckets-vision (long-view content only) |
| **Aquifer** · The Water Table *(not a numbered zone)* | ourheadwaters.ca | Substrate — runs itself, stores, moves, orients | API, DB, login/identity, automation engine, settlement; the living map (the Arc's map); **The Compass** (orientation), **The Logic** (foundational reference), **Print Suite** (cross-zone production utility) |

**The Aquifer is not a numbered zone.** It is the substrate at ourheadwaters.ca that keeps every zone cycling — API, DB, login/identity, settlement, the living map, The Compass, The Logic, and the Print Suite. No zone number, no terrain tagline of its own — only the watershed metaphor: hidden, always moving, everything depends on it.

**Things that dissolved/folded into the new map:**
- **northern-store-plan** dissolves: budgeting → Zone 1; learning/handbook/library → Zone 5 Codetry/Learning; Helping Hands → Zone 3 (labour option on 807 plans).
- **x-buckets-vision**: its budgeting folds into Zone 1 Finance; only its long-view/vision content stays in Zone 5.
- **The Arc**: its money tools rise to Zone 1 (Headwaters Finance); its living map sinks to the Aquifer.
- **community-knowledge-hub (807 Benefits)** folds into Zone 3 at ourcommunitybenefits.com.
- **Parr's Jars food** is Zone 2 income (production), with a Zone 4 market face — not a "Zone 4 business."

---

## Current Hosting vs. Target Domain

The domains in the zone table above are the **target** map. **No DNS pointing or re-hosting has happened yet** — DNS and re-hosting to the new domains are tracked as separate downstream work.

Today every in-repo app is still served from `ourheadwaters.ca/<path>`:

| Path | Artifact Name | Aquifer / target zone | Artifact Dir | Status |
|------|--------------|------------------------|--------------|--------|
| `/` | The Arc | Money tools → Z1; living map → Aquifer | `artifacts/arc` | Live |
| `/api` | Aquifer API Server | Aquifer | `artifacts/api-server` | Live |
| `/headwaters/` | The Clearing (public landing) | Z4 Clearing (target thestompingpaths.com) | `artifacts/headwaters` | Live |
| `/compass/` | The Compass | Aquifer | `artifacts/compass` | Live |
| `/suite/` | Headwaters Print Suite | Aquifer | `artifacts/print-suite` | Live |
| `/logic/` | The Logic | Aquifer | `artifacts/the-logic` | Live |
| `/goodbye/` | The Goodbye Kit | Kit → Z0; market face → Z4 | `artifacts/goodbye-kit` | Live |
| `/stomping/` | Stomping Path (Zone 4 tool) | Z4 Clearing (target thestompingpaths.com) | planned artifact under `artifacts/stomping` | Planned |

All paths are proxied via the shared Replit reverse proxy. Services handle their own full base path — there is no path rewriting. The Arc sits at `/` and owns the root.

---

## Interoperability Protocol

Four mechanisms connect the watershed across repls:

### 1. Watershed Ribbon (`@workspace/watershed-nav`)

The shared navigation ribbon rendered at the top of every zone app. Displays the current zone, allows movement across the watershed, and supports tool-level labeling inside a zone.

**For external tools calling back to the Aquifer:** pass the `apiBase` prop pointing to `https://ourheadwaters.ca/api`. This allows Zone 2 (xrpl-design-hub) and other external repls to call the Aquifer without hard-coding internal addresses.

```tsx
<WatershedRibbon currentZone={2} toolName="The Forge" apiBase="https://ourheadwaters.ca/api" />
```

Any new Zone 2 artifact **must** pass `toolName` so the active chip shows the tool name, not just "2 Workbench". See `lib/watershed-nav/src/index.tsx` for the Zone 2 `internal` array — add new tools there.

### 2. Shared JWT Auth (`@workspace/watershed-auth`)

Session token stored in `localStorage` as `hw_token`. Any external tool that wants to identify a logged-in steward validates the token against:

```
GET https://ourheadwaters.ca/api/auth/me
Authorization: Bearer <hw_token>
```

A valid response means the steward is authenticated. The Aquifer is the single source of truth for identity — no external tool issues its own tokens.

### 3. Purchase Webhook Bridge

xrpl-design-hub (the Stomping Path storefront — a Zone 4 Clearing / Market Square activity) holds the Stripe checkout UI. After a successful Stripe payment, it fires a signed POST to the Aquifer:

```
POST https://ourheadwaters.ca/api/kits/purchase-webhook
X-Webhook-Secret: <KIT_WEBHOOK_SECRET>
```

The Aquifer receives the webhook, records the purchase in `kit_purchases`, issues an access token, and makes the content available for delivery. The storefront/vault split is intentional — see the next section.

**Required secret:** `KIT_WEBHOOK_SECRET` must be set identically in both repls.

### 4. CORS on the Aquifer

The Aquifer allows cross-origin requests from external repls so that Zone 2 and other external tools can call `/api` directly from the browser. The allowed origins are locked to known Replit domains — `*.replit.app` and the production domain `ourheadwaters.ca`. No wildcard open CORS.

---

## Storefront / Vault Split

The Stomping Path storefront (xrpl-design-hub — a Zone 4 Clearing / Market Square activity) holds the **storefront**: the Stripe checkout UI, the product descriptions, the purchase flow, and the pre-purchase experience.

The Aquifer holds the **vault**: `kit_purchases` records, access tokens, content delivery, and all post-purchase state.

This split is intentional. The storefront can change, be redesigned, or be moved to a different zone without touching the vault. The vault can be migrated (to XRPL settlement, for example) without touching the storefront. They are connected by exactly one signal: the signed webhook.

**Why this matters for builders:** if you are building a new purchase flow in any zone, the pattern is always the same — zone app handles discovery and checkout, Aquifer handles record and delivery, webhook is the handoff.

---

## The Kratky Inward Flow

Zone numbering runs inward, not outward. Zone 0 is the center — the Saltbox, the hearth. Every zone after it is progressively further from the home. Because zones are activity terrains (not app containers), the inward flow tracks the *activities* a practitioner moves through, not a set of apps.

The Kratky flow for practitioners entering the ecosystem:

```
Zone 4 The Clearing / Market Square (public entry — exchange, broadcast)
  → Zone 3 Greenhouse / Member Circle (belong, pool, mutual aid)
  → Zone 2 Workbench (take up work — contracts & production)
  → Zone 1 Kitchen Table / Spring (manage the money)
  → Zone 0 Saltbox / Hearth (household sovereignty)
```

Zone 5 (The Edge · Studio & Long View) is not a destination for the practitioner — it is the create-new-things and long-view terrain handed toward the commons and P2P layer. The watershed does not chase Zone 5. It builds Zone 0 and lets Zone 5 emerge.

This framing matters for any UX decision about entry points. The Clearing (the public page in this repo, a Zone 4 Market Square activity) is the front door. The Stomping Path is also a Zone 4 activity, where practitioners find their footing in the market before moving inward. Zone 0 Saltbox is the goal — not the starting point.

---

## Connection Status — What Is and Isn't Wired

| Component | Status | Notes |
|-----------|--------|-------|
| ourheadwaters.ca → our-headwaters.replit.app | **Live** | CNAME pointed, TLS provisioned, full path routing active |
| thestompingpaths.com (target Zone 4 Clearing) → xrpl-design-hub.replit.app | **Pointed** | DNS CNAME in place; today the in-repo Clearing is still served at `ourheadwaters.ca/headwaters/` |
| Target Zone 1 (parrsjars.com), Zone 2 (parrsjars.ca), Zone 3 (ourcommunitybenefits.com), Zone 5 (codetry.ca) | **DNS pending** | Target domains owned/assigned per the locked map; CNAMEs not yet set, re-hosting not yet done |
| Watershed ribbon on external repls | **Not yet wired** | Ribbon library exists; external repls have not integrated it |
| Shared JWT auth on external repls | **Not yet wired** | Pattern defined; external repls do not yet validate `hw_token` |
| Purchase webhook (Zone 4 Clearing storefront → Aquifer) | **Endpoint built** | `/api/kits/purchase-webhook` exists; the Stomping Path Stripe side not yet wired to fire it |
| Zone 0 Saltbox | **External** | Lives at salt-box.replit.app (target saltboxhomes.ca); separate Repl and separate DB; Hearth frontend calls this repo's Aquifer for `hearth_*` routes |
| Zone 5 Edge | **External** | Long-view content at x-buckets-vision.replit.app (target codetry.ca); no current API bridge |
| XRPL settlement layer | **Not yet built** | The gap is held, not hidden — see `docs/learning-identity-architecture.md` and the XRPL gap archive task |

---

## What Builders Need to Plug In

If you are adding a new tool to the watershed ecosystem, here is what you need to wire:

1. **Watershed ribbon** — add the tool to `lib/watershed-nav/src/index.tsx` under the correct zone's `internal` array, then render `<WatershedRibbon>` in the tool with the correct `currentZone` and `toolName`.

2. **Auth bridge (optional, if the tool needs steward identity)** — validate `hw_token` from `localStorage` against `GET /api/auth/me`. Do not build a parallel auth system.

3. **Purchase webhook (if the tool handles commerce)** — fire a signed POST to `/api/kits/purchase-webhook` after Stripe checkout. Use `KIT_WEBHOOK_SECRET` as the shared signing secret.

4. **CORS** — your new tool's domain must be added to the Aquifer's allowed origins if it makes browser-side API calls.

5. **DNS** — add the new domain to the DNS guide in The Arc (`artifacts/arc/src/pages/dns-guide/index.tsx`) and to the zone table above.

**The XRPL foundation gap:** The on-chain layer (RLUSD settlement, XRPL DID, key custody) is architecturally designed but not yet built. See `docs/learning-identity-architecture.md` for the DID three-table model and the XRPL gap archive for the formal record of what remains. Do not build against a speculative XRPL interface — hold the gap cleanly until the foundation is ready.

---

*This document is a living reference. Update it when a domain is pointed, a connection is wired, or a new artifact is added to the ecosystem.*
