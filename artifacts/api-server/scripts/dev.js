#!/usr/bin/env node
/**
 * Dev wrapper for api-server.
 * Builds and starts the api-server in development mode.
 * Also spawns the Crypto Castle Vite dev server so edits hot-reload instantly.
 */

import { spawn, execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CASTLE_DEV_PORT = process.env.CASTLE_DEV_PORT ?? "21501";
const WORKSPACE_ROOT = path.resolve(__dirname, "../../..");

// ─── 1. Build api-server ────────────────────────────────────────────────────
console.log("[dev] Building api-server…");
try {
  execSync("pnpm run build", { stdio: "inherit", cwd: path.resolve(__dirname, "..") });
} catch {
  process.exit(1);
}

// ─── 2. Spawn Crypto Castle Vite dev server ─────────────────────────────────
console.log(`[dev] Starting Crypto Castle Vite dev server on :${CASTLE_DEV_PORT}…`);
const castle = spawn(
  "pnpm",
  ["--filter", "@workspace/crypto-castle", "exec", "vite", "--config", "vite.config.ts", "--host", "0.0.0.0"],
  {
    stdio: "inherit",
    cwd: WORKSPACE_ROOT,
    env: {
      ...process.env,
      PORT: CASTLE_DEV_PORT,
      BASE_PATH: "/crypto-castle/",
      NODE_ENV: "development",
    },
  },
);

castle.on("error", (err) => {
  console.error("[dev] Failed to start Crypto Castle Vite server:", err.message);
});

// ─── 3. Start api-server ─────────────────────────────────────────────────────
console.log("[dev] Starting api-server…");
const api = spawn("node", ["--enable-source-maps", "./dist/index.mjs"], {
  stdio: "inherit",
  cwd: path.resolve(__dirname, ".."),
  env: {
    ...process.env,
    CASTLE_DEV_PORT,
  },
});

api.on("exit", (code) => {
  castle.kill();
  process.exit(code ?? 0);
});

process.on("SIGTERM", () => {
  castle.kill("SIGTERM");
  api.kill("SIGTERM");
});

process.on("SIGINT", () => {
  castle.kill("SIGINT");
  api.kill("SIGINT");
});
