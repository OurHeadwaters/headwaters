import { XMLParser } from "fast-xml-parser";
import { logger } from "../logger";
import type { InsertContentItem } from "@workspace/db";

/**
 * Primary feed URL. This site's SSL cert expired; the domain may be unreachable
 * from the current hosting environment. All known Wayback Machine snapshots are
 * used as a fallback to ensure a full backfill of the archive.
 */
const LIVE_FEED_URL = "https://unloosethegoose.com/feed/podcast";

/**
 * All distinct Wayback Machine snapshots of the ULG feed, oldest first.
 * Using the `id_` modifier returns raw feed XML without the Wayback toolbar.
 *
 * The ULG RSS feed appears to cap at roughly 15–16 recent items, so episodes
 * published between two consecutive snapshot captures can fall out of the feed
 * before the next snapshot is taken. To cover those gaps we add intermediate
 * timestamps alongside the original 10.  Wayback redirects each `id_` request
 * to the nearest actual snapshot — deduplication by GUID prevents double-counting.
 *
 * Gap windows that need extra coverage:
 *   Ep 16-19  ≈ 2020-10-29 to 2020-12-02  (between Oct-27 and Feb-28 snapshots)
 *   Ep 30-34  ≈ 2021-03-04 to 2021-04-08  (between Feb-28 and Jun-25 snapshots)
 *   Ep 62-68  ≈ 2021-12-11 to 2022-01-12  (between Sep-27 and Jan-21 snapshots)
 *   Ep 72-74  ≈ 2022-01-30 to 2022-03-12  (between Jan-21 and Jul-02 snapshots)
 *   Ep 76-77  ≈ 2024 (after last May-23-2024 snapshot)
 */
const WAYBACK_SNAPSHOTS = [
  // ── original 10 snapshots ──────────────────────────────────────────────────
  "https://web.archive.org/web/20200718043305id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20200824153404id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20201027154519id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20210228063758id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20210625033936id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20210927005818id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20220121015908id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20220702201617id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20230625235117id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20240523055822id_/https://unloosethegoose.com/feed/podcast",

  // ── Ep 16-19 window: late Oct – early Dec 2020 ────────────────────────────
  "https://web.archive.org/web/20201102000000id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20201115000000id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20201128000000id_/https://unloosethegoose.com/feed/podcast",

  // ── Ep 30-34 window: Mar – early Apr 2021 ─────────────────────────────────
  "https://web.archive.org/web/20210310000000id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20210325000000id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20210405000000id_/https://unloosethegoose.com/feed/podcast",

  // ── Ep 62-68 window: mid-Dec 2021 – mid-Jan 2022 ─────────────────────────
  "https://web.archive.org/web/20211215000000id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20211228000000id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20220108000000id_/https://unloosethegoose.com/feed/podcast",

  // ── Ep 72-74 window: Feb – mid-Mar 2022 ───────────────────────────────────
  "https://web.archive.org/web/20220210000000id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20220225000000id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20220310000000id_/https://unloosethegoose.com/feed/podcast",

  // ── Ep 76-77 window: mid-2022 through 2025 ────────────────────────────────
  "https://web.archive.org/web/20220501000000id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20220801000000id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20221101000000id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20230201000000id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20230901000000id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20231201000000id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20240301000000id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20240701000000id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20241001000000id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20241201000000id_/https://unloosethegoose.com/feed/podcast",
  "https://web.archive.org/web/20250201000000id_/https://unloosethegoose.com/feed/podcast",
];

/** Wayback CDX API endpoint — returns all known snapshots for a URL pattern */
const WAYBACK_CDX_API = "https://web.archive.org/cdx/search/cdx";

