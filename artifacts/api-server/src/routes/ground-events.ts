import { Router, type IRouter } from "express";
import { db, groundEventsTable } from "@workspace/db";
import { eq, sql, and, desc, asc, gte } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * GET /api/ground-events
 * Returns only approved events.
 * Featured events appear first, then sorted chronologically by event_date.
 * Query params:
 *   limit  (1-50, default 20)
 *   offset (default 0)
 *   status "upcoming" — restrict to events whose event_date >= today (YYYY-MM-DD)
 */
router.get("/ground-events", async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const upcomingOnly = req.query.status === "upcoming";

    const today = new Date().toISOString().slice(0, 10);

    const whereClause = upcomingOnly
      ? and(
          eq(groundEventsTable.isApproved, true),
          gte(groundEventsTable.eventDate, today),
        )
      : eq(groundEventsTable.isApproved, true);

    const [events, [{ count }]] = await Promise.all([
      db
        .select()
        .from(groundEventsTable)
        .where(whereClause)
        .orderBy(
          desc(groundEventsTable.isFeatured),
          asc(groundEventsTable.eventDate),
          asc(groundEventsTable.createdAt),
        )
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(groundEventsTable)
        .where(whereClause),
    ]);

    res.json({ events, total: count, limit, offset });
  } catch (err) {
    logger.error({ err }, "ground-events: GET failed");
    res.status(500).json({ error: "Failed to load events" });
  }
});

/**
 * POST /api/ground-events
 * Public submission — "Host a Workshop" form.
 * Creates event with is_approved=false (pending queue).
 * Body: { title, description, hostName, eventDate, location, isOnline?, priceDisplay?, seats?, contactEmail? }
 */
router.post("/ground-events", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title || title.length < 3) {
      res.status(400).json({ error: "title must be at least 3 characters" });
      return;
    }
    if (title.length > 120) {
      res.status(400).json({ error: "title must be 120 characters or fewer" });
      return;
    }

    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    if (!description || description.length < 10) {
      res.status(400).json({ error: "description must be at least 10 characters" });
      return;
    }
    if (description.length > 2000) {
      res.status(400).json({ error: "description must be 2000 chars or fewer" });
      return;
    }

    const hostName =
      typeof body.hostName === "string" ? body.hostName.trim() : "";
    if (!hostName || hostName.length < 2) {
      res.status(400).json({ error: "hostName is required" });
      return;
    }

    const eventDate =
      typeof body.eventDate === "string" ? body.eventDate.trim() : "";
    if (!eventDate) {
      res.status(400).json({ error: "eventDate is required" });
      return;
    }

    const location =
      typeof body.location === "string" ? body.location.trim() : "";
    if (!location || location.length < 2) {
      res.status(400).json({ error: "location is required" });
      return;
    }

    const isOnline = body.isOnline === true || body.isOnline === "true";

    const priceDisplay =
      typeof body.priceDisplay === "string" && body.priceDisplay.trim()
        ? body.priceDisplay.trim().slice(0, 40)
        : "Free";

    const seats =
      typeof body.seats === "number" && body.seats > 0
        ? Math.floor(body.seats)
        : typeof body.seats === "string" && parseInt(body.seats, 10) > 0
        ? parseInt(body.seats, 10)
        : null;

    const contactEmail =
      typeof body.contactEmail === "string" && body.contactEmail.trim()
        ? body.contactEmail.trim().slice(0, 160)
        : null;

    const [row] = await db
      .insert(groundEventsTable)
      .values({
        title,
        description,
        hostName,
        eventDate,
        location,
        isOnline,
        priceDisplay,
        seats,
        contactEmail,
        isApproved: false,
        isFeatured: false,
      })
      .returning();

    logger.info({ id: row.id, title }, "ground-events: new submission (pending approval)");
    res.status(201).json(row);
  } catch (err) {
    logger.error({ err }, "ground-events: POST failed");
    res.status(500).json({ error: "Failed to submit event" });
  }
});

/**
 * POST /api/ground-events/:id/rsvp
 * Increment rsvp_count on an approved event.
 * Body (optional): { sessionId?: string } — a stable device/session identifier
 *   that is logged alongside the RSVP for attribution. Clients that do not send
 *   a sessionId are still accepted (anonymous RSVP). Server-side deduplication
 *   per session is not yet implemented; clients should gate repeat calls locally.
 */
router.post("/ground-events/:id/rsvp", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid event id" });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const sessionId =
      typeof body.sessionId === "string" && body.sessionId.trim()
        ? body.sessionId.trim().slice(0, 128)
        : null;

    const [event] = await db
      .select()
      .from(groundEventsTable)
      .where(
        and(
          eq(groundEventsTable.id, id),
          eq(groundEventsTable.isApproved, true),
        ),
      )
      .limit(1);

    if (!event) {
      res.status(404).json({ error: "Event not found or not yet approved" });
      return;
    }

    const [updated] = await db
      .update(groundEventsTable)
      .set({ rsvpCount: sql`${groundEventsTable.rsvpCount} + 1` })
      .where(eq(groundEventsTable.id, id))
      .returning();

    logger.info({ id, sessionId, rsvpCount: updated.rsvpCount }, "ground-events: RSVP recorded");
    res.status(201).json({ eventId: id, rsvpCount: updated.rsvpCount });
  } catch (err) {
    logger.error({ err }, "ground-events: POST /rsvp failed");
    res.status(500).json({ error: "Failed to record RSVP" });
  }
});

export default router;
