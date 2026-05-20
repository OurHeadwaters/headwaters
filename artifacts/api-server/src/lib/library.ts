import { sql, eq, and, desc, lt, gte } from "drizzle-orm";
import { db, contentItemsTable, syncRunsTable } from "@workspace/db";
import type { InsertContentItem, SyncRun } from "@workspace/db";
import { logger } from "./logger";
import { syncWordPressArchive } from "./sources/wordpress";
import { fetchYouTubeChannel } from "./sources/youtube";

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
          extra: sql`excluded.extra`,
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

export type RefreshSummary = {
  wordpress: { status: string; itemsSeen: number; itemsUpserted: number; error?: string };
  youtube: { status: string; itemsSeen: number; itemsUpserted: number; error?: string };
};

let inflight: Promise<RefreshSummary> | null = null;

export async function refreshAll(options: { force?: boolean } = {}): Promise<RefreshSummary> {
  if (inflight) return inflight;
  if (!options.force) {
    const recent = await db
      .select()
      .from(syncRunsTable)
      .where(eq(syncRunsTable.status, "ok"))
      .orderBy(desc(syncRunsTable.finishedAt))
      .limit(2);
    const sources = new Set(recent.map((r) => r.source));
    const now = Date.now();
    const hasRecent = (s: string) => {
      const r = recent.find((x) => x.source === s);
      return r && r.finishedAt && now - r.finishedAt.getTime() < REFRESH_THROTTLE_MS;
    };
    if (sources.has("wordpress") && sources.has("youtube") && hasRecent("wordpress") && hasRecent("youtube")) {
      logger.info("Skipping refresh: recent successful run within throttle window");
      return {
        wordpress: { status: "skipped", itemsSeen: 0, itemsUpserted: 0 },
        youtube: { status: "skipped", itemsSeen: 0, itemsUpserted: 0 },
      };
    }
  }
  inflight = (async () => {
    logger.info("Library refresh starting");
    const [wp, yt] = await Promise.all([
      recordRun("wordpress", syncWordPress),
      recordRun("youtube", syncYouTube),
    ]);
    logger.info({ wp, yt }, "Library refresh complete");
    return { wordpress: wp, youtube: yt };
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
  const sources = ["wordpress", "youtube"];
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
