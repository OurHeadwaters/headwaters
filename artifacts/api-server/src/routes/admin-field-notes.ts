/**
 * Admin field notes routes — audio upload + Whisper transcription.
 *
 * POST /api/admin/field-notes/upload
 *   Accepts multipart audio (.m4a, .mp3, .wav) via `file` field.
 *   Transcribes with OpenAI Whisper, stores result as a curated_item,
 *   runs the auto-classifier, returns the created row.
 *
 * GET /api/admin/field-notes
 *   Returns all curated items, paginated, newest first.
 */

import { Router, type IRouter } from "express";
import multer from "multer";
import { db, curatedItemsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { classifyText } from "../lib/field-note-classifier";
import { requireEditor } from "../middlewares/requireEditor";
import { logger } from "../lib/logger";
import path from "path";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = [".m4a", ".mp3", ".wav", ".ogg", ".webm", ".mp4"];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${ext}`));
    }
  },
});

/* ── GET /api/admin/field-notes ─────────────────────────────────────────── */

router.get("/admin/field-notes", requireEditor, async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(1, Number(req.query.limit ?? 50)),
      200,
    );
    const offset = Math.max(0, Number(req.query.offset ?? 0));

    const items = await db
      .select()
      .from(curatedItemsTable)
      .orderBy(desc(curatedItemsTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(items);
  } catch (err) {
    logger.error({ err }, "admin-field-notes: GET failed");
    res.status(500).json({ error: "Failed to load field notes" });
  }
});

/* ── POST /api/admin/field-notes/upload ─────────────────────────────────── */

router.post(
  "/admin/field-notes/upload",
  requireEditor,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "No audio file provided" });
      return;
    }

    const filename = req.file.originalname;

    let openai: import("openai").default | null = null;
    try {
      const mod = await import("@workspace/integrations-openai-ai-server");
      openai = mod.openai;
    } catch (err) {
      logger.warn({ err }, "admin-field-notes: OpenAI unavailable");
      res.status(503).json({ error: "OpenAI integration not configured" });
      return;
    }

    let transcript: string;
    try {
      const buffer = req.file.buffer;
      const ext = path.extname(filename).toLowerCase().replace(".", "");
      const mimeMap: Record<string, string> = {
        m4a: "audio/m4a",
        mp3: "audio/mpeg",
        wav: "audio/wav",
        ogg: "audio/ogg",
        webm: "audio/webm",
        mp4: "audio/mp4",
      };
      const mimeType = mimeMap[ext] ?? "audio/mpeg";

      const fileObj = new File([new Uint8Array(buffer)], filename, { type: mimeType });

      const response = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: fileObj,
      });
      transcript = response.text?.trim() ?? "";
    } catch (err) {
      logger.error({ err, filename }, "admin-field-notes: Whisper transcription failed");
      res.status(500).json({ error: "Transcription failed" });
      return;
    }

    if (!transcript) {
      res.status(422).json({ error: "Transcription returned empty text" });
      return;
    }

    try {
      const tags = classifyText(transcript);
      const [inserted] = await db
        .insert(curatedItemsTable)
        .values({
          sourceType: "audio",
          externalId: `${filename}-${Date.now()}`,
          rawContent: transcript,
          tags,
          published: true,
        })
        .onConflictDoNothing()
        .returning();

      if (!inserted) {
        res.status(409).json({ error: "Duplicate file already stored" });
        return;
      }

      logger.info(
        { id: inserted.id, filename, tags },
        "admin-field-notes: audio note stored",
      );
      res.status(201).json(inserted);
    } catch (err) {
      logger.error({ err }, "admin-field-notes: DB insert failed");
      res.status(500).json({ error: "Failed to store field note" });
    }
  },
);

export default router;
