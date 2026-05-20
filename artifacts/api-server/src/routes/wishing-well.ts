import { Router, type IRouter } from "express";
import { db, wishingWellTipsTable, wishingWellDistributionsTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n !== Math.floor(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

/**
 * GET /api/wishing-well/pot/today
 * Returns today's pot statistics (tip count, total coins, draw status).
 */
router.get("/wishing-well/pot/today", async (_req, res) => {
  try {
    const date = todayUtc();
    const [potRow, drawnRow] = await Promise.all([
      db.execute(sql.raw(`
        SELECT count(*)::int AS tip_count, coalesce(sum(amount_units),0)::int AS total_units, max(currency) AS currency
        FROM wishing_well_tips
        WHERE draw_date = '${date}'
      `)),
      db.execute(sql.raw(`
        SELECT id FROM wishing_well_distributions WHERE draw_date = '${date}' LIMIT 1
      `)),
    ]);
    const row = potRow.rows[0] as { tip_count: number; total_units: number; currency: string };
    res.json({
      date,
      tipCount: row.tip_count,
      totalUnits: row.total_units,
      currency: row.currency ?? "XRP",
      drawn: (drawnRow.rows as unknown[]).length > 0,
    });
  } catch (err) {
    logger.error({ err }, "wishing-well: pot/today failed");
    res.status(500).json({ error: "Failed to load today's pot" });
  }
});

/**
 * POST /api/wishing-well/tip
 * Submit a tip (coin) with an attached wish.
 * Authentication optional — anonymous tips are allowed.
 * Body: { amountUnits, currency?, wishText, listenerName?, episodeSlug? }
 */
router.post("/wishing-well/tip", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const amountUnits = clampInt(body.amountUnits, 1, 10000, 0);
    if (amountUnits < 1) {
      res.status(400).json({ error: "amountUnits must be at least 1" });
      return;
    }

    const wishText =
      typeof body.wishText === "string" ? body.wishText.trim() : "";
    if (!wishText || wishText.length < 3) {
      res.status(400).json({ error: "wishText must be at least 3 characters" });
      return;
    }
    if (wishText.length > 280) {
      res.status(400).json({ error: "wishText must be 280 characters or fewer" });
      return;
    }

    const currency =
      typeof body.currency === "string" && body.currency.trim()
        ? body.currency.trim().toUpperCase()
        : "XRP";

    const listenerName =
      typeof body.listenerName === "string" && body.listenerName.trim()
        ? body.listenerName.trim().slice(0, 80)
        : null;

    const episodeSlug =
      typeof body.episodeSlug === "string" && body.episodeSlug.trim()
        ? body.episodeSlug.trim()
        : null;

    const listenerId = req.isAuthenticated() ? req.user.id : null;
    const resolvedName =
      listenerName ??
      (req.isAuthenticated()
        ? [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || "Anonymous"
        : "Anonymous");

    const date = todayUtc();
    const [tip] = await db
      .insert(wishingWellTipsTable)
      .values({
        amountUnits,
        currency,
        wishText,
        listenerId,
        listenerName: resolvedName,
        drawDate: date,
        episodeSlug,
        status: "pending",
      })
      .returning();

    res.status(201).json({
      id: tip.id,
      amountUnits: tip.amountUnits,
      currency: tip.currency,
      wishText: tip.wishText,
      listenerName: tip.listenerName,
      drawDate: tip.drawDate,
      episodeSlug: tip.episodeSlug,
    });
  } catch (err) {
    logger.error({ err }, "wishing-well: POST /tip failed");
    res.status(500).json({ error: "Failed to record tip" });
  }
});

/**
 * GET /api/wishing-well/board
 * Returns the public board: today's winner (if drawn) + past winners feed.
 */
router.get("/wishing-well/board", async (_req, res) => {
  try {
    const date = todayUtc();
    const rows = await db
      .select()
      .from(wishingWellDistributionsTable)
      .orderBy(desc(wishingWellDistributionsTable.drawDate))
      .limit(50);

    const todayWinner = rows.find((r) => r.drawDate === date) ?? null;
    const past = rows.filter((r) => r.drawDate !== date);

    res.json({ todayWinner, past });
  } catch (err) {
    logger.error({ err }, "wishing-well: GET /board failed");
    res.status(500).json({ error: "Failed to load wishing well board" });
  }
});

/**
 * PATCH /api/wishing-well/winner/:date/impact
 * The winning listener adds an impact note to their entry.
 * Authentication required. Must match the winner's listener ID.
 * Body: { impactNote }
 */
router.patch("/wishing-well/winner/:date/impact", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const date = req.params.date;
    const { impactNote } = req.body as { impactNote?: string };
    if (!impactNote || typeof impactNote !== "string" || !impactNote.trim()) {
      res.status(400).json({ error: "impactNote is required" });
      return;
    }
    const note = impactNote.trim().slice(0, 1000);
    const [dist] = await db
      .select()
      .from(wishingWellDistributionsTable)
      .where(eq(wishingWellDistributionsTable.drawDate, date))
      .limit(1);

    if (!dist) {
      res.status(404).json({ error: "Distribution not found" });
      return;
    }
    if (dist.winnerListenerId && dist.winnerListenerId !== req.user.id) {
      res.status(403).json({ error: "Only the winner can add an impact note" });
      return;
    }

    const [updated] = await db
      .update(wishingWellDistributionsTable)
      .set({ winnerImpactNote: note })
      .where(eq(wishingWellDistributionsTable.drawDate, date))
      .returning();
    res.json(updated);
  } catch (err) {
    logger.error({ err }, "wishing-well: PATCH winner impact failed");
    res.status(500).json({ error: "Failed to save impact note" });
  }
});

