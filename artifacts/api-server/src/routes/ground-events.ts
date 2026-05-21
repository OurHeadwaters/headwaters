import { Router, type IRouter } from "express";
import { db, groundEventsTable, groundEventRsvpsTable } from "@workspace/db";
import { eq, sql, and, desc, asc, gte, inArray } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * GET /api/ground-events
 * Returns only approved (and not rejected) events.
 * Featured events appear first, then sorted chronologically.
 * Query params:
 *   limit     (1-50, default 20)
 *   offset    (default 0)
 *   status    "upcoming" — restrict to events whose event_date >= today (YYYY-MM-DD)
 *   sessionId — stable device/session token; when provided each event gains hasRsvped boolean
 */
router.get("/ground-events", async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const upcomingOnly = req.query.status === "upcoming";
    const sessionId =
      typeof req.query.sessionId === "string" && req.query.sessionId.trim()
        ? req.query.sessionId.trim().slice(0, 128)
        : null;

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

    // If a sessionId was provided, look up which of these events the session has RSVPed
    let rsvpedEventIds = new Set<number>();
    if (sessionId && events.length > 0) {
      const eventIds = events.map((e) => e.id);
      const rsvpRows = await db
        .select({ eventId: groundEventRsvpsTable.eventId })
        .from(groundEventRsvpsTable)
        .where(
          and(
            inArray(groundEventRsvpsTable.eventId, eventIds),
            eq(groundEventRsvpsTable.token, sessionId),
          ),
        );
      rsvpedEventIds = new Set(rsvpRows.map((r) => r.eventId));
    }

    const eventsWithRsvp = events.map((e) => ({
      ...e,
      hasRsvped: rsvpedEventIds.has(e.id),
    }));

    res.json({ events: eventsWithRsvp, total: count, limit, offset });
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
 * Idempotent free RSVP for an approved event.
 * For paid events use the /checkout endpoint instead.
 * Body (all optional):
 *   sessionId     — stable device/session token for deduplication; a given token can only
 *                   increment rsvp_count once per event regardless of reinstalls.
 *   attendeeEmail — attendee's email so the host can follow up (stored for host contact).
 *   attendeeName  — attendee's display name (stored for host contact).
 * When sessionId is present, duplicate RSVPs from the same token are silently ignored.
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
    const attendeeEmail =
      typeof body.attendeeEmail === "string" && body.attendeeEmail.trim()
        ? body.attendeeEmail.trim().slice(0, 254)
        : null;
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

    // Paid events must go through the /checkout endpoint
    if (event.ticketPriceCents && event.ticketPriceCents > 0 && event.stripeConnectedAccountId) {
      res.status(400).json({
        error: "This is a paid event — use the /checkout endpoint to purchase a ticket",
      });
      return;
    }

    // With a sessionId: deduplicate — only count the first RSVP per token per event
    if (sessionId) {
      const existing = await db
        .select({ id: groundEventRsvpsTable.id })
        .from(groundEventRsvpsTable)
        .where(
          and(
            eq(groundEventRsvpsTable.eventId, id),
            eq(groundEventRsvpsTable.token, sessionId),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        // Already RSVPed — return current count without incrementing
        logger.info({ id, sessionId, rsvpCount: event.rsvpCount }, "ground-events: duplicate RSVP ignored");
        res.status(200).json({ eventId: id, rsvpCount: event.rsvpCount, alreadyRsvped: true });
        return;
      }

      // New RSVP — record the token (+ optional contact info) and increment counter atomically
      const [updated] = await db.transaction(async (tx) => {
        await tx.insert(groundEventRsvpsTable).values({
          eventId: id,
          token: sessionId,
          attendeeEmail,
          attendeeName,
        });
        return tx
          .update(groundEventsTable)
          .set({ rsvpCount: sql`${groundEventsTable.rsvpCount} + 1` })
          .where(eq(groundEventsTable.id, id))
          .returning();
      });

      logger.info({ id, sessionId, rsvpCount: updated.rsvpCount }, "ground-events: RSVP recorded");
      res.status(201).json({ eventId: id, rsvpCount: updated.rsvpCount, alreadyRsvped: false });
      return;
    }

    // No sessionId — email-based or anonymous RSVP, no deduplication
    const [rsvpRow, [updated]] = await Promise.all([
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
      { id, attendeeEmail, rsvpCount: updated.rsvpCount },
      "ground-events: RSVP recorded",
    );
    res.status(201).json({
      eventId: id,
      rsvpCount: updated.rsvpCount,
      rsvpId: rsvpRow[0].id,
      alreadyRsvped: false,
    });
  } catch (err) {
    logger.error({ err }, "ground-events: POST /rsvp failed");
    res.status(500).json({ error: "Failed to record RSVP" });
  }
});

export default router;
