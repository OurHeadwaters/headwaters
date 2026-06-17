/**
 * Storage files route — file listing and admin upload for Arc object storage with DB metadata.
 *
 * GET  /api/storage/files                    — list all uploaded files with metadata (public)
 * POST /api/storage/uploads/request-url      — request a presigned upload URL (admin only)
 * GET  /api/storage/files/:key               — stream a single file (public)
 * PUT  /api/admin/storage/files/metadata
 *   Body: { fileKey, title?, description?, category?, tags? }
 *   Upserts metadata for a file. Requires editor auth.
 */

import { Router, type IRouter } from "express";
import { objectStorageClient } from "../lib/objectStorage";
import { requireEditor } from "../middlewares/requireEditor";
import { logger } from "../lib/logger";
import { db, fileMetadataTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID ?? "";
const REPLIT_SIDECAR = "http://127.0.0.1:1106";

async function generatePresignedUploadURL(
  filename: string,
  contentType: string
): Promise<{ uploadURL: string; key: string }> {
  const sanitized = filename
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/^\.+/, "");
  const key = `media/${sanitized || "upload"}`;

  const resp = await fetch(
    `${REPLIT_SIDECAR}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bucket_name: bucketId,
        object_name: key,
        method: "PUT",
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }),
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!resp.ok) {
    throw new Error(`Sidecar returned ${resp.status} generating presigned URL`);
  }

  const body = (await resp.json()) as { signed_url: string };
  return { uploadURL: body.signed_url, key };
}

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

/* ── POST /api/storage/uploads/request-url ──────────────────────────────── */

/**
 * Admin-only: request a presigned PUT URL for uploading a file to GCS.
 * Body: { name: string; size: number; contentType: string }
 * Returns: { uploadURL: string; key: string }
 */
router.post(
  "/storage/uploads/request-url",
  requireEditor,
  async (req, res) => {
    if (!bucketId) {
      res.status(503).json({ error: "Object storage not configured" });
      return;
    }

    const { name, size, contentType } = req.body ?? {};
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Missing required field: name" });
      return;
    }
    if (typeof size !== "number" || size < 0) {
      res.status(400).json({ error: "Missing or invalid field: size" });
      return;
    }
    if (!contentType || typeof contentType !== "string") {
      res.status(400).json({ error: "Missing required field: contentType" });
      return;
    }

    try {
      const { uploadURL, key } = await generatePresignedUploadURL(
        name,
        contentType
      );
      res.json({ uploadURL, key, metadata: { name, size, contentType } });
    } catch (err) {
      logger.error({ err }, "Failed to generate presigned upload URL");
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  }
);

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
  const fileKey = decodeURIComponent(String(req.params.key));
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
