import { Router, type IRouter } from "express";
import { db, cohortsTable, cohortEnrollmentsTable, cohortWaitlistTable, expertCouncilTable } from "@workspace/db";
import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { getUncachableStripeClient } from "../stripeClient";
import { TRANSFORMATIONS } from "../lib/transformations";

const router: IRouter = Router();

const PLATFORM_FEE_PCT = 15;

function getBaseUrl(req: import("express").Request): string {
  const domain = (process.env.REPLIT_DOMAINS ?? "").split(",")[0];
  if (domain) return `https://${domain}`;
  return `${req.protocol}://${req.get("host") ?? "localhost"}`;
}

/**
 * GET /api/cohorts
 * Public listing of approved and active cohorts.
 * Optional ?transformation=slug filter.
 */
router.get("/cohorts", async (req, res) => {
  try {
    const transformationFilter =
      typeof req.query.transformation === "string"
        ? req.query.transformation.trim()
        : null;

    const rows = await db
      .select({
        cohort: cohortsTable,
        expert: {
          id: expertCouncilTable.id,
          name: expertCouncilTable.name,
          slug: expertCouncilTable.slug,
          role: expertCouncilTable.role,
        },
      })
      .from(cohortsTable)
      .innerJoin(expertCouncilTable, eq(cohortsTable.expertId, expertCouncilTable.id))
      .where(
        transformationFilter
          ? and(
              inArray(cohortsTable.status, ["approved", "active"]),
              eq(cohortsTable.transformationSlug, transformationFilter),
            )
          : inArray(cohortsTable.status, ["approved", "active"]),
      )
      .orderBy(desc(cohortsTable.startDate));

    const enrollmentCounts = await db
      .select({ cohortId: cohortEnrollmentsTable.cohortId })
      .from(cohortEnrollmentsTable)
      .where(
        inArray(
          cohortEnrollmentsTable.cohortId,
          rows.map((r) => r.cohort.id),
        ),
      );

    const countMap = new Map<number, number>();
    for (const row of enrollmentCounts) {
      countMap.set(row.cohortId, (countMap.get(row.cohortId) ?? 0) + 1);
    }

    const result = rows.map(({ cohort, expert }) => {
      const enrolled = countMap.get(cohort.id) ?? 0;
      const transformation = TRANSFORMATIONS.find(
        (t) => t.slug === cohort.transformationSlug,
      );
      return {
        ...cohort,
        expert,
        enrolled,
        seatsRemaining: cohort.seats - enrolled,
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
    logger.error({ err }, "cohorts: GET /cohorts failed");
    res.status(500).json({ error: "Failed to load cohorts" });
  }
});

/**
 * GET /api/cohorts/:id
 * Returns a single cohort with expert and enrollment info.
 * Checks if the requesting user is enrolled.
 */
router.get("/cohorts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid cohort id" });
      return;
    }

    const [row] = await db
      .select({
        cohort: cohortsTable,
        expert: {
          id: expertCouncilTable.id,
          name: expertCouncilTable.name,
          slug: expertCouncilTable.slug,
          role: expertCouncilTable.role,
        },
      })
      .from(cohortsTable)
      .innerJoin(expertCouncilTable, eq(cohortsTable.expertId, expertCouncilTable.id))
      .where(eq(cohortsTable.id, id))
      .limit(1);

    if (!row) {
      res.status(404).json({ error: "Cohort not found" });
      return;
    }

    const enrollments = await db
      .select()
      .from(cohortEnrollmentsTable)
      .where(eq(cohortEnrollmentsTable.cohortId, id));

    const userId = req.user?.id ?? null;
    const isEnrolled = userId
      ? enrollments.some((e) => e.userId === userId)
      : false;

    const transformation = TRANSFORMATIONS.find(
      (t) => t.slug === row.cohort.transformationSlug,
    );

    res.json({
      ...row.cohort,
      expert: row.expert,
      enrolled: enrollments.length,
      seatsRemaining: row.cohort.seats - enrollments.length,
      isEnrolled,
      transformation: transformation ?? null,
    });
  } catch (err) {
    logger.error({ err }, "cohorts: GET /cohorts/:id failed");
    res.status(500).json({ error: "Failed to load cohort" });
  }
});

/**
 * POST /api/cohorts/:id/enroll
 * Creates a Stripe Checkout session with 15% platform application fee.
 * Requires the user to be authenticated.
 */
router.post("/cohorts/:id/enroll", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "You must be logged in to enroll" });
      return;
    }

    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid cohort id" });
      return;
    }

    const [row] = await db
      .select({
        cohort: cohortsTable,
        expert: expertCouncilTable,
      })
      .from(cohortsTable)
      .innerJoin(expertCouncilTable, eq(cohortsTable.expertId, expertCouncilTable.id))
      .where(eq(cohortsTable.id, id))
      .limit(1);

    if (!row) {
      res.status(404).json({ error: "Cohort not found" });
      return;
    }

    if (!["approved", "active"].includes(row.cohort.status)) {
      res.status(400).json({ error: "This cohort is not accepting enrollments" });
      return;
    }

    const enrollments = await db
      .select({ userId: cohortEnrollmentsTable.userId })
      .from(cohortEnrollmentsTable)
      .where(eq(cohortEnrollmentsTable.cohortId, id));

    if (enrollments.some((e) => e.userId === req.user.id)) {
      res.status(400).json({ error: "You are already enrolled in this cohort" });
      return;
    }

    if (enrollments.length >= row.cohort.seats) {
      res.status(400).json({ error: "This cohort is full" });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const baseUrl = getBaseUrl(req);
    const applicationFeeAmount = Math.round(
      (row.cohort.priceCents * PLATFORM_FEE_PCT) / 100,
    );

    const transformation = TRANSFORMATIONS.find(
      (t) => t.slug === row.cohort.transformationSlug,
    );
    const pathLabel = transformation
      ? `${transformation.from} → ${transformation.to}`
      : row.cohort.transformationSlug;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: row.cohort.priceCents,
            product_data: {
              name: row.cohort.title,
              description: `${pathLabel} · with ${row.expert.name} · Starts ${row.cohort.startDate}`,
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
      },
      success_url: `${baseUrl}/cohorts/${id}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cohorts/${id}?checkout=cancelled`,
      metadata: {
        cohort_id: String(id),
        user_id: req.user.id,
      },
    });

    logger.info(
      { cohortId: id, userId: req.user.id, sessionId: session.id, applicationFeeAmount },
      "cohorts: checkout session created",
    );

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    logger.error({ err }, "cohorts: POST /cohorts/:id/enroll failed");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

/**
 * POST /api/cohorts/waitlist
 * Capture a pre-launch waitlist email for the founding cohort.
 * Persists to the cohort_waitlist DB table (unique per email + cohort slug).
 * Duplicate submissions are silently ignored (onConflictDoNothing).
 */
router.post("/cohorts/waitlist", async (req, res) => {
  try {
    const { email, cohortSlug = "founding" } = req.body as { email?: string; cohortSlug?: string };
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "A valid email address is required" });
      return;
    }
    const trimmed = email.trim().toLowerCase();
    await db
      .insert(cohortWaitlistTable)
      .values({ email: trimmed, cohortSlug, source: "web" })
      .onConflictDoNothing();
    logger.info({ emailDomain: trimmed.split("@")[1], cohortSlug }, "cohorts: waitlist signup persisted");
    res.json({ ok: true, message: "You're on the list! We'll email you when enrollment opens." });
  } catch (err) {
    logger.error({ err }, "cohorts: POST /cohorts/waitlist failed");
    res.status(500).json({ error: "Failed to join waitlist" });
  }
});

export default router;
