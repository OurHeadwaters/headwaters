import { useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { usePlayer, type PlayerEpisode } from "@/context/player-context";
import { formatDuration } from "./episode-card";

interface AudioPlayerProps {
  episode: PlayerEpisode;
}

export function AudioPlayer({ episode }: AudioPlayerProps) {
  const { isPlaying, currentTime, duration, load, toggle, seek, skip, audioRef, episode: currentEpisode } = usePlayer();
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const isThisEpisode = currentEpisode?.audioUrl === episode.audioUrl;
  const thisIsPlaying = isThisEpisode && isPlaying;
  const displayTime = isThisEpisode ? currentTime : 0;
  const displayDuration = isThisEpisode ? duration : (episode.durationSeconds ?? 0);

  useEffect(() => {
    load(episode, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode.audioUrl]);

  const handlePlayPause = () => {
    if (!isThisEpisode) {
      load(episode, true);
    } else {
      toggle();
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isThisEpisode) load(episode, false);
    seek(Number(e.target.value));
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

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-4 md:p-6 flex flex-col gap-4">
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { if (!isThisEpisode) load(episode, false); skip(-15); }}
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
            onClick={() => { if (!isThisEpisode) load(episode, false); skip(30); }}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
            title="Forward 30 seconds"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 w-32">
          <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground">
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
