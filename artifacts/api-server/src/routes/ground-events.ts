import { Router, type IRouter } from "express";
import { db, groundEventsTable, groundEventRsvpsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * GET /api/ground-events
 * Returns upcoming (and recent past) public events.
 * Query params:
 *   status  ("upcoming" | "past" | "all", default "upcoming")
 *   limit   (1-50, default 20)
 *   offset  (default 0)
 */
router.get("/ground-events", async (req, res) => {
  try {
    const statusFilter = (req.query.status as string) ?? "upcoming";
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const offset = Math.max(0, Number(req.query.offset) || 0);

    const baseQuery = db
      .select()
      .from(groundEventsTable)
      .orderBy(desc(groundEventsTable.eventDate), desc(groundEventsTable.createdAt));

    let rows;
    if (statusFilter === "all") {
      rows = await baseQuery.limit(limit).offset(offset);
    } else {
      rows = await baseQuery
        .where(eq(groundEventsTable.status, statusFilter))
        .limit(limit)
        .offset(offset);
    }

    const [{ count }] = await (statusFilter === "all"
      ? db.select({ count: sql<number>`count(*)::int` }).from(groundEventsTable)
      : db
          .select({ count: sql<number>`count(*)::int` })
          .from(groundEventsTable)
          .where(eq(groundEventsTable.status, statusFilter)));

    res.json({ events: rows, total: count, limit, offset });
  } catch (err) {
    logger.error({ err }, "ground-events: GET failed");
    res.status(500).json({ error: "Failed to load events" });
  }
});

/**
 * POST /api/ground-events
 * Public submission — "Host a Workshop" form.
 * Body: { title, description, hostName, location, eventDate, priceCents?, currency?, capacity?, tags?, externalUrl? }
 * Creates event with status "upcoming" (pending admin review — admin can change).
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
      res
        .status(400)
        .json({ error: "description must be at least 10 characters" });
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

    const location =
      typeof body.location === "string" ? body.location.trim() : "";
    if (!location || location.length < 2) {
      res.status(400).json({ error: "location is required" });
      return;
    }

    const eventDate =
      typeof body.eventDate === "string" ? body.eventDate.trim() : "";
    if (!eventDate) {
      res.status(400).json({ error: "eventDate is required" });
      return;
    }

    const priceCents =
      typeof body.priceCents === "number" && body.priceCents >= 0
        ? Math.floor(body.priceCents)
        : 0;

    const currency =
      typeof body.currency === "string" && body.currency.trim()
        ? body.currency.trim().toUpperCase().slice(0, 8)
        : "USD";

    const capacity =
      typeof body.capacity === "number" && body.capacity > 0
        ? Math.floor(body.capacity)
        : null;

    const tags =
      typeof body.tags === "string" && body.tags.trim()
        ? body.tags.trim().slice(0, 200)
        : null;

    const externalUrl =
      typeof body.externalUrl === "string" && body.externalUrl.trim()
        ? body.externalUrl.trim().slice(0, 500)
        : null;

    const [row] = await db
      .insert(groundEventsTable)
      .values({
        title,
        description,
        hostName,
        location,
        eventDate,
        priceCents,
        currency,
        capacity,
        tags,
        externalUrl,
        status: "upcoming",
      })
      .returning();

    logger.info({ id: row.id, title }, "ground-events: new event submitted");
    res.status(201).json(row);
  } catch (err) {
    logger.error({ err }, "ground-events: POST failed");
    res.status(500).json({ error: "Failed to submit event" });
  }
});

/**
 * POST /api/ground-events/:id/rsvp
 * RSVP to an event — anonymous via sessionId.
 * Body: { sessionId, attendeeName?, attendeeEmail? }
 * One RSVP per sessionId per event.
 */
router.post("/ground-events/:id/rsvp", async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    if (!Number.isFinite(eventId)) {
      res.status(400).json({ error: "Invalid event id" });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const sessionId =
      typeof body.sessionId === "string" && body.sessionId.trim()
        ? body.sessionId.trim().slice(0, 64)
        : null;
    if (!sessionId) {
      res.status(400).json({ error: "sessionId is required" });
      return;
    }

    const [event] = await db
      .select()
      .from(groundEventsTable)
      .where(
        and(
          eq(groundEventsTable.id, eventId),
          eq(groundEventsTable.status, "upcoming"),
        ),
      )
      .limit(1);

    if (!event) {
      res
        .status(404)
        .json({ error: "Event not found or no longer accepting RSVPs" });
      return;
    }

    if (event.capacity !== null && event.rsvpCount >= event.capacity) {
      res.status(409).json({ error: "Event is at capacity" });
      return;
    }

    const existing = await db
      .select({ id: groundEventRsvpsTable.id })
      .from(groundEventRsvpsTable)
      .where(
        and(
          eq(groundEventRsvpsTable.eventId, eventId),
          eq(groundEventRsvpsTable.sessionId, sessionId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      res
        .status(409)
        .json({ error: "You have already RSVPed to this event", alreadyRsvped: true });
      return;
    }

    const attendeeName =
      typeof body.attendeeName === "string" && body.attendeeName.trim()
        ? body.attendeeName.trim().slice(0, 80)
        : null;

    const attendeeEmail =
      typeof body.attendeeEmail === "string" && body.attendeeEmail.trim()
        ? body.attendeeEmail.trim().slice(0, 160)
        : null;

    await db
      .insert(groundEventRsvpsTable)
      .values({ eventId, sessionId, attendeeName, attendeeEmail });

    const [updated] = await db
      .update(groundEventsTable)
      .set({ rsvpCount: sql`${groundEventsTable.rsvpCount} + 1` })
      .where(eq(groundEventsTable.id, eventId))
      .returning();

    logger.info({ eventId, rsvpCount: updated.rsvpCount }, "ground-events: RSVP recorded");
    res.status(201).json({ eventId, rsvpCount: updated.rsvpCount });
  } catch (err) {
    logger.error({ err }, "ground-events: POST /rsvp failed");
    res.status(500).json({ error: "Failed to record RSVP" });
  }
});

export default router;
