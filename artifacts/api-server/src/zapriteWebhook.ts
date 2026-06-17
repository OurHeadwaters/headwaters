/**
 * Zaprite webhook handler — Bitcoin / Lightning / XRP / RLUSD payments.
 *
 * SECURITY MODEL:
 * Zaprite confirmed (via support) that they do not sign webhook payloads:
 * "There is no webhook secret. Our payloads do not contain sensitive
 * information, they are just notifications."
 *
 * Because there is no signing secret, we cannot do HMAC verification.
 * Instead we defend in three layers:
 *
 *   1. Payload validation — we only process order events where status ===
 *      "completed", the kit_slug resolves to a known kit, and the customer
 *      email is well-formed.
 *
 *   2. API verification (optional, enhanced) — if ZAPRITE_API_KEY is set, we
 *      re-fetch the order from the Zaprite API to confirm its status before
 *      inserting. Set it via Replit Secrets once you have a key from
 *      Zaprite Settings → API Keys.
 *
 *   3. Idempotency — the zaprite_order_id unique constraint means a duplicate
 *      or replayed webhook for the same order is silently ignored.
 *
 * Zaprite sends both "order.change" (all transitions) and "order.completed"
 * events — we accept either and check status === "completed" ourselves.
 *
 * Zaprite webhook docs: https://zaprite.com/docs/webhooks
 */

import type { Request, Response } from "express";
import { db, kitPurchasesTable } from "@workspace/db";
import { logger } from "./lib/logger";
import { sendKitWelcomeEmail, sendKitPurchaseAdminNotification } from "./lib/email";
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
    customFields?: Array<{ name: string; value: string }>;
    reference?: string;
    note?: string;
    paymentLinkUrl?: string;
    returnUrl?: string;
  };
}

/** Attempt to re-fetch the order from the Zaprite API for extra assurance. */
async function tryFetchZapriteOrder(
  orderId: string,
  apiKey: string,
): Promise<{ status?: string } | null> {
  try {
    const res = await fetch(`https://api.zaprite.com/v1/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      logger.warn(
        { orderId, status: res.status },
        "zaprite webhook: API verification returned non-200; falling back to payload",
      );
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = (await res.json()) as any;
    return json?.order ?? json?.data ?? json ?? null;
  } catch (err) {
    logger.warn(
      { err, orderId },
      "zaprite webhook: API fetch failed; falling back to payload",
    );
    return null;
  }
}

/** Extract kit_slug from all the places Zaprite might put it */
function extractKitSlug(order: ZapriteOrderPayload["order"]): string | null {
  if (order.metadata?.kit_slug) return order.metadata.kit_slug;

  if (Array.isArray(order.customFields)) {
    const field = order.customFields.find(
      (f) => f.name === "kit_slug" || f.name === "kit",
    );
    if (field?.value) return field.value;
  }

  const ref = order.reference ?? order.note ?? "";
  if (ref && ref.endsWith("-kit")) return ref.trim();

  for (const urlStr of [order.paymentLinkUrl, order.returnUrl]) {
    if (!urlStr) continue;
    try {
      const u = new URL(urlStr);
      const slug = u.searchParams.get("kit_slug");
      if (slug) return slug;
    } catch {
      // not a valid URL
    }
  }

  return null;
}

export async function handleZapriteWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  // Parse the incoming notification
  let payload: ZapriteOrderPayload;
  try {
    const body = req.body as Buffer | Record<string, unknown>;
    const raw = Buffer.isBuffer(body) ? body.toString() : JSON.stringify(body);
    payload = JSON.parse(raw) as ZapriteOrderPayload;
  } catch {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  // Zaprite sends "order.change" for all transitions and "order.completed" on finish.
  const isOrderEvent =
    payload.event === "order.change" || payload.event === "order.completed";
  if (!isOrderEvent) {
    res.status(200).json({ received: true, skipped: true });
    return;
  }

  const { order } = payload;

  if (!order?.id) {
    logger.warn("zaprite webhook: notification missing order ID — skipping");
    res.status(200).json({ received: true, skipped: true });
    return;
  }

  // ── Optional: API verification ─────────────────────────────────────────────
  // If ZAPRITE_API_KEY is configured, re-fetch the order from Zaprite's API
  // to confirm its status independently of the notification payload.
  const apiKey = process.env.ZAPRITE_API_KEY;
  let verifiedStatus: string = order.status;

  if (apiKey) {
    const apiOrder = await tryFetchZapriteOrder(order.id, apiKey);
    if (apiOrder?.status) {
      verifiedStatus = apiOrder.status as string;
      logger.info(
        { orderId: order.id, verifiedStatus },
        "zaprite webhook: order status confirmed via API",
      );
    }
  } else {
    logger.warn(
      "zaprite webhook: ZAPRITE_API_KEY not set — processing from payload without API verification. " +
        "Set ZAPRITE_API_KEY in Replit Secrets (Zaprite Settings → API Keys) for enhanced security.",
    );
  }

  if (verifiedStatus !== "completed") {
    logger.info(
      { orderId: order.id, verifiedStatus },
      "zaprite webhook: order not completed — skipping",
    );
    res.status(200).json({ received: true, skipped: true });
    return;
  }

  const kitSlug = extractKitSlug(order);
  if (!kitSlug) {
    logger.warn(
      { orderId: order.id },
      "zaprite webhook: could not determine kit_slug — skipping",
    );
    res.status(200).json({ received: true, skipped: true });
    return;
  }

  // Validate that the slug resolves to a real kit — rejects spoofed payloads
  // that reference non-existent kits.
  const kit = kitBySlug(kitSlug);
  if (!kit) {
    logger.warn(
      { orderId: order.id, kitSlug },
      "zaprite webhook: unknown kit_slug — rejecting",
    );
    res.status(400).json({ error: "Unknown kit" });
    return;
  }

  const buyerEmail = order.customerEmail ?? null;
  const buyerName = order.customerName ?? null;

  if (!buyerEmail) {
    logger.warn(
      { orderId: order.id, kitSlug },
      "zaprite webhook: no customer email — skipping",
    );
    res.status(200).json({ received: true, skipped: true });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(buyerEmail)) {
    logger.warn(
      { orderId: order.id, kitSlug, buyerEmail },
      "zaprite webhook: invalid buyer email format — skipping",
    );
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

      const welcomeResult = await sendKitWelcomeEmail({
        buyerEmail,
        buyerName,
        kitName: kit.name ?? kitSlug,
        kitSlug,
        userManual: kit?.userManual,
        accessUrl: kit?.accessUrl,
      });

      sendKitPurchaseAdminNotification({
        kitName: kit?.name ?? kitSlug,
        kitSlug,
        buyerEmail,
        buyerName,
        amountPaidCents,
        paymentMethod: "zaprite",
        welcomeEmailSent: welcomeResult.sent,
        welcomeEmailError: welcomeResult.error,
      }).catch((err) =>
        logger.warn({ err, kitSlug }, "zaprite webhook: purchase admin notification failed (non-fatal)"),
      );
    } else {
      logger.info(
        { orderId: order.id, kitSlug },
        "zaprite webhook: duplicate order, skipped (idempotent)",
      );
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error(
      { err, orderId: order.id, kitSlug },
      "zaprite webhook: DB insert failed",
    );
    res.status(500).json({ error: "Internal error" });
  }
}
