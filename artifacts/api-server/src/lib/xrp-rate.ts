import { logger } from "./logger";

const REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd";

function envFallbackRate(): number {
  const v = parseFloat(process.env.XRP_USD_RATE ?? "");
  return Number.isFinite(v) && v > 0 ? v : 0.5;
}

let cachedRate: number = envFallbackRate();
let lastFetchedAt: Date | null = null;
let fetchTimer: ReturnType<typeof setInterval> | null = null;

async function fetchRate(): Promise<void> {
  try {
    const res = await fetch(COINGECKO_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, "xrp-rate: CoinGecko returned non-OK status");
      return;
    }
    const data = (await res.json()) as { ripple?: { usd?: number } };
    const rate = data?.ripple?.usd;
    if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) {
      cachedRate = rate;
      lastFetchedAt = new Date();
      logger.info({ rate, fetchedAt: lastFetchedAt.toISOString() }, "xrp-rate: updated");
    } else {
      logger.warn({ data }, "xrp-rate: unexpected response shape from CoinGecko");
    }
  } catch (err) {
    logger.warn({ err }, "xrp-rate: fetch failed, keeping previous rate");
  }
}

export function startXrpRateRefresh(): void {
  if (fetchTimer) return;
  fetchRate();
  fetchTimer = setInterval(fetchRate, REFRESH_INTERVAL_MS);
  fetchTimer.unref?.();
}

export function stopXrpRateRefresh(): void {
  if (fetchTimer) {
    clearInterval(fetchTimer);
    fetchTimer = null;
  }
}

export function getXrpUsdRate(): number {
  return cachedRate;
}

export function getXrpRateMeta(): { rate: number; fetchedAt: string | null; source: string } {
  return {
    rate: cachedRate,
    fetchedAt: lastFetchedAt?.toISOString() ?? null,
    source: lastFetchedAt ? "coingecko" : "fallback",
  };
}
