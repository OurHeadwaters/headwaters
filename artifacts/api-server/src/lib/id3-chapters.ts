/**
 * Lightweight ID3v2 CHAP tag parser and podcast:chapters JSON fetcher.
 *
 * Used to extract "This Day in History" segment timestamps from audio
 * metadata when show notes contain no chapter markers.
 *
 * Two data sources are tried, in order:
 *   1. podcast:chapters JSON URL (Podcasting 2.0 namespace) — very lightweight
 *   2. ID3v2 CHAP tags embedded in the audio file, fetched via HTTP Range
 *      request (first 512 KB) so we never download the full episode.
 */

import { logger } from "./logger";

export type Chapter = {
  elementId: string;
  startMs: number;
  endMs: number;
  title: string | null;
};

const FETCH_TIMEOUT_MS = 5_000;
const AUDIO_RANGE_BYTES = 512 * 1024;

// ─── History keyword matching ─────────────────────────────────────────────────

/**
 * Matches chapter titles that identify the "This Day in History" segment.
 * Intentionally broader than the show-notes regex — chapter titles are short
 * and consistent, so a single "History" word is meaningful here.
 */
const HISTORY_CHAPTER_RE =
  /this\s+day\s+in\s+history|today\s+in\s+history|on\s+this\s+(day|date)|tsp\s+histor|jack['']?s?\s+(daily\s+)?histor|history\s+(segment|section|minute|block|corner|feature|part|time)|historical\s+(segment|section|feature|look)|in\s+history\s+today|daily\s+history|history\s+today|this\s+date\s+in\s+history|date\s+in\s+history|\bhistor(y|ical)\b/i;

/**
 * Given a list of chapters (from ID3 or podcast:chapters JSON), return the
 * start time in seconds of the first chapter whose title matches history
 * keywords, or null if none match.
 */
export function extractChapterHistoryTimestamp(chapters: Chapter[]): number | null {
  for (const ch of chapters) {
    if (ch.title && HISTORY_CHAPTER_RE.test(ch.title)) {
      return Math.round(ch.startMs / 1000);
    }
  }
  return null;
}

// ─── ID3v2 binary parser ──────────────────────────────────────────────────────

function parseSynchsafeInt(buf: Buffer, offset: number): number {
  return (
    ((buf[offset] & 0x7f) << 21) |
    ((buf[offset + 1] & 0x7f) << 14) |
    ((buf[offset + 2] & 0x7f) << 7) |
    (buf[offset + 3] & 0x7f)
  );
}

function readUint32BE(buf: Buffer, offset: number): number {
  return (
    buf[offset] * 0x1000000 +
    (buf[offset + 1] << 16) +
    (buf[offset + 2] << 8) +
    buf[offset + 3]
  );
}

function decodeID3Text(data: Buffer): string {
  if (data.length === 0) return "";
  const enc = data[0];
  const text = data.slice(1);
  // enc: 0 = ISO-8859-1, 1 = UTF-16 with BOM, 2 = UTF-16BE, 3 = UTF-8
  if (enc === 1 || enc === 2) {
    return text.toString("utf16le").replace(/\0+$/, "").trim();
  }
  return text.toString("utf8").replace(/\0+$/, "").trim();
}

function parseFrames(
  buf: Buffer,
  start: number,
  end: number,
  isSynchsafe: boolean,
): { id: string; data: Buffer }[] {
  const frames: { id: string; data: Buffer }[] = [];
  let i = start;
  while (i + 10 <= end) {
    const id = buf.slice(i, i + 4).toString("latin1");
    if (!/^[A-Z][A-Z0-9]{3}$/.test(id)) break;
    const size = isSynchsafe
      ? parseSynchsafeInt(buf, i + 4)
      : readUint32BE(buf, i + 4);
    if (size <= 0 || i + 10 + size > buf.length) break;
    frames.push({ id, data: buf.slice(i + 10, i + 10 + size) });
    i += 10 + size;
  }
  return frames;
}

function parseCHAP(data: Buffer, isSynchsafe: boolean): Chapter | null {
  const nullIdx = data.indexOf(0);
  // CHAP frame: elementId\0 + startMs(4) + endMs(4) + startOffset(4) + endOffset(4) + sub-frames
  if (nullIdx < 0 || nullIdx + 17 > data.length) return null;
  const elementId = data.slice(0, nullIdx).toString("ascii");
  const startMs = readUint32BE(data, nullIdx + 1);
  const endMs = readUint32BE(data, nullIdx + 5);
  const subStart = nullIdx + 17;
  let title: string | null = null;
  if (subStart < data.length) {
    const subFrames = parseFrames(data, subStart, data.length, isSynchsafe);
    const tit2 = subFrames.find((f) => f.id === "TIT2");
    if (tit2) {
      const decoded = decodeID3Text(tit2.data);
      title = decoded || null;
    }
  }
  return { elementId, startMs, endMs, title };
}

