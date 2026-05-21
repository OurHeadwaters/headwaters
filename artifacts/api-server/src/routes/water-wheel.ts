import { Router, type IRouter, type Request, type Response } from "express";
import { db, waterWheelStateTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * GET /api/water-wheel/state
 * Returns the authenticated user's saved Water Wheel state (bucket goal + lifetime sweeps).
 */
router.get("/water-wheel/state", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [row] = await db
      .select()
      .from(waterWheelStateTable)
      .where(eq(waterWheelStateTable.userId, req.user.id))
      .limit(1);

    if (!row) {
      res.json({ bucket: "", lifetimeSweeps: 0 });
      return;
    }

    res.json({ bucket: row.bucket, lifetimeSweeps: row.lifetimeSweeps });
  } catch (err) {
    logger.error({ err }, "water-wheel: GET /state failed");
    res.status(500).json({ error: "Failed to load water wheel state" });
  }
});

/**
 * PUT /api/water-wheel/state
 * Saves the authenticated user's Water Wheel state (bucket goal + lifetime sweeps).
 * Body: { bucket?: string; lifetimeSweeps?: number }
 */
router.put("/water-wheel/state", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as Record<string, unknown>;

  const bucket =
    typeof body.bucket === "string" ? body.bucket.slice(0, 100) : undefined;

  const lifetimeSweeps =
    typeof body.lifetimeSweeps === "number" &&
    Number.isFinite(body.lifetimeSweeps) &&
    body.lifetimeSweeps >= 0
      ? Math.floor(body.lifetimeSweeps)
      : undefined;

  if (bucket === undefined && lifetimeSweeps === undefined) {
    res.status(400).json({ error: "At least one of bucket or lifetimeSweeps is required" });
    return;
  }

  try {
    const updates: Partial<typeof waterWheelStateTable.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (bucket !== undefined) updates.bucket = bucket;
    if (lifetimeSweeps !== undefined) updates.lifetimeSweeps = lifetimeSweeps;

    await db
      .insert(waterWheelStateTable)
      .values({
        userId: req.user.id,
        bucket: bucket ?? "",
        lifetimeSweeps: lifetimeSweeps ?? 0,
      })
      .onConflictDoUpdate({
        target: waterWheelStateTable.userId,
        set: updates,
      });

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "water-wheel: PUT /state failed");
    res.status(500).json({ error: "Failed to save water wheel state" });
  }
});

export default router;
