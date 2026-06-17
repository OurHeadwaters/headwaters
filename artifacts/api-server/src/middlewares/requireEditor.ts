import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger";

/**
 * Returns the set of approved admin user IDs from the ADMIN_USER_IDS env var.
 * The value is a comma-separated list of Replit user ID strings.
 * If the env var is not set or is empty, the returned Set is empty (no admins).
 */
function getAdminIds(): Set<string> {
  const raw = process.env["ADMIN_USER_IDS"] ?? "";
  if (!raw.trim()) return new Set();
  return new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

/**
 * Middleware that allows only approved admin accounts to proceed.
 *
 * Three paths are evaluated in order:
 *  1. A valid user session (populated by authMiddleware) whose user.id appears
 *     in the ADMIN_USER_IDS environment variable (comma-separated list of
 *     Replit user IDs).  → 200 / next()
 *  2. A matching `x-admin-secret` header whose value equals the ADMIN_SECRET
 *     environment variable (useful for scripts/CI; only active when the env
 *     var is set and non-empty).  → 200 / next()
 *
 * Everything else is rejected:
 *  - Authenticated users whose ID is not in the allowlist → 403 Forbidden
 *  - Unauthenticated requests → 401 Unauthorized
 */
export function requireEditor(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.isAuthenticated()) {
    const adminIds = getAdminIds();
    if (adminIds.size > 0 && !adminIds.has(req.user.id)) {
      logger.warn(
        { method: req.method, url: req.url, userId: req.user.id },
        "requireEditor: authenticated user is not in the admin allowlist",
      );
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    if (adminIds.size === 0) {
      logger.warn(
        { method: req.method, url: req.url },
        "requireEditor: ADMIN_USER_IDS is not set — no users are authorized as admins",
      );
      res.status(403).json({ error: "Forbidden" });
      return;
    }
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

/**
 * Returns true if the given user ID is in the ADMIN_USER_IDS allowlist.
 * Used by routes that want to expose the isAdmin flag to clients.
 */
export function isAdminUser(userId: string): boolean {
  const adminIds = getAdminIds();
  return adminIds.size > 0 && adminIds.has(userId);
}
