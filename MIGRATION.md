# Hosting Migration Runbook
**Headwaters Watershed — Moving off Replit to a scalable production stack**

> Last updated: June 2026. Execute this runbook only when traffic signals the Replit tier is approaching its ceiling, or when the hosting decision is made by the project owner.

---

## ⚠️ Eave Rule — Mandatory Constraint

> **No table, foreign key, join, query path, or stored reference may ever connect a Zone 3 wallet address to a Zone 1 household record.**

This rule must be re-verified on every new database host. After any Neon migration:

1. Confirm `headwaters_clients` and `kit_purchases` are in the **same** Neon database but on a **logically isolated** access path.
2. Confirm that no foreign key or JOIN exists — in code or schema — between `kit_purchases.zaprite_*` columns and any `headwaters_*` table.
3. Run the verification query in [Appendix A](#appendix-a-eave-rule-verification-query) and confirm it returns zero rows.

**This step is non-negotiable. Do not cut over DNS until this check passes.**

---

## Target Stack

| Layer | Current (Replit) | Target |
|---|---|---|
| Database | Replit managed PostgreSQL | **Neon** — managed Postgres, connection pooling, read replicas |
| API Server | Replit workflow (`artifacts/api-server`) | **Fly.io** — auto-scaling Node.js, global edge, `yyz` (Toronto) primary |
| Web frontends | Replit hosting | **Cloudflare Pages** (primary) or **Vercel** (fallback) |
| Mobile (Expo) | EAS Build + EAS Update | Unchanged — already cloud-native |
| Clerk | External | Unchanged |
| Stripe | External (test mode) | Unchanged — swap to live keys post-cutover |
| Zaprite | External | Unchanged |

---

## Pre-Migration Checklist

Before starting, confirm all of the following:

- [ ] Neon project created; `DATABASE_URL` (pooled) and `DATABASE_URL_DIRECT` (non-pooled) connection strings in hand
- [ ] Fly.io account created; `flyctl` CLI installed and authenticated
- [ ] Cloudflare account created; domain (`thestompingpaths.com`) DNS managed in Cloudflare
- [ ] All Replit environment variable values documented securely (1Password or equivalent)
- [ ] `STRIPE_WEBHOOK_SECRET` copied — this will need a new webhook endpoint registered on Fly.io
- [ ] `ZAPRITE_API_KEY` set — enables API-verified order confirmation in the Zaprite webhook handler (Zaprite does not issue webhook signing secrets; API verification is the security model)
- [ ] Current production DB backup taken (`pg_dump`)
- [ ] Fly.io app name reserved: `headwaters-watershed-api`
- [ ] Cloudflare Pages projects created for each frontend (see step 4)
- [ ] Eave Rule verification query (Appendix A) run against current DB and confirmed clean

---

## Step 1 — Provision Neon Database

### 1.1 Create Neon project

```bash
# Via Neon console: https://console.neon.tech
# Project name: headwaters-watershed
# Region: us-east-1 (closest to Replit servers; can switch to ca-central-1 once on Fly yyz)
# Postgres version: 16
```

Neon gives you two URLs per branch:
- **Pooled** (`...neon.tech?sslmode=require&pgbouncer=true`) — use for `DATABASE_URL` at runtime
- **Direct** (same host, no pgbouncer param) — use for `DATABASE_URL_DIRECT` at migration time

### 1.2 Run schema migration against Neon

```bash
# Export the DIRECT url (non-pooled — drizzle-kit requires a direct connection)
export DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Run existing setup scripts + schema push
pnpm --filter @workspace/db run push
```

**Neon gotchas:**
- Use the **non-pooled** (direct) URL for `drizzle-kit push` and `drizzle-kit migrate`. PgBouncer pooling mode breaks DDL statements.
- Neon suspends inactive compute. The first connection after a cold start can take 1–2 seconds. Use `?connect_timeout=10` in the runtime URL.
- Neon does not support `LISTEN/NOTIFY` through PgBouncer. If that is ever added to this codebase, use the direct URL for those connections.
- The `setup-functions.mjs` script creates custom PL/pgSQL functions (tsvector triggers etc.). Run it before `db:push`: `pnpm --filter @workspace/db run push` already calls it via the `push` script.

### 1.3 Data migration

```bash
# Dump from Replit (run inside Replit shell)
pg_dump "$DATABASE_URL" --no-owner --no-acl -Fc -f headwaters_$(date +%Y%m%d).dump

# Restore to Neon (run from local machine or CI with direct URL)
pg_restore --no-owner --no-acl -d "$NEON_DATABASE_URL_DIRECT" headwaters_$(date +%Y%m%d).dump
```

Verify row counts for critical tables after restore:
```sql
SELECT table_name, n_live_tup AS approx_rows
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

---

## Step 2 — Deploy API Server to Fly.io

### 2.1 Build the API server

The `fly.toml` stub is already committed at `artifacts/api-server/fly.toml`.

A `Dockerfile` is required at `artifacts/api-server/Dockerfile`. Write it as:

```dockerfile
# artifacts/api-server/Dockerfile
FROM node:24-slim AS base
RUN npm install -g pnpm@9

WORKDIR /app

# Copy workspace manifests first (layer cache)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

# Install all dependencies (workspace-aware)
RUN pnpm install --frozen-lockfile

# Build the API server
RUN pnpm --filter @workspace/api-server run build

WORKDIR /app/artifacts/api-server
EXPOSE 8080
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
```

### 2.2 First deploy

```bash
cd artifacts/api-server
fly launch --no-deploy --config fly.toml   # imports fly.toml, creates app
fly secrets import < /path/to/secrets.env  # see ENV_VAR_MAP.md for required secrets
fly deploy --dockerfile Dockerfile --build-context ../..  # build from repo root
```

### 2.3 Register new Stripe webhook

After first deploy, the API server will log:
```
stripe: managed webhook CREATED — a new signing secret (whsec_…) was issued.
```

Copy the `whsec_…` value and set it:
```bash
fly secrets set STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 2.4 Health check

```bash
curl https://headwaters-watershed-api.fly.dev/api/healthz
# Expected: 200 OK
```

---

## Step 3 — Deploy Web Frontends to Cloudflare Pages

Each web artifact is deployed as a separate Cloudflare Pages project. Config stubs are committed under each artifact directory.

### Artifact → Cloudflare Pages project mapping

| Artifact | Directory | CF Pages project | Build output |
|---|---|---|---|
| The Stomping Paths | `artifacts/stomping-paths` | `tsp-stomping-paths` | `dist/public` |
| Headwaters | `artifacts/headwaters` | `tsp-headwaters` | `dist/public` |
| Codetry | `artifacts/codetry` | `tsp-codetry` | `dist/public` |
| Privacy Guide | `artifacts/privacy-guide` | `tsp-privacy-guide` | `dist/public` |

### Build command for each frontend (run from repo root)

```bash
# stomping-paths
BASE_PATH="/" pnpm --filter @workspace/stomping-paths run build

# headwaters
BASE_PATH="/headwaters/" pnpm --filter @workspace/headwaters run build

# codetry
BASE_PATH="/codetry/" pnpm --filter @workspace/codetry run build

# privacy-guide
BASE_PATH="/privacy-guide/" pnpm --filter @workspace/privacy-guide run build
```

### 3.1 Path-based routing via Cloudflare Workers (recommended)

Since each artifact lives under a sub-path of `thestompingpaths.com`, deploy a Cloudflare Worker that proxies to the correct Pages project:

```
thestompingpaths.com/*           → tsp-stomping-paths.pages.dev
thestompingpaths.com/headwaters/* → tsp-headwaters.pages.dev
thestompingpaths.com/codetry/*   → tsp-codetry.pages.dev
thestompingpaths.com/privacy-guide/* → tsp-privacy-guide.pages.dev
thestompingpaths.com/api/*       → headwaters-watershed-api.fly.dev
```

Alternatively, use Cloudflare Pages with a single monorepo build and custom path rewrites — but the multi-project approach maps better to the existing artifact structure.

### 3.2 Vercel alternative

Each artifact directory contains a `vercel.json`. Deploy with:
```bash
cd artifacts/stomping-paths && vercel --prod
```
Then use Vercel's `rewrites` in a root `vercel.json` to stitch paths (see each artifact's `vercel.json` for the SPA fallback rules).

