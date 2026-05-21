import { Router, type IRouter } from "express";
import { db, wisdomNuggetsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireEditor } from "../middlewares/requireEditor";
import { TRACKS } from "../lib/tracks";

const router: IRouter = Router();

const VALID_POSITIONS = ["beginning", "middle", "end"];
const VALID_TRACK_SLUGS = new Set(TRACKS.map((t) => t.slug));

/**
 * GET /api/admin/nuggets
 * Returns all wisdom nuggets ordered by newest first.
 */
router.get("/admin/nuggets", requireEditor, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(wisdomNuggetsTable)
      .orderBy(desc(wisdomNuggetsTable.createdAt));
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "admin-nuggets: GET failed");
    res.status(500).json({ error: "Failed to load nuggets" });
  }
});

/**
 * POST /api/admin/nuggets
 * Create a new wisdom nugget.
 */
router.post("/admin/nuggets", requireEditor, async (req, res) => {
  try {
    const {
      text,
      attribution,
      trackSlug,
      trackPosition,
    } = req.body as {
      text?: string;
      attribution?: string;
      trackSlug?: string;
      trackPosition?: string;
    };

    if (!text?.trim()) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    if (trackSlug && !VALID_TRACK_SLUGS.has(trackSlug)) {
      res.status(400).json({ error: "Invalid track slug" });
      return;
    }

    if (trackPosition && !VALID_POSITIONS.includes(trackPosition)) {
      res.status(400).json({ error: "trackPosition must be beginning, middle, or end" });
      return;
    }

    if (trackPosition && !trackSlug) {
      res.status(400).json({ error: "trackSlug is required when trackPosition is set" });
      return;
    }

    const [row] = await db
      .insert(wisdomNuggetsTable)
      .values({
        text: text.trim(),
        attribution: attribution?.trim() || "Jack Spirko",
        trackSlug: trackSlug || null,
        trackPosition: trackPosition || null,
      })
      .returning();

    res.status(201).json(row);
  } catch (err) {
    logger.error({ err }, "admin-nuggets: POST failed");
    res.status(500).json({ error: "Failed to create nugget" });
  }
});

/**
 * PATCH /api/admin/nuggets/:id
 * Update an existing nugget.
 */
router.patch("/admin/nuggets/:id", requireEditor, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid nugget id" });
      return;
    }

    const {
      text,
      attribution,
      trackSlug,
      trackPosition,
    } = req.body as {
      text?: string;
      attribution?: string;
      trackSlug?: string | null;
      trackPosition?: string | null;
    };

    if (text !== undefined && !text.trim()) {
      res.status(400).json({ error: "text cannot be empty" });
      return;
    }

    if (trackSlug && !VALID_TRACK_SLUGS.has(trackSlug)) {
      res.status(400).json({ error: "Invalid track slug" });
      return;
    }

    if (trackPosition && !VALID_POSITIONS.includes(trackPosition)) {
      res.status(400).json({ error: "trackPosition must be beginning, middle, or end" });
      return;
    }

    const clearingSlug = "trackSlug" in req.body && !trackSlug;
    const settingPosition = "trackPosition" in req.body && !!trackPosition;

    if (settingPosition && !trackSlug && !("trackSlug" in req.body)) {
      res.status(400).json({ error: "trackSlug is required when trackPosition is set" });
      return;
    }

    if (settingPosition && clearingSlug) {
      res.status(400).json({ error: "Cannot set trackPosition while clearing trackSlug" });
      return;
    }

    const updates: Partial<typeof wisdomNuggetsTable.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (text !== undefined) updates.text = text.trim();
    if (attribution !== undefined) updates.attribution = attribution?.trim() || "Jack Spirko";
    if ("trackSlug" in req.body) {
      updates.trackSlug = trackSlug || null;
      if (clearingSlug) updates.trackPosition = null;
    }
    if ("trackPosition" in req.body) updates.trackPosition = trackPosition || null;

    const [row] = await db
      .update(wisdomNuggetsTable)
      .set(updates)
      .where(eq(wisdomNuggetsTable.id, id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Nugget not found" });
      return;
    }

    res.json(row);
  } catch (err) {
    logger.error({ err }, "admin-nuggets: PATCH failed");
    res.status(500).json({ error: "Failed to update nugget" });
  }
});

/**
 * DELETE /api/admin/nuggets/:id
 * Delete a nugget.
 */
router.delete("/admin/nuggets/:id", requireEditor, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid nugget id" });
      return;
    }

    await db.delete(wisdomNuggetsTable).where(eq(wisdomNuggetsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "admin-nuggets: DELETE failed");
    res.status(500).json({ error: "Failed to delete nugget" });
  }
});

export default router;
