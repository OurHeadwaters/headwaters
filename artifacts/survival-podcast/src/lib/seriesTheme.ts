/**
 * Central source of truth for series color themes.
 *
 * To update or add a series:
 *   1. Add an entry to SERIES_THEMES keyed by the series slug.
 *   2. That's it — both the homepage and series-index page pick it up automatically.
 *
 * If a slug has no entry here, getSeriesTheme() generates a consistent palette
 * derived from the slug text so unknown series still look intentional.
 */

export interface SeriesTheme {
  /** Tailwind gradient + border classes for card backgrounds */
  card: string;
  /** Tailwind classes for the inline badge */
  badge: string;
}

const SERIES_THEMES: Record<string, SeriesTheme> = {
  "unloose-the-goose": {
    card: "from-amber-900/40 to-amber-800/20 border-amber-700/30",
    badge: "bg-amber-900/30 text-amber-300 border-amber-700/40",
  },
  "13-stomps": {
    card: "from-stone-900/40 to-stone-800/20 border-stone-700/30",
    badge: "bg-stone-800/50 text-stone-300 border-stone-600/40",
  },
  "tuesday-chats": {
    card: "from-emerald-900/40 to-emerald-800/20 border-emerald-700/30",
    badge: "bg-emerald-900/30 text-emerald-300 border-emerald-700/40",
  },
  history: {
    card: "from-indigo-900/40 to-indigo-800/20 border-indigo-700/30",
    badge: "bg-indigo-900/30 text-indigo-300 border-indigo-700/40",
  },
};

/**
 * Fallback palettes cycled through when a slug has no explicit theme entry.
 * Uses a stable hash of the slug so the same series always gets the same colour.
 */
const FALLBACK_PALETTES: SeriesTheme[] = [
  {
    card: "from-zinc-900/40 to-zinc-800/20 border-zinc-700/30",
    badge: "bg-zinc-800/50 text-zinc-300 border-zinc-600/40",
  },
  {
    card: "from-sky-900/40 to-sky-800/20 border-sky-700/30",
    badge: "bg-sky-900/30 text-sky-300 border-sky-700/40",
  },
  {
    card: "from-violet-900/40 to-violet-800/20 border-violet-700/30",
    badge: "bg-violet-900/30 text-violet-300 border-violet-700/40",
  },
  {
    card: "from-rose-900/40 to-rose-800/20 border-rose-700/30",
    badge: "bg-rose-900/30 text-rose-300 border-rose-700/40",
  },
  {
    card: "from-teal-900/40 to-teal-800/20 border-teal-700/30",
    badge: "bg-teal-900/30 text-teal-300 border-teal-700/40",
  },
  {
    card: "from-orange-900/40 to-orange-800/20 border-orange-700/30",
    badge: "bg-orange-900/30 text-orange-300 border-orange-700/40",
  },
];

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (Math.imul(31, h) + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Returns the SeriesTheme for a given slug.
 * Falls back to a deterministic palette derived from the slug text
 * so new series never appear in an ugly grey without a code change.
 */
export function getSeriesTheme(slug: string): SeriesTheme {
  return SERIES_THEMES[slug] ?? FALLBACK_PALETTES[hashSlug(slug) % FALLBACK_PALETTES.length];
}
