import { Router, type IRouter } from "express";
import { TRANSFORMATIONS, transformationBySlug } from "../lib/transformations";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * GET /api/transformations
 * Returns the full Codetry transformation registry.
 */
router.get("/transformations", (_req, res) => {
  try {
    res.json(TRANSFORMATIONS);
  } catch (err) {
    logger.error({ err }, "transformations list failed");
    res.status(500).json({ error: "Failed to load transformations" });
  }
});

/**
 * GET /api/transformations/:slug
 * Returns a single transformation by slug.
 */
router.get("/transformations/:slug", (req, res) => {
  try {
    const transformation = transformationBySlug(req.params.slug);
    if (!transformation) {
      res.status(404).json({ error: "Transformation not found" });
      return;
    }
    res.json(transformation);
  } catch (err) {
    logger.error({ err }, "transformation detail failed");
    res.status(500).json({ error: "Failed to load transformation" });
  }
});

export default router;
