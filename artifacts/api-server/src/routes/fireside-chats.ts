import { Router, type IRouter } from "express";
import {
  db,
  firesideFlamesTable,
  firesideFlameFansTable,
  contentItemsTable,
} from "@workspace/db";
import { eq, sql, desc, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireEditor } from "../middlewares/requireEditor";

const router: IRouter = Router();

function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n !== Math.floor(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

/**
 * GET /api/fireside-flames
 * List flames with optional sort: "new" (default) or "hot".
 * Hot sort returns top 5 by fan_count first, then newest.
 * Excludes soft-deleted flames.
 */
router.get("/fireside-flames", async (req, res) => {
  try {
    const sort = req.query.sort === "hot" ? "hot" : "new";
    const limit = clampInt(req.query.limit, 1, 50, 20);
    const offset = clampInt(req.query.offset, 0, 10000, 0);

    const flames = await db
      .select({
        id: firesideFlamesTable.id,
        title: firesideFlamesTable.title,
        body: firesideFlamesTable.body,
        authorName: firesideFlamesTable.authorName,
        episodeId: firesideFlamesTable.episodeId,
        fanCount: firesideFlamesTable.fanCount,
        createdAt: firesideFlamesTable.createdAt,
        episodeTitle: contentItemsTable.title,
        episodeSlug: contentItemsTable.slug,
      })
      .from(firesideFlamesTable)
      .leftJoin(
        contentItemsTable,
        eq(firesideFlamesTable.episodeId, contentItemsTable.id),
      )
      .where(eq(firesideFlamesTable.isDeleted, false))
      .orderBy(
        sort === "hot"
          ? desc(firesideFlamesTable.fanCount)
          : desc(firesideFlamesTable.createdAt),
        desc(firesideFlamesTable.createdAt),
      )
      .limit(limit)
      .offset(offset);

    const [countRow] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(firesideFlamesTable)
      .where(eq(firesideFlamesTable.isDeleted, false));

    res.json({ flames, total: countRow?.total ?? 0, limit, offset });
  } catch (err) {
    logger.error({ err }, "fireside-flames: GET list failed");
    res.status(500).json({ error: "Failed to load flames" });
  }
});

/**
 * GET /api/fireside-flames/episodes
 * Returns lightweight Fireside Freedom episode list for the spark selector.
 */
router.get("/fireside-flames/episodes", async (_req, res) => {
  try {
    const episodes = await db
      .select({
        id: contentItemsTable.id,
        title: contentItemsTable.title,
        slug: contentItemsTable.slug,
        publishedAt: contentItemsTable.publishedAt,
      })
      .from(contentItemsTable)
      .where(eq(contentItemsTable.source, "fireside-freedom"))
      .orderBy(desc(contentItemsTable.publishedAt))
      .limit(200);

    res.json({ episodes });
  } catch (err) {
    logger.error({ err }, "fireside-flames/episodes: GET failed");
    res.status(500).json({ error: "Failed to load episodes" });
  }
});

/**
 * POST /api/fireside-flames
 * Create a new flame.
 * Body: { title, body, authorName?, episodeId? }
 */
router.post("/fireside-flames", async (req, res) => {
  try {
    const { title, body, authorName, episodeId } = req.body as {
      title?: string;
      body?: string;
      authorName?: string;
      episodeId?: number | null;
    };

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    if (!body || typeof body !== "string" || body.trim().length === 0) {
      res.status(400).json({ error: "body is required" });
      return;
    }

    const cleanTitle = title.trim().slice(0, 100);
    const cleanBody = body.trim().slice(0, 500);
    const cleanAuthor =
      authorName && typeof authorName === "string"
        ? authorName.trim().slice(0, 80) || null
        : null;
    const epId =
      episodeId != null && Number.isFinite(Number(episodeId))
        ? Number(episodeId)
        : null;

    const [flame] = await db
      .insert(firesideFlamesTable)
      .values({
        title: cleanTitle,
        body: cleanBody,
        authorName: cleanAuthor,
        episodeId: epId,
      })
      .returning();

    res.status(201).json(flame);
  } catch (err) {
    logger.error({ err }, "fireside-flames: POST failed");
    res.status(500).json({ error: "Failed to create flame" });
  }
});

/**
 * POST /api/fireside-flames/:id/fan
 * Fan a flame (increment fan_count).
 * Idempotent per sessionId (sent in body).
 * Body: { sessionId }
 */
router.post("/fireside-flames/:id/fan", async (req, res) => {
  try {
    const flameId = parseInt(req.params.id, 10);
    if (!Number.isFinite(flameId)) {
      res.status(400).json({ error: "Invalid flame id" });
      return;
    }

    const { sessionId } = req.body as { sessionId?: string };
    if (!sessionId || typeof sessionId !== "string") {
      res.status(400).json({ error: "sessionId is required" });
      return;
    }

    const [flame] = await db
      .select({ id: firesideFlamesTable.id, fanCount: firesideFlamesTable.fanCount })
      .from(firesideFlamesTable)
      .where(
        and(
          eq(firesideFlamesTable.id, flameId),
          eq(firesideFlamesTable.isDeleted, false),
        ),
      )
      .limit(1);

    if (!flame) {
      res.status(404).json({ error: "Flame not found" });
      return;
    }

    try {
      await db.insert(firesideFlameFansTable).values({ flameId, sessionId });
    } catch (insertErr) {
      const pgCode = (insertErr as { code?: string }).code;
      if (pgCode === "23505") {
        res.json({ flameId, fanCount: flame.fanCount, alreadyFanned: true });
        return;
      }
      throw insertErr;
    }

    const [updated] = await db
      .update(firesideFlamesTable)
      .set({ fanCount: sql`${firesideFlamesTable.fanCount} + 1` })
      .where(eq(firesideFlamesTable.id, flameId))
      .returning({ fanCount: firesideFlamesTable.fanCount });

    res.json({ flameId, fanCount: updated?.fanCount ?? flame.fanCount, alreadyFanned: false });
  } catch (err) {
    logger.error({ err }, "fireside-flames: POST fan failed");
    res.status(500).json({ error: "Failed to fan flame" });
  }
});

/**
 * DELETE /api/admin/fireside-flames/:id
 * Soft-delete a flame (admin only).
 */
router.delete("/admin/fireside-flames/:id", requireEditor, async (req, res) => {
  try {
    const flameId = parseInt(req.params.id, 10);
    if (!Number.isFinite(flameId)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    await db
      .update(firesideFlamesTable)
      .set({ isDeleted: true })
      .where(eq(firesideFlamesTable.id, flameId));

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "fireside-flames: admin DELETE failed");
    res.status(500).json({ error: "Failed to delete flame" });
  }
});

export default router;
