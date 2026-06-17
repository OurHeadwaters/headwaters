/**
 * Standalone artwork backfill runner.
 *
 * Iterates over every content_items row where source = 'wordpress' and
 * artwork_url IS NULL, fetches the WordPress featured image for each slug,
 * and writes the URL back to the DB.  Runs in batches with configurable
 * concurrency until no rows remain.
 *
 * Usage (from the api-server package root):
 *   pnpm tsx scripts/run-artwork-backfill.ts
 *   pnpm tsx scripts/run-artwork-backfill.ts --dry
 *   BATCH_SIZE=200 pnpm tsx scripts/run-artwork-backfill.ts
 */

import { db, contentItemsTable } from "@workspace/db";
import { sql, eq, and, isNull } from "drizzle-orm";
import { fetchFeaturedImageBySlug } from "../src/lib/sources/wordpress.js";
import { pMap } from "../src/lib/id3-chapters.js";

const BATCH_SIZE = Number(process.env["BATCH_SIZE"] ?? 200);
const CONCURRENCY = 6;
const DRY_RUN = process.argv.includes("--dry");

async function countRemaining(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contentItemsTable)
    .where(
      and(
        isNull(contentItemsTable.artworkUrl),
        eq(contentItemsTable.source, "wordpress"),
      ),
    );
  return row?.count ?? 0;
}

async function runBatch(): Promise<{ updated: number; skipped: number }> {
  const rows = await db
    .select({ id: contentItemsTable.id, slug: contentItemsTable.slug })
    .from(contentItemsTable)
    .where(
      and(
        isNull(contentItemsTable.artworkUrl),
        eq(contentItemsTable.source, "wordpress"),
      ),
    )
    .orderBy(sql`${contentItemsTable.publishedAt} DESC`)
    .limit(BATCH_SIZE);

  if (rows.length === 0) return { updated: 0, skipped: 0 };

  let updated = 0;
  let skipped = 0;

  await pMap(
    rows,
    async (row) => {
      try {
        const imageUrl = await fetchFeaturedImageBySlug(row.slug);
        if (!imageUrl) {
          skipped += 1;
          return;
        }
        if (!DRY_RUN) {
          await db
            .update(contentItemsTable)
            .set({ artworkUrl: imageUrl })
            .where(eq(contentItemsTable.id, row.id));
        }
        updated += 1;
      } catch {
        skipped += 1;
      }
    },
    CONCURRENCY,
  );

  return { updated, skipped };
}

async function main() {
  const initial = await countRemaining();
  console.log(
    `Artwork backfill starting — ${initial} rows need artwork` +
      (DRY_RUN ? " [DRY RUN]" : ""),
  );

  if (initial === 0) {
    console.log("Nothing to do.");
    process.exit(0);
  }

  let totalUpdated = 0;
  let totalSkipped = 0;
  let batchNum = 0;

  while (true) {
    batchNum += 1;
    const { updated, skipped } = await runBatch();
    totalUpdated += updated;
    totalSkipped += skipped;

    const remaining = await countRemaining();
    console.log(
      `Batch ${batchNum}: +${updated} updated, ${skipped} skipped` +
        ` — ${remaining} remaining (${totalUpdated} total updated so far)`,
    );

    if (remaining === 0 || (updated === 0 && skipped === 0)) {
      break;
    }

    if (updated === 0 && skipped > 0) {
      console.log(
        "No images found for any row in this batch — WordPress may not have" +
          " featured images for remaining slugs. Stopping.",
      );
      break;
    }
  }

  const finalRemaining = await countRemaining();
  console.log(
    `\nDone. Updated: ${totalUpdated}, Skipped: ${totalSkipped},` +
      ` Still null: ${finalRemaining}` +
      (DRY_RUN ? " [DRY RUN — no DB writes]" : ""),
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
