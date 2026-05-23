import { Router, type IRouter } from "express";
import {
  db,
  wishingWellTipsTable,
  wishingWellDistributionsTable,
  wishingWellCreditsTable,
  wishStacksTable,
} from "@workspace/db";
import { eq, sql, desc, and, isNull } from "drizzle-orm";
import { logger } from "../lib/logger";
import { getUncachableStripeClient } from "../stripeClient";
import { getXrpUsdRate, getXrpRateMeta } from "../lib/xrp-rate";

const FOUNDER_MATCH_THRESHOLD = 10;

/**
 * Convert a tip's amountUnits to USD cents.
 * - fiat (stripe): 1 unit = $1.00 = 100 cents
 * - crypto (XRP): amountUnits * live XRP/USD rate * 100
 */
function tipToUsdCents(amountUnits: number, paymentMethod: string): number {
  if (paymentMethod === "stripe") {
    return amountUnits * 100;
  }
  return Math.round(amountUnits * getXrpUsdRate() * 100);
}

const router: IRouter = Router();

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n !== Math.floor(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function getBaseUrl(req: import("express").Request): string {
  const domain = (process.env.REPLIT_DOMAINS ?? "").split(",")[0];
  if (domain) return `https://${domain}`;
  return `${req.protocol}://${req.get("host") ?? "localhost"}`;
}

/**
 * GET /api/wishing-well/pot/today
 * Returns today's pot statistics including combined USD-equivalent total.
 */
router.get("/wishing-well/pot/today", async (_req, res) => {
  try {
    const date = todayUtc();
    const rate = getXrpUsdRate();
    const [potRow, drawnRow] = await Promise.all([
      db.execute(sql.raw(`
        SELECT
          count(*)::int AS tip_count,
          coalesce(sum(amount_units),0)::int AS total_units,
          max(currency) AS currency,
          coalesce(sum(
            CASE
              WHEN payment_method = 'stripe' THEN amount_units * 100
              ELSE round(amount_units * ${rate} * 100)::int
            END
          ), 0)::int AS total_usd_cents,
          count(CASE WHEN payment_method = 'stripe' THEN 1 END)::int AS fiat_count,
          count(CASE WHEN payment_method != 'stripe' THEN 1 END)::int AS crypto_count
        FROM wishing_well_tips
        WHERE draw_date = '${date}'
          AND status IN ('pending')
      `)),
      db.execute(sql.raw(`
        SELECT id FROM wishing_well_distributions WHERE draw_date = '${date}' LIMIT 1
      `)),
    ]);
    const row = potRow.rows[0] as {
      tip_count: number;
      total_units: number;
      currency: string;
      total_usd_cents: number;
      fiat_count: number;
      crypto_count: number;
    };
    res.json({
      date,
      tipCount: row.tip_count,
      totalUnits: row.total_units,
      currency: row.currency ?? "XRP",
      totalUsdCents: row.total_usd_cents,
      fiatCount: row.fiat_count,
      cryptoCount: row.crypto_count,
      xrpUsdRate: rate,
      drawn: (drawnRow.rows as unknown[]).length > 0,
    });
  } catch (err) {
    logger.error({ err }, "wishing-well: pot/today failed");
    res.status(500).json({ error: "Failed to load today's pot" });
  }
});

/**
 * GET /api/wishing-well/wishes
 * Returns all active (pending) wishes for today, sorted by stack count desc.
 */
router.get("/wishing-well/wishes", async (_req, res) => {
  try {
    const date = todayUtc();
    const wishes = await db
      .select()
      .from(wishingWellTipsTable)
      .where(
        sql`${wishingWellTipsTable.drawDate} = ${date} AND ${wishingWellTipsTable.status} = 'pending'`,
      )
      .orderBy(desc(wishingWellTipsTable.stackCount), desc(wishingWellTipsTable.createdAt));
    res.json({ date, wishes });
  } catch (err) {
    logger.error({ err }, "wishing-well: GET /wishes failed");
    res.status(500).json({ error: "Failed to load wishes" });
  }
});

/**
 * POST /api/wishing-well/stack/:tipId
 * Stack community momentum onto an existing wish.
 */
router.post("/wishing-well/stack/:tipId", async (req, res) => {
  try {
    const tipId = parseInt(req.params.tipId, 10);
    if (!Number.isFinite(tipId)) {
      res.status(400).json({ error: "Invalid tip id" });
      return;
    }
    const sessionId =
      typeof req.body?.sessionId === "string" && req.body.sessionId.trim()
        ? req.body.sessionId.trim().slice(0, 64)
        : null;
    if (!sessionId) {
      res.status(400).json({ error: "sessionId is required" });
      return;
    }

    const [tip] = await db
      .select()
      .from(wishingWellTipsTable)
      .where(
        and(
          eq(wishingWellTipsTable.id, tipId),
          eq(wishingWellTipsTable.status, "pending"),
        ),
      )
      .limit(1);

    if (!tip) {
      res.status(404).json({ error: "Wish not found or draw already complete" });
      return;
    }

    const existing = await db
      .select({ id: wishStacksTable.id })
      .from(wishStacksTable)
      .where(
        and(
          eq(wishStacksTable.tipId, tipId),
          eq(wishStacksTable.sessionId, sessionId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "You have already stacked onto this wish", alreadyStacked: true });
      return;
    }

    const listenerId = req.isAuthenticated() ? req.user.id : null;
    await db.insert(wishStacksTable).values({ tipId, sessionId, listenerId: listenerId ?? undefined });

    const newCount = tip.stackCount + 1;
    const founderMatchTriggered = newCount >= FOUNDER_MATCH_THRESHOLD;

    const [updated] = await db
      .update(wishingWellTipsTable)
      .set({ stackCount: newCount, founderMatchTriggered })
      .where(eq(wishingWellTipsTable.id, tipId))
      .returning();

    if (founderMatchTriggered && !tip.founderMatchTriggered) {
      logger.info({ tipId, stackCount: newCount }, "wishing-well: founder match triggered!");
    }

    res.json({
      tipId,
      stackCount: updated.stackCount,
      founderMatchTriggered: updated.founderMatchTriggered,
      threshold: FOUNDER_MATCH_THRESHOLD,
    });
  } catch (err) {
    logger.error({ err }, "wishing-well: POST /stack failed");
    res.status(500).json({ error: "Failed to stack wish" });
  }
});

/**
 * POST /api/wishing-well/tip
 * Submit a crypto tip with an attached wish (existing XRP path).
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
        paymentMethod: "crypto",
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
      paymentMethod: tip.paymentMethod,
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
 * POST /api/wishing-well/tip/stripe
 * Create a Stripe Checkout session for a fiat coin tip.
 * Body: { amountUnits: 1|2|5, wishText, listenerName? }
 * Returns: { checkoutUrl } — frontend should redirect there.
 *
 * On checkout.session.completed webhook, the tip is written to the DB.
 */
router.post("/wishing-well/tip/stripe", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;

    const amountUnits = clampInt(body.amountUnits, 1, 5, 0);
    if (![1, 2, 5].includes(amountUnits)) {
      res.status(400).json({ error: "amountUnits must be 1, 2, or 5 (dollars)" });
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

    const listenerName =
      typeof body.listenerName === "string" && body.listenerName.trim()
        ? body.listenerName.trim().slice(0, 80)
        : null;

    const listenerId = req.isAuthenticated() ? req.user.id : null;
    const resolvedName =
      listenerName ??
      (req.isAuthenticated()
        ? [req.user.firstName, req.user.lastName].filter(Boolean).join(" ") || "Anonymous"
        : "Anonymous");

    const stripe = await getUncachableStripeClient();
    const baseUrl = getBaseUrl(req);
    const amountCents = amountUnits * 100;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: `Wishing Well Coin${amountUnits > 1 ? "s" : ""} — $${amountUnits}`,
              description: `"${wishText.slice(0, 100)}"`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        wishing_well: "true",
        wish_text: wishText.slice(0, 500),
        listener_name: resolvedName,
        listener_id: listenerId ?? "",
        amount_units: String(amountUnits),
        draw_date: todayUtc(),
      },
      success_url: `${baseUrl}/stomping-grounds?tab=well&stripe=success`,
      cancel_url: `${baseUrl}/stomping-grounds?tab=well&stripe=cancelled`,
    });

    logger.info(
      { sessionId: session.id, amountUnits, listenerId },
      "wishing-well: stripe checkout session created",
    );

    res.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (err) {
    logger.error({ err }, "wishing-well: POST /tip/stripe failed");
    res.status(500).json({ error: "Failed to create Stripe checkout" });
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
 * GET /api/wishing-well/credits
 * Returns the authenticated user's unredeemed Wishing Well credits.
 */
router.get("/wishing-well/credits", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.json({ totalCents: 0, credits: [] });
    return;
  }
  try {
    const credits = await db
      .select()
      .from(wishingWellCreditsTable)
      .where(
        and(
          eq(wishingWellCreditsTable.userId, req.user.id),
          isNull(wishingWellCreditsTable.redeemedAt),
        ),
      )
      .orderBy(desc(wishingWellCreditsTable.createdAt));

    const totalCents = credits.reduce((sum, c) => sum + c.amountCents, 0);
    res.json({ totalCents, credits });
  } catch (err) {
    logger.error({ err }, "wishing-well: GET /credits failed");
    res.status(500).json({ error: "Failed to load credits" });
  }
});

