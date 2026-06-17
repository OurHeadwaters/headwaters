/**
 * Artwork backfill runner.
 *
 * Lives in lib/db/scripts/ so that the "pg" import resolves through
 * lib/db/node_modules (where @workspace/db depends on it).
 *
 * Usage:
 *   node lib/db/scripts/run-artwork-backfill.mjs
 *   node lib/db/scripts/run-artwork-backfill.mjs --dry
 *   BATCH_SIZE=200 node lib/db/scripts/run-artwork-backfill.mjs
 */

import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL env var is required");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const BATCH_SIZE = Number(process.env.BATCH_SIZE ?? 200);
const CONCURRENCY = 6;
const DRY_RUN = process.argv.includes("--dry");

const WP_BASE = "https://www.thesurvivalpodcast.com/wp-json/wp/v2";
const FETCH_TIMEOUT_MS = 30_000;
const RETRY_ATTEMPTS = 3;
const RETRY_BASE_MS = 1_000;

const slugCache = new Map();

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  let lastErr;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "TSP-ArtworkBackfill/1.0 (+replit)",
          Accept: "application/json",
        },
      });
      if (res.ok) return await res.json();
      if (res.status >= 500 && attempt < RETRY_ATTEMPTS) {
        await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));
        lastErr = new Error(`HTTP ${res.status}`);
        continue;
      }
      const body = await res.text().catch(() => "");
      throw new Error(`WP ${res.status}: ${body.slice(0, 120)}`);
    } catch (err) {
      lastErr = err;
      if (attempt < RETRY_ATTEMPTS) {
        await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr ?? new Error("WP fetch failed");
}

function extractFeaturedImageUrl(post) {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (!media) return null;
  const sizes = media.media_details?.sizes;
  return (
    sizes?.large?.source_url ||
    sizes?.medium_large?.source_url ||
    sizes?.full?.source_url ||
    sizes?.medium?.source_url ||
    media.source_url ||
    null
  );
}

async function fetchFeaturedImageBySlug(slug) {
  if (slugCache.has(slug)) return slugCache.get(slug);
  try {
    const url = `${WP_BASE}/posts?slug=${encodeURIComponent(slug)}&_embed&per_page=1`;
    const posts = await fetchJson(url);
    const imageUrl = posts[0] ? extractFeaturedImageUrl(posts[0]) : null;
    slugCache.set(slug, imageUrl);
    return imageUrl;
  } catch {
    slugCache.set(slug, null);
    return null;
  }
}

async function pMap(items, fn, concurrency) {
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
}

async function countRemaining() {
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS count FROM content_items WHERE artwork_url IS NULL AND source = 'wordpress'",
  );
  return rows[0]?.count ?? 0;
}

async function runBatch() {
  const { rows } = await pool.query(
    `SELECT id, slug FROM content_items
     WHERE artwork_url IS NULL AND source = 'wordpress'
     ORDER BY published_at DESC
     LIMIT $1`,
    [BATCH_SIZE],
  );
  if (rows.length === 0) return { updated: 0, skipped: 0 };

  let updated = 0;
  let skipped = 0;

  await pMap(rows, async (row) => {
    try {
      const imageUrl = await fetchFeaturedImageBySlug(row.slug);
      if (!imageUrl) { skipped++; return; }
      if (!DRY_RUN) {
        await pool.query(
          "UPDATE content_items SET artwork_url = $1 WHERE id = $2",
          [imageUrl, row.id],
        );
      }
      updated++;
    } catch {
      skipped++;
    }
  }, CONCURRENCY);

  return { updated, skipped };
}

async function main() {
  const initial = await countRemaining();
  console.log(
    `Artwork backfill starting — ${initial} rows need artwork` +
      (DRY_RUN ? " [DRY RUN]" : ""),
  );

  if (initial === 0) {
    console.log("All episodes already have artwork. Nothing to do.");
    await pool.end();
    return;
  }

  let totalUpdated = 0;
  let totalSkipped = 0;
  let batchNum = 0;

  while (true) {
    batchNum++;
    const { updated, skipped } = await runBatch();
    totalUpdated += updated;
    totalSkipped += skipped;

    const remaining = await countRemaining();
    console.log(
      `Batch ${batchNum}: +${updated} updated, ${skipped} no-image` +
        ` — ${remaining} remaining (${totalUpdated} total updated)`,
    );

    if (remaining === 0) break;

    // If we updated nothing and skipped everything, WP has no images for
    // the remaining slugs — stop to avoid an infinite loop.
    if (updated === 0) {
      console.log(
        "No images found in this batch. WordPress likely has no featured" +
          " images for the remaining slugs. Stopping.",
      );
      break;
    }
  }

  const finalRemaining = await countRemaining();
  console.log(
    `\nDone. Updated: ${totalUpdated}, Skipped: ${totalSkipped}, Still null: ${finalRemaining}` +
      (DRY_RUN ? " [DRY RUN — no DB writes]" : ""),
  );

  await pool.end();
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  pool.end().catch(() => {});
  process.exit(1);
});