/**
 * Parse ID3v2 CHAP tags from a Buffer containing the beginning of an MP3 file.
 * Supports ID3v2.3 and ID3v2.4. Returns chapters sorted by start time.
 */
export function parseID3Chapters(buf: Buffer): Chapter[] {
  if (buf.length < 10) return [];
  // Magic bytes: "ID3"
  if (buf[0] !== 0x49 || buf[1] !== 0x44 || buf[2] !== 0x33) return [];
  const version = buf[3]; // 3 = ID3v2.3, 4 = ID3v2.4
  if (version < 3 || version > 4) return [];
  const flags = buf[5];
  const tagSize = parseSynchsafeInt(buf, 6) + 10; // +10 for the header itself
  const isSynchsafe = version === 4;

  let frameStart = 10;
  if (flags & 0x40) {
    // Extended header is present — calculate its size and skip it
    if (frameStart + 4 > buf.length) return [];
    if (isSynchsafe) {
      // ID3v2.4: size is synchsafe and includes the 4-byte size field itself
      frameStart = 10 + parseSynchsafeInt(buf, 10);
    } else {
      // ID3v2.3: size is big-endian and does NOT include the size field (4 bytes)
      frameStart = 10 + 4 + readUint32BE(buf, 10);
    }
  }

  const end = Math.min(tagSize, buf.length);
  const frames = parseFrames(buf, frameStart, end, isSynchsafe);
  const chapters: Chapter[] = [];
  for (const frame of frames) {
    if (frame.id === "CHAP") {
      const ch = parseCHAP(frame.data, isSynchsafe);
      if (ch) chapters.push(ch);
    }
  }
  chapters.sort((a, b) => a.startMs - b.startMs);
  return chapters;
}

// ─── podcast:chapters JSON (Podcasting 2.0) ───────────────────────────────────

type PodcastChaptersJson = {
  chapters?: Array<{ startTime?: number; title?: string }>;
};

async function fetchPodcastChaptersJson(url: string): Promise<Chapter[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "TSP-Library/1.0 (+replit; chapter-detection)" },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as PodcastChaptersJson;
    return (json.chapters ?? [])
      .filter((c) => typeof c.startTime === "number")
      .map((c, idx) => ({
        elementId: String(idx),
        startMs: Math.round((c.startTime ?? 0) * 1000),
        endMs: 0,
        title: c.title ?? null,
      }))
      .sort((a, b) => a.startMs - b.startMs);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// ─── Primary export: fetch chapters for an episode ───────────────────────────

/**
 * Retrieve the chapter list for an episode.
 *
 * Tries podcast:chapters JSON first (if a URL is provided), then falls back
 * to fetching the first 512 KB of the audio file and parsing ID3 CHAP tags.
 *
 * Returns an empty array when chapters cannot be determined (timeout, no tags,
 * network error, etc.).
 */
export async function fetchAudioChapters(
  audioUrl: string,
  chaptersJsonUrl?: string | null,
): Promise<Chapter[]> {
  if (chaptersJsonUrl) {
    try {
      const chapters = await fetchPodcastChaptersJson(chaptersJsonUrl);
      if (chapters.length > 0) {
        logger.debug({ chaptersJsonUrl, count: chapters.length }, "chapters from JSON");
        return chapters;
      }
    } catch (err) {
      logger.debug({ err, chaptersJsonUrl }, "podcast:chapters JSON fetch failed");
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(audioUrl, {
      signal: controller.signal,
      headers: {
        Range: `bytes=0-${AUDIO_RANGE_BYTES - 1}`,
        "User-Agent": "TSP-Library/1.0 (+replit; chapter-detection)",
      },
    });
    if (!res.ok && res.status !== 206) return [];
    const arrayBuf = await res.arrayBuffer();
    const chapters = parseID3Chapters(Buffer.from(arrayBuf));
    if (chapters.length > 0) {
      logger.debug({ audioUrl, count: chapters.length }, "chapters from ID3 tags");
    }
    return chapters;
  } catch (err) {
    logger.debug({ err, audioUrl }, "audio chapter fetch failed or timed out");
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// ─── Concurrency helper ───────────────────────────────────────────────────────

/**
 * Run an async mapper over `items` with at most `concurrency` parallel tasks.
 */
export async function pMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  }
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    worker,
  );
  await Promise.all(workers);
  return results;
}
