import { Router, type IRouter, type Request, type Response } from "express";
import { db, headwatersClientsTable, userLifestyleMapsTable, headwatersBusinessDataTable, headwatersIntakeSubmissionsTable } from "@workspace/db";
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
You are a dual-state intake advisor for The Stomping Path. You receive post-session notes from a practitioner after working with a client. Your role is to assess TWO systems simultaneously using the same permaculture zone framework:

THE ZONE FRAMEWORK applies to both people and land:
Zone 0 — The Self / The Homesite: mindset, finances, personal sovereignty. On land: the dwelling, core water/heat/shelter systems, the immediate 10-foot radius.
Zone 1 — The Home / The Kitchen Garden: food storage, emergency planning, basic preparedness. On land: annual beds, cold frames, herb gardens, immediate water catchment, the daily-touch zone.
Zone 2 — The Garden / The Near Field: food production, chickens, bees, composting. On land: perennial food systems, established garden zones, small livestock paddocks, food forest establishment.
Zone 3 — The Homestead / The Working Farm: larger livestock, solar, off-grid systems. On land: field crops, pasture, larger animal infrastructure, ponds, energy systems, barns.
Zone 4 — The Forest / The Edge: hunting, foraging, bushcraft. On land: woodlot management, silvopasture, mushroom logs, semi-wild food systems, timber stands.
Zone 5 — The Wild: primitive skills, grid-down scenarios. On land: true wilderness areas, minimal intervention, seed stock conservation, long-rotation systems, ungrazed land.

PERSON PLACEMENT — assess where this person IS RIGHT NOW:
- Prioritize gaps and needs, not strengths
- Risk profile (1–5): 1=Tight (hand-held, overwhelmed), 2=Guided (needs structure), 3=Balanced (can handle a map), 4=Open (self-starter), 5=Self-directed (learns by wandering)

LAND PLACEMENT — assess where the land IS RIGHT NOW and what it is ready for next:
- What zone of development has the land reached?
- What is the land's most immediate need or greatest untapped potential?
- What zone of work would yield the most return for the least disruption?

THE HARMONY NOTE — name the exact intersection:
- Where does this person's current capacity meet what this land needs most?
- Be specific: name the actual work (e.g. "establishing the kitchen garden perimeter"), the season if relevant, and why this moment of overlap matters
- The harmony note is the practitioner's most valuable output — it tells them exactly where to start

Rules:
- Be specific to the signals in the dump — no generic advice
- The client rationale is written for the person (second person: "You…"), plain and direct
- If no land context was provided, return null for all land fields
- Return ONLY valid JSON — no markdown, no commentary outside the JSON

