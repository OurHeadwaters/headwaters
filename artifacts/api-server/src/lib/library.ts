import { sql, eq, and, desc, lt, gte, inArray } from "drizzle-orm";
import { db, contentItemsTable, syncRunsTable } from "@workspace/db";
import type { InsertContentItem, SyncRun } from "@workspace/db";
import { logger } from "./logger";
import { syncWordPressArchive } from "./sources/wordpress";
import { fetchYouTubeChannel } from "./sources/youtube";
import { syncUlg, correctUlgDiscoveredDates } from "./sources/ulg";

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

export type RefreshSummary = {
  wordpress: { status: string; itemsSeen: number; itemsUpserted: number; error?: string };
  youtube: { status: string; itemsSeen: number; itemsUpserted: number; error?: string };
  ulg: { status: string; itemsSeen: number; itemsUpserted: number; error?: string };
};

const ALL_SOURCES = ["wordpress", "youtube", "ulg"] as const;

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
      };
    }
  }
  inflight = (async () => {
    logger.info("Library refresh starting");
    const [wp, yt, ulg] = await Promise.all([
      recordRun("wordpress", syncWordPress),
      recordRun("youtube", syncYouTube),
      recordRun("ulg", syncUlgSource),
    ]);
    logger.info({ wp, yt, ulg }, "Library refresh complete");
    return { wordpress: wp, youtube: yt, ulg };
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
  const sources = ["wordpress", "youtube", "ulg"];
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
