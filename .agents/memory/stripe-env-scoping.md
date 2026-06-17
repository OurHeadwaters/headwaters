---
name: Stripe env var scoping
description: KIT_STRIPE_PRICE_IDS must be environment-scoped (dev=test IDs, prod=live IDs). Never use shared. Webhook secret stored as STRIPE_WEBHOOK_SECRET Replit Secret.
---

## Rule
`KIT_STRIPE_PRICE_IDS` must **never** be in the `shared` environment. It must be scoped:
- `development` environment → test-mode price IDs (`price_1TjOR…`)
- `production` environment → live-mode price IDs (created on first redeploy without the override)

**Why:** The dev Stripe connection uses `sk_test_…`; production uses `sk_live_…`. Test-mode price IDs are invisible to live-mode API keys — sharing the env var causes "No such price" errors in production checkout.

## How to apply
When any task touches KIT_STRIPE_PRICE_IDS, always verify it is in the correct scoped environment, not in `shared`.

After the next production redeploy (without the env var set), `ensureKitProducts()` will auto-create live prices and log:
```
kit-products: copy KIT_STRIPE_PRICE_IDS above into the PRODUCTION environment variable
```
Copy that JSON into the `production` environment (not Replit Secrets, not shared).

## Live webhook endpoint (registered June 2026)
Endpoint ID: `we_1TjR30DxDmIHquL0GLboFe71`
URL: `https://thestompingpaths.com/api/stripe/webhook`
Events: `checkout.session.completed`, `customer.subscription.created/updated/deleted`

The Replit Stripe integration's production connection has no `webhook_secret` field — secrets can't be added to it through the UI. Instead:

**Fix used:** `STRIPE_WEBHOOK_SECRET` Replit Secret (global, available in production).

`stripeClient.ts → getStripeCredentials()` resolution order:
1. `settings.webhook_secret` from integration connection (preferred, not currently populated)
2. `STRIPE_WEBHOOK_SECRET` env var / Replit Secret (production fallback — this is what's used)
3. `STRIPE_WEBHOOK_SECRET_FALLBACK` (dev only, for `stripe listen`)

**Why:** The Integrations UI for Stripe only exposes `secret` and `publishable` fields — there is no `webhook_secret` field in the production connection settings. Replit Secrets (global) is the correct workaround.

Note: `ensureKitProducts()` runs independently of webhook init — it only needs the Stripe secret key, not the webhook secret, so kit prices can still be created/found even when webhook init fails.