Response format (strict JSON, always return all fields):
{
  "primaryZone": "zone-0" | "zone-1" | "zone-2" | "zone-3" | "zone-4" | "zone-5",
  "secondaryZone": "zone-0" | "zone-1" | "zone-2" | "zone-3" | "zone-4" | "zone-5",
  "riskProfile": 1 | 2 | 3 | 4 | 5,
  "clientRationale": "2–3 sentence plain-language explanation written for the client",
  "practitionerSummary": "bullet1\\nbullet2\\nbullet3",
  "landZone": "zone-0" | "zone-1" | "zone-2" | "zone-3" | "zone-4" | "zone-5" | null,
  "landSecondaryZone": "zone-0" | "zone-1" | "zone-2" | "zone-3" | "zone-4" | "zone-5" | null,
  "landRationale": "2–3 sentences describing what the land is ready for next. Null if no land context.",
  "harmonyNote": "1–2 sentences naming exactly where this person's capacity meets this land's needs — specific work, not abstract principles. Null if no land context."
}`;

function checkPassphrase(req: Request, res: Response): boolean {
  const expected = process.env.HEADWATERS_PASSPHRASE;
  if (!expected) {
    res.status(503).json({ error: "Headwaters passphrase not configured on server" });
    return false;
  }
  const provided = (req.headers["x-hw-passphrase"] as string | undefined)?.trim();
  if (!provided || provided !== expected.trim()) {
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

  const { dump, clientId, landDump } = req.body as { dump: string; clientId?: string; landDump?: string };

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
    const landSection = landDump?.trim()
      ? `\n\n---\nLAND CONTEXT:\n${landDump.trim()}\n---`
      : "\n\n(No land context provided — return null for all land fields.)";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 1200,
      messages: [
        { role: "system", content: TASHA_CONTEXT },
        {
          role: "user",
          content: `Here is my post-session brain dump:${clientContext}\n\n---\nPERSON:\n${dump.trim()}\n---${landSection}\n\nPlease give me the dual-state placement.`,
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
      landZone?: string | null;
      landSecondaryZone?: string | null;
      landRationale?: string | null;
      harmonyNote?: string | null;
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

    const validZonesOrNull = (v: string | null | undefined) =>
      v && validZones.includes(v) ? v : null;

    res.json({
      primaryZone: parsed.primaryZone,
      secondaryZone: parsed.secondaryZone,
      riskProfile,
      clientRationale: parsed.clientRationale ?? "",
      practitionerSummary: parsed.practitionerSummary ?? "",
      landZone: validZonesOrNull(parsed.landZone),
      landSecondaryZone: validZonesOrNull(parsed.landSecondaryZone),
      landRationale: parsed.landRationale ?? null,
      harmonyNote: parsed.harmonyNote ?? null,
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
    practitionerName,
    dump,
    landZone,
    landSecondaryZone,
    landRationale,
    harmonyNote,
  } = req.body as {
    clientId: string;
    primaryZone: string;
    secondaryZone: string;
    riskProfile: number;
    clientRationale: string;
    practitionerNotes: string;
    practitionerName?: string;
    dump?: string;
    landZone?: string;
    landSecondaryZone?: string;
    landRationale?: string;
    harmonyNote?: string;
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

    // Normalise land zone sentinels
    const resolvedLandZone = (!landZone || landZone === "none") ? null : landZone;
    const resolvedLandSecondaryZone = (!landSecondaryZone || landSecondaryZone === "none") ? null : landSecondaryZone;

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
          practitionerName: practitionerName || null,
          practitionerNotes: practitionerNotes || null,
          landZone: resolvedLandZone,
          landSecondaryZone: resolvedLandSecondaryZone,
          landRationale: landRationale || null,
          harmonyNote: harmonyNote || null,
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
            practitionerName: practitionerName || null,
            practitionerNotes: practitionerNotes || null,
            landZone: resolvedLandZone,
            landSecondaryZone: resolvedLandSecondaryZone,
            landRationale: landRationale || null,
            harmonyNote: harmonyNote || null,
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

/**
 * POST /api/headwaters/intake
 * Public endpoint — no passphrase required. Visitors submit the pre-session intake form.
 */
router.post("/headwaters/intake", async (req: Request, res: Response) => {
  const {
    name,
    email,
    householdSize,
    landSituation,
    landYears,
    keySkills,
    primaryGoals,
    riskTolerance,
    additionalNotes,
  } = req.body as {
    name: string;
    email: string;
    householdSize?: number | null;
    landSituation?: string | null;
    landYears?: string | null;
    keySkills?: string | null;
    primaryGoals?: string | null;
    riskTolerance?: string | null;
    additionalNotes?: string | null;
  };

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "A valid email is required" });
    return;
  }

  try {
    const [row] = await db
      .insert(headwatersIntakeSubmissionsTable)
      .values({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        householdSize: typeof householdSize === "number" ? householdSize : null,
        landSituation: landSituation ?? null,
        landYears: landYears ?? null,
        keySkills: keySkills ?? null,
        primaryGoals: primaryGoals ?? null,
        riskTolerance: riskTolerance ?? null,
        additionalNotes: additionalNotes ?? null,
        status: "new",
      })
      .returning();

    res.status(201).json({
      submissionId: row.submissionId,
      message: "Intake submitted. Tasha will be in touch to schedule your session.",
    });
  } catch (err) {
    logger.error({ err }, "headwaters intake submit failed");
    res.status(500).json({ error: "Failed to save your intake. Please try again." });
  }
});

/**
 * GET /api/headwaters/intake
 * Passphrase-protected. Returns all intake submissions for Tasha to review.
 */
router.get("/headwaters/intake", async (req: Request, res: Response) => {
  if (!checkPassphrase(req, res)) return;

  try {
    const rows = await db
      .select()
      .from(headwatersIntakeSubmissionsTable)
      .orderBy(desc(headwatersIntakeSubmissionsTable.createdAt));

    res.json(rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })));
  } catch (err) {
    logger.error({ err }, "headwaters intake list failed");
    res.status(500).json({ error: "Failed to load intake submissions" });
  }
});

/**
 * PATCH /api/headwaters/intake/:submissionId
 * Passphrase-protected. Update status of a submission.
 */
router.patch("/headwaters/intake/:submissionId", async (req: Request, res: Response) => {
  if (!checkPassphrase(req, res)) return;

  const { submissionId } = req.params as { submissionId: string };
  const { status } = req.body as { status?: string };

  const validStatuses = ["new", "reviewed", "scheduled", "completed", "declined"];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: `status must be one of: ${validStatuses.join(", ")}` });
    return;
  }

  try {
    const [row] = await db
      .update(headwatersIntakeSubmissionsTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(headwatersIntakeSubmissionsTable.submissionId, submissionId))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    res.json({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "headwaters intake patch failed");
    res.status(500).json({ error: "Failed to update submission" });
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
