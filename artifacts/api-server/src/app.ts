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

const app: Express = express();

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
app.post("/api/stripe/webhook", stripeWebhookHandler, handleStripeWebhook);

// Brigade-specific webhook alias — same handler, separate URL for clarity.
// Both endpoints use the same Stripe webhook secret and shared processWebhook logic.
// The Brigade subscription events (checkout.session.completed,
// customer.subscription.updated, customer.subscription.deleted) are routed
// by metadata.brigade_user_id presence inside WebhookHandlers.processWebhook.
app.post("/api/brigade/webhook", stripeWebhookHandler, handleStripeWebhook);

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
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

// ─── Headwaters static SPA ────────────────────────────────────────────────────
// Serves the pre-built Headwaters React app at /headwaters/.
// Run `pnpm --filter @workspace/headwaters run build` to update the assets.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hwDist = path.resolve(__dirname, "../../../artifacts/headwaters/dist/public");
app.use("/headwaters", express.static(hwDist));
app.get("/headwaters/*splat", (_req, res) => {
  res.sendFile(path.join(hwDist, "index.html"));
});

// ─── Crypto Castle — dev proxy or static SPA ──────────────────────────────────
// In development: proxy to the Vite dev server (hot reload, instant edits).
// In production: serve the pre-built static files.
// Run `pnpm --filter @workspace/crypto-castle run build` to update prod assets.
const castleDist = path.resolve(__dirname, "../../../artifacts/crypto-castle/dist/public");

let castleDevProxy: RequestHandler | undefined;

if (process.env.NODE_ENV !== "production") {
  const castleDevPort = process.env.CASTLE_DEV_PORT ?? "21501";
  castleDevProxy = createProxyMiddleware({
    target: `http://127.0.0.1:${castleDevPort}`,
    changeOrigin: true,
    ws: true,
    logger: console,
  });
  // Mount at root WITHOUT a path prefix so Express does NOT strip /crypto-castle
  // before forwarding — Vite's base is /crypto-castle/ and needs the full path.
  app.use((req, res, next) => {
    if (req.url?.startsWith("/crypto-castle")) {
      return (castleDevProxy as express.RequestHandler)(req, res, next);
    }
    next();
  });
  logger.info({ castleDevPort }, "crypto-castle: proxying to Vite dev server");
} else {
  app.use("/crypto-castle", express.static(castleDist));
  app.get("/crypto-castle/*splat", (_req, res) => {
    res.sendFile(path.join(castleDist, "index.html"));
  });
}

export { castleDevProxy };
export default app;
