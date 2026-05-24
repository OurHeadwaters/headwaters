/**
 * Kit routes — kit registry API and commerce endpoints.
 *
 * GET  /api/kits                      — all kits (metadata only)
 * GET  /api/kits/:slug                — single kit with full content bundle
 * POST /api/kits/:slug/checkout       — create Stripe Checkout session (direct kits)
 * POST /api/kits/:slug/inquire        — submit inquiry form (consultative kits)
 * GET  /api/kits/:slug/access         — check if current user/email has access
 */

import { Router, type IRouter } from "express";
import { db, reviewedProductsTable, kitPurchasesTable, kitInquiriesTable } from "@workspace/db";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { KITS, kitBySlug } from "../lib/kits";
import { transformationBySlug } from "../lib/transformations";
import { trackBySlug } from "../lib/tracks";
import { sendKitInquiryNotification } from "../lib/email";

const router: IRouter = Router();

/* ─────────────────── Helpers ─────────────────── */

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function contentWhereFragment(tags: string[], categories: string[]): string {
  const parts: string[] = [];
  if (tags.length) {
    const tagList = tags.map((t) => `'${esc(t)}'`).join(",");
    parts.push(
      `EXISTS (SELECT 1 FROM jsonb_array_elements_text(tags) t WHERE lower(t.value) IN (${tagList.toLowerCase()}))`,
    );
  }
  if (categories.length) {
    const catList = categories.map((c) => `'${esc(c)}'`).join(",");
    parts.push(
      `EXISTS (SELECT 1 FROM jsonb_array_elements_text(categories) c WHERE c.value IN (${catList}))`,
    );
  }
  return parts.length ? `(${parts.join(" OR ")})` : "false";
}

/* ─────────────────── GET /api/kits ─────────────────── */

router.get("/kits", (_req, res) => {
  res.json(KITS);
});

/* ─────────────────── GET /api/kits/:slug ─────────────────── */

router.get("/kits/:slug", async (req, res) => {
  const kit = kitBySlug(req.params.slug);
  if (!kit) {
    res.status(404).json({ error: "Kit not found" });
    return;
  }

  try {
    const transformations = kit.transformationSlugs
      .map(transformationBySlug)
      .filter(Boolean);

    const tracks = kit.trackSlugs
      .map(trackBySlug)
      .filter(Boolean);

    const allTags: string[] = [];
    const allCategories: string[] = [];

    for (const t of transformations) {
      if (t) {
        allTags.push(...t.tags);
        allCategories.push(...t.categories);
      }
    }
    for (const t of tracks) {
      if (t) {
        allTags.push(...t.tags);
        allCategories.push(...t.categories);
      }
    }

    const uniqueTags = [...new Set(allTags)];
    const uniqueCategories = [...new Set(allCategories)];

    let episodes: unknown[] = [];

    if (uniqueTags.length > 0 || uniqueCategories.length > 0) {
      const whereFragment = contentWhereFragment(uniqueTags, uniqueCategories);
      const result = await db.execute(sql.raw(`
        SELECT
          id, source, kind, slug, title, link, summary,
          published_at, episode_number, duration_seconds, audio_url,
          audio_type, artwork_url, categories, tags
        FROM content_items
        WHERE ${whereFragment}
        ORDER BY published_at DESC
        LIMIT 6
      `));

      type EpRow = {
        id: number; source: string; kind: string; slug: string;
        title: string; link: string; summary: string | null;
        published_at: string; episode_number: number | null;
        duration_seconds: number | null; audio_url: string | null;
        audio_type: string | null; artwork_url: string | null;
        categories: string[]; tags: string[];
      };

      episodes = (result.rows as EpRow[]).map((r) => ({
        id: r.id,
        source: r.source,
        kind: r.kind,
        slug: r.slug,
        title: r.title,
        link: r.link,
        summary: r.summary,
        publishedAt: new Date(r.published_at).toISOString(),
        episodeNumber: r.episode_number,
        durationSeconds: r.duration_seconds,
        audioUrl: r.audio_url,
        audioType: r.audio_type,
        artworkUrl: r.artwork_url,
        categories: r.categories,
        tags: r.tags,
      }));
    }

    const keywordFilters = [
      ...uniqueTags.map((s) => s.toLowerCase()),
      ...uniqueCategories.map((s) => s.toLowerCase()),
      ...kit.gearCategoryTags.map((s) => s.toLowerCase()),
    ];
    const uniqueKeywords = [...new Set(keywordFilters)];

    let gear: unknown[] = [];

    if (uniqueKeywords.length > 0) {
      const matched = await db
        .select()
        .from(reviewedProductsTable)
        .where(
          and(
            eq(reviewedProductsTable.isVisible, true),
            sql.raw(
              `(${uniqueKeywords
                .slice(0, 20)
                .map((kw) => `category_tags @> '${JSON.stringify([kw])}'::jsonb`)
                .join(" OR ")})`,
            ),
          ),
        )
        .orderBy(desc(reviewedProductsTable.importedAt))
        .limit(12);

      gear = matched;
    }

    if (gear.length === 0) {
      gear = await db
        .select()
        .from(reviewedProductsTable)
        .where(eq(reviewedProductsTable.isVisible, true))
        .orderBy(desc(reviewedProductsTable.importedAt))
        .limit(6);
    }

    res.json({
      ...kit,
      transformations,
      tracks,
      episodes,
      gear,
    });
  } catch (err) {
    logger.error({ err }, `kits: GET /${req.params.slug} failed`);
    res.status(500).json({ error: "Failed to load kit" });
  }
});