/**
 * POST /api/admin/wishing-well/draw
 * Run the daily draw for a given date (defaults to today).
 * Picks one random pending tip, computes 50/50 split, writes distribution.
 * Body: { date? } — ISO date string YYYY-MM-DD
 */
router.post("/admin/wishing-well/draw", async (req, res) => {
  try {
    const date =
      typeof req.body?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.body.date)
        ? req.body.date
        : todayUtc();

    const existing = await db
      .select({ id: wishingWellDistributionsTable.id })
      .from(wishingWellDistributionsTable)
      .where(eq(wishingWellDistributionsTable.drawDate, date))
      .limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Draw has already been run for this date" });
      return;
    }

    const potRows = await db
      .select()
      .from(wishingWellTipsTable)
      .where(
        sql`${wishingWellTipsTable.drawDate} = ${date} AND ${wishingWellTipsTable.status} = 'pending'`,
      );

    if (potRows.length === 0) {
      res.status(422).json({ error: "No pending tips in the pot for this date" });
      return;
    }

    const totalUnits = potRows.reduce((sum, t) => sum + t.amountUnits, 0);
    const winnerTip = potRows[Math.floor(Math.random() * potRows.length)];
    const creatorShareUnits = Math.floor(totalUnits / 2);
    const winnerShareUnits = totalUnits - creatorShareUnits;
    const currency = winnerTip.currency;

    await db
      .update(wishingWellTipsTable)
      .set({ status: "not_drawn" })
      .where(
        sql`${wishingWellTipsTable.drawDate} = ${date} AND ${wishingWellTipsTable.status} = 'pending'`,
      );
    await db
      .update(wishingWellTipsTable)
      .set({ status: "drawn" })
      .where(eq(wishingWellTipsTable.id, winnerTip.id));

    const [distribution] = await db
      .insert(wishingWellDistributionsTable)
      .values({
        drawDate: date,
        totalUnits,
        creatorShareUnits,
        winnerShareUnits,
        winnerTipId: winnerTip.id,
        winnerWishText: winnerTip.wishText,
        winnerListenerName: winnerTip.listenerName,
        winnerListenerId: winnerTip.listenerId ?? null,
        payoutStatus: "pending",
        currency,
      })
      .returning();

    logger.info(
      { date, winnerTipId: winnerTip.id, totalUnits },
      "wishing-well: draw complete",
    );
    res.status(201).json({ distribution });
  } catch (err) {
    logger.error({ err }, "wishing-well: draw failed");
    res.status(500).json({ error: "Draw failed" });
  }
});

/**
 * PATCH /api/admin/wishing-well/distributions/:date/payout
 * Mark a distribution's payout as sent (after manual crypto transfer).
 */
router.patch("/admin/wishing-well/distributions/:date/payout", async (req, res) => {
  try {
    const date = req.params.date;
    const [updated] = await db
      .update(wishingWellDistributionsTable)
      .set({ payoutStatus: "sent" })
      .where(eq(wishingWellDistributionsTable.drawDate, date))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Distribution not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    logger.error({ err }, "wishing-well: payout update failed");
    res.status(500).json({ error: "Failed to update payout status" });
  }
});

/**
 * GET /api/admin/wishing-well
 * Admin dashboard: all distributions + today's pending pot summary.
 */
router.get("/admin/wishing-well", async (_req, res) => {
  try {
    const date = todayUtc();
    const [distributions, potRow] = await Promise.all([
      db
        .select()
        .from(wishingWellDistributionsTable)
        .orderBy(desc(wishingWellDistributionsTable.drawDate))
        .limit(100),
      db.execute(sql.raw(`
        SELECT
          count(*)::int AS tip_count,
          coalesce(sum(amount_units), 0)::int AS total_units,
          max(currency) AS currency
        FROM wishing_well_tips
        WHERE draw_date = '${date}' AND status = 'pending'
      `)),
    ]);
    const pot = potRow.rows[0] as { tip_count: number; total_units: number; currency: string };
    res.json({
      distributions,
      todayPot: {
        date,
        tipCount: pot.tip_count,
        totalUnits: pot.total_units,
        currency: pot.currency ?? "XRP",
      },
    });
  } catch (err) {
    logger.error({ err }, "wishing-well: admin GET failed");
    res.status(500).json({ error: "Failed to load admin data" });
  }
});

export default router;
