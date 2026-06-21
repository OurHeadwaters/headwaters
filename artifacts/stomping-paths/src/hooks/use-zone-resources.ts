import { useQuery } from "@tanstack/react-query";

export type ZoneResourceInfo = {
  number: number;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  philosophy: string;
  color: string;
};

export type ZoneExpert = {
  id: string;
  name: string;
  role: string;
  description: string;
  url: string;
  zones: string[];
  photoUrl: string | null;
};

export type ZoneBusiness = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  zones: string[];
};

export type ZoneResourceEpisode = {
  id: number;
  source: string;
  kind: string;
  slug: string;
  title: string;
  link: string;
  summary: string | null;
  publishedAt: string;
  episodeNumber: number | null;
  durationSeconds: number | null;
  audioUrl: string | null;
  audioType: string | null;
  artworkUrl: string | null;
  categories: string[];
  tags: string[];
  zoneScore: number;
};

export type ZoneCluster = {
  id: string;
  label: string;
  description: string;
  emoji: string;
  zones: string[];
  expertSlugs: string[];
  experts: ZoneExpert[];
  filterTags: string[];
};

export type ZoneResources = {
  zone: ZoneResourceInfo;
  episodes: ZoneResourceEpisode[];
  episodeTotal: number;
  experts: ZoneExpert[];
  businesses: ZoneBusiness[];
  councilEpisodes: ZoneResourceEpisode[];
  clusters: ZoneCluster[];
};

async function fetchZoneResources(slug: string, source?: "tsp" | "ulg" | "fireside-freedom"): Promise<ZoneResources> {
  const url = new URL(`/api/zones/${encodeURIComponent(slug)}/resources`, window.location.origin);
  if (source) url.searchParams.set("source", source);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to load zone resources");
  return res.json();
}

export function useZoneResources(slug: string | undefined, source?: "tsp" | "ulg" | "fireside-freedom") {
  return useQuery<ZoneResources>({
    queryKey: ["zones", slug, "resources", source ?? "all"],
    queryFn: () => fetchZoneResources(slug!, source),
    enabled: !!slug,
  });
}
