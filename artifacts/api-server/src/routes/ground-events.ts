import { Router, type IRouter } from "express";
import { db, groundEventsTable, groundEventRsvpsTable } from "@workspace/db";
import { eq, sql, and, desc, asc, gte, inArray, isNull, lt, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import { logger } from "../lib/logger";
import { sendRsvpNotification, sendHostConfirmationEmail } from "../lib/email";

const router: IRouter = Router();

/**
 * Public-safe column selection — explicitly excludes hostToken and internal
 * Stripe account identifiers so they are never returned to unauthenticated
 * callers via the public listing endpoint.
 */
const publicEventColumns = {
  id: groundEventsTable.id,
  title: groundEventsTable.title,
  description: groundEventsTable.description,
  hostName: groundEventsTable.hostName,
  eventDate: groundEventsTable.eventDate,
  location: groundEventsTable.location,
  isOnline: groundEventsTable.isOnline,
  priceDisplay: groundEventsTable.priceDisplay,
  externalUrl: groundEventsTable.externalUrl,
  seats: groundEventsTable.seats,
  contactEmail: groundEventsTable.contactEmail,
  isApproved: groundEventsTable.isApproved,
  isFeatured: groundEventsTable.isFeatured,
  isRejected: groundEventsTable.isRejected,
  rsvpCount: groundEventsTable.rsvpCount,
  ticketPriceCents: groundEventsTable.ticketPriceCents,
  breakEvenTickets: groundEventsTable.breakEvenTickets,
  platformSharePct: groundEventsTable.platformSharePct,
  // stripeConnectedAccountId intentionally omitted from public response — internal field.
  // isStripeReady reflects both: account ID exists AND charges are enabled (onboarding complete).
  // stripeChargesEnabled is persisted when the host's connect/status endpoint is polled.
  isStripeReady: groundEventsTable.stripeChargesEnabled,
  // hostToken intentionally omitted — auth credential
  transformationSlug: groundEventsTable.transformationSlug,
  zoneSlug: groundEventsTable.zoneSlug,
  familyFriendly: groundEventsTable.familyFriendly,
  createdAt: groundEventsTable.createdAt,
  updatedAt: groundEventsTable.updatedAt,
} as const;

/**
 * GET /api/ground-events
 * Returns only approved (and not rejected) events.
 * Featured events appear first, then sorted chronologically.
 * Query params:
 *   limit          (1-50, default 20)
 *   offset         (default 0)
 *   status         "upcoming" — restrict to events whose event_date >= today (YYYY-MM-DD)
 *   transformation — filter by transformation_slug
 *   sessionId      — stable device/session token; when provided each event gains hasRsvped boolean
 *
 * Auto-hide: sold-out events (rsvp_count >= seats, where seats is not null) are excluded.
 * Past events are excluded when status=upcoming (the default for public pages).
 */
router.get("/ground-events", async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const upcomingOnly = req.query.status === "upcoming";
    const transformationFilter =
      typeof req.query.transformation === "string" && req.query.transformation.trim()
        ? req.query.transformation.trim()
        : null;
    const zoneFilter =
      typeof req.query.zone === "string" && req.query.zone.trim()
        ? req.query.zone.trim()
        : null;
    const sessionId =
      typeof req.query.sessionId === "string" && req.query.sessionId.trim()
        ? req.query.sessionId.trim().slice(0, 128)
        : null;

    const today = new Date().toISOString().slice(0, 10);

    // Auto-hide sold-out events: only show where seats is null OR rsvp_count < seats
    const notSoldOut = or(
      isNull(groundEventsTable.seats),
      lt(groundEventsTable.rsvpCount, groundEventsTable.seats),
    );

    // Paid events are only visible once the host has completed Stripe Connect
    // (stripeChargesEnabled=true). Until then, the event exists in the DB but is
    // not surfaced publicly — attendees can't buy tickets from an incomplete account.
    const stripeGated = or(
      isNull(groundEventsTable.ticketPriceCents),
      eq(groundEventsTable.stripeChargesEnabled, true),
    );

    const baseConditions = [
      eq(groundEventsTable.isApproved, true),
      eq(groundEventsTable.isRejected, false),
      notSoldOut,
      stripeGated,
    ];

    if (upcomingOnly) {
      baseConditions.push(gte(groundEventsTable.eventDate, today));
    }
    if (transformationFilter) {
      baseConditions.push(eq(groundEventsTable.transformationSlug, transformationFilter));
    }
    if (zoneFilter) {
      baseConditions.push(eq(groundEventsTable.zoneSlug, zoneFilter));
    }

    const whereClause = and(...baseConditions);

    const [events, [{ count }]] = await Promise.all([
      db
        .select(publicEventColumns)
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

    // Paid events use platform Stripe Checkout — external URL is ignored/rejected.
    const rawExternalUrl =
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
        ? body.contactEmail.trim().toLowerCase().slice(0, 160)
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

    // ── Host management token ────────────────────────────────────────────────
    const hostToken = randomUUID();

    // Optional transformation path tag
    const transformationSlug =
      typeof body.transformationSlug === "string" && body.transformationSlug.trim()
        ? body.transformationSlug.trim().slice(0, 120)
        : null;

    // Optional zone tag
    const zoneSlug =
      typeof body.zoneSlug === "string" && body.zoneSlug.trim()
        ? body.zoneSlug.trim().slice(0, 30)
        : null;

    // Family-friendly flag
    const familyFriendly = body.familyFriendly === true || body.familyFriendly === "true";

    // Paid events use platform Stripe Checkout — external URL is not permitted.
    const externalUrl = ticketPriceCents ? null : rawExternalUrl;

    // Auto-approval rules:
    // - Free events go live immediately (no payment risk, Stripe identity not needed).
    // - Paid events go live immediately too (Stripe identity check happens during Connect onboarding;
    //   the event only accepts payments once stripe_charges_enabled is true).
    const isApproved = true;

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
        transformationSlug,
        zoneSlug,
        familyFriendly,
        hostToken,
        isApproved,
        isFeatured: false,
        isRejected: false,
      })
      .returning();

    logger.info(
      { id: row.id, title, ticketPriceCents, platformSharePct },
      "ground-events: new submission (pending approval)",
    );

    // Send host confirmation email with their private dashboard link.
    // This runs after the response-critical DB write so a failed email never
    // blocks the 201 response.  We update the flag in the background.
    if (contactEmail) {
      const appBaseUrl = (process.env.APP_BASE_URL ?? "https://www.thesurvivalpodcast.com").replace(/\/$/, "");
      const dashboardUrl = `${appBaseUrl}/workshops/dashboard?token=${row.hostToken}`;
      sendHostConfirmationEmail({
        hostEmail: contactEmail,
        hostName,
        eventTitle: title,
        eventDate: eventDate as string,
        dashboardUrl,
      }).then((sent) => {
        if (sent) {
          db.update(groundEventsTable)
            .set({ confirmationEmailSent: true })
            .where(eq(groundEventsTable.id, row.id))
            .catch((e: unknown) =>
              logger.error({ e, id: row.id }, "ground-events: failed to set confirmation_email_sent"),
            );
        }
      }).catch((e: unknown) =>
        logger.error({ e, id: row.id }, "ground-events: confirmation email promise rejected"),
      );
    }

    res.status(201).json(row);
  } catch (err) {
    logger.error({ err }, "ground-events: POST failed");
    res.status(500).json({ error: "Failed to submit event" });
  }
});

