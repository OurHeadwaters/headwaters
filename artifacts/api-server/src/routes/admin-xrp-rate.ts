import { Router, type IRouter } from "express";
import { getXrpRateHealth } from "../lib/xrp-rate";

const router: IRouter = Router();

/**
 * GET /api/admin/xrp-rate/health
 * Returns the current XRP/USD rate, its source, age in minutes, and an
 * isStale flag (true if the last successful fetch was > 30 min ago or has
 * never succeeded). Use this to detect a CoinGecko outage before running a
 * draw so pot values don't silently drift.
 */
router.get("/admin/xrp-rate/health", (_req, res) => {
  res.json(getXrpRateHealth());
});

export default router;
