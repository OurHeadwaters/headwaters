import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { TRACKS, trackBySlug } from "../lib/tracks";
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

function trackWhereFragment(tags: string[], categories: string[]): string {
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

function trackScoreFragment(tags: string[]): string {
  if (!tags.length) return "0";
  const tagList = tags.map((t) => `'${esc(t)}'`).join(",");
  return `(SELECT count(*) FROM jsonb_array_elements_text(tags) t WHERE lower(t.value) IN (${tagList.toLowerCase()}))::int`;
}

function searchFragment(q: string): string {
  const terms = q
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const sanitized = word.replace(/[&|!():*<>\\@]/g, "").trim();
      if (!sanitized) return null;
      return `${sanitized.replace(/'/g, "''")}:*`;
    })
    .filter((t): t is string => t !== null);

  if (!terms.length) return "true";

  const tsquery = terms.join(" & ");
  return `to_tsvector('english', title || ' ' || summary || ' ' || body_text) @@ to_tsquery('english', '${tsquery}')`;
}

function tagFilterFragment(tag: string): string {
  const escaped = esc(tag.trim().toLowerCase());
  return `EXISTS (SELECT 1 FROM jsonb_array_elements_text(tags) t WHERE lower(t.value) = '${escaped}')`;
}

/**
 * GET /api/tracks
 * Returns all learning tracks with episode counts.
 */
router.get("/tracks", async (_req, res) => {
  try {
    const results = await Promise.all(
      TRACKS.map(async (track) => {
        const whereFragment = trackWhereFragment(track.tags, track.categories);

        const [countRow, sampleRows] = await Promise.all([
          db.execute(sql.raw(
            `SELECT count(*)::int AS count FROM content_items WHERE ${whereFragment}`,
          )),
          db.execute(sql.raw(
            `SELECT artwork_url FROM content_items
             WHERE ${whereFragment} AND artwork_url IS NOT NULL
             ORDER BY published_at DESC LIMIT 3`,
          )),
        ]);

        return {
          slug: track.slug,
          zoneSlug: track.zoneSlug,
          zoneNumber: track.zoneNumber,
          title: track.title,
          subtitle: track.subtitle,
          description: track.description,
          whatYouWillKnow: track.whatYouWillKnow,
          color: track.color,
          icon: track.icon,
          episodeCount: (countRow.rows[0] as { count: number }).count,
          sampleArtwork: (sampleRows.rows as { artwork_url: string | null }[])
            .map((r) => r.artwork_url)
            .filter((u): u is string => !!u),
        };
      }),
    );

    res.json(results);
  } catch (err) {
    logger.error({ err }, "tracks list failed");
    res.status(500).json({ error: "Failed to load tracks" });
  }
});

/**
 * GET /api/tracks/:slug/episodes
 * Episodes for a learning track, ordered to create a progression arc.
 * Supports ?q= for full-text search and ?tag= for sub-topic filtering.
 */
router.get("/tracks/:slug/episodes", async (req, res) => {
  try {
    const track = trackBySlug(req.params.slug);
    if (!track) {
      res.status(404).json({ error: "Track not found" });
      return;
    }

    const limit = safeInt(req.query.limit, 20, 1, 100);
    const offset = safeInt(req.query.offset, 0, 0, 100_000);

    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const tagFilter = typeof req.query.tag === "string" ? req.query.tag.trim() : "";

    const trackWhere = trackWhereFragment(track.tags, track.categories);
    const scoreFragment = trackScoreFragment(track.tags);
    const orderDir = track.order === "asc" ? "ASC" : "DESC";

    const extraClauses: string[] = [];
    if (q) extraClauses.push(searchFragment(q));
    if (tagFilter) extraClauses.push(tagFilterFragment(tagFilter));

    const whereFragment =
      extraClauses.length > 0
        ? `${trackWhere} AND ${extraClauses.join(" AND ")}`
        : trackWhere;

    const [rows, countRow, topTagsRow] = await Promise.all([
      db.execute(sql.raw(`
        SELECT
          id, source, kind, slug, title, link, summary,
          published_at, episode_number, duration_seconds, audio_url,
          audio_type, video_url, video_id, artwork_url, categories, tags,
          ${scoreFragment} AS track_score
        FROM content_items
        WHERE ${whereFragment}
        ORDER BY track_score DESC, published_at ${orderDir}
        LIMIT ${limit} OFFSET ${offset}
      `)),
      db.execute(sql.raw(`
        SELECT count(*)::int AS count
        FROM content_items
        WHERE ${whereFragment}
      `)),
      db.execute(sql.raw(`
        SELECT lower(t.value) AS tag, count(*)::int AS cnt
        FROM content_items ci,
             jsonb_array_elements_text(ci.tags) t
        WHERE ${trackWhere}
        GROUP BY lower(t.value)
        ORDER BY cnt DESC
        LIMIT 30
      `)),
    ]);

    type Row = {
      id: number; source: string; kind: string; slug: string;
      title: string; link: string; summary: string | null;
      published_at: string; episode_number: number | null;
      duration_seconds: number | null; audio_url: string | null;
      audio_type: string | null; video_url: string | null; video_id: string | null;
      artwork_url: string | null; categories: string[]; tags: string[];
      track_score: number;
    };

    const items = (rows.rows as Row[]).map((r) => ({
      id: r.id,
      source: r.source,
      kind: r.kind,
      slug: r.slug,
      title: r.title,
      link: r.link,
      summary: r.summary,
      publishedAt: new Date(r.published_at).toISOString(),
      episodeNumber: r.episode_number,
      durationSeconds: r.duration_seconds,
      audioUrl: r.audio_url,
      audioType: r.audio_type,
      videoUrl: r.video_url,
      videoId: r.video_id,
      artworkUrl: r.artwork_url,
      categories: r.categories,
      tags: r.tags,
      trackScore: r.track_score,
    }));

    const topTags = (topTagsRow.rows as { tag: string; cnt: number }[]).map((r) => r.tag);

    res.json({
      track: {
        slug: track.slug,
        zoneSlug: track.zoneSlug,
        zoneNumber: track.zoneNumber,
        title: track.title,
        subtitle: track.subtitle,
        description: track.description,
        whatYouWillKnow: track.whatYouWillKnow,
        color: track.color,
        icon: track.icon,
      },
      items,
      total: (countRow.rows[0] as { count: number }).count,
      limit,
      offset,
      topTags,
    });
  } catch (err) {
    logger.error({ err }, "track episodes failed");
    res.status(500).json({ error: "Failed to load track episodes" });
  }
});

