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
  /** True once the server has confirmed there are zero in-progress tracks.
   *  Distinct from `isLoading === false` because it makes the "empty confirmed"
   *  state explicit rather than relying on the absence of entries. */
  serverReturnedEmpty: boolean;
};

export function useAllActiveTracksState(): AllActiveTracksState {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = useState<ActiveTrackEntry[]>(() =>
    readAllActiveTracksOrdered(),
  );
  const [serverFetchDone, setServerFetchDone] = useState(false);
  const [serverReturnedEmpty, setServerReturnedEmpty] = useState(false);
  // Keep a ref so the focus handler can read the latest auth state without
  // being re-registered every time isAuthenticated changes.
  const isAuthenticatedRef = useRef(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;

  // Reset server-fetch flags when auth state changes (e.g. login/logout)
  useEffect(() => {
    if (authLoading) {
      setServerFetchDone(false);
      setServerReturnedEmpty(false);
    }
  }, [authLoading]);

  // Merge server progress into state.  Runs on initial auth resolve and on
  // every window-focus event so the widget stays current when the user marks
  // an episode done in another tab or on another device.
  //
  // Strategy:
  //   1. Fetch the lightweight count summary (/api/track-progress).
  //   2. Identify slugs that are new (not in localStorage) OR whose server
  //      count differs from the current local doneIds size — both need a full
  //      episode-ID fetch.
  //   3. Fetch full episode IDs for those slugs in parallel.
  //   4. Backfill localStorage and update React state.
  //   5. Always mark serverFetchDone so the loading state clears.
  const mergeFromServer = useCallback(async () => {
    try {
      const serverCounts = await fetchAllTracksProgressFromServer();
      if (!serverCounts) return;

      // Server confirmed there are zero tracks with any progress — mark it so
      // the widget can skip the skeleton without waiting for further fetches.
      const hasAnyServerProgress = Object.values(serverCounts).some((c) => c > 0);
      if (!hasAnyServerProgress) {
        setServerReturnedEmpty(true);
        return;
      }

      const currentEntries = readAllActiveTracksOrdered();
      const localBySlug = new Map(currentEntries.map((e) => [e.slug, e.doneIds]));

      // Collect slugs that need a full fetch: new ones and stale ones
      const slugsToFetch = Object.keys(serverCounts).filter((slug) => {
        if (serverCounts[slug] === 0) return false;
        const local = localBySlug.get(slug);
        // New slug not in localStorage, OR server count differs from local count
        return local === undefined || local.size !== serverCounts[slug];
      });

      if (slugsToFetch.length === 0) return;

      const fetched = await Promise.all(
        slugsToFetch.map(async (slug) => {
          const ids = await fetchServerProgress(slug);
          if (ids === null || ids.length === 0) return null;
          return { slug, doneIds: new Set(ids) } satisfies ActiveTrackEntry;
        }),
      );

      const resolved = fetched.filter((e): e is ActiveTrackEntry => e !== null);
      if (resolved.length === 0) return;

      // Backfill localStorage so future page loads and cross-tab events pick
      // these up without another server round-trip
      for (const { slug, doneIds } of resolved) {
        saveDoneIds(slug, doneIds);
      }

      setEntries((prev) => {
        const prevBySlug = new Map(prev.map((e) => [e.slug, e]));
        let changed = false;
        const next = prev.map((e) => {
          const updated = resolved.find((r) => r.slug === e.slug);
          if (updated && updated.doneIds.size !== e.doneIds.size) {
            changed = true;
            return updated;
          }
          return e;
        });
        // Append any brand-new slugs not already in state
        for (const entry of resolved) {
          if (!prevBySlug.has(entry.slug)) {
            next.push(entry);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    } finally {
      setServerFetchDone(true);
    }
  }, []);

  useEffect(() => {
    setEntries(readAllActiveTracksOrdered());

    function onStorage() {
      setEntries(readAllActiveTracksOrdered());
    }

    function onFocus() {
      // Refresh local state from localStorage first (catches same-device
      // cross-tab changes even without a server round-trip)
      setEntries(readAllActiveTracksOrdered());
      // Then re-sync from the server for cross-device / cleared-localStorage
      if (isAuthenticatedRef.current) {
        void mergeFromServer();
      }
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [mergeFromServer]);

  // Initial server merge once auth is known
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    void mergeFromServer();
  }, [isAuthenticated, authLoading, mergeFromServer]);

  // isLoading is true while we don't yet have a definitive answer:
  //   - auth check is still in flight, OR
  //   - user is authenticated but the server fetch hasn't completed yet
  const isLoading = authLoading || (isAuthenticated && !serverFetchDone);

  return { entries, isLoading, serverReturnedEmpty };
}