/**
 * ── MISSING EPISODE GAP DOCUMENTATION (investigation May 2026) ───────────────
 *
 * Episode count note: the original backfill task referenced "9 missing episodes"
 * but listed Ep 62-64, 66-68, 72-74, 76 — which is 10 distinct numbers.
 * The investigation below covers all 10.
 *
 * TARGET EPISODES: 62, 63, 64, 66, 67, 68, 72, 73, 74, 76
 *
 * ── VERIFIED (checked directly, May 2026) ────────────────────────────────────
 *
 * SOURCE 1 — survivalpodcast.net audio server directory listings (Apache open
 *   directory; listings are complete and enumerable):
 *     /audio/goose/2021/  contains: epi-023–epi-061, epi-065, epi-069
 *                         ABSENT:   epi-062, 063, 064, 066, 067, 068
 *     /audio/goose/2022/  contains: epi-070, epi-071, epi-075
 *                         ABSENT:   epi-072, 073, 074, 076
 *     /audio/goose/2024/  contains: epi-077 only
 *   The audio files for those 10 episode numbers do not exist on the server.
 *
 * SOURCE 2 — Wayback Machine feed snapshot, Jan 2022 (closest capture to when
 *   Ep 62-68 would have aired):  feed shows Ep 70, 69, 61, 60 … — it jumps
 *   directly from Ep 61 to Ep 69.  Those 7 episodes were never present in any
 *   archived feed snapshot.
 *
 * SOURCE 3 — Wayback Machine availability API:  queried slug patterns ep-62,
 *   episode-62, epi-62 (and equivalents for all 10 episode numbers).  No
 *   archived episode pages were found for any of these patterns.
 *
 * ── UNVERIFIED (sources not queryable at investigation time) ──────────────────
 *
 * SOURCE 4 — Wayback CDX API:  returned HTTP 503 at investigation time.
 *   Broader slug-based discovery was not possible.  Note: every intermediate
 *   snapshot URL in WAYBACK_SNAPSHOTS (Strategy 1 above) already probes those
 *   time windows; if any episode existed in a feed, Strategy 1 would have found
 *   it.  CDX would only add value if episodes had dedicated web pages that were
 *   never in any feed.
 *
 * SOURCE 5 — Listen Notes API:  LISTEN_NOTES_API_KEY env var was not set;
 *   this source could not be queried.  Strategy 3 (fetchEpisodesFromListenNotes)
 *   runs automatically at each sync when the key is present — check sync logs
 *   if the key is ever added.  Listen Notes may have metadata even if audio is
 *   gone from the original server.
 *
 * ── WORKING HYPOTHESIS ────────────────────────────────────────────────────────
 *
 *   The audio server listings are complete and the Jan 2022 feed snapshot
 *   independently corroborates the gaps.  These episodes were either never
 *   publicly released, or their audio was removed from the server after a brief
 *   publication window.  Status should be treated as "unrecoverable from known
 *   public sources" until Listen Notes is queried with a valid API key or a
 *   private backup of the original host surfaces.
 *
 * NOTE ON EP 43:  The 2021 directory also has two ep-042 files
 *   (epi-042-fnords.mp3 and epi-042-gsd-and-btc.mp3) and no epi-043.
 *   Ep 43 appears to have been intentionally re-released as a second Ep 42.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Listen Notes podcast ID for ULG */
const LISTEN_NOTES_PODCAST_ID = "ICw3ZMHiJU2";

