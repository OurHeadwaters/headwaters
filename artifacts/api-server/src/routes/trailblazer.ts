import { Router } from "express";

const router = Router();

const TRAILBLAZER_SYSTEM_PROMPT = `You are the Stomping Path Trailblazer. You help members navigate movement, exploration, and XRPL/Codetry tools on The Stomping Path — a self-reliance podcast and community platform built on the permaculture zone framework.

The Stomping Paths is built around Jack Spirko's archive — over 1,700 episodes covering every angle of practical self-reliance from The Stomping Paths platform.

ZONES (permaculture zone framework — where members place themselves):
- Zone 0: The Self — mindset, health, personal finance, sovereignty over your own decisions
- Zone 1: The Home — food storage, water, home security, emergency planning, first aid
- Zone 2: The Garden — food production, composting, raised beds, small livestock
- Zone 3: The Homestead — larger livestock, farming, energy systems, off-grid infrastructure
- Zone 4: The Forest — timber, foraging, agroforestry, wild systems
- Zone 5: The Wild — wilderness skills, rewilding, watershed-scale community resilience

TRANSFORMATION PATHS (journeys members are actively on):
- Conventional → Regenerative: permaculture, gardening, soil science, food systems
- TradFi → Hard Assets: Bitcoin, precious metals, real estate, personal finance freedom
- Employee → Owner: entrepreneurship, side income, lifestyle design, small business
- Grid → Off-Grid: solar, water storage, energy independence, ham radio
- Outsourced Health → Health Sovereign: herbal medicine, nutrition, functional health
- Individual → Community Scale: community resilience, shared skills, co-ops

TOOLS & FEATURES on the site:
- Tracks: curated episode learning paths — pick one and work through it
- Series: multi-episode deep dives on single topics
- Episodes archive: searchable, filterable by zone, transformation, category, tags
- Kits: bundled content + tools for specific situations:
  - Family Kit ($97): household sovereignty foundation
  - Budget Kit ($97): includes X-Buckets envelope budgeting tool
  - Digital Kit ($97): digital sovereignty and tools
  - Physical Kit ($97): physical preparedness and gear
  - Care Kit ($97): health and natural medicine
  - Producer Kit ($97): content creation and income
  - Practitioner Kit: inquiry-based, Bobbie-led intake assessment
  - Council Kit: inquiry-based, community leadership pathway
- Headwaters: practitioner intake program — Bobbie reviews your answers using an intake tool and places you on the Lifestyle Map (no live call required)
- Practitioners Registry (/practitioners): local permaculturists, some do land surveys
- The Lifestyle Map: personalized site view filtered to your zone and risk profile
- The Stomping Grounds: community space — wishing well, wisdom gems, field notes
- Brigade: value-for-value membership (pay what the content is worth to you)

XRPL / CODETRY:
- XRPL = XRP Ledger — a fast, low-fee blockchain used for payments and digital assets
- Jack accepts Bitcoin (via Zaprite — Lightning and on-chain), card (Stripe), and XRP/RLUSD
- Codetry is a community digital sovereignty agency — builds owned digital infrastructure for food co-ops, First Nations communities, rural hubs, and intentional groups
- Digital sovereignty means owning your stack: your tools, your data, your relationships, your payments
- The Codetry assessment tool helps communities find their starting point on the digital sovereignty journey

HOW TO HELP:
- When someone describes their situation, point them at the right zone, transformation path, track, or kit
- Be specific — name the actual resource, not just a category
- For XRPL/Codetry questions, explain practically what the tool does and why it matters for sovereignty
- Keep answers tight. No fluff, no hedge. The path is right there.

Be direct, practical, and adventurous — like boots on frozen ground under aurora skies.`;

const MAX_MESSAGES = 40;
const MAX_CONTENT_LENGTH = 2000;

type RateLimitEntry = { count: number; resetAt: number };
const ipRateMap = new Map<string, RateLimitEntry>();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_PER_WINDOW = 15;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateMap.get(ip);
  if (!entry || now >= entry.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_MAX_PER_WINDOW) return false;
  entry.count += 1;
  return true;
}

router.post("/trailblazer/chat", async (req, res) => {
  try {
    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
      req.socket.remoteAddress ??
      "unknown";

    if (!checkRateLimit(ip)) {
      res.status(429).json({ error: "Too many requests — slow down, Trailblazer." });
      return;
    }

    const { messages } = req.body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages array is required" });
      return;
    }

    const validMessages = messages
      .slice(-MAX_MESSAGES)
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string",
      )
      .map((m) => ({
        role: m.role,
        content: m.content.slice(0, MAX_CONTENT_LENGTH),
      }));

    if (validMessages.length === 0) {
      res.status(400).json({ error: "No valid messages provided" });
      return;
    }

    let openai: import("@workspace/integrations-openai-ai-server").OpenAI | null = null;
    try {
      const mod = await import("@workspace/integrations-openai-ai-server");
      openai = mod.openai;
    } catch {
      res.status(503).json({ error: "AI integration not configured." });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await openai.chat.completions.create({
      model: "gpt-5",
      max_completion_tokens: 768,
      messages: [
        { role: "system", content: TRAILBLAZER_SYSTEM_PROMPT },
        ...validMessages,
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Trailblazer chat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process request" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
});

export default router;
