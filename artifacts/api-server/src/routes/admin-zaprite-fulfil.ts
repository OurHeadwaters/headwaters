/**
 * Admin — Manual Zaprite Kit Fulfilment
 *
 * Zaprite does not support outbound webhooks, so Bitcoin / Lightning / XRP
 * payments made through Zaprite payment links cannot auto-record a purchase or
 * send the welcome email.  This route lets the operator manually trigger the
 * same fulfilment flow that a webhook would trigger.
 *
 * POST /api/admin/kit-purchases/zaprite
 *
 * Body (JSON):
 *   buyerEmail     string   required  — buyer's email address
 *   kitSlug        string   required  — kit slug (e.g. "family-kit")
 *   paymentRef     string   required  — Zaprite order / payment reference
 *   buyerName      string   optional  — buyer's display name
 *   amountPaidUsd  number   optional  — amount paid in USD (defaults to 0)
 *
 * Authentication: requireEditor (ADMIN_USER_IDS session OR x-admin-secret header)
 *
 * Response:
 *   201  { recorded: true,  duplicate: false, welcomeEmailSent: boolean }
 *   200  { recorded: false, duplicate: true  }   — idempotent: already recorded
 *   400  { error: string }                        — validation failure
 *   500  { error: string }                        — unexpected server error
 */

import { Router, type IRouter } from "express";
import { db, kitPurchasesTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { requireEditor } from "../middlewares/requireEditor";
import { sendKitWelcomeEmail, sendKitPurchaseAdminNotification } from "../lib/email";
import { kitBySlug } from "../lib/kits";

const router: IRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/admin/kit-purchases/zaprite", requireEditor, async (req, res) => {
  const {
    buyerEmail: rawEmail,
    kitSlug,
    paymentRef,
    buyerName,
    amountPaidUsd,
  } = req.body as {
    buyerEmail?: string;
    kitSlug?: string;
    paymentRef?: string;
    buyerName?: string;
    amountPaidUsd?: number;
  };

  if (!rawEmail || typeof rawEmail !== "string" || !EMAIL_RE.test(rawEmail.trim())) {
    res.status(400).json({ error: "buyerEmail is required and must be a valid email address" });
    return;
  }
  if (!kitSlug || typeof kitSlug !== "string") {
    res.status(400).json({ error: "kitSlug is required" });
    return;
  }
  if (!paymentRef || typeof paymentRef !== "string") {
    res.status(400).json({ error: "paymentRef is required (use the Zaprite order ID or invoice reference)" });
    return;
  }

  const kit = kitBySlug(kitSlug.trim());
  if (!kit) {
    res.status(400).json({ error: `Unknown kit slug: "${kitSlug}"` });
    return;
  }

  const buyerEmail = rawEmail.trim().toLowerCase();
  const name = typeof buyerName === "string" && buyerName.trim() ? buyerName.trim() : null;
  const amountPaidCents = typeof amountPaidUsd === "number" && amountPaidUsd > 0
    ? Math.round(amountPaidUsd * 100)
    : 0;

  const stripeCheckoutSessionId = `zaprite_manual_${paymentRef.trim()}`;

  try {
    const [inserted] = await db
      .insert(kitPurchasesTable)
      .values({
        kitSlug: kit.slug,
        buyerEmail,
        buyerName: name,
        stripeCheckoutSessionId,
        amountPaidCents,
      })
      .onConflictDoNothing()
      .returning();

    if (!inserted) {
      logger.info(
        { kitSlug: kit.slug, buyerEmail, paymentRef },
        "admin-zaprite-fulfil: duplicate — purchase already recorded, skipping",
      );
      res.status(200).json({ recorded: false, duplicate: true });
      return;
    }

    logger.info(
      { kitSlug: kit.slug, buyerEmail, amountPaidCents, paymentRef },
      "admin-zaprite-fulfil: kit purchase recorded",
    );

    const welcomeResult = await sendKitWelcomeEmail({
      buyerEmail,
      buyerName: name,
      kitName: kit.name,
      kitSlug: kit.slug,
      userManual: kit.userManual,
      accessUrl: kit.accessUrl,
    });

    sendKitPurchaseAdminNotification({
      kitName: kit.name,
      kitSlug: kit.slug,
      buyerEmail,
      buyerName: name,
      amountPaidCents,
      paymentMethod: "zaprite",
      welcomeEmailSent: welcomeResult.sent,
      welcomeEmailError: welcomeResult.error,
    }).catch((err) =>
      logger.warn({ err, kitSlug: kit.slug }, "admin-zaprite-fulfil: admin notification failed (non-fatal)"),
    );

    res.status(201).json({
      recorded: true,
      duplicate: false,
      welcomeEmailSent: welcomeResult.sent,
      welcomeEmailError: welcomeResult.error ?? null,
    });
  } catch (err) {
    logger.error({ err, kitSlug, buyerEmail, paymentRef }, "admin-zaprite-fulfil: DB insert failed");
    res.status(500).json({ error: "Internal error — purchase not recorded" });
  }
});

export default router;
