import { useQuery } from "@tanstack/react-query";

export type TransformationEpisode = {
  id: number;
  source: string;
  kind: string;
  slug: string;
  title: string;
  link: string;
  summary: string | null;
  pubDate: string;
  episodeNumber: number | null;
  durationSeconds: number | null;
  audioUrl: string | null;
  audioType: string | null;
  artworkUrl: string | null;
  categories: string[];
  tags: string[];
};

export type TransformationEpisodesResult = {
  items: TransformationEpisode[];
  total: number;
  limit: number;
  offset: number;
};

export function useTransformationEpisodes(slug: string | null, limit = 5) {
  return useQuery<TransformationEpisodesResult>({
    queryKey: ["transformation-episodes", slug, limit],
    queryFn: async () => {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(
        `${base}/api/transformations/${encodeURIComponent(slug!)}/episodes?limit=${limit}`,
      );
      if (!res.ok) throw new Error("Failed to load transformation episodes");
      return res.json();
    },
    enabled: slug != null,
    staleTime: 5 * 60 * 1000,
  });
}
