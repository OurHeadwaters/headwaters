import { type Request, type Response, type NextFunction } from "express";
import { db, membershipsTable } from "@workspace/db";
import { and, eq, gt } from "drizzle-orm";

/**
 * Middleware: requires an active Brigade membership.
 *
 * Checks the authenticated user has a row in `memberships` where:
 *   status = 'active'   AND   current_period_end > now()
 *
 * Returns:
 *   401 if not authenticated
 *   403 if authenticated but not a Brigade member (includes upgrade hint)
 */
export async function requireBrigade(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const [membership] = await db
    .select({ id: membershipsTable.id })
    .from(membershipsTable)
    .where(
      and(
        eq(membershipsTable.userId, req.user.id),
        eq(membershipsTable.status, "active"),
        gt(membershipsTable.currentPeriodEnd, new Date()),
      ),
    )
    .limit(1);

  if (!membership) {
    res.status(403).json({
      error: "Brigade membership required",
      upgradeUrl: "/brigade",
      code: "BRIGADE_REQUIRED",
    });
    return;
  }

  next();
}
