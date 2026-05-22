import { Router, type IRouter, type Request, type Response } from "express";
import { db, userLifestyleMapsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const ZONE_DEFINITIONS = `
Zone 0 — The Self: mindset, money, economics, financial independence, liberty, personal sovereignty, entrepreneurship, investing, debt freedom.
Zone 1 — The Home: food storage, water, home security, emergency planning, first aid, basic preparedness, self-defense, community, getting started.
Zone 2 — The Garden: permaculture, gardening, chickens, beekeeping, herbal medicine, composting, aquaponics, food production, small livestock.
Zone 3 — The Homestead: homesteading, livestock, farming, solar energy, off-grid systems, animal husbandry, woodworking, alternative energy.
Zone 4 — The Forest: hunting, fishing, foraging, bushcraft, wildcrafting, primitive skills, outdoor skills, wildlife.
Zone 5 — The Wild: bug-out planning, wilderness survival, grid-down scenarios, ham radio, communications, economic collapse contingency.
`;

const ASSESSMENT_SYSTEM_PROMPT = `You are a Lifestyle Map advisor for The Stomping Path (TSP), a self-reliance podcast and community. Your role is to analyze a member's life context and recommend their starting zone on the TSP Zone Map.

The zone framework is a permaculture-inspired model that moves from the self outward:
${ZONE_DEFINITIONS}

Your task:
1. Read the member's questionnaire answers carefully
2. Identify the zone that best matches where they ARE RIGHT NOW (not where they want to be)
3. Identify a secondary zone that either supports the primary or represents their next natural step
4. Write a 2–3 sentence rationale in plain, direct language — like a trusted friend who knows this framework well

Rules:
- Be specific to their actual answers — no generic advice
- Prioritize where they have gaps/needs, not where they're already strong
- The rationale should feel personal, not like a template
- Return ONLY valid JSON — no markdown, no commentary

Response format (strict JSON):
{
  "primaryZone": "zone-0" | "zone-1" | "zone-2" | "zone-3" | "zone-4" | "zone-5",
  "secondaryZone": "zone-0" | "zone-1" | "zone-2" | "zone-3" | "zone-4" | "zone-5",
  "rationale": "2–3 sentence plain-language explanation"
}`;

/**
 * GET /api/map
 * Returns the authenticated user's lifestyle map record.
 */
router.get("/map", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [row] = await db
      .select()
      .from(userLifestyleMapsTable)
      .where(eq(userLifestyleMapsTable.userId, req.user.id))
      .limit(1);

    res.json({ map: row ?? null });
  } catch (err) {
    logger.error({ err }, "map fetch failed");
    res.status(500).json({ error: "Failed to load map" });
  }
});

/**
 * POST /api/map
 * Create or update the authenticated user's lifestyle map.
 */
router.post("/map", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const {
    entryMode,
    answers,
    primaryZone,
    secondaryZone,
    rationale,
    surrenderMode,
  } = req.body as {
    entryMode?: "guided" | "free";
    answers?: Record<string, string>;
    primaryZone?: string | null;
    secondaryZone?: string | null;
    rationale?: string | null;
    surrenderMode?: boolean;
  };

  try {
    const [row] = await db
      .insert(userLifestyleMapsTable)
      .values({
        userId: req.user.id,
        entryMode: entryMode ?? "free",
        answers: answers ?? {},
        primaryZone: primaryZone ?? null,
        secondaryZone: secondaryZone ?? null,
        rationale: rationale ?? null,
        surrenderMode: surrenderMode ?? false,
      })
      .onConflictDoUpdate({
        target: userLifestyleMapsTable.userId,
        set: {
          ...(entryMode !== undefined && { entryMode }),
          ...(answers !== undefined && { answers }),
          ...(primaryZone !== undefined && { primaryZone }),
          ...(secondaryZone !== undefined && { secondaryZone }),
          ...(rationale !== undefined && { rationale }),
          ...(surrenderMode !== undefined && { surrenderMode }),
          updatedAt: new Date(),
        },
      })
      .returning();

    res.json({ map: row });
  } catch (err) {
    logger.error({ err }, "map save failed");
    res.status(500).json({ error: "Failed to save map" });
  }
});

/**
 * POST /api/map/visit
 * Mark a zone as visited by the authenticated user.
 */
router.post("/map/visit", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { zoneSlug } = req.body as { zoneSlug: string };
  if (typeof zoneSlug !== "string" || !zoneSlug.match(/^zone-[0-5]$/)) {
    res.status(400).json({ error: "zoneSlug must be zone-0 through zone-5" });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(userLifestyleMapsTable)
      .where(eq(userLifestyleMapsTable.userId, req.user.id))
      .limit(1);

    const currentVisited: string[] = (existing?.visitedZones as string[]) ?? [];
    if (!currentVisited.includes(zoneSlug)) {
      currentVisited.push(zoneSlug);
    }

    if (!existing) {
      await db.insert(userLifestyleMapsTable).values({
        userId: req.user.id,
        visitedZones: currentVisited,
      });
    } else {
      await db
        .update(userLifestyleMapsTable)
        .set({ visitedZones: currentVisited, updatedAt: new Date() })
        .where(eq(userLifestyleMapsTable.userId, req.user.id));
    }

    res.json({ success: true, visitedZones: currentVisited });
  } catch (err) {
    logger.error({ err }, "map visit failed");
    res.status(500).json({ error: "Failed to record visit" });
  }
});

/**
 * POST /api/map/assess
 * AI-powered zone assessment from Mad Libs questionnaire answers.
 */
router.post("/map/assess", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { answers } = req.body as { answers: Record<string, string> };
  if (!answers || typeof answers !== "object" || Object.keys(answers).length === 0) {
    res.status(400).json({ error: "answers object is required" });
    return;
  }

  let openai: import("@workspace/integrations-openai-ai-server").OpenAI | null = null;
  try {
    const mod = await import("@workspace/integrations-openai-ai-server");
    openai = mod.openai;
  } catch {
    res.status(503).json({ error: "AI integration is not configured" });
    return;
  }

  const answerLines = Object.entries(answers)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 512,
      messages: [
        { role: "system", content: ASSESSMENT_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Here are my questionnaire answers:\n\n${answerLines}\n\nPlease assess my zone placement.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "";

    let parsed: { primaryZone: string; secondaryZone: string; rationale: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) {
        res.status(500).json({ error: "AI returned invalid response" });
        return;
      }
      parsed = JSON.parse(match[0]);
    }

    const validZones = ["zone-0", "zone-1", "zone-2", "zone-3", "zone-4", "zone-5"];
    if (!validZones.includes(parsed.primaryZone) || !validZones.includes(parsed.secondaryZone)) {
      res.status(500).json({ error: "AI returned invalid zone assignment" });
      return;
    }

    res.json({
      primaryZone: parsed.primaryZone,
      secondaryZone: parsed.secondaryZone,
      rationale: parsed.rationale,
    });
  } catch (err) {
    logger.error({ err }, "map assess failed");
    res.status(500).json({ error: "Failed to assess zone placement" });
  }
});

export default router;