---

## Step 4 — Environment Variable Swap

See `ENV_VAR_MAP.md` for the complete mapping of every Replit secret to its Fly.io, Cloudflare Pages, and Neon equivalent.

Critical swaps at cutover:
1. `DATABASE_URL` → Neon pooled URL (set as Fly.io secret)
2. `SITE_URL` → `https://www.thestompingpaths.com` (already hardcoded as fallback, but set it explicitly)
3. `STRIPE_WEBHOOK_SECRET` → new `whsec_…` from Fly.io first deploy
4. `ZAPRITE_API_KEY` → confirm it is set (Zaprite has no webhook signing secret; API re-verification is the security model)
5. Remove all `REPLIT_*` and `REPL_*` env vars — they are Replit-internal and not valid outside Replit

---

## Step 5 — DNS Cutover

**Cutover window: choose a low-traffic period (weekday early morning EST).**

```
1. Set TTL to 60 seconds on DNS records 24 hours before cutover
2. Update A/CNAME records:
   thestompingpaths.com    → Cloudflare Pages / Fly.io (see step 3.1)
   api.thestompingpaths.com → headwaters-watershed-api.fly.dev
3. Wait for TTL to propagate (~5 minutes at TTL=60)
4. Run smoke test checklist (below)
5. If smoke tests pass: decommission Replit workflows
6. If smoke tests fail: revert DNS records (TTL=60 means <5 min to roll back)
```