/**
 * GET /api/tracks/:slug/next-undone?done=1,2,3,...
 * Returns the first episode in the track that is NOT in the provided done list.
 * Used by the homepage "Continue Learning" widget.
 */
router.get("/tracks/:slug/next-undone", async (req, res) => {
  try {
    const track = trackBySlug(req.params.slug);
    if (!track) {
      res.status(404).json({ error: "Track not found" });
      return;
    }

    const doneParam = typeof req.query.done === "string" ? req.query.done : "";
    const doneIds: number[] = doneParam
      ? doneParam
          .split(",")
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => Number.isFinite(n) && n > 0)
      : [];

    const whereFragment = trackWhereFragment(track.tags, track.categories);
    const scoreFragment = trackScoreFragment(track.tags);
    const orderDir = track.order === "asc" ? "ASC" : "DESC";

    const excludeFragment =
      doneIds.length > 0 ? `AND id NOT IN (${doneIds.join(",")})` : "";

    const [rowResult, totalResult] = await Promise.all([
      db.execute(sql.raw(`
        SELECT
          id, source, kind, slug, title, link, summary,
          published_at, episode_number, duration_seconds, audio_url,
          audio_type, video_url, video_id, artwork_url, categories, tags,
          ${scoreFragment} AS track_score
        FROM content_items
        WHERE ${whereFragment} ${excludeFragment}
        ORDER BY track_score DESC, published_at ${orderDir}
        LIMIT 1
      `)),
      db.execute(sql.raw(`
        SELECT count(*)::int AS count FROM content_items WHERE ${whereFragment}
      `)),
    ]);

    type Row = {
      id: number; source: string; kind: string; slug: string;
      title: string; link: string; summary: string | null;
      published_at: string; episode_number: number | null;
      duration_seconds: number | null; audio_url: string | null;
      audio_type: string | null; video_url: string | null; video_id: string | null;
      artwork_url: string | null; categories: string[]; tags: string[];
      track_score: number;
    };

    const total = (totalResult.rows[0] as { count: number }).count;
    const row = rowResult.rows[0] as Row | undefined;

    const item = row
      ? {
          id: row.id,
          source: row.source,
          kind: row.kind,
          slug: row.slug,
          title: row.title,
          link: row.link,
          summary: row.summary,
          publishedAt: new Date(row.published_at).toISOString(),
          episodeNumber: row.episode_number,
          durationSeconds: row.duration_seconds,
          audioUrl: row.audio_url,
          audioType: row.audio_type,
          videoUrl: row.video_url,
          videoId: row.video_id,
          artworkUrl: row.artwork_url,
          categories: row.categories,
          tags: row.tags,
          trackScore: row.track_score,
        }
      : null;

    res.json({
      track: {
        slug: track.slug,
        zoneSlug: track.zoneSlug,
        zoneNumber: track.zoneNumber,
        title: track.title,
        subtitle: track.subtitle,
        description: track.description,
        whatYouWillKnow: track.whatYouWillKnow,
        color: track.color,
        icon: track.icon,
      },
      item,
      total,
      doneCount: doneIds.length,
    });
  } catch (err) {
    logger.error({ err }, "track next-undone failed");
    res.status(500).json({ error: "Failed to load next undone episode" });
  }
});

export default router;
