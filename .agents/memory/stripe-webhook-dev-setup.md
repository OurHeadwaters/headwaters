---
name: Stripe webhook dev setup
description: How Stripe webhook verification works in this project's dev environment, and the patterns used to make it work when stripe-replit-sync can't sync.
---

## Problem
The Replit Stripe integration dev connection has a `secret` key but no `webhook_secret`. Without it, `getStripeSync().processWebhook()` verifies signatures against an empty string and always rejects real webhooks.

## Solution: STRIPE_WEBHOOK_SECRET_FALLBACK
`stripeClient.ts → getStripeCredentials()` now falls back to `process.env.STRIPE_WEBHOOK_SECRET_FALLBACK` when `settings.webhook_secret` is absent **and** `!isProduction`. Production remains guarded — missing webhook_secret still throws in prod.

To set up dev webhook verification:
1. Register a Stripe webhook endpoint via the Stripe API or Dashboard pointing at `https://{REPLIT_DEV_DOMAIN}/api/stripe/webhook` with event `checkout.session.completed`.
2. Copy the `whsec_…` signing secret.
3. Set `STRIPE_WEBHOOK_SECRET_FALLBACK=whsec_…` in Replit Secrets.

A webhook endpoint (`we_1TjMrpPd6A0oJ5bAJ8EeMIfm`) is already registered for the dev Replit domain (as of June 2026). If the domain changes, delete and re-register.

## stripe-replit-sync isolation
`stripe-replit-sync`'s `processWebhook` tries to upsert into `stripe.accounts` which doesn't exist in this project's DB. The library errors after signature verification succeeds.

**Fix: `verifyAndParseWebhookEvent(payload, signature)` in stripeClient.ts**
Uses `stripe.webhooks.constructEvent()` directly — verifies HMAC, returns the parsed event, throws `StripeSignatureVerificationError` on bad signatures. This is the security gate.

`WebhookHandlers.processWebhook` now:
1. Calls `verifyAndParseWebhookEvent` (throws on bad signature — propagates as 400)
2. Fires stripe-replit-sync in a non-blocking `.catch()` (best-effort background sync; `stripe.accounts` error logged as WARN, never blocks fulfillment)
3. Processes the verified event

**Why:** Keeping signature verification and DB sync separate means a missing `stripe.accounts` table never silently drops purchases.

## Admin endpoint auth
`/admin/kit-purchases` uses `requireEditor` middleware. In dev (no session), pass `x-admin-secret: <ADMIN_SECRET>` header. Set `ADMIN_SECRET` in Replit Secrets to enable this path.

## Smoke test results (June 2026)
- Stripe: webhook → DB (stripe_checkout_session_id=cs_test_a1toki2…), welcome email sent, access `{hasAccess:true,tokenVerified:true}`, idempotency confirmed
- Zaprite: webhook → DB (stripe_checkout_session_id=zaprite_zaprite_smoke_…), welcome email sent, access `{hasAccess:true,tokenVerified:true}`
- Admin: `/admin/kit-purchases` → total:2, both rows visible
- COURSE1_ACCESS_URL: `https://northern-store-plan.replit.app/print-marketing/pj-kit` (in kit data)

## Kit access token format
`generateKitAccessToken(kitSlug, email)` → HMAC-SHA256 of `"${kitSlug}:${email.toLowerCase()}"` using `KIT_ACCESS_SECRET ?? RESEND_API_KEY`. Note: kitSlug comes **first** (not email).
