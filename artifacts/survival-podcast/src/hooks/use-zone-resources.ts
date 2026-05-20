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

export type ZoneResources = {
  zone: ZoneResourceInfo;
  episodes: ZoneResourceEpisode[];
  episodeTotal: number;
  experts: ZoneExpert[];
  businesses: ZoneBusiness[];
};

async function fetchZoneResources(slug: string): Promise<ZoneResources> {
  const res = await fetch(`/api/zones/${encodeURIComponent(slug)}/resources`);
  if (!res.ok) throw new Error("Failed to load zone resources");
  return res.json();
}

export function useZoneResources(slug: string | undefined) {
  return useQuery<ZoneResources>({
    queryKey: ["zones", slug, "resources"],
    queryFn: () => fetchZoneResources(slug!),
    enabled: !!slug,
  });
}
