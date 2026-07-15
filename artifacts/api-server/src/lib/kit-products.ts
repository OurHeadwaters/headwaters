/**
 * Kit Stripe products / prices.
 *
 * On startup, creates a Stripe Product + one-time Price for each direct-purchase kit
 * if they don't already exist. Populates the `stripePriceId` field on the in-memory
 * KITS array so the checkout route can use it immediately.
 *
 * ── Pinning price IDs (preferred — eliminates all Stripe API calls at startup) ──
 *
 * Set individual env vars per kit slug:
 *
 *   FAMILY_KIT_PRICE_ID        → "family-kit"
 *   PRODUCER_KIT_PRICE_ID      → "producer-kit"
 *   CARE_KIT_PRICE_ID          → "care-kit"
 *   BUDGET_KIT_PRICE_ID        → "budget-kit"
 *   DIGITAL_KIT_PRICE_ID       → "digital-kit"
 *   PARRS_JARS_PRICE_ID        → "parrs-jars"
 *   PREGNANCY_KIT_PRICE_ID     → "pregnancy-kit"
 *   BABY_HEALTH_KIT_PRICE_ID   → "baby-health-kit"
 *   PHYSICAL_KIT_PRICE_ID      → "physical-kit"
 *   HEMP_SEED_KIT_PRICE_ID     → "hemp-seed-kit"  (pre-wired; populate after first checkout)
 *
 * ── Legacy JSON blob (still supported, lower priority than individual vars) ───
 *
 *   KIT_STRIPE_PRICE_IDS='{"family-kit":"price_xxx","producer-kit":"price_yyy",...}'
 *   Individual per-slug env vars take precedence over entries in the JSON blob.
 *
 * ── Scoping note ────────────────────────────────────────────────────────────
 *
 *   DEV:  set env vars in the "development" environment (test-mode Stripe IDs).
 *   PROD: set env vars in the "production" environment (live-mode Stripe IDs).
 *   Do NOT use Replit Secrets for these — scoped env vars let dev and prod
 *   carry different sets of IDs without interfering with each other.
 *
 * Price IDs are logged on first creation so the operator can add them to env.
 */

import { getUncachableStripeClient } from "../stripeClient";
import { logger } from "./logger";
import { KITS } from "./kits";

/**
 * Maps every known kit slug to its individual price-ID env var name.
 *
 * Set the env var value (a Stripe price_xxx ID) for each slug you want to pin.
 * Pinned slugs skip the Stripe API entirely on cold start.
 *
 * HEMP_SEED_KIT_PRICE_ID is pre-wired here so the operator can populate it after
 * the first production checkout, before the kit's checkout route goes live.
 */
export const KIT_PRICE_ID_ENV_VARS: Record<string, string> = {
  "family-kit":      "FAMILY_KIT_PRICE_ID",
  "producer-kit":    "PRODUCER_KIT_PRICE_ID",
  "care-kit":        "CARE_KIT_PRICE_ID",
  "budget-kit":      "BUDGET_KIT_PRICE_ID",
  "digital-kit":     "DIGITAL_KIT_PRICE_ID",
  "parrs-jars":      "PARRS_JARS_PRICE_ID",
  "pregnancy-kit":   "PREGNANCY_KIT_PRICE_ID",
  "baby-health-kit": "BABY_HEALTH_KIT_PRICE_ID",
  "physical-kit":    "PHYSICAL_KIT_PRICE_ID",
  "hemp-seed-kit":   "HEMP_SEED_KIT_PRICE_ID",
};

/**
 * Reads a pinned price ID for a kit slug from environment variables.
 *
 * Resolution order:
 *   1. Per-slug env var (e.g. FAMILY_KIT_PRICE_ID)
 *   2. KIT_STRIPE_PRICE_IDS JSON blob entry for the slug (legacy)
 *   3. undefined — will fall back to Stripe API lookup
 */
function readPinnedPriceId(slug: string, jsonBlob: Record<string, string>): string | undefined {
  const envVarName = KIT_PRICE_ID_ENV_VARS[slug];
  if (envVarName) {
    const val = process.env[envVarName];
    if (val) return val;
  }
  return jsonBlob[slug] ?? undefined;
}

