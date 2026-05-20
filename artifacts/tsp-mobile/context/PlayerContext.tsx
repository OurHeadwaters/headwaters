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
  play: (episode: PlayableEpisode) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  stop: () => Promise<void>;
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
  const lastSaveRef = useRef(0);

  const { savePosition, getSavedPosition, markFinished } = useHistory();

  const onPlaybackStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      setIsPlaying(status.isPlaying);
      setPositionMs(status.positionMillis);
      if (status.durationMillis) setDurationMs(status.durationMillis);

      const ep = currentEpisodeRef.current;
      if (ep && status.positionMillis > 5000) {
        const now = Date.now();
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
      }

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPositionMs(0);
        if (ep) {
          markFinished(ep.slug);
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
        const savedPos = getSavedPosition(episode.slug);
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
      } catch (e) {
        console.error("Audio play error:", e);
      } finally {
        setIsLoading(false);
      }
    },
    [onPlaybackStatus, getSavedPosition],
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
  }, []);

  return (
    <PlayerContext.Provider
      value={{ currentEpisode, isPlaying, isLoading, positionMs, durationMs, play, pause, resume, seek, stop }}
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
