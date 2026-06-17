import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";
import { logger } from "./lib/logger";

/**
 * Fetches Stripe credentials from the Replit connection API.
 * Not cached — tokens can rotate, so fetch fresh each time.
 *
 * Uses the environment parameter to select development vs production credentials
 * based on the REPLIT_DEPLOYMENT env var (set to "1" in deployed environments).
 *
 * Production guard: if running deployed and the webhook secret is absent, a hard
 * error is thrown rather than silently accepting unverified webhooks.
 */
async function getStripeCredentials(): Promise<{
  secretKey: string;
  webhookSecret?: string;
}> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (!hostname || !xReplitToken) {
    throw new Error(
      "Missing Replit environment variables. " +
        "Ensure the Stripe integration is connected via the Integrations tab.",
    );
  }

  const isProduction = process.env.REPLIT_DEPLOYMENT === "1";
  const targetEnvironment = isProduction ? "production" : "development";

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", "stripe");
  url.searchParams.set("environment", targetEnvironment);

  const resp = await fetch(url.toString(), {
    headers: { Accept: "application/json", "X-Replit-Token": xReplitToken },
    signal: AbortSignal.timeout(10_000),
  });

  if (!resp.ok) {
    throw new Error(
      `Failed to fetch Stripe credentials: ${resp.status} ${resp.statusText}`,
    );
  }

  const data = await resp.json() as { items?: Array<{ settings?: { secret?: string; webhook_secret?: string } }> };
  const settings = data.items?.[0]?.settings;

  if (!settings?.secret) {
    if (isProduction) {
      throw new Error(
        "STRIPE PRODUCTION ERROR: No secret key found in the production Stripe integration connection. " +
          "Go to the Integrations tab → Stripe → add a Production environment connection with your live secret key (sk_live_…) " +
          "and live webhook secret (whsec_…) before deploying.",
      );
    }
    throw new Error(
      "Stripe integration not connected or missing secret key. " +
        "Connect Stripe via the Integrations tab first.",
    );
  }

  // ── Mode log: always visible in server logs so it's clear which key type is active ──
  const keyMode = settings.secret.startsWith("sk_live_") ? "LIVE" : "TEST";
  logger.info(
    { mode: keyMode, environment: targetEnvironment },
    `stripe: booted in ${keyMode} mode (${targetEnvironment} credentials)`,
  );

  if (keyMode === "TEST" && isProduction) {
    logger.warn(
      "stripe: WARNING — running in deployed environment with TEST keys (sk_test_). " +
        "Connect live keys (sk_live_…) via Integrations → Stripe → Production to accept real payments.",
    );
  }

  // ── Webhook secret resolution (priority order) ──────────────────────────
  //
  //  1. Integration connection field `webhook_secret`  (preferred; set via Integrations UI)
  //  2. STRIPE_WEBHOOK_SECRET env var / Replit Secret   (production fallback; set in Secrets tab)
  //  3. STRIPE_WEBHOOK_SECRET_FALLBACK env var           (dev only; set via `stripe listen`)
  //
  // Production guard: if none of the above are present, throw — never accept
  // unverified webhooks in production.
  const webhookSecret =
    settings.webhook_secret ??
    (isProduction
      ? process.env.STRIPE_WEBHOOK_SECRET
      : process.env.STRIPE_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET_FALLBACK);

  if (isProduction && !webhookSecret) {
    throw new Error(
      "STRIPE PRODUCTION ERROR: Webhook secret is missing. " +
        "Without it, incoming webhooks cannot be verified and purchase/membership activations will not work. " +
        "Fix: add STRIPE_WEBHOOK_SECRET to Replit Secrets (copy the whsec_… value from the Stripe Dashboard " +
        "→ Developers → Webhooks → https://thestompingpaths.com/api/stripe/webhook → Signing secret).",
    );
  }

  if (!isProduction && !webhookSecret) {
    logger.warn(
      "stripe: no webhook secret available — set STRIPE_WEBHOOK_SECRET_FALLBACK to enable " +
        "webhook verification in development (run: stripe listen --forward-to ... to get a whsec_ value)",
    );
  }

  return {
    secretKey: settings.secret,
    webhookSecret,
  };
}

/**
 * Returns a fresh authenticated Stripe client.
 * Not cached — fetches credentials on every call so rotated keys are picked up.
 */
export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getStripeCredentials();
  return new Stripe(secretKey);
}

/**
 * Returns a fresh StripeSync instance for webhook processing and data sync.
 * Not cached — fetches credentials on every call so rotated keys are picked up.
 */
export async function getStripeSync(): Promise<StripeSync> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const { secretKey, webhookSecret } = await getStripeCredentials();
  return new StripeSync({
    poolConfig: { connectionString: databaseUrl },
    stripeSecretKey: secretKey,
    stripeWebhookSecret: webhookSecret ?? "",
  });
}

/**
 * Verifies a Stripe webhook signature and returns the parsed event.
 * Throws a StripeSignatureVerificationError if the signature is invalid.
 * This is the security gate — call this before any business logic.
 *
 * Separate from stripe-replit-sync's processWebhook so that DB sync
 * failures (stripe.accounts table, etc.) never block webhook processing.
 */
export async function verifyAndParseWebhookEvent(
  payload: Buffer,
  signature: string,
): Promise<Stripe.Event> {
  const { secretKey, webhookSecret } = await getStripeCredentials();
  if (!webhookSecret) {
    throw new Error(
      "Stripe webhook secret is not configured. " +
        "Set STRIPE_WEBHOOK_SECRET_FALLBACK in dev, or add webhook_secret to " +
        "the Stripe integration connection in the Integrations tab.",
    );
  }
  const stripe = new Stripe(secretKey);
  // constructEvent verifies the HMAC signature and parses the event payload.
  // Throws Stripe.errors.StripeSignatureVerificationError on invalid signature.
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
