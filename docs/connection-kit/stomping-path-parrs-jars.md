# Connection Kit: Parr's Jars ↔ The Stomping Path API

This document gives the parrsjars.ca storefront everything it needs to notify
the Stomping Path API after a purchase so the buyer's access is recorded and
the welcome email fires automatically.

---

## Overview

When a buyer purchases the Parr's Jars course on the parrsjars.ca storefront,
the storefront posts a webhook to this API. The API records the purchase and
sends the buyer a welcome email containing a one-click link to the course.

---

## Webhook endpoint

```
POST https://<stomping-path-domain>/api/zaprite/webhook?token=<ZAPRITE_WEBHOOK_TOKEN>
```

The token is appended as a URL query parameter, not a header. Anyone who
calls the endpoint without the correct token receives a `401 Unauthorized`.

### How to find the domain

The live API runs at the Stomping Path's deployed domain. In development you
can use the Replit preview URL. Either way, append `/api/zaprite/webhook?token=…`
to whatever base URL you are pointing at.

---

## Required environment variable

| Variable | Where to set it | What it does |
|---|---|---|
| `ZAPRITE_WEBHOOK_TOKEN` | Replit Secrets on the API project | Shared secret that authenticates the storefront webhook call. Both sides must have the same value. |

**To generate a token** (run once, save in both projects):

```bash
openssl rand -hex 32
```

Copy the output. Save it as `ZAPRITE_WEBHOOK_TOKEN` in Replit Secrets on the
API project, and use the same value when constructing the webhook URL on the
storefront side.

---

## Kit slug

The kit slug for Parr's Jars is:

```
parrs-jars
```

This slug must appear in the webhook payload (see below). The API uses it to
look up the kit, record the purchase, and send the correct welcome email.

---

## Request format

Send a `POST` request with a JSON body. `Content-Type: application/json` is
required.

```http
POST /api/zaprite/webhook?token=<ZAPRITE_WEBHOOK_TOKEN>
Content-Type: application/json
```

```json
{
  "event": "order.completed",
  "order": {
    "id": "<unique-order-id-from-your-platform>",
    "status": "completed",
    "amountUsd": 97.00,
    "customerEmail": "buyer@example.com",
    "customerName": "Jane Smith",
    "metadata": {
      "kit_slug": "parrs-jars"
    }
  }
}
```

### Field reference

| Field | Type | Required | Notes |
|---|---|---|---|
| `event` | string | yes | Must be `"order.completed"` or `"order.change"`. Any other value is acknowledged and ignored. |
| `order.id` | string | yes | Your platform's unique order ID. Used for idempotency — a second call with the same ID is silently skipped. |
| `order.status` | string | yes | Must be `"completed"`. Orders with any other status are acknowledged and ignored. |
| `order.amountUsd` | number | no | Amount paid in USD (e.g. `97.00`). Stored for reporting. |
| `order.customerEmail` | string | yes | Buyer's email address. The welcome email is sent here. If missing, the purchase is not recorded. |
| `order.customerName` | string | no | Buyer's display name. Used in the welcome email greeting. |
| `order.metadata.kit_slug` | string | yes | Must be `"parrs-jars"`. This is how the API identifies which product was purchased. |

### Alternative kit_slug locations

If your platform cannot send a `metadata` map, the API will also accept the
slug in these locations (checked in order):

1. `order.metadata.kit_slug` — preferred
2. `order.customFields` array — `{ "name": "kit_slug", "value": "parrs-jars" }`
3. `order.paymentLinkUrl` query parameter — `?kit_slug=parrs-jars` in the URL

---

## Response format

| Status | Body | Meaning |
|---|---|---|
| `200` | `{ "received": true }` | Purchase recorded and welcome email sent |
| `200` | `{ "received": true, "skipped": true }` | Duplicate order ID — already recorded, no action taken |
| `400` | `{ "error": "Unknown kit" }` | The `kit_slug` value does not match any registered kit |
| `400` | `{ "error": "Invalid JSON body" }` | Malformed request body |
| `401` | `{ "error": "Unauthorized" }` | Missing or incorrect `token` query parameter |
| `503` | `{ "error": "Webhook endpoint not yet configured…" }` | `ZAPRITE_WEBHOOK_TOKEN` is not set on the API server |

---

## Worked example

A buyer completes a $97 purchase on parrsjars.ca. The storefront fires:

```http
POST https://stomping-paths.example.com/api/zaprite/webhook?token=abc123def456
Content-Type: application/json

{
  "event": "order.completed",
  "order": {
    "id": "order_9f3a2b1c",
    "status": "completed",
    "amountUsd": 97.00,
    "customerEmail": "jane@example.com",
    "customerName": "Jane Smith",
    "metadata": {
      "kit_slug": "parrs-jars"
    }
  }
}
```

The API responds:

```json
{ "received": true }
```

Behind the scenes:
1. Token verified against `ZAPRITE_WEBHOOK_TOKEN`
2. `kit_slug` resolved to the `parrs-jars` kit definition
3. Purchase row inserted into `kit_purchases` (idempotent on `order_9f3a2b1c`)
4. Welcome email sent to `jane@example.com`

---

## Buyer access flow (end to end)

```
Buyer pays on parrsjars.ca
        ↓
Storefront POSTs to /api/zaprite/webhook?token=…
        ↓
API records purchase in kit_purchases table
        ↓
API sends welcome email to buyer
  — subject: "You're in — here's your Parr's Jars course access"
  — body includes a one-click access button
        ↓
Buyer clicks button → lands at COURSE1_ACCESS_URL
```

### The `COURSE1_ACCESS_URL` environment variable

| Variable | Where to set it | What it controls |
|---|---|---|
| `COURSE1_ACCESS_URL` | Replit Secrets on the API project | The URL buyers are sent to after purchase. Set this to the course platform URL (e.g. a Teachable/Kajabi/hosted video page) where the Parr's Jars sessions live. |

If `COURSE1_ACCESS_URL` is not set, the welcome email button falls back to
the generic `/kits/parrs-jars/welcome` page on the Stomping Path storefront,
which confirms the purchase but does not give direct course access.

---

## Bitcoin / Lightning checkout (Zaprite payment links)

The Stomping Path kit detail page at `/kits/parrs-jars` also shows a
**Pay with Bitcoin / Lightning / XRP** button that opens:

```
https://pay.zaprite.com/pl_SIz91erI6c?kit_slug=parrs-jars
```

This is a Zaprite-hosted payment page. When the buyer completes payment,
Zaprite fires its own webhook to the same endpoint above — no additional
storefront integration is needed for the Bitcoin path. The `kit_slug=parrs-jars`
query parameter on the payment link URL is the fallback slug extraction method,
so even if Zaprite does not send a `metadata` block the correct kit will be
identified.

**To activate the Zaprite webhook**, log in to Zaprite → Settings → API →
Webhooks and add:

```
https://<stomping-path-domain>/api/zaprite/webhook?token=<ZAPRITE_WEBHOOK_TOKEN>
```

---

## Checklist before going live

- [ ] `ZAPRITE_WEBHOOK_TOKEN` set in Replit Secrets (API project)
- [ ] `COURSE1_ACCESS_URL` set in Replit Secrets (API project) pointing to the live course
- [ ] Zaprite webhook URL configured in Zaprite dashboard (for Bitcoin payments)
- [ ] Storefront webhook URL configured with the same token
- [ ] Test purchase fired end-to-end with a real email address — confirm welcome email arrives and access link works
