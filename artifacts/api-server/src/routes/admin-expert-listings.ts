import { Router, type IRouter } from "express";
import { db, expertCouncilTable, listingApplicationsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { getUncachableStripeClient } from "../stripeClient";
import { requireEditor } from "../middlewares/requireEditor";
import { sendListingApprovalEmail } from "../lib/email";

const router: IRouter = Router();

function getBaseUrl(req: import("express").Request): string {
  const domain = (process.env.REPLIT_DOMAINS ?? "").split(",")[0];
  if (domain) return `https://${domain}`;
  return `${req.protocol}://${req.get("host") ?? "localhost"}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/expert-listings/pending
//
// Returns all listing applications in "pending" status.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/admin/expert-listings/pending", requireEditor, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(listingApplicationsTable)
      .where(eq(listingApplicationsTable.status, "pending"))
      .orderBy(desc(listingApplicationsTable.createdAt));

    res.json(rows);
  } catch (err) {
    logger.error({ err }, "admin-expert-listings: GET pending failed");
    res.status(500).json({ error: "Failed to load pending applications" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/expert-listings/all
//
// Returns all listing applications regardless of status.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/admin/expert-listings/all", requireEditor, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(listingApplicationsTable)
      .orderBy(desc(listingApplicationsTable.createdAt));

    res.json(rows);
  } catch (err) {
    logger.error({ err }, "admin-expert-listings: GET all failed");
    res.status(500).json({ error: "Failed to load applications" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/expert-listings/:id/approve
//
// Approves a pending application:
//   1. Creates (or finds existing) expert_council row for this applicant
//   2. Sets application status = "approved" and links expertSlug
//   3. Creates a Stripe Checkout session and stores the URL on the application
//   4. Returns the checkout URL so admin can copy/send it to the expert
// ─────────────────────────────────────────────────────────────────────────────
router.post("/admin/expert-listings/:id/approve", requireEditor, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]), 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid application id" });
      return;
    }

    const [app] = await db
      .select()
      .from(listingApplicationsTable)
      .where(eq(listingApplicationsTable.id, id))
      .limit(1);

    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    if (app.status !== "pending") {
      res.status(400).json({ error: `Application is already ${app.status}` });
      return;
    }

    // Generate a slug from the applicant's name
    const baseSlug = app.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Find a unique slug (append number if taken)
    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      const existing = await db
        .select({ id: expertCouncilTable.id })
        .from(expertCouncilTable)
        .where(eq(expertCouncilTable.slug, slug))
        .limit(1);
      if (existing.length === 0) break;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    // Upsert the expert_council row in "pending" listing status
    await db
      .insert(expertCouncilTable)
      .values({
        slug,
        name: app.name,
        role: app.role,
        description: app.bio,
        url: app.website,
        zones: app.zones,
        podcastFeedUrl: app.podcastFeedUrl ?? null,
        consultUrl: app.consultUrl ?? null,
        photoUrl: app.photoUrl ?? null,
        contactEmail: app.email,
        listingStatus: "pending",
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: expertCouncilTable.slug,
        set: {
          listingStatus: "pending",
          updatedAt: new Date(),
        },
      });

    // Create Stripe Checkout session for the subscription
    const stripe = await getUncachableStripeClient();
    const baseUrl = getBaseUrl(req);
    const priceId = process.env.STRIPE_LISTING_PRICE_ID;

    let sessionParams: import("stripe").Stripe.Checkout.SessionCreateParams;

    // Metadata set on BOTH the session and the subscription object so that
    // subscription webhooks (created/updated/deleted) carry the expert_slug
    // without relying solely on the checkout.session.completed event ordering.
    const sharedMeta = { expert_slug: slug, application_id: String(id) };

    if (priceId) {
      sessionParams = {
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: app.email,
        success_url: `${baseUrl}/council/listing-success?session_id={CHECKOUT_SESSION_ID}&slug=${encodeURIComponent(slug)}`,
        cancel_url: `${baseUrl}/council/join?cancelled=1`,
        metadata: sharedMeta,
        subscription_data: { metadata: sharedMeta },
      };
    } else {
      sessionParams = {
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              recurring: { interval: "month" },
              unit_amount: 14900,
              product_data: {
                name: "Expert Council Featured Listing",
                description:
                  "Monthly featured listing on The Stomping Paths Expert Council directory",
              },
            },
            quantity: 1,
          },
        ],
        customer_email: app.email,
        success_url: `${baseUrl}/council/listing-success?session_id={CHECKOUT_SESSION_ID}&slug=${encodeURIComponent(slug)}`,
        cancel_url: `${baseUrl}/council/join?cancelled=1`,
        metadata: sharedMeta,
        subscription_data: { metadata: sharedMeta },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Mark application as approved and store the checkout URL + expert slug
    await db
      .update(listingApplicationsTable)
      .set({
        status: "approved",
        expertSlug: slug,
        checkoutUrl: session.url,
        updatedAt: new Date(),
      })
      .where(eq(listingApplicationsTable.id, id));

    // Automatically deliver checkout link to the applicant via email.
    // sendListingApprovalEmail is non-blocking — approval succeeds even if
    // email delivery fails (Resend is not configured in all environments).
    const emailResult = await sendListingApprovalEmail({
      applicantEmail: app.email,
      applicantName: app.name,
      expertSlug: slug,
      checkoutUrl: session.url ?? "",
    });

    logger.info(
      { id, slug, sessionId: session.id, emailSent: emailResult.sent },
      "admin-expert-listings: application approved",
    );

    res.json({
      ok: true,
      expertSlug: slug,
      checkoutUrl: session.url,
      emailSent: emailResult.sent,
      emailError: emailResult.error ?? null,
    });
  } catch (err) {
    logger.error({ err }, "admin-expert-listings: approve failed");
    res.status(500).json({ error: "Failed to approve application" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/expert-listings/:id/reject
//
// Rejects a pending application.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/admin/expert-listings/:id/reject", requireEditor, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]), 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid application id" });
      return;
    }

    const rows = await db
      .update(listingApplicationsTable)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(listingApplicationsTable.id, id))
      .returning();

    if (rows.length === 0) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    logger.info({ id }, "admin-expert-listings: application rejected");
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "admin-expert-listings: reject failed");
    res.status(500).json({ error: "Failed to reject application" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/expert-listings/stats
//
// Returns aggregate stats: active count, lapsed count, upcoming renewals (7d),
// and estimated MRR.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/admin/expert-listings/stats", requireEditor, async (_req, res) => {
  try {
    const [activeCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(expertCouncilTable)
      .where(eq(expertCouncilTable.listingStatus, "active"));

    const [lapsedCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(expertCouncilTable)
      .where(eq(expertCouncilTable.listingStatus, "lapsed"));

    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(expertCouncilTable)
      .where(eq(expertCouncilTable.listingStatus, "pending"));

    const active = activeCount?.count ?? 0;
    const lapsed = lapsedCount?.count ?? 0;
    const pending = pendingCount?.count ?? 0;

    const monthlyRate = 149;
    const mrr = active * monthlyRate;

    // Upcoming renewals in the next 7 days
    const renewals = await db
      .select({
        slug: expertCouncilTable.slug,
        name: expertCouncilTable.name,
        currentPeriodEnd: expertCouncilTable.currentPeriodEnd,
      })
      .from(expertCouncilTable)
      .where(
        sql`listing_status = 'active' AND current_period_end IS NOT NULL AND current_period_end < NOW() + INTERVAL '7 days'`,
      );

    // Active members with full details
    const activeMembers = await db
      .select({
        slug: expertCouncilTable.slug,
        name: expertCouncilTable.name,
        role: expertCouncilTable.role,
        currentPeriodEnd: expertCouncilTable.currentPeriodEnd,
        approvedAt: expertCouncilTable.approvedAt,
      })
      .from(expertCouncilTable)
      .where(eq(expertCouncilTable.listingStatus, "active"))
      .orderBy(desc(expertCouncilTable.approvedAt));

    const lapsedMembers = await db
      .select({
        slug: expertCouncilTable.slug,
        name: expertCouncilTable.name,
        role: expertCouncilTable.role,
        currentPeriodEnd: expertCouncilTable.currentPeriodEnd,
      })
      .from(expertCouncilTable)
      .where(eq(expertCouncilTable.listingStatus, "lapsed"))
      .orderBy(desc(expertCouncilTable.currentPeriodEnd));

    res.json({
      active,
      lapsed,
      pending,
      mrr,
      upcomingRenewals: renewals,
      activeMembers,
      lapsedMembers,
    });
  } catch (err) {
    logger.error({ err }, "admin-expert-listings: stats failed");
    res.status(500).json({ error: "Failed to load stats" });
  }
});

export default router;
