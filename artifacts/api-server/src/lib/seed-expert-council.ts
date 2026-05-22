import { db, expertCouncilTable, ulgBusinessesTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { EXPERT_COUNCIL, ULG_BUSINESSES } from "./expert-council-static";

/**
 * Syncs the expert_council table from the static registry.
 * Inserts new rows and updates url, description, role, and zones
 * for existing rows (matched by slug). Admin-managed fields
 * (podcastFeedUrl, rssSlug, sortOrder) are never overwritten.
 * Returns the number of rows inserted or updated.
 */
export async function seedExpertCouncil(): Promise<number> {
  let count = 0;
  for (let i = 0; i < EXPERT_COUNCIL.length; i++) {
    const m = EXPERT_COUNCIL[i];
    const result = await db
      .insert(expertCouncilTable)
      .values({
        slug: m.id,
        name: m.name,
        role: m.role,
        description: m.description,
        url: m.url,
        zones: m.zones,
        sortOrder: i,
      })
      .onConflictDoUpdate({
        target: expertCouncilTable.slug,
        set: {
          name: sql`excluded.name`,
          role: sql`excluded.role`,
          description: sql`excluded.description`,
          url: sql`excluded.url`,
          zones: sql`excluded.zones`,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: expertCouncilTable.id });
    count += result.length;
  }
  return count;
}

/**
 * Syncs the ulg_businesses table from the static registry.
 * Inserts new rows and updates name, tagline, description, url,
 * and zones for existing rows (matched by slug).
 * Returns the number of rows inserted or updated.
 */
export async function seedUlgBusinesses(): Promise<number> {
  let count = 0;
  for (let i = 0; i < ULG_BUSINESSES.length; i++) {
    const b = ULG_BUSINESSES[i];
    const result = await db
      .insert(ulgBusinessesTable)
      .values({
        slug: b.id,
        name: b.name,
        tagline: b.tagline,
        description: b.description,
        url: b.url,
        zones: b.zones,
        sortOrder: i,
      })
      .onConflictDoUpdate({
        target: ulgBusinessesTable.slug,
        set: {
          name: sql`excluded.name`,
          tagline: sql`excluded.tagline`,
          description: sql`excluded.description`,
          url: sql`excluded.url`,
          zones: sql`excluded.zones`,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: ulgBusinessesTable.id });
    count += result.length;
  }
  return count;
}
