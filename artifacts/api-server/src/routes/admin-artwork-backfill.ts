/**
 * POST /api/admin/artwork-backfill
 *
 * One-time (idempotent) endpoint that iterates over content_items rows where
 * artwork_url IS NULL and source = 'wordpress', fetches the featured image URL
 * from the WordPress REST API for each, and updates the row.
 *
 * Runs in small batches to avoid hammering the WP API.
 * Only accessible to authenticated editors.
 */

import { Router, type IRouter } from "express";
import { db, contentItemsTable } from "@workspace/db";
import { sql, eq, and, isNull } from "drizzle-orm";
import { requireEditor } from "../middlewares/requireEditor";
import { fetchFeaturedImageBySlug } from "../lib/sources/wordpress";
import { pMap } from "../lib/id3-chapters";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const DEFAULT_BATCH_SIZE = 50;
const MAX_BATCH_SIZE = 500;
const CONCURRENCY = 4;

router.post("/admin/artwork-backfill", requireEditor, async (req, res) => {
  const dryRun = req.query.dry === "true";
  const rawBatch = Number(req.query.batchSize ?? DEFAULT_BATCH_SIZE);
  const BATCH_SIZE = Number.isFinite(rawBatch) && rawBatch > 0
    ? Math.min(rawBatch, MAX_BATCH_SIZE)
    : DEFAULT_BATCH_SIZE;

  try {
    const rows = await db
      .select({ id: contentItemsTable.id, slug: contentItemsTable.slug })
      .from(contentItemsTable)
      .where(
        and(
          isNull(contentItemsTable.artworkUrl),
          eq(contentItemsTable.source, "wordpress"),
        ),
      )
      .orderBy(sql`${contentItemsTable.publishedAt} DESC`)
      .limit(BATCH_SIZE);

    if (rows.length === 0) {
      res.json({ updated: 0, skipped: 0, message: "No rows need backfilling" });
      return;
    }

    let updated = 0;
    let skipped = 0;

    await pMap(
      rows,
      async (row) => {
        try {
          const imageUrl = await fetchFeaturedImageBySlug(row.slug);
          if (!imageUrl) {
            skipped += 1;
            return;
          }
          if (!dryRun) {
            await db
              .update(contentItemsTable)
              .set({ artworkUrl: imageUrl })
              .where(eq(contentItemsTable.id, row.id));
          }
          updated += 1;
          logger.debug({ slug: row.slug, imageUrl, dryRun }, "artwork-backfill: updated row");
        } catch (err) {
          logger.warn({ err, slug: row.slug }, "artwork-backfill: failed for row");
          skipped += 1;
        }
      },
      CONCURRENCY,
    );

    const remaining = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contentItemsTable)
      .where(
        and(
          isNull(contentItemsTable.artworkUrl),
          eq(contentItemsTable.source, "wordpress"),
        ),
      );

    res.json({
      updated,
      skipped,
      dryRun,
      batchSize: BATCH_SIZE,
      remaining: remaining[0]?.count ?? 0,
      message: dryRun
        ? `Dry run: would have updated ${updated} rows`
        : `Updated ${updated} rows; ${remaining[0]?.count ?? 0} still need backfilling`,
    });
  } catch (err) {
    logger.error({ err }, "artwork-backfill: query failed");
    res.status(500).json({ error: "Backfill failed" });
  }
});

export default router;
