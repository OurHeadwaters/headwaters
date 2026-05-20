import sanitizeHtmlLib from "sanitize-html";
import { logger } from "../logger";
import { fetchAudioChapters, extractChapterHistoryTimestamp, pMap } from "../id3-chapters";
import type { InsertContentItem } from "@workspace/db";

const WP_BASE = "https://www.thesurvivalpodcast.com/wp-json/wp/v2";
const FETCH_TIMEOUT_MS = 30_000;
const PAGE_SIZE = 50;
const RETRY_ATTEMPTS = 3;
const RETRY_BASE_MS = 1000;

type WPRendered = { rendered?: string } | string | undefined | null;

type WPPost = {
  id: number;
  date_gmt: string;
  date: string;
  slug: string;
  link: string;
  title: WPRendered;
  excerpt: WPRendered;
  content: WPRendered;
  categories?: number[];
  tags?: number[];
};

type WPTerm = { id: number; name: string; slug: string };

async function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(
  url: string,
  signal?: AbortSignal,
): Promise<{ data: T; headers: Headers }> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const onAbort = () => controller.abort();
    signal?.addEventListener("abort", onAbort);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "TSP-Library/1.0 (+replit)",
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const data = (await res.json()) as T;
        return { data, headers: res.headers };
      }
      if (res.status >= 500 && attempt < RETRY_ATTEMPTS) {
        await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));
        lastErr = new Error(`HTTP ${res.status}`);
        continue;
      }
      const body = await res.text().catch(() => "");
      throw new Error(`WP ${res.status} ${url}: ${body.slice(0, 160)}`);
    } catch (err) {
      lastErr = err;
      if (attempt < RETRY_ATTEMPTS) {
        await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("WP fetch failed");
}

function rendered(value: WPRendered): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.rendered ?? "";
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;|&apos;/g, "'")
    .replace(/&hellip;/g, "…")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&rsquo;|&#8217;/g, "’")
    .replace(/&lsquo;|&#8216;/g, "‘")
    .replace(/&ldquo;|&#8220;/g, "“")
    .replace(/&rdquo;|&#8221;/g, "”")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<\/(p|div|li|h\d|br)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const SANITIZE_OPTIONS: sanitizeHtmlLib.IOptions = {
  allowedTags: [
    "p", "br", "hr", "blockquote", "pre", "code",
    "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li",
    "strong", "em", "b", "i", "u", "s", "sub", "sup",
    "a", "img", "figure", "figcaption",
    "audio", "source",
    "table", "thead", "tbody", "tr", "th", "td",
    "span", "div",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    audio: ["controls", "preload"],
    source: ["src", "type"],
    span: ["class"],
    div: ["class"],
    "*": ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    img: ["http", "https", "data"],
  },
  transformTags: {
    a: sanitizeHtmlLib.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
  },
  disallowedTagsMode: "discard",
};

function sanitizeHtml(html: string): string {
  return sanitizeHtmlLib(html, SANITIZE_OPTIONS);
}

function parseEpisodeNumber(title: string): number | null {
  const m = title.match(/Epi[-\s]?(\d{2,5})/i);
  if (m) return Number(m[1]);
  const m2 = title.match(/Episode\s+(\d{2,5})/i);
  if (m2) return Number(m2[1]);
  return null;
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s*[–—-]\s*Epi[-\s]?\d{2,5}\s*$/i, "")
    .replace(/\s*[–—-]\s*Episode\s+\d{2,5}\s*$/i, "")
    .trim();
}

function parseIsoDuration(value: string | undefined): number | null {
  if (!value) return null;
  const m = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/);
  if (!m) return null;
  const h = m[1] ? Number(m[1]) : 0;
  const min = m[2] ? Number(m[2]) : 0;
  const s = m[3] ? Math.round(Number(m[3])) : 0;
  return h * 3600 + min * 60 + s;
}

function parseDurationFromText(text: string): number | null {
  const m = text.match(/Duration:\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/i);
  if (!m) return null;
  if (m[3]) return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  return Number(m[1]) * 60 + Number(m[2]);
}

type ExtractedMedia = {
  audioUrl: string | null;
  audioType: string | null;
  durationSeconds: number | null;
  artworkUrl: string | null;
  videoId: string | null;
  videoUrl: string | null;
};

