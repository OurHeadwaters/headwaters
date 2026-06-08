import { Router, type IRouter } from "express";
import { db, wisdomScrapeLogTable, wisdomGemsTable } from "@workspace/db";
import { asc, eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireEditor } from "../middlewares/requireEditor";
import { scrapeAll, scrapeSource, type ScrapeSourceType } from "../lib/wisdom-scraper";
import { EXPERT_COUNCIL } from "../lib/expert-council-static";

const router: IRouter = Router();

let scrapeInProgress = false;

/**
 * GET /api/admin/wisdom/scrape-status
 * Returns per-source last-scraped time and gem counts from the log table,
 * plus a manifest of all configured sources so the UI can show unseen ones.
 */
router.get("/admin/wisdom/scrape-status", requireEditor, async (_req, res) => {
  try {
    const logs = await db
      .select()
      .from(wisdomScrapeLogTable)
      .orderBy(asc(wisdomScrapeLogTable.sourceName), asc(wisdomScrapeLogTable.sourceType));

    const logBySourceId = new Map(logs.map((l) => [l.sourceId, l]));

    const sources = EXPERT_COUNCIL.flatMap((m) => {
      const skipInternalUrl =
        m.url.startsWith("https://www.thesurvivalpodcast.com") &&
        m.id !== "jack-spirko";

      const items: {
        sourceId: string;
        sourceName: string;
        sourceType: string;
        sourceUrl: string;
        xHandle?: string;
        lastScrapedAt: string | null;
        gemCount: number;
        status: string;
        errorMsg: string | null;
      }[] = [];

      if (!skipInternalUrl) {
        const wsId = `${m.id}::website`;
        const wsLog = logBySourceId.get(wsId);
        items.push({
          sourceId: wsId,
          sourceName: m.name,
          sourceType: "website",
          sourceUrl: m.url,
          lastScrapedAt: wsLog?.lastScrapedAt?.toISOString() ?? null,
          gemCount: wsLog?.gemCount ?? 0,
          status: wsLog?.status ?? "never",
          errorMsg: wsLog?.errorMsg ?? null,
        });
      }

      if (m.xHandle) {
        const xId = `${m.id}::x`;
        const xLog = logBySourceId.get(xId);
        items.push({
          sourceId: xId,
          sourceName: m.name,
          sourceType: "x",
          sourceUrl: `https://x.com/${m.xHandle}`,
          xHandle: m.xHandle,
          lastScrapedAt: xLog?.lastScrapedAt?.toISOString() ?? null,
          gemCount: xLog?.gemCount ?? 0,
          status: xLog?.status ?? "never",
          errorMsg: xLog?.errorMsg ?? null,
        });
      }

      return items;
    });

    res.json({ sources, inProgress: scrapeInProgress });
  } catch (err) {
    logger.error({ err }, "admin-wisdom: GET scrape-status failed");
    res.status(500).json({ error: "Failed to load scrape status" });
  }
});

/**
 * POST /api/admin/wisdom/scrape
 * Body (optional): { memberId: string, sourceType: "website" | "x" }
 * If omitted, scrapes all sources. Returns immediately with results.
 */
router.post("/admin/wisdom/scrape", requireEditor, async (req, res) => {
  if (scrapeInProgress) {
    res.status(409).json({ error: "A scrape is already in progress" });
    return;
  }

  const { memberId, sourceType } = req.body as {
    memberId?: string;
    sourceType?: string;
  };

  scrapeInProgress = true;
  try {
    if (memberId && sourceType) {
      if (sourceType !== "website" && sourceType !== "x") {
        res.status(400).json({ error: "sourceType must be 'website' or 'x'" });
        return;
      }
      const result = await scrapeSource(memberId, sourceType as ScrapeSourceType);
      res.json({ results: [result] });
    } else {
      const results = await scrapeAll();
      const totalGems = results.reduce((s, r) => s + r.gemsInserted, 0);
      logger.info({ sources: results.length, gems: totalGems }, "admin-wisdom: scrape-all complete");
      res.json({ results, totalGems });
    }
  } catch (err) {
    logger.error({ err }, "admin-wisdom: POST scrape failed");
    res.status(500).json({ error: "Scrape failed", detail: String(err) });
  } finally {
    scrapeInProgress = false;
  }
});

/**
 * DELETE /api/admin/wisdom/gems/:id
 * Permanently deletes a wisdom gem by ID. Editor-only.
 */
router.delete("/admin/wisdom/gems/:id", requireEditor, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid gem id" });
      return;
    }
    const [deleted] = await db
      .delete(wisdomGemsTable)
      .where(eq(wisdomGemsTable.id, id))
      .returning({ id: wisdomGemsTable.id });
    if (!deleted) {
      res.status(404).json({ error: "Gem not found" });
      return;
    }
    logger.info({ id }, "admin-wisdom: gem deleted");
    res.status(204).end();
  } catch (err) {
    logger.error({ err }, "admin-wisdom: DELETE /gems/:id failed");
    res.status(500).json({ error: "Failed to delete gem" });
  }
});

export default router;
