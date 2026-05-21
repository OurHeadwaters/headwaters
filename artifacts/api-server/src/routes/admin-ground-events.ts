import { Router, type IRouter } from "express";
import { db, groundEventsTable, groundEventRsvpsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireEditor } from "../middlewares/requireEditor";

const router: IRouter = Router();

const VALID_STATUSES = ["upcoming", "past", "cancelled"];

/**
 * GET /api/admin/ground-events
 * Returns all events, ordered newest first, with RSVP counts.
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
 * PATCH /api/admin/ground-events/:id
 * Update any field on an event (title, description, status, date, price, etc.).
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

    if ("title" in body) {
      const v = typeof body.title === "string" ? body.title.trim() : "";
      if (!v || v.length < 3) {
        res.status(400).json({ error: "title must be at least 3 characters" });
        return;
      }
      updates.title = v;
    }

    if ("description" in body) {
      const v =
        typeof body.description === "string" ? body.description.trim() : "";
      if (!v || v.length < 10) {
        res
          .status(400)
          .json({ error: "description must be at least 10 characters" });
        return;
      }
      updates.description = v;
    }

    if ("hostName" in body) {
      const v = typeof body.hostName === "string" ? body.hostName.trim() : "";
      if (!v) {
        res.status(400).json({ error: "hostName cannot be empty" });
        return;
      }
      updates.hostName = v;
    }

    if ("location" in body) {
      const v = typeof body.location === "string" ? body.location.trim() : "";
      if (!v) {
        res.status(400).json({ error: "location cannot be empty" });
        return;
      }
      updates.location = v;
    }

    if ("eventDate" in body) {
      const v =
        typeof body.eventDate === "string" ? body.eventDate.trim() : "";
      if (!v) {
        res.status(400).json({ error: "eventDate cannot be empty" });
        return;
      }
      updates.eventDate = v;
    }

    if ("status" in body) {
      const v = typeof body.status === "string" ? body.status.trim() : "";
      if (!VALID_STATUSES.includes(v)) {
        res
          .status(400)
          .json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
        return;
      }
      updates.status = v;
    }

    if ("priceCents" in body) {
      const v = Number(body.priceCents);
      if (!Number.isFinite(v) || v < 0) {
        res.status(400).json({ error: "priceCents must be a non-negative number" });
        return;
      }
      updates.priceCents = Math.floor(v);
    }

    if ("currency" in body) {
      const v = typeof body.currency === "string" ? body.currency.trim().toUpperCase() : "";
      if (v) updates.currency = v.slice(0, 8);
    }

    if ("capacity" in body) {
      updates.capacity =
        body.capacity === null ? null : Math.floor(Number(body.capacity));
    }

    if ("tags" in body) {
      updates.tags =
        typeof body.tags === "string" ? body.tags.trim().slice(0, 200) : null;
    }

    if ("externalUrl" in body) {
      updates.externalUrl =
        typeof body.externalUrl === "string"
          ? body.externalUrl.trim().slice(0, 500) || null
          : null;
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

    res.json(row);
  } catch (err) {
    logger.error({ err }, "admin-ground-events: PATCH failed");
    res.status(500).json({ error: "Failed to update event" });
  }
});

/**
 * DELETE /api/admin/ground-events/:id
 * Hard-delete an event and its RSVPs.
 */
router.delete("/admin/ground-events/:id", requireEditor, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid event id" });
      return;
    }

    await db
      .delete(groundEventRsvpsTable)
      .where(eq(groundEventRsvpsTable.eventId, id));
    await db.delete(groundEventsTable).where(eq(groundEventsTable.id, id));

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "admin-ground-events: DELETE failed");
    res.status(500).json({ error: "Failed to delete event" });
  }
});

/**
 * GET /api/admin/ground-events/:id/rsvps
 * Returns the full RSVP list for a single event.
 */
router.get(
  "/admin/ground-events/:id/rsvps",
  requireEditor,
  async (req, res) => {
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

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(groundEventRsvpsTable)
        .where(eq(groundEventRsvpsTable.eventId, id));

      res.json({ rsvps, total: count });
    } catch (err) {
      logger.error({ err }, "admin-ground-events: GET /rsvps failed");
      res.status(500).json({ error: "Failed to load RSVPs" });
    }
  },
);

export default router;
