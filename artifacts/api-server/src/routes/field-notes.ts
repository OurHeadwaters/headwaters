/**
 * GET /api/field-notes
 *
 * Query params (all optional, combined with OR when multiple are present):
 *   ?zone=:slug           — items whose tags array includes the zone slug
 *   ?transformation=:slug — items whose tags array includes the transformation slug
 *   ?episode=:slug        — resolves episode categories → ALL matching zone + transformation
 *                           slugs, then returns items tagged with ANY of them
 *
 * Multiple params are combined as OR (e.g. ?zone=zone-2&transformation=conventional-to-regenerative
 * returns items that have either tag).
 *
 * Returns up to 10 published items, sorted newest first.
 * Returns [] when no filter resolves to any slugs.
 */

import { Router, type IRouter } from "express";
import { db, curatedItemsTable, contentItemsTable } from "@workspace/db";
import { desc, eq, and, or, sql } from "drizzle-orm";
import { ZONES } from "../lib/zones";
import { TRANSFORMATIONS } from "../lib/transformations";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * Resolve episode categories to all matching zone and transformation slugs.
 * A zone matches if any of its keyword tags appears in the episode's categories.
 * A transformation matches if any of its keyword tags appears in the episode's categories.
 */
async function episodeToSlugs(episodeSlug: string): Promise<string[]> {
  const rows = await db
    .select({ categories: contentItemsTable.categories })
    .from(contentItemsTable)
    .where(eq(contentItemsTable.slug, episodeSlug))
    .limit(1);

  if (rows.length === 0) return [];

  const cats = (rows[0].categories ?? []).map((c: string) => c.toLowerCase());
  const slugs: string[] = [];

  for (const zone of ZONES) {
    const zTags = zone.tags.map((t) => t.toLowerCase());
    if (cats.some((c) => zTags.includes(c))) {
      if (!slugs.includes(zone.slug)) slugs.push(zone.slug);
    }
  }

  for (const t of TRANSFORMATIONS) {
    const tTags = t.tags.map((tag) => tag.toLowerCase());
    if (cats.some((c) => tTags.includes(c))) {
      if (!slugs.includes(t.slug)) slugs.push(t.slug);
    }
  }

  return slugs;
}

router.get("/field-notes", async (req, res) => {
  try {
    const { zone, transformation, episode, source } = req.query as Record<
      string,
      string | undefined
    >;

    const slugs: string[] = [];

    if (zone) slugs.push(zone);
    if (transformation) slugs.push(transformation);

    if (episode) {
      const epSlugs = await episodeToSlugs(episode);
      for (const s of epSlugs) {
        if (!slugs.includes(s)) slugs.push(s);
      }
    }

    if (slugs.length === 0) {
      res.json([]);
      return;
    }

    const tagConditions = slugs.map(
      (slug) =>
        sql`${curatedItemsTable.tags} @> ${JSON.stringify([slug])}::jsonb`,
    );

    const validSources = ["youtube", "nostr", "audio"];
    const sourceFilter =
      source && validSources.includes(source)
        ? eq(curatedItemsTable.sourceType, source)
        : undefined;

    const items = await db
      .select()
      .from(curatedItemsTable)
      .where(
        and(
          eq(curatedItemsTable.published, true),
          or(...tagConditions),
          sourceFilter,
        ),
      )
      .orderBy(desc(curatedItemsTable.createdAt))
      .limit(10);

    res.json(items);
  } catch (err) {
    logger.error({ err }, "field-notes: GET /field-notes failed");
    res.status(500).json({ error: "Failed to load field notes" });
  }
});

export default router;
