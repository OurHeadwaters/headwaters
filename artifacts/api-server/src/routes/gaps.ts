import { Router, type IRouter } from "express";
import { db, contentGapSubmissionsTable } from "@workspace/db";
import { sql, eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireEditor } from "../middlewares/requireEditor";

const router: IRouter = Router();

/**
 * POST /api/gaps
 * Anonymous content gap submission.
 * No authentication required. Records the normalised query text + timestamp.
 * Body: { query: string }
 */
router.post("/gaps", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const raw = typeof body.query === "string" ? body.query.trim() : "";
    if (!raw || raw.length < 2) {
      res.status(400).json({ error: "query must be at least 2 characters" });
      return;
    }
    if (raw.length > 300) {
      res.status(400).json({ error: "query must be 300 characters or fewer" });
      return;
    }
    const queryText = raw.toLowerCase().replace(/\s+/g, " ");

    await db.insert(contentGapSubmissionsTable).values({ queryText });

    logger.info({ queryText }, "gaps: anonymous submission recorded");
    res.status(201).json({ ok: true });
  } catch (err) {
    logger.error({ err }, "gaps: POST failed");
    res.status(500).json({ error: "Failed to record submission" });
  }
});

/**
 * GET /api/admin/gaps
 * Admin view: all submitted queries grouped by normalised text,
 * sorted by submission count descending. Auth required.
 * Returns: { gaps: [{ queryText, count, lastSubmittedAt, resolved }] }
 */
router.get("/admin/gaps", requireEditor, async (_req, res) => {
  try {
    const rows = await db.execute(sql.raw(`
      SELECT
        query_text AS "queryText",
        count(*)::int AS "count",
        max(submitted_at) AS "lastSubmittedAt",
        bool_and(resolved) AS "resolved"
      FROM content_gap_submissions
      GROUP BY query_text
      ORDER BY count(*) DESC, max(submitted_at) DESC
      LIMIT 500
    `));

    res.json({ gaps: rows.rows });
  } catch (err) {
    logger.error({ err }, "gaps: GET /admin/gaps failed");
    res.status(500).json({ error: "Failed to load content gaps" });
  }
});

/**
 * PATCH /api/admin/gaps/:queryText/resolve
 * Mark all submissions for a given query as resolved (or un-resolve them).
 * Body: { resolved: boolean }
 */
router.patch("/admin/gaps/:queryText/resolve", requireEditor, async (req, res) => {
  try {
    const queryText = decodeURIComponent(req.params.queryText as string).trim().toLowerCase();
    const body = req.body as Record<string, unknown>;
    const resolved = body.resolved === true || body.resolved === "true";

    await db
      .update(contentGapSubmissionsTable)
      .set({ resolved })
      .where(eq(contentGapSubmissionsTable.queryText, queryText));

    logger.info({ queryText, resolved }, "gaps: resolved flag updated");
    res.json({ ok: true, queryText, resolved });
  } catch (err) {
    logger.error({ err }, "gaps: PATCH resolve failed");
    res.status(500).json({ error: "Failed to update resolved status" });
  }
});

export default router;
