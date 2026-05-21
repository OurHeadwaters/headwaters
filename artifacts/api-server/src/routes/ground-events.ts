import { Router, type IRouter } from "express";
import { db, groundEventsTable, groundEventRsvpsTable } from "@workspace/db";
import { eq, sql, and, desc, asc, gte } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * GET /api/ground-events
 * Returns only approved (and not rejected) events.
 * Featured events appear first, then sorted chronologically.
 * Query params:
 *   limit  (1-50, default 20)
 *   offset (default 0)
 *   status "upcoming" — restrict to events whose event_date >= today
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
          eq(groundEventsTable.isRejected, false),
          gte(groundEventsTable.eventDate, today),
        )
      : and(
          eq(groundEventsTable.isApproved, true),
          eq(groundEventsTable.isRejected, false),
        );

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
 * Creates event with is_approved=false (pending moderation queue).
 *
 * Free events: ticketPriceCents omitted / null
 * Paid events (Stripe Connect): ticketPriceCents > 0, breakEvenTickets, platformSharePct (5|10|15)
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

    const externalUrl =
      typeof body.externalUrl === "string" && body.externalUrl.trim()
        ? body.externalUrl.trim().slice(0, 500)
        : null;

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

    // ── Stripe Connect payment fields ────────────────────────────────────────
    let ticketPriceCents: number | null = null;
    let breakEvenTickets = 0;
    let platformSharePct: number | null = null;

    if (body.ticketPriceCents !== undefined && body.ticketPriceCents !== null) {
      const v = Math.floor(Number(body.ticketPriceCents));
      if (!Number.isFinite(v) || v < 100) {
        res.status(400).json({ error: "ticketPriceCents must be ≥ 100 (= $1.00)" });
        return;
      }
      ticketPriceCents = v;
    }

    if (ticketPriceCents !== null) {
      const be = Math.max(0, Math.floor(Number(body.breakEvenTickets) || 0));
      breakEvenTickets = Number.isFinite(be) ? be : 0;

      const psp = Number(body.platformSharePct);
      if (![5, 10, 15].includes(psp)) {
        res.status(400).json({ error: "platformSharePct must be 5, 10, or 15" });
        return;
      }
      platformSharePct = psp;
    }

    const priceDisplay = ticketPriceCents
      ? `$${(ticketPriceCents / 100).toFixed(ticketPriceCents % 100 === 0 ? 0 : 2)}`
      : typeof body.priceDisplay === "string" && body.priceDisplay.trim()
      ? body.priceDisplay.trim().slice(0, 40)
      : "Free";

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
        externalUrl,
        seats,
        contactEmail,
        ticketPriceCents,
        breakEvenTickets,
        platformSharePct,
        isApproved: false,
        isFeatured: false,
        isRejected: false,
      })
      .returning();

    logger.info(
      { id: row.id, title, ticketPriceCents, platformSharePct },
      "ground-events: new submission (pending approval)",
    );
    res.status(201).json(row);
  } catch (err) {
    logger.error({ err }, "ground-events: POST failed");
    res.status(500).json({ error: "Failed to submit event" });
  }
});

/**
 * POST /api/ground-events/:id/rsvp
 * Record a free RSVP for an approved event.
 * For paid events use the /checkout endpoint instead.
 */
router.post("/ground-events/:id/rsvp", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid event id" });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const attendeeEmail =
      typeof body.attendeeEmail === "string" ? body.attendeeEmail.trim() : "";
    if (!attendeeEmail || !attendeeEmail.includes("@")) {
      res.status(400).json({ error: "attendeeEmail is required" });
      return;
    }
    const attendeeName =
      typeof body.attendeeName === "string" && body.attendeeName.trim()
        ? body.attendeeName.trim().slice(0, 120)
        : null;

    const [event] = await db
      .select()
      .from(groundEventsTable)
      .where(
        and(
          eq(groundEventsTable.id, id),
          eq(groundEventsTable.isApproved, true),
          eq(groundEventsTable.isRejected, false),
        ),
      )
      .limit(1);

    if (!event) {
      res.status(404).json({ error: "Event not found or not yet approved" });
      return;
    }

    if (event.ticketPriceCents && event.ticketPriceCents > 0 && event.stripeConnectedAccountId) {
      res.status(400).json({
        error: "This is a paid event — use the /checkout endpoint to purchase a ticket",
      });
      return;
    }

    const [rsvp, [updated]] = await Promise.all([
      db
        .insert(groundEventRsvpsTable)
        .values({ eventId: id, attendeeEmail, attendeeName })
        .returning(),
      db
        .update(groundEventsTable)
        .set({ rsvpCount: sql`${groundEventsTable.rsvpCount} + 1` })
        .where(eq(groundEventsTable.id, id))
        .returning(),
    ]);

    logger.info(
      { id, rsvpCount: updated.rsvpCount, attendeeEmail },
      "ground-events: RSVP recorded",
    );
    res.status(201).json({ eventId: id, rsvpCount: updated.rsvpCount, rsvpId: rsvp[0].id });
  } catch (err) {
    logger.error({ err }, "ground-events: POST /rsvp failed");
    res.status(500).json({ error: "Failed to record RSVP" });
  }
});

export default router;
