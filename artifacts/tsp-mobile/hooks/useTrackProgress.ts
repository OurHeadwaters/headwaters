/**
 * useTrackProgress — per-transformation episode completion state (mobile)
 *
 * Happy path:
 *   Mount with slug → load doneIds from AsyncStorage →
 *   if authenticated: fetch server progress → merge server + local →
 *   push local-only ids back to server → update state
 *   toggleDone(id) → optimistic local update + async server PATCH (if authed)
 *
 * Unauthenticated: saves to AsyncStorage only, no API calls made.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

function storageKey(slug: string): string {
  return `tsp:track_progress_${slug}`;
}

async function loadDoneIds(slug: string): Promise<Set<number>> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(slug));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return new Set(arr as number[]);
  } catch {
  }
  return new Set();
}

async function saveDoneIds(slug: string, ids: Set<number>): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(slug), JSON.stringify([...ids]));
  } catch {
  }
}

async function fetchServerProgress(slug: string, token: string): Promise<number[] | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/track-progress/${encodeURIComponent(slug)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { doneIds: number[] };
    return data.doneIds;
  } catch {
    return null;
  }
}

async function mergeLocalToServer(
  slug: string,
  token: string,
  localIds: number[],
): Promise<void> {
  if (localIds.length === 0) return;
  try {
    await fetch(`${API_BASE}/api/track-progress/${encodeURIComponent(slug)}/merge`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ episodeIds: localIds }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
  }
}

async function syncToggleToServer(
  slug: string,
  token: string,
  episodeId: number,
  done: boolean,
): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/track-progress/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ episodeId, done }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
  }
}

export type TrackProgress = {
  doneIds: Set<number>;
  doneCount: number;
  isDone: (id: number) => boolean;
  toggleDone: (id: number) => void;
  isLoaded: boolean;
};

export function useTrackProgress(slug: string): TrackProgress {
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [doneIds, setDoneIds] = useState<Set<number>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const serverSyncedRef = useRef(false);
  const slugRef = useRef(slug);

  useEffect(() => {
    slugRef.current = slug;
    serverSyncedRef.current = false;
    setIsLoaded(false);
    loadDoneIds(slug).then((ids) => {
      if (slugRef.current !== slug) return;
      setDoneIds(ids);
      setIsLoaded(true);
    });
  }, [slug]);

  useEffect(() => {
    if (authLoading || serverSyncedRef.current) return;
    if (!isAuthenticated || !token) return;

    serverSyncedRef.current = true;
    (async () => {
      const localIds = await loadDoneIds(slug);
      const serverIds = await fetchServerProgress(slug, token);
      if (serverIds === null) return;

      const serverSet = new Set(serverIds);
      const localOnlyIds = [...localIds].filter((id) => !serverSet.has(id));
      const merged = new Set([...serverSet, ...localIds]);

      await saveDoneIds(slug, merged);
      if (slugRef.current === slug) {
        setDoneIds(merged);
      }
      mergeLocalToServer(slug, token, localOnlyIds);
    })();
  }, [slug, isAuthenticated, authLoading, token]);

  const isDone = useCallback((id: number) => doneIds.has(id), [doneIds]);

  const toggleDone = useCallback(
    (id: number) => {
      setDoneIds((prev) => {
        const next = new Set(prev);
        const nowDone = !next.has(id);
        if (nowDone) {
          next.add(id);
        } else {
          next.delete(id);
        }
        saveDoneIds(slug, next);
        if (isAuthenticated && token) {
          syncToggleToServer(slug, token, id, nowDone);
        }
        return next;
      });
    },
    [slug, isAuthenticated, token],
  );

  return {
    doneIds,
    doneCount: doneIds.size,
    isDone,
    toggleDone,
    isLoaded,
  };
}
