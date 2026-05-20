import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { saveProgress, getProgress } from "@/lib/playback-progress";

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
  currentTime: number;
  duration: number;
  load: (episode: PlayerEpisode, autoPlay?: boolean) => void;
  toggle: () => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  dismiss: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

const SAVE_INTERVAL_MS = 5000;
const NEAR_END_THRESHOLD = 0.95;

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [episode, setEpisode] = useState<PlayerEpisode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const currentAudioUrlRef = useRef<string>("");
  const currentSlugRef = useRef<string>("");
  const lastSavedAtRef = useRef<number>(0);

  const load = useCallback(
    (ep: PlayerEpisode, autoPlay = true) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (currentAudioUrlRef.current === ep.audioUrl) {
        if (autoPlay && !isPlaying) {
          audio.play().then(() => setIsPlaying(true)).catch(() => {});
        }
        return;
      }

      currentAudioUrlRef.current = ep.audioUrl;
      currentSlugRef.current = ep.slug;
      setEpisode(ep);
      setCurrentTime(0);
      setDuration(0);
      audio.src = ep.audioUrl;
      audio.load();

      const savedEntry = getProgress(ep.slug);
      if (savedEntry && savedEntry.position > 0 && savedEntry.duration > 0) {
        const ratio = savedEntry.position / savedEntry.duration;
        if (ratio < NEAR_END_THRESHOLD) {
          const seekToSaved = () => {
            audio.currentTime = savedEntry.position;
            setCurrentTime(savedEntry.position);
          };
          audio.addEventListener("loadedmetadata", seekToSaved, { once: true });
        }
      }

      if (autoPlay) {
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    },
    [isPlaying],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !episode) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying, episode]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(
      0,
      Math.min(audio.currentTime + seconds, audio.duration || 0),
    );
  }, []);

  const dismiss = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    currentAudioUrlRef.current = "";
    currentSlugRef.current = "";
    setEpisode(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const handleTimeUpdate = useCallback((e: Event) => {
    const audio = e.target as HTMLAudioElement;
    const time = audio.currentTime;
    setCurrentTime(time);

    const now = Date.now();
    if (
      currentSlugRef.current &&
      audio.duration > 0 &&
      now - lastSavedAtRef.current >= SAVE_INTERVAL_MS
    ) {
      lastSavedAtRef.current = now;
      saveProgress(currentSlugRef.current, time, audio.duration);
    }
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        episode,
        isPlaying,
        currentTime,
        duration,
        load,
        toggle,
        seek,
        skip,
        dismiss,
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
          if (currentSlugRef.current) {
            const audio = audioRef.current;
            if (audio && audio.duration > 0) {
              saveProgress(currentSlugRef.current, audio.duration, audio.duration);
            }
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => {
          setIsPlaying(false);
          const audio = audioRef.current;
          if (currentSlugRef.current && audio && audio.duration > 0) {
            saveProgress(currentSlugRef.current, audio.currentTime, audio.duration);
          }
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
