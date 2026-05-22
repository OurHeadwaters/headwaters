import { Router, type IRouter } from "express";
import { db, expertCouncilTable, ulgBusinessesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { seedExpertCouncil, seedUlgBusinesses } from "../lib/seed-expert-council";

const router: IRouter = Router();

let seeded = false;

async function ensureSeeded() {
  if (seeded) return;
  try {
    const [ecCount, bizCount] = await Promise.all([
      db.select({ id: expertCouncilTable.id }).from(expertCouncilTable).limit(1),
      db.select({ id: ulgBusinessesTable.id }).from(ulgBusinessesTable).limit(1),
    ]);
    if (ecCount.length === 0) await seedExpertCouncil();
    if (bizCount.length === 0) await seedUlgBusinesses();
    seeded = true;
  } catch (err) {
    logger.warn({ err }, "admin-council: seed check failed");
  }
}

function parseZones(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((z) => typeof z === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((z) => typeof z === "string");
    } catch {
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

/* ───────────────────────────── Expert Council ───────────────────────────── */

router.get("/admin/council/experts", async (_req, res) => {
  try {
    await ensureSeeded();
    const rows = await db
      .select()
      .from(expertCouncilTable)
      .orderBy(asc(expertCouncilTable.sortOrder), asc(expertCouncilTable.name));
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "admin-council: GET experts failed");
    res.status(500).json({ error: "Failed to load experts" });
  }
});

router.post("/admin/council/experts", async (req, res) => {
  try {
    const { slug, name, role, description, url, zones, sortOrder, podcastFeedUrl, rssSlug, crew } = req.body as {
      slug?: string; name?: string; role?: string;
      description?: string; url?: string; zones?: unknown; sortOrder?: number;
      podcastFeedUrl?: string; rssSlug?: string; crew?: string;
    };
    if (!slug?.trim() || !name?.trim() || !role?.trim() || !description?.trim() || !url?.trim()) {
      res.status(400).json({ error: "slug, name, role, description, and url are required" });
      return;
    }
    const rows = await db
      .insert(expertCouncilTable)
      .values({
        slug: slug.trim(),
        name: name.trim(),
        role: role.trim(),
        description: description.trim(),
        url: url.trim(),
        zones: parseZones(zones),
        crew: crew?.trim() || null,
        podcastFeedUrl: podcastFeedUrl?.trim() || null,
        rssSlug: rssSlug?.trim() || null,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 999,
        updatedAt: new Date(),
      })
      .returning();
    res.status(201).json(rows[0]);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") {
      res.status(409).json({ error: "An expert with that slug already exists" });
      return;
    }
    logger.error({ err }, "admin-council: POST expert failed");
    res.status(500).json({ error: "Failed to create expert" });
  }
});

router.put("/admin/council/experts/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const { name, role, description, url, zones, sortOrder, podcastFeedUrl, rssSlug, crew } = req.body as {
      name?: string; role?: string; description?: string;
      url?: string; zones?: unknown; sortOrder?: number;
      podcastFeedUrl?: string; rssSlug?: string; crew?: string;
    };
    if (!name?.trim() || !role?.trim() || !description?.trim() || !url?.trim()) {
      res.status(400).json({ error: "name, role, description, and url are required" });
      return;
    }
    const rows = await db
      .update(expertCouncilTable)
      .set({
        name: name.trim(),
        role: role.trim(),
        description: description.trim(),
        url: url.trim(),
        zones: parseZones(zones),
        crew: crew?.trim() || null,
        podcastFeedUrl: podcastFeedUrl?.trim() || null,
        rssSlug: rssSlug?.trim() || null,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 999,
        updatedAt: new Date(),
      })
      .where(eq(expertCouncilTable.slug, slug))
      .returning();
    if (rows.length === 0) {
      res.status(404).json({ error: "Expert not found" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    logger.error({ err }, "admin-council: PUT expert failed");
    res.status(500).json({ error: "Failed to update expert" });
  }
});

router.delete("/admin/council/experts/:slug", async (req, res) => {
  try {
    await db
      .delete(expertCouncilTable)
      .where(eq(expertCouncilTable.slug, req.params.slug));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "admin-council: DELETE expert failed");
    res.status(500).json({ error: "Failed to delete expert" });
  }
});

router.post("/admin/council/experts/seed", async (_req, res) => {
  try {
    const count = await seedExpertCouncil();
    res.json({ ok: true, seeded: count });
  } catch (err) {
    logger.error({ err }, "admin-council: seed experts failed");
    res.status(500).json({ error: "Failed to seed experts" });
  }
});

/* ─────────────────────────────── ULG Businesses ─────────────────────────── */

router.get("/admin/council/businesses", async (_req, res) => {
  try {
    await ensureSeeded();
    const rows = await db
      .select()
      .from(ulgBusinessesTable)
      .orderBy(asc(ulgBusinessesTable.sortOrder), asc(ulgBusinessesTable.name));
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "admin-council: GET businesses failed");
    res.status(500).json({ error: "Failed to load businesses" });
  }
});

router.post("/admin/council/businesses", async (req, res) => {
  try {
    const { slug, name, tagline, description, url, zones, sortOrder } = req.body as {
      slug?: string; name?: string; tagline?: string;
      description?: string; url?: string; zones?: unknown; sortOrder?: number;
    };
    if (!slug?.trim() || !name?.trim() || !tagline?.trim() || !description?.trim() || !url?.trim()) {
      res.status(400).json({ error: "slug, name, tagline, description, and url are required" });
      return;
    }
    const rows = await db
      .insert(ulgBusinessesTable)
      .values({
        slug: slug.trim(),
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        url: url.trim(),
        zones: parseZones(zones),
        sortOrder: typeof sortOrder === "number" ? sortOrder : 999,
        updatedAt: new Date(),
      })
      .returning();
    res.status(201).json(rows[0]);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") {
      res.status(409).json({ error: "A business with that slug already exists" });
      return;
    }
    logger.error({ err }, "admin-council: POST business failed");
    res.status(500).json({ error: "Failed to create business" });
  }
});

router.put("/admin/council/businesses/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const { name, tagline, description, url, zones, sortOrder } = req.body as {
      name?: string; tagline?: string; description?: string;
      url?: string; zones?: unknown; sortOrder?: number;
    };
    if (!name?.trim() || !tagline?.trim() || !description?.trim() || !url?.trim()) {
      res.status(400).json({ error: "name, tagline, description, and url are required" });
      return;
    }
    const rows = await db
      .update(ulgBusinessesTable)
      .set({
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        url: url.trim(),
        zones: parseZones(zones),
        sortOrder: typeof sortOrder === "number" ? sortOrder : 999,
        updatedAt: new Date(),
      })
      .where(eq(ulgBusinessesTable.slug, slug))
      .returning();
    if (rows.length === 0) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    logger.error({ err }, "admin-council: PUT business failed");
    res.status(500).json({ error: "Failed to update business" });
  }
});

router.delete("/admin/council/businesses/:slug", async (req, res) => {
  try {
    await db
      .delete(ulgBusinessesTable)
      .where(eq(ulgBusinessesTable.slug, req.params.slug));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "admin-council: DELETE business failed");
    res.status(500).json({ error: "Failed to delete business" });
  }
});

router.post("/admin/council/businesses/seed", async (_req, res) => {
  try {
    const count = await seedUlgBusinesses();
    res.json({ ok: true, seeded: count });
  } catch (err) {
    logger.error({ err }, "admin-council: seed businesses failed");
    res.status(500).json({ error: "Failed to seed businesses" });
  }
});

export default router;
