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
 * All 10 distinct Wayback Machine snapshots of the ULG feed, oldest first.
 * Using the `id_` modifier returns raw feed XML without the Wayback toolbar.
 * Together these snapshots cover Ep 0–75 (the remaining gaps are episodes
 * that were never captured in any snapshot).
 */
const WAYBACK_SNAPSHOTS = [
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
];

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

async function fetchFeedXml(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "TSP-Library/1.0 (+replit)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    });
    if (!res.ok) {
      logger.warn({ url, status: res.status }, "ULG feed fetch non-OK");
      return null;
    }
    return await res.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ url, err: msg }, "ULG feed fetch failed");
    return null;
  } finally {
    clearTimeout(timer);
  }
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

  const liveParsed = await tryFeed(LIVE_FEED_URL, "live");

  if (liveParsed === 0) {
    logger.info("ULG live feed unavailable; fetching from Wayback Machine snapshots");
    for (const snapshotUrl of WAYBACK_SNAPSHOTS) {
      await tryFeed(snapshotUrl, snapshotUrl.slice(30, 50));
    }
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