function extractMedia(html: string): ExtractedMedia {
  const audioMatch =
    html.match(/<source[^>]+type="audio\/[^"]+"[^>]+src="([^"]+)"/i) ||
    html.match(/<source[^>]+src="([^"]+\.mp3[^"]*)"/i) ||
    html.match(/itemprop="contentUrl"[^>]+content="([^"]+\.mp3[^"]*)"/i);
  let audioUrl = audioMatch ? decodeEntities(audioMatch[1]).split("?")[0] : null;
  if (audioUrl && audioUrl.startsWith("//")) audioUrl = "https:" + audioUrl;
  const audioType = audioUrl ? "audio/mpeg" : null;
  const isoDur = html.match(/itemprop="duration"[^>]+content="([^"]+)"/i);
  const durationSeconds =
    parseIsoDuration(isoDur?.[1]) ?? parseDurationFromText(html);
  const imgMatch =
    html.match(/<img[^>]+class="[^"]*wp-image[^"]*"[^>]+src="([^"]+)"/i) ||
    html.match(/<img[^>]+src="([^"]+\.(?:jpe?g|png|webp)[^"]*)"[^>]*class="[^"]*aligncenter[^"]*"/i) ||
    html.match(/<img[^>]+src="([^"]+\.(?:jpe?g|png|webp)[^"]*)"/i);
  const artworkUrl = imgMatch ? decodeEntities(imgMatch[1]) : null;
  const ytMatch =
    html.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/i) ||
    html.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/i) ||
    html.match(/youtube\.com\/watch\?v=([A-Za-z0-9_-]{6,})/i);
  const videoId = ytMatch ? ytMatch[1] : null;
  const videoUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
  return { audioUrl, audioType, durationSeconds, artworkUrl, videoId, videoUrl };
}

async function fetchAllTerms(
  kind: "categories" | "tags",
  signal?: AbortSignal,
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  let page = 1;
  while (true) {
    const url = `${WP_BASE}/${kind}?per_page=100&page=${page}&_fields=id,name`;
    try {
      const { data, headers } = await fetchJson<WPTerm[]>(url, signal);
      for (const t of data) map.set(t.id, decodeEntities(t.name));
      const totalPages = Number(headers.get("x-wp-totalpages") ?? "1");
      if (page >= totalPages || data.length === 0) break;
      page += 1;
    } catch (err) {
      logger.warn({ err, kind, page }, "WP taxonomy page failed; continuing");
      page += 1;
      if (page > 30) break;
    }
  }
  return map;
}

function postToInsert(
  post: WPPost,
  categories: Map<number, string>,
  tags: Map<number, string>,
): InsertContentItem {
  const html = rendered(post.content);
  const sanitized = sanitizeHtml(html);
  const rawTitle = decodeEntities(stripHtml(rendered(post.title))).trim();
  const title = cleanTitle(rawTitle);
  const episodeNumber = parseEpisodeNumber(rawTitle);
  const media = extractMedia(html);
  const summary = stripHtml(rendered(post.excerpt) || html).slice(0, 320);
  const bodyText = stripHtml(html);
  const kind: "audio" | "article" = media.audioUrl ? "audio" : "article";
  const cats = (post.categories ?? [])
    .map((id) => categories.get(id))
    .filter((c): c is string => !!c && c.toLowerCase() !== "podcasts");
  const tagNames = (post.tags ?? [])
    .map((id) => tags.get(id))
    .filter((c): c is string => !!c);
  const publishedAt = new Date(post.date_gmt + "Z");
  return {
    source: "wordpress",
    sourceId: String(post.id),
    kind,
    slug: post.slug || `post-${post.id}`,
    title,
    link: post.link,
    summary,
    bodyHtml: sanitized,
    bodyText,
    publishedAt,
    durationSeconds: media.durationSeconds,
    audioUrl: media.audioUrl,
    audioType: media.audioType,
    videoUrl: media.videoUrl,
    videoId: media.videoId,
    artworkUrl: media.artworkUrl,
    episodeNumber,
    categories: cats,
    tags: tagNames,
    extra: {},
  };
}

const CHAPTER_FETCH_CONCURRENCY = 8;

