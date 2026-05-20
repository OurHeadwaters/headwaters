import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger";

/**
 * Middleware that allows only trusted editors to proceed.
 *
 * Two paths are accepted:
 *  1. A valid user session (populated by authMiddleware earlier in the chain).
 *  2. A matching `x-admin-secret` header whose value equals the ADMIN_SECRET
 *     environment variable (useful for scripts/CI; only active when the env
 *     var is set and non-empty).
 *
 * Everything else receives a 401.
 */
export function requireEditor(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.isAuthenticated()) {
    next();
    return;
  }

  const secret = process.env["ADMIN_SECRET"];
  if (secret && secret.length > 0) {
    const header = req.headers["x-admin-secret"];
    if (typeof header === "string" && header === secret) {
      next();
      return;
    }
  }

  logger.warn(
    { method: req.method, url: req.url },
    "requireEditor: unauthenticated request blocked",
  );
  res.status(401).json({ error: "Authentication required" });
}
