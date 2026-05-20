import { sql, type SQL } from "drizzle-orm";
import { contentItemsTable } from "@workspace/db";
import { type RssEpisode } from "./rss";

export type SeriesDefinition = {
  slug: string;
  title: string;
  description: string;
  iconEmoji: string;
  order: "asc" | "desc";
  detect: (episode: RssEpisode) => boolean;
  librarySql: () => SQL<unknown>;
};

export type SeriesSummary = {
  slug: string;
  title: string;
  description: string;
  iconEmoji: string;
  episodeCount: number;
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
    title: "Unloose the Goose",
    description:
      "Jack's irreverent deep-dives into news, politics, and culture — unfiltered and unscripted. These fan-favorite episodes let Jack loose on whatever's on his mind.",
    iconEmoji: "🪿",
    order: "desc",
    detect: (ep) => {
      const t = ep.title.toLowerCase();
      const s = ep.slug.toLowerCase();
      const sum = ep.summary.toLowerCase();
      return (
        /unloose\s+the\s+goose/i.test(ep.title) ||
        /\butg\b/.test(t) ||
        /unloose[^a-z]*goose/i.test(t) ||
        /unloose[^a-z]*goose/i.test(sum) ||
        s.includes("unloose") ||
        s.includes("utg-") ||
        ep.categories.some((c) => /unloose/i.test(c) || /\bgoose\b/i.test(c))
      );
    },
    librarySql: () => sql`(
      ${contentItemsTable.title} ILIKE '%unloose%goose%'
      OR ${contentItemsTable.title} ILIKE '%unloose the goose%'
      OR ${contentItemsTable.slug} ILIKE '%unloose%goose%'
      OR ${contentItemsTable.slug} ILIKE '%unloose-the-goose%'
      OR ${contentItemsTable.summary} ILIKE '%unloose the goose%'
      OR ${contentItemsTable.categories} @> '["Unloose the Goose"]'::jsonb
      OR ${contentItemsTable.tags} @> '["unloose the goose"]'::jsonb
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
      const sum = ep.summary.toLowerCase();
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
      OR ${contentItemsTable.categories} @> '["13 Stomps"]'::jsonb
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
      const sum = ep.summary.toLowerCase();
      return (
        /tuesday\s+chat/i.test(ep.title) ||
        /tuesday\s+chat/i.test(sum) ||
        s.includes("tuesday-chat") ||
        ep.categories.some(
          (c) => /tuesday\s+chat/i.test(c) || /^tuesday$/i.test(c.trim()),
        )
      );
    },
    librarySql: () => sql`(
      ${contentItemsTable.title} ILIKE '%tuesday chat%'
      OR ${contentItemsTable.slug} ILIKE '%tuesday-chat%'
      OR ${contentItemsTable.summary} ILIKE '%tuesday chat%'
      OR ${contentItemsTable.categories} @> '["Tuesday Chats"]'::jsonb
      OR ${contentItemsTable.categories} @> '["Tuesday Chat"]'::jsonb
      OR ${contentItemsTable.tags} @> '["tuesday chat"]'::jsonb
      OR ${contentItemsTable.tags} @> '["tuesday"]'::jsonb
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
      const sum = ep.summary.toLowerCase();
      const hasHistoryKeyword =
        /history\s+with\s+jack/i.test(ep.title) ||
        /history\s+of\s+/i.test(ep.title) ||
        /\bhistory\b.*\b(episode|epi)\b/i.test(ep.title) ||
        /history\s+with\s+jack/i.test(sum) ||
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
      OR ${contentItemsTable.categories} @> '["History"]'::jsonb
      OR ${contentItemsTable.categories} @> '["History with Jack"]'::jsonb
      OR ${contentItemsTable.tags} @> '["history"]'::jsonb
      OR ${contentItemsTable.tags} @> '["history with jack"]'::jsonb
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
    latestPubDate,
    sampleArtworkUrl: episodes.find((e) => e.artworkUrl)?.artworkUrl ?? null,
  };
}
