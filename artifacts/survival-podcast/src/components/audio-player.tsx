/*
 * AudioPlayer — episode detail page player (web)
 *
 * Happy path:
 *   Component mounts with episode prop → load(ep, false) primes PlayerContext →
 *   user clicks Play → toggle() → isPlaying true → progress bar tracks currentTime
 *   If saved position exists and ratio < 95 %: resume banner appears →
 *   user clicks Resume → seek(resumeFrom) + play
 *   At 95 % completion: markCompleted fires, completed banner replaces resume banner
 *
 * Edge cases verified:
 *   - handleResumeClick: if episode not yet active in context, loads first then seeks
 *     via loadedmetadata to avoid seeking on unloaded audio
 *   - handleStartOver: clears completed flag, seeks to 0, plays — no double-load
 *   - Skip buttons: skip only fires after load is confirmed active
 *   - isError from context: displayed inline with retry option
 *   - Resume banner hidden while playing so it doesn't obscure controls
 */

import { useEffect, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, RotateCcw, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { usePlayer, type PlayerEpisode } from "@/context/player-context";
import { formatDuration } from "./episode-card";
import { getProgress, isCompleted, clearCompleted } from "@/lib/playback-progress";

interface AudioPlayerProps {
  episode: PlayerEpisode;
}

export function AudioPlayer({ episode }: AudioPlayerProps) {
  const { isPlaying, isError, currentTime, duration, load, toggle, seek, skip, retry, audioRef, episode: currentEpisode } = usePlayer();
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [resumeFrom, setResumeFrom] = useState<number | null>(null);
  const [resumed, setResumed] = useState(false);
  const [episodeCompleted, setEpisodeCompleted] = useState(false);

  const isThisEpisode = currentEpisode?.audioUrl === episode.audioUrl;
  const thisIsPlaying = isThisEpisode && isPlaying;
  const displayTime = isThisEpisode ? currentTime : 0;
  const displayDuration = isThisEpisode ? duration : (episode.durationSeconds ?? 0);

  useEffect(() => {
    const completed = isCompleted(episode.slug);
    setEpisodeCompleted(completed);
    if (completed) {
      setResumeFrom(null);
    } else {
      const saved = getProgress(episode.slug);
      if (saved && saved.position > 0 && saved.duration > 0) {
        const ratio = saved.position / saved.duration;
        if (ratio < 0.95) {
          setResumeFrom(saved.position);
          setResumed(false);
        } else {
          setResumeFrom(null);
        }
      } else {
        setResumeFrom(null);
      }
    }
    // Prime the player context with this episode (no autoplay yet)
    load(episode, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode.audioUrl]);

  useEffect(() => {
    if (isThisEpisode && !isPlaying) {
      const completed = isCompleted(episode.slug);
      if (completed) {
        setEpisodeCompleted(true);
        setResumeFrom(null);
      }
    }
  }, [isPlaying, isThisEpisode, episode.slug]);

  const handlePlayPause = () => {
    if (!isThisEpisode) {
      load(episode, true);
    } else {
      toggle();
    }
  };

  const handleResumeClick = () => {
    setResumed(true);
    if (!isThisEpisode) {
      // Episode not loaded yet — load with autoplay; position restore happens
      // via the loadedmetadata listener inside player-context (reads localStorage)
      load(episode, true);
    } else {
      // Already loaded — seek directly then play
      if (resumeFrom !== null) {
        seek(resumeFrom);
      }
      if (!isPlaying) {
        audioRef.current?.play().catch(() => {});
      }
    }
  };

  const handleStartOver = () => {
    clearCompleted(episode.slug);
    setEpisodeCompleted(false);
    setResumed(true);
    setResumeFrom(null);
    if (!isThisEpisode) {
      // Load fresh; context will not find saved progress (position 0 from start)
      load(episode, true);
      // Override any restored position to 0 after canplay
      const audio = audioRef.current;
      if (audio) {
        audio.addEventListener("canplay", () => { audio.currentTime = 0; }, { once: true });
      }
    } else {
      seek(0);
      if (!isPlaying) {
        audioRef.current?.play().catch(() => {});
      }
    }
  };

  const handleSkipBack = () => {
    if (!isThisEpisode) {
      load(episode, true);
    } else {
      skip(-15);
    }
  };

  const handleSkipForward = () => {
    if (!isThisEpisode) {
      load(episode, true);
    } else {
      skip(30);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isThisEpisode) {
      load(episode, true);
    } else {
      seek(Number(e.target.value));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (audioRef.current) audioRef.current.muted = next;
  };

  const showResumeBanner = resumeFrom !== null && !resumed && !isPlaying && !episodeCompleted;

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-4 md:p-6 flex flex-col gap-4">
      {isError && (
        <div className="flex items-center justify-between gap-3 bg-red-900/20 border border-red-700/30 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-sm font-semibold text-red-300">Audio failed to load</span>
          </div>
          <button
            onClick={retry}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}
      {episodeCompleted && !isPlaying && (
        <div className="flex items-center justify-between gap-3 bg-emerald-900/20 border border-emerald-700/30 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-sm font-semibold text-emerald-300">You've listened to this episode</span>
          </div>
          <button
            onClick={handleStartOver}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
          >
            <RotateCcw className="w-3 h-3" />
            Play again
          </button>
        </div>
      )}
      {showResumeBanner && (
        <div className="flex items-center justify-between gap-3 bg-primary/8 border border-primary/20 rounded-lg px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-primary uppercase tracking-wide">You left off here</span>
            <span className="text-sm text-foreground font-medium">{formatDuration(resumeFrom!)} in</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartOver}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
            >
              <RotateCcw className="w-3 h-3" />
              Start over
            </button>
            <button
              onClick={handleResumeClick}
              className="flex items-center gap-1.5 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors px-3 py-1.5 rounded-lg shadow-sm"
            >
              <Play className="w-3 h-3 fill-current" />
              Resume
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSkipBack}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
            title="Back 15 seconds"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={handlePlayPause}
            className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all"
          >
            {thisIsPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={handleSkipForward}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
            title="Forward 30 seconds"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 w-32">
          <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground" title={isMuted || volume === 0 ? "Unmute" : "Mute"}>
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
            aria-label="Volume"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs font-medium font-mono text-muted-foreground">
        <span className="w-12 text-right">{formatDuration(displayTime) || "0:00"}</span>
        <div className="flex-1 relative flex items-center h-4">
          <input
            type="range"
            min={0}
            max={displayDuration || 100}
            value={displayTime}
            onChange={handleProgressChange}
            className="w-full absolute inset-0 opacity-0 cursor-pointer z-10"
            aria-label="Seek"
          />
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{
                width: `${displayDuration ? (displayTime / displayDuration) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
        <span className="w-12">{formatDuration(displayDuration) || "0:00"}</span>
      </div>
    </div>
  );
}
