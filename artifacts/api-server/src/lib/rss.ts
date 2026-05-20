import { XMLParser } from "fast-xml-parser";
import { logger } from "./logger";

const FEED_URL = "https://www.thesurvivalpodcast.com/feed/podcast";
const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 15_000;

export type RssEpisode = {
  slug: string;
  guid: string;
  episodeNumber: number | null;
  title: string;
  link: string;
  pubDate: string;
  summary: string;
  descriptionHtml: string;
  durationSeconds: number | null;
  audioUrl: string | null;
  audioType: string | null;
  artworkUrl: string | null;
  categories: string[];
};

export type RssFeed = {
  title: string;
  description: string;
  link: string;
  host: string;
  artworkUrl: string;
  copyright: string | null;
  language: string | null;
  totalEpisodes: number;
  latestPubDate: string | null;
  tipUrl: string | null;
  episodes: RssEpisode[];
};

type CacheEntry = {
  fetchedAt: number;
  data: RssFeed;
};

let cache: CacheEntry | null = null;
let inflight: Promise<RssFeed> | null = null;

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
    .replace(/&rsquo;|&#8217;/g, "’")
    .replace(/&lsquo;|&#8216;/g, "‘")
    .replace(/&ldquo;|&#8220;/g, "“")
    .replace(/&rdquo;|&#8221;/g, "”")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
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

function slugFromLink(link: string, guid: string): string {
  try {
    const url = new URL(link);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length > 0) return segments[segments.length - 1];
  } catch {}
  return guid.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "episode";
}

function parsePubDate(raw: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return new Date(0).toISOString();
  return d.toISOString();
}

function parseChannel(xml: string): RssFeed {
  const parsed = parser.parse(xml) as Record<string, unknown>;
  const rss = parsed["rss"] as Record<string, unknown> | undefined;
  const channel = rss?.["channel"] as Record<string, unknown> | undefined;
  if (!channel) throw new Error("Invalid RSS feed: no channel");

  const title = textOf(channel["title"]);
  const description = textOf(channel["description"]);
  const link = textOf(channel["link"]);
  const language = textOf(channel["language"]) || null;
  const copyright = textOf(channel["copyright"]) || null;
  const owner = channel["itunes:owner"] as Record<string, unknown> | undefined;
  const host =
    textOf(owner?.["itunes:name"]) ||
    textOf(channel["itunes:author"]) ||
    title;
  const itunesImage = channel["itunes:image"] as Record<string, unknown> | undefined;
  const channelImage = channel["image"] as Record<string, unknown> | undefined;
  const artworkUrl =
    (itunesImage?.["@_href"] as string | undefined) ||
    textOf(channelImage?.["url"]) ||
    "";

  const funding = channel["podcast:funding"] as Record<string, unknown> | undefined;
  const tipUrl =
    (funding?.["@_url"] as string | undefined) ||
    ((channel["rawvoice:donate"] as Record<string, unknown> | undefined)?.[
      "@_href"
    ] as string | undefined) ||
    null;

  const rawItems = asArray(channel["item"]);
  const episodes: RssEpisode[] = rawItems.map((raw): RssEpisode => {
    const item = raw as Record<string, unknown>;
    const rawTitle = textOf(item["title"]);
    const link = textOf(item["link"]);
    const guidRaw = item["guid"];
    const guid =
      typeof guidRaw === "string"
        ? guidRaw
        : textOf(guidRaw) || link;
    const pubDate = parsePubDate(textOf(item["pubDate"]));
    const descriptionHtml = sanitizeHtml(textOf(item["description"]));
    const summaryRaw =
      textOf(item["itunes:summary"]) || textOf(item["description"]);
    const summary = stripHtml(summaryRaw).slice(0, 320);
    const durationSeconds = parseDuration(textOf(item["itunes:duration"]));
    const enclosure = item["enclosure"] as Record<string, unknown> | undefined;
    const audioUrl = (enclosure?.["@_url"] as string | undefined) || null;
    const audioType = (enclosure?.["@_type"] as string | undefined) || null;
    const itemImage = item["itunes:image"] as Record<string, unknown> | undefined;
    const artworkUrl = (itemImage?.["@_href"] as string | undefined) || null;
    const categories = asArray(item["category"])
      .map((c) => stripHtml(textOf(c)))
      .filter((c) => c && c.toLowerCase() !== "podcasts");
    const episodeNumber = parseEpisodeNumber(rawTitle);
    const title = cleanTitle(rawTitle);
    const slug = slugFromLink(link, guid);
    return {
      slug,
      guid,
      episodeNumber,
      title,
      link,
      pubDate,
      summary,
      descriptionHtml,
      durationSeconds,
      audioUrl,
      audioType,
      artworkUrl,
      categories,
    };
  });

  episodes.sort((a, b) => b.pubDate.localeCompare(a.pubDate));

  return {
    title,
    description: stripHtml(description),
    link,
    host,
    artworkUrl,
    copyright,
    language,
    totalEpisodes: episodes.length,
    latestPubDate: episodes[0]?.pubDate ?? null,
    tipUrl,
    episodes,
  };
}

async function fetchFeed(): Promise<RssFeed> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(FEED_URL, {
      signal: controller.signal,
      headers: {
        "User-Agent": "TSP-Redesign/1.0 (+replit)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    });
    if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
    const xml = await res.text();
    const feed = parseChannel(xml);
    logger.info(
      { episodes: feed.totalEpisodes },
      "Fetched TSP RSS feed",
    );
    return feed;
  } finally {
    clearTimeout(timer);
  }
}

export async function getFeedCached(): Promise<RssFeed> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const data = await fetchFeed();
      cache = { fetchedAt: Date.now(), data };
      return data;
    } catch (err) {
      if (cache) {
        logger.warn({ err }, "Feed refresh failed; serving stale cache");
        return cache.data;
      }
      throw err;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
