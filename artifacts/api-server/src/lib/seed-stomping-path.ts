import { db, stompingPathHandlesTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

const BASE_HANDLES = [
  "Driftwood",
  "Tide",
  "Pebble",
  "Eddy",
  "Ripple",
  "Lantern",
  "Compass",
  "Anchor",
  "Hollow",
  "Fern",
  "Stone",
  "Creek",
  "Loam",
  "Birch",
  "Sedge",
  "Reed",
  "Slate",
  "Flint",
  "Moss",
  "Lichen",
  "Ember",
  "Thistle",
  "Clover",
  "Hemlock",
  "Alder",
  "Willow",
  "Hawthorn",
  "Yarrow",
  "Ironwood",
  "Cattail",
  "Shale",
  "Logjam",
  "Culvert",
  "Ford",
  "Oxbow",
  "Riffle",
  "Meander",
  "Drumlin",
  "Tarn",
  "Seep",
];

export async function seedStompingPathHandles(): Promise<number> {
  try {
    const result = await db
      .insert(stompingPathHandlesTable)
      .values(BASE_HANDLES.map((h) => ({ handle: h })))
      .onConflictDoNothing()
      .returning();
    return result.length;
  } catch (err) {
    logger.warn({ err }, "stomping-path: handle seed failed (non-fatal)");
    return 0;
  }
}
