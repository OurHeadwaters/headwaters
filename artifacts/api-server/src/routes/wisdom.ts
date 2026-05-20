import { Router, type IRouter } from "express";
import { db, wisdomGemsTable, contentItemsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { extractGems } from "../lib/wisdom-extraction";

const router: IRouter = Router();

const GEMS_PER_EPISODE = 5;
const EXTRACTION_LIMIT = 30;

/**
 * GET /api/wisdom/gems
 * Returns gems sorted by anchor count desc, then extracted_at desc.
 * Query params: limit (1-100, default 40), offset (default 0), featured (true/false)
 */
router.get("/wisdom/gems", async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 40));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const onlyFeatured = req.query.featured === "true";

    let query = db
      .select()
      .from(wisdomGemsTable)
      .orderBy(desc(wisdomGemsTable.anchorCount), desc(wisdomGemsTable.extractedAt))
      .limit(limit)
      .offset(offset);

    if (onlyFeatured) {
      query = db
        .select()
        .from(wisdomGemsTable)
        .where(eq(wisdomGemsTable.featured, true))
        .orderBy(desc(wisdomGemsTable.anchorCount), desc(wisdomGemsTable.extractedAt))
        .limit(limit)
        .offset(offset);
    }

    const gems = await query;
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(wisdomGemsTable);

    res.json({ gems, total: count, limit, offset });
  } catch (err) {
    logger.error({ err }, "wisdom: GET /gems failed");
    res.status(500).json({ error: "Failed to load wisdom gems" });
  }
});

/**
 * POST /api/wisdom/gems/anchor/:id
 * Increment the anchor count on a gem (one tap = one anchor, no auth needed).
 */
router.post("/wisdom/gems/anchor/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid gem id" });
      return;
    }
    const [updated] = await db
      .update(wisdomGemsTable)
      .set({ anchorCount: sql`${wisdomGemsTable.anchorCount} + 1` })
      .where(eq(wisdomGemsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Gem not found" });
      return;
    }
    res.json({ anchorCount: updated.anchorCount });
  } catch (err) {
    logger.error({ err }, "wisdom: POST /anchor failed");
    res.status(500).json({ error: "Failed to anchor gem" });
  }
});

/**
 * POST /api/wisdom/extract
 * Extract gems from up to EXTRACTION_LIMIT episodes that don't yet have any gems.
 * Safe to call multiple times — skips episodes that already have gems.
 */
router.post("/wisdom/extract", async (_req, res) => {
  try {
    const existingSlugs = await db
      .selectDistinct({ slug: wisdomGemsTable.episodeSlug })
      .from(wisdomGemsTable);
    const done = new Set(existingSlugs.map((r) => r.slug));

    const episodes = await db
      .select({
        slug: contentItemsTable.slug,
        title: contentItemsTable.title,
        bodyText: contentItemsTable.bodyText,
      })
      .from(contentItemsTable)
      .where(
        sql`${contentItemsTable.kind} = 'audio'
          AND ${contentItemsTable.bodyText} IS NOT NULL
          AND length(${contentItemsTable.bodyText}) > 200`,
      )
      .orderBy(desc(contentItemsTable.publishedAt))
      .limit(EXTRACTION_LIMIT + done.size);

    const toProcess = episodes.filter((e) => !done.has(e.slug));
    if (toProcess.length === 0) {
      res.json({ extracted: 0, message: "No new episodes to process" });
      return;
    }

    const batch = toProcess.slice(0, EXTRACTION_LIMIT);
    let totalInserted = 0;

    for (const ep of batch) {
      const gems = extractGems(ep.bodyText ?? "", GEMS_PER_EPISODE);
      if (gems.length === 0) continue;
      await db.insert(wisdomGemsTable).values(
        gems.map((gemText) => ({
          episodeSlug: ep.slug,
          episodeTitle: ep.title,
          gemText,
        })),
      );
      totalInserted += gems.length;
    }

    logger.info({ episodes: batch.length, gems: totalInserted }, "wisdom: extraction complete");
    res.json({ extracted: totalInserted, episodes: batch.length });
  } catch (err) {
    logger.error({ err }, "wisdom: POST /extract failed");
    res.status(500).json({ error: "Extraction failed" });
  }
});

export default router;
