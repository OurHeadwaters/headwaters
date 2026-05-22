import { customFetch } from "@workspace/api-client-react";
import { useCallback, useEffect, useState } from "react";

export type LifestyleMap = {
  userId: string;
  entryMode: "guided" | "free" | "practitioner";
  answers: Record<string, string>;
  primaryZone: string | null;
  secondaryZone: string | null;
  rationale: string | null;
  riskProfile: number | null;
  visitedZones: string[];
  surrenderMode: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MapState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "no_map" }
  | { status: "ready"; map: LifestyleMap }
  | { status: "error"; message: string };

export function useLifestyleMap() {
  const [state, setState] = useState<MapState>({ status: "loading" });

  const fetchMap = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const data = await customFetch<{ map: LifestyleMap | null }>("/api/map", {
        credentials: "include",
      });
      if (data.map == null) {
        setState({ status: "no_map" });
      } else {
        setState({ status: "ready", map: data.map });
      }
    } catch (e) {
      const err = e as { status?: number; message?: string };
      if (err.status === 401) {
        setState({ status: "unauthenticated" });
      } else {
        setState({ status: "error", message: err.message ?? "Failed to load map" });
      }
    }
  }, []);

  useEffect(() => {
    fetchMap();
  }, [fetchMap]);

  return { state, refetch: fetchMap };
}
