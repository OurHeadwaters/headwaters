import { useQuery } from "@tanstack/react-query";
import type { Transformation } from "./use-transformations";
import type { ReviewedProduct } from "@/components/product-shelf";

export type KitSummary = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  transformationSlugs: string[];
  trackSlugs: string[];
  gearCategoryTags: string[];
  externalLinks: { label: string; url: string }[];
  priceType: "direct" | "consultative";
  priceCents?: number;
  ctaLabel: string;
};

export type KitTrack = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  icon: string;
};

export type KitEpisode = {
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
};

export type KitDetail = KitSummary & {
  transformations: Transformation[];
  tracks: KitTrack[];
  episodes: KitEpisode[];
  gear: ReviewedProduct[];
};

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

export function useListKits() {
  return useQuery<KitSummary[]>({
    queryKey: ["kits"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/kits"));
      if (!res.ok) throw new Error("Failed to load kits");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useKitDetail(slug: string) {
  return useQuery<KitDetail>({
    queryKey: ["kit", slug],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/kits/${slug}`));
      if (!res.ok) throw new Error("Failed to load kit");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!slug,
  });
}

export const KIT_META: Record<string, { icon: string; color: string }> = {
  "family-kit":       { icon: "🏡", color: "#D9A066" },
  "producer-kit":     { icon: "💼", color: "#4A7A3A" },
  "practitioner-kit": { icon: "🌿", color: "#5B8A60" },
  "council-kit":      { icon: "🌊", color: "#3A6B7A" },
  "care-kit":         { icon: "🌱", color: "#7A4A8A" },
  "budget-kit":       { icon: "🪣", color: "#7A6A3A" },
  "digital-kit":      { icon: "🔐", color: "#3A5A8A" },
  "physical-kit":     { icon: "⚡", color: "#8A5A3A" },
};

export const LINK_OUT_KITS = new Set(["practitioner-kit", "council-kit"]);
