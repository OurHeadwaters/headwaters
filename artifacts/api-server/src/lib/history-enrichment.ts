/**
 * History enrichment for "This Day in History" episode tiles.
 *
 * For each episode in the this-day endpoint we compute:
 *  - historyImageUrl  – Wikipedia thumbnail for the history topic
 *  - lessonQuote      – the first strong declarative sentence from show notes
 *  - bulletPoints     – up to 6 short insight bullets from show notes
 *  - sourceLinks      – 1–3 Wikipedia links for the history topic
 *
 * Results are cached in-memory per episode slug so they are not re-fetched on
 * every request (TTL = 6 hours to balance freshness vs. external API load).
 */

import { logger } from "./logger";

export interface HistoryEnrichment {
  historyImageUrl: string | null;
  lessonQuote: string | null;
  bulletPoints: string[];
  sourceLinks: Array<{ label: string; url: string }>;
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

export async function enrichHistoryEpisode(
  slug: string,
  title: string,
  descriptionHtml: string | null,
  summary: string,
): Promise<HistoryEnrichment> {
  const cached = CACHE.get(slug);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const htmlContent = descriptionHtml ?? summary ?? "";
  const query = buildSearchQuery(title);

  const [historyImageUrl, sourceLinks] = await Promise.all([
    fetchWikipediaImage(query),
    fetchWikipediaSourceLinks(query),
  ]);

  const bulletPoints = extractBulletPoints(htmlContent);
  const lessonQuote = extractLessonQuote(htmlContent);

  const data: HistoryEnrichment = {
    historyImageUrl,
    lessonQuote,
    bulletPoints,
    sourceLinks,
  };

  CACHE.set(slug, { fetchedAt: Date.now(), data });
  return data;
}
