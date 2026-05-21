/**
 * Wisdom Scraper — fetches content from Expert Council member websites
 * and their public X accounts (via Nitter) and extracts wisdom gems.
 *
 * Website scraping: fetch homepage + /blog or /articles, strip HTML, run
 * the heuristic scorer, cap at 10 gems per source per run.
 *
 * X scraping: fetch a public Nitter instance for the member's handle,
 * parse tweet text, run the scorer, cap at 10 tweets per handle.
 *
 * Results are written to wisdom_gems with source='website' or source='x',
 * and a row is upserted into wisdom_scrape_log for status tracking.
 */

import sanitizeHtml from "sanitize-html";
import { db, wisdomGemsTable, wisdomScrapeLogTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { EXPERT_COUNCIL } from "./expert-council-static";
import { extractGems } from "./wisdom-extraction";
import { logger } from "./logger";

const MAX_GEMS_PER_SOURCE = 10;
const FETCH_TIMEOUT_MS = 12_000;

const NITTER_INSTANCES = [
  "https://nitter.poast.org",
  "https://nitter.privacydev.net",
  "https://nitter.1d4.us",
];

export type ScrapeSourceType = "website" | "x";

export interface ScrapeResult {
  sourceId: string;
  sourceName: string;
  sourceType: ScrapeSourceType;
  sourceUrl: string;
  xHandle?: string;
  gemsInserted: number;
  status: "ok" | "error";
  errorMsg?: string;
}

async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TSP-WisdomBot/1.0; +https://thestompingpath.com)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function htmlToText(html: string): string {
  const clean = sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
    textFilter(text) {
      return text + " ";
    },
  });
  return clean.replace(/\s{3,}/g, "\n\n").trim();
}

async function fetchPageText(url: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) return null;
    const html = await res.text();
    return htmlToText(html);
  } catch (err) {
    logger.warn({ url, err }, "wisdom-scraper: fetch page failed");
    return null;
  }
}

async function scrapeWebsite(
  member: { id: string; name: string; url: string },
): Promise<ScrapeResult> {
  const baseUrl = member.url.replace(/\/$/, "");
  const candidateUrls = [
    baseUrl,
    `${baseUrl}/blog`,
    `${baseUrl}/articles`,
    `${baseUrl}/resources`,
  ];

  const allText: string[] = [];
  for (const url of candidateUrls) {
    const text = await fetchPageText(url);
    if (text) allText.push(text);
  }

  if (allText.length === 0) {
    return {
      sourceId: `${member.id}::website`,
      sourceName: member.name,
      sourceType: "website",
      sourceUrl: baseUrl,
      gemsInserted: 0,
      status: "error",
      errorMsg: "All page fetches failed or returned non-HTML",
    };
  }

  const combined = allText.join("\n\n");
  const gems = extractGems(combined, MAX_GEMS_PER_SOURCE);

  const inserted = await insertGems(gems, {
    source: "website",
    attribution: member.name,
    sourceUrl: baseUrl,
  });

  await upsertLog({
    sourceId: `${member.id}::website`,
    sourceName: member.name,
    sourceType: "website",
    sourceUrl: baseUrl,
    gemCount: inserted,
    status: "ok",
  });

  return {
    sourceId: `${member.id}::website`,
    sourceName: member.name,
    sourceType: "website",
    sourceUrl: baseUrl,
    gemsInserted: inserted,
    status: "ok",
  };
}

function extractNitterTweets(html: string): string[] {
  const tweetTexts: string[] = [];
  const tweetBlockPattern = /class="tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let match: RegExpExecArray | null;
  while ((match = tweetBlockPattern.exec(html)) !== null) {
    const text = htmlToText(match[1]).trim();
    if (text.length > 20) tweetTexts.push(text);
    if (tweetTexts.length >= 30) break;
  }
  return tweetTexts;
}

async function scrapeX(
  member: { id: string; name: string; url: string; xHandle: string },
): Promise<ScrapeResult> {
  const sourceUrl = `https://x.com/${member.xHandle}`;

  let html: string | null = null;
  let nitterUrl = "";

  for (const instance of NITTER_INSTANCES) {
    nitterUrl = `${instance}/${member.xHandle}`;
    try {
      const res = await fetchWithTimeout(nitterUrl, 10_000);
      if (res.ok) {
        const ct = res.headers.get("content-type") ?? "";
        if (ct.includes("text/html")) {
          html = await res.text();
          break;
        }
      }
    } catch {
      continue;
    }
  }

  if (!html) {
    const result: ScrapeResult = {
      sourceId: `${member.id}::x`,
      sourceName: member.name,
      sourceType: "x",
      sourceUrl,
      xHandle: member.xHandle,
      gemsInserted: 0,
      status: "error",
      errorMsg: "All Nitter instances failed",
    };
    await upsertLog({ ...result, sourceId: `${member.id}::x`, sourceUrl, gemCount: 0 });
    return result;
  }

  const tweets = extractNitterTweets(html);
  const combinedText = tweets.join("\n\n");
  const gems = extractGems(combinedText, MAX_GEMS_PER_SOURCE);

  const inserted = await insertGems(gems, {
    source: "x",
    attribution: member.name,
    sourceUrl: nitterUrl,
  });

  await upsertLog({
    sourceId: `${member.id}::x`,
    sourceName: member.name,
    sourceType: "x",
    sourceUrl,
    xHandle: member.xHandle,
    gemCount: inserted,
    status: "ok",
  });

  return {
    sourceId: `${member.id}::x`,
    sourceName: member.name,
    sourceType: "x",
    sourceUrl,
    xHandle: member.xHandle,
    gemsInserted: inserted,
    status: "ok",
  };
}

