/**
 * Share events — lightweight word-of-mouth analytics.
 *
 * POST /api/shares               — record a share (surface + slug, no PII)
 * GET  /api/admin/shares         — aggregated share counts for the dashboard
 */

import { createHash } from "crypto";
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireEditor } from "../middlewares/requireEditor";

const router: IRouter = Router();

const VALID_SURFACES = new Set(["kit", "track", "transform"]);

const DEDUP_WINDOW_SECONDS = 60;

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

function getClientIp(req: import("express").Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

async function ensureShareEventsTable(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS share_events (
      id         SERIAL PRIMARY KEY,
      surface    TEXT NOT NULL,
      slug       TEXT NOT NULL,
      ip_hash    TEXT NOT NULL DEFAULT '',
      shared_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    ALTER TABLE share_events ADD COLUMN IF NOT EXISTS ip_hash TEXT NOT NULL DEFAULT ''
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS share_events_surface_slug_idx
    ON share_events (surface, slug)
  `);
  /*
   * Partial functional unique index that provides atomic deduplication.
   *
   * The expression (floor(extract(epoch from shared_at) / 60)::bigint) bins
   * each row into a 60-second bucket.  INSERT … ON CONFLICT DO NOTHING then
   * becomes the sole write path — no separate SELECT is needed and there is
   * no race window between check and insert.
   *
   * WHERE ip_hash <> '' makes this a partial index so it only covers new rows
   * (which always carry a real hash).  Legacy rows that were recorded before
   * the ip_hash column existed carry the default value '' and are excluded,
   * which prevents CREATE UNIQUE INDEX from failing due to historical
   * duplicates in those rows.
   */
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS share_events_dedup_uniq
    ON share_events (
      surface,
      slug,
      ip_hash,
      (floor(extract(epoch from shared_at) / ${DEDUP_WINDOW_SECONDS})::bigint)
    )
    WHERE ip_hash <> ''
  `);
}

let tableReady = false;

async function withTable<T>(fn: () => Promise<T>): Promise<T> {
  if (!tableReady) {
    await ensureShareEventsTable();
    tableReady = true;
  }
  return fn();
}

/* ─── POST /api/shares ─── */

router.post("/shares", async (req, res) => {
  const { surface, slug } = req.body ?? {};

  if (typeof surface !== "string" || !VALID_SURFACES.has(surface)) {
    res.status(400).json({ error: "Invalid surface. Must be kit, track, or transform." });
    return;
  }
  if (typeof slug !== "string" || !slug.trim()) {
    res.status(400).json({ error: "slug is required." });
    return;
  }

  const ipHash = hashIp(getClientIp(req));
  const cleanSlug = slug.trim();

  try {
    await withTable(async () => {
      /*
       * Atomic dedup: the unique index on (surface, slug, ip_hash, time-bucket)
       * means a concurrent duplicate simply conflicts and is silently dropped.
       * No SELECT is needed — there is no race window.
       */
      await db.execute(sql`
        INSERT INTO share_events (surface, slug, ip_hash)
        VALUES (${surface}, ${cleanSlug}, ${ipHash})
        ON CONFLICT DO NOTHING
      `);
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    logger.error({ err }, "shares: POST failed");
    res.status(500).json({ error: "Failed to record share." });
  }
});

/* ─── GET /api/shares ─── (public — count only) */

router.get("/shares", async (req, res) => {
  const { surface, slug } = req.query as Record<string, string>;

  if (typeof surface !== "string" || !VALID_SURFACES.has(surface)) {
    res.status(400).json({ error: "Invalid surface. Must be kit, track, or transform." });
    return;
  }
  if (typeof slug !== "string" || !slug.trim()) {
    res.status(400).json({ error: "slug is required." });
    return;
  }

  try {
    const result = await withTable(async () => {
      return db.execute(
        sql`SELECT COUNT(*)::int AS share_count FROM share_events WHERE surface = ${surface} AND slug = ${slug.trim()}`,
      );
    });
    const count = ((result as any).rows ?? result)[0]?.share_count ?? 0;
    res.json({ count });
  } catch (err) {
    logger.error({ err }, "shares: GET failed");
    res.status(500).json({ error: "Failed to load share count." });
  }
});

/* ─── GET /api/shares/bulk ─── (public — counts for multiple slugs) */

router.get("/shares/bulk", async (req, res) => {
  const { surface, slugs } = req.query as Record<string, string>;

  if (typeof surface !== "string" || !VALID_SURFACES.has(surface)) {
    res.status(400).json({ error: "Invalid surface. Must be kit, track, or transform." });
    return;
  }
  if (typeof slugs !== "string" || !slugs.trim()) {
    res.status(400).json({ error: "slugs is required (comma-separated)." });
    return;
  }

  const slugList = slugs
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 100);

  if (slugList.length === 0) {
    res.json({ counts: {} });
    return;
  }

  try {
    const rows = await withTable(async () => {
      return db.execute(sql`
        SELECT slug, COUNT(*)::int AS share_count
        FROM share_events
        WHERE surface = ${surface}
          AND slug = ANY(ARRAY[${sql.join(slugList.map((s) => sql`${s}`), sql`, `)}])
        GROUP BY slug
      `);
    });

    const counts: Record<string, number> = {};
    for (const row of (rows as any).rows ?? (rows as any)) {
      counts[row.slug] = row.share_count;
    }
    res.json({ counts });
  } catch (err) {
    logger.error({ err }, "shares: GET /bulk failed");
    res.status(500).json({ error: "Failed to load share counts." });
  }
});

/* ─── GET /api/admin/shares ─── */

router.get("/admin/shares", requireEditor, async (_req, res) => {
  try {
    const rows = await withTable(async () => {
      return db.execute(sql`
        SELECT
          surface,
          slug,
          COUNT(*)::int AS share_count,
          MAX(shared_at) AS last_shared_at
        FROM share_events
        GROUP BY surface, slug
        ORDER BY share_count DESC, last_shared_at DESC
        LIMIT 200
      `);
    });

    const total = await db.execute(
      sql`SELECT COUNT(*)::int AS total FROM share_events`,
    );

    res.json({
      shares: (rows as any).rows ?? rows,
      total: ((total as any).rows ?? total)[0]?.total ?? 0,
    });
  } catch (err) {
    logger.error({ err }, "admin-shares: GET failed");
    res.status(500).json({ error: "Failed to load share stats." });
  }
});

export default router;
