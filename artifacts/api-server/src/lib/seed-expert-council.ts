import { db, expertCouncilTable, ulgBusinessesTable } from "@workspace/db";
import { EXPERT_COUNCIL, ULG_BUSINESSES } from "./expert-council-static";

/**
 * Seeds the expert_council table from the static registry.
 * Only inserts rows that don't already exist (by slug).
 * Returns the number of rows seeded.
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
      .onConflictDoNothing()
      .returning({ id: expertCouncilTable.id });
    count += result.length;
  }
  return count;
}

/**
 * Seeds the ulg_businesses table from the static registry.
 * Only inserts rows that don't already exist (by slug).
 * Returns the number of rows seeded.
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
      .onConflictDoNothing()
      .returning({ id: ulgBusinessesTable.id });
    count += result.length;
  }
  return count;
}
