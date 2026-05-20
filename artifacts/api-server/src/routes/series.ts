import { Router, type IRouter } from "express";
import { getFeedCached } from "../lib/rss";
import {
  SERIES_REGISTRY,
  getSeriesEpisodes,
  buildSeriesSummary,
} from "../lib/series";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/series", async (_req, res) => {
  try {
    const feed = await getFeedCached();
    const summaries = SERIES_REGISTRY.map((series) => {
      const eps = getSeriesEpisodes(series.slug, feed.episodes);
      return buildSeriesSummary(series, eps);
    });
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

    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const feed = await getFeedCached();
    const allEps = getSeriesEpisodes(slug, feed.episodes);
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

export default router;
