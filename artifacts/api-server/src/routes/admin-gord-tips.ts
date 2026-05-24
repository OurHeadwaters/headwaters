/**
 * Admin — Gord Tips view
 *
 * GET /api/admin/gord-tips        — all tips, newest first (up to 500)
 * GET /api/admin/gord-tips/stats  — total count and total revenue in cents
 */

import { Router, type IRouter } from "express";
import { db, gordTipsTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireEditor } from "../middlewares/requireEditor";

const router: IRouter = Router();

router.get("/admin/gord-tips", requireEditor, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(gordTipsTable)
      .orderBy(desc(gordTipsTable.tippedAt))
      .limit(500);
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "admin-gord-tips: GET failed");
    res.status(500).json({ error: "Failed to load Gord tips" });
  }
});

router.get("/admin/gord-tips/stats", requireEditor, async (_req, res) => {
  try {
    const [stats] = await db
      .select({
        tipCount: sql<number>`count(*)::int`,
        totalRevenueCents: sql<number>`coalesce(sum(${gordTipsTable.amountPaidCents}), 0)::int`,
      })
      .from(gordTipsTable);

    res.json({
      tipCount: stats?.tipCount ?? 0,
      totalRevenueCents: stats?.totalRevenueCents ?? 0,
    });
  } catch (err) {
    logger.error({ err }, "admin-gord-tips: GET /stats failed");
    res.status(500).json({ error: "Failed to load Gord tip stats" });
  }
});

export default router;
