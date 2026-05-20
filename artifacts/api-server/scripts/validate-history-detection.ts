/**
 * Validation script for history-segment timestamp detection.
 *
 * Two test suites are run:
 *
 *   Suite A — Synthetic corpus (25 cases)
 *     Hand-crafted show-note snippets modelled on every TSP formatting style.
 *     These are the ground truth for "does the algorithm work when data exists?"
 *     Target: ≥ 20/25 (80%) detected correctly.
 *
 *   Suite B — Live RSS feed (400 recent episodes)
 *     Real episodes pulled from the TSP podcast RSS feed.  The RSS <description>
 *     is truncated and never contains chapter timestamps, so detection should
 *     return null for virtually all of them (correct behaviour — we must not
 *     fire on false positives from "history" used as a general word).
 *     Target: ≤ 10% false-positive rate.
 *
 * Usage (from the api-server package root):
 *   pnpm tsx scripts/validate-history-detection.ts
 *
 * Or after esbuild bundling:
 *   node /tmp/validate-history.mjs
 */

import { extractHistoryTimestamp } from "../src/lib/history-detection";
import { XMLParser } from "fast-xml-parser";

// ── Suite A: Synthetic test corpus ───────────────────────────────────────────

type TestCase = {
  name: string;
  html: string;
  expectNull: boolean;
  expectedTs?: number;
};

