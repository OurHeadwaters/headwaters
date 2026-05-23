import { getUncachableStripeClient } from "../stripeClient";
import { logger } from "./logger";

const BRIGADE_PRODUCT_NAME = "Brigade Membership";

/**
 * Ensures the Brigade Stripe Product and two Prices (monthly ~$9, annual ~$97)
 * exist. Price IDs are stored in environment variables:
 *   BRIGADE_MONTHLY_PRICE_ID
 *   BRIGADE_ANNUAL_PRICE_ID
 *
 * If the env vars are set and valid, this is a fast no-op.
 * If they are missing, the product/prices are created and the IDs are logged
 * so the operator can add them to the environment.
 *
 * This is called non-blocking from server startup so it never delays boot.
 */
export async function ensureBrigadeProducts(): Promise<{
  monthlyPriceId: string;
  annualPriceId: string;
}> {
  const stripe = await getUncachableStripeClient();

  // ── Ensure product ──────────────────────────────────────────────────────────
  let productId: string | undefined;

  const products = await stripe.products.list({ limit: 100, active: true });
  const existing = products.data.find((p) => p.name === BRIGADE_PRODUCT_NAME);

  if (existing) {
    productId = existing.id;
  } else {
    const created = await stripe.products.create({
      name: BRIGADE_PRODUCT_NAME,
      description:
        "Access cross-device progress sync, Stomping Grounds community features, full archive search, and transformation path bookmarking.",
    });
    productId = created.id;
    logger.info({ productId }, "brigade-products: created Brigade product");
  }

  // ── Ensure monthly price ────────────────────────────────────────────────────
  let monthlyPriceId = process.env.BRIGADE_MONTHLY_PRICE_ID;
  if (!monthlyPriceId) {
    const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 });
    const existingMonthly = prices.data.find(
      (p) => p.recurring?.interval === "month" && p.unit_amount === 900,
    );
    if (existingMonthly) {
      monthlyPriceId = existingMonthly.id;
    } else {
      const created = await stripe.prices.create({
        product: productId,
        currency: "usd",
        unit_amount: 900,
        recurring: { interval: "month" },
        nickname: "Brigade Monthly",
      });
      monthlyPriceId = created.id;
      logger.info({ monthlyPriceId }, "brigade-products: created monthly price");
    }
    logger.warn(
      { monthlyPriceId },
      "brigade-products: BRIGADE_MONTHLY_PRICE_ID env var not set — add this to your environment",
    );
  }

  // ── Ensure annual price ─────────────────────────────────────────────────────
  let annualPriceId = process.env.BRIGADE_ANNUAL_PRICE_ID;
  if (!annualPriceId) {
    const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 });
    const existingAnnual = prices.data.find(
      (p) => p.recurring?.interval === "year" && p.unit_amount === 9700,
    );
    if (existingAnnual) {
      annualPriceId = existingAnnual.id;
    } else {
      const created = await stripe.prices.create({
        product: productId,
        currency: "usd",
        unit_amount: 9700,
        recurring: { interval: "year" },
        nickname: "Brigade Annual",
      });
      annualPriceId = created.id;
      logger.info({ annualPriceId }, "brigade-products: created annual price");
    }
    logger.warn(
      { annualPriceId },
      "brigade-products: BRIGADE_ANNUAL_PRICE_ID env var not set — add this to your environment",
    );
  }

  return { monthlyPriceId, annualPriceId };
}

/**
 * Returns the configured price IDs from env, falling back to looking them up
 * from Stripe if not set. Used at request time.
 */
export async function getBrigadePriceIds(): Promise<{
  monthlyPriceId: string;
  annualPriceId: string;
}> {
  const monthlyPriceId = process.env.BRIGADE_MONTHLY_PRICE_ID;
  const annualPriceId = process.env.BRIGADE_ANNUAL_PRICE_ID;

  if (monthlyPriceId && annualPriceId) {
    return { monthlyPriceId, annualPriceId };
  }

  return ensureBrigadeProducts();
}
