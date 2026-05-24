#!/usr/bin/env node
/**
 * Dev wrapper for api-server.
 * Builds and starts the api-server in development mode.
 * Also spawns the Headwaters Vite dev server so edits hot-reload instantly.
 */

import { spawn, execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HEADWATERS_DEV_PORT = process.env.HEADWATERS_DEV_PORT ?? "21502";
const WORKSPACE_ROOT = path.resolve(__dirname, "../../..");

// ─── 1. Build api-server ────────────────────────────────────────────────────
console.log("[dev] Building api-server…");
try {
  execSync("pnpm run build", { stdio: "inherit", cwd: path.resolve(__dirname, "..") });
} catch {
  process.exit(1);
}

// ─── 2. Spawn Headwaters Vite dev server ─────────────────────────────────────
console.log(`[dev] Starting Headwaters Vite dev server on :${HEADWATERS_DEV_PORT}…`);
const headwaters = spawn(
  "pnpm",
  ["--filter", "@workspace/headwaters", "exec", "vite", "--config", "vite.config.ts", "--host", "0.0.0.0"],
  {
    stdio: "inherit",
    cwd: WORKSPACE_ROOT,
    env: {
      ...process.env,
      PORT: HEADWATERS_DEV_PORT,
      BASE_PATH: "/headwaters/",
      NODE_ENV: "development",
    },
  },
);

headwaters.on("error", (err) => {
  console.error("[dev] Failed to start Headwaters Vite server:", err.message);
});

// ─── 3. Start api-server ─────────────────────────────────────────────────────
console.log("[dev] Starting api-server…");
const api = spawn("node", ["--enable-source-maps", "./dist/index.mjs"], {
  stdio: "inherit",
  cwd: path.resolve(__dirname, ".."),
  env: {
    ...process.env,
    HEADWATERS_DEV_PORT,
  },
});

api.on("exit", (code) => {
  headwaters.kill();
  process.exit(code ?? 0);
});

process.on("SIGTERM", () => {
  headwaters.kill("SIGTERM");
  api.kill("SIGTERM");
});

process.on("SIGINT", () => {
  headwaters.kill("SIGINT");
  api.kill("SIGINT");
});
