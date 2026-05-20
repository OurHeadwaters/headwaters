import { type RssEpisode } from "./rss";

export type SeriesDefinition = {
  slug: string;
  title: string;
  description: string;
  iconEmoji: string;
  order: "asc" | "desc";
  detect: (episode: RssEpisode) => boolean;
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
    detect: (ep) =>
      /unloose\s+the\s+goose/i.test(ep.title) ||
      ep.categories.some((c) => /unloose/i.test(c)),
  },
  {
    slug: "13-stomps",
    title: "13 Stomps",
    description:
      'A recurring series where Jack tackles 13 specific topics in one episode — deep, practical, and wide-ranging. Each installment is a standalone masterclass in self-reliance.',
    iconEmoji: "🥾",
    order: "desc",
    detect: (ep) =>
      /13\s+stomps?/i.test(ep.title) ||
      ep.categories.some((c) => /13\s+stomps?/i.test(c)),
  },
  {
    slug: "tuesday-chats",
    title: "Tuesday Chats",
    description:
      "Casual conversations recorded on Tuesdays — lighter in tone but rich in insight. Great entry points for new listeners and longtime fans alike.",
    iconEmoji: "💬",
    order: "desc",
    detect: (ep) =>
      /tuesday\s+chat/i.test(ep.title) ||
      ep.categories.some((c) => /tuesday\s+chat/i.test(c)),
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
      const hasHistoryKeyword =
        /history\s+with\s+jack/i.test(ep.title) ||
        /history\s+of\s+/i.test(ep.title) ||
        /\bhistory\b.*\b(episode|epi)\b/i.test(ep.title) ||
        ep.categories.some(
          (c) =>
            /\bhistory\b/i.test(c) &&
            !/natural history/i.test(c),
        );
      const hasHistoricalKeywords =
        /\b(ancient|medieval|world war|civil war|revolutionary|colonial|roman|greek|viking|renaissance|ottoman|mongol|byzantine|empire)\b/i.test(
          titleLower,
        );
      return hasHistoryKeyword || hasHistoricalKeywords;
    },
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
