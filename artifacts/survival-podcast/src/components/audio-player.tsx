import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { formatDuration } from "./episode-card";

export function AudioPlayer({ src, title }: { src: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("loadeddata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadeddata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const prevValue = isPlaying;
    setIsPlaying(!prevValue);
    if (!prevValue) {
      audioRef.current?.play();
    } else {
      audioRef.current?.pause();
    }
  };

  const skipTime = (amount: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += amount;
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.muted = newMuted;
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-4 md:p-6 flex flex-col gap-4 sticky top-[72px] z-40">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => skipTime(-15)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
            title="Back 15 seconds"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button 
            onClick={togglePlayPause}
            className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-1" />
            )}
          </button>
          
          <button 
            onClick={() => skipTime(30)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
            title="Forward 30 seconds"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
        
        <div className="hidden md:flex items-center gap-2 w-32">
          <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground">
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
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
        <span className="w-12 text-right">{formatDuration(currentTime) || "0:00"}</span>
        <div className="flex-1 relative flex items-center h-4">
          <input 
            type="range" 
            min={0} 
            max={duration || 100} 
            value={currentTime} 
            onChange={handleProgressChange}
            className="w-full absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary" 
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>
        <span className="w-12">{formatDuration(duration) || "0:00"}</span>
      </div>
    </div>
  );
}