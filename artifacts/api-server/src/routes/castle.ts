import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { db, castleMembersTable, castleLessonProgressTable, castleSessionsTable } from "@workspace/db";
import { eq, count, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const LESSONS_FILE = path.join(DATA_DIR, "castle-lessons.json");

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const ADMIN_PASSPHRASE = process.env.CASTLE_ADMIN_PASSPHRASE ?? "";

const FACTION_IDS = new Set(["btc", "xrp", "eth", "wild"]);
const FACTION_DEFAULTS: Record<string, number> = { btc: 1247, xrp: 892, eth: 1103, wild: 634 };

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface AddedLesson {
  id: string;
  moduleId: string;
  moduleName: string;
  moduleDescription: string;
  moduleIcon: string;
  title: string;
  body: string;
  videoUrl?: string;
  xpReward?: number;
  quiz?: QuizQuestion[];
  addedAt: string;
}

function loadLessons(): AddedLesson[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(LESSONS_FILE)) {
      return JSON.parse(fs.readFileSync(LESSONS_FILE, "utf-8")) as AddedLesson[];
    }
  } catch (e) {
    console.error("castle: failed to load lessons from disk:", e);
  }
  return [];
}

function saveLessons(lessons: AddedLesson[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(LESSONS_FILE, JSON.stringify(lessons, null, 2), "utf-8");
  } catch (e) {
    console.error("castle: failed to save lessons to disk:", e);
  }
}

const addedLessons: AddedLesson[] = loadLessons();

function requirePassphrase(req: Request, res: Response, next: NextFunction): void {
  if (!ADMIN_PASSPHRASE) {
    res.status(503).json({ error: "Admin disabled: CASTLE_ADMIN_PASSPHRASE secret not configured." });
    return;
  }
  const supplied = req.headers["x-castle-passphrase"] as string | undefined;
  if (supplied !== ADMIN_PASSPHRASE) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }
  next();
}