/**
 * For each insert item that has an audioUrl and hasn't already had its chapters
 * checked (indicated by `extra.historyTimestampChecked` in the existing DB
 * record), fetch ID3/podcast:chapters and write `historyTimestamp` +
 * `historyTimestampChecked` into the item's `extra` field.
 *
 * Items that are already marked checked keep their existing values; `extra` is
 * left untouched so the JSONB-merge upsert in library.ts can preserve them.
 */
async function enrichWithChapterTimestamps(
  inserts: InsertContentItem[],
  existingExtras: Map<string, Record<string, unknown>>,
): Promise<void> {
  const toEnrich = inserts.filter((item) => {
    if (!item.audioUrl) return false;
    const existing = existingExtras.get(item.sourceId);
    // Skip if we've already checked this episode in a previous sync
    return !existing?.historyTimestampChecked;
  });

  if (toEnrich.length === 0) return;

  logger.debug({ count: toEnrich.length }, "Fetching chapters for unchecked episodes");

  await pMap(
    toEnrich,
    async (item) => {
      const chaptersJsonUrl =
        (item.extra as Record<string, unknown> | undefined)?.chaptersJsonUrl as
          | string
          | undefined;
      const chapters = await fetchAudioChapters(
        item.audioUrl!,
        chaptersJsonUrl ?? null,
      );
      const historyTimestamp = extractChapterHistoryTimestamp(chapters);
      item.extra = {
        ...(item.extra as Record<string, unknown>),
        historyTimestamp,
        historyTimestampChecked: true,
      };
    },
    CHAPTER_FETCH_CONCURRENCY,
  );
}

export type WordPressSyncResult = {
  itemsSeen: number;
  itemsUpserted: number;
  failedPages: number[];
};

/**
 * Page through the entire WordPress archive, upserting per-page so partial
 * progress is preserved if his shaky WordPress instance 500s deep in the
 * archive. Failed pages are logged and retried on the next refresh cycle.
 *
 * `getExistingExtras` (optional) is called once per page with the source IDs
 * of the posts on that page; it should return a map of sourceId → existing
 * `extra` record from the DB so that already-checked episodes can skip the
 * audio chapter fetch.
 */
export async function syncWordPressArchive(options: {
  signal?: AbortSignal;
  upsertPage: (items: InsertContentItem[]) => Promise<number>;
  getExistingExtras?: (
    sourceIds: string[],
  ) => Promise<Map<string, Record<string, unknown>>>;
}): Promise<WordPressSyncResult> {
  const { signal, upsertPage, getExistingExtras } = options;
  const [categories, tags] = await Promise.all([
    fetchAllTerms("categories", signal),
    fetchAllTerms("tags", signal),
  ]);
  logger.info({ categories: categories.size, tags: tags.size }, "WP taxonomy loaded");

  let page = 1;
  let totalPages = 1;
  let itemsSeen = 0;
  let itemsUpserted = 0;
  const failedPages: number[] = [];
  const fields = ["id", "date", "date_gmt", "slug", "link", "title", "excerpt", "content", "categories", "tags"].join(",");

  while (true) {
    const url = `${WP_BASE}/posts?per_page=${PAGE_SIZE}&page=${page}&_fields=${fields}&orderby=date&order=desc`;
    try {
      const { data, headers } = await fetchJson<WPPost[]>(url, signal);
      totalPages = Number(headers.get("x-wp-totalpages") ?? totalPages.toString());
      const inserts = data.map((p) => postToInsert(p, categories, tags));

      // Fetch existing extras so already-checked episodes skip audio fetching
      let existingExtras = new Map<string, Record<string, unknown>>();
      if (getExistingExtras) {
        try {
          existingExtras = await getExistingExtras(inserts.map((i) => i.sourceId));
        } catch (err) {
          logger.warn({ err }, "WP sync: getExistingExtras failed; will re-check chapters");
        }
      }

      await enrichWithChapterTimestamps(inserts, existingExtras);
      const written = await upsertPage(inserts);
      itemsSeen += data.length;
      itemsUpserted += written;
      logger.info({ page, totalPages, itemsSeen, itemsUpserted }, "WP page synced");
      if (page >= totalPages || data.length === 0) break;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn({ page, err: msg }, "WP page failed after retries; skipping");
      failedPages.push(page);
      if (failedPages.length > 10) {
        logger.error("Too many failed WP pages; aborting refresh");
        break;
      }
    }
    page += 1;
    if (page > 200) break;
  }

  return { itemsSeen, itemsUpserted, failedPages };
}