// In-memory rate-limit store: email → last resend timestamp (ms)
const resendCooldownMs = 10 * 60 * 1000; // 10 minutes
const resendLastSent = new Map<string, number>();

/**
 * POST /api/ground-events/resend-confirmation
 * Self-service: resend the host dashboard link to a contact email.
 * Body: { email: string }
 * Rate-limited to one resend per email per 10 minutes.
 * Always returns 200 (vague) so email enumeration is not possible.
 */
router.post("/ground-events/resend-confirmation", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !email.includes("@")) {
      res.status(400).json({ error: "A valid email address is required" });
      return;
    }

    // Rate-limit check
    const lastSent = resendLastSent.get(email) ?? 0;
    const now = Date.now();
    if (now - lastSent < resendCooldownMs) {
      const waitSecs = Math.ceil((resendCooldownMs - (now - lastSent)) / 1000);
      res.status(429).json({
        error: `Please wait ${waitSecs} seconds before requesting another resend`,
      });
      return;
    }

    // Look up all events for this email — case-insensitive via lower()
    const events = await db
      .select()
      .from(groundEventsTable)
      .where(sql`lower(${groundEventsTable.contactEmail}) = ${email}`)
      .orderBy(asc(groundEventsTable.eventDate));

    // Always record the attempt so spam is rate-limited even on no-match
    resendLastSent.set(email, now);

    if (events.length > 0) {
      const appBaseUrl = (
        process.env.APP_BASE_URL ?? "https://www.thesurvivalpodcast.com"
      ).replace(/\/$/, "");

      // Fire-and-forget: send one confirmation email per event
      for (const event of events) {
        if (!event.hostToken) continue;
        const dashboardUrl = `${appBaseUrl}/workshops/dashboard?token=${event.hostToken}`;
        sendHostConfirmationEmail({
          hostEmail: email,
          hostName: event.hostName,
          eventTitle: event.title,
          eventDate: event.eventDate,
          dashboardUrl,
        }).catch((e: unknown) =>
          logger.error({ e, eventId: event.id }, "ground-events: resend confirmation email failed"),
        );
      }

      logger.info({ email, eventCount: events.length }, "ground-events: dashboard link(s) resent");
    } else {
      logger.info({ email }, "ground-events: resend-confirmation — no events found for email");
    }

    // Return vague success regardless so callers can't enumerate emails
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "ground-events: POST /resend-confirmation failed");
    res.status(500).json({ error: "Failed to process resend request" });
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
 *                   When provided without a sessionId, deduplicated per (event, email).
 *   attendeeName  — attendee's display name (stored for host contact).
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

    // Paid events ALWAYS go through the /checkout endpoint.
    // Blocking unconditionally (not just when Stripe is connected) prevents
    // attendees from getting in free while the host is still finishing Connect setup.
    if (event.ticketPriceCents && event.ticketPriceCents > 0) {
      res.status(400).json({
        error: event.stripeConnectedAccountId
          ? "This is a paid event — use the /checkout endpoint to purchase a ticket"
          : "This event requires a paid ticket but Stripe Connect setup is not yet complete. Check back soon.",
      });
      return;
    }

    // With a sessionId: deduplicate by token — only count the first RSVP per token per event
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

    // No sessionId — deduplicate by email via unique index + onConflictDoNothing
    const result = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(groundEventRsvpsTable)
        .values({ eventId: id, attendeeEmail, attendeeName })
        .onConflictDoNothing()
        .returning();

      if (inserted.length === 0) {
        const [[existing], [current]] = await Promise.all([
          tx
            .select()
            .from(groundEventRsvpsTable)
            .where(
              and(
                eq(groundEventRsvpsTable.eventId, id),
                eq(groundEventRsvpsTable.attendeeEmail, attendeeEmail as string),
              ),
            )
            .limit(1),
          tx
            .select({ rsvpCount: groundEventsTable.rsvpCount })
            .from(groundEventsTable)
            .where(eq(groundEventsTable.id, id))
            .limit(1),
        ]);
        return { rsvpId: existing!.id, rsvpCount: current!.rsvpCount, duplicate: true };
      }


      const [updated] = await tx
        .update(groundEventsTable)
        .set({ rsvpCount: sql`${groundEventsTable.rsvpCount} + 1` })
        .where(eq(groundEventsTable.id, id))
        .returning({ rsvpCount: groundEventsTable.rsvpCount });

      return { rsvpId: inserted[0].id, rsvpCount: updated.rsvpCount, duplicate: false };
    });

    if (result.duplicate) {
      logger.info({ id, attendeeEmail }, "ground-events: duplicate RSVP ignored");
      res.status(200).json({ eventId: id, rsvpCount: result.rsvpCount, rsvpId: result.rsvpId, duplicate: true });
      return;
    }

    logger.info(
      { id, rsvpCount: result.rsvpCount, attendeeEmail },
      "ground-events: RSVP recorded",
    );
    if (event.contactEmail) {
      void sendRsvpNotification({
        hostEmail: event.contactEmail,
        hostName: event.hostName,
        eventTitle: event.title,
        eventDate: event.eventDate,
        attendeeName,
        attendeeEmail: attendeeEmail as string,
      });
    }

    res.status(201).json({ eventId: id, rsvpCount: result.rsvpCount, rsvpId: result.rsvpId });
  } catch (err) {
    logger.error({ err }, "ground-events: POST /rsvp failed");
    res.status(500).json({ error: "Failed to record RSVP" });
  }
});

