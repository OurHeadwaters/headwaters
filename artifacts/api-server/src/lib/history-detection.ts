/**
 * History-segment timestamp detection for TSP episode show notes.
 *
 * TSP show notes use many different phrasings and formats for the
 * "This Day in History" segment.  This module tries to handle all of them:
 *
 *   • Chapter-list rows:   "1:23:45 This Day in History"
 *   • Inline mentions:     "Today In History segment starts at 45:22"
 *   • Section headers:     a line that reads just "History" or "TSP History"
 *                          with a timestamp on the next/previous line
 *   • Varied phrasing:     "On This Date", "History Minute", "Historical
 *                          Segment", "In History Today", etc.
 */

export interface HistorySegmentData {
  startSeconds: number;
  endSeconds: number;
  lessonText: string;
}

/**
 * Convert an HTML show-notes string into an array of plain-text lines,
 * preserving line boundaries that existed before tag-stripping.
 */
function htmlToLines(html: string): string[] {
  return html
    .replace(/<\/(p|div|li|h\d|br|tr|dt|dd)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, " ")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * Regex that matches H:MM:SS or MM:SS timestamps.
 * Requires the digits to be preceded by a word boundary / separator to avoid
 * matching plain clock times like "12:00 pm" in the middle of a sentence when
 * there is no surrounding separator.
 */
const TIMESTAMP_RE =
  /(?:^|[\s\-–—\[•·(])(\d{1,2}):(\d{2}):(\d{2})(?:\b|$)|(?:^|[\s\-–—\[•·(])(\d{1,3}):(\d{2})(?:\b|$)/g;

function parseTsFromMatch(m: RegExpMatchArray): number {
  if (m[1] !== undefined) {
    return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  }
  return Number(m[4]) * 60 + Number(m[5]);
}

/**
 * Find all timestamp matches in a string, returning each with its character
 * offset (so callers can pick the match closest to some keyword position).
 */
function findAllTs(line: string): Array<{ ts: number; index: number }> {
  const re = new RegExp(TIMESTAMP_RE.source, "g");
  const results: Array<{ ts: number; index: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    results.push({ ts: parseTsFromMatch(m), index: m.index });
  }
  return results;
}

/**
 * Return the timestamp from `line` that is closest (in character distance)
 * to the keyword match at `keywordIndex`.  Falls back to the first timestamp
 * if no index is provided.
 */
function closestTs(
  line: string,
  keywordIndex: number | null,
): number | null {
  const all = findAllTs(line);
  if (all.length === 0) return null;
  if (keywordIndex === null) return all[0].ts;
  let best = all[0];
  for (const entry of all) {
    if (
      Math.abs(entry.index - keywordIndex) < Math.abs(best.index - keywordIndex)
    ) {
      best = entry;
    }
  }
  return best.ts;
}

/**
 * Strong history-segment keywords — any of these on or near a timestamp line
 * is a very reliable signal that the timestamp marks the history segment.
 */
const HISTORY_STRONG =
  /this\s+day\s+in\s+history|today\s+in\s+history|on\s+this\s+(day|date)(\s+in\s+history)?|tsp\s+histor(y|ical)|jack['']?s?\s+(daily\s+)?histor(y|ical)|history\s+(segment|section|minute|block|corner|feature|part|time)|historical\s+(segment|section|feature|look)|in\s+history\s+today|daily\s+history|history\s+today|this\s+date\s+in\s+history|date\s+in\s+history/i;

/**
 * Weaker history keywords — reliable only when adjacent to a real timestamp
 * (>= 60 s) AND the timestamp is not likely a clock time.
 */
const HISTORY_WEAK = /\bhistor(y|ical|ically)\b/i;

/**
 * A line that is a standalone section header for "history"
 * (very short, primarily the word "history" possibly with some decoration).
 */
const HISTORY_HEADER = /^[-–—*#•\s]*histor(y|ical)[-–—*#•:\s]*$/i;

/**
 * Returns true when a timestamp value looks like a real playback offset
 * rather than an accidental clock-time match.
 * We consider any value >= 60 s (i.e. at least 1:00) meaningful.
 */
function isMeaningfulTs(ts: number): boolean {
  return ts >= 60;
}

/**
 * Search `lines` in the window [lo, hi] (inclusive) for a timestamp.
 * Returns the first match found, or null.
 */
function findTsInWindow(
  lines: string[],
  lo: number,
  hi: number,
  requireMeaningful = false,
): number | null {
  for (let j = lo; j <= hi; j++) {
    const all = findAllTs(lines[j]);
    for (const { ts } of all) {
      if (requireMeaningful && !isMeaningfulTs(ts)) continue;
      return ts;
    }
  }
  return null;
}

/**
 * Internal helper: find the history segment start and return both
 * the timestamp and the line index where it was found.
 */
function findHistoryStart(
  lines: string[],
): { ts: number; lineIndex: number } | null {
  const n = lines.length;

  // ── Pass 1: strong keyword on the same line as a timestamp ────────────────
  for (let i = 0; i < n; i++) {
    const kwMatch = lines[i].match(HISTORY_STRONG);
    if (!kwMatch) continue;
    const kwIndex = lines[i].indexOf(kwMatch[0]);
    const ts = closestTs(lines[i], kwIndex);
    if (ts !== null) return { ts, lineIndex: i };
  }

  // ── Pass 2: strong keyword on a nearby line (±5 lines) ───────────────────
  for (let i = 0; i < n; i++) {
    if (!HISTORY_STRONG.test(lines[i])) continue;
    for (let j = Math.max(0, i - 5); j <= Math.min(n - 1, i + 5); j++) {
      const all = findAllTs(lines[j]);
      if (all.length > 0) return { ts: all[0].ts, lineIndex: i };
    }
  }

  // ── Pass 3: standalone "History" section header with nearby timestamp ─────
  for (let i = 0; i < n; i++) {
    if (!HISTORY_HEADER.test(lines[i])) continue;
    const ts = findTsInWindow(
      lines,
      Math.max(0, i - 3),
      Math.min(n - 1, i + 3),
      true,
    );
    if (ts !== null) return { ts, lineIndex: i };
  }

  // ── Pass 4: weak keyword adjacent to a meaningful timestamp (≥ 60 s) ──────
  for (let i = 0; i < n; i++) {
    if (!HISTORY_WEAK.test(lines[i])) continue;
    const ts = findTsInWindow(
      lines,
      Math.max(0, i - 2),
      Math.min(n - 1, i + 3),
      true,
    );
    if (ts !== null) return { ts, lineIndex: i };
  }

  return null;
}

const DEFAULT_SEGMENT_DURATION = 8 * 60; // 8 minutes fallback

/**
 * Given lines and a history start, find the end timestamp by looking for
 * the next meaningful timestamp after the start. Falls back to start + 8 min.
 */
function findEndTimestamp(
  lines: string[],
  startLineIndex: number,
  startTs: number,
): number {
  const n = lines.length;
  for (let i = startLineIndex + 1; i < n; i++) {
    const all = findAllTs(lines[i]);
    for (const { ts } of all) {
      // Must be meaningfully greater (at least 1 minute after start)
      if (ts > startTs + 60 && isMeaningfulTs(ts)) {
        return ts;
      }
    }
  }
  return startTs + DEFAULT_SEGMENT_DURATION;
}

/**
 * Extract prose text from lines following the history start.
 * Stops when a new chapter/section timestamp is encountered.
 * Returns at most ~1000 characters.
 */
function extractLessonText(
  lines: string[],
  startLineIndex: number,
  startTs: number,
): string {
  const textLines: string[] = [];
  const n = lines.length;
  let charsAccum = 0;

  for (let i = startLineIndex + 1; i < n; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Stop when we encounter a line whose timestamp comes after history start
    // (signals the next chapter/section)
    const all = findAllTs(line);
    if (all.some(({ ts }) => ts > startTs + 60 && isMeaningfulTs(ts))) break;

    // Skip lines that are purely/mostly timestamps (chapter-list entries)
    const textOnly = line.replace(/\d{1,3}:\d{2}(:\d{2})?/g, "").trim();
    if (all.length > 0 && textOnly.length < 5) continue;

    // Skip lines that look like chapter list entries (timestamp at start + short text)
    if (all.length > 0 && line.length < 60 && textOnly.length < 30) continue;

    textLines.push(line);
    charsAccum += line.length + 1;
    if (charsAccum >= 1000) break;
  }

  const result = textLines.join(" ").trim();
  return result.length > 1000 ? result.slice(0, 997) + "..." : result;
}

/**
 * Main exported function.
 *
 * Given the raw HTML of an episode's show notes, returns the playback offset
 * (in seconds) where the "This Day in History" segment begins, or null if it
 * cannot be determined.
 */
export function extractHistoryTimestamp(descriptionHtml: string): number | null {
  const lines = htmlToLines(descriptionHtml);
  const result = findHistoryStart(lines);
  return result?.ts ?? null;
}

/**
 * Extract a history event title from "resources" style show notes where the
 * format is a link with text like "This Day in History – [Event Title]" or
 * "On this Day in History the [Event]".
 * Returns the extracted event title, or null.
 */
export function extractHistoryEventTitle(descriptionHtml: string): string | null {
  const lines = htmlToLines(descriptionHtml);
  for (const line of lines) {
    // Match "This Day in History – [Event Title]" (with various separators)
    const m = line.match(
      /(?:this\s+day|on\s+this\s+day|today)\s+in\s+history\s*[–\-—:]\s*(.{5,200})/i,
    );
    if (m) return m[1].trim();

    // Match "On this Day in History the [Event]"
    const m2 = line.match(
      /on\s+this\s+day\s+in\s+history\s+(?:the\s+)?(.{5,200})/i,
    );
    if (m2) return m2[1].trim();
  }
  return null;
}

/**
 * Extended export: returns the full history segment data including start time,
 * estimated end time, and extracted lesson text from the show notes.
 *
 * Two detection modes:
 *  1. Timestamp mode: finds a timestamp near a history keyword — returns the
 *     exact start/end seconds for the scoped player.
 *  2. Resource-link mode (fallback): finds "This Day in History – [Event Title]"
 *     link text and returns startSeconds=0 / endSeconds=0 with the event title
 *     as lessonText. The frontend hides the segment player in this case and
 *     shows a "Listen to full episode" link instead.
 *
 * Returns null only when no history content is detectable at all.
 */
export function extractHistorySegment(
  descriptionHtml: string,
): HistorySegmentData | null {
  const lines = htmlToLines(descriptionHtml);

  // ── Mode 1: timestamp-based detection ────────────────────────────────────
  const start = findHistoryStart(lines);
  if (start) {
    const endSeconds = findEndTimestamp(lines, start.lineIndex, start.ts);
    const lessonText = extractLessonText(lines, start.lineIndex, start.ts);
    return { startSeconds: start.ts, endSeconds, lessonText };
  }

  // ── Mode 2: resource-link title extraction ────────────────────────────────
  const eventTitle = extractHistoryEventTitle(descriptionHtml);
  if (eventTitle) {
    return { startSeconds: 0, endSeconds: 0, lessonText: eventTitle };
  }

  return null;
}
