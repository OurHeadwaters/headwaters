export interface SeriesMeta {
  slug: string;
  name: string;
  emoji: string;
}

const KNOWN_SERIES: SeriesMeta[] = [
  { slug: "unloose-the-goose", name: "Unloose the Goose", emoji: "🪿" },
  { slug: "13-stomps", name: "13 Stomps", emoji: "👣" },
  { slug: "tuesday-chats", name: "Tuesday Chats", emoji: "💬" },
  { slug: "history", name: "This Day in History", emoji: "📅" },
];

export function getSeriesMeta(slug: string): SeriesMeta | undefined {
  return KNOWN_SERIES.find((s) => s.slug === slug);
}

type EpisodeLike = {
  title: string;
  categories: string[];
  descriptionHtml?: string | null;
};

export function detectSeriesSlug(ep: EpisodeLike): string | null {
  const t = ep.title;
  const cats = ep.categories;

  if (/unloose\s+the\s+goose/i.test(t) || cats.some((c) => /unloose/i.test(c))) {
    return "unloose-the-goose";
  }
  if (/13\s+stomps?/i.test(t) || cats.some((c) => /13\s+stomps?/i.test(c))) {
    return "13-stomps";
  }
  if (/tuesday\s+chat/i.test(t) || cats.some((c) => /tuesday\s+chat/i.test(c))) {
    return "tuesday-chats";
  }

  const tl = t.toLowerCase();
  const showNotesHaveHistory =
    !!ep.descriptionHtml &&
    /this\s+day\s+in\s+history|today\s+in\s+history|on\s+this\s+day/i.test(ep.descriptionHtml);

  if (
    showNotesHaveHistory ||
    /history\s+with\s+jack/i.test(t) ||
    /history\s+of\s+/i.test(t) ||
    /\bhistory\b.*\b(episode|epi)\b/i.test(t) ||
    cats.some((c) => /\bhistory\b/i.test(c) && !/natural history/i.test(c)) ||
    /\b(ancient|medieval|world war|civil war|revolutionary|colonial|roman|greek|viking|renaissance|ottoman|mongol|byzantine|empire)\b/i.test(
      tl,
    )
  ) {
    return "history";
  }

  return null;
}
