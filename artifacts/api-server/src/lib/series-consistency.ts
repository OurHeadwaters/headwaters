import { inArray } from "drizzle-orm";
import { db, contentItemsTable } from "@workspace/db";
import { logger } from "./logger";
import { SERIES_REGISTRY } from "./series";
import type { RssEpisode } from "./rss";

type LibraryRow = typeof contentItemsTable.$inferSelect;

function rowToEpisode(row: LibraryRow): RssEpisode {
  return {
    slug: row.slug,
    guid: `${row.source}:${row.sourceId}`,
    episodeNumber: row.episodeNumber ?? null,
    title: row.title,
    link: row.link,
    pubDate: row.publishedAt.toISOString(),
    summary: row.summary,
    descriptionHtml: row.bodyHtml,
    durationSeconds: row.durationSeconds ?? null,
    audioUrl: row.audioUrl ?? null,
    audioType: row.audioType ?? null,
    artworkUrl: row.artworkUrl ?? null,
    categories: row.categories,
  };
}

/**
 * Cross-checks each series' JS `detect()` function against its SQL `librarySql()` predicate.
 *
 * For every series:
 *  1. Identify RSS episodes matched by `detect()` and look them up in the library by slug.
 *  2. Also run `librarySql()` to get the library's view of that series.
 *  3. Warn about episodes that appear in one set but not the other.
 *
 * This ensures that as the WordPress archive grows, any drift between the JS and SQL
 * predicates surfaces immediately at startup rather than silently producing wrong counts.
 */
export async function checkSeriesConsistency(
  rssEpisodes: RssEpisode[],
): Promise<void> {
  for (const series of SERIES_REGISTRY) {
    try {
      const detectSlugs = new Set(
        rssEpisodes.filter((ep) => series.detect(ep)).map((ep) => ep.slug),
      );

      let sqlSlugs = new Set<string>();
      try {
        const sqlRows = await db
          .select({ slug: contentItemsTable.slug })
          .from(contentItemsTable)
          .where(series.librarySql())
          .limit(5000);
        sqlSlugs = new Set(sqlRows.map((r) => r.slug));
      } catch (sqlErr) {
        logger.warn(
          { err: sqlErr, series: series.slug },
          "series-consistency: librarySql() query failed; skipping SQL side of check",
        );
        continue;
      }

      const detectSlugArray = [...detectSlugs];
      let libraryRowsForDetected: LibraryRow[] = [];
      if (detectSlugArray.length > 0) {
        libraryRowsForDetected = await db
          .select()
          .from(contentItemsTable)
          .where(inArray(contentItemsTable.slug, detectSlugArray))
          .limit(5000);
      }

      const missedBySql: string[] = [];
      const missedByDetect: string[] = [];

      for (const row of libraryRowsForDetected) {
        if (!sqlSlugs.has(row.slug)) {
          missedBySql.push(row.slug);
        }
      }

      const libraryDetectSlugs = new Set(
        libraryRowsForDetected.map((r) => r.slug),
      );
      for (const slug of sqlSlugs) {
        if (!libraryDetectSlugs.has(slug) && !detectSlugs.has(slug)) {
          const sqlRow = await db
            .select()
            .from(contentItemsTable)
            .where(inArray(contentItemsTable.slug, [slug]))
            .limit(1);
          if (sqlRow[0]) {
            const ep = rowToEpisode(sqlRow[0]);
            if (!series.detect(ep)) {
              missedByDetect.push(slug);
            }
          }
        }
      }

      if (missedBySql.length > 0) {
        logger.warn(
          {
            series: series.slug,
            count: missedBySql.length,
            examples: missedBySql.slice(0, 5),
          },
          "series-consistency: detect() matches these library episodes but librarySql() does NOT — SQL predicate is too narrow",
        );
      }

      if (missedByDetect.length > 0) {
        logger.warn(
          {
            series: series.slug,
            count: missedByDetect.length,
            examples: missedByDetect.slice(0, 5),
          },
          "series-consistency: librarySql() matches these library episodes but detect() does NOT — JS predicate is too narrow",
        );
      }

      if (missedBySql.length === 0 && missedByDetect.length === 0) {
        logger.info(
          {
            series: series.slug,
            sqlCount: sqlSlugs.size,
            rssDetectCount: detectSlugs.size,
            libraryOverlapChecked: libraryRowsForDetected.length,
          },
          "series-consistency: OK",
        );
      }
    } catch (err) {
      logger.warn(
        { err, series: series.slug },
        "series-consistency: check failed for series; skipping",
      );
    }
  }
}
