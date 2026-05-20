import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";

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

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [episode, setEpisode] = useState<PlayerEpisode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const currentAudioUrlRef = useRef<string>("");

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
      setEpisode(ep);
      setCurrentTime(0);
      setDuration(0);
      audio.src = ep.audioUrl;
      audio.load();

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
    setEpisode(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
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
        onTimeUpdate={(e) =>
          setCurrentTime((e.target as HTMLAudioElement).currentTime)
        }
        onDurationChange={(e) =>
          setDuration((e.target as HTMLAudioElement).duration || 0)
        }
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}
