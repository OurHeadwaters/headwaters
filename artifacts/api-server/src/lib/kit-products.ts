/**
 * Kit Stripe products / prices.
 *
 * On startup, creates a Stripe Product + one-time Price for each direct-purchase kit
 * if they don't already exist. Populates the `stripePriceId` field on the in-memory
 * KITS array so the checkout route can use it immediately.
 *
 * Env var shortcut: KIT_STRIPE_PRICE_IDS can be set to a JSON object mapping kit
 * slug → Stripe price ID to skip the Stripe API calls entirely:
 *   KIT_STRIPE_PRICE_IDS='{"family-kit":"price_xxx","producer-kit":"price_yyy",...}'
 *
 * Price IDs are logged on first creation so the operator can add them to env.
 */

import { getUncachableStripeClient } from "../stripeClient";
import { logger } from "./logger";
import { KITS } from "./kits";

export async function ensureKitProducts(): Promise<void> {
  const stripe = await getUncachableStripeClient();

  const directKits = KITS.filter((k) => k.priceType === "direct" && k.priceCents);

  const envOverrides: Record<string, string> = (() => {
    try {
      const raw = process.env.KIT_STRIPE_PRICE_IDS;
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  })();

  for (const kit of directKits) {
    if (envOverrides[kit.slug]) {
      kit.stripePriceId = envOverrides[kit.slug];
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
        (p) => !p.recurring && p.unit_amount === kit.priceCents,
      );

      if (existingPrice) {
        kit.stripePriceId = existingPrice.id;
      } else {
        const created = await stripe.prices.create({
          product: productId,
          currency: "usd",
          unit_amount: kit.priceCents!,
          nickname: `${kit.name} — One-Time`,
        });
        kit.stripePriceId = created.id;
        logger.info(
          { slug: kit.slug, priceId: kit.stripePriceId },
          "kit-products: created Stripe price — add KIT_STRIPE_PRICE_IDS to env to skip this check",
        );
      }
    } catch (err) {
      logger.warn({ err, slug: kit.slug }, "kit-products: failed to ensure product (non-fatal)");
    }
  }
}