/**
 * POST /api/admin/wishing-well/draw
 * Run the daily draw. Picks one random pending tip, computes 50/50 split,
 * writes distribution. For fiat winners, issues a platform credit instead
 * of crypto.
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

    const rateMeta = getXrpRateMeta();
    const rate = rateMeta.rate;
    const totalUnits = potRows.reduce((sum, t) => sum + t.amountUnits, 0);
    const totalUsdCents = potRows.reduce(
      (sum, t) => sum + tipToUsdCents(t.amountUnits, t.paymentMethod),
      0,
    );

    const winnerTip = potRows[Math.floor(Math.random() * potRows.length)];
    const creatorShareUnits = Math.floor(totalUnits / 2);
    const winnerShareUnits = totalUnits - creatorShareUnits;
    const winnerShareUsdCents = Math.floor(totalUsdCents / 2);
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
        totalUsdCents,
        creatorShareUnits,
        winnerShareUnits,
        winnerShareUsdCents,
        winnerTipId: winnerTip.id,
        winnerWishText: winnerTip.wishText,
        winnerListenerName: winnerTip.listenerName,
        winnerListenerId: winnerTip.listenerId ?? null,
        winnerPaymentMethod: winnerTip.paymentMethod,
        payoutStatus: "pending",
        currency,
      })
      .returning();

    let creditIssued = false;
    if (winnerTip.paymentMethod === "stripe" && winnerTip.listenerId) {
      await db.insert(wishingWellCreditsTable).values({
        userId: winnerTip.listenerId,
        amountCents: winnerShareUsdCents,
        source: "wishing_well_win",
        distributionId: distribution.id,
      });
      await db
        .update(wishingWellDistributionsTable)
        .set({ payoutStatus: "credit_issued" })
        .where(eq(wishingWellDistributionsTable.id, distribution.id));
      creditIssued = true;
      logger.info(
        { date, winnerTipId: winnerTip.id, winnerShareUsdCents },
        "wishing-well: fiat winner credit issued",
      );
    }

    logger.info(
      { date, winnerTipId: winnerTip.id, totalUnits, totalUsdCents, creditIssued },
      "wishing-well: draw complete",
    );

    res.status(201).json({
      distribution: { ...distribution, payoutStatus: creditIssued ? "credit_issued" : "pending" },
      creditIssued,
      xrpUsdRate: rateMeta.rate,
      xrpRateSource: rateMeta.source,
      xrpRateFetchedAt: rateMeta.fetchedAt,
    });
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
 * Admin dashboard: distributions + today's pot summary with fiat/crypto breakdown.
 */