export async function ensureKitProducts(): Promise<void> {
  const directKits = KITS.filter((k) => k.priceType === "direct" && k.priceCents);

  const jsonBlob: Record<string, string> = (() => {
    try {
      const raw = process.env.KIT_STRIPE_PRICE_IDS;
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  })();

  // ── Fast path: all kits have pinned price IDs — skip Stripe entirely ─────────
  const allPinned = directKits.every((k) => Boolean(readPinnedPriceId(k.slug, jsonBlob)));
  if (allPinned) {
    for (const kit of directKits) {
      kit.stripePriceId = readPinnedPriceId(kit.slug, jsonBlob)!;
      logger.info({ slug: kit.slug, priceId: kit.stripePriceId }, "kit-products: price ID loaded from env");
    }
    logger.info(
      { coveredCount: directKits.length, totalCount: directKits.length },
      "kit-products: all price IDs loaded from env — no Stripe API calls needed at startup",
    );
    return;
  }

  const stripe = await getUncachableStripeClient();

  for (const kit of directKits) {
    const pinned = readPinnedPriceId(kit.slug, jsonBlob);
    if (pinned) {
      kit.stripePriceId = pinned;
      logger.info({ slug: kit.slug, priceId: kit.stripePriceId }, "kit-products: price ID loaded from env");
      continue;
    }

    try {
      const productName = `Headwaters Kit — ${kit.name}`;

      const products = await stripe.products.list({ limit: 100, active: true });
      let productId: string;

      const existing = products.data.find((p) => p.name === productName);
      if (existing) {
        productId = existing.id;
      } else {
        const created = await stripe.products.create({
          name: productName,
          description: kit.description,
          metadata: { kit_slug: kit.slug },
        });
        productId = created.id;
        logger.info({ slug: kit.slug, productId }, "kit-products: created Stripe product");
      }

      const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 });
      const existingPrice = prices.data.find(
        (p) => !p.recurring && p.unit_amount === kit.priceCents && p.currency === "cad",
      );

      if (existingPrice) {
        kit.stripePriceId = existingPrice.id;
        logger.info({ slug: kit.slug, priceId: kit.stripePriceId }, "kit-products: using existing Stripe price");
      } else {
        const created = await stripe.prices.create({
          product: productId,
          currency: "cad",
          unit_amount: kit.priceCents!,
          nickname: `${kit.name} — One-Time`,
        });
        kit.stripePriceId = created.id;
        logger.info(
          { slug: kit.slug, priceId: kit.stripePriceId },
          "kit-products: created NEW Stripe price",
        );
      }
    } catch (err) {
      logger.warn({ err, slug: kit.slug }, "kit-products: failed to ensure product (non-fatal)");
    }
  }

  // ── Startup pinning status summary ──────────────────────────────────────────
  //
  // Pinned slugs = env var already set → zero Stripe API calls on next cold start.
  // Unpinned slugs = no env var set → Stripe API called on every cold start.
  //
  // To pin a slug: set its env var (listed in KIT_PRICE_ID_ENV_VARS) to the
  // Stripe price ID logged above.  Use scoped env vars (not Replit Secrets) so
  // dev (test-mode IDs) and prod (live-mode IDs) stay independent.
  //
  const pinnedSlugs: string[] = [];
  const unpinnedSlugs: string[] = [];
  const priceMap: Record<string, string> = {};

  for (const kit of directKits) {
    if (kit.stripePriceId) {
      priceMap[kit.slug] = kit.stripePriceId;
      if (readPinnedPriceId(kit.slug, jsonBlob)) {
        pinnedSlugs.push(kit.slug);
      } else {
        unpinnedSlugs.push(kit.slug);
      }
    } else {
      unpinnedSlugs.push(kit.slug);
    }
  }

  const isProduction = process.env.REPLIT_DEPLOYMENT === "1";
  const envTarget = isProduction ? "PRODUCTION" : "DEVELOPMENT";

  if (unpinnedSlugs.length > 0) {
    logger.warn(
      {
        pinnedSlugs,
        unpinnedSlugs,
        envTarget,
        hint: Object.fromEntries(
          unpinnedSlugs
            .filter((s) => priceMap[s] && KIT_PRICE_ID_ENV_VARS[s])
            .map((s) => [KIT_PRICE_ID_ENV_VARS[s]!, priceMap[s]!]),
        ),
      },
      `kit-products: ${unpinnedSlugs.length} kit(s) not pinned — set the env vars in 'hint' in the ${envTarget} environment to eliminate Stripe API calls at startup`,
    );
  } else {
    logger.info(
      { pinnedSlugs, envTarget },
      "kit-products: all kit price IDs pinned via env vars",
    );
  }
}
