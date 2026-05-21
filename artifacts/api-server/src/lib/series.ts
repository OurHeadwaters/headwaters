import { sql, type SQL } from "drizzle-orm";
import { desc, asc } from "drizzle-orm";
import { db, contentItemsTable } from "@workspace/db";
import { type RssEpisode } from "./rss";
import { logger } from "./logger";

export type SeriesDefinition = {
  slug: string;
  title: string;
  description: string;
  iconEmoji: string;
  order: "asc" | "desc";
  featured?: boolean;
  detect: (episode: RssEpisode) => boolean;
  librarySql: () => SQL<unknown>;
};

export type SeriesSummary = {
  slug: string;
  title: string;
  description: string;
  iconEmoji: string;
  episodeCount: number;
  featured: boolean;
  latestPubDate: string | null;
  sampleArtworkUrl: string | null;
};

export type SeriesEpisodePage = {
  series: SeriesSummary;
  items: RssEpisode[];
  total: number;
  limit: number;
  offset: number;
};

export const SERIES_REGISTRY: SeriesDefinition[] = [
  {
    slug: "unloose-the-goose",
    featured: true,
    title: "Unloose the Goose",
    description:
      "Jack's irreverent deep-dives into news, politics, and culture — unfiltered and unscripted. These fan-favorite episodes let Jack loose on whatever's on his mind.",
    iconEmoji: "🪿",
    order: "desc",
    detect: (ep) => {
      const t = ep.title.toLowerCase();
      const s = ep.slug.toLowerCase();
      const sum = (ep.summary || "").toLowerCase();
      const body = (ep.descriptionHtml || "").toLowerCase();
      return (
        /unloose\s+the\s+goose/i.test(ep.title) ||
        /\butg\b/.test(t) ||
        /unloose[^a-z]*goose/i.test(t) ||
        /unloose[^a-z]*goose/i.test(sum) ||
        /unloose[^a-z]*goose/i.test(body) ||
        s.includes("unloose") ||
        s.includes("utg-") ||
        s.includes("ulg-") ||
        ep.categories.some((c) => /unloose/i.test(c) || /\bgoose\b/i.test(c))
      );
    },
    librarySql: () => sql`(
      ${contentItemsTable.title} ILIKE '%unloose%goose%'
      OR ${contentItemsTable.title} ILIKE '%unloose the goose%'
      OR ${contentItemsTable.slug} ILIKE '%unloose%goose%'
      OR ${contentItemsTable.slug} ILIKE '%unloose-the-goose%'
      OR ${contentItemsTable.slug} ILIKE '%utg-%'
      OR ${contentItemsTable.slug} ILIKE '%ulg-%'
      OR ${contentItemsTable.summary} ILIKE '%unloose the goose%'
      OR ${contentItemsTable.bodyHtml} ILIKE '%unloose the goose%'
      OR ${contentItemsTable.categories}::text ILIKE '%unloose%goose%'
      OR ${contentItemsTable.tags}::text ILIKE '%unloose%goose%'
      OR ${contentItemsTable.tags}::text ILIKE '%"utg"%'
      OR ${contentItemsTable.tags} @> '["unloose-the-goose"]'::jsonb
    )`,
  },
  {
    slug: "13-stomps",
    title: "13 Stomps",
    description:
      'A recurring series where Jack tackles 13 specific topics in one episode — deep, practical, and wide-ranging. Each installment is a standalone masterclass in self-reliance.',
    iconEmoji: "🥾",
    order: "desc",
    detect: (ep) => {
      const t = ep.title.toLowerCase();
      const s = ep.slug.toLowerCase();
      const sum = (ep.summary || "").toLowerCase();
      return (
        /13\s*stomps?/i.test(ep.title) ||
        /thirteen\s+stomps?/i.test(ep.title) ||
        /13\s*stomps?/i.test(sum) ||
        s.includes("13-stomp") ||
        s.includes("thirteen-stomp") ||
        ep.categories.some((c) => /13\s*stomps?/i.test(c) || /thirteen\s+stomps?/i.test(c))
      );
    },
    librarySql: () => sql`(
      ${contentItemsTable.title} ILIKE '%13 stomp%'
      OR ${contentItemsTable.title} ILIKE '%13stomp%'
      OR ${contentItemsTable.title} ILIKE '%thirteen stomp%'
      OR ${contentItemsTable.slug} ILIKE '%13-stomp%'
      OR ${contentItemsTable.slug} ILIKE '%thirteen-stomp%'
      OR ${contentItemsTable.summary} ILIKE '%13 stomp%'
      OR ${contentItemsTable.summary} ILIKE '%thirteen stomp%'
      OR ${contentItemsTable.categories}::text ILIKE '%13 stomp%'
      OR ${contentItemsTable.categories}::text ILIKE '%13stomp%'
      OR ${contentItemsTable.tags}::text ILIKE '%13 stomp%'
      OR ${contentItemsTable.tags} @> '["13 stomps"]'::jsonb
    )`,
  },
  {
    slug: "tuesday-chats",
    title: "Tuesday Chats",
    description:
      "Casual conversations recorded on Tuesdays — lighter in tone but rich in insight. Great entry points for new listeners and longtime fans alike.",
    iconEmoji: "💬",
    order: "desc",
    detect: (ep) => {
      const t = ep.title.toLowerCase();
      const s = ep.slug.toLowerCase();
      const sum = (ep.summary || "").toLowerCase();
      const body = (ep.descriptionHtml || "").toLowerCase();
      return (
        /tuesday\s+chat/i.test(ep.title) ||
        /tuesday\s+chat/i.test(sum) ||
        /tuesday\s+chat/i.test(body) ||
        /first\s+tuesday\s+coffee\s+chat/i.test(ep.title) ||
        /tuesday\s+coffee\s+chat/i.test(ep.title) ||
        /first\s+tuesday\s+coffee\s+chat/i.test(sum) ||
        /tuesday\s+coffee\s+chat/i.test(sum) ||
        s.includes("tuesday-chat") ||
        s.includes("first-tues") ||
        s.includes("1st-tues") ||
        s.includes("1tuesday") ||
        ep.categories.some(
          (c) =>
            /tuesday\s+chat/i.test(c) ||
            /^tuesday$/i.test(c.trim()) ||
            /^tuesday\s+chats?$/i.test(c.trim()) ||
            /^coffee\s+chat$/i.test(c.trim()) ||
            /^first\s+tuesday$/i.test(c.trim()),
        )
      );
    },
    librarySql: () => sql`(
      ${contentItemsTable.title} ILIKE '%tuesday chat%'
      OR ${contentItemsTable.title} ILIKE '%tuesday coffee chat%'
      OR ${contentItemsTable.title} ILIKE '%first tuesday coffee chat%'
      OR ${contentItemsTable.slug} ILIKE '%tuesday-chat%'
      OR ${contentItemsTable.slug} ILIKE '%first-tues%'
      OR ${contentItemsTable.slug} ILIKE '%1st-tues%'
      OR ${contentItemsTable.slug} ILIKE '%1tuesday%'
      OR ${contentItemsTable.summary} ILIKE '%tuesday chat%'
      OR ${contentItemsTable.summary} ILIKE '%tuesday coffee chat%'
      OR ${contentItemsTable.categories}::text ILIKE '%tuesday chat%'
      OR ${contentItemsTable.categories}::text ILIKE '"Tuesday"'
      OR ${contentItemsTable.categories} @> '["Tuesday"]'::jsonb
      OR ${contentItemsTable.tags}::text ILIKE '%tuesday chat%'
      OR ${contentItemsTable.tags}::text ILIKE '"tuesday"'
      OR ${contentItemsTable.tags} @> '["coffee chat"]'::jsonb
      OR ${contentItemsTable.tags} @> '["first tuesday"]'::jsonb
      OR ${contentItemsTable.tags} @> '["tuesday chats"]'::jsonb
    )`,
  },
  {
    slug: "history",
    title: "History with Jack",
    description:
      "Jack explores pivotal moments in history through a preparedness and self-reliance lens — uncovering lessons that are as relevant today as ever.",
    iconEmoji: "📜",
    order: "asc",
    detect: (ep) => {
      const titleLower = ep.title.toLowerCase();
      const sum = (ep.summary || "").toLowerCase();
      const body = (ep.descriptionHtml || "").toLowerCase();
      const hasHistoryKeyword =
        /history\s+with\s+jack/i.test(ep.title) ||
        /history\s+of\s+/i.test(ep.title) ||
        /\bhistory\b.*\b(episode|epi)\b/i.test(ep.title) ||
        /history\s+with\s+jack/i.test(sum) ||
        /this\s+day\s+in\s+history|today\s+in\s+history|on\s+this\s+day/i.test(body) ||
        ep.categories.some(
          (c) =>
            /\bhistory\b/i.test(c) &&
            !/natural history/i.test(c),
        );
      const hasHistoricalKeywords =
        /\b(ancient|medieval|world war|civil war|revolutionary|colonial|roman|greek|viking|renaissance|ottoman|mongol|byzantine|empire|napoleon|lincoln|washington|revolution|wwi|wwii|ww1|ww2|founding fathers|constitutional|manifest destiny|great depression|cold war|korean war|vietnam)\b/i.test(
          titleLower,
        );
      const hasHistoricalSummaryKeywords =
        /history\s+with\s+jack/i.test(sum) ||
        /\b(ancient history|historical|world war|civil war)\b/i.test(sum);
      return hasHistoryKeyword || hasHistoricalKeywords || hasHistoricalSummaryKeywords;
    },
    librarySql: () => sql`(
      ${contentItemsTable.title} ILIKE '%history with jack%'
      OR ${contentItemsTable.title} ILIKE '%history of %'
      OR ${contentItemsTable.slug} ILIKE '%history-with-jack%'
      OR ${contentItemsTable.summary} ILIKE '%history with jack%'
      OR ${contentItemsTable.categories}::text ILIKE '%history%'
      OR ${contentItemsTable.tags}::text ILIKE '%history%'
      OR (
        ${contentItemsTable.title} ~* '\m(ancient|medieval|world war|civil war|revolutionary|colonial|roman|greek|viking|renaissance|ottoman|mongol|byzantine|napoleon|wwi|wwii|ww1|ww2|founding fathers|great depression|cold war|korean war|vietnam)\M'
      )
    )`,
  },
];