const SYNTHETIC: TestCase[] = [
  // ── Format 1: classic chapter list with H:MM:SS ──
  {
    name: "chapter-list-hhmmss",
    html: `<p>Topics covered today:</p>
<ul>
<li>0:00:00 – Intro &amp; news</li>
<li>0:23:45 – This Day in History</li>
<li>1:05:00 – Main topic</li>
</ul>`,
    expectNull: false,
    expectedTs: 23 * 60 + 45,
  },
  // ── Format 2: MM:SS chapter list ──
  {
    name: "chapter-list-mmss",
    html: `<p>Show outline:</p>
<ul>
<li>3:22 Intro</li>
<li>45:10 Today In History</li>
<li>1:12:30 Main segment</li>
</ul>`,
    expectNull: false,
    expectedTs: 45 * 60 + 10,
  },
  // ── Format 3: timestamp on line before keyword ──
  {
    name: "timestamp-line-before-keyword",
    html: `<p>45:22</p>
<p>This Day in History – what happened on this date</p>
<p>Some content follows.</p>`,
    expectNull: false,
    expectedTs: 45 * 60 + 22,
  },
  // ── Format 4: timestamp on line after keyword ──
  {
    name: "timestamp-line-after-keyword",
    html: `<p>On This Day In History</p>
<p>1:02:15</p>`,
    expectNull: false,
    expectedTs: 62 * 60 + 15,
  },
  // ── Format 5: "Today In History" inline with dash + MM:SS ──
  {
    name: "today-in-history-inline-dash-mmss",
    html: `<p>Resources for today's show</p>
<p>Today In History – 54:00</p>
<p>Join the MSB</p>`,
    expectNull: false,
    expectedTs: 54 * 60,
  },
  // ── Format 6: "TSP History" phrasing ──
  {
    name: "tsp-history-phrasing",
    html: `<ul>
<li>0:00 Intro</li>
<li>22:10 Main topic</li>
<li>48:33 TSP History</li>
<li>1:05:00 Wrap-up</li>
</ul>`,
    expectNull: false,
    expectedTs: 48 * 60 + 33,
  },
  // ── Format 7: "On This Date" phrasing ──
  {
    name: "on-this-date-phrasing",
    html: `<p>Show notes for today:</p>
<p>• 38:44 On This Date in History</p>`,
    expectNull: false,
    expectedTs: 38 * 60 + 44,
  },
  // ── Format 8: "Jack's Daily History" phrasing ──
  {
    name: "jacks-daily-history",
    html: `<ul>
<li>15:00 – News roundup</li>
<li>52:18 – Jack's Daily History</li>
<li>1:10:00 – Prep topic</li>
</ul>`,
    expectNull: false,
    expectedTs: 52 * 60 + 18,
  },
  // ── Format 9: "History Segment" label ──
  {
    name: "history-segment-label",
    html: `<p>Today's episode timeline:</p>
<p>0:00 – Intro<br/>23:15 – History Segment<br/>55:00 – Main content</p>`,
    expectNull: false,
    expectedTs: 23 * 60 + 15,
  },
  // ── Format 10: "Historical Segment" ──
  {
    name: "historical-segment",
    html: `<ul>
<li>10:00 – Sponsor break</li>
<li>1:01:44 – Historical Segment: The Homesteading Movement</li>
<li>1:20:00 – Q&amp;A</li>
</ul>`,
    expectNull: false,
    expectedTs: 61 * 60 + 44,
  },
  // ── Format 11: bare "History" section header, timestamp above ──
  {
    name: "standalone-header-ts-above",
    html: `<p>1:15:00</p>
<h3>History</h3>
<p>On this day in 1776...</p>`,
    expectNull: false,
    expectedTs: 75 * 60,
  },
  // ── Format 12: bare "History" section header, timestamp below ──
  {
    name: "standalone-header-ts-below",
    html: `<h3>== History ==</h3>
<p>1:08:30 – begin segment</p>`,
    expectNull: false,
    expectedTs: 68 * 60 + 30,
  },
  // ── Format 13: "In History Today" phrasing ──
  {
    name: "in-history-today",
    html: `<p>Chapters:</p>
<p>00:00 Intro</p>
<p>44:05 In History Today</p>
<p>58:10 Wrap</p>`,
    expectNull: false,
    expectedTs: 44 * 60 + 5,
  },
  // ── Format 14: "History Minute" label ──
  {
    name: "history-minute",
    html: `<ul><li>5:00 Sponsor</li><li>37:22 History Minute</li><li>45:00 Main topic</li></ul>`,
    expectNull: false,
    expectedTs: 37 * 60 + 22,
  },
  // ── Format 15: bracket-style timestamp ──
  {
    name: "bracket-timestamp",
    html: `<p>Segments: [00:00] Intro [28:15] This Day In History [52:00] Prep tips</p>`,
    expectNull: false,
    expectedTs: 28 * 60 + 15,
  },
  // ── Format 16: "Daily History" phrasing ──
  {
    name: "daily-history",
    html: `<p>• 43:00 Daily History</p>
<p>• 1:00:00 Survival topic</p>`,
    expectNull: false,
    expectedTs: 43 * 60,
  },
  // ── Format 17: "On This Day" short form ──
  {
    name: "on-this-day-short",
    html: `<p>Episode breakdown</p>
<p>0:00 Intro – 41:30 On This Day – 1:10:00 Outro</p>`,
    expectNull: false,
    expectedTs: 41 * 60 + 30,
  },
  // ── Format 18: "Today in History" keyword several lines before timestamp ──
  {
    name: "keyword-5-lines-before-ts",
    html: `<p>Today in History:</p>
<p>We will be covering some amazing events</p>
<p>that happened on this date.</p>
<p>Stay tuned for details at</p>
<p>1:02:45</p>`,
    expectNull: false,
    expectedTs: 62 * 60 + 45,
  },
  // ── Format 19: "TSP Historical" phrasing ──
  {
    name: "tsp-historical",
    html: `<ul>
<li>0:00 – Intro</li>
<li>55:11 – TSP Historical Feature</li>
</ul>`,
    expectNull: false,
    expectedTs: 55 * 60 + 11,
  },
  // ── Format 20: "This Date in History" phrasing ──
  {
    name: "this-date-in-history",
    html: `<p>1:18:04 – This Date In History</p>`,
    expectNull: false,
    expectedTs: 78 * 60 + 4,
  },
  // ── Negative: "history" as general word, no timestamp ──
  {
    name: "neg-general-history-word-no-ts",
    html: `<p>Today we discuss the history of homesteading and how it evolved over the past century.
Jack shares his historical perspective on the movement.</p>`,
    expectNull: true,
  },
  // ── Negative: episode duration only (not a chapter marker) ──
  {
    name: "neg-duration-only",
    html: `<p>Podcast: Play in new window | Download (Duration: 1:26:29 — 24.7MB)</p>
<p>Join us today as we talk about gardening techniques and self-sufficiency.</p>`,
    expectNull: true,
  },
  // ── Negative: "on this day" in an unrelated sentence without timestamp ──
  {
    name: "neg-on-this-day-no-ts",
    html: `<p>On this day we welcome a special guest to the show.
We will not be covering any historical events today.</p>`,
    expectNull: true,
  },
  // ── Negative: low timestamp (< 60 s) near history word — should be ignored ──
  {
    name: "neg-sub-60s-timestamp",
    html: `<p>The history behind this technique is fascinating.</p>
<p>0:45 Intro</p>`,
    expectNull: true,
  },
  // ── Negative: "historical prices" — financial context, no chapter ts ──
  {
    name: "neg-historical-prices-no-ts",
    html: `<p>We examine historical silver prices and what they mean for preppers.
Historical data goes back to 1971.</p>`,
    expectNull: true,
  },
];

// ── Suite B: Live RSS feed ────────────────────────────────────────────────────

const FEED_URL = "https://www.thesurvivalpodcast.com/feed/podcast";
const FETCH_TIMEOUT_MS = 20_000;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "__cdata",
  textNodeName: "#text",
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  isArray: (name) => name === "item" || name === "category",
});

