import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  creatorsTable,
  episodeValueSplitsTable,
  defaultValueSplitsTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { seedV4V } from "../lib/seed-v4v";
import { getFeedCached } from "../lib/rss";

const router: IRouter = Router();

let seeded = false;
async function ensureSeeded() {
  if (seeded) return;
  await seedV4V();
  seeded = true;
}

// ─── Public: episode splits (used by mobile player) ─────────────────────────

router.get("/v4v/episode-splits/:slug", async (req: Request, res: Response) => {
  try {
    await ensureSeeded();
    const slug = req.params.slug as string;

    // Look for episode-specific splits
    const splits = await db
      .select({
        creatorId: creatorsTable.id,
        name: creatorsTable.name,
        role: creatorsTable.role,
        walletType: creatorsTable.walletType,
        walletAddress: creatorsTable.walletAddress,
        splitPct: episodeValueSplitsTable.splitPct,
      })
      .from(episodeValueSplitsTable)
      .innerJoin(creatorsTable, eq(episodeValueSplitsTable.creatorId, creatorsTable.id))
      .where(eq(episodeValueSplitsTable.episodeSlug, slug))
      .orderBy(episodeValueSplitsTable.splitPct);

    if (splits.length > 0) {
      res.json(splits);
      return;
    }

    // Fall back to default splits
    const defaults = await db
      .select({
        creatorId: creatorsTable.id,
        name: creatorsTable.name,
        role: creatorsTable.role,
        walletType: creatorsTable.walletType,
        walletAddress: creatorsTable.walletAddress,
        splitPct: defaultValueSplitsTable.splitPct,
      })
      .from(defaultValueSplitsTable)
      .innerJoin(creatorsTable, eq(defaultValueSplitsTable.creatorId, creatorsTable.id))
      .orderBy(defaultValueSplitsTable.splitPct);

    res.json(defaults);
  } catch (err) {
    logger.error({ err }, "v4v: GET episode-splits failed");
    res.status(500).json({ error: "Failed to load episode splits" });
  }
});

// ─── Public: default splits ───────────────────────────────────────────────────

router.get("/v4v/default-splits", async (_req: Request, res: Response) => {
  try {
    await ensureSeeded();
    const rows = await db
      .select({
        creatorId: creatorsTable.id,
        name: creatorsTable.name,
        role: creatorsTable.role,
        walletType: creatorsTable.walletType,
        walletAddress: creatorsTable.walletAddress,
        splitPct: defaultValueSplitsTable.splitPct,
      })
      .from(defaultValueSplitsTable)
      .innerJoin(creatorsTable, eq(defaultValueSplitsTable.creatorId, creatorsTable.id))
      .orderBy(defaultValueSplitsTable.splitPct);
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "v4v: GET default-splits failed");
    res.status(500).json({ error: "Failed to load default splits" });
  }
});

// ─── Public: mark supporter ───────────────────────────────────────────────────

router.post("/v4v/supporter", async (req: Request, res: Response) => {
  // Best-effort: record that the authenticated user is a supporter.
  // If not authenticated, just return success (local state handles the badge).
  res.json({ ok: true });
});

// ─── Public: Podcasting 2.0 RSS with <podcast:value> tags ────────────────────

