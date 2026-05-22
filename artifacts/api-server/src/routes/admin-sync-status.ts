/**
 * GET /api/admin/sync-status
 *
 * Returns ingestion counts, last-ingested timestamps for each source type
 * stored in curated_items, plus per-relay health from nostr_ingestion_log.
 * Only accessible to authenticated editors.
 */

import { Router, type IRouter } from "express";
import { db, curatedItemsTable, nostrIngestionLogTable } from "@workspace/db";
import { sql, max, count, desc, eq } from "drizzle-orm";
import { requireEditor } from "../middlewares/requireEditor";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/admin/sync-status", requireEditor, async (_req, res) => {
  try {
    const [sourceRows, relayRows] = await Promise.all([
      db
        .select({
          sourceType: curatedItemsTable.sourceType,
          total: count(curatedItemsTable.id),
          lastIngestedAt: max(curatedItemsTable.createdAt),
        })
        .from(curatedItemsTable)
        .groupBy(sql`${curatedItemsTable.sourceType}`),

      db
        .selectDistinctOn([nostrIngestionLogTable.relay], {
          relay: nostrIngestionLogTable.relay,
          status: nostrIngestionLogTable.status,
          ranAt: nostrIngestionLogTable.ranAt,
          itemsFetched: nostrIngestionLogTable.itemsFetched,
          itemsInserted: nostrIngestionLogTable.itemsInserted,
          errorMessage: nostrIngestionLogTable.errorMessage,
        })
        .from(nostrIngestionLogTable)
        .orderBy(
          nostrIngestionLogTable.relay,
          desc(nostrIngestionLogTable.ranAt),
        ),
    ]);

    const bySource: Record<
      string,
      { total: number; lastIngestedAt: string | null }
    > = {};

    for (const row of sourceRows) {
      bySource[row.sourceType] = {
        total: Number(row.total),
        lastIngestedAt: row.lastIngestedAt
          ? row.lastIngestedAt.toISOString()
          : null,
      };
    }

    const relayHealth = relayRows.map((r) => ({
      relay: r.relay,
      status: r.status,
      ranAt: r.ranAt ? r.ranAt.toISOString() : null,
      itemsFetched: r.itemsFetched,
      itemsInserted: r.itemsInserted,
      errorMessage: r.errorMessage ?? null,
    }));

    res.json({ bySource, relayHealth });
  } catch (err) {
    logger.error({ err }, "admin-sync-status: query failed");
    res.status(500).json({ error: "Failed to load sync status" });
  }
});

export default router;
