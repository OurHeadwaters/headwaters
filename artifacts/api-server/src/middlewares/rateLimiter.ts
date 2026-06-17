import type { Request, Response, NextFunction } from "express";
import { pool } from "@workspace/db";
import { logger } from "../lib/logger";

/**
 * Creates an IP-based rate limiter middleware backed by PostgreSQL so that
 * counters survive server restarts and deploys.
 *
 * Each request performs a single atomic UPSERT that either:
 *   - starts a new window (INSERT), or
 *   - increments the counter within the existing window (UPDATE), or
 *   - resets an expired window and starts fresh (UPDATE with count = 1).
 *
 * On any DB error the middleware fails **open** (allows the request) so a
 * transient database hiccup never takes down the API.
 *
 * @param maxRequests - Maximum requests allowed per window
 * @param windowMs    - Window duration in milliseconds
 * @param keyPrefix   - Optional prefix scoping the counter (e.g. a route name).
 *                      Key stored in DB is `${ip}:${keyPrefix}` when provided,
 *                      otherwise plain `${ip}`.
 */
export function createRateLimiter(
  maxRequests: number,
  windowMs: number,
  keyPrefix?: string,
) {
  // Periodically prune expired rows so the table stays tidy.
  const pruneInterval = setInterval(async () => {
    try {
      await pool.query("DELETE FROM rate_limits WHERE reset_at <= NOW()");
    } catch {
      // Non-critical — ignore prune errors
    }
  }, windowMs);
  pruneInterval.unref();

  return async function rateLimiter(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)
        ?.split(",")[0]
        ?.trim() ??
      req.socket.remoteAddress ??
      "unknown";

    const key = keyPrefix ? `${ip}:${keyPrefix}` : ip;

    try {
      // Single atomic UPSERT: insert a new window or increment/reset existing.
      // The CASE expressions handle window expiry without a separate SELECT.
      const result = await pool.query<{ count: number; reset_at: Date }>(
        `INSERT INTO rate_limits (key, count, reset_at)
         VALUES ($1, 1, NOW() + ($2::bigint || ' milliseconds')::interval)
         ON CONFLICT (key) DO UPDATE SET
           count   = CASE
                       WHEN rate_limits.reset_at <= NOW() THEN 1
                       ELSE rate_limits.count + 1
                     END,
           reset_at = CASE
                       WHEN rate_limits.reset_at <= NOW()
                         THEN NOW() + ($2::bigint || ' milliseconds')::interval
                       ELSE rate_limits.reset_at
                     END
         RETURNING count, reset_at`,
        [key, windowMs],
      );

      const row = result.rows[0];

      if (row && row.count > maxRequests) {
        const retryAfter = Math.ceil(
          (row.reset_at.getTime() - Date.now()) / 1000,
        );
        res.setHeader("Retry-After", String(Math.max(retryAfter, 1)));
        res.status(429).json({
          error: "Too many requests. Please wait before trying again.",
        });
        return;
      }
    } catch (err) {
      // Fail open: log the error but allow the request through so a DB hiccup
      // does not inadvertently bring down the API.
      logger.error({ err }, "rateLimiter: DB error — failing open");
    }

    next();
  };
}

/**
 * Convenience wrapper around `createRateLimiter` for per-route limits.
 *
 * The DB key is scoped as `${ip}:${routeKey}` so each route gets its own
 * independent counter that does not consume from the global IP budget.
 *
 * @example
 *   router.post("/codetry/assess", createRouteLimiter("codetry-assess", 10, 60_000), handler);
 *
 * @param routeKey    - Short identifier for the route (e.g. "codetry-assess")
 * @param maxRequests - Maximum requests allowed per window
 * @param windowMs    - Window duration in milliseconds
 */
export function createRouteLimiter(
  routeKey: string,
  maxRequests: number,
  windowMs: number,
) {
  return createRateLimiter(maxRequests, windowMs, routeKey);
}
