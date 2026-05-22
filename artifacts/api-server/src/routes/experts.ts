import { Router, type IRouter } from "express";
import { getAllExperts, getAllBusinesses } from "../lib/expert-council";
import { db, contentItemsTable, expertCouncilTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { seedExpertCouncil, seedUlgBusinesses } from "../lib/seed-expert-council";

const router: IRouter = Router();

let seeded = false;
async function ensureSeeded() {
  if (seeded) return;
  try {
    await seedExpertCouncil();
    await seedUlgBusinesses();
    seeded = true;
  } catch (err) {
    logger.warn({ err }, "experts route: seed check failed");
  }
}

function normalize(s: string) {
  return s.toLowerCase();
}

function matchesQuery(fields: string[], q: string): boolean {
  const lower = normalize(q);
  const terms = lower.split(/\s+/).filter(Boolean);
  const combined = fields.map(normalize).join(" ");
  return terms.every((t) => combined.includes(t));
}

/**
 * GET /api/experts
 * Returns all Expert Council members and ULG businesses,
 * optionally filtered by a text search query.
 *
 * Query params:
 *   q  — optional free-text search (name, role, description, zones)
 */
router.get("/experts", async (req, res) => {
  try {
    await ensureSeeded();
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const [allExperts, allBusinesses] = await Promise.all([
      getAllExperts(),
      getAllBusinesses(),
    ]);

    const experts = q
      ? allExperts.filter((m) =>
          matchesQuery([m.name, m.role, m.description, ...m.zones], q),
        )
      : allExperts;

    const businesses = q
      ? allBusinesses.filter((b) =>
          matchesQuery([b.name, b.tagline ?? "", b.description, ...b.zones], q),
        )
      : allBusinesses;

    res.json({ experts, businesses });
  } catch (err) {
    logger.error({ err }, "experts search failed");
    res.status(500).json({ error: "Failed to load experts" });
  }
});

router.get("/experts/:slug", async (req, res) => {
  try {
    await ensureSeeded();
    const { slug } = req.params;
    const allExperts = await getAllExperts();
    const expert = allExperts.find((e) => e.slug === slug);
    if (!expert) {
      res.status(404).json({ error: "Expert not found" });
      return;
    }

    const source = `council-${slug}`;
    const isFiresideHost = expert.crew === "fireside-freedom";

    const [ownEpisodes, tspAppearances, firesideEpisodes] = await Promise.all([
      db
        .select()
        .from(contentItemsTable)
        .where(eq(contentItemsTable.source, source))
        .orderBy(desc(contentItemsTable.publishedAt))
        .limit(50),
      db
        .select()
        .from(contentItemsTable)
        .where(
          and(
            eq(contentItemsTable.source, "wordpress"),
            eq(contentItemsTable.kind, "audio"),
          ),
        )
        .orderBy(desc(contentItemsTable.publishedAt))
        .limit(200),
      isFiresideHost
        ? db
            .select()
            .from(contentItemsTable)
            .where(eq(contentItemsTable.source, "fireside-freedom"))
            .orderBy(desc(contentItemsTable.publishedAt))
            .limit(100)
        : Promise.resolve([]),
    ]);

    const nameLower = expert.name.toLowerCase();
    const filteredAppearances = tspAppearances.filter((ep) => {
      const title = (ep.title ?? "").toLowerCase();
      const summary = (ep.summary ?? "").toLowerCase();
      return title.includes(nameLower) || summary.includes(nameLower);
    });

    res.json({
      expert,
      ownEpisodes,
      firesideEpisodes,
      tspAppearances: filteredAppearances.slice(0, 50),
    });
  } catch (err) {
    logger.error({ err }, "expert profile fetch failed");
    res.status(500).json({ error: "Failed to load expert profile" });
  }
});

export default router;