const FETCH_TIMEOUT_MS = 30_000;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "__cdata",
  textNodeName: "#text",
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  isArray: (name) => name === "item" || name === "category",
});

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function textOf(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number" || typeof node === "boolean") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (typeof obj["__cdata"] === "string") return obj["__cdata"] as string;
    if (typeof obj["#text"] === "string") return obj["#text"] as string;
  }
  return "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(p|div|li|h\d|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;|&apos;/g, "'")
    .replace(/&hellip;/g, "…")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&rsquo;|&#8217;/g, "'")
    .replace(/&lsquo;|&#8216;/g, "'")
    .replace(/&ldquo;|&#8220;/g, "\u201c")
    .replace(/&rdquo;|&#8221;/g, "\u201d")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseDuration(value: string | undefined | null): number | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const parts = trimmed.split(":").map((p) => Number(p));
  if (parts.some((p) => Number.isNaN(p))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

function parsePubDate(raw: string): Date {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return new Date(0);
  return d;
}

function slugFromLink(link: string, guid: string): string {
  try {
    const url = new URL(link);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      const last = segments[segments.length - 1].slice(0, 80);
      if (last && last !== "feed") return `ulg-${last}`;
    }
  } catch {}
  return (
    "ulg-" +
    guid
      .replace(/^https?:\/\/[^/]+\?[^=]+=/, "wp")
      .replace(/[^a-zA-Z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "ulg-episode"
  );
}

function isAfterPartyEpisode(title: string): boolean {
  const lower = title.toLowerCase();
  return lower.includes("after party") || lower.includes("utg after");
}

async function fetchWithTimeout(url: string, extraHeaders?: Record<string, string>): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "TSP-Library/1.0 (+replit)",
        Accept: "application/rss+xml, application/xml, text/xml, text/html, application/json",
        ...extraHeaders,
      },
    });
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ url, err: msg }, "ULG fetch failed");
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFeedXml(url: string): Promise<string | null> {
  const res = await fetchWithTimeout(url);
  if (!res) return null;
  if (!res.ok) {
    logger.warn({ url, status: res.status }, "ULG feed fetch non-OK");
    return null;
  }
  return await res.text();
}

function parseItemsFromXml(xml: string): Map<string, InsertContentItem> {
  const result = new Map<string, InsertContentItem>();
  let parsed: Record<string, unknown>;
  try {
    parsed = parser.parse(xml) as Record<string, unknown>;
  } catch {
    return result;
  }
  const rss = parsed["rss"] as Record<string, unknown> | undefined;
  const channel = rss?.["channel"] as Record<string, unknown> | undefined;
  if (!channel) return result;

  const itunesImage = channel["itunes:image"] as Record<string, unknown> | undefined;
  const channelArtwork = (itunesImage?.["@_href"] as string | undefined) || null;

  const rawItems = asArray(channel["item"]);
  for (const raw of rawItems) {
    const item = raw as Record<string, unknown>;
    const rawTitle = textOf(item["title"]);

    if (isAfterPartyEpisode(rawTitle)) continue;

    const link = textOf(item["link"]);
    const guidRaw = item["guid"];
    const guid =
      typeof guidRaw === "string"
        ? guidRaw
        : textOf(guidRaw) || link;
    if (!guid) continue;

    const pubDate = parsePubDate(textOf(item["pubDate"]));
    const descriptionRaw = textOf(item["description"]);
    const summaryRaw =
      textOf(item["itunes:subtitle"]) ||
      textOf(item["itunes:summary"]) ||
      descriptionRaw;
    const summary = stripHtml(summaryRaw).slice(0, 320);
    const bodyText = stripHtml(textOf(item["content:encoded"] || item["description"]));
    const durationSeconds = parseDuration(textOf(item["itunes:duration"]));
    const enclosure = item["enclosure"] as Record<string, unknown> | undefined;
    const audioUrl = (enclosure?.["@_url"] as string | undefined) || null;
    const audioType = (enclosure?.["@_type"] as string | undefined) || null;
    const itemImage = item["itunes:image"] as Record<string, unknown> | undefined;
    const artworkUrl =
      (itemImage?.["@_href"] as string | undefined) || channelArtwork || null;
    const categories = asArray(item["category"])
      .map((c) => stripHtml(textOf(c)))
      .filter((c) => c && c.toLowerCase() !== "podcasts" && c.toLowerCase() !== "blog");
    const slug = slugFromLink(link, guid);

    result.set(guid, {
      source: "ulg",
      sourceId: guid,
      kind: "audio",
      slug,
      title: rawTitle.trim(),
      link: link || "https://unloosethegoose.com",
      summary,
      bodyHtml: "",
      bodyText,
      publishedAt: pubDate,
      durationSeconds,
      audioUrl,
      audioType,
      artworkUrl,
      episodeNumber: null,
      categories,
      tags: ["unloose-the-goose"],
      extra: {},
    });
  }
  return result;
}

