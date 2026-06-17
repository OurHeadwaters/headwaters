---
name: Stripe env var scoping
description: KIT_STRIPE_PRICE_IDS must be environment-scoped (dev=test IDs, prod=live IDs). Never use shared. Production webhook secret is missing — blocks purchase activation.
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

## Production webhook secret — MISSING (as of June 2026)
Production deployment logs show:
> STRIPE PRODUCTION ERROR: Webhook secret is missing from the production Stripe integration connection.

`initStripe()` catches this and logs "initialisation skipped" — meaning:
- No managed webhook is registered/verified in live mode
- Incoming `checkout.session.completed` webhooks are rejected (signature verification fails with empty secret)
- Purchases never activate: no welcome email, no kit access token, no DB row

Fix: Add a live webhook endpoint in the Stripe Dashboard pointing at `https://thestompingpaths.com/api/stripe/webhook`, copy the `whsec_…` signing secret, and save it to Integrations → Stripe → Production environment connection.

Note: `ensureKitProducts()` runs independently of `initStripe()` — it only needs the Stripe secret key, not the webhook secret, so kit prices can still be created/found even when webhook init fails.