router.get("/admin/wishing-well", async (_req, res) => {
  try {
    const date = todayUtc();
    const rateMeta = getXrpRateMeta();
    const rate = rateMeta.rate;
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
          max(currency) AS currency,
          coalesce(sum(
            CASE
              WHEN payment_method = 'stripe' THEN amount_units * 100
              ELSE round(amount_units * ${rate} * 100)::int
            END
          ), 0)::int AS total_usd_cents,
          count(CASE WHEN payment_method = 'stripe' THEN 1 END)::int AS fiat_count,
          coalesce(sum(CASE WHEN payment_method = 'stripe' THEN amount_units ELSE 0 END), 0)::int AS fiat_units,
          count(CASE WHEN payment_method != 'stripe' THEN 1 END)::int AS crypto_count,
          coalesce(sum(CASE WHEN payment_method != 'stripe' THEN amount_units ELSE 0 END), 0)::int AS crypto_units
        FROM wishing_well_tips
        WHERE draw_date = '${date}' AND status = 'pending'
      `)),
    ]);
    const pot = potRow.rows[0] as {
      tip_count: number;
      total_units: number;
      currency: string;
      total_usd_cents: number;
      fiat_count: number;
      fiat_units: number;
      crypto_count: number;
      crypto_units: number;
    };
    res.json({
      distributions,
      todayPot: {
        date,
        tipCount: pot.tip_count,
        totalUnits: pot.total_units,
        totalUsdCents: pot.total_usd_cents,
        currency: pot.currency ?? "XRP",
        fiatCount: pot.fiat_count,
        fiatUnits: pot.fiat_units,
        cryptoCount: pot.crypto_count,
        cryptoUnits: pot.crypto_units,
        xrpUsdRate: rateMeta.rate,
        xrpRateSource: rateMeta.source,
        xrpRateFetchedAt: rateMeta.fetchedAt,
      },
    });
  } catch (err) {
    logger.error({ err }, "wishing-well: admin GET failed");
    res.status(500).json({ error: "Failed to load admin data" });
  }
});

export default router;
