/**
 * Kit routes — kit registry API and commerce endpoints.
 *
 * GET  /api/kits                      — all kits (metadata only)
 * GET  /api/kits/my-purchases         — kits purchased by the authenticated user
 * GET  /api/kits/:slug                — single kit with full content bundle
 * POST /api/kits/:slug/checkout       — create Stripe Checkout session (direct kits)
 * POST /api/kits/:slug/inquire        — submit inquiry form (consultative kits)
 * GET  /api/kits/:slug/access         — check if current user/email has access
 */

import { Router, type IRouter } from "express";
import { db, pool, reviewedProductsTable, kitPurchasesTable, kitInquiriesTable } from "@workspace/db";
import { eq, and, or, desc, sql, ilike } from "drizzle-orm";
import { logger } from "../lib/logger";
import { KITS, kitBySlug } from "../lib/kits";
import { transformationBySlug } from "../lib/transformations";
import { trackBySlug } from "../lib/tracks";
import { sendKitInquiryNotification, sendKitAccessEmail, generateKitAccessToken, verifyKitAccessToken } from "../lib/email";
import { createRateLimiter } from "../middlewares/rateLimiter";

const router: IRouter = Router();

/* ─── Rate limiters for the send-access-email endpoint ─────────────────── */

/* IP-based: 5 requests / 60 s per IP — blocks one source cycling many emails */
const emailLookupRateLimit = createRateLimiter(5, 60_000);

/* Email-based: 3 requests / 15 min per address — blocks hammering one address
   from rotating IPs.  Stored in the shared `rate_limits` Postgres table so
   counters survive server restarts and are consistent across multiple instances. */
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/** Key prefix scoping email-based limits inside the shared rate_limits table. */
const EMAIL_RATE_LIMIT_PREFIX = "kit-access-email";

/**
 * Returns true when the caller is within the allowed rate, false when they've
 * exceeded it.  Uses a single atomic UPSERT against the shared `rate_limits`
 * Postgres table — counters survive restarts and scale across multiple API
 * instances.  Fails open on any DB error so a transient hiccup never locks out
 * legitimate users.
 */
async function checkRateLimit(email: string): Promise<boolean> {
  const key = `${email}:${EMAIL_RATE_LIMIT_PREFIX}`;
  try {
    const result = await pool.query<{ count: number; reset_at: Date }>(
      `INSERT INTO rate_limits (key, count, reset_at)
       VALUES ($1, 1, NOW() + ($2::bigint || ' milliseconds')::interval)
       ON CONFLICT (key) DO UPDATE SET
         count    = CASE
                      WHEN rate_limits.reset_at <= NOW() THEN 1
                      ELSE rate_limits.count + 1
                    END,
         reset_at = CASE
                      WHEN rate_limits.reset_at <= NOW()
                        THEN NOW() + ($2::bigint || ' milliseconds')::interval
                      ELSE rate_limits.reset_at
                    END
       RETURNING count, reset_at`,
      [key, RATE_LIMIT_WINDOW_MS],
    );
    const row = result.rows[0];
    return !row || row.count <= RATE_LIMIT_MAX;
  } catch (err) {
    logger.error({ err, email }, "kits: email rate-limit DB error — failing open");
    return true;
  }
}

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

/* ─────────────────── GET /api/kits/my-purchases ─────────────────── */

router.get("/kits/my-purchases", async (req, res) => {
  const userId = (req as any).user?.id ?? null;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const rows = await db
      .select({
        id: kitPurchasesTable.id,
        kitSlug: kitPurchasesTable.kitSlug,
        buyerEmail: kitPurchasesTable.buyerEmail,
        purchasedAt: kitPurchasesTable.purchasedAt,
      })
      .from(kitPurchasesTable)
      .where(eq(kitPurchasesTable.userId, userId))
      .orderBy(desc(kitPurchasesTable.purchasedAt));

    const purchases = rows.map((row) => {
      const kit = kitBySlug(row.kitSlug);
      const token = generateKitAccessToken(row.kitSlug, row.buyerEmail);
      return {
        id: row.id,
        kitSlug: row.kitSlug,
        buyerEmail: row.buyerEmail,
        token,
        purchasedAt: row.purchasedAt,
        kit: kit
          ? {
              slug: kit.slug,
              name: kit.name,
              tagline: kit.tagline,
              description: kit.description,
              priceType: kit.priceType,
              ctaLabel: kit.ctaLabel,
            }
          : null,
      };
    });

    res.json({ purchases });
  } catch (err) {
    logger.error({ err }, "kits: GET /my-purchases failed");
    res.status(500).json({ error: "Failed to load purchases" });
  }
});


/* ─────────────────── POST /api/kits/send-access-email ─────────────────── */

/**
 * Unauthenticated endpoint that looks up kit purchases by email and sends the
 * buyer a one-click access email instead of returning results in-browser.
 * Always responds 200 regardless of whether the email matched any purchases
 * to prevent email enumeration.
 */
