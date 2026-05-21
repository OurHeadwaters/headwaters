/**
 * History enrichment for "This Day in History" episode tiles.
 *
 * For each episode in the this-day endpoint we compute:
 *  - historyImageUrl  – Wikipedia thumbnail (used as background wash only, low opacity)
 *  - lessonQuote      – kept for backward compatibility (no longer rendered on tile face)
 *  - bulletPoints     – kept for backward compatibility (no longer rendered on tile face)
 *  - sourceLinks      – kept for backward compatibility (removed from tile face)
 *  - ulgCrossLink     – a related Unloose the Goose episode on the same historical topic
 *  - expertLink       – a TSP episode featuring the Expert Council historian, if relevant
 *
 * Sourcing priority (per design brief):
 *   1. Unloose the Goose archive — keyword match against ULG episode titles and body text
 *   2. Expert Council historian — full-text search for TSP episodes featuring a historian
 *      whose credentials match the history topic
 *   3. Wikipedia — demoted to background texture only (image wash, no bullets or links)
 *
 * Results are cached in-memory per episode slug (TTL = 6 hours).
 */

import { logger } from "./logger";
import { db, contentItemsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

export interface HistoryCrossLink {
  title: string;
  slug: string;
  url: string;
}

export interface HistoryEnrichment {
  historyImageUrl: string | null;
  lessonQuote: string | null;
  bulletPoints: string[];
  sourceLinks: Array<{ label: string; url: string }>;
  ulgCrossLink: HistoryCrossLink | null;
  expertLink: HistoryCrossLink | null;
}

const CACHE = new Map<string, { fetchedAt: number; data: HistoryEnrichment }>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function stripHtml(html: string): string {
  return html
    .replace(/<\/(p|div|li|h\d|br|tr|dt|dd)>/gi, " \n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, " ")
    .trim();
}

function getSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 300 && /[a-zA-Z]/.test(s));
}

function extractHistoryTopicKeywords(title: string): string[] {
  const cleaned = title
    .replace(/ep[\s\-#]*\d+/gi, "")
    .replace(/\bTSP\b/gi, "")
    .replace(/\d{4}/g, "")
    .replace(/[–—\-|,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const stopwords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "was", "are", "were", "this", "that",
    "it", "its", "be", "been", "being", "have", "has", "had", "do", "does",
    "did", "will", "would", "could", "should", "may", "might", "shall",
    "can", "our", "my", "we", "they", "he", "she", "you", "i",
    "episode", "podcast", "show", "jack", "spirko", "today", "day",
    "history", "historical", "date",
  ]);

  const words = cleaned
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w.toLowerCase()));

  return words.slice(0, 5);
}

function buildSearchQuery(title: string): string {
  const keywords = extractHistoryTopicKeywords(title);
  return keywords.join(" ").trim() || title.slice(0, 60);
}

async function fetchWikipediaImage(
  query: string,
): Promise<string | null> {
  try {
    const url = new URL("https://en.wikipedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrsearch", query);
    url.searchParams.set("gsrlimit", "3");
    url.searchParams.set("prop", "pageimages");
    url.searchParams.set("piprop", "thumbnail");
    url.searchParams.set("pithumbsize", "800");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "TSP-Site/1.0 (https://thesurvivalpodcast.com)" },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      query?: {
        pages?: Record<
          string,
          { thumbnail?: { source?: string } }
        >;
      };
    };

    const pages = data?.query?.pages;
    if (!pages) return null;

    for (const page of Object.values(pages)) {
      if (page.thumbnail?.source) return page.thumbnail.source;
    }
    return null;
  } catch (err) {
    logger.debug({ err }, "history-enrichment: Wikipedia image fetch failed");
    return null;
  }
}

