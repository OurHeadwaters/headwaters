import app from "./app";
import { logger } from "./lib/logger";
import { startBackgroundRefresh } from "./lib/library";
import { startGearSchedule } from "./routes/gear";
import { getFeedCached } from "./lib/rss";
import { checkSeriesConsistency, validateSeriesRegistry } from "./lib/series-consistency";
import { seedExpertCouncil, seedUlgBusinesses, seedCouncilPodcastFeeds } from "./lib/seed-expert-council";
import { startNostrIngestion } from "./lib/nostr-ingestion";
import { startYouTubeIngestion } from "./lib/youtube-ingestion";
import { startXrpRateRefresh } from "./lib/xrp-rate";

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
    await runMigrations({ databaseUrl, schema: "stripe" });
    logger.info("stripe: schema ready");

    const stripeSync = await getStripeSync();

    const webhookBase = `https://${(process.env.REPLIT_DOMAINS ?? "").split(",")[0]}`;
    await stripeSync.findOrCreateManagedWebhook(`${webhookBase}/api/stripe/webhook`);
    logger.info("stripe: managed webhook configured");

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

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

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

  // Initialise Stripe after server is ready (non-blocking)
  initStripe();

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
