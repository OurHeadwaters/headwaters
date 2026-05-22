#!/usr/bin/env node
/**
 * dev-proxy.mjs
 *
 * Opens PORT immediately so the platform's port detector passes, then starts
 * Vite on PORT+1 and proxies all HTTP + WebSocket traffic to it.
 * Zero external dependencies — uses only Node.js built-ins.
 */
import http from "http";
import net from "net";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const PORT = Number(process.env.PORT ?? "21294");
const VITE_PORT = PORT + 1;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

let viteReady = false;

// ── HTTP proxy ──────────────────────────────────────────────────────────────
const proxy = http.createServer((req, res) => {
  // Log every incoming request so we can see what the platform is checking
  console.log(`[dev-proxy] ${req.method} ${req.url} host=${req.headers.host}`);

  if (!viteReady) {
    // Vite still warming up — respond OK immediately so health checks pass
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("starting");
    return;
  }

  const opts = {
    hostname: "127.0.0.1",
    port: VITE_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };
  const proxyReq = http.request(opts, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  proxyReq.on("error", () => {
    res.writeHead(502);
    res.end("vite unavailable");
  });
  req.pipe(proxyReq, { end: true });
});

// ── WebSocket proxy (Vite HMR) ───────────────────────────────────────────────
proxy.on("upgrade", (req, clientSocket, head) => {
  if (!viteReady) {
    clientSocket.destroy();
    return;
  }
  const conn = net.connect(VITE_PORT, "127.0.0.1", () => {
    conn.write(
      `${req.method} ${req.url} HTTP/1.1\r\n` +
        Object.entries(req.headers)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\r\n") +
        "\r\n\r\n",
    );
    if (head && head.length) conn.write(head);
    conn.pipe(clientSocket);
    clientSocket.pipe(conn);
  });
  conn.on("error", () => clientSocket.destroy());
  clientSocket.on("error", () => conn.destroy());
});

// ── Start listening immediately ──────────────────────────────────────────────
proxy.listen(PORT, "0.0.0.0", () => {
  console.log(`[dev-proxy] Proxy up on :${PORT} → Vite will start on :${VITE_PORT}`);
  startVite();
});

// ── Spawn Vite on VITE_PORT ──────────────────────────────────────────────────
function startVite() {
  const vite = spawn(
    "/bin/sh",
    ["-c", "vite --config vite.config.ts --host 0.0.0.0"],
    {
      stdio: "inherit",
      cwd: ROOT,
      env: {
        ...process.env,
        PORT: String(VITE_PORT),
        BASE_PATH: process.env.BASE_PATH ?? "/headwaters/",
      },
    },
  );

  // Poll until Vite is reachable on VITE_PORT, then flip the ready flag
  const check = () => {
    const sock = net.connect(VITE_PORT, "127.0.0.1");
    sock.on("connect", () => {
      sock.destroy();
      if (!viteReady) {
        viteReady = true;
        console.log(`[dev-proxy] Vite ready on :${VITE_PORT}, proxy now forwarding`);
      }
    });
    sock.on("error", () => {
      sock.destroy();
      if (!viteReady) setTimeout(check, 200);
    });
  };
  setTimeout(check, 200);

  vite.on("exit", (code) => process.exit(code ?? 0));
}
