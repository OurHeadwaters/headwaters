import { Router, type IRouter } from "express";
import { getFeedCached } from "../lib/rss";
import {
  SERIES_REGISTRY,
  getSeriesEpisodes,
  buildSeriesSummary,
  getLibrarySeriesEpisodes,
  mergeAndDeduplicateEpisodes,
} from "../lib/series";
import { getSeriesConsistencyReport } from "../lib/series-consistency";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/series", async (req, res) => {
  try {
    const orderBy = typeof req.query.orderBy === "string" ? req.query.orderBy : "";
    const feed = await getFeedCached();
    const summaries = await Promise.all(
      SERIES_REGISTRY.map(async (series) => {
        const rssEps = getSeriesEpisodes(series.slug, feed.episodes);
        const libraryEps = await getLibrarySeriesEpisodes(series.slug, series.order);
        const merged = mergeAndDeduplicateEpisodes(rssEps, libraryEps, series.order);
        return buildSeriesSummary(series, merged);
      }),
    );
    if (orderBy === "episodeCount:desc") {
      summaries.sort((a, b) => b.episodeCount - a.episodeCount);
    } else if (orderBy === "episodeCount:asc") {
      summaries.sort((a, b) => a.episodeCount - b.episodeCount);
    }
    res.json(summaries);
  } catch (err) {
    logger.error({ err }, "Failed to list series");
    res.status(502).json({ error: "Unable to load series" });
  }
});

router.get("/series/:slug/episodes", async (req, res) => {
  try {
    const { slug } = req.params;
    const series = SERIES_REGISTRY.find((s) => s.slug === slug);
    if (!series) {
      res.status(404).json({ error: "Series not found" });
      return;
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 500);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const [feed, libraryEps] = await Promise.all([
      getFeedCached(),
      getLibrarySeriesEpisodes(slug, series.order),
    ]);

    const rssEps = getSeriesEpisodes(slug, feed.episodes);
    const allEps = mergeAndDeduplicateEpisodes(rssEps, libraryEps, series.order);

    const total = allEps.length;
    const summary = buildSeriesSummary(series, allEps);
    const items = allEps.slice(offset, offset + limit).map((e) => {
      const { descriptionHtml: _unused, ...rest } = e;
      return rest;
    });

    res.json({ series: summary, items, total, limit, offset });
  } catch (err) {
    logger.error({ err }, "Failed to load series episodes");
    res.status(502).json({ error: "Unable to load series episodes" });
  }
});

router.get("/series/consistency", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "1";
    const feed = await getFeedCached();
    const report = await getSeriesConsistencyReport(feed.episodes, { forceRefresh });
    res.json(report);
  } catch (err) {
    logger.error({ err }, "Failed to run series consistency check");
    res.status(502).json({ error: "Unable to run consistency check" });
  }
});

export default router;
