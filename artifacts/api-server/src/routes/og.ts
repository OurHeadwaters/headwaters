import { Router, type IRouter } from "express";
import { trackBySlug } from "../lib/tracks";
import { getFeedCached } from "../lib/rss";
import { db, contentItemsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { libraryRowToRssEpisode } from "../lib/series";
import { logger } from "../lib/logger";

const router: IRouter = Router();

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
  const { title, description, image, url, siteName = "The Stomping Paths" } = opts;
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
  <meta name="twitter:site" content="@jack_spirko" />
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

function canonicalPageUrl(req: { headers: Record<string, string | string[] | undefined>; hostname?: string }, path: string): string {
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? "https";
  const host = (req.headers["x-forwarded-host"] as string | undefined) ?? req.hostname ?? "www.thesurvivalpodcast.com";
  return `${proto}://${host}${path}`;
}

/**
 * GET /api/og/tracks/:slug
 * Returns a minimal HTML page with Open Graph meta tags for the given track.
 * Crawlers (iMessage, Slack, Twitter) that don't execute JS can read these tags.
 * The page immediately redirects real visitors to the SPA track detail page.
 */
router.get("/og/tracks/:slug", async (req, res) => {
  const { slug } = req.params;
  const track = trackBySlug(slug);

  if (!track) {
    res.status(404).send("Track not found");
    return;
  }

  try {
    const parts: string[] = [];
    if (track.tags.length > 0) {
      const tagList = track.tags.map((t) => `'${t.replace(/'/g, "''").toLowerCase()}'`).join(",");
      parts.push(`EXISTS (SELECT 1 FROM jsonb_array_elements_text(tags) t WHERE lower(t.value) IN (${tagList}))`);
    }
    if (track.categories.length > 0) {
      const catList = track.categories.map((c) => `'${c.replace(/'/g, "''")}'`).join(",");
      parts.push(`EXISTS (SELECT 1 FROM jsonb_array_elements_text(categories) c WHERE c.value IN (${catList}))`);
    }
    const whereClause = parts.length > 0 ? `(${parts.join(" OR ")})` : "true";

    const sampleRows = await db.execute(
      sql.raw(`
        SELECT artwork_url FROM content_items
        WHERE ${whereClause} AND artwork_url IS NOT NULL
        ORDER BY published_at DESC LIMIT 1
      `),
    );

    const image = (sampleRows.rows[0] as { artwork_url: string | null } | undefined)?.artwork_url ?? undefined;
    const pageUrl = canonicalPageUrl(req, `/tracks/${slug}`);

    const html = buildOgHtml({
      title: `${track.title} — TSP Learning Track`,
      description: track.description,
      image,
      url: pageUrl,
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(html);
  } catch (err) {
    logger.error({ err, slug }, "og/tracks: failed to build OG page");
    res.status(500).send("Internal server error");
  }
});

/**
 * GET /api/og/episodes/:slug
 * Returns a minimal HTML page with Open Graph meta tags for the given episode.
 */
router.get("/og/episodes/:slug", async (req, res) => {
  const { slug } = req.params;

  try {
    const feed = await getFeedCached();
    let ep = feed.episodes.find((e) => e.slug === slug);

    if (!ep) {
      const rows = await db
        .select()
        .from(contentItemsTable)
        .where(
          and(
            sql`${contentItemsTable.kind} = 'audio'`,
            eq(contentItemsTable.slug, slug),
          ),
        )
        .limit(1);
      if (rows[0]) {
        ep = libraryRowToRssEpisode(rows[0]);
      }
    }

    if (!ep) {
      res.status(404).send("Episode not found");
      return;
    }

    const pageUrl = canonicalPageUrl(req, `/episodes/${slug}`);
    const epLabel = ep.episodeNumber ? `Episode ${ep.episodeNumber}` : "Episode";

    const html = buildOgHtml({
      title: `${ep.title} — The Survival Podcast`,
      description: ep.summary || `${epLabel} of The Survival Podcast`,
      image: ep.artworkUrl ?? undefined,
      url: pageUrl,
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(html);
  } catch (err) {
    logger.error({ err, slug }, "og/episodes: failed to build OG page");
    res.status(500).send("Internal server error");
  }
});

/**
 * GET /api/og/library/:slug
 * Returns a minimal HTML page with Open Graph meta tags for the given library item.
 */
router.get("/og/library/:slug", async (req, res) => {
  const { slug } = req.params;

  try {
    const [row] = await db
      .select()
      .from(contentItemsTable)
      .where(eq(contentItemsTable.slug, slug))
      .limit(1);

    if (!row) {
      res.status(404).send("Library item not found");
      return;
    }

    const pageUrl = canonicalPageUrl(req, `/library/${slug}`);

    const html = buildOgHtml({
      title: `${row.title} — TSP Library`,
      description: row.summary || "From the TSP knowledge library.",
      image: row.artworkUrl ?? undefined,
      url: pageUrl,
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(html);
  } catch (err) {
    logger.error({ err, slug }, "og/library: failed to build OG page");
    res.status(500).send("Internal server error");
  }
});

export default router;
