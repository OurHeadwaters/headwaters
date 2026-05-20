import { Router, type IRouter } from "express";
import { desc, asc } from "drizzle-orm";
import { db, contentItemsTable } from "@workspace/db";
import { getFeedCached, type RssEpisode } from "../lib/rss";
import {
  SERIES_REGISTRY,
  getSeriesEpisodes,
  buildSeriesSummary,
} from "../lib/series";
import { logger } from "../lib/logger";

const router: IRouter = Router();

type LibraryRow = typeof contentItemsTable.$inferSelect;

function libraryRowToEpisode(row: LibraryRow): RssEpisode {
  return {
    slug: row.slug,
    guid: `${row.source}:${row.sourceId}`,
    episodeNumber: row.episodeNumber ?? null,
    title: row.title,
    link: row.link,
    pubDate: row.publishedAt.toISOString(),
    summary: row.summary,
    descriptionHtml: row.bodyHtml,
    durationSeconds: row.durationSeconds ?? null,
    audioUrl: row.audioUrl ?? null,
    audioType: row.audioType ?? null,
    artworkUrl: row.artworkUrl ?? null,
    categories: row.categories,
  };
}

async function getLibrarySeriesEpisodes(
  seriesSlug: string,
  order: "asc" | "desc",
): Promise<RssEpisode[]> {
  const series = SERIES_REGISTRY.find((s) => s.slug === seriesSlug);
  if (!series) return [];
  try {
    const rows = await db
      .select()
      .from(contentItemsTable)
      .where(series.librarySql())
      .orderBy(
        order === "asc"
          ? asc(contentItemsTable.publishedAt)
          : desc(contentItemsTable.publishedAt),
      )
      .limit(2000);
    return rows.map(libraryRowToEpisode);
  } catch (err) {
    logger.warn({ err, seriesSlug }, "Library series query failed; falling back to RSS only");
    return [];
  }
}

function mergeAndDeduplicateEpisodes(
  rssEps: RssEpisode[],
  libraryEps: RssEpisode[],
  order: "asc" | "desc",
): RssEpisode[] {
  const seen = new Set<string>();
  const merged: RssEpisode[] = [];

  for (const ep of rssEps) {
    const key = ep.slug || ep.guid;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(ep);
    }
  }

  for (const ep of libraryEps) {
    const key = ep.slug || ep.guid;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(ep);
    }
  }

  merged.sort((a, b) =>
    order === "asc"
      ? a.pubDate.localeCompare(b.pubDate)
      : b.pubDate.localeCompare(a.pubDate),
  );

  return merged;
}

router.get("/series", async (_req, res) => {
  try {
    const feed = await getFeedCached();
    const summaries = await Promise.all(
      SERIES_REGISTRY.map(async (series) => {
        const rssEps = getSeriesEpisodes(series.slug, feed.episodes);
        const libraryEps = await getLibrarySeriesEpisodes(series.slug, series.order);
        const merged = mergeAndDeduplicateEpisodes(rssEps, libraryEps, series.order);
        return buildSeriesSummary(series, merged);
      }),
    );
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

export default router;
