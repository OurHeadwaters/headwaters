import { Audio, AVPlaybackStatus } from "expo-av";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Platform } from "react-native";
import { useHistory } from "./HistoryContext";

export interface PlayableEpisode {
  slug: string;
  title: string;
  audioUrl?: string | null;
  artworkUrl?: string | null;
  durationSeconds?: number | null;
  episodeNumber?: number | null;
}

interface PlayerState {
  currentEpisode: PlayableEpisode | null;
  isPlaying: boolean;
  isLoading: boolean;
  positionMs: number;
  durationMs: number;
  playbackMinutes: number;
  play: (episode: PlayableEpisode) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  stop: () => Promise<void>;
  onEpisodeFinished: ((slug: string) => void) | null;
  setOnEpisodeFinished: (cb: ((slug: string) => void) | null) => void;
  onPlaybackMinute: ((slug: string, minuteCount: number) => void) | null;
  setOnPlaybackMinute: (cb: ((slug: string, minuteCount: number) => void) | null) => void;
}

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const currentEpisodeRef = useRef<PlayableEpisode | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<PlayableEpisode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [playbackMinutes, setPlaybackMinutes] = useState(0);
  const lastSaveRef = useRef(0);
  const lastMinuteRef = useRef(0);
  const playbackMinutesRef = useRef(0);

  const onEpisodeFinishedRef = useRef<((slug: string) => void) | null>(null);
  const onPlaybackMinuteRef = useRef<((slug: string, minuteCount: number) => void) | null>(null);
  const [onEpisodeFinished, setOnEpisodeFinishedState] = useState<((slug: string) => void) | null>(null);
  const [onPlaybackMinute, setOnPlaybackMinuteState] = useState<((slug: string, minuteCount: number) => void) | null>(null);

  const setOnEpisodeFinished = useCallback((cb: ((slug: string) => void) | null) => {
    onEpisodeFinishedRef.current = cb;
    setOnEpisodeFinishedState(() => cb);
  }, []);

  const setOnPlaybackMinute = useCallback((cb: ((slug: string, minuteCount: number) => void) | null) => {
    onPlaybackMinuteRef.current = cb;
    setOnPlaybackMinuteState(() => cb);
  }, []);

  const { savePosition, getPositionAsync, markFinished } = useHistory();

  const onPlaybackStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      setIsPlaying(status.isPlaying);
      setPositionMs(status.positionMillis);
      if (status.durationMillis) setDurationMs(status.durationMillis);

      const ep = currentEpisodeRef.current;
      if (ep && status.positionMillis > 5000) {
        const now = Date.now();
        // Save position every 5 seconds
        if (now - lastSaveRef.current >= 5000) {
          lastSaveRef.current = now;
          savePosition({
            slug: ep.slug,
            title: ep.title,
            audioUrl: ep.audioUrl,
            artworkUrl: ep.artworkUrl,
            durationSeconds: ep.durationSeconds,
            episodeNumber: ep.episodeNumber,
            positionMs: status.positionMillis,
          });
        }

        // Track playback minutes for streaming micropayments
        if (status.isPlaying) {
          const minutesSinceStart = Math.floor(status.positionMillis / 60000);
          if (minutesSinceStart > lastMinuteRef.current) {
            lastMinuteRef.current = minutesSinceStart;
            playbackMinutesRef.current = minutesSinceStart;
            setPlaybackMinutes(minutesSinceStart);
            if (onPlaybackMinuteRef.current) {
              onPlaybackMinuteRef.current(ep.slug, minutesSinceStart);
            }
          }
        }
      }

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPositionMs(0);
        if (ep) {
          markFinished(ep.slug);
          if (onEpisodeFinishedRef.current) {
            onEpisodeFinishedRef.current(ep.slug);
          }
        }
      }
    },
    [savePosition, markFinished],
  );

  const play = useCallback(
    async (episode: PlayableEpisode) => {
      if (!episode.audioUrl) return;
      try {
        setIsLoading(true);
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        if (Platform.OS !== "web") {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
          });
        }
        const savedPos = await getPositionAsync(episode.slug);
        const { sound } = await Audio.Sound.createAsync(
          { uri: episode.audioUrl },
          {
            shouldPlay: true,
            progressUpdateIntervalMillis: 500,
            positionMillis: savedPos > 0 ? savedPos : 0,
          },
          onPlaybackStatus,
        );
        soundRef.current = sound;
        currentEpisodeRef.current = episode;
        setCurrentEpisode(episode);
        setIsPlaying(true);
        setPositionMs(savedPos);
        setDurationMs(episode.durationSeconds ? episode.durationSeconds * 1000 : 0);
        lastSaveRef.current = 0;
        lastMinuteRef.current = Math.floor(savedPos / 60000);
        playbackMinutesRef.current = Math.floor(savedPos / 60000);
        setPlaybackMinutes(Math.floor(savedPos / 60000));
      } catch (e) {
        console.error("Audio play error:", e);
      } finally {
        setIsLoading(false);
      }
    },
    [onPlaybackStatus, getPositionAsync],
  );

  const pause = useCallback(async () => {
    await soundRef.current?.pauseAsync();
    setIsPlaying(false);
    const ep = currentEpisodeRef.current;
    if (ep) {
      const pos = await soundRef.current?.getStatusAsync();
      if (pos?.isLoaded && pos.positionMillis > 5000) {
        await savePosition({
          slug: ep.slug,
          title: ep.title,
          audioUrl: ep.audioUrl,
          artworkUrl: ep.artworkUrl,
          durationSeconds: ep.durationSeconds,
          episodeNumber: ep.episodeNumber,
          positionMs: pos.positionMillis,
        });
      }
    }
  }, [savePosition]);

  const resume = useCallback(async () => {
    await soundRef.current?.playAsync();
    setIsPlaying(true);
  }, []);

  const seek = useCallback(async (ms: number) => {
    await soundRef.current?.setPositionAsync(ms);
    setPositionMs(ms);
    lastMinuteRef.current = Math.floor(ms / 60000);
  }, []);

  const stop = useCallback(async () => {
    await soundRef.current?.stopAsync();
    await soundRef.current?.unloadAsync();
    soundRef.current = null;
    currentEpisodeRef.current = null;
    setCurrentEpisode(null);
    setIsPlaying(false);
    setPositionMs(0);
    setDurationMs(0);
    setPlaybackMinutes(0);
    lastMinuteRef.current = 0;
    playbackMinutesRef.current = 0;
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentEpisode,
        isPlaying,
        isLoading,
        positionMs,
        durationMs,
        playbackMinutes,
        play,
        pause,
        resume,
        seek,
        stop,
        onEpisodeFinished,
        setOnEpisodeFinished,
        onPlaybackMinute,
        setOnPlaybackMinute,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
