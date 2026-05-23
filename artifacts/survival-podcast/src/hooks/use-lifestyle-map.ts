import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@workspace/replit-auth-web";

export type LifestyleMap = {
  userId: string;
  entryMode: "guided" | "free" | "practitioner";
  answers: Record<string, string>;
  primaryZone: string | null;
  secondaryZone: string | null;
  rationale: string | null;
  riskProfile: number | null;
  practitionerName: string | null;
  visitedZones: string[];
  surrenderMode: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AssessResult = {
  primaryZone: string;
  secondaryZone: string;
  rationale: string;
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export function useLifestyleMap() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [map, setMap] = useState<LifestyleMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMap = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/map");
      setMap(data.map);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading) {
      fetchMap();
    }
  }, [authLoading, fetchMap]);

  const saveMap = useCallback(async (updates: Partial<LifestyleMap>) => {
    const data = await apiFetch("/api/map", {
      method: "POST",
      body: JSON.stringify(updates),
    });
    setMap(data.map);
    return data.map as LifestyleMap;
  }, []);

  const markVisited = useCallback(async (zoneSlug: string) => {
    const data = await apiFetch("/api/map/visit", {
      method: "POST",
      body: JSON.stringify({ zoneSlug }),
    });
    setMap((prev) =>
      prev ? { ...prev, visitedZones: data.visitedZones } : prev
    );
  }, []);

  const assess = useCallback(
    async (answers: Record<string, string>): Promise<AssessResult> => {
      return apiFetch("/api/map/assess", {
        method: "POST",
        body: JSON.stringify({ answers }),
      });
    },
    []
  );

  return { map, loading, error, refetch: fetchMap, saveMap, markVisited, assess };
}
