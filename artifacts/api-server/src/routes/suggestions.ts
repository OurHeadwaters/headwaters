import { Router, type IRouter, type Request, type Response } from "express";
import { db, creatorSuggestionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/suggestions/creator", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const userId = req.user.id;
  const {
    creatorName,
    websiteUrl,
    rssFeedUrl,
    socialLinks,
    whyItFits,
    additionalNotes,
  } = req.body as {
    creatorName?: string;
    websiteUrl?: string;
    rssFeedUrl?: string;
    socialLinks?: string;
    whyItFits?: string;
    additionalNotes?: string;
  };

  if (!creatorName?.trim() || !websiteUrl?.trim() || !whyItFits?.trim()) {
    res.status(400).json({ error: "creatorName, websiteUrl, and whyItFits are required" });
    return;
  }

  const [localRecord] = await db
    .insert(creatorSuggestionsTable)
    .values({
      userId,
      creatorName: creatorName.trim(),
      websiteUrl: websiteUrl.trim(),
      rssFeedUrl: rssFeedUrl?.trim() || null,
      socialLinks: socialLinks?.trim() || null,
      whyItFits: whyItFits.trim(),
      additionalNotes: additionalNotes?.trim() || null,
    })
    .returning();

  const body = [
    `Creator/Show: ${creatorName.trim()}`,
    `Website: ${websiteUrl.trim()}`,
    rssFeedUrl?.trim() ? `RSS Feed: ${rssFeedUrl.trim()}` : null,
    socialLinks?.trim() ? `Social Links: ${socialLinks.trim()}` : null,
    `Why it fits TSP: ${whyItFits.trim()}`,
    additionalNotes?.trim() ? `Additional notes: ${additionalNotes.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  let kitchenTableId: string | null = null;
  let kitchenTableStatus: string | null = null;

  try {
    const intakeRes = await fetch("https://ourheadwaters.ca/api/kitchen-table/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zone: "4",
        body,
        recipient: "Stomping Paths curriculum",
        source: "member suggestion / stomping-paths",
        target: "stomping-paths",
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (intakeRes.ok) {
      const intakeData = (await intakeRes.json()) as { id?: string; status?: string };
      kitchenTableId = intakeData.id ?? null;
      kitchenTableStatus = intakeData.status ?? null;

      await db
        .update(creatorSuggestionsTable)
        .set({
          kitchenTableItemId: kitchenTableId,
          kitchenTableStatus: kitchenTableStatus,
        })
        .where(eq(creatorSuggestionsTable.id, localRecord.id));
    } else {
      console.warn(
        `[suggestions] Kitchen Table intake returned ${intakeRes.status} for local record #${localRecord.id}`,
      );
    }
  } catch (err) {
    console.warn(
      `[suggestions] Kitchen Table intake unreachable for local record #${localRecord.id}:`,
      err instanceof Error ? err.message : err,
    );
  }

  res.status(201).json({
    id: kitchenTableId,
    status: kitchenTableStatus,
  });
});

export default router;