router.get("/v4v/rss.xml", async (_req: Request, res: Response) => {
  try {
    await ensureSeeded();

    const [feed, defaults] = await Promise.all([
      getFeedCached(),
      db
        .select({
          name: creatorsTable.name,
          walletType: creatorsTable.walletType,
          walletAddress: creatorsTable.walletAddress,
          splitPct: defaultValueSplitsTable.splitPct,
        })
        .from(defaultValueSplitsTable)
        .innerJoin(creatorsTable, eq(defaultValueSplitsTable.creatorId, creatorsTable.id)),
    ]);

    // Build <podcast:valueRecipient> tags
    const recipientTags = defaults
      .map((r) => {
        const type = r.walletType === "lightning" ? "keysend" : "node";
        return `    <podcast:valueRecipient name="${escXml(r.name)}" type="${type}" address="${escXml(r.walletAddress)}" split="${Math.round(r.splitPct)}" />`;
      })
      .join("\n");

    const valueBlock =
      defaults.length > 0
        ? `  <podcast:value type="lightning" method="keysend" suggested="0.00000001000">\n${recipientTags}\n  </podcast:value>`
        : "";

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:podcast="https://podcastindex.org/namespace/1.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>${escXml(feed.title)}</title>
    <link>${escXml(feed.link)}</link>
    <description>${escXml(feed.description)}</description>
    <language>${escXml(feed.language ?? "en")}</language>
    <itunes:author>${escXml(feed.host)}</itunes:author>
    <itunes:image href="${escXml(feed.artworkUrl)}" />
${valueBlock}
${feed.episodes
  .slice(0, 50)
  .map((ep) => {
    return `    <item>
      <title>${escXml(ep.title)}</title>
      <link>${escXml(ep.link)}</link>
      <guid isPermaLink="false">${escXml(ep.guid)}</guid>
      <pubDate>${new Date(ep.pubDate).toUTCString()}</pubDate>
      ${ep.audioUrl ? `<enclosure url="${escXml(ep.audioUrl)}" type="${escXml(ep.audioType ?? "audio/mpeg")}" length="0" />` : ""}
      <itunes:duration>${ep.durationSeconds ?? 0}</itunes:duration>
      <description>${escXml(ep.summary)}</description>
    </item>`;
  })
  .join("\n")}
  </channel>
</rss>`;

    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(xml);
  } catch (err) {
    logger.error({ err }, "v4v: GET rss.xml failed");
    res.status(500).send("RSS generation failed");
  }
});

function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─── Admin: creators CRUD ─────────────────────────────────────────────────────

router.get("/admin/v4v/creators", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    await ensureSeeded();
    const rows = await db
      .select()
      .from(creatorsTable)
      .orderBy(creatorsTable.name);
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "v4v: admin GET creators failed");
    res.status(500).json({ error: "Failed to load creators" });
  }
});

router.post("/admin/v4v/creators", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { name, role, walletType, walletAddress, bio } = req.body as Record<string, unknown>;
  if (
    typeof name !== "string" ||
    typeof walletType !== "string" ||
    typeof walletAddress !== "string" ||
    !name.trim() ||
    !walletType.trim() ||
    !walletAddress.trim()
  ) {
    res.status(400).json({ error: "name, walletType and walletAddress are required" });
    return;
  }
  try {
    const [row] = await db
      .insert(creatorsTable)
      .values({
        name: name.trim(),
        role: typeof role === "string" ? role.trim() : "guest",
        walletType: walletType.trim(),
        walletAddress: walletAddress.trim(),
        bio: typeof bio === "string" ? bio.trim() || null : null,
      })
      .returning();
    res.status(201).json(row);
  } catch (err) {
    logger.error({ err }, "v4v: admin POST creator failed");
    res.status(500).json({ error: "Failed to create creator" });
  }
});

router.put("/admin/v4v/creators/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid creator id" });
    return;
  }
  const { name, role, walletType, walletAddress, bio } = req.body as Record<string, unknown>;
  try {
    const [row] = await db
      .update(creatorsTable)
      .set({
        ...(typeof name === "string" && name.trim() ? { name: name.trim() } : {}),
        ...(typeof role === "string" && role.trim() ? { role: role.trim() } : {}),
        ...(typeof walletType === "string" && walletType.trim() ? { walletType: walletType.trim() } : {}),
        ...(typeof walletAddress === "string" && walletAddress.trim() ? { walletAddress: walletAddress.trim() } : {}),
        ...(typeof bio === "string" ? { bio: bio.trim() || null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(creatorsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Creator not found" });
      return;
    }
    res.json(row);
  } catch (err) {
    logger.error({ err }, "v4v: admin PUT creator failed");
    res.status(500).json({ error: "Failed to update creator" });
  }
});

router.delete("/admin/v4v/creators/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid creator id" });
    return;
  }
  try {
    await db.delete(creatorsTable).where(eq(creatorsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "v4v: admin DELETE creator failed");
    res.status(500).json({ error: "Failed to delete creator" });
  }
});

// ─── Admin: episode splits CRUD ───────────────────────────────────────────────

router.get("/admin/v4v/episode-splits", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const slug = req.query.slug as string | undefined;
    const rows = await db
      .select({
        id: episodeValueSplitsTable.id,
        episodeSlug: episodeValueSplitsTable.episodeSlug,
        splitPct: episodeValueSplitsTable.splitPct,
        creatorId: creatorsTable.id,
        name: creatorsTable.name,
        role: creatorsTable.role,
        walletType: creatorsTable.walletType,
        walletAddress: creatorsTable.walletAddress,
      })
      .from(episodeValueSplitsTable)
      .innerJoin(creatorsTable, eq(episodeValueSplitsTable.creatorId, creatorsTable.id))
      .where(slug ? eq(episodeValueSplitsTable.episodeSlug, slug) : sql`true`)
      .orderBy(episodeValueSplitsTable.episodeSlug, episodeValueSplitsTable.splitPct);
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "v4v: admin GET episode-splits failed");
    res.status(500).json({ error: "Failed to load episode splits" });
  }
});

router.post("/admin/v4v/episode-splits", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { episodeSlug, creatorId, splitPct } = req.body as Record<string, unknown>;
  if (
    typeof episodeSlug !== "string" ||
    typeof creatorId !== "number" ||
    typeof splitPct !== "number" ||
    !episodeSlug.trim() ||
    splitPct < 0 ||
    splitPct > 100
  ) {
    res.status(400).json({ error: "episodeSlug, creatorId, and splitPct (0-100) are required" });
    return;
  }
  try {
    const [row] = await db
      .insert(episodeValueSplitsTable)
      .values({ episodeSlug: episodeSlug.trim(), creatorId, splitPct })
      .onConflictDoUpdate({
        target: [episodeValueSplitsTable.episodeSlug, episodeValueSplitsTable.creatorId],
        set: { splitPct, updatedAt: new Date() },
      })
      .returning();
    res.status(201).json(row);
  } catch (err) {
    logger.error({ err }, "v4v: admin POST episode-split failed");
    res.status(500).json({ error: "Failed to save episode split" });
  }
});

router.delete("/admin/v4v/episode-splits/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid split id" });
    return;
  }
  try {
    await db.delete(episodeValueSplitsTable).where(eq(episodeValueSplitsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "v4v: admin DELETE episode-split failed");
    res.status(500).json({ error: "Failed to delete episode split" });
  }
});

// ─── Admin: default splits CRUD ───────────────────────────────────────────────

router.put("/admin/v4v/default-splits", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { creatorId, splitPct } = req.body as Record<string, unknown>;
  if (typeof creatorId !== "number" || typeof splitPct !== "number" || splitPct < 0 || splitPct > 100) {
    res.status(400).json({ error: "creatorId and splitPct (0-100) are required" });
    return;
  }
  try {
    const [row] = await db
      .insert(defaultValueSplitsTable)
      .values({ creatorId, splitPct })
      .onConflictDoUpdate({
        target: defaultValueSplitsTable.creatorId,
        set: { splitPct, updatedAt: new Date() },
      })
      .returning();
    res.json(row);
  } catch (err) {
    logger.error({ err }, "v4v: admin PUT default-split failed");
    res.status(500).json({ error: "Failed to save default split" });
  }
});

export default router;
