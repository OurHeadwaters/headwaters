import { inArray } from "drizzle-orm";
import { db, contentItemsTable } from "@workspace/db";
import { logger } from "./logger";
import { SERIES_REGISTRY } from "./series";
import type { RssEpisode } from "./rss";

export type SeriesConsistencyStatus = {
  slug: string;
  title: string;
  status: "ok" | "warning";
  rssDetectCount: number;
  sqlCount: number;
  missedBySql: string[];
  missedByDetect: string[];
};

export type ConsistencyReport = {
  checkedAt: string;
  allOk: boolean;
  series: SeriesConsistencyStatus[];
};

let cachedReport: ConsistencyReport | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getSeriesConsistencyReport(
  rssEpisodes: RssEpisode[],
  { forceRefresh = false } = {},
): Promise<ConsistencyReport> {
  const now = Date.now();
  if (!forceRefresh && cachedReport && now < cacheExpiresAt) {
    return cachedReport;
  }

  const series: SeriesConsistencyStatus[] = [];

  for (const seriesDef of SERIES_REGISTRY) {
    try {
      const detectSlugs = new Set(
        rssEpisodes.filter((ep) => seriesDef.detect(ep)).map((ep) => ep.slug),
      );

      let sqlSlugs = new Set<string>();
      try {
        const sqlRows = await db
          .select({ slug: contentItemsTable.slug })
          .from(contentItemsTable)
          .where(seriesDef.librarySql())
          .limit(5000);
        sqlSlugs = new Set(sqlRows.map((r) => r.slug));
      } catch (sqlErr) {
        logger.warn(
          { err: sqlErr, series: seriesDef.slug },
          "series-consistency: librarySql() query failed; skipping SQL side of check",
        );
        series.push({
          slug: seriesDef.slug,
          title: seriesDef.title,
          status: "warning",
          rssDetectCount: detectSlugs.size,
          sqlCount: 0,
          missedBySql: [],
          missedByDetect: ["(sql query failed)"],
        });
        continue;
      }

      const detectSlugArray = [...detectSlugs];
      let libraryRowsForDetected: { slug: string }[] = [];
      if (detectSlugArray.length > 0) {
        libraryRowsForDetected = await db
          .select({ slug: contentItemsTable.slug })
          .from(contentItemsTable)
          .where(inArray(contentItemsTable.slug, detectSlugArray))
          .limit(5000);
      }

      const missedBySql: string[] = [];
      const missedByDetect: string[] = [];

      const libraryDetectSlugs = new Set(libraryRowsForDetected.map((r) => r.slug));

      for (const row of libraryRowsForDetected) {
        if (!sqlSlugs.has(row.slug)) {
          missedBySql.push(row.slug);
        }
      }

      for (const slug of sqlSlugs) {
        if (!libraryDetectSlugs.has(slug) && !detectSlugs.has(slug)) {
          const sqlRow = await db
            .select({ slug: contentItemsTable.slug, title: contentItemsTable.title, summary: contentItemsTable.summary, bodyHtml: contentItemsTable.bodyHtml, categories: contentItemsTable.categories })
            .from(contentItemsTable)
            .where(inArray(contentItemsTable.slug, [slug]))
            .limit(1);
          if (sqlRow[0]) {
            const ep: RssEpisode = {
              slug: sqlRow[0].slug,
              guid: sqlRow[0].slug,
              episodeNumber: null,
              title: sqlRow[0].title,
              link: "",
              pubDate: "",
              summary: sqlRow[0].summary,
              descriptionHtml: sqlRow[0].bodyHtml,
              durationSeconds: null,
              audioUrl: null,
              audioType: null,
              artworkUrl: null,
              categories: sqlRow[0].categories,
            };
            if (!seriesDef.detect(ep)) {
              missedByDetect.push(slug);
            }
          }
        }
      }

      series.push({
        slug: seriesDef.slug,
        title: seriesDef.title,
        status: missedBySql.length > 0 || missedByDetect.length > 0 ? "warning" : "ok",
        rssDetectCount: detectSlugs.size,
        sqlCount: sqlSlugs.size,
        missedBySql,
        missedByDetect,
      });
    } catch (err) {
      logger.warn(
        { err, series: seriesDef.slug },
        "series-consistency: check failed for series; skipping",
      );
      series.push({
        slug: seriesDef.slug,
        title: seriesDef.title,
        status: "warning",
        rssDetectCount: 0,
        sqlCount: 0,
        missedBySql: [],
        missedByDetect: ["(check threw an error)"],
      });
    }
  }

  const report: ConsistencyReport = {
    checkedAt: new Date().toISOString(),
    allOk: series.every((s) => s.status === "ok"),
    series,
  };

  cachedReport = report;
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;

  return report;
}

/**
 * Pre-flight guard: verifies that every SeriesDefinition in SERIES_REGISTRY has a
 * non-trivially-empty librarySql() predicate.
 *
 * A stub predicate — one that returns sql`()`, sql`(true)`, or any expression
 * whose drizzle queryChunks contain only a single plain-string fragment — will
 * silently produce wrong episode counts.  This check catches that class of mistake
 * at startup, before the consistency check runs.
 *
 * Detection strategy:
 *   The drizzle `sql` tagged template stores its pieces in an internal `queryChunks`
 *   array.  A real predicate always has multiple chunks (alternating string literals
 *   and column/value references).  A stub like sql`()` or sql`(true)` collapses to a
 *   single string chunk with no column references.  Checking chunk count > 1 is a
 *   reliable, low-coupling heuristic.
 */
export function validateSeriesRegistry(): void {
  const stubs: string[] = [];

  for (const series of SERIES_REGISTRY) {
    let sqlExpr: ReturnType<typeof series.librarySql>;
    try {
      sqlExpr = series.librarySql();
    } catch (err) {
      stubs.push(series.slug);
      logger.warn(
        { series: series.slug, err },
        "series-preflight: librarySql() threw — predicate is broken or a stub",
      );
      continue;
    }

    // drizzle SQL objects carry their fragments in `queryChunks`.
    // Access it defensively so this guard survives a drizzle internal-API change.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chunks: unknown[] | undefined = (sqlExpr as any)?.queryChunks;

    const isStub =
      !chunks ||
      chunks.length === 0 ||
      // Single-chunk means only a bare string literal with no column references —
      // the hallmark of a placeholder like sql`()` or sql`(true)`.
      (chunks.length === 1 && typeof chunks[0] === "string");

    if (isStub) {
      stubs.push(series.slug);
      logger.warn(
        { series: series.slug },
        "series-preflight: librarySql() looks like a stub (no column references) — episode counts will be wrong",
      );
    }
  }

  if (stubs.length > 0) {
    logger.warn(
      { series: stubs, count: stubs.length },
      "series-preflight: one or more series definitions are missing a real SQL predicate — fix librarySql() for each listed series",
    );
  } else {
    logger.info(
      { seriesCount: SERIES_REGISTRY.length },
      "series-preflight: all series definitions have non-stub SQL predicates — OK",
    );
  }
}

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
