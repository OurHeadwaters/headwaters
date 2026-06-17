/**
 * Storage files route — file listing from Arc object storage with DB metadata.
 *
 * GET  /api/storage/files          — list all uploaded files with metadata (public)
 * GET  /api/storage/files/:key     — stream a single file (public)
 * PUT  /api/admin/storage/files/metadata
 *   Body: { fileKey, title?, description?, category?, tags? }
 *   Upserts metadata for a file. Requires editor auth.
 */

import { Router, type IRouter } from "express";
import { objectStorageClient } from "../lib/objectStorage";
import { logger } from "../lib/logger";
import { db, fileMetadataTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireEditor } from "../middlewares/requireEditor";

const router: IRouter = Router();

const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID ?? "";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function inferFileType(name: string): "pdf" | "video" | "image" | "other" {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["mp4", "mov", "webm", "avi", "mkv", "m4v"].includes(ext)) return "video";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  return "other";
}

/* ── GET /api/storage/files ─────────────────────────────────────────────── */

router.get("/storage/files", async (_req, res) => {
  if (!bucketId) {
    res.status(503).json({ error: "Object storage not configured" });
    return;
  }

  try {
    const [filesResult, metaRows] = await Promise.all([
      objectStorageClient.bucket(bucketId).getFiles(),
      db.select().from(fileMetadataTable),
    ]);

    const [files] = filesResult;
    const metaByKey = new Map(metaRows.map((m) => [m.fileKey, m]));

    const items = files.map((file) => {
      const meta = file.metadata;
      const sizeBytes = parseInt(String(meta.size ?? "0"), 10);
      const name = file.name.split("/").pop() ?? file.name;
      const dbMeta = metaByKey.get(file.name);
      return {
        key: file.name,
        name,
        type: inferFileType(name),
        sizeBytes,
        sizeLabel: formatBytes(sizeBytes),
        contentType: meta.contentType ?? "application/octet-stream",
        uploadedAt: meta.timeCreated ?? null,
        url: `/api/storage/files/${encodeURIComponent(file.name)}`,
        title: dbMeta?.title ?? null,
        description: dbMeta?.description ?? null,
        category: dbMeta?.category ?? null,
        tags: dbMeta?.tags ?? [],
      };
    });

    items.sort((a, b) => {
      if (!a.uploadedAt) return 1;
      if (!b.uploadedAt) return -1;
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });

    res.json(items);
  } catch (err) {
    logger.error({ err }, "Failed to list storage files");
    res.status(500).json({ error: "Failed to list files" });
  }
});

/* ── PUT /api/admin/storage/files/metadata ──────────────────────────────── */

router.put("/admin/storage/files/metadata", requireEditor, async (req, res) => {
  const { fileKey, title, description, category, tags } = req.body as {
    fileKey?: string;
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
  };

  if (!fileKey || typeof fileKey !== "string" || !fileKey.trim()) {
    res.status(400).json({ error: "fileKey is required" });
    return;
  }

  try {
    const [row] = await db
      .insert(fileMetadataTable)
      .values({
        fileKey: fileKey.trim(),
        title: title?.trim() || null,
        description: description?.trim() || null,
        category: category?.trim() || null,
        tags: Array.isArray(tags) ? tags.map((t) => t.trim()).filter(Boolean) : [],
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: fileMetadataTable.fileKey,
        set: {
          title: title?.trim() || null,
          description: description?.trim() || null,
          category: category?.trim() || null,
          tags: Array.isArray(tags) ? tags.map((t) => t.trim()).filter(Boolean) : [],
          updatedAt: new Date(),
        },
      })
      .returning();

    res.json(row);
  } catch (err) {
    logger.error({ err }, "Failed to upsert file metadata");
    res.status(500).json({ error: "Failed to save metadata" });
  }
});

/* ── DELETE /api/admin/storage/files/metadata/:key ──────────────────────── */

router.delete("/admin/storage/files/metadata/:key", requireEditor, async (req, res) => {
  const fileKey = decodeURIComponent(req.params.key);
  try {
    await db
      .delete(fileMetadataTable)
      .where(eq(fileMetadataTable.fileKey, fileKey));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Failed to delete file metadata");
    res.status(500).json({ error: "Failed to delete metadata" });
  }
});

/* ── GET /api/storage/files/:key (stream) ───────────────────────────────── */

router.use("/storage/files", async (req, res, next) => {
  if (req.method !== "GET") {
    next();
    return;
  }

  if (!bucketId) {
    res.status(503).json({ error: "Object storage not configured" });
    return;
  }

  const key = decodeURIComponent(req.path.replace(/^\//, ""));
  if (!key) {
    next();
    return;
  }

  try {
    const bucket = objectStorageClient.bucket(bucketId);
    const file = bucket.file(key);
    const [exists] = await file.exists();

    if (!exists) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const [meta] = await file.getMetadata();
    const contentType = String(meta.contentType ?? "application/octet-stream");

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");

    const readStream = file.createReadStream();
    readStream.on("error", (streamErr) => {
      logger.error({ err: streamErr }, "Error streaming storage file");
      if (!res.headersSent) {
        res.status(500).json({ error: "Stream error" });
      }
    });
    readStream.pipe(res);
  } catch (err) {
    logger.error({ err }, "Failed to serve storage file");
    res.status(500).json({ error: "Failed to serve file" });
  }
});

export default router;
