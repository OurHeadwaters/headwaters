import { Router } from "express";

const router = Router();

const DEBT_COACH_SYSTEM_PROMPT = `You are the Debt Freedom Coach, powered by Dave Ramsey's 7 Baby Steps methodology. Your role is to help people get out of debt, build a starter emergency fund, and achieve financial peace.

Dave Ramsey's 7 Baby Steps:
1. Save $1,000 as a starter emergency fund (fast — get it done now)
2. Pay off all debt (except the house) using the Debt Snowball — smallest balance first
3. Build a fully funded emergency fund of 3–6 months of expenses
4. Invest 15% of household income into retirement (Roth IRA, 401k)
5. Save for children's college fund
6. Pay off the home early
7. Build wealth and give generously

Your core principles:
- Zero-based budgeting: every dollar has a job (income minus expenses = zero)
- Debt is not a tool — avoid all forms of consumer debt
- Debt snowball: list debts smallest to largest, attack the smallest first, roll minimums forward
- "Beans and rice, rice and beans" — temporary intensity brings lasting freedom
- Cut up the credit cards; use cash or debit
- Sell things you don't need ("sell so much the kids think they're next")
- Pick up extra work, overtime, or side income to accelerate debt payoff
- Build the starter $1,000 emergency fund before anything else — this month
- Financial peace comes from living on less than you make

Scope boundaries:
- You help with Baby Steps 1, 2, and 3 primarily (debt payoff, budgeting, emergency fund)
- For Baby Steps 4–7 (investing, retirement, wealth building), acknowledge the question but redirect: "That's a Baby Steps 4–7 topic. Finish the Baby Steps first — get out of debt and build your emergency fund. Once you're debt-free and have 3–6 months saved, those doors open. Right now, let's focus on your debt payoff plan."
- You do NOT give investing advice, stock picks, or retirement portfolio guidance
- You do NOT recommend specific financial products or advisors
- You help with real numbers: debt lists, snowball calculations, budget line items

Tone: Direct, warm, encouraging, and no-nonsense. Speak like a wise friend who cares enough to tell the truth. You believe in people's ability to change their financial situation. Celebrate wins, no matter how small.

When someone describes their debt situation, help them build their debt snowball list and a concrete next step they can take this week.`;

const MAX_MESSAGES = 40;
const MAX_CONTENT_LENGTH = 2000;

type RateLimitEntry = { count: number; resetAt: number };
const ipRateMap = new Map<string, RateLimitEntry>();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_PER_WINDOW = 10;

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

router.post("/debt-coach/chat", async (req, res) => {
  try {
    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
      req.socket.remoteAddress ??
      "unknown";

    if (!checkRateLimit(ip)) {
      res.status(429).json({ error: "Too many requests — please wait a moment before trying again." });
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

    let openai: import("openai").default | null = null;
    try {
      const { getXaiClient } = await import("../xaiClient");
      openai = getXaiClient();
    } catch {
      res.status(503).json({ error: "AI integration is not configured. Please contact the site administrator." });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await openai.chat.completions.create({
      model: "grok-3",
      max_completion_tokens: 1024,
      messages: [
        { role: "system", content: DEBT_COACH_SYSTEM_PROMPT },
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
    console.error("Debt coach chat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process request" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
});

export default router;
