import { Router, type IRouter } from "express";
import { db, categoryDescriptionsTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { seedCategoryDescriptions } from "../lib/seed-category-descriptions";
import { requireEditor } from "../middlewares/requireEditor";

const router: IRouter = Router();

router.use(requireEditor);

let seeded = false;

async function ensureSeeded() {
  if (seeded) return;
  try {
    const count = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(categoryDescriptionsTable);
    if ((count[0]?.count ?? 0) === 0) {
      await seedCategoryDescriptions();
    }
    seeded = true;
  } catch (err) {
    logger.warn({ err }, "admin-categories: seed check failed");
  }
}

router.get("/admin/categories", async (_req, res) => {
  try {
    await ensureSeeded();
    const rows = await db
      .select()
      .from(categoryDescriptionsTable)
      .orderBy(categoryDescriptionsTable.category);
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "admin-categories: GET failed");
    res.status(500).json({ error: "Failed to load category descriptions" });
  }
});

router.put("/admin/categories/:category", async (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category).toLowerCase().trim();
    const { description } = req.body as { description?: string };
    if (!description || typeof description !== "string" || !description.trim()) {
      res.status(400).json({ error: "description is required" });
      return;
    }
    const rows = await db
      .insert(categoryDescriptionsTable)
      .values({ category, description: description.trim(), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: categoryDescriptionsTable.category,
        set: { description: description.trim(), updatedAt: new Date() },
      })
      .returning();
    res.json(rows[0]);
  } catch (err) {
    logger.error({ err }, "admin-categories: PUT failed");
    res.status(500).json({ error: "Failed to save category description" });
  }
});

router.delete("/admin/categories/:category", async (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category).toLowerCase().trim();
    await db
      .delete(categoryDescriptionsTable)
      .where(eq(categoryDescriptionsTable.category, category));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "admin-categories: DELETE failed");
    res.status(500).json({ error: "Failed to delete category description" });
  }
});

router.post("/admin/categories/seed", async (_req, res) => {
  try {
    const count = await seedCategoryDescriptions();
    res.json({ ok: true, seeded: count });
  } catch (err) {
    logger.error({ err }, "admin-categories: seed failed");
    res.status(500).json({ error: "Failed to seed descriptions" });
  }
});

export default router;
