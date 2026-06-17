/**
 * Admin — Kit configuration health check
 *
 * GET /api/admin/kits/health
 *   Returns a JSON summary of every direct-sale kit's configuration completeness:
 *   whether it has an accessUrl, a Stripe price ID, and a Zaprite URL.
 *   Missing fields are surfaced so ops can fix configuration issues at a glance.
 */

import { Router, type IRouter } from "express";
import { KITS } from "../lib/kits";
import { requireEditor } from "../middlewares/requireEditor";

const router: IRouter = Router();

router.get("/admin/kits/health", requireEditor, (_req, res) => {
  const directKits = KITS.filter((k) => k.priceType === "direct");

  const kits = directKits.map((k) => ({
    slug: k.slug,
    name: k.name,
    priceType: k.priceType,
    priceCents: k.priceCents ?? null,
    hasAccessUrl: !!k.accessUrl,
    accessUrl: k.accessUrl ?? null,
    hasStripePriceId: !!k.stripePriceId,
    stripePriceId: k.stripePriceId ?? null,
    hasZapriteUrl: !!k.zapriteUrl,
    zapriteUrl: k.zapriteUrl ?? null,
    issues: [
      ...(!k.accessUrl ? ["missing accessUrl"] : []),
      ...(!k.stripePriceId ? ["missing stripePriceId"] : []),
      ...(!k.zapriteUrl ? ["missing zapriteUrl"] : []),
    ],
  }));

  const totalKits = kits.length;
  const healthyKits = kits.filter((k) => k.issues.length === 0).length;
  const kitsWithIssues = totalKits - healthyKits;

  res.json({
    summary: {
      totalDirectKits: totalKits,
      healthyKits,
      kitsWithIssues,
    },
    kits,
  });
});

export default router;
