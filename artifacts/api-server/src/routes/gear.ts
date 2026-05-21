/**
 * Gear routes — product shelf API and admin import trigger.
 *
 * GET  /api/gear?zone=:slug          — products matching a zone
 * GET  /api/gear?track=:slug         — products matching a track
 * GET  /api/gear?episode=:slug       — products matching an episode's tags
 * GET  /api/admin/gear               — paginated product list (admin)
 * POST /api/admin/gear/import        — trigger re-import from TSP WP
 * PUT  /api/admin/gear/:id           — edit a product's tags / visibility
 */

import { Router, type IRouter } from "express";
import { db, reviewedProductsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireEditor } from "../middlewares/requireEditor";
import { importProductReviews, type ProductInsert } from "../lib/sources/wordpress-products";
import { trackBySlug } from "../lib/tracks";
import { zoneBySlug } from "../lib/zones";

const router: IRouter = Router();

function safeInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

/* ─────────────────── Helpers ─────────────────── */

async function upsertProductBatch(items: ProductInsert[]): Promise<number> {
  if (items.length === 0) return 0;
  await db
    .insert(reviewedProductsTable)
    .values(
      items.map((item) => ({
        wpPostId: item.wpPostId,
        slug: item.slug,
        title: item.title,
        description: item.description,
        imageUrl: item.imageUrl,
        externalUrl: item.externalUrl,
        zoneTags: item.zoneTags,
        categoryTags: item.categoryTags,
        importedAt: new Date(),
        updatedAt: new Date(),
      })),
    )
    .onConflictDoUpdate({
      target: reviewedProductsTable.wpPostId,
      set: {
        slug: sql`excluded.slug`,
        title: sql`excluded.title`,
        description: sql`excluded.description`,
        imageUrl: sql`excluded.image_url`,
        externalUrl: sql`excluded.external_url`,
        zoneTags: sql`excluded.zone_tags`,
        categoryTags: sql`excluded.category_tags`,
        importedAt: sql`excluded.imported_at`,
        updatedAt: sql`excluded.updated_at`,
      },
    });
  return items.length;
}

/* ─────────────────── GET /api/gear ─────────────────── */

router.get("/gear", async (req, res) => {
  try {
    const { zone, track, episode } = req.query as Record<string, string | undefined>;
    const limit = safeInt(req.query.limit, 6, 1, 24);

    // Collect keyword filters
    let keywordFilters: string[] = [];

    if (zone) {
      const zoneDef = zoneBySlug(zone);
      if (zoneDef) {
        // Match by zone slug in zone_tags
        const rows = await db
          .select()
          .from(reviewedProductsTable)
          .where(
            and(
              eq(reviewedProductsTable.isVisible, true),
              sql`${reviewedProductsTable.zoneTags} @> ${JSON.stringify([zone])}::jsonb`,
            ),
          )
          .orderBy(desc(reviewedProductsTable.importedAt))
          .limit(limit);
        res.json(rows);
        return;
      }
    }

    if (track) {
      const trackDef = trackBySlug(track);
      if (trackDef) {
        keywordFilters = [...trackDef.tags, ...trackDef.categories].map((t) => t.toLowerCase());
      }
    }

    if (episode) {
      // Fetch the episode's categories/tags from the DB
      try {
        const result = await db.execute(
          sql`SELECT categories, tags FROM content_items WHERE slug = ${episode} LIMIT 1`,
        );
        const epRow = result.rows[0] as { categories?: string[]; tags?: string[] } | undefined;
        if (epRow) {
          const epCats = (epRow.categories ?? []).map((c: string) => c.toLowerCase());
          const epTags = (epRow.tags ?? []).map((t: string) => t.toLowerCase());
          keywordFilters = [...epCats, ...epTags];
        }
      } catch {
        // silently fallback to no keywords
      }
    }

    if (keywordFilters.length > 0) {
      const matched = await db
        .select()
        .from(reviewedProductsTable)
        .where(
          and(
            eq(reviewedProductsTable.isVisible, true),
            sql.raw(
              `(${keywordFilters
                .slice(0, 20)
                .map((kw) => `category_tags @> '${JSON.stringify([kw])}'::jsonb`)
                .join(" OR ")})`,
            ),
          ),
        )
        .orderBy(desc(reviewedProductsTable.importedAt))
        .limit(limit);
      if (matched.length > 0) {
        res.json(matched);
        return;
      }
      // No category match — fall through to recent-products fallback below
    }

    // Fallback: return most recently imported visible products
    const rows = await db
      .select()
      .from(reviewedProductsTable)
      .where(eq(reviewedProductsTable.isVisible, true))
      .orderBy(desc(reviewedProductsTable.importedAt))
      .limit(limit);
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "gear: GET failed");
    res.status(500).json({ error: "Failed to load gear" });
  }
});

