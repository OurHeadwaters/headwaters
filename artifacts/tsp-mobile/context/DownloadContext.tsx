import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

const STORAGE_KEY = "@tsp_downloads_v1";
const DOWNLOAD_DIR = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}tsp_episodes/` : null;

export interface DownloadedEpisode {
  slug: string;
  title: string;
  localUri: string;
  artworkUrl?: string | null;
  episodeNumber?: number | null;
  durationSeconds?: number | null;
  downloadedAt: number;
}

export interface EpisodeToDownload {
  slug: string;
  title: string;
  audioUrl: string;
  artworkUrl?: string | null;
  episodeNumber?: number | null;
  durationSeconds?: number | null;
}

interface DownloadContextState {
  downloads: Record<string, DownloadedEpisode>;
  progress: Record<string, number>;
  downloadEpisode: (episode: EpisodeToDownload) => Promise<void>;
  deleteDownload: (slug: string) => Promise<void>;
  isDownloaded: (slug: string) => boolean;
  isDownloading: (slug: string) => boolean;
  getLocalUri: (slug: string) => string | null;
}

const DownloadContext = createContext<DownloadContextState | null>(null);

function slugToFilename(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9_-]/g, "_") + ".mp3";
}

export function DownloadProvider({ children }: { children: React.ReactNode }) {
  const [downloads, setDownloads] = useState<Record<string, DownloadedEpisode>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const downloadTasksRef = useRef<Record<string, FileSystem.DownloadResumable>>({});

  useEffect(() => {
    loadDownloads();
  }, []);

  async function loadDownloads() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved: Record<string, DownloadedEpisode> = JSON.parse(raw);
      const verified: Record<string, DownloadedEpisode> = {};
      if (Platform.OS !== "web") {
        for (const [slug, info] of Object.entries(saved)) {
          try {
            const stat = await FileSystem.getInfoAsync(info.localUri);
            if (stat.exists) {
              verified[slug] = info;
            }
          } catch {
          }
        }
      } else {
        Object.assign(verified, saved);
      }
      setDownloads(verified);
      if (Object.keys(verified).length !== Object.keys(saved).length) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(verified));
      }
    } catch {
    }
  }

  async function persistDownloads(updated: Record<string, DownloadedEpisode>) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
    }
  }

  const downloadEpisode = useCallback(async (episode: EpisodeToDownload) => {
    if (Platform.OS === "web") return;
    if (!DOWNLOAD_DIR) return;
    if (downloads[episode.slug] || progress[episode.slug] !== undefined) return;

    try {
      const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
      }

      const filename = slugToFilename(episode.slug);
      const localUri = DOWNLOAD_DIR + filename;

      setProgress(prev => ({ ...prev, [episode.slug]: 0 }));

      const callback = (downloadProgress: FileSystem.DownloadProgressData) => {
        const ratio =
          downloadProgress.totalBytesExpectedToWrite > 0
            ? downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite
            : 0;
        setProgress(prev => ({ ...prev, [episode.slug]: ratio }));
      };

      const task = FileSystem.createDownloadResumable(episode.audioUrl, localUri, {}, callback);
      downloadTasksRef.current[episode.slug] = task;

      const result = await task.downloadAsync();

      delete downloadTasksRef.current[episode.slug];

      if (!result) {
        setProgress(prev => {
          const next = { ...prev };
          delete next[episode.slug];
          return next;
        });
        return;
      }

      const info: DownloadedEpisode = {
        slug: episode.slug,
        title: episode.title,
        localUri: result.uri,
        artworkUrl: episode.artworkUrl,
        episodeNumber: episode.episodeNumber,
        durationSeconds: episode.durationSeconds,
        downloadedAt: Date.now(),
      };

      setDownloads(prev => {
        const next = { ...prev, [episode.slug]: info };
        persistDownloads(next);
        return next;
      });
      setProgress(prev => {
        const next = { ...prev };
        delete next[episode.slug];
        return next;
      });
    } catch {
      delete downloadTasksRef.current[episode.slug];
      setProgress(prev => {
        const next = { ...prev };
        delete next[episode.slug];
        return next;
      });
    }
  }, [downloads, progress]);

  const deleteDownload = useCallback(async (slug: string) => {
    const info = downloads[slug];
    if (!info) return;
    if (Platform.OS !== "web") {
      try {
        await FileSystem.deleteAsync(info.localUri, { idempotent: true });
      } catch {
      }
    }
    setDownloads(prev => {
      const next = { ...prev };
      delete next[slug];
      persistDownloads(next);
      return next;
    });
  }, [downloads]);

  const isDownloaded = useCallback((slug: string) => !!downloads[slug], [downloads]);
  const isDownloading = useCallback((slug: string) => progress[slug] !== undefined, [progress]);
  const getLocalUri = useCallback((slug: string) => downloads[slug]?.localUri ?? null, [downloads]);

  return (
    <DownloadContext.Provider value={{ downloads, progress, downloadEpisode, deleteDownload, isDownloaded, isDownloading, getLocalUri }}>
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownloads() {
  const ctx = useContext(DownloadContext);
  if (!ctx) throw new Error("useDownloads must be used within DownloadProvider");
  return ctx;
}