/**
 * GET /api/ground-events/:id/manage
 * Returns the event and its RSVP list for the host, authenticated by hostToken.
 * Query params: token=<hostToken>
 */
router.get("/ground-events/:id/manage", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid event id" });
      return;
    }

    const token = typeof req.query.token === "string" ? req.query.token.trim() : "";
    if (!token) {
      res.status(401).json({ error: "Missing management token" });
      return;
    }

    const [event] = await db
      .select()
      .from(groundEventsTable)
      .where(eq(groundEventsTable.id, id))
      .limit(1);

    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    if (!event.hostToken || event.hostToken !== token) {
      res.status(403).json({ error: "Invalid management token" });
      return;
    }

    const rsvps = await db
      .select()
      .from(groundEventRsvpsTable)
      .where(eq(groundEventRsvpsTable.eventId, id))
      .orderBy(desc(groundEventRsvpsTable.createdAt));

    // Strip hostToken from the event before returning — it is the auth credential
    // and must not be echoed back in any response.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hostToken: _token, ...safeEvent } = event;
    res.json({ event: safeEvent, rsvps });
  } catch (err) {
    logger.error({ err }, "ground-events: GET /manage failed");
    res.status(500).json({ error: "Failed to load management data" });
  }
});

/**
 * GET /api/ground-events/:id/manage/rsvps.csv
 * Downloads the RSVP list as CSV for the host, authenticated by hostToken.
 * Query params: token=<hostToken>
 */
