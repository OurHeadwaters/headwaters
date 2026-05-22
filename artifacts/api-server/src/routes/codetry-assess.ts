import { Router, type IRouter, type Request, type Response } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const ipHits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

const CODETRY_ZONE_DEFINITIONS = `
Stage 1 — Dependent: Fully reliant on SaaS platforms and third-party tools your community doesn't own. Data lives elsewhere. No internal technical capacity.
Stage 2 — Aware: You recognize the dependency problem. You're starting to think about alternatives but haven't taken concrete steps yet.
Stage 3 — Mapping: You're assessing your gaps and readiness. You have some internal capacity or are working to build it. You know what you need to solve.
Stage 4 — Building: You're actively constructing your first owned tool or have recently completed one. You're learning what ownership means in practice.
Stage 5 — Connected: You have a working hub of owned tools and are ready to connect with other communities or build out more zones.
Stage 6 — Sovereign: You run multi-community or regional infrastructure. Your stack is fully owned, maintainable by your people, and you're helping others get there.

Codetry Services:
- Zone Assessment ($1,500–$3,000, 3–5 weeks): For communities at Stages 1–2. A structured gap analysis before any building begins. You get a written report and prioritised tool recommendations.
- Hub Implementation ($4,000–$12,000, 6–14 weeks): For communities at Stages 3–4. Design, build, and hand off a single owned tool — order management, member portal, producer directory, or community credit module.
- Regional Platform ($15,000+, 3–6 months): For communities at Stages 5–6. Multi-community infrastructure across a watershed or district.
`;

const ASSESSMENT_SYSTEM_PROMPT = `You are a Digital Sovereignty advisor for Codetry — a community software agency that builds owned digital tools for food co-ops, First Nations communities, rural hubs, and community organisations. Your role is to analyse a community's digital situation and recommend their starting point.

The digital sovereignty stage framework:
${CODETRY_ZONE_DEFINITIONS}

Your task:
1. Read the community's questionnaire answers carefully
2. Identify which stage (1–6) best matches where they ARE RIGHT NOW (not where they want to be)
3. Identify the primary service that fits their current stage (Zone Assessment / Hub Implementation / Regional Platform)
4. Identify a secondary service that is their natural next step if it differs from primary
5. Write a 2–3 sentence rationale in plain, direct language — like a trusted advisor who builds community tools for a living

Rules:
- Be specific to their actual answers — no generic advice
- Prioritise where they have gaps and real urgency, not aspirations
- The rationale should feel personal, not like a template
- If budget or capacity constraints are mentioned, factor them in
- Return ONLY valid JSON — no markdown, no commentary

Response format (strict JSON):
{
  "stage": 1 | 2 | 3 | 4 | 5 | 6,
  "stageName": "Dependent" | "Aware" | "Mapping" | "Building" | "Connected" | "Sovereign",
  "primaryService": "Zone Assessment" | "Hub Implementation" | "Regional Platform",
  "secondaryService": "Zone Assessment" | "Hub Implementation" | "Regional Platform",
  "rationale": "2–3 sentence plain-language explanation"
}`;

router.post("/api/codetry/assess", async (req: Request, res: Response) => {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? "unknown";

  if (isRateLimited(ip)) {
    res.status(429).json({ error: "Too many requests — please wait a moment and try again." });
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
          content: `Here are our community's questionnaire answers:\n\n${answerLines}\n\nPlease assess our digital sovereignty stage and recommend the right starting point.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "";

    let parsed: {
      stage: number;
      stageName: string;
      primaryService: string;
      secondaryService: string;
      rationale: string;
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

    const validServices = ["Zone Assessment", "Hub Implementation", "Regional Platform"];
    if (
      typeof parsed.stage !== "number" ||
      parsed.stage < 1 ||
      parsed.stage > 6 ||
      !validServices.includes(parsed.primaryService) ||
      !validServices.includes(parsed.secondaryService)
    ) {
      res.status(500).json({ error: "AI returned invalid assessment" });
      return;
    }

    res.json({
      stage: parsed.stage,
      stageName: parsed.stageName,
      primaryService: parsed.primaryService,
      secondaryService: parsed.secondaryService,
      rationale: parsed.rationale,
    });
  } catch (err) {
    logger.error({ err }, "codetry assess failed");
    res.status(500).json({ error: "Failed to assess community stage" });
  }
});

export default router;
