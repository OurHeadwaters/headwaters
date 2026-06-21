import { db, expertCouncilTable, ulgBusinessesTable } from "@workspace/db";
import { sql, eq, and, isNull } from "drizzle-orm";
import { EXPERT_COUNCIL, ULG_BUSINESSES } from "./expert-council-static";

/**
 * Known podcast feed URLs for individual Fireside Freedom host shows.
 * Only slugs with a non-null podcastFeedUrl here are eligible for seeding.
 * These are set as defaults — existing admin-set values are never overwritten.
 */
const COUNCIL_PODCAST_FEED_SEEDS: { slug: string; podcastFeedUrl: string }[] = [
  {
    slug: "tim-toolman-cook",
    podcastFeedUrl: "https://anchor.fm/s/5a68f498/podcast/rss",
  },
  {
    slug: "ken-eash",
    podcastFeedUrl: "https://feeds.captivate.fm/constructive-liberty/",
  },
  {
    slug: "lettie-loo",
    podcastFeedUrl: "https://anchor.fm/s/475cc2bc/podcast/rss",
  },
];

/**
 * Seeds podcastFeedUrl for known Fireside Freedom host shows.
 * Only sets the field when it is currently NULL in the DB — never overwrites
 * a value that was set via the admin panel.
 * Returns the number of rows updated.
 */
export async function seedCouncilPodcastFeeds(): Promise<number> {
  let count = 0;
  for (const { slug, podcastFeedUrl } of COUNCIL_PODCAST_FEED_SEEDS) {
    const result = await db
      .update(expertCouncilTable)
      .set({ podcastFeedUrl, updatedAt: new Date() })
      .where(
        and(
          eq(expertCouncilTable.slug, slug),
          isNull(expertCouncilTable.podcastFeedUrl),
        ),
      )
      .returning({ id: expertCouncilTable.id });
    count += result.length;
  }
  return count;
}

/**
 * Syncs the expert_council table from the static registry.
 * Inserts new rows and updates url, description, role, and zones
 * for existing rows (matched by slug). Admin-managed fields
 * (podcastFeedUrl, rssSlug, sortOrder) are never overwritten.
 * photoUrl from the static registry is written on insert and on
 * conflict only when the existing row has no photo yet — so an
 * admin-uploaded photo is never overwritten by a re-seed.
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
        crew: m.crew ?? null,
        sortOrder: i,
        photoUrl: m.photoUrl ?? null,
      })
      .onConflictDoUpdate({
        target: expertCouncilTable.slug,
        set: {
          name: sql`excluded.name`,
          role: sql`excluded.role`,
          description: sql`excluded.description`,
          url: sql`excluded.url`,
          zones: sql`excluded.zones`,
          crew: sql`excluded.crew`,
          // Only backfill photo when the row has none — never overwrite admin-set photos
          photoUrl: sql`COALESCE(${expertCouncilTable.photoUrl}, excluded.photo_url)`,
          // consultUrl and contactEmail are intentionally excluded from this set.
          // They are set by the admin panel and/or the Stripe webhook flow (paid listings)
          // and must never be overwritten by a re-seed.
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
