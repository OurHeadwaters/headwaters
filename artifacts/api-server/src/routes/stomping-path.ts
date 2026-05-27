import { Router, type IRouter } from "express";
import { db, stompingPathHandlesTable, stompingPathPoolEntriesTable, stompingPathCompassEntriesTable, stompingPathCreatorSharesTable } from "@workspace/db";
import { eq, sql, ne } from "drizzle-orm";
import { logger } from "../lib/logger";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  StompingPathClusterBody,
  StompingPathClusterResponse,
  StompingPathWadeInBody,
  StompingPathWadeInResponse,
  StompingPathGetOverlapBody,
  StompingPathGetOverlapResponse,
  StompingPathCreatorOverlapBody,
  StompingPathCreatorOverlapResponse,
  StompingPathGetCreatorShareParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const WATERSHED_CLUSTERS = [
  "Sound Money Thinkers",
  "Land-Based Practitioners",
  "Decentralized Governance Writers",
  "Craft and Trade Teachers",
  "Spiritual and Philosophical Elders",
  "Homesteaders and Self-Reliance Guides",
  "Unconventional Educators",
  "Uncategorized",
];

async function clusterTeachers(teachers: string[]): Promise<{ label: string; teachers: string[] }[]> {
  const prompt = `You are a terrain mapper. Given a list of teachers, authors, thinkers, or influences, cluster them into meaningful watershed terrain labels. Use these labels if they fit: "${WATERSHED_CLUSTERS.join('", "')}". You may use multiple labels. Assign each teacher to exactly one cluster. Return ONLY valid JSON with no markdown, no commentary.

Format:
[{"label": "Sound Money Thinkers", "teachers": ["Ron Paul", "Murray Rothbard"]}, ...]

Teachers to cluster:
${teachers.map((t) => `- ${t}`).join("\n")}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const raw = response.choices[0]?.message?.content ?? "[]";
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as { label: string; teachers: string[] }[];
    return parsed.filter((c) => c.label && Array.isArray(c.teachers) && c.teachers.length > 0);
  } catch {
    logger.warn({ raw }, "stomping-path: failed to parse cluster JSON, returning fallback");
    return [{ label: "Uncategorized", teachers }];
  }
}

async function getOrAssignHandle(sessionToken: string): Promise<string> {
  const existing = await db
    .select()
    .from(stompingPathPoolEntriesTable)
    .where(eq(stompingPathPoolEntriesTable.sessionToken, sessionToken))
    .limit(1);
  if (existing[0]) return existing[0].waterNameHandle;

  const handles = await db
    .select()
    .from(stompingPathHandlesTable)
    .orderBy(stompingPathHandlesTable.assigned)
    .limit(1);

  let handle: string;
  if (handles[0]) {
    handle = handles[0].handle;
    await db
      .update(stompingPathHandlesTable)
      .set({ assigned: handles[0].assigned + 1 })
      .where(eq(stompingPathHandlesTable.id, handles[0].id));
  } else {
    const adjectives = ["Deep", "Still", "Rushing", "Clear", "Dark", "Bright", "Wide", "Narrow", "Cold", "Warm"];
    const nouns = ["Creek", "Ford", "Run", "Hollow", "Bend", "Reach", "Pool", "Seep", "Trace", "Rill"];
    handle =
      adjectives[Math.floor(Math.random() * adjectives.length)] +
      nouns[Math.floor(Math.random() * nouns.length)];
  }

  return handle;
}

async function getOverlapCounts(
  teachers: string[],
  excludeSessionToken?: string,
): Promise<{ teacher: string; count: number }[]> {
  if (teachers.length === 0) return [];

  const query = db
    .select({ teachers: stompingPathPoolEntriesTable.teachers })
    .from(stompingPathPoolEntriesTable);

  const allEntries = excludeSessionToken
    ? await query.where(ne(stompingPathPoolEntriesTable.sessionToken, excludeSessionToken))
    : await query;

  const countMap = new Map<string, number>();
  for (const t of teachers) {
    countMap.set(t, 0);
  }

  for (const entry of allEntries) {
    for (const teacher of teachers) {
      const lowerTeacher = teacher.toLowerCase();
      const found = (entry.teachers ?? []).some(
        (et) => et.toLowerCase() === lowerTeacher,
      );
      if (found) {
        countMap.set(teacher, (countMap.get(teacher) ?? 0) + 1);
      }
    }
  }

  return Array.from(countMap.entries())
    .map(([teacher, count]) => ({ teacher, count }))
    .sort((a, b) => b.count - a.count);
}

router.post("/stomping-path/compass/cluster", async (req, res): Promise<void> => {
  const parsed = StompingPathClusterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { teachers } = parsed.data;
  const clusters = await clusterTeachers(teachers);

  res.json(StompingPathClusterResponse.parse({ clusters }));
});

router.post("/stomping-path/compass/wade-in", async (req, res): Promise<void> => {
  const parsed = StompingPathWadeInBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { teachers, sessionToken } = parsed.data;

  const handle = await getOrAssignHandle(sessionToken);

  const existingEntry = await db
    .select()
    .from(stompingPathPoolEntriesTable)
    .where(eq(stompingPathPoolEntriesTable.sessionToken, sessionToken))
    .limit(1);

  if (!existingEntry[0]) {
    await db.insert(stompingPathPoolEntriesTable).values({
      waterNameHandle: handle,
      teachers,
      sessionToken,
    });
  }

  // Exclude this session's own row so overlap reflects *other* users only
  const overlap = await getOverlapCounts(teachers, sessionToken);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(stompingPathPoolEntriesTable)
    .where(ne(stompingPathPoolEntriesTable.sessionToken, sessionToken));

  res.json(StompingPathWadeInResponse.parse({ handle, overlap, poolSize: count }));
});

router.post("/stomping-path/compass/overlap", async (req, res): Promise<void> => {
  const parsed = StompingPathGetOverlapBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { teachers } = parsed.data;
  const overlap = await getOverlapCounts(teachers);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(stompingPathPoolEntriesTable);

  res.json(StompingPathGetOverlapResponse.parse({ overlap, poolSize: count }));
});

router.post("/stomping-path/creator/overlap", async (req, res): Promise<void> => {
  const parsed = StompingPathCreatorOverlapBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { creatorName, teachers } = parsed.data;
  const overlap = await getOverlapCounts(teachers);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(stompingPathPoolEntriesTable);

  const [share] = await db
    .insert(stompingPathCreatorSharesTable)
    .values({
      creatorName,
      teachers,
      overlapJson: JSON.stringify(overlap),
      poolSize: count,
    })
    .returning();

  res.json(
    StompingPathCreatorOverlapResponse.parse({
      shareId: share.shareId,
      creatorName: share.creatorName,
      teachers: share.teachers,
      overlap,
      poolSize: count,
      createdAt: share.createdAt.toISOString(),
    }),
  );
});

router.get("/stomping-path/creator/share/:shareId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.shareId) ? req.params.shareId[0] : req.params.shareId;
  const params = StompingPathGetCreatorShareParams.safeParse({ shareId: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [share] = await db
    .select()
    .from(stompingPathCreatorSharesTable)
    .where(eq(stompingPathCreatorSharesTable.shareId, params.data.shareId))
    .limit(1);

  if (!share) {
    res.status(404).json({ error: "Share not found" });
    return;
  }

  let overlap: { teacher: string; count: number }[] = [];
  try {
    overlap = JSON.parse(share.overlapJson);
  } catch {
    logger.warn({ shareId: share.shareId }, "stomping-path: failed to parse overlap JSON");
  }

  res.json(
    StompingPathCreatorOverlapResponse.parse({
      shareId: share.shareId,
      creatorName: share.creatorName,
      teachers: share.teachers,
      overlap,
      poolSize: share.poolSize,
      createdAt: share.createdAt.toISOString(),
    }),
  );
});

export default router;