function getIp(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

router.post("/session", async (_req, res) => {
  try {
    const sessionId = randomUUID();
    await db.insert(castleSessionsTable).values({ sessionId });
    res.json({ sessionId });
  } catch (e) {
    console.error("castle: session create error:", e);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/faction-counts", async (_req, res) => {
  try {
    const rows = await db
      .select({ factionId: castleMembersTable.factionId, cnt: count() })
      .from(castleMembersTable)
      .groupBy(castleMembersTable.factionId);

    const counts: Record<string, number> = { ...FACTION_DEFAULTS };
    for (const row of rows) {
      counts[row.factionId] = FACTION_DEFAULTS[row.factionId] + Number(row.cnt);
    }
    res.json(counts);
  } catch (e) {
    console.error("castle: faction-counts error:", e);
    res.json({ ...FACTION_DEFAULTS });
  }
});

router.post("/faction-join", async (req, res) => {
  const { faction, sessionId } = req.body as { faction?: string; sessionId?: string };
  if (!faction || !FACTION_IDS.has(faction)) {
    res.status(400).json({ error: "Invalid faction" });
    return;
  }
  if (!sessionId) {
    res.status(400).json({ error: "sessionId required" });
    return;
  }

  const ip = getIp(req);

  try {
    const existingByIp = ip !== "unknown"
      ? await db
          .select({ sessionId: castleMembersTable.sessionId })
          .from(castleMembersTable)
          .where(eq(castleMembersTable.ipAddress, ip))
          .limit(1)
      : [];

    if (existingByIp.length > 0) {
      await db
        .update(castleMembersTable)
        .set({ factionId: faction, sessionId, joinedAt: new Date() })
        .where(eq(castleMembersTable.ipAddress, ip));
    } else {
      await db
        .insert(castleMembersTable)
        .values({ sessionId, factionId: faction, ipAddress: ip })
        .onConflictDoUpdate({
          target: castleMembersTable.sessionId,
          set: { factionId: faction, ipAddress: ip, joinedAt: new Date() },
        });
    }

    const rows = await db
      .select({ factionId: castleMembersTable.factionId, cnt: count() })
      .from(castleMembersTable)
      .groupBy(castleMembersTable.factionId);

    const counts: Record<string, number> = { ...FACTION_DEFAULTS };
    for (const row of rows) {
      counts[row.factionId] = FACTION_DEFAULTS[row.factionId] + Number(row.cnt);
    }
    res.json({ counts });
  } catch (e) {
    console.error("castle: faction-join error:", e);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/progress/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId) {
    res.status(400).json({ error: "sessionId required" });
    return;
  }
  try {
    const rows = await db
      .select({ lessonId: castleLessonProgressTable.lessonId })
      .from(castleLessonProgressTable)
      .where(eq(castleLessonProgressTable.sessionId, sessionId));

    const completedLessons: Record<string, boolean> = {};
    for (const row of rows) {
      completedLessons[row.lessonId] = true;
    }
    res.json({ completedLessons });
  } catch (e) {
    console.error("castle: progress GET error:", e);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/progress/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const { lessonId, done } = req.body as { lessonId?: string; done?: boolean };

  if (!sessionId || !lessonId || typeof done !== "boolean") {
    res.status(400).json({ error: "lessonId and done (boolean) are required" });
    return;
  }

  try {
    if (done) {
      await db
        .insert(castleLessonProgressTable)
        .values({ sessionId, lessonId })
        .onConflictDoNothing();
    } else {
      await db
        .delete(castleLessonProgressTable)
        .where(
          and(
            eq(castleLessonProgressTable.sessionId, sessionId),
            eq(castleLessonProgressTable.lessonId, lessonId),
          ),
        );
    }
    res.json({ ok: true });
  } catch (e) {
    console.error("castle: progress POST error:", e);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/progress/:sessionId/reset", async (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId) {
    res.status(400).json({ error: "sessionId required" });
    return;
  }
  try {
    await db
      .delete(castleLessonProgressTable)
      .where(eq(castleLessonProgressTable.sessionId, sessionId));
    res.json({ ok: true });
  } catch (e) {
    console.error("castle: progress reset error:", e);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/admin/verify", (req, res) => {
  if (!ADMIN_PASSPHRASE) {
    res.status(503).json({ ok: false, error: "Admin disabled: passphrase not configured." });
    return;
  }
  const { passphrase } = req.body as { passphrase?: string };
  if (passphrase === ADMIN_PASSPHRASE) {
    res.json({ ok: true });
  } else {
    res.status(403).json({ ok: false, error: "Wrong passphrase" });
  }
});

router.post("/admin/lesson", requirePassphrase, (req, res) => {
  const { moduleName, moduleDescription, moduleIcon, lesson } = req.body as {
    moduleName?: string;
    moduleDescription?: string;
    moduleIcon?: string;
    lesson?: {
      title?: string;
      body?: string;
      videoUrl?: string;
      xpReward?: number;
      quiz?: QuizQuestion[];
    };
  };

  if (!moduleName || !lesson?.title || !lesson?.body) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const validQuiz: QuizQuestion[] | undefined =
    Array.isArray(lesson.quiz) && lesson.quiz.length > 0
      ? lesson.quiz.filter(
          (q) =>
            typeof q.question === "string" &&
            q.question.trim() &&
            Array.isArray(q.options) &&
            q.options.length >= 2 &&
            q.options.every((o) => typeof o === "string" && o.trim()) &&
            typeof q.correct === "number" &&
            q.correct >= 0 &&
            q.correct < q.options.length &&
            typeof q.explanation === "string" &&
            q.explanation.trim()
        )
      : undefined;

  const newLesson: AddedLesson = {
    id: `custom-${Date.now()}`,
    moduleId: `module-custom-${moduleName.toLowerCase().replace(/\s+/g, "-")}`,
    moduleName: moduleName.trim(),
    moduleDescription: (moduleDescription ?? "").trim(),
    moduleIcon: (moduleIcon ?? "📚").trim(),
    title: lesson.title.trim(),
    body: lesson.body.trim(),
    videoUrl: lesson.videoUrl?.trim() || undefined,
    xpReward: typeof lesson.xpReward === "number" && lesson.xpReward > 0 ? lesson.xpReward : 50,
    quiz: validQuiz,
    addedAt: new Date().toISOString(),
  };

  addedLessons.push(newLesson);
  saveLessons(addedLessons);
  res.json({ ok: true, lesson: newLesson });
});

router.post(
  "/admin/upload-lesson",
  requirePassphrase,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const { originalname, mimetype, buffer } = req.file;
    const ext = path.extname(originalname).toLowerCase();
    let extractedText = "";

    try {
      if (ext === ".pdf" || mimetype === "application/pdf") {
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        extractedText = (data as { text?: string }).text ?? "";
      } else if ([".txt", ".md", ".markdown"].includes(ext) || mimetype.startsWith("text/")) {
        extractedText = buffer.toString("utf-8");
      } else {
        res.status(400).json({ error: "Unsupported file type. Upload a PDF, TXT, or Markdown file." });
        return;
      }
    } catch {
      res.status(500).json({ error: "Failed to parse file content." });
      return;
    }

    const lines = extractedText.split("\n").map((l) => l.trim()).filter(Boolean);
    const title = lines[0]?.replace(/^#+\s*/, "").slice(0, 120) ?? originalname.replace(ext, "");
    const body = lines.slice(1).join("\n").slice(0, 4000).trim() || extractedText.slice(0, 4000).trim();

    res.json({ ok: true, title, body, charCount: extractedText.length });
  }
);

router.get("/admin/lessons", requirePassphrase, (_req, res) => {
  res.json({ lessons: addedLessons });
});

router.get("/dynamic-lessons", (_req, res) => {
  res.json({ lessons: addedLessons });
});

router.post("/admin/reset-counts", requirePassphrase, async (_req, res) => {
  try {
    await db.delete(castleMembersTable);
    res.json({ ok: true });
  } catch (e) {
    console.error("castle: reset-counts error:", e);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
