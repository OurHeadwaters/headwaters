/**
 * Admin — Kit Purchases view
 *
 * GET /api/admin/kit-purchases               — all purchases, newest first
 * GET /api/admin/kit-purchases?kitSlug=foo   — filtered to one kit (e.g. parrs-jars)
 * GET /api/admin/kit-purchases/stats         — count by kit slug
 * GET /api/admin/kit-inquiries               — all inquiry submissions, newest first
 */

import { Router, type IRouter } from "express";
import { db, kitPurchasesTable, kitInquiriesTable } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireEditor } from "../middlewares/requireEditor";

const router: IRouter = Router();

router.get("/admin/kit-purchases", requireEditor, async (req, res) => {
  try {
    const kitSlug = typeof req.query.kitSlug === "string" ? req.query.kitSlug : null;

    const query = db
      .select()
      .from(kitPurchasesTable)
      .$dynamic();

    const rows = await (kitSlug
      ? query.where(eq(kitPurchasesTable.kitSlug, kitSlug)).orderBy(desc(kitPurchasesTable.purchasedAt)).limit(500)
      : query.orderBy(desc(kitPurchasesTable.purchasedAt)).limit(500));

    res.json(rows);
  } catch (err) {
    logger.error({ err }, "admin-kit-purchases: GET failed");
    res.status(500).json({ error: "Failed to load kit purchases" });
  }
});

router.get("/admin/kit-purchases/stats", requireEditor, async (_req, res) => {
  try {
    const rows = await db
      .select({
        kitSlug: kitPurchasesTable.kitSlug,
        purchaseCount: sql<number>`count(*)::int`,
        totalRevenueCents: sql<number>`sum(${kitPurchasesTable.amountPaidCents})::int`,
      })
      .from(kitPurchasesTable)
      .groupBy(kitPurchasesTable.kitSlug)
      .orderBy(desc(sql`count(*)`));
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "admin-kit-purchases: GET /stats failed");
    res.status(500).json({ error: "Failed to load kit purchase stats" });
  }
});

router.get("/admin/kit-inquiries", requireEditor, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(kitInquiriesTable)
      .orderBy(desc(kitInquiriesTable.submittedAt))
      .limit(500);
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "admin-kit-purchases: GET /inquiries failed");
    res.status(500).json({ error: "Failed to load kit inquiries" });
  }
});

export default router;
