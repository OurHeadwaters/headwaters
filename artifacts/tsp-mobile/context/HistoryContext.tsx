import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const HISTORY_KEY = "tsp:playback_history";
const BOOKMARKS_KEY = "tsp:bookmarks";

export interface PlaybackRecord {
  slug: string;
  title: string;
  audioUrl?: string | null;
  artworkUrl?: string | null;
  durationSeconds?: number | null;
  episodeNumber?: number | null;
  positionMs: number;
  updatedAt: number;
}

export interface BookmarkEntry {
  slug: string;
  title: string;
  artworkUrl?: string | null;
  durationSeconds?: number | null;
  episodeNumber?: number | null;
  pubDate?: string | null;
  savedAt: number;
}

interface HistoryState {
  history: Record<string, PlaybackRecord>;
  bookmarks: BookmarkEntry[];
  isReady: boolean;
  savePosition: (record: Omit<PlaybackRecord, "updatedAt">) => Promise<void>;
  getSavedPosition: (slug: string) => number;
  getPositionAsync: (slug: string) => Promise<number>;
  markFinished: (slug: string) => Promise<void>;
  isBookmarked: (slug: string) => boolean;
  toggleBookmark: (entry: Omit<BookmarkEntry, "savedAt">) => Promise<void>;
  continueListening: PlaybackRecord[];
}

const HistoryContext = createContext<HistoryState | null>(null);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<Record<string, PlaybackRecord>>({});
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const [isReady, setIsReady] = useState(false);
  const historyRef = useRef<Record<string, PlaybackRecord>>({});

  useEffect(() => {
    let historyLoaded = false;
    let bookmarksLoaded = false;

    function checkReady() {
      if (historyLoaded && bookmarksLoaded) {
        setIsReady(true);
      }
    }

    AsyncStorage.getItem(HISTORY_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          historyRef.current = parsed;
          setHistory(parsed);
        } catch {}
      }
      historyLoaded = true;
      checkReady();
    });

    AsyncStorage.getItem(BOOKMARKS_KEY).then((raw) => {
      if (raw) {
        try {
          setBookmarks(JSON.parse(raw));
        } catch {}
      }
      bookmarksLoaded = true;
      checkReady();
    });
  }, []);

  const savePosition = useCallback(async (record: Omit<PlaybackRecord, "updatedAt">) => {
    const entry: PlaybackRecord = { ...record, updatedAt: Date.now() };
    setHistory((prev) => {
      const next = { ...prev, [record.slug]: entry };
      historyRef.current = next;
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getSavedPosition = useCallback(
    (slug: string) => {
      return history[slug]?.positionMs ?? 0;
    },
    [history],
  );

  const getPositionAsync = useCallback(
    async (slug: string): Promise<number> => {
      if (isReady) {
        return historyRef.current[slug]?.positionMs ?? 0;
      }
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        if (raw) {
          const parsed: Record<string, PlaybackRecord> = JSON.parse(raw);
          return parsed[slug]?.positionMs ?? 0;
        }
      } catch {}
      return 0;
    },
    [isReady],
  );

  const markFinished = useCallback(async (slug: string) => {
    setHistory((prev) => {
      if (!prev[slug]) return prev;
      const next = { ...prev, [slug]: { ...prev[slug], positionMs: 0, updatedAt: Date.now() } };
      historyRef.current = next;
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (slug: string) => {
      return bookmarks.some((b) => b.slug === slug);
    },
    [bookmarks],
  );

  const toggleBookmark = useCallback(async (entry: Omit<BookmarkEntry, "savedAt">) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.slug === entry.slug);
      const next = exists
        ? prev.filter((b) => b.slug !== entry.slug)
        : [{ ...entry, savedAt: Date.now() }, ...prev];
      AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const continueListening = Object.values(history)
    .filter((r) => r.positionMs > 5000)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 8);

  return (
    <HistoryContext.Provider
      value={{
        history,
        bookmarks,
        isReady,
        savePosition,
        getSavedPosition,
        getPositionAsync,
        markFinished,
        isBookmarked,
        toggleBookmark,
        continueListening,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be used within HistoryProvider");
  return ctx;
}
