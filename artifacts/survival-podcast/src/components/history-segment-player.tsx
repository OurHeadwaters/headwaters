import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Clock } from "lucide-react";
import { usePlayer } from "@/context/player-context";

interface HistorySegmentPlayerProps {
  audioUrl: string;
  startSeconds: number;
  endSeconds: number;
  episode: {
    slug: string;
    title: string;
    artworkUrl?: string | null;
    episodeNumber?: number | null;
    durationSeconds?: number | null;
  };
  compact?: boolean;
}

function formatSegmentTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function HistorySegmentPlayer({
  audioUrl,
  startSeconds,
  endSeconds,
  episode,
  compact = false,
}: HistorySegmentPlayerProps) {
  const { load, seek, toggle, isPlaying, currentTime, episode: globalEpisode, audioRef } = usePlayer();
  const [segmentActive, setSegmentActive] = useState(false);
  const segmentDuration = Math.max(1, endSeconds - startSeconds);
  const segmentActiveRef = useRef(false);

  const isThisEpisode = globalEpisode?.audioUrl === audioUrl;
  const inSegment = isThisEpisode && segmentActive;

  const segmentCurrentTime = inSegment
    ? Math.max(0, Math.min(currentTime - startSeconds, segmentDuration))
    : 0;
  const progress = inSegment ? (segmentCurrentTime / segmentDuration) * 100 : 0;

  segmentActiveRef.current = segmentActive;

  useEffect(() => {
    if (!inSegment || !isPlaying) return;
    if (currentTime >= endSeconds) {
      const audio = audioRef.current;
      if (audio) audio.pause();
      setSegmentActive(false);
    }
  }, [currentTime, endSeconds, inSegment, isPlaying, audioRef]);

  useEffect(() => {
    if (!isThisEpisode) {
      setSegmentActive(false);
    }
  }, [isThisEpisode]);

  const handlePlay = useCallback(() => {
    if (!isThisEpisode) {
      load(
        {
          slug: episode.slug,
          title: episode.title,
          audioUrl,
          artworkUrl: episode.artworkUrl,
          episodeNumber: episode.episodeNumber,
          durationSeconds: episode.durationSeconds,
        },
        false,
      );
      const audio = audioRef.current;
      const startAndPlay = () => {
        seek(startSeconds);
        audio?.play().catch(() => {});
        setSegmentActive(true);
      };
      audio?.addEventListener("loadedmetadata", startAndPlay, { once: true });
    } else {
      seek(startSeconds);
      if (!isPlaying) {
        audioRef.current?.play().catch(() => {});
      }
      setSegmentActive(true);
    }
  }, [isThisEpisode, load, seek, toggle, isPlaying, audioRef, audioUrl, episode, startSeconds]);

  const handlePause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) audio.pause();
  }, [audioRef]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!inSegment) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = startSeconds + ratio * segmentDuration;
      seek(newTime);
    },
    [inSegment, startSeconds, segmentDuration, seek],
  );

  const isSegmentPlaying = inSegment && isPlaying;

  if (compact) {
    return (
      <button
        onClick={isSegmentPlaying ? handlePause : handlePlay}
        disabled={!audioUrl}
        className="inline-flex items-center gap-2 bg-[#1A2E1F] hover:bg-[#243d29] disabled:opacity-40 disabled:cursor-not-allowed text-[#D9A066] border border-[#D9A066]/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
        title={`Play history segment (${formatSegmentTime(startSeconds)} – ${formatSegmentTime(endSeconds)})`}
      >
        {isSegmentPlaying ? (
          <Pause className="w-3 h-3 fill-current" />
        ) : (
          <Play className="w-3 h-3 fill-current" />
        )}
        <Clock className="w-3 h-3" />
        {formatSegmentTime(segmentDuration)}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          onClick={isSegmentPlaying ? handlePause : handlePlay}
          disabled={!audioUrl}
          className="w-9 h-9 rounded-full bg-[#D9A066] hover:bg-[#c48a4a] disabled:opacity-40 disabled:cursor-not-allowed text-[#1A2E1F] flex items-center justify-center transition-colors shrink-0 shadow-sm"
          aria-label={isSegmentPlaying ? "Pause history segment" : "Play history segment"}
        >
          {isSegmentPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        <div className="flex-1 flex flex-col gap-1">
          <div
            className="h-2 bg-white/10 rounded-full cursor-pointer overflow-hidden"
            onClick={handleSeek}
            role="slider"
            aria-label="Segment progress"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-[#D9A066] rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/40 font-mono leading-none">
            <span>{formatSegmentTime(segmentCurrentTime)}</span>
            <span>{formatSegmentTime(segmentDuration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
