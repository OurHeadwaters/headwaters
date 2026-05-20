import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { ZONES, zoneBySlug, SERIES_TITLE_PATTERNS, ALL_SERIES_TAGS } from "../lib/zones";
import { SERIES_REGISTRY } from "../lib/series";
import {
  expertsForZone,
  businessesForZone,
  expertCountByZone,
  businessCountByZone,
} from "../lib/expert-council";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function safeInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

/** Escape single quotes for interpolation into sql.raw fragments */
function esc(s: string) {
  return s.replace(/'/g, "''");
}

/** Zone membership: any of the zone's tags or categories present on the item */
function zoneWhereFragment(tags: string[], categories: string[]): string {
  const parts: string[] = [];
  if (tags.length) {
    const tagList = tags.map((t) => `'${esc(t)}'`).join(",");
    parts.push(
      `EXISTS (SELECT 1 FROM jsonb_array_elements_text(tags) t WHERE t.value IN (${tagList}))`,
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

/** Exclude episodes that belong to a known series */
function seriesExclusionFragment(): string {
  const titleParts = SERIES_TITLE_PATTERNS.map(
    (p) => `title NOT ILIKE '%${esc(p)}%'`,
  ).join(" AND ");
  const tagParts = ALL_SERIES_TAGS.map(
    (t) => `NOT (tags @> '["${esc(t)}"]'::jsonb)`,
  ).join(" AND ");
  const parts = [titleParts, tagParts].filter(Boolean);
  return `(${parts.join(" AND ")})`;
}

/** Zone-tag relevance score for ordering */
function zoneScoreFragment(tags: string[]): string {
  if (!tags.length) return "0";
  const tagList = tags.map((t) => `'${esc(t)}'`).join(",");
  return `(SELECT count(*) FROM jsonb_array_elements_text(tags) t WHERE t.value IN (${tagList}))::int`;
}

/** Build a lightweight series summary from the DB for a given series */
async function buildDbSeriesSummary(seriesSlug: string) {
  const def = SERIES_REGISTRY.find((s) => s.slug === seriesSlug);
  if (!def) return null;

  const titlePattern = esc(seriesSlug === "unloose-the-goose" ? "unloose the goose" :
    seriesSlug === "13-stomps" ? "13 stomps" :
    seriesSlug === "tuesday-chats" ? "tuesday chat" :
    "history with jack");
  const tagCheck = ALL_SERIES_TAGS.includes(seriesSlug === "unloose-the-goose" ? "unloose-the-goose" : "")
    ? `OR (tags @> '["${esc(seriesSlug)}"]'::jsonb)`
    : "";

  const [countRow, artworkRow] = await Promise.all([
    db.execute(sql.raw(
      `SELECT count(*)::int AS count FROM content_items
       WHERE (title ILIKE '%${titlePattern}%' OR source = 'ulg') ${tagCheck}`,
    )),
    db.execute(sql.raw(
      `SELECT artwork_url FROM content_items
       WHERE (title ILIKE '%${titlePattern}%' OR source = 'ulg') ${tagCheck}
         AND artwork_url IS NOT NULL
       ORDER BY published_at DESC LIMIT 1`,
    )),
  ]);

  return {
    slug: def.slug,
    title: def.title,
    description: def.description,
    iconEmoji: def.iconEmoji,
    episodeCount: (countRow.rows[0] as { count: number }).count,
    sampleArtworkUrl:
      (artworkRow.rows[0] as { artwork_url?: string } | undefined)?.artwork_url ?? null,
  };
}

/**
 * GET /api/zones
 * Returns all 6 zones with item counts, sample artwork, embedded series summaries,
 * and Expert Council / ULG business counts.
 */
router.get("/zones", async (_req, res) => {
  try {
    const expertCounts = expertCountByZone();
    const businessCounts = businessCountByZone();

    const results = await Promise.all(
      ZONES.map(async (zone) => {
        const whereFragment = zoneWhereFragment(zone.tags, zone.categories);

        const [countRow, sampleRows, seriesList] = await Promise.all([
          db.execute(sql.raw(
            `SELECT count(*)::int AS count FROM content_items WHERE ${whereFragment}`,
          )),
          db.execute(sql.raw(
            `SELECT artwork_url FROM content_items
             WHERE ${whereFragment} AND artwork_url IS NOT NULL
             ORDER BY published_at DESC LIMIT 4`,
          )),
          Promise.all(zone.seriesSlugs.map(buildDbSeriesSummary)).then((list) =>
            list.filter((s) => s !== null),
          ),
        ]);

        return {
          number: zone.number,
          slug: zone.slug,
          name: zone.name,
          subtitle: zone.subtitle,
          description: zone.description,
          philosophy: zone.philosophy,
          color: zone.color,
          itemCount: (countRow.rows[0] as { count: number }).count,
          sampleArtwork: (sampleRows.rows as { artwork_url: string | null }[])
            .map((r) => r.artwork_url)
            .filter((u): u is string => !!u),
          series: seriesList,
          expertCount: expertCounts[zone.slug] ?? 0,
          businessCount: businessCounts[zone.slug] ?? 0,
        };
      }),
    );

    res.json(results);
  } catch (err) {
    logger.error({ err }, "zones list failed");
    res.status(500).json({ error: "Failed to load zones" });
  }
});

/**
 * GET /api/zones/:slug/episodes
 * Zone's top episodes sorted by zone-tag relevance, with optional series exclusion.
 */
router.get("/zones/:slug/episodes", async (req, res) => {
  try {
    const zone = zoneBySlug(req.params.slug);
    if (!zone) {
      res.status(404).json({ error: "Zone not found" });
      return;
    }

    const limit = safeInt(req.query.limit, 20, 1, 100);
    const offset = safeInt(req.query.offset, 0, 0, 100_000);
    const excludeSeries = req.query.excludeSeries !== "false";

    const whereFragment = zoneWhereFragment(zone.tags, zone.categories);
    const exclusionFragment = excludeSeries ? seriesExclusionFragment() : "true";
    const scoreFragment = zoneScoreFragment(zone.tags);

    const [rows, countRow] = await Promise.all([
      db.execute(sql.raw(`
        SELECT
          id, source, kind, slug, title, link, summary,
          published_at, episode_number, duration_seconds, audio_url,
          audio_type, video_url, video_id, artwork_url, categories, tags,
          ${scoreFragment} AS zone_score
        FROM content_items
        WHERE ${whereFragment} AND ${exclusionFragment}
        ORDER BY zone_score DESC, published_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `)),
      db.execute(sql.raw(`
        SELECT count(*)::int AS count
        FROM content_items
        WHERE ${whereFragment} AND ${exclusionFragment}
      `)),
    ]);

    type Row = {
      id: number; source: string; kind: string; slug: string;
      title: string; link: string; summary: string | null;
      published_at: string; episode_number: number | null;
      duration_seconds: number | null; audio_url: string | null;
      audio_type: string | null; video_url: string | null; video_id: string | null;
      artwork_url: string | null; categories: string[]; tags: string[];
      zone_score: number;
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
      zoneScore: r.zone_score,
    }));

    res.json({
      zone: {
        number: zone.number,
        slug: zone.slug,
        name: zone.name,
        subtitle: zone.subtitle,
        description: zone.description,
        philosophy: zone.philosophy,
        color: zone.color,
      },
      items,
      total: (countRow.rows[0] as { count: number }).count,
      limit,
      offset,
    });
  } catch (err) {
    logger.error({ err }, "zone episodes failed");
    res.status(500).json({ error: "Failed to load zone episodes" });
  }
});

/**
 * GET /api/zones/:slug/resources
 * Returns Expert Council members and ULG businesses for a zone,
 * plus a preview of zone episodes.
 */
router.get("/zones/:slug/resources", async (req, res) => {
  try {
    const zone = zoneBySlug(req.params.slug);
    if (!zone) {
      res.status(404).json({ error: "Zone not found" });
      return;
    }

    const episodeLimit = safeInt(req.query.episodeLimit, 12, 1, 50);
    const experts = expertsForZone(zone.slug);
    const businesses = businessesForZone(zone.slug);

    const whereFragment = zoneWhereFragment(zone.tags, zone.categories);
    const scoreFragment = zoneScoreFragment(zone.tags);

    const [episodeRows, countRow] = await Promise.all([
      db.execute(sql.raw(`
        SELECT
          id, source, kind, slug, title, link, summary,
          published_at, episode_number, duration_seconds, audio_url,
          audio_type, artwork_url, categories, tags,
          ${scoreFragment} AS zone_score
        FROM content_items
        WHERE ${whereFragment}
        ORDER BY zone_score DESC, published_at DESC
        LIMIT ${episodeLimit}
      `)),
      db.execute(sql.raw(`
        SELECT count(*)::int AS count FROM content_items WHERE ${whereFragment}
      `)),
    ]);

    type EpRow = {
      id: number; source: string; kind: string; slug: string;
      title: string; link: string; summary: string | null;
      published_at: string; episode_number: number | null;
      duration_seconds: number | null; audio_url: string | null;
      audio_type: string | null; artwork_url: string | null;
      categories: string[]; tags: string[]; zone_score: number;
    };

    const episodes = (episodeRows.rows as EpRow[]).map((r) => ({
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
      artworkUrl: r.artwork_url,
      categories: r.categories,
      tags: r.tags,
      zoneScore: r.zone_score,
    }));

    res.json({
      zone: {
        number: zone.number,
        slug: zone.slug,
        name: zone.name,
        subtitle: zone.subtitle,
        description: zone.description,
        philosophy: zone.philosophy,
        color: zone.color,
      },
      episodes,
      episodeTotal: (countRow.rows[0] as { count: number }).count,
      experts,
      businesses,
    });
  } catch (err) {
    logger.error({ err }, "zone resources failed");
    res.status(500).json({ error: "Failed to load zone resources" });
  }
});

export default router;
