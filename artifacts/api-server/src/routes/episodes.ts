import { Router, type IRouter } from "express";
import {
  ListEpisodesQueryParams,
  GetEpisodeParams,
} from "@workspace/api-zod";
import { getFeedCached, type RssEpisode } from "../lib/rss";
import { logger } from "../lib/logger";
import { getCuratedDescription } from "../lib/category-descriptions";
import { sql } from "drizzle-orm";
import { db, contentItemsTable } from "@workspace/db";

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

function extractHistoryTimestamp(descriptionHtml: string): number | null {
  // Preserve line boundaries BEFORE stripping tags so list items / paragraphs
  // don't collapse into one giant line and accidentally match wrong timestamps.
  const text = descriptionHtml
    .replace(/<\/(p|div|li|h\d|br|tr|dt|dd)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, " ");

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const historyKeywords =
    /this\s+day\s+in\s+history|today\s+in\s+history|on\s+this\s+day|tsp\s+history|jack.*history/i;
  // H:MM:SS  or  MM:SS  — but NOT a bare "12:00" that could be a clock time at
  // the start of a sentence; require it to be preceded by a space, dash, bracket,
  // or line start when doing proximity matching.
  const timestampRe = /(?:^|[\s\-–—\[•·])(\d{1,2}):(\d{2}):(\d{2})(?:\b|$)|(?:^|[\s\-–—\[•·])(\d{1,3}):(\d{2})(?:\b|$)/;

  function parseTs(m: RegExpMatchArray): number {
    if (m[1] !== undefined) {
      return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
    }
    return Number(m[4]) * 60 + Number(m[5]);
  }

  // Primary pass: look for "this day in history" keywords with nearby timestamp
  for (let i = 0; i < lines.length; i++) {
    if (!historyKeywords.test(lines[i])) continue;
    // Check the keyword line itself and the 3 lines before/after it
    for (let j = Math.max(0, i - 3); j <= Math.min(lines.length - 1, i + 3); j++) {
      const m = lines[j].match(timestampRe);
      if (m) return parseTs(m);
    }
  }

  // Secondary pass: any "history" mention adjacent to a meaningful timestamp
  for (let i = 0; i < lines.length; i++) {
    if (!/\bhistory\b/i.test(lines[i])) continue;
    for (let j = Math.max(0, i - 1); j <= Math.min(lines.length - 1, i + 2); j++) {
      const m = lines[j].match(timestampRe);
      if (m) {
        const ts = parseTs(m);
        if (ts >= 60) return ts;
      }
    }
  }

  return null;
}

router.get("/episodes/this-day", async (req, res) => {
  try {
    const now = new Date();
    const monthParam = req.query.month != null ? Number(req.query.month) : null;
    const dayParam = req.query.day != null ? Number(req.query.day) : null;

    const targetMonth = (monthParam != null && !Number.isNaN(monthParam))
      ? monthParam
      : now.getUTCMonth() + 1;
    const targetDay = (dayParam != null && !Number.isNaN(dayParam))
      ? dayParam
      : now.getUTCDate();

    // --- RSS feed: recent episodes ---
    const feed = await getFeedCached();
    const rssMatched = feed.episodes.filter((e) => {
      const d = new Date(e.pubDate);
      if (Number.isNaN(d.getTime())) return false;
      return d.getUTCMonth() + 1 === targetMonth && d.getUTCDate() === targetDay;
    });

    // Track slugs from RSS to deduplicate against DB results
    const rssSlugSet = new Set(rssMatched.map((e) => e.slug));
    const rssEpNumSet = new Set(
      rssMatched.map((e) => e.episodeNumber).filter((n): n is number => n != null),
    );

    // Collect RSS results with timestamp detection
    type ThisDayItem = {
      slug: string;
      guid: string;
      episodeNumber: number | null;
      title: string;
      link: string;
      pubDate: string;
      summary: string;
      durationSeconds: number | null;
      audioUrl: string | null;
      audioType: string | null;
      artworkUrl: string | null;
      categories: string[];
      historyTimestamp: number | null;
    };

    const results: ThisDayItem[] = rssMatched.map((e) => {
      const { descriptionHtml: _unused, ...summary } = e;
      return { ...summary, historyTimestamp: extractHistoryTimestamp(e.descriptionHtml) };
    });

    // --- Library DB: full archive audio episodes ---
    try {
      const dbRows = await db
        .select()
        .from(contentItemsTable)
        .where(
          sql`${contentItemsTable.kind} = 'audio'
            AND EXTRACT(MONTH FROM ${contentItemsTable.publishedAt}) = ${targetMonth}
            AND EXTRACT(DAY FROM ${contentItemsTable.publishedAt}) = ${targetDay}`,
        )
        .orderBy(sql`${contentItemsTable.publishedAt} DESC`);

      for (const row of dbRows) {
        // Skip if already covered by the RSS feed (same slug or episode number)
        if (rssSlugSet.has(row.slug)) continue;
        if (row.episodeNumber != null && rssEpNumSet.has(row.episodeNumber)) continue;

        const historyTimestamp = row.bodyHtml
          ? extractHistoryTimestamp(row.bodyHtml)
          : null;

        results.push({
          slug: row.slug,
          guid: row.sourceId,
          episodeNumber: row.episodeNumber,
          title: row.title,
          link: row.link,
          pubDate: row.publishedAt.toISOString(),
          summary: row.summary,
          durationSeconds: row.durationSeconds,
          audioUrl: row.audioUrl,
          audioType: row.audioType,
          artworkUrl: row.artworkUrl,
          categories: row.categories,
          historyTimestamp,
        });
      }
    } catch (dbErr) {
      // DB may not be available (e.g. no sync yet); continue with RSS-only results
      logger.warn({ err: dbErr }, "this-day: DB query failed, serving RSS-only results");
    }

    // Sort all results by pubDate descending (newest year first)
    results.sort((a, b) => b.pubDate.localeCompare(a.pubDate));

    res.json(results);
  } catch (err) {
    logger.error({ err }, "Failed to load this-day episodes");
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
