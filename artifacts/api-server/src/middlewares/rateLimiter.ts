import type { Request, Response, NextFunction } from "express";

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

/**
 * Creates a simple IP-based in-memory rate limiter middleware.
 *
 * @param maxRequests - Maximum requests allowed per window
 * @param windowMs    - Window duration in milliseconds
 */
export function createRateLimiter(maxRequests: number, windowMs: number) {
  // Periodically prune expired entries so the map doesn't grow unboundedly.
  setInterval(() => {
    const now = Date.now();
    for (const [key, win] of store.entries()) {
      if (now >= win.resetAt) store.delete(key);
    }
  }, windowMs).unref();

  return function rateLimiter(req: Request, res: Response, next: NextFunction): void {
    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
      req.socket.remoteAddress ??
      "unknown";

    const now = Date.now();
    let win = store.get(ip);

    if (!win || now >= win.resetAt) {
      win = { count: 1, resetAt: now + windowMs };
      store.set(ip, win);
      next();
      return;
    }

    win.count += 1;

    if (win.count > maxRequests) {
      const retryAfter = Math.ceil((win.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({
        error: "Too many requests. Please wait before trying again.",
      });
      return;
    }

    next();
  };
}
