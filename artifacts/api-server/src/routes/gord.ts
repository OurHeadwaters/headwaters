import { Router } from "express";
import { db, gordTipsTable } from "@workspace/db";
import { desc, isNotNull } from "drizzle-orm";

const router = Router();

const GORD_SYSTEM_PROMPT = `You are Gord — a cheeky, deadpan northern bird guide who champions self-reliance and gently roasts system-dependent thinking. You appear as a chat widget on both The Stomping Path survival/self-reliance site and Codetry, a community digital sovereignty agency.

Your personality:
- Dry, deadpan sarcasm — the kind that makes people laugh then think
- You call out lazy, system-dependent thinking: not to shame, but to motivate. You're never mean — you're the friend who tells you the truth with a smirk
- Always helpful in the end. The roast lands, then you point the way forward
- Signature line you drop naturally: "Gord's on board."
- You speak like a wise-cracking northern guy who's seen it all — ice storms, grid failures, bad Wi-Fi, the works
- Short sentences. No corporate fluff. No bullet-pointed lecture. Wry, warm, and direct
- You know about self-reliance, preparedness, digital sovereignty, permaculture zones, and community resilience — but you wear it lightly
- If someone asks you to do something genuinely outside your lane (math homework, writing code for them, etc.) you redirect them with a quip

Opening move when you first appear: Something short, slightly deadpan, welcoming but with edge.

Keep answers conversational and tight — rarely more than 3–4 sentences unless the question genuinely needs it. End on something actionable or a pointed observation.`;

const MAX_MESSAGES = 30;
const MAX_CONTENT_LENGTH = 2000;

type RateLimitEntry = { count: number; resetAt: number };
const ipRateMap = new Map<string, RateLimitEntry>();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_PER_WINDOW = 20;

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

async function gordHandler(req: import("express").Request, res: import("express").Response) {
  try {
    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
      req.socket.remoteAddress ??
      "unknown";

    if (!checkRateLimit(ip)) {
      res.status(429).json({ error: "Easy there — even Gord needs a breather. Try again in a minute." });
      return;
    }

    const { messages, context } = req.body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      context?: { path?: string; description?: string };
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

    const systemMessages: Array<{ role: "system"; content: string }> = [
      { role: "system", content: GORD_SYSTEM_PROMPT },
    ];

    if (context?.path || context?.description) {
      const contextParts: string[] = ["[Current page context]"];
      if (context.path) contextParts.push(`Path: ${context.path}`);
      if (context.description) contextParts.push(`Page: ${context.description}`);
      contextParts.push("Use this to give specific, relevant answers — point people to the right section of the site when it makes sense.");
      systemMessages.push({ role: "system", content: contextParts.join("\n") });
    }

    const stream = await openai.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 512,
      messages: [
        ...systemMessages,
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
    console.error("Gord chat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process request" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
}

router.post("/gord", gordHandler);
router.post("/gord/chat", gordHandler);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/gord/tips/recent
//
// Public (no auth). Returns the most recent named tips for the supporter wall.
// Anonymous tips (no tipperName) are excluded.
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Anonymise a tipper name for public display.
 * Only the first name (first whitespace-delimited word) is exposed — never a
 * full legal/cardholder name.  e.g. "John Smith" → "John".
 */
function anonymiseName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName.trim();
}

router.get("/gord/tips/recent", async (_req, res) => {
  try {
    const rows = await db
      .select({
        tipperName: gordTipsTable.tipperName,
        amountPaidCents: gordTipsTable.amountPaidCents,
        tippedAt: gordTipsTable.tippedAt,
      })
      .from(gordTipsTable)
      .where(isNotNull(gordTipsTable.tipperName))
      .orderBy(desc(gordTipsTable.tippedAt))
      .limit(20);
    res.json(
      rows.map((r) => ({
        name: anonymiseName(r.tipperName as string),
        amountCents: r.amountPaidCents,
        tippedAt: (r.tippedAt as Date).toISOString(),
      })),
    );
  } catch (err) {
    console.error("gord-tips-recent: GET failed", err);
    res.status(500).json({ error: "Failed to load recent supporters" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/gord/tip
//
// Creates a Stripe Checkout session for a one-time Gord tip.
// Body: { amountCents: 200 | 500, successUrl: string, cancelUrl: string }
// Returns: { url: string }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/gord/tip", async (req, res) => {
  try {
    const { amountCents, successUrl, cancelUrl } = req.body as {
      amountCents?: number;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!amountCents || typeof amountCents !== "number" || !Number.isInteger(amountCents) || amountCents < 100) {
      res.status(400).json({ error: "amountCents must be an integer of at least 100 (i.e. $1.00)" });
      return;
    }
    if (!successUrl || !cancelUrl) {
      res.status(400).json({ error: "successUrl and cancelUrl are required" });
      return;
    }

    const { getUncachableStripeClient } = await import("../stripeClient");
    const stripe = await getUncachableStripeClient();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: "Tip for Gord",
              description: "Buy Gord a seed or two. He'll act like he doesn't care. He cares.",
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { source: "gord-tip" },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Gord tip error:", err);
    res.status(500).json({ error: "Failed to create tip session" });
  }
});

export default router;