// ── Strategy 2: Wayback CDX individual episode pages ─────────────────────────

/**
 * Query the Wayback CDX API to discover all archived episode page URLs for
 * unloosethegoose.com, then fetch each page and extract episode metadata from
 * the HTML (Open Graph tags, article date, and audio player embed URL).
 *
 * This covers episodes that were never present in any feed snapshot because the
 * RSS feed only held the most-recent ~15 episodes at a time.
 */
async function fetchEpisodesFromWaybackPages(
  existingGuids: Set<string>,
): Promise<Map<string, InsertContentItem>> {
  const result = new Map<string, InsertContentItem>();

  // Step 1 – discover archived episode page URLs via CDX
  const cdxUrl =
    `${WAYBACK_CDX_API}` +
    `?url=unloosethegoose.com/*` +
    `&output=json` +
    `&fl=timestamp,original,statuscode` +
    `&filter=statuscode:200` +
    `&filter=mimetype:text/html` +
    `&collapse=urlkey` +
    `&limit=1000`;

  const cdxRes = await fetchWithTimeout(cdxUrl);
  if (!cdxRes?.ok) {
    logger.warn({ status: cdxRes?.status }, "ULG CDX API unavailable; skipping page scrape");
    return result;
  }

  let cdxRows: [string, string, string][];
  try {
    cdxRows = await cdxRes.json() as [string, string, string][];
  } catch {
    logger.warn("ULG CDX API returned invalid JSON");
    return result;
  }

  // Filter for episode-like post URLs.
  // Deny-list: admin, feeds, taxonomies, and known static/utility pages.
  const DENY_PATH = /\/(feed|wp-|category|tag|page\/|author\/|sitemap|robots|xmlrpc|wp-login|wp-admin|wp-content|wp-includes|about|contact|privacy|terms|cookie|members?|subscribe|donate|support|store|shop|checkout|cart|account|login|register|search)\b/i;
  // Allow-list: the slug must contain a clear episode signal — an episode
  // number, or the word "episode", "ep", "epi", "ep-", "ulg", "gaggle",
  // or a known topic word from the ULG episode list.  This prevents generic
  // site pages (about, contact, etc.) from being ingested as audio episodes.
  const EPISODE_SIGNAL = /episode|^ep[-_ ]?\d|[-_ ]ep\d|\bep\d|\bepi\d|\bulg\b|gaggle|agorism|flock|goose|crypto|bitcoin|liberty|freedom|community|homestead|self.relian|civil.disobed|decentrali|vaccine|mindset/i;

  const episodeUrls: Array<{ timestamp: string; original: string }> = [];
  for (const row of cdxRows) {
    if (!Array.isArray(row) || row.length < 2) continue;
    const [timestamp, original] = row;
    if (!original || !timestamp) continue;
    // Ignore query-string or fragment URLs
    if (original.includes("?") || original.includes("#")) continue;
    const pathname = original.replace(/^https?:\/\/[^/]+/, "").replace(/\/$/, "");
    const pathParts = pathname.split("/").filter(Boolean);
    // Episode pages have exactly 1 path segment (a slug at the root)
    if (pathParts.length !== 1) continue;
    const slug = pathParts[0];
    if (DENY_PATH.test("/" + slug)) continue;
    // Require at least one strong episode signal in the slug
    if (!EPISODE_SIGNAL.test(slug)) continue;
    episodeUrls.push({ timestamp, original });
  }

  logger.info({ count: episodeUrls.length }, "ULG CDX: candidate episode page URLs found");
  if (episodeUrls.length === 0) return result;

  // Step 2 – fetch each archived page and extract metadata
  for (const { timestamp, original } of episodeUrls) {
    const archivedUrl = `https://web.archive.org/web/${timestamp}id_/${original}`;
    const pageRes = await fetchWithTimeout(archivedUrl, { Accept: "text/html" });
    if (!pageRes?.ok) continue;

    let html: string;
    try {
      html = await pageRes.text();
    } catch {
      continue;
    }

    const item = parseEpisodeFromHtml(html, original, timestamp);
    if (!item) continue;
    if (isAfterPartyEpisode(item.title)) continue;
    if (existingGuids.has(item.sourceId)) continue;

    result.set(item.sourceId, item);
    logger.info({ title: item.title, url: original }, "ULG CDX: scraped episode from archived page");
  }

  logger.info({ count: result.size }, "ULG CDX page scrape complete");
  return result;
}

