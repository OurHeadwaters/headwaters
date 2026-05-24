import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { practitionersTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

/**
 * GET /api/practitioners
 * Public list of active practitioners.
 * Optional query param: ?surveys=true — filters to those who do land surveys.
 */
router.get("/practitioners", async (req: Request, res: Response) => {
  try {
    const surveysOnly = req.query.surveys === "true";

    const rows = await db
      .select()
      .from(practitionersTable)
      .where(
        surveysOnly
          ? eq(practitionersTable.doesLandSurveys, true)
          : eq(practitionersTable.active, true),
      )
      .orderBy(asc(practitionersTable.name));

    res.json({ practitioners: rows });
  } catch (err) {
    logger.error({ err }, "practitioners: list failed");
    res.status(500).json({ error: "Failed to load practitioners" });
  }
});

/**
 * POST /api/admin/practitioners
 * Passphrase-protected. Add a practitioner to the registry.
 */
router.post("/admin/practitioners", async (req: Request, res: Response) => {
  const passphrase = req.headers["x-headwaters-passphrase"];
  const expected = process.env.HEADWATERS_PASSPHRASE;
  if (!expected || passphrase !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const {
    slug,
    name,
    location,
    region,
    bio,
    specialties,
    doesLandSurveys,
    contactUrl,
    contactEmail,
    photoUrl,
    websiteUrl,
  } = req.body as Record<string, unknown>;

  if (!slug || !name || !location || !bio) {
    res.status(400).json({ error: "slug, name, location, and bio are required" });
    return;
  }

  try {
    const [row] = await db
      .insert(practitionersTable)
      .values({
        slug: String(slug),
        name: String(name),
        location: String(location),
        region: region ? String(region) : null,
        bio: String(bio),
        specialties: Array.isArray(specialties) ? (specialties as string[]) : [],
        doesLandSurveys: Boolean(doesLandSurveys),
        contactUrl: contactUrl ? String(contactUrl) : null,
        contactEmail: contactEmail ? String(contactEmail) : null,
        photoUrl: photoUrl ? String(photoUrl) : null,
        websiteUrl: websiteUrl ? String(websiteUrl) : null,
        active: true,
      })
      .returning();

    res.status(201).json({ practitioner: row });
  } catch (err) {
    logger.error({ err }, "practitioners: insert failed");
    res.status(500).json({ error: "Failed to add practitioner" });
  }
});

/**
 * PATCH /api/admin/practitioners/:slug
 * Passphrase-protected. Update a practitioner.
 */
router.patch("/admin/practitioners/:slug", async (req: Request, res: Response) => {
  const passphrase = req.headers["x-headwaters-passphrase"];
  const expected = process.env.HEADWATERS_PASSPHRASE;
  if (!expected || passphrase !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { slug } = req.params;
  const updates = req.body as Partial<{
    name: string;
    location: string;
    region: string;
    bio: string;
    specialties: string[];
    doesLandSurveys: boolean;
    contactUrl: string;
    contactEmail: string;
    photoUrl: string;
    websiteUrl: string;
    active: boolean;
  }>;

  try {
    const [row] = await db
      .update(practitionersTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(practitionersTable.slug, slug))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Practitioner not found" });
      return;
    }

    res.json({ practitioner: row });
  } catch (err) {
    logger.error({ err }, "practitioners: update failed");
    res.status(500).json({ error: "Failed to update practitioner" });
  }
});

export default router;