export function detectSeries(episode: RssEpisode): SeriesDefinition | null {
  for (const series of SERIES_REGISTRY) {
    if (series.detect(episode)) return series;
  }
  return null;
}

export function detectSeriesSlug(episode: RssEpisode): string | null {
  return detectSeries(episode)?.slug ?? null;
}

export function getSeriesEpisodes(
  seriesSlug: string,
  allEpisodes: RssEpisode[],
): RssEpisode[] {
  const series = SERIES_REGISTRY.find((s) => s.slug === seriesSlug);
  if (!series) return [];
  const matched = allEpisodes.filter((ep) => series.detect(ep));
  if (series.order === "asc") {
    matched.sort((a, b) => a.pubDate.localeCompare(b.pubDate));
  } else {
    matched.sort((a, b) => b.pubDate.localeCompare(a.pubDate));
  }
  return matched;
}

export function buildSeriesSummary(
  series: SeriesDefinition,
  episodes: RssEpisode[],
): SeriesSummary {
  const latestPubDate =
    episodes.length > 0
      ? episodes.reduce(
          (max, ep) => (ep.pubDate > max ? ep.pubDate : max),
          episodes[0]!.pubDate,
        )
      : null;
  return {
    slug: series.slug,
    title: series.title,
    description: series.description,
    iconEmoji: series.iconEmoji,
    episodeCount: episodes.length,
    featured: series.featured ?? false,
    latestPubDate,
    sampleArtworkUrl: episodes.find((e) => e.artworkUrl)?.artworkUrl ?? null,
  };
}

