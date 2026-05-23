import { Router, type IRouter } from "express";
import { db, groundEventsTable, groundEventRsvpsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireEditor } from "../middlewares/requireEditor";

const router: IRouter = Router();

/**
 * GET /api/admin/ground-events/hosts
 * Returns a read-only host directory: one row per unique host (by contactEmail or hostName),
 * with their Stripe Connect status and event count. No approval action — Stripe handles identity.
 */
router.get("/admin/ground-events/hosts", requireEditor, async (_req, res) => {
  try {
    const rows = await db
      .select({
        hostName: groundEventsTable.hostName,
        contactEmail: groundEventsTable.contactEmail,
        eventCount: sql<number>`count(*)::int`,
        stripeConnected: sql<boolean>`bool_or(${groundEventsTable.stripeChargesEnabled})`,
        firstEvent: sql<string>`min(${groundEventsTable.eventDate})`,
        latestEvent: sql<string>`max(${groundEventsTable.eventDate})`,
        totalRsvps: sql<number>`sum(${groundEventsTable.rsvpCount})::int`,
      })
      .from(groundEventsTable)
      .groupBy(groundEventsTable.hostName, groundEventsTable.contactEmail)
      .orderBy(desc(sql`count(*)`));

    res.json(rows);
  } catch (err) {
    logger.error({ err }, "admin-ground-events: GET /hosts failed");
    res.status(500).json({ error: "Failed to load host directory" });
  }
});

/**
 * GET /api/admin/ground-events
 * Returns all events (pending + approved + rejected), ordered newest first.
 */
router.get("/admin/ground-events", requireEditor, async (_req, res) => {
  try {
    const events = await db
      .select()
      .from(groundEventsTable)
      .orderBy(desc(groundEventsTable.createdAt));

    res.json(events);
  } catch (err) {
    logger.error({ err }, "admin-ground-events: GET failed");
    res.status(500).json({ error: "Failed to load events" });
  }
});

/**
 * GET /api/admin/ground-events/:id/rsvps
 * Returns the RSVP list for a given event as JSON.
 */
router.get("/admin/ground-events/:id/rsvps", requireEditor, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid event id" });
      return;
    }

    const rsvps = await db
      .select()
      .from(groundEventRsvpsTable)
      .where(eq(groundEventRsvpsTable.eventId, id))
      .orderBy(desc(groundEventRsvpsTable.createdAt));

    res.json(rsvps);
  } catch (err) {
    logger.error({ err }, "admin-ground-events: GET /rsvps failed");
    res.status(500).json({ error: "Failed to load RSVPs" });
  }
});

/**
 * GET /api/admin/ground-events/:id/rsvps.csv
 * Streams the RSVP list for a given event as a CSV download.
 */
router.get("/admin/ground-events/:id/rsvps.csv", requireEditor, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid event id" });
      return;
    }

    const [event, rsvps] = await Promise.all([
      db
        .select({ title: groundEventsTable.title })
        .from(groundEventsTable)
        .where(eq(groundEventsTable.id, id))
        .limit(1),
      db
        .select()
        .from(groundEventRsvpsTable)
        .where(eq(groundEventRsvpsTable.eventId, id))
        .orderBy(desc(groundEventRsvpsTable.createdAt)),
    ]);

    if (!event[0]) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const safeTitle = event[0].title.replace(/[^a-z0-9]/gi, "_").slice(0, 40);
    const filename = `rsvps_${id}_${safeTitle}.csv`;

    const csvEscape = (v: string | null | undefined): string => {
      if (v == null) return "";
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const header = "id,attendee_name,attendee_email,payment_status,amount_paid_cents,stripe_session_id,rsvp_date\n";
    const rows = rsvps
      .map(
        (r) =>
          [
            r.id,
            csvEscape(r.attendeeName),
            csvEscape(r.attendeeEmail),
            csvEscape(r.paymentStatus),
            r.amountPaidCents ?? "",
            csvEscape(r.stripeCheckoutSessionId),
            csvEscape(r.createdAt.toISOString()),
          ].join(","),
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(header + rows);

    logger.info({ id, count: rsvps.length }, "admin-ground-events: CSV exported");
  } catch (err) {
    logger.error({ err }, "admin-ground-events: GET /rsvps.csv failed");
    res.status(500).json({ error: "Failed to export RSVPs" });
  }
});

