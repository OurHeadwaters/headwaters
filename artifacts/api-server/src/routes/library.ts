import { Router, type IRouter } from "express";
import { sql, and, eq, desc, asc, ne, inArray } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db, contentItemsTable, curatedItemsTable } from "@workspace/db";
import { refreshAll, getSyncStatus } from "../lib/library";
import { invalidateTagQueryCache } from "./episodes";
import { SERIES_REGISTRY } from "../lib/series";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const ALLOWED_KINDS = new Set(["audio", "article", "video"]);

function safeInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

function parseKinds(value: string | undefined): string[] | null {
  if (!value) return null;
  const list = value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => ALLOWED_KINDS.has(s));
  return list.length > 0 ? list : null;
}

function toApiItem(row: typeof contentItemsTable.$inferSelect) {
  return {
    id: row.id,
    source: row.source,
    kind: row.kind,
    slug: row.slug,
    title: row.title,
    link: row.link,
    summary: row.summary,
    publishedAt: row.publishedAt.toISOString(),
    episodeNumber: row.episodeNumber,
    durationSeconds: row.durationSeconds,
    audioUrl: row.audioUrl,
    audioType: row.audioType,
    videoUrl: row.videoUrl,
    videoId: row.videoId,
    artworkUrl: row.artworkUrl,
    categories: row.categories,
    tags: row.tags,
  };
}

router.get("/library/search", async (req, res) => {
  try {
    const limit = safeInt(req.query.limit, 20, 1, 100);
    const offset = safeInt(req.query.offset, 0, 0, 100_000);
    const q =
      typeof req.query.q === "string" ? req.query.q.trim() : "";
    const kinds = parseKinds(
      typeof req.query.kind === "string" ? req.query.kind : undefined,
    );
    const category =
      typeof req.query.category === "string" ? req.query.category.trim() : "";
    const tag = typeof req.query.tag === "string" ? req.query.tag.trim() : "";
    const source =
      typeof req.query.source === "string" ? req.query.source.trim() : "";
    const seriesSlug =
      typeof req.query.series === "string" ? req.query.series.trim() : "";
    const sort =
      typeof req.query.sort === "string"
        ? req.query.sort.toLowerCase()
        : "newest";

    const conditions: SQL<unknown>[] = [];
    if (kinds && kinds.length > 0) {
      conditions.push(inArray(contentItemsTable.kind, kinds));
    }
    if (source) {
      conditions.push(eq(contentItemsTable.source, source));
    }
    if (category) {
      conditions.push(sql`${contentItemsTable.categories} @> ${JSON.stringify([category])}::jsonb`);
    }
    if (tag) {
      conditions.push(sql`${contentItemsTable.tags} @> ${JSON.stringify([tag])}::jsonb`);
    }
    if (seriesSlug) {
      const seriesDef = SERIES_REGISTRY.find((s) => s.slug === seriesSlug);
      if (seriesDef) {
        conditions.push(seriesDef.librarySql());
      }
    }
    let rankExpr: SQL<unknown> | null = null;
    if (q) {
      rankExpr = sql`ts_rank(to_tsvector('english', ${contentItemsTable.title} || ' ' || ${contentItemsTable.summary} || ' ' || ${contentItemsTable.bodyText}), websearch_to_tsquery('english', ${q}))`;
      conditions.push(
        sql`to_tsvector('english', ${contentItemsTable.title} || ' ' || ${contentItemsTable.summary} || ' ' || ${contentItemsTable.bodyText}) @@ websearch_to_tsquery('english', ${q})`,
      );
    }
    const whereSql = conditions.length > 0 ? and(...conditions) : undefined;

    let orderBy: SQL<unknown>[];
    if (sort === "oldest") {
      orderBy = [asc(contentItemsTable.publishedAt)];
    } else if (sort === "relevance" && rankExpr) {
      orderBy = [desc(rankExpr), desc(contentItemsTable.publishedAt)];
    } else {
      orderBy = [desc(contentItemsTable.publishedAt)];
    }

    const includeParam =
      typeof req.query.include === "string" ? req.query.include : "";
    const includeFieldNotes = includeParam
      .split(",")
      .map((s) => s.trim())
      .includes("field-notes");

    const fieldNotesPromise = includeFieldNotes
      ? (async () => {
          const fnConditions: SQL<unknown>[] = [
            eq(curatedItemsTable.published, true),
          ];
          if (q) {
            fnConditions.push(
              sql`to_tsvector('english', ${curatedItemsTable.rawContent}) @@ websearch_to_tsquery('english', ${q})`,
            );
          }
          return db
            .select()
            .from(curatedItemsTable)
            .where(and(...fnConditions))
            .orderBy(desc(curatedItemsTable.createdAt))
            .limit(8);
        })()
      : Promise.resolve(null);

    const [rows, totalRow, fieldNoteRows] = await Promise.all([
      db
        .select()
        .from(contentItemsTable)
        .where(whereSql)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(contentItemsTable)
        .where(whereSql),
      fieldNotesPromise,
    ]);

    const response: Record<string, unknown> = {
      items: rows.map(toApiItem),
      total: totalRow[0]?.count ?? 0,
      limit,
      offset,
    };

    if (fieldNoteRows !== null) {
      response.fieldNotes = fieldNoteRows.map((fn) => {
        const zoneTag = fn.tags.find((t: string) => t.startsWith("zone-"));
        const transformTag = fn.tags.find((t: string) =>
          t.startsWith("transformation-"),
        );
        const contextUrl = zoneTag
          ? `/zones/${zoneTag}`
          : transformTag
            ? `/start?transformation=${transformTag}`
            : null;
        return {
          id: fn.id,
          sourceType: fn.sourceType,
          rawContent: fn.rawContent,
          tags: fn.tags,
          createdAt: fn.createdAt.toISOString(),
          metaUrl: fn.metaUrl ?? null,
          metaTitle: fn.metaTitle ?? null,
          contextUrl,
        };
      });
    }

    res.json(response);
  } catch (err) {
    logger.error({ err }, "library search failed");
    res.status(500).json({ error: "Search failed" });
  }
});

