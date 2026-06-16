/**
 * Suite routes — unified namespace for kits and creator registry.
 *
 * GET  /api/suite/kits                   — all kits with symbol field; ?access=paid filters to paid kits
 * GET  /api/suite/docs/:slug             — full doctrine markdown for a kit
 * GET  /api/suite/creators               — full creator registry
 * GET  /api/suite/creators/:slug         — single creator with curated links and paired slugs
 */

import { Router, type IRouter } from "express";
import { readFileSync } from "fs";
import { join, resolve } from "path";
import { KITS, type KitDef } from "../lib/kits";
import { CREATORS, creatorBySlug } from "../lib/creators";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/* ─────────────────── Kit symbols ─────────────────── */

const KIT_SYMBOLS: Record<string, string> = {
  "family-kit": "🏡",
  "producer-kit": "🌱",
  "practitioner-kit": "🧭",
  "council-kit": "🤝",
  "care-kit": "❤️",
  "budget-kit": "💰",
  "digital-kit": "🔐",
  "parrs-jars": "🫙",
  "physical-kit": "⚡",
};

function withSymbol(kit: KitDef): KitDef & { symbol: string } {
  return { ...kit, symbol: KIT_SYMBOLS[kit.slug] ?? "📦" };
}

/* ─────────────────── GET /api/suite/kits ─────────────────── */

router.get("/suite/kits", (req, res) => {
  const { access } = req.query as { access?: string };
  let kits = KITS.map(withSymbol);

  if (access === "paid") {
    kits = kits.filter((k) => k.priceType === "direct" && k.priceCents != null);
  }

  res.json(kits);
});

/* ─────────────────── GET /api/suite/docs/:slug ─────────────────── */

const KIT_DOCS_DIR = resolve(process.cwd(), "src/lib/kit-docs");

router.get("/suite/docs/:slug", (req, res) => {
  const { slug } = req.params;
  const kit = KITS.find((k) => k.slug === slug);

  if (!kit) {
    res.status(404).json({ error: "Kit not found" });
    return;
  }

  try {
    const filePath = join(KIT_DOCS_DIR, `${slug}.md`);
    const raw = readFileSync(filePath, "utf-8");

    const firstLine = raw.split("\n")[0] ?? "";
    const title = firstLine.startsWith("# ")
      ? firstLine.slice(2).trim()
      : kit.name;

    res.json({ title, content: raw });
  } catch (err) {
    logger.warn({ slug }, "suite: kit doc not found, falling back to kit name + description");
    res.json({
      title: kit.name,
      content: `# ${kit.name}\n\n${kit.tagline}\n\n${kit.description}`,
    });
  }
});

/* ─────────────────── GET /api/suite/creators ─────────────────── */

router.get("/suite/creators", (_req, res) => {
  res.json(CREATORS);
});

/* ─────────────────── GET /api/suite/creators/:slug ─────────────────── */

router.get("/suite/creators/:slug", (req, res) => {
  const creator = creatorBySlug(req.params.slug);

  if (!creator) {
    res.status(404).json({ error: "Creator not found" });
    return;
  }

  res.json(creator);
});

export default router;
