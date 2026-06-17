/**
 * Zaprite webhook handler — Bitcoin / Lightning / XRP / RLUSD payments.
 *
 * Zaprite does not provide HMAC signing secrets. Instead, we secure the
 * endpoint with a secret token in the URL query string:
 *
 *   POST /api/zaprite/webhook?token=<ZAPRITE_WEBHOOK_TOKEN>
 *
 * Configure that full URL as your webhook endpoint in Zaprite's dashboard
 * (Settings → API → Webhooks). Anyone who doesn't know the token gets a 401.
 *
 * On a successful "order.change" event with status "completed" we:
 *   1. Verify the URL token matches ZAPRITE_WEBHOOK_TOKEN
 *   2. Extract kit_slug from the order metadata
 *   3. Insert a row into kit_purchases (idempotent via zaprite_order_id unique)
 *   4. Send the welcome email
 *
 * Zaprite webhook docs: https://zaprite.com/docs/webhooks
 */

import type { Request, Response } from "express";
import { db, kitPurchasesTable } from "@workspace/db";
import { logger } from "./lib/logger";
import { sendKitWelcomeEmail } from "./lib/email";
import { kitBySlug } from "./lib/kits";

interface ZapriteOrderPayload {
  event: string;
  order: {
    id: string;
    status: string;
    amountSats?: number;
    amountUsd?: number;
    currency?: string;
    customerEmail?: string;
    customerName?: string;
    /** Zaprite metadata key-value map (set via payment link custom fields) */
    metadata?: Record<string, string>;
    /** Zaprite custom fields array — alternate shape some versions use */
    customFields?: Array<{ name: string; value: string }>;
    /** Free-text reference / note the buyer or merchant sets */
    reference?: string;
    note?: string;
    /** The payment link URL — we parse kit_slug from query params as fallback */
    paymentLinkUrl?: string;
    returnUrl?: string;
  };
}

/** Extract kit_slug from all the places Zaprite might put it */
function extractKitSlug(order: ZapriteOrderPayload["order"]): string | null {
  // 1. Flat metadata map
  if (order.metadata?.kit_slug) return order.metadata.kit_slug;

  // 2. Custom fields array
  if (Array.isArray(order.customFields)) {
    const field = order.customFields.find(
      (f) => f.name === "kit_slug" || f.name === "kit",
    );
    if (field?.value) return field.value;
  }

  // 3. Reference / note field (buyer typed it in)
  const ref = order.reference ?? order.note ?? "";
  if (ref && ref.endsWith("-kit")) return ref.trim();

  // 4. Parse from payment link URL query params (our ?kit_slug=xxx fallback)
  for (const urlStr of [order.paymentLinkUrl, order.returnUrl]) {
    if (!urlStr) continue;
    try {
      const u = new URL(urlStr);
      const slug = u.searchParams.get("kit_slug");
      if (slug) return slug;
    } catch {
      // not a valid URL, skip
    }
  }

  return null;
}

export async function handleZapriteWebhook(req: Request, res: Response): Promise<void> {
  const expectedToken = process.env.ZAPRITE_WEBHOOK_TOKEN;

  // Token is required. Without it, any caller could forge a purchase event.
  // To set up: generate any long random string (e.g. openssl rand -hex 32),
  // save it as ZAPRITE_WEBHOOK_TOKEN in Replit Secrets, then configure your
  // Zaprite webhook URL as:
  //   https://<your-domain>/api/zaprite/webhook?token=<that-value>
  if (!expectedToken) {
    logger.error(
      "zaprite webhook: ZAPRITE_WEBHOOK_TOKEN is not set — rejecting all webhook calls. " +
        "Set it in Replit Secrets and add ?token=<value> to your Zaprite webhook URL.",
    );
    res.status(503).json({
      error: "Webhook endpoint not yet configured — ZAPRITE_WEBHOOK_TOKEN missing.",
    });
    return;
  }

  const providedToken = req.query["token"] as string | undefined;
  if (!providedToken || providedToken !== expectedToken) {
    logger.warn("zaprite webhook: invalid or missing token — rejecting");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let payload: ZapriteOrderPayload;
  try {
    const rawBody = req.body as Buffer;
    payload = JSON.parse(rawBody.toString()) as ZapriteOrderPayload;
  } catch {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  // Zaprite sends "order.change" for all order state transitions.
  // We only care about fully completed/paid orders.
  const isOrderEvent = payload.event === "order.change" || payload.event === "order.completed";
  if (!isOrderEvent) {
    res.status(200).json({ received: true, skipped: true });
    return;
  }

  const { order } = payload;

  if (order.status !== "completed") {
    res.status(200).json({ received: true, skipped: true });
    return;
  }

  const kitSlug = extractKitSlug(order);
  if (!kitSlug) {
    logger.warn({ orderId: order.id }, "zaprite webhook: could not determine kit_slug — skipping");
    res.status(200).json({ received: true, skipped: true });
    return;
  }

  // Validate that the slug resolves to a real kit — rejects spoofed payloads
  // that reference non-existent kits.
  const kit = kitBySlug(kitSlug);
  if (!kit) {
    logger.warn({ orderId: order.id, kitSlug }, "zaprite webhook: unknown kit_slug — rejecting");
    res.status(400).json({ error: "Unknown kit" });
    return;
  }

  const buyerEmail = order.customerEmail ?? null;
  const buyerName = order.customerName ?? null;

  if (!buyerEmail) {
    logger.warn({ orderId: order.id, kitSlug }, "zaprite webhook: no customer email — skipping");
    res.status(200).json({ received: true, skipped: true });
    return;
  }

  // Basic email format check — rejects obviously malformed payloads.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(buyerEmail)) {
    logger.warn({ orderId: order.id, kitSlug, buyerEmail }, "zaprite webhook: invalid buyer email format — skipping");
    res.status(200).json({ received: true, skipped: true });
    return;
  }

  const amountPaidCents = order.amountUsd
    ? Math.round(order.amountUsd * 100)
    : 0;

  try {
    const [inserted] = await db
      .insert(kitPurchasesTable)
      .values({
        kitSlug,
        buyerEmail: buyerEmail.toLowerCase(),
        buyerName: buyerName ?? null,
        stripeCheckoutSessionId: `zaprite_${order.id}`,
        amountPaidCents,
      })
      .onConflictDoNothing()
      .returning();

    if (inserted) {
      logger.info(
        { kitSlug, buyerEmail, amountPaidCents, orderId: order.id },
        "zaprite webhook: kit purchase recorded",
      );

      await sendKitWelcomeEmail({
        buyerEmail,
        buyerName,
        kitName: kit?.name ?? kitSlug,
        kitSlug,
        userManual: kit?.userManual,
        accessUrl: kit?.accessUrl,
      });
    } else {
      logger.info(
        { orderId: order.id, kitSlug },
        "zaprite webhook: duplicate order, skipped (idempotent)",
      );
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error({ err, orderId: order.id, kitSlug }, "zaprite webhook: DB insert failed");
    res.status(500).json({ error: "Internal error" });
  }
}
