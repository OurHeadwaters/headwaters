#!/usr/bin/env node
import http from "http";
import net from "net";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const PORT = Number(process.env.PORT ?? "21500");
const VITE_PORT = PORT + 1;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

let viteReady = false;

const proxy = http.createServer((req, res) => {
  console.log(`[dev-proxy] ${req.method} ${req.url} host=${req.headers.host}`);

  if (!viteReady) {
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

proxy.listen(PORT, () => {
  console.log(`[dev-proxy] Proxy up on :${PORT} → Vite will start on :${VITE_PORT}`);
  startVite();
});

function startVite() {
  const viteBin = path.resolve(ROOT, "node_modules/.bin/vite");
  const vite = spawn(
    viteBin,
    ["--config", "vite.config.ts", "--host", "0.0.0.0"],
    {
      stdio: "inherit",
      cwd: ROOT,
      env: {
        ...process.env,
        PORT: String(VITE_PORT),
        BASE_PATH: process.env.BASE_PATH ?? "/crypto-castle/",
      },
    },
  );

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