type LibraryRow = typeof contentItemsTable.$inferSelect;

export function libraryRowToRssEpisode(row: LibraryRow): RssEpisode {
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
    tags: row.tags,
  };
}

const SERIES_EPISODE_CACHE_TTL_MS = 5 * 60 * 1000;

type SeriesEpisodeCacheEntry = {
  fetchedAt: number;
  episodes: RssEpisode[];
};

const seriesEpisodeCache = new Map<string, SeriesEpisodeCacheEntry>();

export function invalidateSeriesEpisodeCache(seriesSlug?: string): void {
  if (seriesSlug) {
    for (const key of seriesEpisodeCache.keys()) {
      if (key.startsWith(`${seriesSlug}:`)) {
        seriesEpisodeCache.delete(key);
      }
    }
    logger.info({ seriesSlug }, "Series episode cache invalidated for series");
  } else {
    seriesEpisodeCache.clear();
    logger.info("Series episode cache fully invalidated");
  }
}

export async function getLibrarySeriesEpisodes(
  seriesSlug: string,
  order: "asc" | "desc",
): Promise<RssEpisode[]> {
  const series = SERIES_REGISTRY.find((s) => s.slug === seriesSlug);
  if (!series) return [];

  const cacheKey = `${seriesSlug}:${order}`;
  const now = Date.now();
  const cached = seriesEpisodeCache.get(cacheKey);

  if (cached && now - cached.fetchedAt < SERIES_EPISODE_CACHE_TTL_MS) {
    logger.debug({ seriesSlug, order }, "series: serving episode list from cache");
    return cached.episodes;
  }

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
    const episodes = rows.map(libraryRowToRssEpisode);
    seriesEpisodeCache.set(cacheKey, { fetchedAt: now, episodes });
    logger.debug({ seriesSlug, order, count: episodes.length }, "series: episode list cached");
    return episodes;
  } catch (err) {
    logger.warn({ err, seriesSlug }, "Library series query failed; falling back to RSS only");
    return [];
  }
}

export function mergeAndDeduplicateEpisodes(
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

export type EpisodeSeriesContext = {
  seriesSlug: string | null;
  positionInSeries: number | null;
};

export async function getEpisodeSeriesContext(
  episode: RssEpisode,
  rssFeedEpisodes: RssEpisode[],
): Promise<EpisodeSeriesContext> {
  const series = detectSeries(episode);
  if (!series) return { seriesSlug: null, positionInSeries: null };

  const rssSeriesEps = getSeriesEpisodes(series.slug, rssFeedEpisodes);
  const libraryEps = await getLibrarySeriesEpisodes(series.slug, series.order);
  const allEps = mergeAndDeduplicateEpisodes(rssSeriesEps, libraryEps, series.order);

  const idx = allEps.findIndex((ep) => ep.slug === episode.slug);
  const positionInSeries = idx >= 0 ? idx + 1 : null;

  return { seriesSlug: series.slug, positionInSeries };
}
