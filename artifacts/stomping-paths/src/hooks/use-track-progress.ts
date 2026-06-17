/*
 * useTrackProgress — per-track episode completion state (web)
 *
 * Happy path:
 *   Mount with slug → load doneIds from localStorage →
 *   if authenticated: fetch server progress → merge server + local → push
 *   local-only ids back to server → setDoneIds(merged)
 *   toggleDone(id) → optimistic local update + async server PATCH
 *   markDone(id) → same but idempotent (no-op if already done)
 *
 * Edge cases verified:
 *   - Slug change: doneIds resets to new slug's localStorage before auth check
 *   - Unauthenticated: saves to localStorage only; no API calls
 *   - Server fetch failure: silently falls back to local data (no crash)
 *   - mergeLocalToServer: skips if no local-only ids (avoids empty PATCH)
 *   - resetProgress: clears localStorage + state; also calls DELETE /api/track-progress/:slug
 *     for authenticated users so the server database is wiped in sync
 *   - toggleDone while auth is loading: queued in local state, synced after
 *     auth resolves because isAuthenticated drives the server sync effect
 *   - useAllTracksProgress: refreshes on storage events (cross-tab sync)
 *     and on window focus (re-focus from another app)
 *   - useAllActiveTracksState: when authenticated, merges server-persisted
 *     slugs so the Continue Learning widget shows progress even after
 *     localStorage is cleared or on a different device
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@workspace/replit-auth-web";

async function fetchAllTracksProgressFromServer(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch("/api/track-progress", { credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json()) as { tracks: { slug: string; doneCount: number }[] };
    if (!Array.isArray(data.tracks)) return null;
    const result: Record<string, number> = {};
    for (const t of data.tracks) {
      result[t.slug] = t.doneCount;
    }
    return result;
  } catch {
    return null;
  }
}

const storageKey = (slug: string) => `tsp_track_progress_${slug}`;
const LAST_ACTIVE_KEY = "tsp_track_last_active";
const RECENCY_ORDER_KEY = "tsp_track_recency_order";

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
    // Maintain a recency-ordered array of slugs (most recent first)
    let order: string[] = [];
    const raw = localStorage.getItem(RECENCY_ORDER_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) order = parsed as string[];
      } catch {
      }
    }
    // Move slug to front, deduplicated, capped at 20
    const RECENCY_CAP = 20;
    order = [slug, ...order.filter((s) => s !== slug)].slice(0, RECENCY_CAP);
    localStorage.setItem(RECENCY_ORDER_KEY, JSON.stringify(order));
    // Keep legacy key in sync for any old code that might read it
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

async function fetchServerProgress(slug: string): Promise<number[] | null> {
  try {
    const res = await fetch(`/api/track-progress/${encodeURIComponent(slug)}`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { doneIds: number[] };
    return data.doneIds;
  } catch {
    return null;
  }
}

async function mergeLocalToServer(slug: string, localIds: number[]): Promise<void> {
  if (localIds.length === 0) return;
  try {
    await fetch(`/api/track-progress/${encodeURIComponent(slug)}/merge`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episodeIds: localIds }),
    });
  } catch {
  }
}

async function syncToggleToServer(
  slug: string,
  episodeId: number,
  done: boolean,
): Promise<void> {
  try {
    await fetch(`/api/track-progress/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episodeId, done }),
    });
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
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [doneIds, setDoneIds] = useState<Set<number>>(() => loadDoneIds(slug));
  const serverLoadedRef = useRef(false);

  // Reset local state when track slug changes
  useEffect(() => {
    setDoneIds(loadDoneIds(slug));
    serverLoadedRef.current = false;
  }, [slug]);

  // Sync with server once auth is known
  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated) {
      const localIds = loadDoneIds(slug);
      fetchServerProgress(slug).then((ids) => {
        if (ids !== null) {
          const serverSet = new Set(ids);
          const localOnlyIds = [...localIds].filter((id) => !serverSet.has(id));
          const merged = new Set([...serverSet, ...localIds]);
          setDoneIds(merged);
          saveDoneIds(slug, merged);
          serverLoadedRef.current = true;
          // Push any local-only completions up to server
          mergeLocalToServer(slug, localOnlyIds);
        }
      });
    }
  }, [slug, isAuthenticated, authLoading]);

  // Persist to localStorage for unauthenticated users (authenticated users write
  // on every toggle, so this covers the unauthenticated-only path)
  useEffect(() => {
    if (!isAuthenticated) {
      saveDoneIds(slug, doneIds);
    }
  }, [slug, doneIds, isAuthenticated]);

  const isDone = useCallback((id: number) => doneIds.has(id), [doneIds]);

  const toggleDone = useCallback(
    (id: number) => {
      setDoneIds((prev) => {
        const next = new Set(prev);
        const nowDone = !next.has(id);
        if (nowDone) {
          next.add(id);
          recordLastActive(slug);
        } else {
          next.delete(id);
        }
        saveDoneIds(slug, next);
        if (isAuthenticated) {
          syncToggleToServer(slug, id, nowDone);
        }
        return next;
      });
    },
    [slug, isAuthenticated],
  );

  const markDone = useCallback(
    (id: number) => {
      setDoneIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        recordLastActive(slug);
        saveDoneIds(slug, next);
        if (isAuthenticated) {
          syncToggleToServer(slug, id, true);
        }
        return next;
      });
    },
    [slug, isAuthenticated],
  );

  const resetProgress = useCallback(() => {
    setDoneIds(new Set());
    saveDoneIds(slug, new Set());
    if (isAuthenticated) {
      fetch(`/api/track-progress/${encodeURIComponent(slug)}`, {
        method: "DELETE",
        credentials: "include",
      }).catch(() => {});
    }
  }, [slug, isAuthenticated]);

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

function buildSummary(slugs: string[]): AllTracksSummary {
  const result: AllTracksSummary = {};
  for (const slug of slugs) {
    result[slug] = loadDoneIds(slug).size;
  }
  return result;
}

export function useAllTracksProgress(slugs: string[]): AllTracksSummary {
  const slugKey = slugs.join(",");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [summary, setSummary] = useState<AllTracksSummary>(() => buildSummary(slugs));

  // Always keep a live local summary as the baseline
  useEffect(() => {
    setSummary(buildSummary(slugs));

    function refresh() {
      setSummary(buildSummary(slugs));
    }

    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [slugKey]);

  // When authenticated, overlay server counts (server is source of truth)
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    fetchAllTracksProgressFromServer().then((serverCounts) => {
      if (serverCounts === null) return;
      setSummary((prev) => {
        const next = { ...prev };
        // Server is authoritative for slugs it returns; localStorage fills the
        // gaps for slugs not yet on the server (e.g. first-ever local toggle
        // whose PATCH hasn't landed yet — rare, but graceful).
        for (const slug of slugs) {
          if (Object.prototype.hasOwnProperty.call(serverCounts, slug)) {
            next[slug] = serverCounts[slug];
          }
          // else: keep the localStorage value already in `prev`
        }
        return next;
      });
    });
  }, [slugKey, isAuthenticated, authLoading]);

  return summary;
}

export function useLastActiveTrack(): string | null {
  const [slug, setSlug] = useState<string | null>(() => readAnyActiveTrack());

  useEffect(() => {
    setSlug(readAnyActiveTrack());
  }, []);

  return slug;
}

export type ActiveTrackEntry = {
  slug: string;
  doneIds: Set<number>;
};

export function readAllActiveTracksOrdered(): ActiveTrackEntry[] {
  try {
    const result: ActiveTrackEntry[] = [];
    const seen = new Set<string>();

    // Build the ordered slug list from the recency array, with graceful
    // fallback to the legacy single-slug key for old-format data.
    let orderedSlugs: string[] = [];
    const recencyRaw = localStorage.getItem(RECENCY_ORDER_KEY);
    if (recencyRaw) {
      try {
        const parsed = JSON.parse(recencyRaw);
        if (Array.isArray(parsed)) orderedSlugs = parsed as string[];
      } catch {
      }
    }

    if (orderedSlugs.length === 0) {
      // Old-format fallback: single slug → treat as first position
      const legacy = localStorage.getItem(LAST_ACTIVE_KEY);
      if (legacy) orderedSlugs = [legacy];
    }

    // First pass: emit slugs in recency order (most recent first)
    for (const slug of orderedSlugs) {
      if (seen.has(slug)) continue;
      const ids = loadDoneIds(slug);
      if (ids.size > 0) {
        result.push({ slug, doneIds: ids });
        seen.add(slug);
      }
    }

    // Second pass: pick up any tracks that have progress but aren't in the
    // recency list yet (e.g. data written before this update was deployed)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("tsp_track_progress_")) {
        const slug = key.slice("tsp_track_progress_".length);
        if (!seen.has(slug)) {
          const ids = loadDoneIds(slug);
          if (ids.size > 0) {
            result.push({ slug, doneIds: ids });
            seen.add(slug);
          }
        }
      }
    }

    return result;
  } catch {
    return [];
  }
}

export type AllActiveTracksState = {
  entries: ActiveTrackEntry[];
  isLoading: boolean;
};

export function useAllActiveTracksState(): AllActiveTracksState {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = useState<ActiveTrackEntry[]>(() =>
    readAllActiveTracksOrdered(),
  );
  const [serverFetchDone, setServerFetchDone] = useState(false);

  useEffect(() => {
    setEntries(readAllActiveTracksOrdered());

    function refresh() {
      setEntries(readAllActiveTracksOrdered());
    }

    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  // Reset serverFetchDone when auth state changes (e.g. login/logout)
  useEffect(() => {
    if (authLoading) {
      setServerFetchDone(false);
    }
  }, [authLoading]);

  // When authenticated, merge server-persisted slugs that aren't in localStorage.
  // This ensures the Continue Learning widget reflects progress made on other
  // devices or after localStorage has been cleared.
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    fetchAllTracksProgressFromServer().then(async (serverCounts) => {
      try {
        if (!serverCounts) return;

        // Find slugs on the server that localStorage doesn't know about
        const localSlugs = new Set(readAllActiveTracksOrdered().map((e) => e.slug));
        const serverOnlySlugs = Object.keys(serverCounts).filter(
          (slug) => serverCounts[slug] > 0 && !localSlugs.has(slug),
        );

        if (serverOnlySlugs.length > 0) {
          // Fetch full episode IDs for each server-only slug
          const fetched = await Promise.all(
            serverOnlySlugs.map(async (slug) => {
              const ids = await fetchServerProgress(slug);
              if (ids === null || ids.length === 0) return null;
              return { slug, doneIds: new Set(ids) } satisfies ActiveTrackEntry;
            }),
          );

          const newEntries = fetched.filter(
            (e): e is ActiveTrackEntry => e !== null,
          );

          if (newEntries.length > 0) {
            // Backfill localStorage so future page loads (and cross-tab events) pick
            // these up without another server round-trip
            for (const { slug, doneIds } of newEntries) {
              saveDoneIds(slug, doneIds);
            }

            setEntries((prev) => {
              const prevSlugs = new Set(prev.map((e) => e.slug));
              const toAdd = newEntries.filter((e) => !prevSlugs.has(e.slug));
              return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
            });
          }
        }
      } finally {
        setServerFetchDone(true);
      }
    });
  }, [isAuthenticated, authLoading]);

  // isLoading is true while we don't yet have a definitive answer:
  //   - auth check is still in flight, OR
  //   - user is authenticated but the server fetch hasn't completed yet
  const isLoading = authLoading || (isAuthenticated && !serverFetchDone);

  return { entries, isLoading };
}
