# Environment Variable Map — Hosting Migration
**Headwaters Watershed — Replit → Neon / Fly.io / Cloudflare Pages**

> Values are NOT stored here. This document maps variable **names** only.
> Store values in 1Password (or equivalent) before starting migration.

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ Required | Must be set before the service will start |
| ⚠️ Conditional | Required only when the associated feature is enabled |
| 🔁 Rotate | Rotate this secret after leaving Replit — old value should be invalidated |
| ❌ Replit-only | Not valid outside Replit; omit on new host |
| 📝 Dev-only | Development/debug use; do not set in production |

---

## API Server (`artifacts/api-server`) → Fly.io Secrets

Set via `fly secrets set KEY=value` or `fly secrets import`.

### Database

| Replit Name | Fly.io Secret Name | Notes |
|---|---|---|
| `DATABASE_URL` | `DATABASE_URL` | ✅ Swap to **Neon pooled** URL at cutover. Format: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=10` |
| *(not set in Replit)* | `DATABASE_URL_DIRECT` | ✅ **Neon non-pooled** URL — required for `drizzle-kit push` / migrations only. Never set in the API server process itself. |

### Auth

| Replit Name | Fly.io Secret Name | Notes |
|---|---|---|
| `ISSUER_URL` | `ISSUER_URL` | ✅ Replit Auth OIDC issuer URL. Stays as-is if continuing to use Replit Auth. If migrating auth provider, update here. |
| `REPL_ID` | ❌ Omit | ❌ Replit-internal — used for Replit Auth client ID. After migration, configure auth client ID explicitly if needed. |
| `REPL_IDENTITY` | ❌ Omit | ❌ Replit-internal identity token. Not valid on Fly.io. |
| `HEADWATERS_PASSPHRASE` | `HEADWATERS_PASSPHRASE` | ✅ 🔁 Passphrase for Headwaters CRM access. Rotate after migration. |

### Site Identity

| Replit Name | Fly.io Secret Name | Notes |
|---|---|---|
| `SITE_URL` | `SITE_URL` | ✅ Set to `https://www.thestompingpaths.com`. Already has this value hardcoded as fallback, but set explicitly. |
| `REPLIT_DOMAINS` | ❌ Omit | ❌ Replit-internal ephemeral domain list. |
| `REPLIT_DEPLOYMENT` | ❌ Omit | ❌ Replit-internal deployment flag. |
| `REPLIT_CONNECTORS_HOSTNAME` | ❌ Omit | ❌ Replit Connectors hostname — used for Replit-managed integrations (Stripe, etc.). On Fly.io, configure integrations directly via their own env vars. |

### Stripe

| Replit Name | Fly.io Secret Name | Notes |
|---|---|---|
| `STRIPE_WEBHOOK_SECRET` | `STRIPE_WEBHOOK_SECRET` | ✅ 🔁 New `whsec_…` issued when Fly.io registers the webhook endpoint on first deploy. Do NOT copy the Replit value — Stripe generates a new secret per registered endpoint. |
| `STRIPE_WEBHOOK_SECRET_FALLBACK` | 📝 Omit in prod | 📝 Dev only — for local `stripe listen` CLI. Never set in production. |
| `KIT_STRIPE_PRICE_IDS` | `KIT_STRIPE_PRICE_IDS` | ✅ JSON map of kit slug → Stripe price ID. **Must be live-mode price IDs** in production (test IDs break live-mode Stripe keys). See stripe-env-scoping.md. |
| `STRIPE_LISTING_PRICE_ID` | `STRIPE_LISTING_PRICE_ID` | ⚠️ Stripe price ID for expert council listings. |
| `BRIGADE_MONTHLY_PRICE_ID` | `BRIGADE_MONTHLY_PRICE_ID` | ⚠️ Set only if overriding auto-created Brigade monthly price. |
| `BRIGADE_ANNUAL_PRICE_ID` | `BRIGADE_ANNUAL_PRICE_ID` | ⚠️ Set only if overriding auto-created Brigade annual price. |
| `BRIGADE_CHECKOUT_PAUSED` | `BRIGADE_CHECKOUT_PAUSED` | ⚠️ Set to `"true"` to pause Brigade checkout. Omit to enable. |