/**
 * PATCH /api/admin/ground-events/:id
 * Approve, feature, reject, or unfeature an event.
 *
 * Action shortcuts (body: { action: "..." }):
 *   "approve"   — is_approved=true, is_rejected=false
 *   "feature"   — is_approved=true, is_featured=true, is_rejected=false
 *   "reject"    — is_approved=false, is_featured=false, is_rejected=true
 *   "unfeature" — is_featured=false (stays approved)
 *
 * Or pass explicit fields for other edits (title, description, etc.)
 */
router.patch("/admin/ground-events/:id", requireEditor, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid event id" });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const updates: Partial<typeof groundEventsTable.$inferInsert> = {
      updatedAt: new Date(),
    };

    if ("action" in body) {
      const action = body.action as string;
      if (action === "approve") {
        updates.isApproved = true;
        updates.isRejected = false;
      } else if (action === "feature") {
        updates.isApproved = true;
        updates.isFeatured = true;
        updates.isRejected = false;
      } else if (action === "reject") {
        updates.isApproved = false;
        updates.isFeatured = false;
        updates.isRejected = true;
      } else if (action === "unfeature") {
        updates.isFeatured = false;
      } else {
        res.status(400).json({
          error: "Unknown action. Valid: approve, feature, reject, unfeature",
        });
        return;
      }
    } else {
      if ("isApproved" in body) updates.isApproved = Boolean(body.isApproved);
      if ("isFeatured" in body) updates.isFeatured = Boolean(body.isFeatured);
      if ("isRejected" in body) updates.isRejected = Boolean(body.isRejected);

      if ("title" in body) {
        const v = typeof body.title === "string" ? body.title.trim() : "";
        if (!v || v.length < 3) {
          res.status(400).json({ error: "title must be at least 3 characters" });
          return;
        }
        updates.title = v;
      }
      if ("description" in body) {
        const v = typeof body.description === "string" ? body.description.trim() : "";
        if (!v || v.length < 10) {
          res.status(400).json({ error: "description must be at least 10 characters" });
          return;
        }
        updates.description = v;
      }
      if ("hostName" in body) {
        const v = typeof body.hostName === "string" ? body.hostName.trim() : "";
        if (!v) { res.status(400).json({ error: "hostName cannot be empty" }); return; }
        updates.hostName = v;
      }
      if ("eventDate" in body) {
        const v = typeof body.eventDate === "string" ? body.eventDate.trim() : "";
        if (!v) { res.status(400).json({ error: "eventDate cannot be empty" }); return; }
        updates.eventDate = v;
      }
      if ("location" in body) {
        const v = typeof body.location === "string" ? body.location.trim() : "";
        if (!v) { res.status(400).json({ error: "location cannot be empty" }); return; }
        updates.location = v;
      }
      if ("isOnline" in body) updates.isOnline = Boolean(body.isOnline);
      if ("priceDisplay" in body) {
        updates.priceDisplay =
          typeof body.priceDisplay === "string"
            ? body.priceDisplay.trim().slice(0, 40) || "Free"
            : "Free";
      }
      if ("externalUrl" in body) {
        updates.externalUrl =
          typeof body.externalUrl === "string" && body.externalUrl.trim()
            ? body.externalUrl.trim().slice(0, 500)
            : null;
      }
      if ("seats" in body) {
        updates.seats =
          body.seats === null ? null : Math.max(1, Math.floor(Number(body.seats)));
      }
      if ("contactEmail" in body) {
        updates.contactEmail =
          typeof body.contactEmail === "string"
            ? body.contactEmail.trim().slice(0, 160) || null
            : null;
      }
    }

    const [row] = await db
      .update(groundEventsTable)
      .set(updates)
      .where(eq(groundEventsTable.id, id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    logger.info({ id, updates }, "admin-ground-events: event updated");
    res.json(row);
  } catch (err) {
    logger.error({ err }, "admin-ground-events: PATCH failed");
    res.status(500).json({ error: "Failed to update event" });
  }
});

/**
 * DELETE /api/admin/ground-events/:id
 * Hard-delete an event (cascades to RSVPs).
 */
router.delete("/admin/ground-events/:id", requireEditor, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid event id" });
      return;
    }
    await db.delete(groundEventsTable).where(eq(groundEventsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "admin-ground-events: DELETE failed");
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export default router;
