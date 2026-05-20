import type { Plugin, ViteDevServer, PreviewServer } from "vite";
import type { Connect } from "vite";

const CRAWLER_UA = /Slackbot|Twitterbot|facebookexternalhit|LinkedInBot|WhatsApp|Discordbot|TelegramBot|iMessage|Applebot|Googlebot|bingbot|DuckDuckBot|curl|python-requests/i;

const API_BASE = "http://localhost:8080";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildOgHtml(opts: {
  title: string;
  description: string;
  image?: string;
  url: string;
  siteName?: string;
}): string {
  const { title, description, image, url, siteName = "The Stomping Path" } = opts;
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeImage = image ? escapeHtml(image) : "";
  const safeUrl = escapeHtml(url);
  const safeSite = escapeHtml(siteName);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <meta property="og:site_name" content="${safeSite}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:url" content="${safeUrl}" />
  ${safeImage ? `<meta property="og:image" content="${safeImage}" />` : ""}
  <meta name="twitter:card" content="${safeImage ? "summary_large_image" : "summary"}" />
  <meta name="twitter:site" content="@survivalpodcast" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  ${safeImage ? `<meta name="twitter:image" content="${safeImage}" />` : ""}
  <meta http-equiv="refresh" content="0;url=${safeUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${safeUrl}">${safeTitle}</a>…</p>
</body>
</html>`;
}

type IncomingMessage = Connect.IncomingMessage;

function resolveCanonicalUrl(req: IncomingMessage, base: string, path: string): string {
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? "https";
  const host = (req.headers["x-forwarded-host"] as string | undefined) ?? (req.headers["host"] as string | undefined) ?? "localhost";
  return `${proto}://${host}${base}${path}`;
}

/**
 * Build and register the OG-meta middleware.
 * Intercepts known crawler User-Agents on canonical SPA routes
 * (/tracks/:slug, /episodes/:slug, /library/:slug) and returns a
 * minimal HTML page with full OG + Twitter Card meta tags plus a
 * meta-refresh redirect for real browser visitors.
 *
 * Works identically in dev (`configureServer`) and production preview
 * (`configurePreviewServer`).
 */
function buildOgMiddleware(base: string): Connect.NextHandleFunction {
  const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return async function ogMetaMiddleware(req, res, next) {
    const ua = req.headers["user-agent"] ?? "";
    if (!CRAWLER_UA.test(ua)) return next();

    const url = req.url ?? "/";
    const cleanPath = url.split("?")[0];

    // --- /tracks/:slug ---
    const trackMatch = cleanPath.match(
      new RegExp(`^${escapedBase}/tracks/([^/]+)$`),
    );
    if (trackMatch) {
      const slug = trackMatch[1];
      try {
        const apiRes = await fetch(`${API_BASE}/api/tracks`);
        if (!apiRes.ok) return next();
        const tracks = (await apiRes.json()) as Array<{
          slug: string;
          title: string;
          description: string;
          sampleArtwork?: string[];
        }>;
        const track = tracks.find((t) => t.slug === slug);
        if (!track) return next();

        const image = track.sampleArtwork?.[0];
        const pageUrl = resolveCanonicalUrl(req, base, `/tracks/${slug}`);

        const html = buildOgHtml({
          title: `${track.title} — TSP Learning Track`,
          description: track.description,
          image,
          url: pageUrl,
        });

        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        });
        res.end(html);
      } catch {
        return next();
      }
      return;
    }

    // --- /episodes/:slug ---
    const episodeMatch = cleanPath.match(
      new RegExp(`^${escapedBase}/episodes/([^/]+)$`),
    );
    if (episodeMatch) {
      const slug = episodeMatch[1];
      try {
        const apiRes = await fetch(`${API_BASE}/api/episodes/${encodeURIComponent(slug)}`);
        if (!apiRes.ok) return next();
        const ep = (await apiRes.json()) as {
          title: string;
          summary: string;
          artworkUrl?: string | null;
          episodeNumber?: number | null;
        };

        const pageUrl = resolveCanonicalUrl(req, base, `/episodes/${slug}`);
        const epLabel = ep.episodeNumber ? `Episode ${ep.episodeNumber}` : "Episode";

        const html = buildOgHtml({
          title: `${ep.title} — The Stomping Path`,
          description: ep.summary || `${epLabel} of The Stomping Path`,
          image: ep.artworkUrl ?? undefined,
          url: pageUrl,
        });

        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        });
        res.end(html);
      } catch {
        return next();
      }
      return;
    }

    // --- /library/:slug ---
    const libraryMatch = cleanPath.match(
      new RegExp(`^${escapedBase}/library/([^/]+)$`),
    );
    if (libraryMatch) {
      const slug = libraryMatch[1];
      try {
        const apiRes = await fetch(`${API_BASE}/api/library/items/${encodeURIComponent(slug)}`);
        if (!apiRes.ok) return next();
        const item = (await apiRes.json()) as {
          title: string;
          summary?: string | null;
          artworkUrl?: string | null;
        };

        const pageUrl = resolveCanonicalUrl(req, base, `/library/${slug}`);

        const html = buildOgHtml({
          title: `${item.title} — TSP Library`,
          description: item.summary || "From the TSP knowledge library.",
          image: item.artworkUrl ?? undefined,
          url: pageUrl,
        });

        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        });
        res.end(html);
      } catch {
        return next();
      }
      return;
    }

    return next();
  };
}

/**
 * Vite plugin that injects OG meta tag pre-rendering for crawler User-Agents.
 * Registered on both the dev server (`configureServer`) and the production
 * preview server (`configurePreviewServer`) so rich link previews work in
 * both `vite dev` and `vite preview` (production) modes.
 */
export function ogMetaPlugin(basePath: string): Plugin {
  const base = basePath.replace(/\/$/, "");
  const middleware = buildOgMiddleware(base);

  return {
    name: "og-meta-prerender",

    configureServer(server: ViteDevServer) {
      server.middlewares.use(middleware);
    },

    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use(middleware);
    },
  };
}
