import { useGetThisDayEpisodes } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Play, BookOpen, Calendar } from "lucide-react";
import { Link } from "wouter";
import { usePlayer } from "@/context/player-context";
import tspLogo from "@assets/tsp/tsp-logo.jpeg";
import { decodeHtml } from "@/lib/decode-html";

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ThisDayInHistory() {
  const today = new Date();
  const { load, seek, audioRef } = usePlayer();

  const { data: episodes, isLoading } = useGetThisDayEpisodes();

  const dateLabel = format(today, "MMMM d");

  const handlePlay = (ep: {
    slug: string;
    title: string;
    audioUrl?: string | null;
    artworkUrl?: string | null;
    episodeNumber?: number | null;
    durationSeconds?: number | null;
    historyTimestamp?: number | null;
  }) => {
    if (!ep.audioUrl) return;
    load(
      {
        slug: ep.slug,
        title: ep.title,
        audioUrl: ep.audioUrl,
        artworkUrl: ep.artworkUrl,
        episodeNumber: ep.episodeNumber,
        durationSeconds: ep.durationSeconds,
      },
      true,
    );
    if (ep.historyTimestamp && ep.historyTimestamp > 0) {
      const seekTo = ep.historyTimestamp;
      const audio = audioRef.current;
      if (audio) {
        const doSeek = () => {
          seek(seekTo);
        };
        audio.addEventListener("canplay", doSeek, { once: true });
      }
    }
  };

  return (
    <section className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 border-b border-indigo-800/40 text-white">
      <div className="container mx-auto px-4 md:px-6 py-10 md:py-14">
        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-700/60 border border-indigo-500/40 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-indigo-300/80 mb-0.5">
                This Day in History
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white leading-none">
                {dateLabel}
              </h2>
            </div>
          </div>
          <p className="text-indigo-200/70 text-sm md:ml-auto md:text-right max-w-sm">
            Every episode Jack published on this date — and what happened in history that day.
          </p>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="snap-start shrink-0 w-72 h-36 bg-indigo-800/30 rounded-xl border border-indigo-700/30 animate-pulse"
              />
            ))}
          </div>
        ) : !episodes || episodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <BookOpen className="w-10 h-10 text-indigo-400/50" />
            <p className="text-indigo-200/70 font-medium">
              No episodes published on this date — check back tomorrow.
            </p>
            <Link
              href="/series/history"
              className="text-sm font-semibold text-indigo-300 hover:text-white transition-colors underline underline-offset-4"
            >
              Browse the full History series →
            </Link>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:overflow-x-visible">
            {episodes.map((ep) => {
              const year = new Date(ep.pubDate).getUTCFullYear();
              return (
                <div
                  key={ep.slug}
                  className="snap-start shrink-0 w-72 md:w-auto flex flex-col gap-3 bg-indigo-900/40 border border-indigo-700/30 rounded-xl p-5 hover:bg-indigo-800/50 hover:border-indigo-600/50 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-serif font-bold text-indigo-200 leading-none">
                        {year}
                      </span>
                      {ep.episodeNumber != null && (
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400/80 bg-indigo-800/60 border border-indigo-700/40 px-2 py-0.5 rounded-full">
                          EP {ep.episodeNumber}
                        </span>
                      )}
                    </div>
                    {ep.artworkUrl ? (
                      <img
                        src={ep.artworkUrl}
                        alt=""
                        className="w-10 h-10 rounded-md object-cover border border-indigo-700/40 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <img
                        src={tspLogo}
                        alt=""
                        className="w-10 h-10 rounded-md object-cover border border-indigo-700/40 shrink-0 opacity-40"
                      />
                    )}
                  </div>

                  <Link href={`/episodes/${ep.slug}`}>
                    <h3 className="text-sm font-semibold text-white/90 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                      {decodeHtml(ep.title)}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-2 mt-auto pt-1">
                    <button
                      onClick={() => handlePlay(ep)}
                      disabled={!ep.audioUrl}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {ep.historyTimestamp && ep.historyTimestamp > 0
                        ? `Play @ ${formatTimestamp(ep.historyTimestamp)}`
                        : "Play"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
