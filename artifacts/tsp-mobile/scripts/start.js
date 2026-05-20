#!/usr/bin/env node
/**
 * Expo start wrapper for Replit.
 *
 * Starts an HTTP proxy on PORT (default 5000) that:
 *   - Responds to /status health checks immediately
 *   - Forwards all other requests to Metro on METRO_PORT (24656)
 *   - Spawns Metro if it is not already running
 *
 * Run by the "artifacts/tsp-mobile: expo" artifact-managed workflow.
 * PORT is set to 5000 via the artifact.toml [services.env] block.
 */

const http = require("http");
const net = require("net");
const { spawn } = require("child_process");

const PROXY_PORT = parseInt(process.env.PORT || "5000", 10);
const METRO_PORT = 24656;

function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.on("connect", () => { socket.destroy(); resolve(true); });
    socket.on("error", () => { socket.destroy(); resolve(false); });
    socket.on("timeout", () => { socket.destroy(); resolve(false); });
    socket.connect(port, "127.0.0.1");
  });
}

// ── IPv4 HTTP proxy ───────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  if (req.url === "/status" || req.url.endsWith("/status")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  const opts = {
    hostname: "127.0.0.1",
    port: METRO_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${METRO_PORT}` },
  };

  const upstream = http.request(opts, (upRes) => {
    res.writeHead(upRes.statusCode, upRes.headers);
    upRes.pipe(res, { end: true });
  });

  upstream.on("error", (err) => {
    if (!res.headersSent) {
      res.writeHead(502);
      res.end("Metro not ready: " + err.message);
    }
  });

  req.pipe(upstream, { end: true });
});

server.on("upgrade", (req, clientSocket, head) => {
  const upstreamSocket = net.connect(METRO_PORT, "127.0.0.1", () => {
    const reqLine = `${req.method} ${req.url} HTTP/1.1\r\n`;
    const headers = Object.entries(req.headers)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\r\n");
    upstreamSocket.write(`${reqLine}${headers}\r\n\r\n`);
    if (head && head.length) upstreamSocket.write(head);
    upstreamSocket.pipe(clientSocket);
    clientSocket.pipe(upstreamSocket);
  });
  upstreamSocket.on("error", () => clientSocket.destroy());
  clientSocket.on("error", () => upstreamSocket.destroy());
});

server.listen(PROXY_PORT, "0.0.0.0", () => {
  console.log(`[start] Proxy on 0.0.0.0:${PROXY_PORT} → Metro on ${METRO_PORT}`);
});

// ── Spawn Metro if not already running ────────────────────────────────────────

async function startMetroIfNeeded() {
  const already = await isPortInUse(METRO_PORT);
  if (already) {
    console.log(`[start] Metro already running on port ${METRO_PORT} — sharing it.`);
    return;
  }

  const child = spawn(
    "pnpm",
    ["exec", "expo", "start", "--localhost", "--port", String(METRO_PORT)],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        PORT: String(METRO_PORT),
        EXPO_PACKAGER_PROXY_URL: `https://${process.env.REPLIT_EXPO_DEV_DOMAIN}`,
        EXPO_PUBLIC_DOMAIN: process.env.REPLIT_DEV_DOMAIN,
        EXPO_PUBLIC_REPL_ID: process.env.REPL_ID,
        REACT_NATIVE_PACKAGER_HOSTNAME: process.env.REPLIT_DEV_DOMAIN,
      },
    }
  );

  child.on("exit", (code) => process.exit(code ?? 0));
}

startMetroIfNeeded();
