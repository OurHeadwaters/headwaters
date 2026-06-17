import { Router, type IRouter } from "express";
import { db, expertCouncilTable, listingApplicationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { getUncachableStripeClient } from "../stripeClient";

const router: IRouter = Router();

function getBaseUrl(req: import("express").Request): string {
  const domain = (process.env.REPLIT_DOMAINS ?? "").split(",")[0];
  if (domain) return `https://${domain}`;
  return `${req.protocol}://${req.get("host") ?? "localhost"}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/expert-listings/apply
//
// Self-serve application form submission. Creates a listing_applications
// record in "pending" status. Admin must approve before a Stripe checkout
// link is generated and sent to the applicant.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/expert-listings/apply", async (req, res) => {
  try {
    const { name, email, role, bio, website, podcastFeedUrl, consultUrl, photoUrl, zones } =
      req.body as {
        name?: string;
        email?: string;
        role?: string;
        bio?: string;
        website?: string;
        podcastFeedUrl?: string;
        consultUrl?: string;
        photoUrl?: string;
        zones?: string[];
      };

    if (!name?.trim() || !email?.trim() || !role?.trim() || !bio?.trim() || !website?.trim()) {
      res.status(400).json({ error: "name, email, role, bio, and website are required" });
      return;
    }

    // Validate all URL fields — only http/https schemes are accepted.
    // This prevents malicious schemes (javascript:, data:, etc.) from being
    // persisted and later rendered as links in the admin UI or directory.
    const urlFields: Array<[string, string | undefined]> = [
      ["website", website],
      ["podcastFeedUrl", podcastFeedUrl],
      ["consultUrl", consultUrl],
      ["photoUrl", photoUrl],
    ];
    for (const [fieldName, value] of urlFields) {
      if (!value?.trim()) continue;
      try {
        const parsed = new URL(value.trim());
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          res.status(400).json({ error: `${fieldName} must be an http or https URL` });
          return;
        }
      } catch {
        res.status(400).json({ error: `${fieldName} is not a valid URL` });
        return;
      }
    }

    const validZones = Array.isArray(zones)
      ? zones.filter((z) => typeof z === "string")
      : [];

    const [row] = await db
      .insert(listingApplicationsTable)
      .values({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role.trim(),
        bio: bio.trim(),
        website: website.trim(),
        podcastFeedUrl: podcastFeedUrl?.trim() || null,
        consultUrl: consultUrl?.trim() || null,
        photoUrl: photoUrl?.trim() || null,
        zones: validZones,
        status: "pending",
        updatedAt: new Date(),
      })
      .returning();

    logger.info({ id: row.id, email: row.email }, "expert-listings: application submitted");
    res.status(201).json({ ok: true, id: row.id });
  } catch (err) {
    logger.error({ err }, "expert-listings: apply failed");
    res.status(500).json({ error: "Failed to submit application" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/expert-listings/checkout
//
// Creates a Stripe Subscription Checkout session for a featured listing.
// Called after admin approval — the expert receives this URL so they can
// subscribe and activate their listing.
//
// Body: { applicationId: number } or { expertSlug: string }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/expert-listings/checkout", async (req, res) => {
  try {
    const { applicationId, expertSlug } = req.body as {
      applicationId?: number;
      expertSlug?: string;
    };

    let name = "";
    let email = "";
    let slug = "";

    if (applicationId) {
      const [app] = await db
        .select()
        .from(listingApplicationsTable)
        .where(eq(listingApplicationsTable.id, applicationId))
        .limit(1);

      if (!app) {
        res.status(404).json({ error: "Application not found" });
        return;
      }
      if (app.status !== "approved") {
        res.status(400).json({ error: "Application has not been approved yet" });
        return;
      }
      name = app.name;
      email = app.email;
      slug = app.expertSlug ?? app.email;
    } else if (expertSlug) {
      const [expert] = await db
        .select()
        .from(expertCouncilTable)
        .where(eq(expertCouncilTable.slug, expertSlug))
        .limit(1);

      if (!expert) {
        res.status(404).json({ error: "Expert not found" });
        return;
      }
      name = expert.name;
      email = expert.contactEmail ?? "";
      slug = expert.slug;
    } else {
      res.status(400).json({ error: "applicationId or expertSlug required" });
      return;
    }

    const stripe = await getUncachableStripeClient();
    const baseUrl = getBaseUrl(req);

    // Get or create the listing product/price
    const priceId = process.env.STRIPE_LISTING_PRICE_ID;

    let sessionParams: import("stripe").Stripe.Checkout.SessionCreateParams;

    // Shared metadata — set on BOTH the session and the subscription so that
    // subscription webhook events (customer.subscription.updated/deleted) carry
    // the expert_slug reliably without needing a fallback lookup.
    const sharedMetadata = {
      expert_slug: slug,
      application_id: applicationId ? String(applicationId) : "",
    };

    if (priceId) {
      sessionParams = {
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: email || undefined,
        success_url: `${baseUrl}/council/listing-success?session_id={CHECKOUT_SESSION_ID}&slug=${encodeURIComponent(slug)}`,
        cancel_url: `${baseUrl}/council/join?cancelled=1`,
        metadata: sharedMetadata,
        subscription_data: { metadata: sharedMetadata },
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
        customer_email: email || undefined,
        success_url: `${baseUrl}/council/listing-success?session_id={CHECKOUT_SESSION_ID}&slug=${encodeURIComponent(slug)}`,
        cancel_url: `${baseUrl}/council/join?cancelled=1`,
        metadata: sharedMetadata,
        subscription_data: { metadata: sharedMetadata },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // If there's an application, store the checkout URL on it
    if (applicationId) {
      await db
        .update(listingApplicationsTable)
        .set({ checkoutUrl: session.url, updatedAt: new Date() })
        .where(eq(listingApplicationsTable.id, applicationId));
    }

    logger.info({ slug, sessionId: session.id }, "expert-listings: checkout session created");
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    logger.error({ err }, "expert-listings: checkout failed");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/expert-listings/portal
//
// Returns a Stripe Billing Portal URL for the expert so they can manage
// their subscription (cancel, update card, etc.).
//
// Ownership is verified using the Stripe checkout session_id. The session_id
// is a cryptographically random, unguessable token issued by Stripe when the
// expert completed their checkout. Only the expert who completed checkout has
// this value (it was in their success_url redirect). We retrieve the session
// from Stripe's API and verify it references the given expert slug.
//
// Query: ?session_id=<stripe-checkout-session-id>&slug=<expert-slug>
// ─────────────────────────────────────────────────────────────────────────────
router.get("/expert-listings/portal", async (req, res) => {
  try {
    const sessionId = typeof req.query.session_id === "string" ? req.query.session_id.trim() : "";
    const slug = typeof req.query.slug === "string" ? req.query.slug.trim() : "";

    if (!sessionId || !slug) {
      res.status(400).json({ error: "session_id and slug query params are required" });
      return;
    }

    const stripe = await getUncachableStripeClient();

    // Retrieve the session from Stripe — this verifies the session_id is real
    // and was issued by our account. We cannot forge this without Stripe keys.
    let checkoutSession: import("stripe").Stripe.Checkout.Session;
    try {
      checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    } catch {
      res.status(403).json({ error: "Invalid or expired checkout session" });
      return;
    }

    // Verify the session is for this expert slug (double-check metadata)
    if (checkoutSession.metadata?.expert_slug !== slug) {
      logger.warn({ sessionId, slug }, "expert-listings: portal session/slug mismatch");
      res.status(403).json({ error: "Session does not match the given expert" });
      return;
    }

    const customerId =
      typeof checkoutSession.customer === "string"
        ? checkoutSession.customer
        : checkoutSession.customer?.id ?? null;

    if (!customerId) {
      res.status(400).json({ error: "No Stripe customer associated with this session" });
      return;
    }

    const baseUrl = getBaseUrl(req);
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/council/${slug}`,
    });

    res.json({ url: portal.url });
  } catch (err) {
    logger.error({ err }, "expert-listings: portal failed");
    res.status(500).json({ error: "Failed to create billing portal session" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/expert-listings/featured
//
// Returns all active featured listings, optionally filtered by zone.
// Query: ?zone=<zone-slug>
// ─────────────────────────────────────────────────────────────────────────────
router.get("/expert-listings/featured", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(expertCouncilTable)
      .where(eq(expertCouncilTable.listingStatus, "active"));

    const zone = typeof req.query.zone === "string" ? req.query.zone.trim() : "";

    const featured = zone
      ? rows.filter((r) => r.zones.includes(zone))
      : rows;

    res.json({ featured });
  } catch (err) {
    logger.error({ err }, "expert-listings: featured fetch failed");
    res.status(500).json({ error: "Failed to load featured listings" });
  }
});

export default router;
