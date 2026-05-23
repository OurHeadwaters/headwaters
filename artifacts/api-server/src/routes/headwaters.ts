import { Router, type IRouter, type Request, type Response } from "express";
import { db, headwatersClientsTable, userLifestyleMapsTable, headwatersBusinessDataTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
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

const TASHA_CONTEXT = `
You are a zone placement advisor for The Survival Podcast (TSP). You are reading a post-session brain dump from a practitioner (Tasha Parr) after an intake session with a client.

Tasha is a homesteader, preparedness educator, and community builder in Northwestern Ontario. She coaches people on self-reliance and resilience using a permaculture zone framework:
${ZONE_DEFINITIONS}

Risk profile (1–5) measures how much guidance the client needs at this stage of their journey:
- 1 = Tight: hand-held, one step at a time, prone to overwhelm or just starting
- 2 = Guided: needs structure and check-ins
- 3 = Balanced: can handle a map, needs some curation
- 4 = Open: motivated self-starter, wants options
- 5 = Self-directed: experienced, wants full map access, learns by wandering

Your task:
1. Read the practitioner's brain dump carefully
2. Identify the primary zone that matches where this person IS RIGHT NOW (not where they want to be)
3. Identify a secondary zone that either supports or represents their next natural step
4. Assess their risk profile (1–5) based on the dump's signals about their experience level, confidence, and overwhelm
5. Write a 2–3 sentence rationale in second person ("You…") that the client will see — plain, direct, personal
6. Write a bulleted practitioner summary (what you read from the dump that informed your assessment)

Rules:
- Be specific to the actual signals in the dump — no generic advice
- Prioritize where they have gaps/needs, not where they're already strong
- The client rationale should feel like a trusted guide who knows this framework well
- Return ONLY valid JSON — no markdown, no commentary outside the JSON

Response format (strict JSON):
{
  "primaryZone": "zone-0" | "zone-1" | "zone-2" | "zone-3" | "zone-4" | "zone-5",
  "secondaryZone": "zone-0" | "zone-1" | "zone-2" | "zone-3" | "zone-4" | "zone-5",
  "riskProfile": 1 | 2 | 3 | 4 | 5,
  "clientRationale": "2–3 sentence plain-language explanation written for the client",
  "practitionerSummary": "bullet1\\nbullet2\\nbullet3"
}`;

function checkPassphrase(req: Request, res: Response): boolean {
  const expected = process.env.HEADWATERS_PASSPHRASE;
  if (!expected) {
    res.status(503).json({ error: "Headwaters passphrase not configured on server" });
    return false;
  }
  const provided = req.headers["x-hw-passphrase"] as string | undefined;
  if (!provided || provided !== expected) {
    res.status(401).json({ error: "Invalid or missing passphrase" });
    return false;
  }
  return true;
}

/**
 * GET /api/headwaters/dashboard
 */
router.get("/headwaters/dashboard", async (req: Request, res: Response) => {
  if (!checkPassphrase(req, res)) return;

  try {
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(headwatersClientsTable);

    const recentIntakes = await db
      .select()
      .from(headwatersClientsTable)
      .orderBy(desc(headwatersClientsTable.updatedAt))
      .limit(5);

    const zoneRows = await db
      .select({
        zone: headwatersClientsTable.primaryZone,
        count: sql<number>`count(*)::int`,
      })
      .from(headwatersClientsTable)
      .where(sql`${headwatersClientsTable.primaryZone} IS NOT NULL`)
      .groupBy(headwatersClientsTable.primaryZone);

    const zoneDistribution = zoneRows.map((r) => ({
      zone: r.zone as string,
      count: r.count,
    }));

    const serialized = recentIntakes.map((c) => ({
      ...c,
      lastPushedAt: c.lastPushedAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    res.json({
      totalClients: totalResult?.count ?? 0,
      recentIntakes: serialized,
      zoneDistribution,
    });
  } catch (err) {
    logger.error({ err }, "headwaters dashboard failed");
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

/**
 * GET /api/headwaters/clients
 */
router.get("/headwaters/clients", async (req: Request, res: Response) => {
  if (!checkPassphrase(req, res)) return;

  try {
    const clients = await db
      .select()
      .from(headwatersClientsTable)
      .orderBy(desc(headwatersClientsTable.updatedAt));

    res.json(clients.map((c) => ({
      ...c,
      lastPushedAt: c.lastPushedAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })));
  } catch (err) {
    logger.error({ err }, "headwaters list clients failed");
    res.status(500).json({ error: "Failed to list clients" });
  }
});

/**
 * POST /api/headwaters/clients
 */
router.post("/headwaters/clients", async (req: Request, res: Response) => {
  if (!checkPassphrase(req, res)) return;

  const { name, email, connectedUserId, notes } = req.body as {
    name: string;
    email?: string;
    connectedUserId?: string;
    notes?: string;
  };

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  try {
    const [row] = await db
      .insert(headwatersClientsTable)
      .values({
        name: name.trim(),
        email: email ?? null,
        connectedUserId: connectedUserId ?? null,
        notes: notes ?? null,
      })
      .returning();

    res.status(201).json({
      ...row,
      lastPushedAt: row.lastPushedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "headwaters create client failed");
    res.status(500).json({ error: "Failed to create client" });
  }
});

/**
 * GET /api/headwaters/clients/:clientId
 */
router.get("/headwaters/clients/:clientId", async (req: Request, res: Response) => {
  if (!checkPassphrase(req, res)) return;

  const { clientId } = req.params as { clientId: string };

  try {
    const [row] = await db
      .select()
      .from(headwatersClientsTable)
      .where(eq(headwatersClientsTable.clientId, clientId))
      .limit(1);

    if (!row) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    res.json({
      ...row,
      lastPushedAt: row.lastPushedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "headwaters get client failed");
    res.status(500).json({ error: "Failed to get client" });
  }
});

/**
 * PATCH /api/headwaters/clients/:clientId
 */
router.patch("/headwaters/clients/:clientId", async (req: Request, res: Response) => {
  if (!checkPassphrase(req, res)) return;

  const { clientId } = req.params as { clientId: string };
  const { name, email, connectedUserId, notes } = req.body as {
    name?: string;
    email?: string | null;
    connectedUserId?: string | null;
    notes?: string | null;
  };

  try {
    const [row] = await db
      .update(headwatersClientsTable)
      .set({
        ...(name !== undefined && { name: name.trim() }),
        ...(email !== undefined && { email }),
        ...(connectedUserId !== undefined && { connectedUserId }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      })
      .where(eq(headwatersClientsTable.clientId, clientId))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    res.json({
      ...row,
      lastPushedAt: row.lastPushedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "headwaters patch client failed");
    res.status(500).json({ error: "Failed to update client" });
  }
});

/**
 * POST /api/headwaters/interpret
 * AI interpretation of a brain dump
 */
router.post("/headwaters/interpret", async (req: Request, res: Response) => {
  if (!checkPassphrase(req, res)) return;

  const { dump, clientId } = req.body as { dump: string; clientId?: string };

  if (!dump || typeof dump !== "string" || dump.trim().length < 10) {
    res.status(400).json({ error: "dump must be at least 10 characters" });
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

  // Load client context if provided
  let clientContext = "";
  if (clientId) {
    try {
      const [client] = await db
        .select()
        .from(headwatersClientsTable)
        .where(eq(headwatersClientsTable.clientId, clientId))
        .limit(1);
      if (client) {
        clientContext = `\n\nClient context: ${client.name}${client.notes ? ` — ${client.notes}` : ""}${client.primaryZone ? `. Previous zone: ${client.primaryZone}` : ""}`;
      }
    } catch {
      // Non-fatal — continue without client context
    }
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 800,
      messages: [
        { role: "system", content: TASHA_CONTEXT },
        {
          role: "user",
          content: `Here is my post-session brain dump:${clientContext}\n\n---\n${dump.trim()}\n---\n\nPlease give me the zone placement and risk profile.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "";

    let parsed: {
      primaryZone: string;
      secondaryZone: string;
      riskProfile: number;
      clientRationale: string;
      practitionerSummary: string;
    };

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

    const riskProfile = Math.min(5, Math.max(1, Math.round(Number(parsed.riskProfile) || 3)));

    res.json({
      primaryZone: parsed.primaryZone,
      secondaryZone: parsed.secondaryZone,
      riskProfile,
      clientRationale: parsed.clientRationale ?? "",
      practitionerSummary: parsed.practitionerSummary ?? "",
    });
  } catch (err) {
    logger.error({ err }, "headwaters interpret failed");
    res.status(500).json({ error: "Failed to interpret dump" });
  }
});

/**
 * POST /api/headwaters/push
 * Confirm placement and push to TSP user_lifestyle_maps
 */
router.post("/headwaters/push", async (req: Request, res: Response) => {
  if (!checkPassphrase(req, res)) return;

  const {
    clientId,
    primaryZone,
    secondaryZone,
    riskProfile,
    clientRationale,
    practitionerNotes,
    dump,
  } = req.body as {
    clientId: string;
    primaryZone: string;
    secondaryZone: string;
    riskProfile: number;
    clientRationale: string;
    practitionerNotes: string;
    dump?: string;
  };

  // Normalise "none" sentinel from the UI to null
  const resolvedSecondaryZone = (!secondaryZone || secondaryZone === "none") ? null : secondaryZone;

  if (!clientId || !primaryZone || !riskProfile || !clientRationale) {
    res.status(400).json({ error: "clientId, primaryZone, riskProfile, and clientRationale are required" });
    return;
  }

  const validZones = ["zone-0", "zone-1", "zone-2", "zone-3", "zone-4", "zone-5"];
  if (!validZones.includes(primaryZone)) {
    res.status(400).json({ error: "Invalid primary zone slug" });
    return;
  }
  if (resolvedSecondaryZone !== null && !validZones.includes(resolvedSecondaryZone)) {
    res.status(400).json({ error: "Invalid secondary zone slug" });
    return;
  }

  try {
    // Load client
    const [client] = await db
      .select()
      .from(headwatersClientsTable)
      .where(eq(headwatersClientsTable.clientId, clientId))
      .limit(1);

    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    // Update client record with latest placement
    await db
      .update(headwatersClientsTable)
      .set({
        primaryZone,
        secondaryZone: resolvedSecondaryZone,
        riskProfile,
        ...(dump !== undefined && { lastDump: dump }),
        lastPushedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(headwatersClientsTable.clientId, clientId));

    // Push to TSP lifestyle map if connectedUserId is set
    if (client.connectedUserId) {
      await db
        .insert(userLifestyleMapsTable)
        .values({
          userId: client.connectedUserId,
          entryMode: "practitioner",
          primaryZone,
          secondaryZone: resolvedSecondaryZone,
          rationale: clientRationale,
          riskProfile,
          practitionerNotes: practitionerNotes || null,
          answers: {},
          surrenderMode: false,
        })
        .onConflictDoUpdate({
          target: userLifestyleMapsTable.userId,
          set: {
            entryMode: "practitioner",
            primaryZone,
            secondaryZone: resolvedSecondaryZone,
            rationale: clientRationale,
            riskProfile,
            practitionerNotes: practitionerNotes || null,
            updatedAt: new Date(),
          },
        });
    }

    res.json({
      success: true,
      message: client.connectedUserId
        ? `Placement pushed to TSP for ${client.name}`
        : `Placement saved locally for ${client.name} (no TSP user ID connected)`,
    });
  } catch (err) {
    logger.error({ err }, "headwaters push failed");
    res.status(500).json({ error: "Failed to push placement" });
  }
});

const VALID_SECTIONS = ["priorities", "financials", "notes"] as const;
type BusinessSection = (typeof VALID_SECTIONS)[number];

/**
 * GET /api/headwaters/business/:section
 */
router.get("/headwaters/business/:section", async (req: Request, res: Response) => {
  if (!checkPassphrase(req, res)) return;

  const section = req.params.section as BusinessSection;
  if (!VALID_SECTIONS.includes(section)) {
    res.status(400).json({ error: "Invalid section — must be priorities, financials, or notes" });
    return;
  }

  try {
    const [row] = await db
      .select()
      .from(headwatersBusinessDataTable)
      .where(eq(headwatersBusinessDataTable.key, section))
      .limit(1);

    const defaults: Record<BusinessSection, unknown> = {
      priorities: [],
      financials: [],
      notes: "",
    };

    res.json({
      section,
      value: row ? JSON.parse(row.value) : defaults[section],
      updatedAt: row?.updatedAt.toISOString() ?? new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "headwaters business get failed");
    res.status(500).json({ error: "Failed to load business section" });
  }
});

/**
 * PATCH /api/headwaters/business/:section
 */
router.patch("/headwaters/business/:section", async (req: Request, res: Response) => {
  if (!checkPassphrase(req, res)) return;

  const section = req.params.section as BusinessSection;
  if (!VALID_SECTIONS.includes(section)) {
    res.status(400).json({ error: "Invalid section — must be priorities, financials, or notes" });
    return;
  }

  const { value } = req.body as { value: unknown };
  if (value === undefined) {
    res.status(400).json({ error: "value is required" });
    return;
  }

  try {
    const [row] = await db
      .insert(headwatersBusinessDataTable)
      .values({ key: section, value: JSON.stringify(value) })
      .onConflictDoUpdate({
        target: headwatersBusinessDataTable.key,
        set: { value: JSON.stringify(value), updatedAt: new Date() },
      })
      .returning();

    res.json({
      section,
      value: JSON.parse(row.value),
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "headwaters business patch failed");
    res.status(500).json({ error: "Failed to save business section" });
  }
});

export default router;
