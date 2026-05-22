import { sql, eq, and, desc, lt, gte, inArray } from "drizzle-orm";
import { db, contentItemsTable, syncRunsTable, expertCouncilTable } from "@workspace/db";
import type { InsertContentItem, SyncRun } from "@workspace/db";
import { logger } from "./logger";
import { syncWordPressArchive } from "./sources/wordpress";
import { fetchYouTubeChannel } from "./sources/youtube";
import { syncUlg, correctUlgDiscoveredDates } from "./sources/ulg";
import { syncFiresideFreedom } from "./sources/fireside-freedom";
import { parseChannel } from "./rss";
import { findUlgCrossLink, findExpertLink } from "./history-enrichment";

const REFRESH_THROTTLE_MS = 6 * 60 * 60 * 1000;
const BATCH_SIZE = 200;

async function upsertBatch(items: InsertContentItem[]): Promise<number> {
  if (items.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    await db
      .insert(contentItemsTable)
      .values(batch)
      .onConflictDoUpdate({
        target: [contentItemsTable.source, contentItemsTable.sourceId],
        set: {
          kind: sql`excluded.kind`,
          slug: sql`excluded.slug`,
          title: sql`excluded.title`,
          link: sql`excluded.link`,
          summary: sql`excluded.summary`,
          bodyHtml: sql`excluded.body_html`,
          bodyText: sql`excluded.body_text`,
          publishedAt: sql`excluded.published_at`,
          durationSeconds: sql`excluded.duration_seconds`,
          audioUrl: sql`excluded.audio_url`,
          audioType: sql`excluded.audio_type`,
          videoUrl: sql`excluded.video_url`,
          videoId: sql`excluded.video_id`,
          artworkUrl: sql`excluded.artwork_url`,
          episodeNumber: sql`excluded.episode_number`,
          categories: sql`excluded.categories`,
          tags: sql`excluded.tags`,
          extra: sql`${contentItemsTable.extra} || excluded.extra`,
          updatedAt: sql`now()`,
        },
      });
    total += batch.length;
  }
  return total;
}

async function recordRun(
  source: string,
  fn: () => Promise<{ itemsSeen: number; itemsUpserted: number }>,
): Promise<{ status: "ok" | "error"; itemsSeen: number; itemsUpserted: number; error?: string }> {
  const [run] = await db
    .insert(syncRunsTable)
    .values({ source, status: "running" })
    .returning();
  try {
    const { itemsSeen, itemsUpserted } = await fn();
    await db
      .update(syncRunsTable)
      .set({
        status: "ok",
        itemsSeen,
        itemsUpserted,
        finishedAt: new Date(),
      })
      .where(eq(syncRunsTable.id, run.id));
    return { status: "ok", itemsSeen, itemsUpserted };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(syncRunsTable)
      .set({
        status: "error",
        errorMessage: message,
        finishedAt: new Date(),
      })
      .where(eq(syncRunsTable.id, run.id));
    return { status: "error", itemsSeen: 0, itemsUpserted: 0, error: message };
  }
}

async function syncWordPress(): Promise<{ itemsSeen: number; itemsUpserted: number }> {
  const { itemsSeen, itemsUpserted, failedPages } = await syncWordPressArchive({
    upsertPage: (items) => upsertBatch(items),
    getExistingExtras: async (sourceIds) => {
      if (sourceIds.length === 0) return new Map();
      const rows = await db
        .select({
          sourceId: contentItemsTable.sourceId,
          extra: contentItemsTable.extra,
        })
        .from(contentItemsTable)
        .where(
          and(
            eq(contentItemsTable.source, "wordpress"),
            inArray(contentItemsTable.sourceId, sourceIds),
          ),
        );
      return new Map(
        rows.map((r) => [r.sourceId, (r.extra ?? {}) as Record<string, unknown>]),
      );
    },
  });
  if (failedPages.length > 0) {
    logger.warn({ failedPages }, "WP sync completed with failed pages");
  }
  return { itemsSeen, itemsUpserted };
}

async function syncYouTube(): Promise<{ itemsSeen: number; itemsUpserted: number }> {
  const { itemsSeen, upserts } = await fetchYouTubeChannel();
  const itemsUpserted = await upsertBatch(upserts);
  return { itemsSeen, itemsUpserted };
}

