import { db, creatorsTable, defaultValueSplitsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

export async function seedV4V(): Promise<void> {
  try {
    const count = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(creatorsTable);
    if ((count[0]?.count ?? 0) > 0) return;

    const [creator] = await db
      .insert(creatorsTable)
      .values({
        name: "Jack Spirko",
        role: "host",
        walletType: "lightning",
        walletAddress: "jack@spirko.me",
        bio: "Host and founder of The Survival Podcast — the largest permaculture, prepping, and self-reliance podcast in the world.",
      })
      .returning();

    if (creator) {
      await db.insert(defaultValueSplitsTable).values({
        creatorId: creator.id,
        splitPct: 100.0,
      });
      logger.info({ creatorId: creator.id }, "V4V: Seeded default creator (Jack Spirko)");
    }
  } catch (err) {
    logger.warn({ err }, "V4V: seed failed (tables may not exist yet)");
  }
}
