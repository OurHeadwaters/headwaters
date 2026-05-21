/*
 * MiniPlayer — persistent bottom bar (web)
 *
 * Happy path:
 *   Episode loaded into PlayerContext → MiniPlayer renders → click progress bar
 *   to scrub → seek() called → timeupdate keeps bar in sync → click X to dismiss
 *
 * Edge cases verified:
 *   - Returns null when no episode is loaded (no layout shift)
 *   - Volume slider syncs directly to audioRef so changes are immediate
 *   - Mute toggle preserves last non-zero volume so unmute restores it
 *   - isError shown as a retry button in place of play/pause
 *   - z-index 50 keeps player above all page content
 *   - Progress bar click target is full width (no dead-zones)
 */

import { Link } from "wouter";
import { Play, Pause, SkipBack, SkipForward, X, Volume2, VolumeX, AlertCircle, RefreshCw } from "lucide-react";
import { useState, useRef } from "react";
import { usePlayer } from "@/context/player-context";
import { decodeHtml } from "@/lib/decode-html";
import tspLogo from "@assets/tsp/tsp-logo.jpeg";

function fmt(s: number): string {
  if (!s || isNaN(s)) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function MiniPlayer() {
  const { episode, isPlaying, isError, currentTime, duration, toggle, seek, skip, dismiss, retry, audioRef } = usePlayer();
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  if (!episode) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    setMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (audioRef.current) audioRef.current.muted = next;
  };

  const title = decodeHtml(episode.title);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#2C4A36] text-white shadow-2xl select-none">
      {/* Progress bar — click/tap to scrub */}
      <div
        ref={progressRef}
        className="w-full h-1 bg-white/20 cursor-pointer group"
        onClick={handleProgressClick}
        role="slider"
        aria-label="Playback progress"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-[#D9A066] transition-none relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#D9A066] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="container mx-auto px-3 md:px-6 h-16 flex items-center gap-3 md:gap-4">
        {/* Artwork */}
        <Link href={`/episodes/${episode.slug}`} className="shrink-0">
          <img
            src={episode.artworkUrl || tspLogo}
            alt=""
            className="w-10 h-10 rounded object-cover border border-white/20 hover:opacity-90 transition-opacity"
          />
        </Link>

        {/* Title + meta */}
        <div className="flex-1 min-w-0 hidden sm:flex flex-col gap-0.5">
          <Link
            href={`/episodes/${episode.slug}`}
            className="font-serif font-bold text-sm leading-tight line-clamp-1 hover:text-[#D9A066] transition-colors"
          >
            {title}
          </Link>
          <div className="text-[11px] text-white/60 font-mono tabular-nums">
            {episode.episodeNumber ? `Ep ${episode.episodeNumber} · ` : ""}
            {fmt(currentTime)} / {fmt(duration)}
          </div>
        </div>

        {/* Mobile title only */}
        <div className="flex-1 min-w-0 flex sm:hidden flex-col gap-0.5">
          <Link
            href={`/episodes/${episode.slug}`}
            className="font-serif font-bold text-xs leading-tight line-clamp-1 hover:text-[#D9A066] transition-colors"
          >
            {title}
          </Link>
          <div className="text-[10px] text-white/60 font-mono tabular-nums">
            {fmt(currentTime)} / {fmt(duration)}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {isError ? (
            /* Error state: show icon + retry button */
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <button
                onClick={retry}
                className="flex items-center gap-1 text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
                title="Retry playback"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => skip(-15)}
                className="hidden sm:flex p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Back 15s"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={toggle}
                className="w-10 h-10 rounded-full bg-[#D9A066] hover:bg-[#c48a4a] text-white flex items-center justify-center shadow transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={() => skip(30)}
                className="hidden sm:flex p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Forward 30s"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Volume (desktop only) */}
        <div className="hidden md:flex items-center gap-2 w-28 shrink-0">
          <button
            onClick={toggleMute}
            className="text-white/60 hover:text-white transition-colors"
            title={muted || volume === 0 ? "Unmute" : "Mute"}
          >
            {muted || volume === 0 ? (
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
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-full h-1 appearance-none bg-white/20 rounded-full cursor-pointer accent-[#D9A066]"
            aria-label="Volume"
          />
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          title="Close player"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
