/**
 * DB-backed registry of Expert Council members and ULG-affiliated businesses.
 * Reads from the expert_council and ulg_businesses tables.
 * Use the admin UI at /admin/council to add, edit, or reorder entries.
 */

import { db, expertCouncilTable, ulgBusinessesTable } from "@workspace/db";
import { asc, or, isNull, eq } from "drizzle-orm";

export type ExpertCouncilMember = {
  id: string;
  slug: string;
  name: string;
  role: string;
  description: string;
  url: string;
  zones: string[];
  crew: string | null;
  podcastFeedUrl: string | null;
  rssSlug: string | null;
  photoUrl: string | null;
};

export type UlgBusiness = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  zones: string[];
};

/**
 * Returns publicly visible council members:
 *  - Legacy/free members (listing_status IS NULL)
 *  - Active paid listings (listing_status = 'active')
 *
 * Excludes pending and lapsed paid listings so they don't appear
 * on the public directory or zone resource pages.
 */
export async function getAllExperts(): Promise<ExpertCouncilMember[]> {
  const rows = await db
    .select()
    .from(expertCouncilTable)
    .where(
      or(
        isNull(expertCouncilTable.listingStatus),
        eq(expertCouncilTable.listingStatus, "active"),
      ),
    )
    .orderBy(asc(expertCouncilTable.sortOrder), asc(expertCouncilTable.name));
  return rows.map((r) => ({
    id: r.slug,
    slug: r.slug,
    name: r.name,
    role: r.role,
    description: r.description,
    url: r.url,
    zones: r.zones,
    crew: r.crew ?? null,
    podcastFeedUrl: r.podcastFeedUrl ?? null,
    rssSlug: r.rssSlug ?? null,
    photoUrl: r.photoUrl ?? null,
  }));
}

export async function getAllBusinesses(): Promise<UlgBusiness[]> {
  const rows = await db
    .select()
    .from(ulgBusinessesTable)
    .orderBy(asc(ulgBusinessesTable.sortOrder), asc(ulgBusinessesTable.name));
  return rows.map((r) => ({
    id: r.slug,
    name: r.name,
    tagline: r.tagline,
    description: r.description,
    url: r.url,
    zones: r.zones,
  }));
}

/** Filter Expert Council members to those tagged for a specific zone slug */
export async function expertsForZone(zoneSlug: string): Promise<ExpertCouncilMember[]> {
  const all = await getAllExperts();
  return all.filter((m) => m.zones.includes(zoneSlug));
}

/** Filter ULG businesses to those tagged for a specific zone slug */
export async function businessesForZone(zoneSlug: string): Promise<UlgBusiness[]> {
  const all = await getAllBusinesses();
  return all.filter((b) => b.zones.includes(zoneSlug));
}

/** Count EC members per zone slug */
export async function expertCountByZone(): Promise<Record<string, number>> {
  const all = await getAllExperts();
  const counts: Record<string, number> = {};
  for (const member of all) {
    for (const zone of member.zones) {
      counts[zone] = (counts[zone] ?? 0) + 1;
    }
  }
  return counts;
}

/** Count ULG businesses per zone slug */
export async function businessCountByZone(): Promise<Record<string, number>> {
  const all = await getAllBusinesses();
  const counts: Record<string, number> = {};
  for (const biz of all) {
    for (const zone of biz.zones) {
      counts[zone] = (counts[zone] ?? 0) + 1;
    }
  }
  return counts;
}