router.post("/kits/send-access-email", emailLookupRateLimit, async (req, res) => {
  const email = (req.body?.email as string | undefined)?.trim().toLowerCase() ?? "";

  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  if (!(await checkRateLimit(email))) {
    res.status(429).json({
      error: "Too many requests. Please wait 15 minutes before requesting another access email.",
    });
    return;
  }

  try {
    const rows = await db
      .select({
        id: kitPurchasesTable.id,
        kitSlug: kitPurchasesTable.kitSlug,
        purchasedAt: kitPurchasesTable.purchasedAt,
      })
      .from(kitPurchasesTable)
      .where(eq(kitPurchasesTable.buyerEmail, email))
      .orderBy(desc(kitPurchasesTable.purchasedAt));

    if (rows.length > 0) {
      const kits = rows.map((row) => {
        const kit = kitBySlug(row.kitSlug);
        const token = generateKitAccessToken(row.kitSlug, email);
        return {
          slug: row.kitSlug,
          name: kit?.name ?? row.kitSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          tagline: kit?.tagline ?? "",
          token,
        };
      });

      sendKitAccessEmail({ buyerEmail: email, kits }).catch((err) =>
        logger.warn({ err, email }, "kits: send-access-email fire failed (non-fatal)"),
      );
    }

    // Always 200 — don't reveal whether the email exists in our system
    res.json({ sent: true });
  } catch (err) {
    logger.error({ err }, "kits: POST /send-access-email failed");
    res.status(500).json({ error: "Failed to send access email" });
  }
});

/* ─────────────────── POST /api/kits/:slug/resend-access ─────────────────── */

/**
 * Per-kit variant of /kits/send-access-email.
 * Looks up whether the supplied email purchased this specific kit and, if so,
 * fires a fresh welcome email containing a new tokenized access link.
 * Always responds 200 to prevent email enumeration.
 */
router.post("/kits/:slug/resend-access", emailLookupRateLimit, async (req, res) => {
  const kit = kitBySlug(req.params.slug as string);
  if (!kit) {
    res.status(404).json({ error: "Kit not found" });
    return;
  }

  const email = (req.body?.email as string | undefined)?.trim().toLowerCase() ?? "";

  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  if (!(await checkRateLimit(email))) {
    res.status(429).json({
      error: "Too many requests. Please wait 15 minutes before requesting another access email.",
    });
    return;
  }

  try {
    const rows = await db
      .select({
        id: kitPurchasesTable.id,
        kitSlug: kitPurchasesTable.kitSlug,
        purchasedAt: kitPurchasesTable.purchasedAt,
      })
      .from(kitPurchasesTable)
      .where(
        and(
          eq(kitPurchasesTable.kitSlug, kit.slug),
          eq(kitPurchasesTable.buyerEmail, email),
        ),
      )
      .limit(1);

    if (rows.length > 0) {
      const token = generateKitAccessToken(kit.slug, email);
      const tagline = Array.isArray(kit.tagline) ? kit.tagline[0] ?? "" : (kit.tagline ?? "");
      const kits = [
        {
          slug: kit.slug,
          name: kit.name,
          tagline,
          token,
        },
      ];

      sendKitAccessEmail({ buyerEmail: email, kits }).catch((err) =>
        logger.warn({ err, email, kitSlug: kit.slug }, "kits: resend-access fire failed (non-fatal)"),
      );
    }

    // Always 200 — don't reveal whether the email exists in our system
    res.json({ sent: true });
  } catch (err) {
    logger.error({ err, slug: kit.slug }, "kits: POST /:slug/resend-access failed");
    res.status(500).json({ error: "Failed to send access email" });
  }
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

    // If the kit specifies contentKeywords, use those directly instead of
    // deriving tags/categories from transformations and tracks. This gives kits
    // that share a transformation (e.g. pregnancy-kit and baby-health-kit both
    // pointing at outsourced-health-to-health-sovereign) distinct episode pools.
    let uniqueTags: string[];
    let uniqueCategories: string[];

    if (kit.contentKeywords && kit.contentKeywords.length > 0) {
      uniqueTags = [...new Set(kit.contentKeywords.map((k) => k.toLowerCase()))];
      uniqueCategories = [];
    } else {
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

      uniqueTags = [...new Set(allTags)];
      uniqueCategories = [...new Set(allCategories)];
    }

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

    // Callers may supply custom redirect paths to support different artifacts
    // (e.g. the Headwaters /kit/:slug page vs the TSP /kits/:slug page).
    // Paths must start with "/" and are resolved against the request's base URL.
    const rawSuccess = (req.body?.successPath as string | undefined)?.trim();
    const rawCancel = (req.body?.cancelPath as string | undefined)?.trim();

    const successPath =
      rawSuccess && rawSuccess.startsWith("/")
        ? rawSuccess
        : `/kits/${kit.slug}/welcome?session_id={CHECKOUT_SESSION_ID}`;

    const cancelPath =
      rawCancel && rawCancel.startsWith("/")
        ? rawCancel
        : `/kits/${kit.slug}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: kit.stripePriceId, quantity: 1 }],
      success_url: `${baseUrl}${successPath}`,
      cancel_url: `${baseUrl}${cancelPath}`,
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

  // Append a return_url so Zaprite redirects buyers back to the welcome page
  // after payment, where they see a "check your inbox" confirmation message.
  const siteUrl =
    process.env.SITE_URL ??
    (req.headers.origin as string | undefined) ??
    `https://${req.get("host")}`;
  const returnUrl = `${siteUrl}/kits/${kit.slug}/welcome?payment=bitcoin`;
  const zapriteUrlWithReturn = `${kit.zapriteUrl}&return_url=${encodeURIComponent(returnUrl)}`;

  res.json({ url: zapriteUrlWithReturn });
});

