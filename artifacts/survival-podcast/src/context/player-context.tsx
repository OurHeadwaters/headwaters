/*
 * PlayerProvider — global singleton audio context (web)
 *
 * Happy path:
 *   load(ep, true) → sets src → canplay fires → audio.play() → timeupdate loop
 *   → every 5 s saveProgress() → at 95 % markCompleted() → onEnded saves final pos
 *
 * Edge cases verified:
 *   - Calling load() with the same URL while playing → no-op (just resumes if paused)
 *   - Calling load() with a new URL while playing → old src replaced, loadedmetadata
 *     restores saved position, canplay triggers play()
 *   - dismiss() → pauses, clears src, resets all state
 *   - stalled / error → isError set true, play stops; retry clears error and reloads
 *   - skip() updates currentTime state immediately (doesn't wait for timeupdate)
 */

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { saveProgress, getProgress, markCompleted, isCompleted } from "@/lib/playback-progress";

export interface PlayerEpisode {
  title: string;
  audioUrl: string;
  artworkUrl?: string | null;
  slug: string;
  episodeNumber?: string | number | null;
  durationSeconds?: number | null;
}

interface PlayerContextValue {
  episode: PlayerEpisode | null;
  isPlaying: boolean;
  isError: boolean;
  currentTime: number;
  duration: number;
  load: (episode: PlayerEpisode, autoPlay?: boolean) => void;
  toggle: () => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  dismiss: () => void;
  retry: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

const SAVE_INTERVAL_MS = 5000;
const NEAR_END_THRESHOLD = 0.95;

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [episode, setEpisode] = useState<PlayerEpisode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const currentAudioUrlRef = useRef<string>("");
  const currentSlugRef = useRef<string>("");
  const lastSavedAtRef = useRef<number>(0);
  const pendingAutoPlayRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);

  const load = useCallback(
    (ep: PlayerEpisode, autoPlay = true) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (currentAudioUrlRef.current === ep.audioUrl) {
        // Same episode — just resume if autoPlay requested and not already playing
        if (autoPlay && !isPlayingRef.current) {
          audio.play().then(() => { setIsPlaying(true); isPlayingRef.current = true; }).catch(() => {});
        }
        return;
      }

      // New episode
      currentAudioUrlRef.current = ep.audioUrl;
      currentSlugRef.current = ep.slug;
      pendingAutoPlayRef.current = autoPlay;
      setEpisode(ep);
      setCurrentTime(0);
      setDuration(0);
      setIsError(false);
      audio.src = ep.audioUrl;
      audio.load();

      // Restore saved position once metadata is available
      if (!isCompleted(ep.slug)) {
        const savedEntry = getProgress(ep.slug);
        if (savedEntry && savedEntry.position > 0 && savedEntry.duration > 0) {
          const ratio = savedEntry.position / savedEntry.duration;
          if (ratio < NEAR_END_THRESHOLD) {
            audio.addEventListener(
              "loadedmetadata",
              () => {
                audio.currentTime = savedEntry.position;
                setCurrentTime(savedEntry.position);
              },
              { once: true },
            );
          }
        }
      }

      // Defer play until canplay so audio is actually ready (avoids DOMException on mobile)
      if (autoPlay) {
        audio.addEventListener(
          "canplay",
          () => {
            if (pendingAutoPlayRef.current) {
              audio.play().then(() => { setIsPlaying(true); isPlayingRef.current = true; }).catch(() => {});
            }
          },
          { once: true },
        );
      }
    },
    [],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !episode) return;
    if (isPlayingRef.current) {
      audio.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
    } else {
      audio.play().then(() => { setIsPlaying(true); isPlayingRef.current = true; }).catch(() => {});
    }
  }, [episode]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const clamped = Math.max(0, Math.min(time, audio.duration || 0));
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }, []);

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = Math.max(0, Math.min(audio.currentTime + seconds, audio.duration || 0));
    audio.currentTime = next;
    setCurrentTime(next);
  }, []);

  const dismiss = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    pendingAutoPlayRef.current = false;
    currentAudioUrlRef.current = "";
    currentSlugRef.current = "";
    setEpisode(null);
    setIsPlaying(false);
    isPlayingRef.current = false;
    setIsError(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const retry = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentAudioUrlRef.current) return;
    setIsError(false);
    audio.load();
    audio.addEventListener(
      "canplay",
      () => {
        audio.play().then(() => { setIsPlaying(true); isPlayingRef.current = true; }).catch(() => {});
      },
      { once: true },
    );
  }, []);

  const handleTimeUpdate = useCallback((e: Event) => {
    const audio = e.target as HTMLAudioElement;
    const time = audio.currentTime;
    setCurrentTime(time);

    if (currentSlugRef.current && audio.duration > 0) {
      const ratio = time / audio.duration;
      if (ratio >= NEAR_END_THRESHOLD) {
        markCompleted(currentSlugRef.current);
      }

      const now = Date.now();
      if (now - lastSavedAtRef.current >= SAVE_INTERVAL_MS) {
        lastSavedAtRef.current = now;
        saveProgress(currentSlugRef.current, time, audio.duration);
      }
    }
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        episode,
        isPlaying,
        isError,
        currentTime,
        duration,
        load,
        toggle,
        seek,
        skip,
        dismiss,
        retry,
        audioRef,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate as unknown as React.ReactEventHandler<HTMLAudioElement>}
        onDurationChange={(e) =>
          setDuration((e.target as HTMLAudioElement).duration || 0)
        }
        onEnded={() => {
          setIsPlaying(false);
          isPlayingRef.current = false;
          pendingAutoPlayRef.current = false;
          if (currentSlugRef.current) {
            const audio = audioRef.current;
            if (audio && audio.duration > 0) {
              saveProgress(currentSlugRef.current, audio.duration, audio.duration);
            }
            markCompleted(currentSlugRef.current);
          }
        }}
        onPlay={() => { setIsPlaying(true); isPlayingRef.current = true; }}
        onPause={() => {
          setIsPlaying(false);
          isPlayingRef.current = false;
          const audio = audioRef.current;
          if (currentSlugRef.current && audio && audio.duration > 0) {
            saveProgress(currentSlugRef.current, audio.currentTime, audio.duration);
          }
        }}
        onStalled={() => {
          // Browser stalled loading — mark error so UI can offer retry
          setIsError(true);
          setIsPlaying(false);
          isPlayingRef.current = false;
        }}
        onError={() => {
          setIsError(true);
          setIsPlaying(false);
          isPlayingRef.current = false;
        }}
        onWaiting={() => {
          // Buffering — clear any previous error state
          setIsError(false);
        }}
        onCanPlay={() => {
          setIsError(false);
        }}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}
