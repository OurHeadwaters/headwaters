import { Router, type IRouter, type Request, type Response } from "express";
import { db, userTrackProgressTable } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { requireBrigade } from "../middlewares/requireBrigade";

const router: IRouter = Router();

router.get("/track-progress", requireBrigade, async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;

  const rows = await db
    .select({
      trackSlug: userTrackProgressTable.trackSlug,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(userTrackProgressTable)
    .where(eq(userTrackProgressTable.userId, userId))
    .groupBy(userTrackProgressTable.trackSlug);

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.trackSlug] = row.count;
  }

  res.json({ counts });
});

router.get("/track-progress/:slug", requireBrigade, async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const slug = req.params.slug as string;
  const userId = req.user.id;

  const rows = await db
    .select({ episodeId: userTrackProgressTable.episodeId })
    .from(userTrackProgressTable)
    .where(
      and(
        eq(userTrackProgressTable.userId, userId),
        eq(userTrackProgressTable.trackSlug, slug),
      ),
    );

  res.json({ doneIds: rows.map((r) => r.episodeId) });
});

router.patch("/track-progress/:slug", requireBrigade, async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const slug = req.params.slug as string;
  const userId = req.user.id;
  const { episodeId, done } = req.body as { episodeId: number; done: boolean };

  if (typeof episodeId !== "number" || typeof done !== "boolean") {
    res.status(400).json({ error: "episodeId (number) and done (boolean) are required" });
    return;
  }

  if (done) {
    await db
      .insert(userTrackProgressTable)
      .values({ userId, trackSlug: slug, episodeId })
      .onConflictDoNothing();
  } else {
    await db
      .delete(userTrackProgressTable)
      .where(
        and(
          eq(userTrackProgressTable.userId, userId),
          eq(userTrackProgressTable.trackSlug, slug),
          eq(userTrackProgressTable.episodeId, episodeId),
        ),
      );
  }

  res.json({ success: true });
});

router.post("/track-progress/:slug/merge", requireBrigade, async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const slug = req.params.slug as string;
  const userId = req.user.id;
  const { episodeIds } = req.body as { episodeIds: number[] };

  if (!Array.isArray(episodeIds) || episodeIds.some((id) => typeof id !== "number")) {
    res.status(400).json({ error: "episodeIds must be an array of numbers" });
    return;
  }

  if (episodeIds.length > 0) {
    await db
      .insert(userTrackProgressTable)
      .values(episodeIds.map((episodeId) => ({ userId, trackSlug: slug, episodeId })))
      .onConflictDoNothing();
  }

  res.json({ success: true });
});

export default router;
