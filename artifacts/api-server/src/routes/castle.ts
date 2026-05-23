import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const LESSONS_FILE = path.join(DATA_DIR, "castle-lessons.json");

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const ADMIN_PASSPHRASE = process.env.CASTLE_ADMIN_PASSPHRASE ?? "";

interface FactionCounts {
  btc: number;
  xrp: number;
  eth: number;
  wild: number;
}

interface AddedLesson {
  id: string;
  moduleId: string;
  moduleName: string;
  moduleDescription: string;
  moduleIcon: string;
  title: string;
  body: string;
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

const factionCounts: FactionCounts = { btc: 1247, xrp: 892, eth: 1103, wild: 634 };
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

router.get("/faction-counts", (_req, res) => {
  res.json({ ...factionCounts });
});

router.post("/faction-join", (req, res) => {
  const { faction } = req.body as { faction?: string };
  if (!faction || !(faction in factionCounts)) {
    res.status(400).json({ error: "Invalid faction" });
    return;
  }
  factionCounts[faction as keyof FactionCounts] += 1;
  res.json({ counts: { ...factionCounts } });
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
    lesson?: { title?: string; body?: string };
  };

  if (!moduleName || !lesson?.title || !lesson?.body) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const newLesson: AddedLesson = {
    id: `custom-${Date.now()}`,
    moduleId: `module-custom-${moduleName.toLowerCase().replace(/\s+/g, "-")}`,
    moduleName: moduleName.trim(),
    moduleDescription: (moduleDescription ?? "").trim(),
    moduleIcon: (moduleIcon ?? "📚").trim(),
    title: lesson.title.trim(),
    body: lesson.body.trim(),
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

router.post("/admin/reset-counts", requirePassphrase, (_req, res) => {
  factionCounts.btc = 0;
  factionCounts.xrp = 0;
  factionCounts.eth = 0;
  factionCounts.wild = 0;
  res.json({ ok: true });
});

export default router;