router.get("/ground-events/:id/manage/rsvps.csv", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid event id" });
      return;
    }

    const token = typeof req.query.token === "string" ? req.query.token.trim() : "";
    if (!token) {
      res.status(401).json({ error: "Missing management token" });
      return;
    }

    const [event] = await db
      .select()
      .from(groundEventsTable)
      .where(eq(groundEventsTable.id, id))
      .limit(1);

    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    if (!event.hostToken || event.hostToken !== token) {
      res.status(403).json({ error: "Invalid management token" });
      return;
    }

    const rsvps = await db
      .select()
      .from(groundEventRsvpsTable)
      .where(eq(groundEventRsvpsTable.eventId, id))
      .orderBy(desc(groundEventRsvpsTable.createdAt));

    const safeTitle = event.title.replace(/[^a-z0-9]/gi, "_").slice(0, 40);
    const filename = `rsvps_${id}_${safeTitle}.csv`;

    const csvEscape = (v: string | null | undefined): string => {
      if (v == null) return "";
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const header = "id,attendee_name,attendee_email,rsvp_date\n";
    const rows = rsvps
      .map(
        (r) =>
          [
            r.id,
            csvEscape(r.attendeeName),
            csvEscape(r.attendeeEmail),
            csvEscape(r.createdAt.toISOString()),
          ].join(","),
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(header + rows);

    logger.info({ id, count: rsvps.length }, "ground-events: host CSV exported");
  } catch (err) {
    logger.error({ err }, "ground-events: GET /manage/rsvps.csv failed");
    res.status(500).json({ error: "Failed to export RSVPs" });
  }
});

/**
 * GET /api/ground-events/by-host?token=<hostToken>
 * Returns all events belonging to the host identified by any one of their
 * event host tokens.  Resolves host identity via contactEmail — all events
 * that share the same contactEmail as the token-owning event are returned.
 * If contactEmail is null, only the single token-matching event is returned.
 *
 * This is the foundation for the multi-event host dashboard.
 * The hostToken field is stripped from each returned event.
 */