async function syncUlgSource(): Promise<{ itemsSeen: number; itemsUpserted: number }> {
  const result = await syncUlg({ upsertBatch: (items) => upsertBatch(items) });

  // Post-insert date-correction pass: update any audio-server-directory rows
  // that still carry epoch-0 placeholders with the curated known dates.
  // This is idempotent — rows with real dates are untouched.
  await correctUlgDiscoveredDates(async (epNum, date) => {
    await db
      .update(contentItemsTable)
      .set({ publishedAt: date, updatedAt: new Date() })
      .where(
        and(
          eq(contentItemsTable.source, "ulg"),
          eq(contentItemsTable.episodeNumber, epNum),
          sql`${contentItemsTable.extra}->>'discoveredFrom' = 'audio-server-directory'`,
          sql`${contentItemsTable.publishedAt} = '1970-01-01 00:00:00+00'`,
        ),
      );
  });

  return result;
}

async function syncCouncilFeed(slug: string, feedUrl: string): Promise<{ itemsSeen: number; itemsUpserted: number }> {
  const source = `council-${slug}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "TSP-StompingPath/1.0 (+replit)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    });
    if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
    const xml = await res.text();
    const feed = parseChannel(xml);
    const items: InsertContentItem[] = feed.episodes.map((ep) => ({
      source,
      sourceId: ep.guid,
      kind: "audio" as const,
      slug: `${slug}-${ep.slug}`,
      title: ep.title,
      link: ep.link,
      summary: ep.summary,
      bodyHtml: ep.descriptionHtml,
      bodyText: null,
      publishedAt: ep.pubDate ? new Date(ep.pubDate) : new Date(0),
      durationSeconds: ep.durationSeconds,
      audioUrl: ep.audioUrl,
      audioType: ep.audioType,
      videoUrl: null,
      videoId: null,
      artworkUrl: ep.artworkUrl,
      episodeNumber: ep.episodeNumber,
      categories: ep.categories,
      tags: [],
      extra: {},
    }));
    const itemsUpserted = await upsertBatch(items);
    return { itemsSeen: items.length, itemsUpserted };
  } finally {
    clearTimeout(timer);
  }
}

async function syncAllCouncilFeeds(): Promise<{ itemsSeen: number; itemsUpserted: number }> {
  const members = await db
    .select({ slug: expertCouncilTable.slug, podcastFeedUrl: expertCouncilTable.podcastFeedUrl })
    .from(expertCouncilTable)
    .where(sql`${expertCouncilTable.podcastFeedUrl} is not null`);

  let totalSeen = 0;
  let totalUpserted = 0;
  for (const member of members) {
    if (!member.podcastFeedUrl) continue;
    try {
      const { itemsSeen, itemsUpserted } = await syncCouncilFeed(member.slug, member.podcastFeedUrl);
      totalSeen += itemsSeen;
      totalUpserted += itemsUpserted;
      logger.info({ slug: member.slug, itemsSeen, itemsUpserted }, "Council feed synced");
    } catch (err) {
      logger.warn({ err, slug: member.slug }, "Council feed sync failed");
    }
  }
  return { itemsSeen: totalSeen, itemsUpserted: totalUpserted };
}

const CROSS_LINK_BATCH = 20;

/**
 * Background enrichment pass: for every history episode in the DB that does
 * not yet have pre-computed cross-links, run the ULG and expert lookups and
 * persist the results in `extra.ulgCrossLink` / `extra.expertLink`.
 *
 * This runs AFTER the main sync so that ULG content is already present.
 * It is deliberately serial (batched) to avoid hammering the DB with
 * concurrent full-text searches.
 */
async function precomputeHistoryCrossLinks(): Promise<void> {
  let offset = 0;
  let processed = 0;
  let updated = 0;

  for (;;) {
    const rows = await db
      .select({
        id: contentItemsTable.id,
        title: contentItemsTable.title,
        extra: contentItemsTable.extra,
      })
      .from(contentItemsTable)
      .where(
        sql`${contentItemsTable.kind} = 'audio'
          AND (
            ${contentItemsTable.bodyHtml} ILIKE '%this day in history%'
            OR ${contentItemsTable.bodyText} ILIKE '%this day in history%'
          )
          AND (
            ${contentItemsTable.extra}->>'ulgCrossLink' IS NULL
            OR ${contentItemsTable.extra}->>'expertLink' IS NULL
          )`,
      )
      .limit(CROSS_LINK_BATCH)
      .offset(offset);

    if (rows.length === 0) break;

    for (const row of rows) {
      const extra = (row.extra as Record<string, unknown> | null) ?? {};
      const needsUlg = extra.ulgCrossLink === undefined;
      const needsExpert = extra.expertLink === undefined;

      if (!needsUlg && !needsExpert) {
        processed++;
        continue;
      }

      try {
        const patch: Record<string, unknown> = {};
        const [ulg, expert] = await Promise.all([
          needsUlg ? findUlgCrossLink(row.title) : Promise.resolve(undefined),
          needsExpert ? findExpertLink(row.title) : Promise.resolve(undefined),
        ]);

        if (needsUlg) patch.ulgCrossLink = ulg ?? null;
        if (needsExpert) patch.expertLink = expert ?? null;

        if (Object.keys(patch).length > 0) {
          await db
            .update(contentItemsTable)
            .set({
              extra: sql`${contentItemsTable.extra} || ${JSON.stringify(patch)}::jsonb`,
              updatedAt: new Date(),
            })
            .where(eq(contentItemsTable.id, row.id));
          updated++;
        }
      } catch (err) {
        logger.debug({ err, title: row.title }, "precomputeHistoryCrossLinks: lookup failed for episode");
      }
      processed++;
    }

    offset += rows.length;
    if (rows.length < CROSS_LINK_BATCH) break;
  }

  logger.info({ processed, updated }, "precomputeHistoryCrossLinks: complete");
}

export type RefreshSummary = {
  wordpress: { status: string; itemsSeen: number; itemsUpserted: number; error?: string };
  youtube: { status: string; itemsSeen: number; itemsUpserted: number; error?: string };
  ulg: { status: string; itemsSeen: number; itemsUpserted: number; error?: string };
  council: { status: string; itemsSeen: number; itemsUpserted: number; error?: string };
  firesideFreedom: { status: string; itemsSeen: number; itemsUpserted: number; error?: string };
};

const ALL_SOURCES = ["wordpress", "youtube", "ulg", "council", "fireside-freedom"] as const;

let inflight: Promise<RefreshSummary> | null = null;

export async function refreshAll(options: { force?: boolean } = {}): Promise<RefreshSummary> {
  if (inflight) return inflight;
  if (!options.force) {
    const recent = await db
      .select()
      .from(syncRunsTable)
      .where(eq(syncRunsTable.status, "ok"))
      .orderBy(desc(syncRunsTable.finishedAt))
      .limit(3);
    const now = Date.now();
    const hasRecent = (s: string) => {
      const r = recent.find((x) => x.source === s);
      return r && r.finishedAt && now - r.finishedAt.getTime() < REFRESH_THROTTLE_MS;
    };
    if (ALL_SOURCES.every((s) => hasRecent(s))) {
      logger.info("Skipping refresh: recent successful run within throttle window");
      return {
        wordpress: { status: "skipped", itemsSeen: 0, itemsUpserted: 0 },
        youtube: { status: "skipped", itemsSeen: 0, itemsUpserted: 0 },
        ulg: { status: "skipped", itemsSeen: 0, itemsUpserted: 0 },
        council: { status: "skipped", itemsSeen: 0, itemsUpserted: 0 },
        firesideFreedom: { status: "skipped", itemsSeen: 0, itemsUpserted: 0 },
      };
    }
  }
  inflight = (async () => {
    logger.info("Library refresh starting");
    const [wp, yt, ulg, council, firesideFreedom] = await Promise.all([
      recordRun("wordpress", syncWordPress),
      recordRun("youtube", syncYouTube),
      recordRun("ulg", syncUlgSource),
      recordRun("council", syncAllCouncilFeeds),
      recordRun("fireside-freedom", () =>
        syncFiresideFreedom({ upsertBatch: (items) => upsertBatch(items) }),
      ),
    ]);
    logger.info({ wp, yt, ulg, council, firesideFreedom }, "Library refresh complete");

    // After sync is done (ULG content is now up-to-date), pre-compute cross-links
    // for any history episodes that don't yet have them cached in `extra`.
    precomputeHistoryCrossLinks().catch((err) => {
      logger.warn({ err }, "precomputeHistoryCrossLinks failed");
    });

    return { wordpress: wp, youtube: yt, ulg, council, firesideFreedom };
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

/**
 * Kick off a refresh in the background on server start. We never block
 * incoming requests on this — if the library is empty, the first hit returns
 * empty and subsequent hits populate as data lands.
 */
export function startBackgroundRefresh(): void {
  void refreshAll().catch((err) => {
    logger.error({ err }, "Background refresh failed");
  });
  setInterval(() => {
    void refreshAll().catch((err) => {
      logger.error({ err }, "Scheduled refresh failed");
    });
  }, REFRESH_THROTTLE_MS).unref();
}

export async function getSyncStatus(): Promise<{ source: string; lastRun: SyncRun | null }[]> {
  const sources = ["wordpress", "youtube", "ulg", "council", "fireside-freedom"];
  const results: { source: string; lastRun: SyncRun | null }[] = [];
  for (const source of sources) {
    const [last] = await db
      .select()
      .from(syncRunsTable)
      .where(eq(syncRunsTable.source, source))
      .orderBy(desc(syncRunsTable.startedAt))
      .limit(1);
    results.push({ source, lastRun: last ?? null });
  }
  return results;
}

export { lt, gte, and, eq, desc };
