# Kit Purchase Webhook — Manual E2E Runbook

Use this runbook to verify the complete kit purchase flow against a **real Stripe
test-mode checkout** when you need confidence beyond the automated integration
tests (e.g. after changing the Stripe product config, adding a new kit slug, or
rotating webhook secrets).

---

## Prerequisites

| What | Where |
|------|-------|
| Stripe test-mode secret key | Replit Secret `STRIPE_SECRET_KEY` (must begin `sk_test_`) |
| Stripe webhook signing secret | Replit Secret `STRIPE_WEBHOOK_SECRET` |
| Stripe test-mode kit price ID | Stripe Dashboard → Products → find the kit → copy the **test-mode** Price ID |
| Resend API key (optional) | Replit Secret `RESEND_API_KEY` — needed only if you want the real email to arrive |
| API server running locally | `pnpm --filter api-server dev` or the workflow in Replit |

---

## Step 1 — Create a real test-mode checkout session

Replace `<KIT_PRICE_ID>` and `<YOUR_SUCCESS_URL>` with real values:

```bash
curl -X POST https://api.stripe.com/v1/checkout/sessions \
  -u "$STRIPE_SECRET_KEY:" \
  -d "line_items[0][price]=<KIT_PRICE_ID>" \
  -d "line_items[0][quantity]=1" \
  -d "mode=payment" \
  -d "success_url=<YOUR_SUCCESS_URL>" \
  -d "metadata[kit_slug]=family-kit" \
  -d "customer_email=you+test@example.com"
```

Open the `url` from the response in a browser and complete the checkout using
Stripe test card `4242 4242 4242 4242` (any future expiry, any CVC).

---

## Step 2 — Forward the webhook to your local server (Stripe CLI)

```bash
stripe listen \
  --forward-to localhost:$PORT/api/stripe/webhook \
  --events checkout.session.completed
```

The CLI will print a `whsec_…` signing secret — paste it into `STRIPE_WEBHOOK_SECRET`
if it differs from what is already set.

---

## Step 3 — Verify the DB row

After the checkout completes, query the `kit_purchases` table:

```sql
SELECT id, kit_slug, buyer_email, buyer_name, amount_paid_cents,
       stripe_checkout_session_id, purchased_at
FROM   kit_purchases
WHERE  buyer_email = 'you+test@example.com'
ORDER  BY purchased_at DESC
LIMIT  5;
```

**Expected result:**

| Column | Expected value |
|--------|---------------|
| `kit_slug` | `family-kit` (or whichever slug you passed in metadata) |
| `buyer_email` | `you+test@example.com` (lower-cased) |
| `amount_paid_cents` | price in cents, e.g. `12700` for $127 |
| `stripe_checkout_session_id` | `cs_test_…` matching the session from Step 1 |
| `purchased_at` | timestamp close to now |

---

## Step 4 — Verify the welcome email

Check the logs for:

```
kit purchase webhook: welcome email sent
```

If `RESEND_API_KEY` is configured and not in test mode, the email will arrive in the
inbox at the address you used. If you want to verify without sending a real email,
check the Resend dashboard (Logs tab) for a delivery record to `you+test@example.com`.

---

## Step 5 — Verify idempotency

Re-send the same event using the Stripe CLI:

```bash
stripe events resend <EVT_ID>
```

Confirm no second row appears in `kit_purchases` for that `stripe_checkout_session_id`,
and no second welcome email is logged.

---

## Cleanup

Delete the test row before committing or sharing the DB:

```sql
DELETE FROM kit_purchases WHERE buyer_email = 'you+test@example.com';
```
