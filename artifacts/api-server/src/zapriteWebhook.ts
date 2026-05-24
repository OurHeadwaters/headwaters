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
    metadata?: Record<string, string>;
  };
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

  if (secret && signature) {
    if (!verifySignature(rawBody, signature, secret)) {
      logger.warn("zaprite webhook: invalid signature — rejecting");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }
  } else if (secret && !signature) {
    logger.warn("zaprite webhook: missing X-Zaprite-Signature header");
    res.status(401).json({ error: "Missing signature" });
    return;
  } else {
    logger.warn("zaprite webhook: ZAPRITE_WEBHOOK_SECRET not set — skipping signature check");
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

  const kitSlug = order.metadata?.kit_slug;
  if (!kitSlug) {
    logger.warn({ orderId: order.id }, "zaprite webhook: no kit_slug in order metadata — skipping");
    res.status(200).json({ received: true, skipped: true });
    return;
  }

  const buyerEmail = order.customerEmail ?? null;
  const buyerName = order.customerName ?? null;

  if (!buyerEmail) {
    logger.warn({ orderId: order.id, kitSlug }, "zaprite webhook: no customer email — skipping");
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
