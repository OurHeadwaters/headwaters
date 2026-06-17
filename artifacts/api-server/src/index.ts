import app, { hwDevProxy } from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";
import { startBackgroundRefresh } from "./lib/library";
import { startGearSchedule } from "./routes/gear";
import { getFeedCached } from "./lib/rss";
import { checkSeriesConsistency, validateSeriesRegistry } from "./lib/series-consistency";
import { seedExpertCouncil, seedUlgBusinesses, seedCouncilPodcastFeeds } from "./lib/seed-expert-council";
import { seedStompingPathHandles } from "./lib/seed-stomping-path";
import { startNostrIngestion } from "./lib/nostr-ingestion";
import { startYouTubeIngestion } from "./lib/youtube-ingestion";
import { startXrpRateRefresh } from "./lib/xrp-rate";
import { getSiteUrl } from "./lib/config";
import { KITS } from "./lib/kits";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// ─── Stripe initialisation (non-blocking) ──────────────────────────────────
// Runs after the server starts listening so startup is never delayed.
// Failures are logged as warnings — the app remains functional without Stripe.
async function initStripe(): Promise<void> {
  try {
    const { runMigrations } = await import("stripe-replit-sync");
    const { getStripeSync } = await import("./stripeClient");

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is required");

    logger.info("stripe: running schema migrations…");
    await runMigrations({ databaseUrl } as Parameters<typeof runMigrations>[0]);
    logger.info("stripe: schema ready");

    const stripeSync = await getStripeSync();

    // Use the canonical site URL so the webhook always points at the real
    // production domain (thestompingpaths.com), not the ephemeral Replit domain.
    const siteUrl = getSiteUrl();
    const expectedWebhookUrl = `${siteUrl}/api/stripe/webhook`;

    const webhook = await stripeSync.findOrCreateManagedWebhook(expectedWebhookUrl);

    // When a new webhook endpoint is first created, Stripe returns the signing
    // secret in the response (whsec_…). It is never returned again after this
    // point, so log a clear prompt for the operator to save it.
    if (webhook.secret) {
      logger.warn(
        { webhookUrl: expectedWebhookUrl, webhookId: webhook.id },
        "stripe: managed webhook CREATED — a new signing secret (whsec_…) was issued. " +
          "Save it to the Stripe integration's webhook_secret field to enable signature " +
          "verification. Find it in the Stripe Dashboard → Developers → Webhooks → " +
          "select the endpoint → Signing secret.",
      );
    }

    logger.info(
      { webhookUrl: expectedWebhookUrl },
      "stripe: managed webhook configured",
    );

    // syncBackfill is async and intentionally fire-and-forget
    stripeSync.syncBackfill().catch((err) =>
      logger.warn({ err }, "stripe: syncBackfill failed (non-fatal)"),
    );
  } catch (err) {
    logger.warn(
      { err },
      "stripe: initialisation skipped — connect Stripe via the Integrations tab to enable payments",
    );
  }
}

const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  // Wire up path-filtered WebSocket proxies for HMR in dev mode.
  // Both handlers must be behind a single "upgrade" listener with URL routing —
  // stacking two independent .upgrade handlers causes the first to intercept
  // all upgrades, breaking HMR for the second app.
  const devProxy = hwDevProxy;
  if (devProxy) {
    server.on("upgrade", (req, socket, head) => {
      if (req.url?.startsWith("/headwaters")) {
        devProxy.upgrade(req, socket as import("net").Socket, head);
      }
    });
    logger.info("headwaters: WebSocket HMR proxy attached");
  }

  logger.info({ port }, "Server listening");

  // Purge any expired rate-limit rows left over from before this process started.
  // This covers deploy-cycle gaps where the previous process' setInterval never
  // fired because traffic was low.  Non-blocking and non-fatal.
  pool
    .query("DELETE FROM rate_limits WHERE reset_at < NOW()")
    .then((r) =>
      logger.info(
        { rowCount: r.rowCount },
        "rate-limits: boot-time prune complete",
      ),
    )
    .catch((err) =>
      logger.warn({ err }, "rate-limits: boot-time prune failed (non-fatal)"),
    );

  // Warn for any direct-sale kit that has no accessUrl resolved.
  // Missing URLs mean welcome email download buttons will be empty.
  for (const kit of KITS) {
    if (kit.priceType === "direct" && !kit.accessUrl) {
      const envKey = `KIT_ACCESS_URL_${kit.slug.toUpperCase().replace(/-/g, "_")}`;
      logger.warn(
        { kitSlug: kit.slug, envKey },
        `kits: ${envKey} not set — welcome email button will be empty`,
      );
    }
  }

  validateSeriesRegistry();
  startBackgroundRefresh();
  startGearSchedule();

  getFeedCached()
    .then((feed) => checkSeriesConsistency(feed.episodes))
    .catch((feedErr) =>
      logger.warn(
        { err: feedErr },
        "series-consistency: could not fetch RSS feed at startup; skipping consistency check",
      ),
    );

  // Sync expert council static registry to DB on startup (upserts by slug)
  seedExpertCouncil()
    .then((n) => logger.info({ count: n }, "expert-council: startup sync complete"))
    .catch((err) => logger.warn({ err }, "expert-council: startup sync failed (non-fatal)"));
  seedUlgBusinesses()
    .then((n) => logger.info({ count: n }, "ulg-businesses: startup sync complete"))
    .catch((err) => logger.warn({ err }, "ulg-businesses: startup sync failed (non-fatal)"));
  // Seed known Fireside Freedom host podcast feed URLs (only fills NULLs)
  seedCouncilPodcastFeeds()
    .then((n) => logger.info({ count: n }, "council-podcast-feeds: startup seed complete"))
    .catch((err) => logger.warn({ err }, "council-podcast-feeds: startup seed failed (non-fatal)"));
  // Seed Stomping Path water-name handles pool (idempotent)
  seedStompingPathHandles()
    .then((n) => logger.info({ count: n }, "stomping-path: handles seed complete"))
    .catch((err) => logger.warn({ err }, "stomping-path: handles seed failed (non-fatal)"));

  // Initialise Stripe after server is ready (non-blocking)
  initStripe();

  // Ensure Kit Stripe products + prices exist (non-blocking)
  import("./lib/kit-products")
    .then(({ ensureKitProducts }) => ensureKitProducts())
    .then(() => logger.info("kit-products: all direct-kit prices ready"))
    .catch((err) =>
      logger.warn({ err }, "kit-products: setup skipped (non-fatal) — Stripe may not be connected"),
    );

  // Ensure Brigade Stripe product + prices exist (non-blocking)
  import("./lib/brigade-products")
    .then(({ ensureBrigadeProducts }) => ensureBrigadeProducts())
    .then(({ monthlyPriceId, annualPriceId }) =>
      logger.info({ monthlyPriceId, annualPriceId }, "brigade-products: prices ready"),
    )
    .catch((err) =>
      logger.warn({ err }, "brigade-products: setup skipped (non-fatal) — Stripe may not be connected"),
    );

  // Nostr ingestion — runs once at startup then daily (non-blocking)
  startNostrIngestion();

  // YouTube ingestion — runs once at startup then daily (non-blocking)
  startYouTubeIngestion();

  // XRP/USD rate refresh — fetches from CoinGecko every 15 min (non-blocking)
  startXrpRateRefresh();
});
