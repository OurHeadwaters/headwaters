import type { Plugin } from "vite";

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
  const { title, description, image, url, siteName = "The Survival Podcast" } = opts;
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

export function ogMetaPlugin(basePath: string): Plugin {
  const base = basePath.replace(/\/$/, "");

  return {
    name: "og-meta-prerender",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const ua = req.headers["user-agent"] ?? "";
        if (!CRAWLER_UA.test(ua)) return next();

        const url = req.url ?? "/";
        const cleanPath = url.split("?")[0];

        const trackMatch = cleanPath.match(
          new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/tracks/([^/]+)$`),
        );
        if (!trackMatch) return next();

        const slug = trackMatch[1];

        try {
          const apiRes = await fetch(`${API_BASE}/api/tracks`);
          if (!apiRes.ok) return next();
          const tracks = (await apiRes.json()) as Array<{
            slug: string;
            title: string;
            description: string;
            artworkUrl?: string | null;
          }>;
          const track = tracks.find((t) => t.slug === slug);
          if (!track) return next();

          const canonicalUrl = `${req.headers["x-forwarded-proto"] ?? "https"}://${req.headers["x-forwarded-host"] ?? req.headers.host}${base}/tracks/${slug}`;

          const html = buildOgHtml({
            title: `${track.title} — TSP Learning Track`,
            description: track.description,
            image: track.artworkUrl ?? undefined,
            url: canonicalUrl,
          });

          res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=300",
          });
          res.end(html);
        } catch {
          return next();
        }
      });
    },
  };
}
