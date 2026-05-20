import { XMLParser } from "fast-xml-parser";
import { logger } from "../logger";
import type { InsertContentItem } from "@workspace/db";

const CHANNEL_ID = "UCFiM16ypErkTj6SNzhkmyxw";
const FEED_CANDIDATES = [
  `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
  `https://www.youtube.com/feeds/videos.xml?user=survivalpodcasting`,
];
const FETCH_TIMEOUT_MS = 20_000;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  isArray: (name) => name === "entry",
});

function textOf(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (typeof obj["#text"] === "string") return obj["#text"];
  }
  return "";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "video"
  );
}

async function tryFetch(url: string, signal?: AbortSignal): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "TSP-Library/1.0 (+replit)",
        Accept: "application/atom+xml, application/xml, text/xml",
      },
    });
    if (!res.ok) {
      logger.warn({ url, status: res.status }, "YouTube feed unavailable");
      return null;
    }
    return await res.text();
  } catch (err) {
    logger.warn({ url, err }, "YouTube feed fetch errored");
    return null;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

export type YouTubeSyncResult = {
  itemsSeen: number;
  upserts: InsertContentItem[];
  available: boolean;
};

/**
 * Fetch Jack's YouTube uploads via the public Atom feed.
 *
 * NOTE: As of this writing, YouTube's per-channel RSS endpoint returns 404 for
 * this channel — likely because the channel has no recent public uploads or
 * YouTube has disabled the feed. We try multiple URL forms and degrade
 * gracefully if none work; the sync just records zero items rather than
 * blowing up the whole refresh.
 */
export async function fetchYouTubeChannel(
  options: { signal?: AbortSignal } = {},
): Promise<YouTubeSyncResult> {
  let xml: string | null = null;
  for (const url of FEED_CANDIDATES) {
    xml = await tryFetch(url, options.signal);
    if (xml) break;
  }
  if (!xml) {
    logger.info("YouTube feed unavailable for TSP channel; skipping");
    return { itemsSeen: 0, upserts: [], available: false };
  }
  const parsed = parser.parse(xml) as Record<string, unknown>;
  const feed = parsed["feed"] as Record<string, unknown> | undefined;
  const rawEntries = (feed?.["entry"] as unknown[] | undefined) ?? [];
  const upserts: InsertContentItem[] = [];
  for (const raw of rawEntries) {
    const entry = raw as Record<string, unknown>;
    const videoId = textOf(entry["yt:videoId"]);
    if (!videoId) continue;
    const title = textOf(entry["title"]);
    const published = textOf(entry["published"]);
    const link = (entry["link"] as Record<string, unknown> | undefined)?.[
      "@_href"
    ] as string | undefined;
    const url = link || `https://www.youtube.com/watch?v=${videoId}`;
    const media = entry["media:group"] as Record<string, unknown> | undefined;
    const description = textOf(media?.["media:description"]);
    const thumb = (media?.["media:thumbnail"] as Record<string, unknown> | undefined)?.[
      "@_url"
    ] as string | undefined;
    const summary = description.split(/\n\n|\.\s/).slice(0, 2).join(". ").slice(0, 320);
    upserts.push({
      source: "youtube",
      sourceId: videoId,
      kind: "video",
      slug: `yt-${slugify(title)}-${videoId.slice(0, 6)}`,
      title,
      link: url,
      summary,
      bodyHtml: escapeHtml(description).replace(/\n/g, "<br>"),
      bodyText: description,
      publishedAt: new Date(published),
      durationSeconds: null,
      audioUrl: null,
      audioType: null,
      videoUrl: url,
      videoId,
      artworkUrl: thumb ?? null,
      episodeNumber: null,
      categories: ["video"],
      tags: [],
      extra: { channelId: CHANNEL_ID },
    });
  }
  logger.info({ count: upserts.length }, "YouTube feed parsed");
  return { itemsSeen: upserts.length, upserts, available: true };
}
