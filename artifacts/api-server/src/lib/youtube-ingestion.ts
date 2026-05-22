/**
 * YouTube ingestion service — fetches videos from Bobbie Parr's two YouTube
 * channels via their public RSS feeds (no API key required), upserts new items
 * into curated_items with sourceType "youtube", and runs the auto-classifier.
 *
 * Runs once at server startup and then every 24 hours.
 */

import { db, curatedItemsTable } from "@workspace/db";
import { classifyText } from "./field-note-classifier";
import { logger } from "./logger";

const CHANNEL_IDS = [
  "UCOKTVMqnBAadkC_Dp9xWslA",
  "UCCkjeH9vYQWYa-Y3OkcHEDg",
];

const DAILY_MS = 24 * 60 * 60 * 1000;

interface VideoEntry {
  videoId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  publishedAt: Date;
}

function extractText(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  if (!m) return "";
  return m[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, "i");
  const m = xml.match(re);
  return m ? m[1] : "";
}

function parseEntries(xml: string): VideoEntry[] {
  const entryRe = /<entry>([\s\S]*?)<\/entry>/gi;
  const entries: VideoEntry[] = [];
  let m: RegExpExecArray | null;

  while ((m = entryRe.exec(xml)) !== null) {
    const block = m[1];

    const videoIdRaw = extractText(block, "yt:videoId");
    if (!videoIdRaw) continue;

    const title = extractText(block, "title");

    const mediaGroupMatch = block.match(/<media:group>([\s\S]*?)<\/media:group>/i);
    const mediaBlock = mediaGroupMatch ? mediaGroupMatch[1] : block;
    const description = extractText(mediaBlock, "media:description") || extractText(mediaBlock, "description");

    const thumbnailUrl =
      extractAttr(mediaBlock, "media:thumbnail", "url") ||
      extractAttr(block, "media:thumbnail", "url");

    const videoUrl = `https://www.youtube.com/watch?v=${videoIdRaw}`;

    const publishedStr = extractText(block, "published");
    const publishedAt = publishedStr ? new Date(publishedStr) : new Date();

    entries.push({
      videoId: videoIdRaw,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      publishedAt,
    });
  }

  return entries;
}

async function fetchChannelFeed(channelId: string): Promise<VideoEntry[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "TSP-ContentEngine/1.0" },
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`YouTube RSS fetch failed: ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();
  return parseEntries(xml);
}

async function ingestChannel(channelId: string): Promise<number> {
  const entries = await fetchChannelFeed(channelId);
  logger.info(
    { channelId, count: entries.length },
    "youtube: entries fetched from channel",
  );

  let inserted = 0;

  for (const entry of entries) {
    const classifyText_ = [entry.title, entry.description].filter(Boolean).join("\n");
    if (!classifyText_.trim()) continue;

    try {
      const tags = classifyText(classifyText_);

      const result = await db
        .insert(curatedItemsTable)
        .values({
          sourceType: "youtube",
          externalId: entry.videoId,
          rawContent: entry.description || entry.title,
          metaTitle: entry.title || null,
          tags,
          published: true,
          metaUrl: entry.videoUrl,
          metaImageUrl: entry.thumbnailUrl || null,
          createdAt: entry.publishedAt,
        })
        .onConflictDoNothing()
        .returning({ id: curatedItemsTable.id });

      if (result.length > 0) inserted++;
    } catch (err) {
      logger.warn(
        { err, videoId: entry.videoId },
        "youtube: failed to upsert video entry",
      );
    }
  }

  return inserted;
}

async function runIngestion(): Promise<void> {
  logger.info("youtube: starting ingestion run");

  let totalInserted = 0;

  for (const channelId of CHANNEL_IDS) {
    try {
      const inserted = await ingestChannel(channelId);
      totalInserted += inserted;
    } catch (err) {
      logger.warn(
        { err, channelId },
        "youtube: channel ingestion failed (non-fatal)",
      );
    }
  }

  logger.info({ inserted: totalInserted }, "youtube: ingestion run complete");
}

let scheduled = false;

export function startYouTubeIngestion(): void {
  if (scheduled) return;
  scheduled = true;

  runIngestion().catch((err) =>
    logger.warn({ err }, "youtube: startup ingestion failed"),
  );

  setInterval(() => {
    runIngestion().catch((err) =>
      logger.warn({ err }, "youtube: scheduled ingestion failed"),
    );
  }, DAILY_MS);
}