function metaContent(html: string, property: string): string {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re) || html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, "i"),
  );
  return m ? m[1].trim() : "";
}

function extractAudioUrl(html: string): string | null {
  // Libsyn embed: src="//html5-player.libsyn.com/embed/episode/id/XXXXX/..."
  const libsynMatch = html.match(/html5-player\.libsyn\.com\/embed\/episode\/id\/(\d+)/);
  if (libsynMatch) {
    return `https://traffic.libsyn.com/secure/unloosethegoose/${libsynMatch[1]}.mp3`;
  }

  // Direct audio src in <audio> or <source>
  const audioSrcMatch = html.match(/<(?:audio|source)[^>]+src=["']([^"']+\.mp3[^"']*)["']/i);
  if (audioSrcMatch) return audioSrcMatch[1];

  // Buzzsprout
  const buzzMatch = html.match(/buzzsprout\.com\/[^/]+\/(\d+)/);
  if (buzzMatch) return null; // we can't easily reconstruct the direct URL

  // Podbean
  const podbeanMatch = html.match(/podbean\.com\/[^"']+/);
  if (podbeanMatch) return null;

  return null;
}

function parseEpisodeFromHtml(
  html: string,
  originalUrl: string,
  timestamp: string,
): InsertContentItem | null {
  const title = stripHtml(
    metaContent(html, "og:title") ||
    metaContent(html, "twitter:title") ||
    (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? ""),
  ).replace(/\s*[|–—-]\s*Unloose The Goose.*$/i, "").trim();

  // Reject generic/utility pages that somehow passed the URL filter.
  const GENERIC_TITLE = /^(home|about|contact|privacy|terms|store|shop|members?|subscribe|donate|support|search|404|not found|error)\b/i;
  if (!title || title.toLowerCase().includes("page not found") || GENERIC_TITLE.test(title)) return null;

  const description = stripHtml(
    metaContent(html, "og:description") ||
    metaContent(html, "description") ||
    "",
  );

  // Prefer article:published_time, fall back to Wayback timestamp
  const publishedTimeMeta = metaContent(html, "article:published_time");
  const publishedAt = publishedTimeMeta
    ? parsePubDate(publishedTimeMeta)
    : parsePubDate(
        `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}T${timestamp.slice(8, 10)}:${timestamp.slice(10, 12)}:${timestamp.slice(12, 14)}Z`,
      );

  const audioUrl = extractAudioUrl(html);
  const artworkUrl = metaContent(html, "og:image") || null;

  // Require at least one strong episode signal: a playable audio URL,
  // OR the title matches an episode-number pattern (e.g., "Ep 16", "Episode 30").
  // This prevents non-podcast pages from being stored as audio episodes.
  const hasEpisodeTitle = /\b(ep(isode)?\.?\s*\d+|#\s*\d+|\d+\s*[-:]\s*\w)/i.test(title);
  if (!audioUrl && !hasEpisodeTitle) return null;

  try {
    const url = new URL(originalUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    const lastSeg = segments[segments.length - 1] ?? "";
    const slug = `ulg-${lastSeg}`.slice(0, 80);
    const guid = originalUrl;

    return {
      source: "ulg",
      sourceId: guid,
      kind: "audio",
      slug,
      title,
      link: originalUrl,
      summary: description.slice(0, 320),
      bodyHtml: "",
      bodyText: description,
      publishedAt,
      durationSeconds: null,
      audioUrl,
      audioType: audioUrl ? "audio/mpeg" : null,
      artworkUrl,
      episodeNumber: null,
      categories: [],
      tags: ["unloose-the-goose"],
      extra: { scrapedFromWayback: true },
    };
  } catch {
    return null;
  }
}

// ── Strategy 3: Listen Notes API ─────────────────────────────────────────────

interface ListenNotesEpisode {
  id: string;
  title: string;
  description: string;
  pub_date_ms: number;
  audio: string;
  audio_length_sec: number;
  link: string;
  image: string;
  thumbnail: string;
}

interface ListenNotesResponse {
  episodes: ListenNotesEpisode[];
  next_episode_pub_date?: number;
  total: number;
}

/**
 * Fetch episodes from the Listen Notes API. Requires a LISTEN_NOTES_API_KEY
 * environment variable. Silently skips if the key is absent or the API fails.
 */
async function fetchEpisodesFromListenNotes(
  existingGuids: Set<string>,
): Promise<Map<string, InsertContentItem>> {
  const result = new Map<string, InsertContentItem>();
  const apiKey = process.env.LISTEN_NOTES_API_KEY;
  if (!apiKey) {
    logger.debug("LISTEN_NOTES_API_KEY not set; skipping Listen Notes fetch");
    return result;
  }

  let nextPubDateMs: number | undefined = undefined;
  let page = 0;

  while (true) {
    const params = new URLSearchParams({
      sort: "oldest_first",
      ...(nextPubDateMs != null ? { next_episode_pub_date: String(nextPubDateMs) } : {}),
    });
    const url = `https://listen-api.listennotes.com/api/v2/podcasts/${LISTEN_NOTES_PODCAST_ID}/episodes?${params}`;

    const res = await fetchWithTimeout(url, {
      "X-ListenAPI-Key": apiKey,
      Accept: "application/json",
    });

    if (!res?.ok) {
      logger.warn({ status: res?.status, page }, "Listen Notes API non-OK; stopping");
      break;
    }

    let data: ListenNotesResponse;
    try {
      data = await res.json() as ListenNotesResponse;
    } catch {
      logger.warn({ page }, "Listen Notes API invalid JSON");
      break;
    }

    if (!data.episodes || data.episodes.length === 0) break;

    for (const ep of data.episodes) {
      if (!ep.id || !ep.title) continue;
      if (isAfterPartyEpisode(ep.title)) continue;

      const guid = `listenotes:${ep.id}`;
      if (existingGuids.has(guid)) continue;

      // Also check the episode link as a GUID
      const linkGuid = ep.link || "";
      if (linkGuid && existingGuids.has(linkGuid)) continue;

      const publishedAt = ep.pub_date_ms ? new Date(ep.pub_date_ms) : new Date(0);
      const bodyText = stripHtml(ep.description || "");
      const summary = bodyText.slice(0, 320);

      let slug = "ulg-episode";
      try {
        const epUrl = new URL(ep.link);
        const segs = epUrl.pathname.split("/").filter(Boolean);
        if (segs.length > 0) slug = `ulg-${segs[segs.length - 1]}`.slice(0, 80);
      } catch {}

      result.set(guid, {
        source: "ulg",
        sourceId: guid,
        kind: "audio",
        slug,
        title: ep.title.trim(),
        link: ep.link || "https://unloosethegoose.com",
        summary,
        bodyHtml: "",
        bodyText,
        publishedAt,
        durationSeconds: ep.audio_length_sec || null,
        audioUrl: ep.audio || null,
        audioType: ep.audio ? "audio/mpeg" : null,
        artworkUrl: ep.image || ep.thumbnail || null,
        episodeNumber: null,
        categories: [],
        tags: ["unloose-the-goose"],
        extra: { listenNotesId: ep.id },
      });
    }

    logger.info({ page, fetched: data.episodes.length, totalNew: result.size }, "Listen Notes: page fetched");

    if (!data.next_episode_pub_date) break;
    nextPubDateMs = data.next_episode_pub_date;
    page++;

    // Safety cap
    if (page > 20) break;
  }

  logger.info({ count: result.size }, "Listen Notes fetch complete");
  return result;
}

// ── Strategy 4: survivalpodcast.net audio server directory enumeration ────────

/**
 * The ULG audio files are hosted at www.survivalpodcast.net/audio/goose/ with
 * directory listing enabled.  Year folders (2020, 2021, 2022, 2024) contain
 * the MP3 files directly (or in monthly subdirectories for 2020).  We enumerate
 * these to discover episodes that were never captured in any feed snapshot.
 *
 * Audio URL returned is the Blubrry CDN URL so it plays correctly.
 */

const AUDIO_SERVER_BASE = "https://www.survivalpodcast.net";
const BLUBRRY_CDN_PREFIX = "https://media.blubrry.com/1362713/www.survivalpodcast.net/";

/**
 * All known directory paths on the audio server that may contain ULG episodes.
 * Each path is relative to AUDIO_SERVER_BASE.
 */
const AUDIO_SERVER_DIRS = [
  "/audio/goose/2020/10/",
  "/audio/goose/2020/11/",
  "/audio/goose/2020/12/",
  "/audio/goose/2021/",
  "/audio/2021/goose/",
  "/audio/goose/2022/",
  "/audio/2022/goose/",
  "/audio/goose/2024/",
  "/audio/goose/", // root — has epi-000
];

/** Estimate a title from an MP3 filename slug. */
function titleFromFilename(filename: string): string {
  const noExt = filename.replace(/\.mp3$/i, "");
  // epi-016-living-the-agora  →  "Ep 16-Living the Agora"
  const match = noExt.match(/^[Ee]pi?-(\d+)-(.+)$/);
  if (match) {
    const epNum = parseInt(match[1], 10);
    const words = match[2]
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    return `Ep ${epNum}-${words}`;
  }
  // fallback: just humanise the slug
  return noExt
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Parse MP3 filenames from an Apache-style directory listing HTML. */
function parseMp3FilenamesFromHtml(html: string): string[] {
  const re = /href="([^"]+\.mp3)"/gi;
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    // Keep only the bare filename, not sub-path navigations
    const raw = m[1];
    if (!raw.startsWith("?") && !raw.startsWith("/")) {
      results.push(raw.split("/").pop()!);
    }
  }
  return results;
}

/** Episode number extracted from filename, or null. */
function epNumFromFilename(filename: string): number | null {
  const m = filename.match(/^[Ee]pi?-(\d+)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  // Sanity-check: skip files with suspiciously high episode numbers (misc files)
  if (n > 200) return null;
  return n;
}

async function fetchEpisodesFromAudioServer(
  existingSlugSet: Set<string>,
): Promise<Map<string, InsertContentItem>> {
  const result = new Map<string, InsertContentItem>();

  // We need both the slug set (to detect existing episodes) and a set of
  // episode numbers we already have so we don't create a duplicate entry via
  // a different path.
  const seenEpNums = new Set<number>();
  for (const slug of existingSlugSet) {
    const m = slug.match(/ulg-\D*(\d+)/);
    if (m) seenEpNums.add(parseInt(m[1], 10));
  }

  for (const dirPath of AUDIO_SERVER_DIRS) {
    const url = `${AUDIO_SERVER_BASE}${dirPath}`;
    const res = await fetchWithTimeout(url, { Accept: "text/html" });
    if (!res?.ok) continue;

    let html: string;
    try {
      html = await res.text();
    } catch {
      continue;
    }

    const filenames = parseMp3FilenamesFromHtml(html);
    for (const filename of filenames) {
      const epNum = epNumFromFilename(filename);
      if (epNum === null) continue;
      if (seenEpNums.has(epNum)) continue;

      const slug = `ulg-${filename.replace(/\.mp3$/i, "").replace(/^[Ee]pi?-\d+-?/, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase()}`;
      const audioPath = dirPath.replace(/^\//, "") + filename;
      const audioUrl = BLUBRRY_CDN_PREFIX + audioPath;
      const sourceId = audioUrl;

      if (result.has(sourceId)) continue;

      const title = titleFromFilename(filename);
      const summary = `Unloose the Goose episode ${epNum}.`;

      // Rough publication date estimate — episodes were ~weekly.
      // We use epoch 0 as a placeholder; the RSS feed upsert (if it ever
      // succeeds) will overwrite with the correct date via ON CONFLICT.
      const publishedAt = new Date(0);

      seenEpNums.add(epNum);
      result.set(sourceId, {
        source: "ulg",
        sourceId,
        kind: "audio",
        slug: `ulg-${slug.replace(/^ulg-/, "")}`.slice(0, 80),
        title,
        link: "https://unloosethegoose.com",
        summary,
        bodyHtml: "",
        bodyText: summary,
        publishedAt,
        durationSeconds: null,
        audioUrl,
        audioType: "audio/mpeg",
        artworkUrl: null,
        episodeNumber: epNum,
        categories: [],
        tags: ["unloose-the-goose"],
        extra: { discoveredFrom: "audio-server-directory" },
      });

      logger.info({ epNum, filename, audioUrl }, "ULG audio server: new episode found");
    }
  }

  logger.info({ count: result.size }, "ULG audio server enumeration complete");
  return result;
}

// ── Main export ───────────────────────────────────────────────────────────────

export type UlgSyncResult = {
  itemsSeen: number;
  itemsUpserted: number;
};

export async function syncUlg(options: {
  upsertBatch: (items: InsertContentItem[]) => Promise<number>;
}): Promise<UlgSyncResult> {
  const { upsertBatch } = options;
  const allItems = new Map<string, InsertContentItem>();

  const tryFeed = async (url: string, label: string): Promise<number> => {
    const xml = await fetchFeedXml(url);
    if (!xml) return 0;
    const items = parseItemsFromXml(xml);
    let added = 0;
    for (const [guid, item] of items) {
      if (!allItems.has(guid)) {
        allItems.set(guid, item);
        added++;
      }
    }
    if (items.size > 0) {
      logger.info({ label, items: items.size, newItems: added }, "ULG feed snapshot parsed");
    }
    return items.size;
  };

  // ── Strategy 1: live feed first, then all Wayback snapshots ──────────────
  const liveParsed = await tryFeed(LIVE_FEED_URL, "live");

  if (liveParsed === 0) {
    logger.info("ULG live feed unavailable; fetching from Wayback Machine snapshots");
  }

  for (const snapshotUrl of WAYBACK_SNAPSHOTS) {
    await tryFeed(snapshotUrl, snapshotUrl.slice(30, 50));
  }

  // ── Strategy 2: Wayback CDX individual episode page scraping ─────────────
  const existingGuids = new Set(allItems.keys());
  const pageItems = await fetchEpisodesFromWaybackPages(existingGuids);
  for (const [guid, item] of pageItems) {
    if (!allItems.has(guid)) allItems.set(guid, item);
  }

  // ── Strategy 3: Listen Notes API ─────────────────────────────────────────
  const allGuids = new Set(allItems.keys());
  const lnItems = await fetchEpisodesFromListenNotes(allGuids);
  for (const [guid, item] of lnItems) {
    if (!allItems.has(guid)) allItems.set(guid, item);
  }

  // ── Strategy 4: survivalpodcast.net audio server directory enumeration ────
  const existingSlugs = new Set([...allItems.values()].map((i) => i.slug));
  const audioServerItems = await fetchEpisodesFromAudioServer(existingSlugs);
  for (const [guid, item] of audioServerItems) {
    if (!allItems.has(guid)) allItems.set(guid, item);
  }

  if (allItems.size === 0) {
    logger.warn("ULG sync: no episodes found from any source");
    return { itemsSeen: 0, itemsUpserted: 0 };
  }

  const inserts = [...allItems.values()];
  const itemsUpserted = await upsertBatch(inserts);
  logger.info({ itemsSeen: inserts.length, itemsUpserted }, "ULG sync complete");
  return { itemsSeen: inserts.length, itemsUpserted };
}
