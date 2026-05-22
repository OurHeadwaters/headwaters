import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { TRANSFORMATIONS, transformationBySlug } from "../lib/transformations";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function safeInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

function esc(s: string) {
  return s.replace(/'/g, "''");
}

function transformationWhereFragment(tags: string[], categories: string[]): string {
  const parts: string[] = [];
  if (tags.length) {
    const tagList = tags.map((t) => `'${esc(t)}'`).join(",");
    parts.push(
      `EXISTS (SELECT 1 FROM jsonb_array_elements_text(tags) t WHERE lower(t.value) IN (${tagList.toLowerCase()}))`,
    );
  }
  if (categories.length) {
    const catList = categories.map((c) => `'${esc(c)}'`).join(",");
    parts.push(
      `EXISTS (SELECT 1 FROM jsonb_array_elements_text(categories) c WHERE c.value IN (${catList}))`,
    );
  }
  return parts.length ? `(${parts.join(" OR ")})` : "true";
}

/**
 * GET /api/transformations
 * Returns the full Codetry transformation registry.
 */
router.get("/transformations", (_req, res) => {
  try {
    res.json(TRANSFORMATIONS);
  } catch (err) {
    logger.error({ err }, "transformations list failed");
    res.status(500).json({ error: "Failed to load transformations" });
  }
});

/**
 * GET /api/transformations/:slug
 * Returns a single transformation by slug.
 */
router.get("/transformations/:slug", (req, res) => {
  try {
    const transformation = transformationBySlug(req.params.slug);
    if (!transformation) {
      res.status(404).json({ error: "Transformation not found" });
      return;
    }
    res.json(transformation);
  } catch (err) {
    logger.error({ err }, "transformation detail failed");
    res.status(500).json({ error: "Failed to load transformation" });
  }
});

/**
 * GET /api/transformations/:slug/episodes
 * Returns paginated episodes from content_items for a transformation path.
 * Each item includes a numeric `id` for use with the track-progress API.
 */
router.get("/transformations/:slug/episodes", async (req, res) => {
  try {
    const transformation = transformationBySlug(req.params.slug);
    if (!transformation) {
      res.status(404).json({ error: "Transformation not found" });
      return;
    }

    const limit = safeInt(req.query.limit, 20, 1, 100);
    const offset = safeInt(req.query.offset, 0, 0, 100_000);

    const whereFragment = transformationWhereFragment(
      transformation.tags,
      transformation.categories,
    );

    const [rows, countRow] = await Promise.all([
      db.execute(sql.raw(`
        SELECT
          id, source, kind, slug, title, link, summary,
          published_at, episode_number, duration_seconds, audio_url,
          audio_type, artwork_url, categories, tags
        FROM content_items
        WHERE ${whereFragment}
        ORDER BY published_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `)),
      db.execute(sql.raw(`
        SELECT count(*)::int AS count
        FROM content_items
        WHERE ${whereFragment}
      `)),
    ]);

    type Row = {
      id: number;
      source: string;
      kind: string;
      slug: string;
      title: string;
      link: string;
      summary: string | null;
      published_at: string;
      episode_number: number | null;
      duration_seconds: number | null;
      audio_url: string | null;
      audio_type: string | null;
      artwork_url: string | null;
      categories: string[];
      tags: string[];
    };

    const items = (rows.rows as Row[]).map((r) => ({
      id: r.id,
      source: r.source,
      kind: r.kind,
      slug: r.slug,
      title: r.title,
      link: r.link,
      summary: r.summary,
      pubDate: new Date(r.published_at).toISOString(),
      episodeNumber: r.episode_number,
      durationSeconds: r.duration_seconds,
      audioUrl: r.audio_url,
      audioType: r.audio_type,
      artworkUrl: r.artwork_url,
      categories: r.categories,
      tags: r.tags,
    }));

    const total = (countRow.rows[0] as { count: number }).count;

    res.json({ items, total, limit, offset });
  } catch (err) {
    logger.error({ err }, "transformation episodes failed");
    res.status(500).json({ error: "Failed to load transformation episodes" });
  }
});

export default router;