async function insertGems(
  gems: string[],
  meta: { source: string; attribution: string; sourceUrl: string },
): Promise<number> {
  if (gems.length === 0) return 0;
  let inserted = 0;
  for (const gemText of gems) {
    const existing = await db
      .select({ id: wisdomGemsTable.id })
      .from(wisdomGemsTable)
      .where(
        and(
          sql`lower(${wisdomGemsTable.gemText}) = lower(${gemText})`,
          eq(wisdomGemsTable.source, meta.source),
        ),
      )
      .limit(1);
    if (existing.length > 0) continue;
    await db.insert(wisdomGemsTable).values({
      episodeSlug: "",
      episodeTitle: null,
      gemText,
      source: meta.source,
      attribution: meta.attribution,
      sourceUrl: meta.sourceUrl,
    });
    inserted++;
  }
  return inserted;
}

async function upsertLog(data: {
  sourceId: string;
  sourceName: string;
  sourceType: string;
  sourceUrl: string;
  xHandle?: string;
  gemCount: number;
  status: string;
  errorMsg?: string;
}): Promise<void> {
  const existing = await db
    .select({ id: wisdomScrapeLogTable.id })
    .from(wisdomScrapeLogTable)
    .where(eq(wisdomScrapeLogTable.sourceId, data.sourceId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(wisdomScrapeLogTable)
      .set({
        sourceName: data.sourceName,
        sourceType: data.sourceType,
        sourceUrl: data.sourceUrl,
        xHandle: data.xHandle ?? null,
        lastScrapedAt: new Date(),
        gemCount: data.gemCount,
        status: data.status,
        errorMsg: data.errorMsg ?? null,
      })
      .where(eq(wisdomScrapeLogTable.sourceId, data.sourceId));
  } else {
    await db.insert(wisdomScrapeLogTable).values({
      sourceId: data.sourceId,
      sourceName: data.sourceName,
      sourceType: data.sourceType,
      sourceUrl: data.sourceUrl,
      xHandle: data.xHandle ?? null,
      lastScrapedAt: new Date(),
      gemCount: data.gemCount,
      status: data.status,
      errorMsg: data.errorMsg ?? null,
    });
  }
}

export async function scrapeSource(
  memberId: string,
  type: ScrapeSourceType,
): Promise<ScrapeResult> {
  const member = EXPERT_COUNCIL.find((m) => m.id === memberId);
  if (!member) {
    throw new Error(`Unknown member id: ${memberId}`);
  }
  if (type === "x") {
    if (!member.xHandle) {
      throw new Error(`Member ${memberId} has no X handle`);
    }
    return scrapeX({ ...member, xHandle: member.xHandle });
  }
  return scrapeWebsite(member);
}

export async function scrapeAll(): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  for (const member of EXPERT_COUNCIL) {
    const skipTsp = member.id === "nicholas-de-hart" || member.id === "chuck-taylor";
    const skipInternalUrl =
      !skipTsp && member.url.startsWith("https://www.thesurvivalpodcast.com");

    if (!skipInternalUrl) {
      try {
        logger.info({ member: member.id }, "wisdom-scraper: scraping website");
        const res = await scrapeWebsite(member);
        results.push(res);
      } catch (err) {
        logger.error({ member: member.id, err }, "wisdom-scraper: website scrape threw");
        results.push({
          sourceId: `${member.id}::website`,
          sourceName: member.name,
          sourceType: "website",
          sourceUrl: member.url,
          gemsInserted: 0,
          status: "error",
          errorMsg: String(err),
        });
      }
    }

    if (member.xHandle) {
      try {
        logger.info({ member: member.id, handle: member.xHandle }, "wisdom-scraper: scraping X");
        const res = await scrapeX({ ...member, xHandle: member.xHandle });
        results.push(res);
      } catch (err) {
        logger.error({ member: member.id, err }, "wisdom-scraper: X scrape threw");
        results.push({
          sourceId: `${member.id}::x`,
          sourceName: member.name,
          sourceType: "x",
          sourceUrl: `https://x.com/${member.xHandle}`,
          xHandle: member.xHandle,
          gemsInserted: 0,
          status: "error",
          errorMsg: String(err),
        });
      }
    }
  }

  return results;
}