/* ─────────────────── GET /api/kits/:slug/access ─────────────────── */

router.get("/kits/:slug/access", emailLookupRateLimit, async (req, res) => {
  const kit = kitBySlug(req.params.slug as string);
  if (!kit) {
    res.status(404).json({ error: "Kit not found" });
    return;
  }

  const userId = (req as any).user?.id ?? null;
  const isAuthenticated = userId !== null;
  const email = (req.query.email as string) ?? null;
  const token = (req.query.token as string) ?? null;

  // Per-email rate limit: even if the caller rotates IPs, each individual
  // address is limited to RATE_LIMIT_MAX token checks per RATE_LIMIT_WINDOW_MS.
  if (email && !(await checkRateLimit(email.toLowerCase()))) {
    res.status(429).json({ error: "Too many requests for this email address. Please try again later." });
    return;
  }

  // Unauthenticated callers with no email at all: deny immediately.
  if (!userId && !email) {
    res.json({ hasAccess: false, isAuthenticated: false });
    return;
  }

  // Unauthenticated email-based access: require a valid HMAC token.
  // Accepting email alone would let anyone enumerate a known address's
  // purchases by iterating kit slugs — the token proves server-issued
  // access (i.e. a real purchase already recorded).
  if (!userId && email) {
    if (token && verifyKitAccessToken(kit.slug, email, token)) {
      // Stamp lastVerifiedAt so the expiry-reminder job can track activity.
      db.update(kitPurchasesTable)
        .set({ lastVerifiedAt: new Date() })
        .where(
          and(
            eq(kitPurchasesTable.kitSlug, kit.slug),
            eq(kitPurchasesTable.buyerEmail, email.toLowerCase()),
          ),
        )
        .catch((err: unknown) =>
          logger.warn({ err, kitSlug: kit.slug, email }, "kits: failed to stamp lastVerifiedAt (non-fatal)"),
        );
      res.json({ hasAccess: true, isAuthenticated: false, tokenVerified: true });
    } else {
      res.json({ hasAccess: false, isAuthenticated: false });
    }
    return;
  }

  // Authenticated path: token fast-path first, then DB lookup by userId.
  if (email && token && verifyKitAccessToken(kit.slug, email, token)) {
    db.update(kitPurchasesTable)
      .set({ lastVerifiedAt: new Date() })
      .where(
        and(
          eq(kitPurchasesTable.kitSlug, kit.slug),
          eq(kitPurchasesTable.buyerEmail, email.toLowerCase()),
        ),
      )
      .catch((err: unknown) =>
        logger.warn({ err, kitSlug: kit.slug, email }, "kits: failed to stamp lastVerifiedAt (non-fatal)"),
      );
    res.json({ hasAccess: true, isAuthenticated: true, tokenVerified: true });
    return;
  }

  try {
    const rows = await db
      .select({ id: kitPurchasesTable.id })
      .from(kitPurchasesTable)
      .where(
        and(
          eq(kitPurchasesTable.kitSlug, kit.slug),
          eq(kitPurchasesTable.userId, userId!),
        ),
      )
      .limit(1);

    const hasAccess = rows.length > 0;

    // Stamp lastVerifiedAt so activity is tracked for expiry-reminder purposes.
    if (hasAccess) {
      db.update(kitPurchasesTable)
        .set({ lastVerifiedAt: new Date() })
        .where(
          and(
            eq(kitPurchasesTable.kitSlug, kit.slug),
            eq(kitPurchasesTable.userId, userId!),
          ),
        )
        .catch((err: unknown) =>
          logger.warn({ err, kitSlug: kit.slug }, "kits: failed to stamp lastVerifiedAt for userId path (non-fatal)"),
        );
    }

    res.json({ hasAccess, isAuthenticated: true });
  } catch (err) {
    logger.error({ err, slug: kit.slug }, "kits: GET /access failed");
    res.status(500).json({ error: "Failed to check access" });
  }
});

export default router;
