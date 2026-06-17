import { logger } from "./logger";

const PRODUCTION_SITE_URL = "https://www.thesurvivalpodcast.com";

if (!process.env.SITE_URL) {
  logger.warn(
    { fallback: PRODUCTION_SITE_URL },
    "config: SITE_URL is not set — falling back to hardcoded production URL. " +
      "Set SITE_URL in Replit Secrets when the domain changes.",
  );
}

/**
 * Returns the canonical site URL, with any trailing slash stripped.
 *
 * Reads SITE_URL from the environment (set it in Replit Secrets).
 * Falls back to the hardcoded production URL so existing behaviour is
 * preserved, but a warning is logged at startup so the gap is visible.
 *
 * @example
 *   getSiteUrl()           // "https://www.thesurvivalpodcast.com"
 *   `${getSiteUrl()}/kits` // "https://www.thesurvivalpodcast.com/kits"
 */
export function getSiteUrl(): string {
  return (process.env.SITE_URL ?? PRODUCTION_SITE_URL).replace(/\/$/, "");
}