router.get("/library/stats", async (_req, res) => {
  try {
    const [counts, byKindRows, dates, catRows, tagRows, sync] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(contentItemsTable),
      db
        .select({
          kind: contentItemsTable.kind,
          count: sql<number>`count(*)::int`,
        })
        .from(contentItemsTable)
        .groupBy(contentItemsTable.kind),
      db
        .select({
          latest: sql<string | null>`max(${contentItemsTable.publishedAt})::text`,
          earliest: sql<string | null>`min(${contentItemsTable.publishedAt})::text`,
        })
        .from(contentItemsTable),
      db.execute(sql`
        SELECT cat AS name, count(*)::int AS count
        FROM content_items, jsonb_array_elements_text(categories) AS cat
        GROUP BY cat
        ORDER BY count DESC
        LIMIT 12
      `),
      db.execute(sql`
        SELECT tag AS name, count(*)::int AS count
        FROM content_items, jsonb_array_elements_text(tags) AS tag
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 24
      `),
      getSyncStatus(),
    ]);
    res.json({
      totalItems: counts[0]?.count ?? 0,
      byKind: byKindRows.map((r) => ({ kind: r.kind, count: r.count })),
      latestPublishedAt: dates[0]?.latest
        ? new Date(dates[0].latest).toISOString()
        : null,
      earliestPublishedAt: dates[0]?.earliest
        ? new Date(dates[0].earliest).toISOString()
        : null,
      topCategories: catRows.rows as { name: string; count: number }[],
      topTags: tagRows.rows as { name: string; count: number }[],
      sync: sync.map((s) => ({
        source: s.source,
        status: s.lastRun?.status ?? "never",
        finishedAt: s.lastRun?.finishedAt
          ? s.lastRun.finishedAt.toISOString()
          : null,
        itemsSeen: s.lastRun?.itemsSeen ?? null,
        itemsUpserted: s.lastRun?.itemsUpserted ?? null,
        errorMessage: s.lastRun?.errorMessage ?? null,
      })),
    });
  } catch (err) {
    logger.error({ err }, "library stats failed");
    res.status(500).json({ error: "Stats failed" });
  }
});

router.get("/library/tags", async (req, res) => {
  try {
    const limit = safeInt(req.query.limit, 100, 1, 500);
    const result = await db.execute(sql`
      SELECT tag AS name, count(*)::int AS count
      FROM content_items, jsonb_array_elements_text(tags) AS tag
      GROUP BY tag
      ORDER BY count DESC, name ASC
      LIMIT ${limit}
    `);
    res.json(result.rows as { name: string; count: number }[]);
  } catch (err) {
    logger.error({ err }, "library tags failed");
    res.status(500).json({ error: "Tags failed" });
  }
});

router.get("/library/items/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const [row] = await db
      .select()
      .from(contentItemsTable)
      .where(eq(contentItemsTable.slug, slug))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    const firstCat = row.categories[0];
    let related: typeof contentItemsTable.$inferSelect[] = [];
    if (firstCat) {
      related = await db
        .select()
        .from(contentItemsTable)
        .where(
          and(
            sql`${contentItemsTable.categories} @> ${JSON.stringify([firstCat])}::jsonb`,
            ne(contentItemsTable.id, row.id),
          ),
        )
        .orderBy(desc(contentItemsTable.publishedAt))
        .limit(6);
    }
    res.json({
      ...toApiItem(row),
      bodyHtml: row.bodyHtml,
      related: related.map(toApiItem),
    });
  } catch (err) {
    logger.error({ err }, "library item failed");
    res.status(500).json({ error: "Item lookup failed" });
  }
});

router.post("/library/refresh", async (req, res) => {
  try {
    const force = req.query.force === "true";
    const summary = await refreshAll({ force });
    invalidateTagQueryCache();
    res.json(summary);
  } catch (err) {
    logger.error({ err }, "library refresh failed");
    res.status(500).json({ error: "Refresh failed" });
  }
});

export default router;
