import app from "./app";
import { logger } from "./lib/logger";
import { startBackgroundRefresh } from "./lib/library";
import { getFeedCached } from "./lib/rss";
import { checkSeriesConsistency, validateSeriesRegistry } from "./lib/series-consistency";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  validateSeriesRegistry();

  startBackgroundRefresh();

  getFeedCached()
    .then((feed) => checkSeriesConsistency(feed.episodes))
    .catch((feedErr) =>
      logger.warn(
        { err: feedErr },
        "series-consistency: could not fetch RSS feed at startup; skipping consistency check",
      ),
    );
});
