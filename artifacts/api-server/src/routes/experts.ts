import { Router, type IRouter } from "express";
import { EXPERT_COUNCIL, ULG_BUSINESSES } from "../lib/expert-council-static";
import { logger } from "../lib/logger";

const router: IRouter = Router();

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
router.get("/experts", (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const experts = q
      ? EXPERT_COUNCIL.filter((m) =>
          matchesQuery([m.name, m.role, m.description, ...m.zones], q),
        )
      : EXPERT_COUNCIL;

    const businesses = q
      ? ULG_BUSINESSES.filter((b) =>
          matchesQuery([b.name, b.tagline, b.description, ...b.zones], q),
        )
      : ULG_BUSINESSES;

    res.json({ experts, businesses });
  } catch (err) {
    logger.error({ err }, "experts search failed");
    res.status(500).json({ error: "Failed to load experts" });
  }
});

export default router;