---

## Smoke Test Checklist

Run after DNS cutover, before decommissioning Replit:

- [ ] `GET https://thestompingpaths.com/api/healthz` → 200
- [ ] `GET https://thestompingpaths.com/` → Stomping Paths homepage loads
- [ ] `GET https://thestompingpaths.com/episodes` → episode list loads
- [ ] `GET https://thestompingpaths.com/headwaters/` → Headwaters gate page loads
- [ ] `GET https://thestompingpaths.com/codetry/` → Codetry landing loads
- [ ] `GET https://thestompingpaths.com/privacy-guide/` → Privacy Guide loads
- [ ] `GET https://thestompingpaths.com/api/episodes?limit=1` → JSON response
- [ ] Replit Auth login flow completes (requires `ISSUER_URL` updated to Fly.io domain if using custom OIDC)
- [ ] Stripe test checkout completes end-to-end
- [ ] Zaprite webhook receives a test ping → logged in API server
- [ ] **Eave Rule verification query (Appendix A) returns zero rows on Neon DB**

---

## Rollback Procedure

If cutover fails:

```bash
# 1. Revert DNS to Replit domain (TTL=60 → propagates in <5 min)
# 2. Replit workflows are still running — traffic returns immediately
# 3. Investigate failure in Fly.io logs:
fly logs --app headwaters-watershed-api
# 4. Fix issue, re-test, re-cutover
```

Do NOT decommission the Replit environment until the new stack has been running cleanly for at least 7 days.

---

## Post-Cutover Hardening

- [ ] Enable Neon read replicas for `/episodes`, `/library`, `/zones` (high-read, low-write routes)
- [ ] Set `auto_stop_machines = "off"` on Fly.io once traffic is confirmed (prevents cold starts)
- [ ] Confirm `ZAPRITE_API_KEY` is set — enables API-verified order status check on every Zaprite webhook event (Zaprite does not sign payloads; API re-verification is the security model)
- [ ] Rotate `KIT_ACCESS_SECRET` and `HEADWATERS_PASSPHRASE` now that secrets are leaving Replit
- [ ] Enable Cloudflare Bot Fight Mode + WAF for API proxy path
- [ ] Set `KIT_STRIPE_PRICE_IDS` in the Fly.io production environment with **live** price IDs (not test)
- [ ] Update Stripe webhook endpoint URL in Stripe Dashboard to `https://thestompingpaths.com/api/stripe/webhook`

---

## Appendix A — Eave Rule Verification Query

Run this against the Neon database immediately after data migration and after every schema change:

```sql
-- Eave Rule check: confirm no path exists between Zone 3 wallet data and Zone 1 household data
-- Expected result: 0 rows. Any row returned is a violation.

SELECT
  tc.table_name   AS source_table,
  kcu.column_name AS source_column,
  ccu.table_name  AS target_table,
  ccu.column_name AS target_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (
    (tc.table_name LIKE 'kit_purchases%' AND ccu.table_name LIKE 'headwaters_%')
    OR
    (tc.table_name LIKE 'headwaters_%' AND ccu.table_name LIKE 'kit_purchases%')
  );

-- Also verify no cross-zone join views exist:
SELECT viewname, definition
FROM pg_views
WHERE schemaname = 'public'
  AND definition ILIKE '%kit_purchases%'
  AND definition ILIKE '%headwaters_%';
```

---

## Appendix B — Mobile (Expo / EAS)

No changes required. The mobile app (`artifacts/tsp-mobile`) uses EAS Build and EAS Update, which are already cloud-native and independent of Replit hosting. After DNS cutover, verify that:

- The Expo app's `API_URL` / base URL env var points to the new domain
- The Replit Auth mobile OAuth flow redirects are updated to the new domain in the Replit Auth configuration

---

## Appendix C — Useful Commands

```bash
# Check Fly.io app status
fly status --app headwaters-watershed-api

# Tail production logs
fly logs --app headwaters-watershed-api

# Scale up/down
fly scale count 2 --app headwaters-watershed-api

# SSH into running machine
fly ssh console --app headwaters-watershed-api

# Run drizzle push against Neon (use DIRECT url)
DATABASE_URL="$NEON_DATABASE_URL_DIRECT" pnpm --filter @workspace/db run push

# Neon branch for staging
# Create a branch in Neon console → get separate DATABASE_URL → point a Fly.io staging app at it
```