/* ─────────────────── GET /api/admin/gear ─────────────────── */

router.get("/admin/gear", requireEditor, async (req, res) => {
  try {
    const limit = safeInt(req.query.limit, 50, 1, 200);
    const offset = safeInt(req.query.offset, 0, 0, 1_000_000);

    const [rows, countResult, lastImportResult] = await Promise.all([
      db
        .select()
        .from(reviewedProductsTable)
        .orderBy(desc(reviewedProductsTable.importedAt))
        .limit(limit)
        .offset(offset),
      db.execute(sql`SELECT count(*)::int AS count FROM reviewed_products`),
      db.execute(sql`SELECT max(imported_at) AS last_imported_at FROM reviewed_products`),
    ]);

    const total = (countResult.rows[0] as { count: number } | undefined)?.count ?? 0;
    const lastImportedAt =
      (lastImportResult.rows[0] as { last_imported_at?: string | null } | undefined)
        ?.last_imported_at ?? null;
    res.json({ products: rows, total, limit, offset, lastImportedAt });
  } catch (err) {
    logger.error({ err }, "admin/gear: GET failed");
    res.status(500).json({ error: "Failed to load products" });
  }
});

/* ─────────────────── POST /api/admin/gear/import ─────────────────── */

const GEAR_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

let importInflight = false;

async function runGearImport(): Promise<void> {
  if (importInflight) {
    logger.info("Gear import already in progress — skipping");
    return;
  }
  importInflight = true;
  try {
    const result = await importProductReviews({ upsertBatch: upsertProductBatch });
    logger.info(result, "Gear import complete");
  } catch (err) {
    logger.error({ err }, "Gear import failed");
  } finally {
    importInflight = false;
  }
}

/**
 * Kick off a gear import immediately on server start, then repeat every 24 h.
 * Never blocks incoming requests — fires and forgets.
 */
export function startGearSchedule(): void {
  void runGearImport();
  setInterval(() => {
    void runGearImport();
  }, GEAR_REFRESH_INTERVAL_MS).unref();
}

router.post("/admin/gear/import", requireEditor, async (_req, res) => {
  if (importInflight) {
    res.status(409).json({ error: "Import already in progress" });
    return;
  }
  importInflight = true;
  try {
    const result = await importProductReviews({
      upsertBatch: upsertProductBatch,
    });
    logger.info(result, "Product review import complete");
    res.json({
      ok: true,
      seen: result.seen,
      upserted: result.upserted,
      failedPages: result.failedPages,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "admin/gear/import failed");
    res.status(500).json({ error: msg });
  } finally {
    importInflight = false;
  }
});

/* ─────────────────── PUT /api/admin/gear/:id ─────────────────── */

router.put("/admin/gear/:id", requireEditor, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid product ID" });
      return;
    }

    const { zoneTags, categoryTags, isVisible, title, description } = req.body as {
      zoneTags?: string[];
      categoryTags?: string[];
      isVisible?: boolean;
      title?: string;
      description?: string;
    };

    const updates: Partial<{
      zoneTags: string[];
      categoryTags: string[];
      isVisible: boolean;
      title: string;
      description: string;
      updatedAt: Date;
    }> = { updatedAt: new Date() };

    if (Array.isArray(zoneTags)) updates.zoneTags = zoneTags;
    if (Array.isArray(categoryTags)) updates.categoryTags = categoryTags;
    if (typeof isVisible === "boolean") updates.isVisible = isVisible;
    if (typeof title === "string" && title.trim()) updates.title = title.trim();
    if (typeof description === "string") updates.description = description.trim();

    const [updated] = await db
      .update(reviewedProductsTable)
      .set(updates)
      .where(eq(reviewedProductsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json(updated);
  } catch (err) {
    logger.error({ err }, "admin/gear PUT failed");
    res.status(500).json({ error: "Failed to update product" });
  }
});

export default router;