### Zaprite (Bitcoin / Lightning Payments)

| Replit Name | Fly.io Secret Name | Notes |
|---|---|---|
| `ZAPRITE_API_KEY` | `ZAPRITE_API_KEY` | ✅ Zaprite REST API key. When set, the webhook handler re-fetches each order from the Zaprite API to verify its status before recording — strongly recommended for production. Obtain from Zaprite Settings → API Keys. |

> **Note on Zaprite webhook security:** Zaprite confirmed (via support) that they do **not** sign webhook payloads — there is no `ZAPRITE_WEBHOOK_SECRET`. Security is enforced in three layers instead: (1) payload validation — only `status === "completed"` orders for known kit slugs with valid buyer emails are processed; (2) optional API verification via `ZAPRITE_API_KEY`; (3) idempotency — the `zaprite_order_id` unique constraint silently ignores replayed events. See `artifacts/api-server/src/zapriteWebhook.ts` for the full security model comment.

### Email (Resend)

| Replit Name | Fly.io Secret Name | Notes |
|---|---|---|
| `RESEND_API_KEY` | `RESEND_API_KEY` | ✅ Resend transactional email API key. |
| `KIT_EMAIL_FROM` | `KIT_EMAIL_FROM` | ✅ From address for kit purchase emails (e.g. `kits@thestompingpaths.com`). |
| `KIT_EMAIL_REPLY_TO` | `KIT_EMAIL_REPLY_TO` | ⚠️ Reply-to address for kit emails. |
| `KIT_INQUIRY_EMAIL` | `KIT_INQUIRY_EMAIL` | ✅ Destination address for kit inquiry form submissions. |
| `GORD_TIP_EMAIL` | `GORD_TIP_EMAIL` | ⚠️ Notification address for Gord tip events. |

### Kit Access

| Replit Name | Fly.io Secret Name | Notes |
|---|---|---|
| `KIT_ACCESS_SECRET` | `KIT_ACCESS_SECRET` | ✅ 🔁 HMAC signing key for kit access tokens. Rotate after migration — outstanding tokens will need re-issue. |
| `KIT_TOKEN_TTL_DAYS` | `KIT_TOKEN_TTL_DAYS` | ⚠️ Access token lifetime in days. Defaults to 30 if unset. |
| `KIT_WEBHOOK_SECRET` | `KIT_WEBHOOK_SECRET` | ⚠️ Shared secret for kit webhook callbacks. |
| `ARC_KIT_WEBHOOK_URL` | `ARC_KIT_WEBHOOK_URL` | ⚠️ Arc Kit integration webhook endpoint URL. |

### AI

| Replit Name | Fly.io Secret Name | Notes |
|---|---|---|
| `XAI_API_KEY` | `XAI_API_KEY` | ⚠️ xAI (Grok) API key — used by `xaiClient.ts`. |

> **Note on OpenAI / OpenRouter:** These are configured via the Replit AI Integrations proxy (`REPLIT_CONNECTORS_HOSTNAME`). On Fly.io, configure directly: set `OPENAI_API_KEY` or `OPENROUTER_API_KEY` as Fly.io secrets. Review `lib/integrations-openai-ai-server` for the exact env var name it reads.

### Object Storage

| Replit Name | Fly.io Secret Name | Notes |
|---|---|---|
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | `GCS_BUCKET_NAME` | ⚠️ Google Cloud Storage bucket. Replit wraps GCS; on Fly.io, configure GCS directly with a service account key (`GOOGLE_APPLICATION_CREDENTIALS` or `GOOGLE_SERVICE_ACCOUNT_JSON`). |
| `PRIVATE_OBJECT_DIR` | `PRIVATE_OBJECT_DIR` | ⚠️ Prefix for private objects in the bucket. |
| `PUBLIC_OBJECT_SEARCH_PATHS` | `PUBLIC_OBJECT_SEARCH_PATHS` | ⚠️ Comma-separated public object path prefixes. |