function textOf(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number" || typeof node === "boolean") return String(node);
  if (Array.isArray(node)) return (node as unknown[]).map(textOf).join("");
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (typeof obj["__cdata"] === "string") return obj["__cdata"];
    if (typeof obj["#text"] === "string") return obj["#text"];
  }
  return "";
}

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function fmtTs(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

async function fetchLiveEpisodes(): Promise<
  Array<{ title: string; descriptionHtml: string }>
> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(FEED_URL, {
      signal: controller.signal,
      headers: {
        "User-Agent": "TSP-ValidationScript/1.0",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    });
    if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
    const xml = await res.text();
    const parsed = xmlParser.parse(xml) as Record<string, unknown>;
    const channel = (parsed["rss"] as Record<string, unknown>)?.["channel"] as
      | Record<string, unknown>
      | undefined;
    if (!channel) throw new Error("No channel in feed");
    return asArray(channel["item"]).map((raw) => {
      const item = raw as Record<string, unknown>;
      return {
        title: textOf(item["title"]),
        descriptionHtml: textOf(item["description"]),
      };
    });
  } finally {
    clearTimeout(timer);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // ── Suite A ────────────────────────────────────────────────────────────────
  console.log("══════════════════════════════════════════════════════════════");
  console.log("Suite A — Synthetic corpus (25 representative show-note formats)");
  console.log("══════════════════════════════════════════════════════════════\n");

  let aPass = 0;
  let aFail = 0;
  const aFailed: string[] = [];

  for (const tc of SYNTHETIC) {
    const result = extractHistoryTimestamp(tc.html);

    if (tc.expectNull) {
      if (result === null) {
        aPass++;
        console.log(`  ✓ PASS  [${tc.name}]  → null (correct)`);
      } else {
        aFail++;
        aFailed.push(tc.name);
        console.log(`  ✗ FAIL  [${tc.name}]  → expected null, got ${fmtTs(result)}`);
      }
    } else {
      if (result !== null) {
        const correct =
          tc.expectedTs === undefined || result === tc.expectedTs;
        if (correct) {
          aPass++;
          console.log(
            `  ✓ PASS  [${tc.name}]  → ${fmtTs(result)}${tc.expectedTs !== undefined ? " (expected " + fmtTs(tc.expectedTs) + ")" : ""}`,
          );
        } else {
          aFail++;
          aFailed.push(tc.name);
          console.log(
            `  ✗ FAIL  [${tc.name}]  → got ${fmtTs(result)}, expected ${fmtTs(tc.expectedTs!)}`,
          );
        }
      } else {
        aFail++;
        aFailed.push(tc.name);
        console.log(
          `  ✗ FAIL  [${tc.name}]  → expected a timestamp, got null`,
        );
      }
    }
  }

  const aTotal = SYNTHETIC.length;
  const aPct = Math.round((aPass / aTotal) * 100);
  const aTarget = 80;
  const aPassed = aPct >= aTarget;
  console.log(
    `\nSuite A result: ${aPass}/${aTotal} (${aPct}%) — target ≥ ${aTarget}% — ${aPassed ? "PASS ✓" : "FAIL ✗"}`,
  );
  if (aFailed.length > 0) {
    console.log(`Failed cases: ${aFailed.join(", ")}`);
  }

  // ── Suite B ────────────────────────────────────────────────────────────────
  console.log(
    "\n══════════════════════════════════════════════════════════════",
  );
  console.log("Suite B — Live RSS feed (false-positive check)");
  console.log(
    "══════════════════════════════════════════════════════════════",
  );
  console.log("Fetching TSP RSS feed…");

  let liveEpisodes: Array<{ title: string; descriptionHtml: string }> = [];
  try {
    liveEpisodes = await fetchLiveEpisodes();
    console.log(`Fetched ${liveEpisodes.length} episodes.\n`);
  } catch (err) {
    console.warn("Feed fetch failed:", err);
    console.warn("Skipping Suite B.\n");
  }

  let bFalsePositives = 0;
  const bFpExamples: string[] = [];
  for (const ep of liveEpisodes) {
    const result = extractHistoryTimestamp(ep.descriptionHtml);
    if (result !== null) {
      bFalsePositives++;
      if (bFpExamples.length < 5) {
        bFpExamples.push(`[${fmtTs(result)}] ${ep.title}`);
      }
    }
  }

  const bTotal = liveEpisodes.length;
  const bFpPct = bTotal > 0 ? Math.round((bFalsePositives / bTotal) * 100) : 0;
  const bTarget = 10;
  const bPassed = bFpPct <= bTarget;
  console.log(
    `False positives: ${bFalsePositives}/${bTotal} (${bFpPct}%) — target ≤ ${bTarget}% — ${bPassed ? "PASS ✓" : "FAIL ✗"}`,
  );
  if (bFpExamples.length > 0) {
    console.log("False-positive examples:");
    bFpExamples.forEach((e) => console.log(`  ${e}`));
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(
    "\n══════════════════════════════════════════════════════════════",
  );
  const allPassed = aPassed && (bTotal === 0 || bPassed);
  console.log(
    `Overall: Suite A ${aPassed ? "PASS" : "FAIL"}, Suite B ${bTotal === 0 ? "SKIP" : bPassed ? "PASS" : "FAIL"} — ${allPassed ? "ALL TESTS PASS ✓" : "SOME TESTS FAIL ✗"}`,
  );
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error("Validation failed:", err);
  process.exit(1);
});
