/**
 * GET /api/admin/sync-status
 *
 * Returns ingestion counts and last-ingested timestamps for each source type
 * stored in curated_items (nostr, audio, youtube, …).
 * Only accessible to authenticated editors.
 */

import { Router, type IRouter } from "express";
import { db, curatedItemsTable } from "@workspace/db";
import { sql, max, count } from "drizzle-orm";
import { requireEditor } from "../middlewares/requireEditor";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/admin/sync-status", requireEditor, async (_req, res) => {
  try {
    const rows = await db
      .select({
        sourceType: curatedItemsTable.sourceType,
        total: count(curatedItemsTable.id),
        lastIngestedAt: max(curatedItemsTable.createdAt),
      })
      .from(curatedItemsTable)
      .groupBy(sql`${curatedItemsTable.sourceType}`);

    const bySource: Record<
      string,
      { total: number; lastIngestedAt: string | null }
    > = {};

    for (const row of rows) {
      bySource[row.sourceType] = {
        total: Number(row.total),
        lastIngestedAt: row.lastIngestedAt
          ? row.lastIngestedAt.toISOString()
          : null,
      };
    }

    res.json(bySource);
  } catch (err) {
    logger.error({ err }, "admin-sync-status: query failed");
    res.status(500).json({ error: "Failed to load sync status" });
  }
});

export default router;
