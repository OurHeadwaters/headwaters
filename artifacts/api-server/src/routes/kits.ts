/**
 * Kit routes — kit registry API.
 *
 * GET /api/kits          — all 7 kits (metadata only)
 * GET /api/kits/:slug    — single kit with its full content bundle:
 *                          transformation/track metadata + curated episodes + matched gear
 */

import { Router, type IRouter } from "express";
import { db, reviewedProductsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { KITS, kitBySlug } from "../lib/kits";
import { transformationBySlug } from "../lib/transformations";
import { trackBySlug } from "../lib/tracks";

const router: IRouter = Router();

/* ─────────────────── Helpers ─────────────────── */

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

/**
 * Build a SQL WHERE fragment that matches content_items whose tags or
 * categories overlap with any of the provided lists.  Returns "false"
 * (matches nothing) when both lists are empty.
 */
function contentWhereFragment(tags: string[], categories: string[]): string {
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
  return parts.length ? `(${parts.join(" OR ")})` : "false";
}

/* ─────────────────── GET /api/kits ─────────────────── */

router.get("/kits", (_req, res) => {
  res.json(KITS);
});

/* ─────────────────── GET /api/kits/:slug ─────────────────── */

router.get("/kits/:slug", async (req, res) => {
  const kit = kitBySlug(req.params.slug);
  if (!kit) {
    res.status(404).json({ error: "Kit not found" });
    return;
  }

  try {
    const transformations = kit.transformationSlugs
      .map(transformationBySlug)
      .filter(Boolean);

    const tracks = kit.trackSlugs
      .map(trackBySlug)
      .filter(Boolean);

    // ── Episodes ───────────────────────────────────────────────────────────

    const allTags: string[] = [];
    const allCategories: string[] = [];

    for (const t of transformations) {
      if (t) {
        allTags.push(...t.tags);
        allCategories.push(...t.categories);
      }
    }
    for (const t of tracks) {
      if (t) {
        allTags.push(...t.tags);
        allCategories.push(...t.categories);
      }
    }

    const uniqueTags = [...new Set(allTags)];
    const uniqueCategories = [...new Set(allCategories)];

    let episodes: unknown[] = [];

    if (uniqueTags.length > 0 || uniqueCategories.length > 0) {
      const whereFragment = contentWhereFragment(uniqueTags, uniqueCategories);
      const result = await db.execute(sql.raw(`
        SELECT
          id, source, kind, slug, title, link, summary,
          published_at, episode_number, duration_seconds, audio_url,
          audio_type, artwork_url, categories, tags
        FROM content_items
        WHERE ${whereFragment}
        ORDER BY published_at DESC
        LIMIT 6
      `));

      type EpRow = {
        id: number; source: string; kind: string; slug: string;
        title: string; link: string; summary: string | null;
        published_at: string; episode_number: number | null;
        duration_seconds: number | null; audio_url: string | null;
        audio_type: string | null; artwork_url: string | null;
        categories: string[]; tags: string[];
      };

      episodes = (result.rows as EpRow[]).map((r) => ({
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
      }));
    }

    // ── Gear ───────────────────────────────────────────────────────────────

    // Build keyword filters from transformation/track tags + explicit kit gear tags
    const keywordFilters = [
      ...uniqueTags.map((s) => s.toLowerCase()),
      ...uniqueCategories.map((s) => s.toLowerCase()),
      ...kit.gearCategoryTags.map((s) => s.toLowerCase()),
    ];
    const uniqueKeywords = [...new Set(keywordFilters)];

    let gear: unknown[] = [];

    if (uniqueKeywords.length > 0) {
      const matched = await db
        .select()
        .from(reviewedProductsTable)
        .where(
          and(
            eq(reviewedProductsTable.isVisible, true),
            sql.raw(
              `(${uniqueKeywords
                .slice(0, 20)
                .map((kw) => `category_tags @> '${JSON.stringify([kw])}'::jsonb`)
                .join(" OR ")})`,
            ),
          ),
        )
        .orderBy(desc(reviewedProductsTable.importedAt))
        .limit(12);

      gear = matched;
    }

    // Fallback: return recent visible products when keyword match yields nothing
    if (gear.length === 0) {
      gear = await db
        .select()
        .from(reviewedProductsTable)
        .where(eq(reviewedProductsTable.isVisible, true))
        .orderBy(desc(reviewedProductsTable.importedAt))
        .limit(6);
    }

    res.json({
      ...kit,
      transformations,
      tracks,
      episodes,
      gear,
    });
  } catch (err) {
    logger.error({ err }, `kits: GET /${req.params.slug} failed`);
    res.status(500).json({ error: "Failed to load kit" });
  }
});

export default router;
