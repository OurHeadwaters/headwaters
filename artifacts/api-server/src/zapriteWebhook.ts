/**
 * Zaprite webhook handler — Bitcoin / Lightning / XRP / RLUSD payments.
 *
 * Zaprite sends a POST with JSON body and an HMAC-SHA256 signature in the
 * X-Zaprite-Signature header (hex-encoded, keyed on ZAPRITE_WEBHOOK_SECRET).
 *
 * On a successful "order.completed" event we:
 *   1. Verify the signature (if ZAPRITE_WEBHOOK_SECRET is set)
 *   2. Extract kit_slug from the order metadata
 *   3. Insert a row into kit_purchases (idempotent via zaprite_order_id unique)
 *   4. Send the welcome email
 *
 * Zaprite webhook docs: https://zaprite.com/docs/webhooks
 */

import crypto from "crypto";
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

function verifySignature(rawBody: Buffer, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export async function handleZapriteWebhook(req: Request, res: Response): Promise<void> {
  const rawBody = req.body as Buffer;
  const signature = req.headers["x-zaprite-signature"] as string | undefined;
  const secret = process.env.ZAPRITE_WEBHOOK_SECRET;

  // Signature verification is required. Without ZAPRITE_WEBHOOK_SECRET any caller
  // could forge a purchase event — we fail closed so no fraudulent inserts occur.
  // To obtain the secret: contact Zaprite support and ask for the signing secret
  // for your webhook endpoint. Set it as ZAPRITE_WEBHOOK_SECRET in Replit Secrets.
  if (!secret) {
    logger.error(
      "zaprite webhook: ZAPRITE_WEBHOOK_SECRET is not set — rejecting all webhook calls. " +
        "Contact Zaprite support to obtain the signing secret for your webhook endpoint, " +
        "then set it in Replit Secrets as ZAPRITE_WEBHOOK_SECRET.",
    );
    res.status(503).json({
      error: "Webhook endpoint not yet configured — ZAPRITE_WEBHOOK_SECRET missing.",
    });
    return;
  }

  if (!signature) {
    logger.warn("zaprite webhook: missing X-Zaprite-Signature header — rejecting");
    res.status(401).json({ error: "Missing signature" });
    return;
  }

  if (!verifySignature(rawBody, signature, secret)) {
    logger.warn("zaprite webhook: invalid signature — rejecting");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  let payload: ZapriteOrderPayload;
  try {
    payload = JSON.parse(rawBody.toString()) as ZapriteOrderPayload;
  } catch {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  if (payload.event !== "order.completed") {
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
  // that reference non-existent kits (defense-in-depth when no signing secret).
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

      const kit = kitBySlug(kitSlug);
      await sendKitWelcomeEmail({
        buyerEmail,
        buyerName,
        kitName: kit?.name ?? kitSlug,
        kitSlug,
        userManual: kit?.userManual,
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
