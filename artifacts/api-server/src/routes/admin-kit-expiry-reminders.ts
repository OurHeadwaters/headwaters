/**
 * Admin — Kit Expiry Reminders
 *
 * POST /api/admin/kit-expiry-reminders
 *
 * Finds kit purchases whose session is expiring within 24 hours (based on
 * lastVerifiedAt) and sends each buyer a one-click renewal email.
 *
 * Designed to be called once per day by an external cron service.
 * Protected by requireEditor (ADMIN_SECRET header or authenticated session).
 *
 * Idempotent within a session cycle: expiryReminderSentAt is only reset when
 * the buyer visits again (which bumps lastVerifiedAt), so repeat runs of this
 * job within the same expiry window will not send duplicate emails.
 */

import { Router, type IRouter } from "express";
import { db, kitPurchasesTable } from "@workspace/db";
import { and, isNotNull, lt, gte, or, isNull, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireEditor } from "../middlewares/requireEditor";
import { sendKitExpiryReminderEmail } from "../lib/email";
import { kitBySlug } from "../lib/kits";

/** Must match KIT_SESSION_TTL_MS in lib/tsp-constants — 7 days in milliseconds */
const KIT_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const router: IRouter = Router();

router.post("/admin/kit-expiry-reminders", requireEditor, async (_req, res) => {
  try {
    const now = new Date();

    // Session expires when: now - lastVerifiedAt >= TTL (7 days)
    // "Expiring within 24 h" means: 6 days <= (now - lastVerifiedAt) < 7 days
    // i.e. lastVerifiedAt is in the window [now - 7d, now - 6d)
    //   windowStart = now - TTL       ← oldest border (already at expiry edge)
    //   windowEnd   = now - TTL + 24h ← 24 h before expiry
    const ttlMs = KIT_SESSION_TTL_MS;
    const windowStart = new Date(now.getTime() - ttlMs);                        // = now - 7 days
    const windowEnd   = new Date(now.getTime() - ttlMs + 24 * 60 * 60 * 1000); // = now - 6 days

    // Find purchases where:
    //  - lastVerifiedAt is set
    //  - lastVerifiedAt falls in the [windowStart, windowEnd) band
    //  - No reminder sent for this session cycle yet
    //    (expiryReminderSentAt IS NULL  OR  expiryReminderSentAt < lastVerifiedAt)
    const rows = await db
      .select({
        id: kitPurchasesTable.id,
        kitSlug: kitPurchasesTable.kitSlug,
        buyerEmail: kitPurchasesTable.buyerEmail,
        buyerName: kitPurchasesTable.buyerName,
        lastVerifiedAt: kitPurchasesTable.lastVerifiedAt,
      })
      .from(kitPurchasesTable)
      .where(
        and(
          isNotNull(kitPurchasesTable.lastVerifiedAt),
          gte(kitPurchasesTable.lastVerifiedAt, windowStart),
          lt(kitPurchasesTable.lastVerifiedAt, windowEnd),
          or(
            isNull(kitPurchasesTable.expiryReminderSentAt),
            lt(
              kitPurchasesTable.expiryReminderSentAt,
              kitPurchasesTable.lastVerifiedAt,
            ),
          ),
        ),
      );

    logger.info(
      { count: rows.length, windowStart, windowEnd },
      "kit-expiry-reminders: found purchases expiring within 24h",
    );

    let sent = 0;
    let failed = 0;

    for (const row of rows) {
      const kit = kitBySlug(row.kitSlug);
      const kitName =
        kit?.name ??
        row.kitSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

      const result = await sendKitExpiryReminderEmail({
        buyerEmail: row.buyerEmail,
        buyerName: row.buyerName ?? null,
        kitName,
        kitSlug: row.kitSlug,
        accessUrl: kit?.accessUrl,
      });

      if (result.sent) {
        await db
          .update(kitPurchasesTable)
          .set({ expiryReminderSentAt: now })
          .where(sql`id = ${row.id}`);
        sent++;
      } else {
        logger.warn(
          { id: row.id, kitSlug: row.kitSlug, error: result.error },
          "kit-expiry-reminders: failed to send reminder",
        );
        failed++;
      }
    }

    logger.info({ sent, failed }, "kit-expiry-reminders: run complete");
    res.json({ ok: true, sent, failed, total: rows.length });
  } catch (err) {
    logger.error({ err }, "kit-expiry-reminders: POST failed");
    res.status(500).json({ error: "Failed to run expiry reminders" });
  }
});

export default router;
