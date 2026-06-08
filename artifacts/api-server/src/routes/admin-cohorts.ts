import { Router, type IRouter } from "express";
import {
  db,
  cohortsTable,
  cohortEnrollmentsTable,
  expertCouncilTable,
} from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireEditor } from "../middlewares/requireEditor";
import { getUncachableStripeClient } from "../stripeClient";
import { TRANSFORMATIONS } from "../lib/transformations";

const router: IRouter = Router();

/**
 * GET /api/admin/cohorts
 * Lists all cohorts with enrollment counts and revenue.
 */
router.get("/admin/cohorts", requireEditor, async (_req, res) => {
  try {
    const rows = await db
      .select({
        cohort: cohortsTable,
        expert: {
          id: expertCouncilTable.id,
          name: expertCouncilTable.name,
          slug: expertCouncilTable.slug,
        },
      })
      .from(cohortsTable)
      .innerJoin(expertCouncilTable, eq(cohortsTable.expertId, expertCouncilTable.id))
      .orderBy(desc(cohortsTable.createdAt));

    const enrollmentStats = await db
      .select({
        cohortId: cohortEnrollmentsTable.cohortId,
        count: sql<number>`count(*)::int`,
        revenue: sql<number>`coalesce(sum(${cohortEnrollmentsTable.amountPaidCents}),0)::int`,
      })
      .from(cohortEnrollmentsTable)
      .groupBy(cohortEnrollmentsTable.cohortId);

    const statsMap = new Map(
      enrollmentStats.map((s) => [s.cohortId, { count: s.count, revenue: s.revenue }]),
    );

    const result = rows.map(({ cohort, expert }) => {
      const stats = statsMap.get(cohort.id) ?? { count: 0, revenue: 0 };
      const transformation = TRANSFORMATIONS.find(
        (t) => t.slug === cohort.transformationSlug,
      );
      return {
        ...cohort,
        expert,
        enrollmentCount: stats.count,
        revenueCents: stats.revenue,
        transformation: transformation
          ? {
              slug: transformation.slug,
              from: transformation.from,
              to: transformation.to,
              icon: transformation.icon,
              color: transformation.color,
            }
          : null,
      };
    });

    res.json(result);
  } catch (err) {
    logger.error({ err }, "admin-cohorts: GET failed");
    res.status(500).json({ error: "Failed to load cohorts" });
  }
});

/**
 * GET /api/admin/cohorts/:id/enrollments
 * Lists all enrollments for a given cohort.
 */
router.get("/admin/cohorts/:id/enrollments", requireEditor, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid cohort id" });
      return;
    }

    const enrollments = await db
      .select()
      .from(cohortEnrollmentsTable)
      .where(eq(cohortEnrollmentsTable.cohortId, id))
      .orderBy(desc(cohortEnrollmentsTable.enrolledAt));

    res.json(enrollments);
  } catch (err) {
    logger.error({ err }, "admin-cohorts: GET enrollments failed");
    res.status(500).json({ error: "Failed to load enrollments" });
  }
});

/**
 * GET /api/admin/experts-list
 * Returns a lightweight list of all expert council members for the cohort form dropdown.
 */
router.get("/admin/experts-list", requireEditor, async (_req, res) => {
  try {
    const experts = await db
      .select({
        id: expertCouncilTable.id,
        name: expertCouncilTable.name,
        slug: expertCouncilTable.slug,
        role: expertCouncilTable.role,
      })
      .from(expertCouncilTable)
      .orderBy(expertCouncilTable.name);

    res.json(experts);
  } catch (err) {
    logger.error({ err }, "admin-cohorts: GET experts-list failed");
    res.status(500).json({ error: "Failed to load experts" });
  }
});

/**
 * POST /api/admin/cohorts
 * Creates a new cohort and a corresponding Stripe Price.
 */
router.post("/admin/cohorts", requireEditor, async (req, res) => {
  try {
    const {
      expertId,
      transformationSlug,
      title,
      description,
      priceCents,
      seats,
      startDate,
      status,
    } = req.body as {
      expertId: number;
      transformationSlug: string;
      title: string;
      description: string;
      priceCents: number;
      seats: number;
      startDate: string;
      status?: string;
    };

    if (!expertId || !transformationSlug || !title || !priceCents || !seats || !startDate) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const transformation = TRANSFORMATIONS.find((t) => t.slug === transformationSlug);
    if (!transformation) {
      res.status(400).json({ error: "Invalid transformation slug" });
      return;
    }

    let stripePriceId: string | null = null;
    try {
      const stripe = await getUncachableStripeClient();
      const product = await stripe.products.create({
        name: title,
        metadata: { transformation_slug: transformationSlug },
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: priceCents,
        currency: "usd",
        metadata: { cohort_title: title, transformation_slug: transformationSlug },
      });
      stripePriceId = price.id;
    } catch (stripeErr) {
      logger.warn(
        { err: stripeErr },
        "admin-cohorts: Stripe price creation failed (non-fatal, cohort will be created without price id)",
      );
    }

    const [created] = await db
      .insert(cohortsTable)
      .values({
        expertId,
        transformationSlug,
        title,
        description: description ?? "",
        priceCents,
        seats,
        startDate,
        status: status ?? "draft",
        stripePriceId,
      })
      .returning();

    logger.info({ cohortId: created.id, title }, "admin-cohorts: cohort created");
    res.status(201).json(created);
  } catch (err) {
    logger.error({ err }, "admin-cohorts: POST failed");
    res.status(500).json({ error: "Failed to create cohort" });
  }
});

/**
 * PATCH /api/admin/cohorts/:id
 * Updates cohort status or other fields.
 */
router.patch("/admin/cohorts/:id", requireEditor, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid cohort id" });
      return;
    }

    const allowed = ["status", "seats", "startDate", "description", "title"] as const;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    const [updated] = await db
      .update(cohortsTable)
      .set(updates as Partial<typeof cohortsTable.$inferInsert>)
      .where(eq(cohortsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Cohort not found" });
      return;
    }

    res.json(updated);
  } catch (err) {
    logger.error({ err }, "admin-cohorts: PATCH failed");
    res.status(500).json({ error: "Failed to update cohort" });
  }
});

/**
 * DELETE /api/admin/cohorts/:id
 * Deletes a draft cohort.
 */
router.delete("/admin/cohorts/:id", requireEditor, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid cohort id" });
      return;
    }

    const [row] = await db
      .select({ status: cohortsTable.status })
      .from(cohortsTable)
      .where(eq(cohortsTable.id, id))
      .limit(1);

    if (!row) {
      res.status(404).json({ error: "Cohort not found" });
      return;
    }

    if (row.status !== "draft") {
      res.status(400).json({ error: "Only draft cohorts can be deleted" });
      return;
    }

    await db.delete(cohortsTable).where(eq(cohortsTable.id, id));
    res.status(204).send();
  } catch (err) {
    logger.error({ err }, "admin-cohorts: DELETE failed");
    res.status(500).json({ error: "Failed to delete cohort" });
  }
});

export default router;
