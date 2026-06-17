import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { authMiddleware } from "./middlewares/authMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";
import { WebhookHandlers } from "./webhookHandlers";
import path from "path";
import { fileURLToPath } from "url";
import { createProxyMiddleware, type RequestHandler } from "http-proxy-middleware";
import { createRouteLimiter } from "./middlewares/rateLimiter";

const webhookLimiter = createRouteLimiter("webhook", 30, 60_000);

const app: Express = express();
app.set("trust proxy", 1);

// ─── Stripe webhook — MUST be registered BEFORE express.json() ────────────────
// Stripe requires the raw Buffer body to verify the webhook signature.
// express.json() would parse it into an object, breaking signature verification.
const stripeWebhookHandler = express.raw({ type: "application/json" });

async function handleStripeWebhook(
  req: import("express").Request,
  res: import("express").Response,
) {
  const signature = req.headers["stripe-signature"];
  if (!signature) {
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }
  const sig = Array.isArray(signature) ? signature[0] : signature;
  try {
    await WebhookHandlers.processWebhook(req.body as Buffer, sig);
    res.status(200).json({ received: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "stripe webhook: processing failed");
    res.status(400).json({ error: msg });
  }
}

// Main Stripe webhook (shared — handles all event types)
app.post("/api/stripe/webhook", webhookLimiter, stripeWebhookHandler, handleStripeWebhook);

// Brigade-specific webhook alias — same handler, separate URL for clarity.
// Both endpoints use the same Stripe webhook secret and shared processWebhook logic.
// The Brigade subscription events (checkout.session.completed,
// customer.subscription.updated, customer.subscription.deleted) are routed
// by metadata.brigade_user_id presence inside WebhookHandlers.processWebhook.
app.post("/api/brigade/webhook", webhookLimiter, stripeWebhookHandler, handleStripeWebhook);

// ─── Zaprite webhook — Bitcoin / Lightning / XRP / RLUSD payments ─────────────
// Zaprite does not support HMAC signing. Secured with a secret URL token instead:
//   POST /api/zaprite/webhook?token=<ZAPRITE_WEBHOOK_TOKEN>
// Must be registered BEFORE express.json() so req.body stays a raw Buffer.
app.post(
  "/api/zaprite/webhook",
  express.raw({ type: "application/json" }),
  async (req: import("express").Request, res: import("express").Response) => {
    try {
      await import("./zapriteWebhook").then(({ handleZapriteWebhook }) =>
        handleZapriteWebhook(req, res),
      );
    } catch (err) {
      logger.error({ err }, "zaprite webhook: handler import failed");
      res.status(500).json({ error: "Internal error" });
    }
  },
);

// ─── All other middleware (applied AFTER the webhook route) ───────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
const CORS_ORIGINS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /\.replit\.app$/,
  /\.replit\.dev$/,
  /\.repl\.co$/,
  "https://thestompingpaths.com",
  "https://www.thestompingpaths.com",
  "https://our-headwaters.replit.app",
];
app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = CORS_ORIGINS.some((o) =>
      typeof o === "string" ? o === origin : o.test(origin),
    );
    callback(null, allowed ? origin : false);
  },
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

// ─── Headwaters — dev proxy or static SPA ────────────────────────────────────
// In development: proxy to the Vite dev server (hot reload, instant edits).
// In production: serve the pre-built static files.
// Run `pnpm --filter @workspace/headwaters run build` to update prod assets.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hwDist = path.resolve(__dirname, "../../../artifacts/headwaters/dist/public");

let hwDevProxy: RequestHandler | undefined;

if (process.env.NODE_ENV !== "production") {
  const hwDevPort = process.env.HEADWATERS_DEV_PORT ?? "21502";
  hwDevProxy = createProxyMiddleware({
    target: `http://127.0.0.1:${hwDevPort}`,
    changeOrigin: true,
    ws: true,
    logger: console,
  });
  // Mount at root WITHOUT a path prefix so Express does NOT strip /headwaters
  // before forwarding — Vite's base is /headwaters/ and needs the full path.
  app.use((req, res, next) => {
    if (req.url?.startsWith("/headwaters")) {
      (hwDevProxy as express.RequestHandler)(req, res, next);
      return;
    }
    next();
  });
  logger.info({ hwDevPort }, "headwaters: proxying to Vite dev server");
} else {
  app.use("/headwaters", express.static(hwDist));
  app.get("/headwaters/*splat", (_req, res) => {
    res.sendFile(path.join(hwDist, "index.html"));
  });
}

export { hwDevProxy };
export default app;
