#!/usr/bin/env node
/**
 * Dev wrapper for api-server.
 *
 * In the Replit environment the tsp-mobile workflow cannot pass the platform
 * health-check because its createArtifact call returned success:false (no
 * external port-forwarding rule was registered for that artifact). This wrapper
 * starts the Expo Metro bundler as a background child process alongside the
 * api-server so Metro stays alive as long as the api-server is running.
 *
 * Metro only starts when REPLIT_EXPO_DEV_DOMAIN is present (i.e. in Replit
 * dev mode). Production deployments are unaffected.
 */

import { spawn, execSync } from "child_process";
import { createServer } from "net";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const METRO_PORT = 24656;

function isPortFree(port) {
  return new Promise((resolve) => {
    const s = createServer();
    s.once("error", () => resolve(false));
    s.once("listening", () => s.close(() => resolve(true)));
    s.listen(port, "127.0.0.1");
  });
}

async function startMetro() {
  if (!process.env.REPLIT_EXPO_DEV_DOMAIN) {
    console.log("[dev] REPLIT_EXPO_DEV_DOMAIN not set — skipping Metro startup");
    return;
  }

  const free = await isPortFree(METRO_PORT);
  if (!free) {
    console.log(`[dev] Metro already running on port ${METRO_PORT} — reusing`);
    return;
  }

  const expoEnv = {
    ...process.env,
    PORT: String(METRO_PORT),
    EXPO_PACKAGER_PROXY_URL: `https://${process.env.REPLIT_EXPO_DEV_DOMAIN}`,
    EXPO_PUBLIC_DOMAIN: process.env.REPLIT_DEV_DOMAIN,
    EXPO_PUBLIC_REPL_ID: process.env.REPL_ID,
    REACT_NATIVE_PACKAGER_HOSTNAME: process.env.REPLIT_DEV_DOMAIN,
  };

  const mobileDir = path.resolve(__dirname, "../../tsp-mobile");

  const metro = spawn(
    "pnpm",
    ["exec", "expo", "start", "--localhost", "--port", String(METRO_PORT)],
    {
      stdio: "inherit",
      env: expoEnv,
      cwd: mobileDir,
    }
  );

  metro.on("error", (err) => {
    console.error("[dev] Metro failed to start:", err.message);
  });

  console.log(`[dev] Metro bundler started (PID ${metro.pid}, port ${METRO_PORT})`);
  console.log(`[dev] Expo dev domain: exp://${process.env.REPLIT_EXPO_DEV_DOMAIN}`);
}

// Start Metro in the background (non-blocking)
startMetro();

// Run the normal api-server build + start sequence
console.log("[dev] Building api-server…");
try {
  execSync("pnpm run build", { stdio: "inherit", cwd: path.resolve(__dirname, "..") });
} catch {
  process.exit(1);
}

console.log("[dev] Starting api-server…");
const api = spawn("node", ["--enable-source-maps", "./dist/index.mjs"], {
  stdio: "inherit",
  cwd: path.resolve(__dirname, ".."),
  env: process.env,
});

api.on("exit", (code) => process.exit(code ?? 0));