### Content Ingestion

| Replit Name | Fly.io Secret Name | Notes |
|---|---|---|
| `TSP_FEED_URL` | `TSP_FEED_URL` | ✅ TSP RSS feed URL. Currently `https://www.thesurvivalpodcast.com/feed/mp3`. |
| `LISTEN_NOTES_API_KEY` | `LISTEN_NOTES_API_KEY` | ⚠️ Listen Notes podcast API key. |

### Server Config

| Replit Name | Fly.io Secret Name | Notes |
|---|---|---|
| `PORT` | Set in `fly.toml [env]` | ✅ Set to `8080` in fly.toml — do not override via secrets. |
| `NODE_ENV` | Set in `fly.toml [env]` | ✅ Set to `production` in fly.toml. |
| `LOG_LEVEL` | `LOG_LEVEL` | ⚠️ Pino log level. Default `info` is set in fly.toml. Override via secret to `debug` for incident investigation. |
| `SHARE_DEDUP_SECONDS` | `SHARE_DEDUP_SECONDS` | ⚠️ Deduplication window for share events (seconds). Defaults to 30 if unset. |
| `HEADWATERS_DEV_PORT` | 📝 Omit | 📝 Dev-only — Vite HMR proxy port for Headwaters. Not used in production. |
| `WEB_REPL_RENEWAL` | ❌ Omit | ❌ Replit-internal. |
| `COURSE` | ⚠️ `COURSE` | Feature flag. Copy value if set. |
| `XRP_USD_RATE` | ❌ Omit | Cached value populated at runtime by `startXrpRateRefresh()`. Not a secret. |

---

## Web Frontends → Cloudflare Pages / Vercel Environment Variables

Each frontend is a static Vite SPA. Environment variables must be prefixed `VITE_` to be inlined at build time.

Set these as **Cloudflare Pages environment variables** (build settings) or **Vercel environment variables**.

| Variable | All Frontends | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `https://thestompingpaths.com/api` | API base URL for fetch calls. Set at build time. |
| `BASE_PATH` | Per-artifact (see below) | Build-time only — used by Vite config. Not a `VITE_` prefixed var. |

### Per-artifact `BASE_PATH` values

| Artifact | `BASE_PATH` |
|---|---|
| `artifacts/stomping-paths` | `/` |
| `artifacts/headwaters` | `/headwaters/` |
| `artifacts/codetry` | `/codetry/` |
| `artifacts/privacy-guide` | `/privacy-guide/` |

> **Note:** `BASE_PATH` is a build-time Vite config var, not a runtime browser env var. It is consumed by `vite.config.ts` as `process.env.BASE_PATH`, not `import.meta.env.VITE_BASE_PATH`. It must be set in the CI/CD build step environment, not in the Cloudflare/Vercel runtime env vars panel.

---

## Neon — No Additional Env Vars

Neon is a managed Postgres service. The only credential is the connection string (`DATABASE_URL`). There are no additional SDK env vars beyond the standard PostgreSQL connection string.

---

## Variables NOT to Migrate

These Replit-internal variables have no equivalent on the new stack and should be **omitted entirely**:

- `REPL_ID`
- `REPL_IDENTITY`
- `REPLIT_CONNECTORS_HOSTNAME`
- `REPLIT_DEPLOYMENT`
- `REPLIT_DOMAINS`
- `WEB_REPL_RENEWAL`
- `HEADWATERS_DEV_PORT`
- `STRIPE_WEBHOOK_SECRET_FALLBACK`
- `XRP_USD_RATE` (runtime-populated, not a secret)
