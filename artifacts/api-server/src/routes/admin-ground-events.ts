import { Router, type IRouter } from "express";
import { db, groundEventsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireEditor } from "../middlewares/requireEditor";

const router: IRouter = Router();

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
 * PATCH /api/admin/ground-events/:id
 * Approve, feature, or reject an event.
 * Also allows updating any other field (title, description, etc.).
 *
 * Special actions via body:
 *   { action: "approve" }  — sets is_approved=true, is_rejected=false
 *   { action: "feature" }  — sets is_approved=true, is_featured=true
 *   { action: "reject" }   — sets is_approved=false, is_featured=false
 *   { action: "unfeature" }— sets is_featured=false (stays approved)
 *
 * Or pass explicit fields (isApproved, isFeatured, title, description, etc.)
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
      } else if (action === "feature") {
        updates.isApproved = true;
        updates.isFeatured = true;
      } else if (action === "reject") {
        updates.isApproved = false;
        updates.isFeatured = false;
      } else if (action === "unfeature") {
        updates.isFeatured = false;
      } else {
        res.status(400).json({ error: "Unknown action. Valid: approve, feature, reject, unfeature" });
        return;
      }
    } else {
      if ("isApproved" in body) {
        updates.isApproved = Boolean(body.isApproved);
      }
      if ("isFeatured" in body) {
        updates.isFeatured = Boolean(body.isFeatured);
      }

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
        if (!v) {
          res.status(400).json({ error: "hostName cannot be empty" });
          return;
        }
        updates.hostName = v;
      }

      if ("eventDate" in body) {
        const v = typeof body.eventDate === "string" ? body.eventDate.trim() : "";
        if (!v) {
          res.status(400).json({ error: "eventDate cannot be empty" });
          return;
        }
        updates.eventDate = v;
      }

      if ("location" in body) {
        const v = typeof body.location === "string" ? body.location.trim() : "";
        if (!v) {
          res.status(400).json({ error: "location cannot be empty" });
          return;
        }
        updates.location = v;
      }

      if ("isOnline" in body) {
        updates.isOnline = Boolean(body.isOnline);
      }

      if ("priceDisplay" in body) {
        updates.priceDisplay =
          typeof body.priceDisplay === "string"
            ? body.priceDisplay.trim().slice(0, 40) || "Free"
            : "Free";
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
 * Hard-delete an event.
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
