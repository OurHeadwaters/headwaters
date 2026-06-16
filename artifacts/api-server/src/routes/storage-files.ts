/**
 * Storage files route — read-only file listing from Arc object storage.
 *
 * GET  /api/storage/files   — list all uploaded files (public, no auth required)
 */

import { Router, type IRouter } from "express";
import { objectStorageClient } from "../lib/objectStorage";
import { logger } from "../lib/logger";

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

router.get("/storage/files", async (_req, res) => {
  if (!bucketId) {
    res.status(503).json({ error: "Object storage not configured" });
    return;
  }

  try {
    const bucket = objectStorageClient.bucket(bucketId);
    const [files] = await bucket.getFiles();

    const items = files.map((file) => {
      const meta = file.metadata;
      const sizeBytes = parseInt(String(meta.size ?? "0"), 10);
      const name = file.name.split("/").pop() ?? file.name;
      return {
        key: file.name,
        name,
        type: inferFileType(name),
        sizeBytes,
        sizeLabel: formatBytes(sizeBytes),
        contentType: meta.contentType ?? "application/octet-stream",
        uploadedAt: meta.timeCreated ?? null,
        url: `/api/storage/files/${encodeURIComponent(file.name)}`,
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
