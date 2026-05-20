import { useCallback, useEffect, useState } from "react";

const storageKey = (slug: string) => `tsp_track_progress_${slug}`;

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
      }
      return next;
    });
  }, []);

  const markDone = useCallback((id: number) => {
    setDoneIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

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
