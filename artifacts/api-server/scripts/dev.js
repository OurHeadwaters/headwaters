#!/usr/bin/env node
/**
 * Dev wrapper for api-server.
 * Builds and starts the api-server in development mode.
 */

import { spawn, execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
