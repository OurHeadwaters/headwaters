import { useCallback, useEffect, useState } from "react";

const storageKey = (slug: string) => `tsp_track_progress_${slug}`;
const LAST_ACTIVE_KEY = "tsp_track_last_active";

function loadDoneIds(slug: string): Set<number> {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return new Set(arr as number[]);
  } catch {
  }
  return new Set();
}

function saveDoneIds(slug: string, ids: Set<number>) {
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify([...ids]));
  } catch {
  }
}

function recordLastActive(slug: string) {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, slug);
  } catch {
  }
}

export function readLastActiveTrack(): string | null {
  try {
    return localStorage.getItem(LAST_ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function readAnyActiveTrack(): string | null {
  try {
    const last = localStorage.getItem(LAST_ACTIVE_KEY);
    if (last) {
      const ids = loadDoneIds(last);
      if (ids.size > 0) return last;
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("tsp_track_progress_")) {
        const slug = key.slice("tsp_track_progress_".length);
        const ids = loadDoneIds(slug);
        if (ids.size > 0) return slug;
      }
    }
  } catch {
  }
  return null;
}

export function encodeProgressToParam(ids: Set<number>): string {
  const sorted = [...ids].sort((a, b) => a - b);
  return btoa(JSON.stringify(sorted));
}

export function decodeProgressParam(param: string): Set<number> | null {
  try {
    const arr = JSON.parse(atob(param));
    if (Array.isArray(arr)) return new Set(arr as number[]);
  } catch {
  }
  return null;
}

export function buildShareUrl(slug: string, ids: Set<number>): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  const encoded = encodeProgressToParam(ids);
  return `${base}?shared=${encodeURIComponent(encoded)}`;
}

export type TrackProgress = {
  doneIds: Set<number>;
  doneCount: number;
  isDone: (id: number) => boolean;
  toggleDone: (id: number) => void;
  markDone: (id: number) => void;
  resetProgress: () => void;
};

export function useTrackProgress(slug: string): TrackProgress {
  const [doneIds, setDoneIds] = useState<Set<number>>(() => loadDoneIds(slug));

  useEffect(() => {
    setDoneIds(loadDoneIds(slug));
  }, [slug]);

  useEffect(() => {
    saveDoneIds(slug, doneIds);
  }, [slug, doneIds]);

  const isDone = useCallback((id: number) => doneIds.has(id), [doneIds]);

  const toggleDone = useCallback((id: number) => {
    setDoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        recordLastActive(slug);
      }
      return next;
    });
  }, [slug]);

  const markDone = useCallback((id: number) => {
    setDoneIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      recordLastActive(slug);
      return next;
    });
  }, [slug]);

  const resetProgress = useCallback(() => {
    setDoneIds(new Set());
  }, []);

  return {
    doneIds,
    doneCount: doneIds.size,
    isDone,
    toggleDone,
    markDone,
    resetProgress,
  };
}

export type AllTracksSummary = Record<string, number>;

export function useAllTracksProgress(slugs: string[]): AllTracksSummary {
  const [summary, setSummary] = useState<AllTracksSummary>({});

  useEffect(() => {
    const result: AllTracksSummary = {};
    for (const slug of slugs) {
      result[slug] = loadDoneIds(slug).size;
    }
    setSummary(result);
  }, [slugs.join(",")]);

  return summary;
}

export function useLastActiveTrack(): string | null {
  const [slug, setSlug] = useState<string | null>(() => readAnyActiveTrack());

  useEffect(() => {
    setSlug(readAnyActiveTrack());
  }, []);

  return slug;
}