router.get("/ground-events/by-host", async (req, res) => {
  try {
    const token =
      typeof req.query.token === "string" ? req.query.token.trim() : "";
    if (!token) {
      res.status(401).json({ error: "Missing host token" });
      return;
    }

    // Find the event that owns this token — establishes host identity
    const [seed] = await db
      .select()
      .from(groundEventsTable)
      .where(eq(groundEventsTable.hostToken, token))
      .limit(1);

    if (!seed) {
      res.status(403).json({ error: "Invalid host token" });
      return;
    }

    // Collect all events for this host.
    // If contactEmail is set, return everything with that email.
    // Otherwise fall back to just the seed event.
    const allEvents = seed.contactEmail
      ? await db
          .select()
          .from(groundEventsTable)
          .where(eq(groundEventsTable.contactEmail, seed.contactEmail))
          .orderBy(asc(groundEventsTable.eventDate))
      : [seed];

    // Strip the host token before sending — it is an auth credential
    const safe = allEvents.map(({ hostToken: _tok, ...rest }) => rest);

    res.json({ events: safe });
  } catch (err) {
    logger.error({ err }, "ground-events: GET /by-host failed");
    res.status(500).json({ error: "Failed to load host events" });
  }
});

/**
 * PATCH /api/ground-events/:id/manage
 * Host-authenticated partial update for event details.
 * Only fields that a host should be able to change post-submission are accepted.
 * Body: { token, title?, description?, eventDate?, location?, seats?, externalUrl? }
 */
router.patch("/ground-events/:id/manage", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid event id" });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token) {
      res.status(401).json({ error: "Missing host token" });
      return;
    }

    const [event] = await db
      .select()
      .from(groundEventsTable)
      .where(eq(groundEventsTable.id, id))
      .limit(1);

    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    if (!event.hostToken || event.hostToken !== token) {
      res.status(403).json({ error: "Invalid host token" });
      return;
    }

    const updates: Partial<typeof groundEventsTable.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof body.title === "string") {
      const t = body.title.trim();
      if (t.length < 3 || t.length > 120) {
        res.status(400).json({ error: "title must be 3–120 characters" });
        return;
      }
      updates.title = t;
    }
    if (typeof body.description === "string") {
      const d = body.description.trim();
      if (d.length < 10 || d.length > 2000) {
        res.status(400).json({ error: "description must be 10–2000 characters" });
        return;
      }
      updates.description = d;
    }
    if (typeof body.eventDate === "string" && body.eventDate.trim()) {
      updates.eventDate = body.eventDate.trim();
    }
    if (typeof body.location === "string" && body.location.trim().length >= 2) {
      updates.location = body.location.trim();
    }
    if (body.seats !== undefined) {
      const s =
        typeof body.seats === "number"
          ? Math.floor(body.seats)
          : typeof body.seats === "string"
          ? parseInt(body.seats, 10)
          : NaN;
      updates.seats = Number.isFinite(s) && s > 0 ? s : null;
    }
    if (typeof body.externalUrl === "string") {
      const u = body.externalUrl.trim();
      updates.externalUrl = u.length > 0 ? u.slice(0, 500) : null;
    }
    if (typeof body.zoneSlug === "string") {
      const zs = body.zoneSlug.trim();
      updates.zoneSlug = zs.length > 0 ? zs.slice(0, 30) : null;
    }
    if (typeof body.transformationSlug === "string") {
      const slug = body.transformationSlug.trim();
      updates.transformationSlug = slug.length > 0 ? slug.slice(0, 120) : null;
    }
    if (typeof body.familyFriendly === "boolean") {
      updates.familyFriendly = body.familyFriendly;
    }

    const [updated] = await db
      .update(groundEventsTable)
      .set(updates)
      .where(eq(groundEventsTable.id, id))
      .returning();

    logger.info({ id, updates: Object.keys(updates) }, "ground-events: host PATCH applied");

    // Strip hostToken from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hostToken: _tok, ...safeUpdated } = updated;
    res.json(safeUpdated);
  } catch (err) {
    logger.error({ err }, "ground-events: PATCH /manage failed");
    res.status(500).json({ error: "Failed to update event" });
  }
});

export default router;
