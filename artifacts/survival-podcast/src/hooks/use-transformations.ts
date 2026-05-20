import { useQuery } from "@tanstack/react-query";

export type Transformation = {
  slug: string;
  from: string;
  to: string;
  description: string;
  tags: string[];
  categories: string[];
  color: string;
  icon: string;
};

export function useTransformations() {
  return useQuery<Transformation[]>({
    queryKey: ["transformations"],
    queryFn: async () => {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/transformations`);
      if (!res.ok) throw new Error("Failed to load transformations");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