async function fetchWikipediaSourceLinks(
  query: string,
): Promise<Array<{ label: string; url: string }>> {
  try {
    const url = new URL("https://en.wikipedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("list", "search");
    url.searchParams.set("srsearch", query);
    url.searchParams.set("srlimit", "3");
    url.searchParams.set("srinfo", "");
    url.searchParams.set("srprop", "snippet");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "TSP-Site/1.0 (https://thesurvivalpodcast.com)" },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as {
      query?: {
        search?: Array<{ title: string; pageid: number }>;
      };
    };

    const hits = data?.query?.search ?? [];
    return hits.slice(0, 3).map((hit) => ({
      label: hit.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title.replace(/ /g, "_"))}`,
    }));
  } catch (err) {
    logger.debug({ err }, "history-enrichment: Wikipedia source links fetch failed");
    return [];
  }
}

function extractBulletPoints(descriptionHtml: string): string[] {
  const text = stripHtml(descriptionHtml);
  const sentences = getSentences(text);

  const bullets: string[] = [];
  for (const s of sentences) {
    if (bullets.length >= 6) break;
    const trimmed = s.replace(/^[-–•*·\s]+/, "").trim();
    if (trimmed.length > 25 && trimmed.length < 250) {
      bullets.push(trimmed);
    }
  }
  return bullets.slice(0, 6);
}

function extractLessonQuote(descriptionHtml: string): string | null {
  const text = stripHtml(descriptionHtml);
  const sentences = getSentences(text);

  const declarative = sentences.find((s) => {
    const t = s.trim();
    if (t.length < 40 || t.length > 180) return false;
    if (/^(http|www\.|listen|click|subscribe|follow|join|today we|welcome)/i.test(t)) return false;
    if (/^\d/.test(t)) return false;
    return true;
  });

  return declarative ?? null;
}

/**
 * Look for a ULG episode that discusses the same historical topic.
 * Uses full-text search against ULG episode titles and body text.
 * Returns null if the DB is unavailable or no match is found.
 */
export async function findUlgCrossLink(
  title: string,
): Promise<HistoryCrossLink | null> {
  const keywords = extractHistoryTopicKeywords(title);
  if (keywords.length === 0) return null;

  const queryText = keywords.slice(0, 3).join(" ");

  try {
    const rows = await db
      .select({
        title: contentItemsTable.title,
        slug: contentItemsTable.slug,
        link: contentItemsTable.link,
      })
      .from(contentItemsTable)
      .where(
        sql`${contentItemsTable.source} = 'ulg'
          AND ${contentItemsTable.kind} = 'audio'
          AND to_tsvector('english', ${contentItemsTable.title} || ' ' || ${contentItemsTable.bodyText})
            @@ plainto_tsquery('english', ${queryText})`,
      )
      .limit(1);

    if (rows[0]) {
      return {
        title: rows[0].title,
        slug: rows[0].slug,
        url: rows[0].link,
      };
    }
  } catch (err) {
    logger.debug({ err }, "history-enrichment: ULG cross-link lookup failed");
  }
  return null;
}

/**
 * Look for a TSP episode featuring Prof CJ Kilmer, the Expert Council historian.
 *
 * Search strategy (in order of preference):
 *  1. Slug prefix match — episodes whose slug starts with known CJ Kilmer slug
 *     prefixes (most precise; avoids false positives).
 *  2. Name match — full-text search for "kilmer" in show notes. This catches any
 *     episode where CJ is mentioned by name, regardless of slug convention.
 *
 * Both passes look for a topic-keyword overlap with the current history segment
 * so we surface a contextually relevant episode rather than always the same one.
 * If no topic-overlapping episode is found we fall back to any CJ Kilmer episode.
 *
 * Returns null if the DB is unavailable or no CJ Kilmer episode exists.
 */
const CJ_KILMER_SLUG_PREFIXES = [
  "societal-collapse-with-cj-kilmer",
  "prof-cj-personal-liberty",
  "prof-cj-kilmer",
  "cj-kilmer",
];

export async function findExpertLink(
  title: string,
): Promise<HistoryCrossLink | null> {
  const keywords = extractHistoryTopicKeywords(title);
  const queryText = keywords.slice(0, 3).join(" ");

  const slugPrefixCondition = sql`(${sql.join(
    CJ_KILMER_SLUG_PREFIXES.map((p) => sql`${contentItemsTable.slug} LIKE ${p + "%"}`),
    sql` OR `,
  )})`;

  try {
    if (queryText.trim()) {
      const topicRows = await db
        .select({
          title: contentItemsTable.title,
          slug: contentItemsTable.slug,
          link: contentItemsTable.link,
        })
        .from(contentItemsTable)
        .where(
          sql`${contentItemsTable.source} != 'ulg'
            AND ${contentItemsTable.kind} = 'audio'
            AND (
              ${slugPrefixCondition}
              OR to_tsvector('english', ${contentItemsTable.title} || ' ' || ${contentItemsTable.bodyText})
                @@ plainto_tsquery('english', 'kilmer')
            )
            AND to_tsvector('english', ${contentItemsTable.title} || ' ' || ${contentItemsTable.bodyText})
              @@ plainto_tsquery('english', ${queryText})`,
        )
        .limit(1);

      if (topicRows[0]) {
        return {
          title: topicRows[0].title,
          slug: topicRows[0].slug,
          url: `/episodes/${topicRows[0].slug}`,
        };
      }
    }

    const fallbackRows = await db
      .select({
        title: contentItemsTable.title,
        slug: contentItemsTable.slug,
        link: contentItemsTable.link,
      })
      .from(contentItemsTable)
      .where(
        sql`${contentItemsTable.source} != 'ulg'
          AND ${contentItemsTable.kind} = 'audio'
          AND (
            ${slugPrefixCondition}
            OR to_tsvector('english', ${contentItemsTable.title} || ' ' || ${contentItemsTable.bodyText})
              @@ plainto_tsquery('english', 'kilmer')
          )`,
      )
      .limit(1);

    if (fallbackRows[0]) {
      return {
        title: fallbackRows[0].title,
        slug: fallbackRows[0].slug,
        url: `/episodes/${fallbackRows[0].slug}`,
      };
    }
  } catch (err) {
    logger.debug({ err }, "history-enrichment: expert link lookup failed");
  }
  return null;
}

export interface PrecomputedCrossLinks {
  ulgCrossLink?: HistoryCrossLink | null;
  expertLink?: HistoryCrossLink | null;
}

export async function enrichHistoryEpisode(
  slug: string,
  title: string,
  descriptionHtml: string | null,
  summary: string,
  precomputed?: PrecomputedCrossLinks,
): Promise<HistoryEnrichment> {
  const cached = CACHE.get(slug);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const htmlContent = descriptionHtml ?? summary ?? "";
  const query = buildSearchQuery(title);

  const hasPrecomputedUlg = precomputed != null && "ulgCrossLink" in precomputed;
  const hasPrecomputedExpert = precomputed != null && "expertLink" in precomputed;

  const [historyImageUrl, sourceLinks, ulgCrossLink, expertLink] = await Promise.all([
    fetchWikipediaImage(query),
    fetchWikipediaSourceLinks(query),
    hasPrecomputedUlg ? Promise.resolve(precomputed!.ulgCrossLink ?? null) : findUlgCrossLink(title),
    hasPrecomputedExpert ? Promise.resolve(precomputed!.expertLink ?? null) : findExpertLink(title),
  ]);

  const bulletPoints = extractBulletPoints(htmlContent);
  const lessonQuote = extractLessonQuote(htmlContent);

  const data: HistoryEnrichment = {
    historyImageUrl,
    lessonQuote,
    bulletPoints,
    sourceLinks,
    ulgCrossLink,
    expertLink,
  };

  CACHE.set(slug, { fetchedAt: Date.now(), data });
  return data;
}
