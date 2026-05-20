import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export type TrackSummary = {
  slug: string;
  zoneSlug: string;
  zoneNumber: number;
  title: string;
  subtitle: string;
  description: string;
  whatYouWillKnow: string;
  color: string;
  icon: string;
  episodeCount: number;
  sampleArtwork: string[];
};

export type TrackItem = {
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
  videoUrl: string | null;
  videoId: string | null;
  artworkUrl: string | null;
  categories: string[];
  tags: string[];
  trackScore: number;
};

export type TrackEpisodePage = {
  track: Omit<TrackSummary, "episodeCount" | "sampleArtwork">;
  items: TrackItem[];
  total: number;
  limit: number;
  offset: number;
};

async function fetchTracks(): Promise<TrackSummary[]> {
  const res = await fetch("/api/tracks");
  if (!res.ok) throw new Error("Failed to load tracks");
  return res.json();
}

async function fetchTrackEpisodes(
  slug: string,
  params: { limit?: number; offset?: number },
): Promise<TrackEpisodePage> {
  const qs = new URLSearchParams();
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  const res = await fetch(`/api/tracks/${slug}/episodes?${qs.toString()}`);
  if (!res.ok) throw new Error("Failed to load track episodes");
  return res.json();
}

export function useListTracks() {
  return useQuery<TrackSummary[]>({
    queryKey: ["tracks"],
    queryFn: fetchTracks,
  });
}

export function useGetTrackEpisodes(
  slug: string,
  params: { limit?: number; offset?: number } = {},
) {
  return useQuery<TrackEpisodePage>({
    queryKey: ["tracks", slug, "episodes", params],
    queryFn: () => fetchTrackEpisodes(slug, params),
    enabled: !!slug,
  });
}

export type TrackNextUndoneResult = {
  track: Omit<TrackSummary, "episodeCount" | "sampleArtwork">;
  item: TrackItem | null;
  total: number;
  doneCount: number;
};

async function fetchTrackNextUndone(
  slug: string,
  doneIds: Set<number>,
): Promise<TrackNextUndoneResult> {
  const doneParam = [...doneIds].join(",");
  const qs = doneParam ? `?done=${encodeURIComponent(doneParam)}` : "";
  const res = await fetch(`/api/tracks/${slug}/next-undone${qs}`);
  if (!res.ok) throw new Error("Failed to load next undone episode");
  return res.json();
}

export function useGetTrackNextUndone(
  slug: string | null,
  doneIds: Set<number>,
) {
  const doneKey = useMemo(() => [...doneIds].sort((a, b) => a - b).join(","), [doneIds]);
  return useQuery<TrackNextUndoneResult>({
    queryKey: ["tracks", slug, "next-undone", doneKey],
    queryFn: () => fetchTrackNextUndone(slug!, doneIds),
    enabled: !!slug && doneIds.size > 0,
    staleTime: 60 * 1000,
  });
}