/* ─────────────────── POST /api/kits/:slug/checkout ─────────────────── */

router.post("/kits/:slug/checkout", async (req, res) => {
  const kit = kitBySlug(req.params.slug);
  if (!kit) {
    res.status(404).json({ error: "Kit not found" });
    return;
  }

  if (kit.priceType !== "direct") {
    res.status(400).json({ error: "This kit requires an inquiry, not a direct checkout." });
    return;
  }

  if (!kit.stripePriceId) {
    res.status(503).json({ error: "Kit pricing not yet configured — Stripe may not be connected." });
    return;
  }

  try {
    const { getUncachableStripeClient } = await import("../stripeClient");
    const stripe = await getUncachableStripeClient();

    const userId = (req as any).user?.id ?? null;
    const reqHost = req.get("host");
    const fallbackDomain = (process.env.REPLIT_DOMAINS ?? "").split(",")[0];
    const baseUrl = reqHost
      ? `${req.protocol}://${reqHost}`
      : `https://${fallbackDomain}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: kit.stripePriceId, quantity: 1 }],
      success_url: `${baseUrl}/kits/${kit.slug}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/kits/${kit.slug}`,
      metadata: {
        kit_slug: kit.slug,
        ...(userId ? { user_id: userId } : {}),
      },
      allow_promotion_codes: true,
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error({ err, slug: kit.slug }, "kits: POST /checkout failed");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

/* ─────────────────── POST /api/kits/:slug/inquire ─────────────────── */

router.post("/kits/:slug/inquire", async (req, res) => {
  const kit = kitBySlug(req.params.slug);
  if (!kit) {
    res.status(404).json({ error: "Kit not found" });
    return;
  }

  if (kit.priceType !== "consultative") {
    res.status(400).json({ error: "This kit uses direct checkout, not an inquiry form." });
    return;
  }

  const { name, email, notes } = req.body as { name?: string; email?: string; notes?: string };

  if (!name || !email) {
    res.status(400).json({ error: "name and email are required" });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  try {
    await db.insert(kitInquiriesTable).values({
      kitSlug: kit.slug,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      notes: notes?.trim() ?? null,
    });

    sendKitInquiryNotification({
      kitName: kit.name,
      kitSlug: kit.slug,
      name: name.trim(),
      email: email.trim(),
      notes: notes?.trim() ?? "",
    }).catch((err) =>
      logger.warn({ err, kitSlug: kit.slug }, "kits: inquiry email failed (non-fatal)"),
    );

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err, slug: kit.slug }, "kits: POST /inquire failed");
    res.status(500).json({ error: "Failed to submit inquiry" });
  }
});

/* ─────────────────── POST /api/kits/:slug/zaprite-checkout ──────── */

/**
 * Returns the Zaprite payment page URL for this kit so the frontend can
 * redirect to it. Zaprite hosts the payment page; we just track the intent.
 *
 * Full purchase recording happens via the Zaprite webhook at
 * POST /api/zaprite/webhook (see app.ts).
 */
router.post("/kits/:slug/zaprite-checkout", async (req, res) => {
  const kit = kitBySlug(req.params.slug);
  if (!kit) {
    res.status(404).json({ error: "Kit not found" });
    return;
  }

  if (kit.priceType !== "direct") {
    res.status(400).json({ error: "This kit requires an inquiry, not a direct checkout." });
    return;
  }

  if (!kit.zapriteUrl) {
    res.status(503).json({ error: "Bitcoin/Lightning checkout not yet configured for this kit." });
    return;
  }

  res.json({ url: kit.zapriteUrl });
});

/* ─────────────────── GET /api/kits/:slug/access ─────────────────── */

router.get("/kits/:slug/access", async (req, res) => {
  const kit = kitBySlug(req.params.slug);
  if (!kit) {
    res.status(404).json({ error: "Kit not found" });
    return;
  }

  const userId = (req as any).user?.id ?? null;
  const email = (req.query.email as string) ?? null;

  if (!userId && !email) {
    res.json({ hasAccess: false });
    return;
  }

  try {
    const conditions = [];
    if (userId) conditions.push(eq(kitPurchasesTable.userId, userId));
    if (email) conditions.push(eq(kitPurchasesTable.buyerEmail, email.toLowerCase()));

    const rows = await db
      .select({ id: kitPurchasesTable.id })
      .from(kitPurchasesTable)
      .where(
        and(
          eq(kitPurchasesTable.kitSlug, kit.slug),
          or(...conditions),
        ),
      )
      .limit(1);

    res.json({ hasAccess: rows.length > 0 });
  } catch (err) {
    logger.error({ err, slug: kit.slug }, "kits: GET /access failed");
    res.status(500).json({ error: "Failed to check access" });
  }
});

export default router;
