import { Router, type IRouter } from "express";
import {
  ListEpisodesQueryParams,
  GetEpisodeParams,
} from "@workspace/api-zod";
import { getFeedCached, type RssEpisode } from "../lib/rss";
import { logger } from "../lib/logger";
import { getCuratedDescription } from "../lib/category-descriptions";

const router: IRouter = Router();

function toEpisodeSummary(e: RssEpisode) {
  const { descriptionHtml: _unused, ...rest } = e;
  return rest;
}

router.get("/feed", async (_req, res) => {
  try {
    const feed = await getFeedCached();
    res.json({
      title: feed.title,
      description: feed.description,
      link: feed.link,
      host: feed.host,
      artworkUrl: feed.artworkUrl,
      copyright: feed.copyright,
      language: feed.language,
      totalEpisodes: feed.totalEpisodes,
      latestPubDate: feed.latestPubDate,
      tipUrl: feed.tipUrl,
    });
  } catch (err) {
    logger.error({ err }, "Failed to load feed");
    res.status(502).json({ error: "Unable to load podcast feed" });
  }
});

router.get("/episodes", async (req, res) => {
  try {
    const parsed = ListEpisodesQueryParams.safeParse({
      limit: req.query.limit != null ? Number(req.query.limit) : undefined,
      offset: req.query.offset != null ? Number(req.query.offset) : undefined,
      q: typeof req.query.q === "string" ? req.query.q : undefined,
      category:
        typeof req.query.category === "string" ? req.query.category : undefined,
    });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query parameters" });
      return;
    }
    const { limit = 20, offset = 0, q, category } = parsed.data;
    const feed = await getFeedCached();
    let items = feed.episodes;
    if (category) {
      const cat = category.toLowerCase();
      items = items.filter((e) =>
        e.categories.some((c) => c.toLowerCase() === cat),
      );
    }
    if (q && q.trim()) {
      const needle = q.trim().toLowerCase();
      items = items.filter((e) => {
        return (
          e.title.toLowerCase().includes(needle) ||
          e.summary.toLowerCase().includes(needle) ||
          e.categories.some((c) => c.toLowerCase().includes(needle))
        );
      });
    }
    const total = items.length;
    const page = items.slice(offset, offset + limit).map(toEpisodeSummary);
    res.json({ items: page, total, limit, offset });
  } catch (err) {
    logger.error({ err }, "Failed to list episodes");
    res.status(502).json({ error: "Unable to load episodes" });
  }
});

router.get("/episodes/featured", async (_req, res) => {
  try {
    const feed = await getFeedCached();
    const items = feed.episodes.slice(0, 5).map(toEpisodeSummary);
    res.json(items);
  } catch (err) {
    logger.error({ err }, "Failed to load featured episodes");
    res.status(502).json({ error: "Unable to load featured episodes" });
  }
});

router.get("/episodes/stats", async (_req, res) => {
  try {
    const feed = await getFeedCached();
    const episodes = feed.episodes;
    const totalEpisodes = episodes.length;
    const latestPubDate = episodes[0]?.pubDate ?? null;
    const latestEpisodeNumber = episodes.find(
      (e) => e.episodeNumber != null,
    )?.episodeNumber ?? null;

    const durations = episodes
      .map((e) => e.durationSeconds)
      .filter((d): d is number => typeof d === "number" && d > 0);
    const averageDurationSeconds = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null;

    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const episodesLast30Days = episodes.filter(
      (e) => new Date(e.pubDate).getTime() >= cutoff,
    ).length;

    const counts = new Map<string, number>();
    for (const e of episodes) {
      for (const c of e.categories) {
        counts.set(c, (counts.get(c) ?? 0) + 1);
      }
    }
    const topCategories = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, count]) => ({ name, count }));

    const monthCounts = new Map<string, number>();
    for (const e of episodes) {
      const d = new Date(e.pubDate);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
    }
    const allKeys = [...monthCounts.keys()].sort();
    const last12 = allKeys.slice(-12);
    const publishHistogram = last12.map((month) => ({
      month,
      count: monthCounts.get(month) ?? 0,
    }));

    res.json({
      totalEpisodes,
      latestPubDate,
      latestEpisodeNumber,
      averageDurationSeconds,
      episodesLast30Days,
      topCategories,
      publishHistogram,
    });
  } catch (err) {
    logger.error({ err }, "Failed to load episode stats");
    res.status(502).json({ error: "Unable to load stats" });
  }
});

router.get("/categories", async (_req, res) => {
  try {
    const feed = await getFeedCached();
    const counts = new Map<string, number>();
    const mostRecent = new Map<string, string>();
    for (const e of feed.episodes) {
      for (const c of e.categories) {
        counts.set(c, (counts.get(c) ?? 0) + 1);
        if (!mostRecent.has(c) && e.summary) {
          mostRecent.set(c, e.summary);
        }
      }
    }
    const list = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => {
        const curated = getCuratedDescription(name);
        const fallback = mostRecent.get(name) ?? null;
        const description = curated ?? fallback ?? undefined;
        return { name, count, description };
      });
    res.json(list);
  } catch (err) {
    logger.error({ err }, "Failed to list categories");
    res.status(502).json({ error: "Unable to load categories" });
  }
});

router.get("/episodes/:slug", async (req, res) => {
  try {
    const parsed = GetEpisodeParams.safeParse({ slug: req.params.slug });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid slug" });
      return;
    }
    const { slug } = parsed.data;
    const feed = await getFeedCached();
    const ep = feed.episodes.find((e) => e.slug === slug);
    if (!ep) {
      res.status(404).json({ error: "Episode not found" });
      return;
    }
    res.json(ep);
  } catch (err) {
    logger.error({ err }, "Failed to load episode");
    res.status(502).json({ error: "Unable to load episode" });
  }
});

export default router;
