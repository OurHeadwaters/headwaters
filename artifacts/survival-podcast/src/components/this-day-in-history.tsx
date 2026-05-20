import { useGetThisDayEpisodes } from "@workspace/api-client-react";
import type { ThisDayEpisode } from "@workspace/api-client-react";
import { Play, BookOpen, Calendar, ChevronDown, RotateCcw, ExternalLink } from "lucide-react";
import { Link, useSearch, useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import { usePlayer } from "@/context/player-context";
import tspLogo from "@assets/tsp/tsp-logo.jpeg";
import { decodeHtml } from "@/lib/decode-html";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function daysInMonth(month: number): number {
  return new Date(2000, month, 0).getDate();
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function yearsAgo(year: number): number {
  return new Date().getFullYear() - year;
}

function HistoryTile({ ep, onPlay }: { ep: ThisDayEpisode; onPlay: (ep: ThisDayEpisode) => void }) {
  const year = new Date(ep.pubDate).getUTCFullYear();
  const ago = yearsAgo(year);
  const [imgError, setImgError] = useState(false);
  const [artworkError, setArtworkError] = useState(false);

  const bgImage = !imgError && ep.historyImageUrl
    ? ep.historyImageUrl
    : (!artworkError && ep.artworkUrl ? ep.artworkUrl : null);

  const bullets = ep.bulletPoints?.filter(Boolean) ?? [];
  const sources = ep.sourceLinks?.filter(s => s.label && s.url) ?? [];

  return (
    <div className="snap-start shrink-0 w-72 md:w-auto relative rounded-xl overflow-hidden border border-white/10 group flex flex-col" style={{ height: "380px" }}>
      {/* Background image layer */}
      {bgImage ? (
        <div className="absolute inset-0">
          <img
            src={ep.historyImageUrl && !imgError ? ep.historyImageUrl : (ep.artworkUrl ?? "")}
            alt=""
            className="w-full h-full object-cover"
            onError={() => {
              if (!imgError && ep.historyImageUrl) {
                setImgError(true);
              } else {
                setArtworkError(true);
              }
            }}
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={tspLogo}
            alt=""
            className="w-24 h-24 object-cover rounded-xl opacity-10"
          />
        </div>
      )}

      {/* Dark gradient overlay — aggressive for WCAG AA contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/50" />

      {/* Content stacked above overlay */}
      <div className="relative flex flex-col h-full p-4 gap-2">

        {/* Year + episode badge */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div>
            <span className="text-4xl font-serif font-bold text-[#D9A066] leading-none drop-shadow-lg">
              {year}
            </span>
            {ago >= 1 && (
              <p className="text-xs text-[#D9A066]/70 font-medium mt-0.5">
                {ago === 1 ? "1 year ago" : `${ago} years ago`}
              </p>
            )}
          </div>
          {ep.episodeNumber != null && (
            <span className="text-xs font-bold uppercase tracking-widest text-white/50 bg-black/40 border border-white/15 px-2 py-0.5 rounded-full shrink-0 backdrop-blur-sm">
              EP {ep.episodeNumber}
            </span>
          )}
        </div>

        {/* Pull-quote — headline lesson */}
        {ep.lessonQuote ? (
          <blockquote className="text-sm font-semibold text-white leading-snug italic drop-shadow-md shrink-0 line-clamp-3 border-l-2 border-[#D9A066]/60 pl-2">
            {ep.lessonQuote}
          </blockquote>
        ) : (
          <Link href={`/episodes/${ep.slug}`}>
            <h3 className="text-sm font-semibold text-white leading-snug line-clamp-3 drop-shadow-md shrink-0">
              {decodeHtml(ep.title)}
            </h3>
          </Link>
        )}

        {/* Accessible title always present even when quote is shown */}
        {ep.lessonQuote && (
          <Link href={`/episodes/${ep.slug}`}>
            <h3 className="text-xs text-white/50 leading-snug line-clamp-2 hover:text-white/80 transition-colors">
              {decodeHtml(ep.title)}
            </h3>
          </Link>
        )}

        {/* Bullet points */}
        {bullets.length > 0 && (
          <ul className="flex flex-col gap-1 overflow-hidden min-h-0 shrink-[2]">
            {bullets.slice(0, 4).map((b, i) => (
              <li key={i} className="flex items-start gap-1.5 min-w-0">
                <span className="text-[#D9A066]/70 mt-0.5 shrink-0 text-xs">▸</span>
                <span className="text-xs text-white/75 leading-snug line-clamp-2">{b}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-0" />

        {/* Threads to pull — source links */}
        {sources.length > 0 && (
          <div className="shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#D9A066]/60 mb-1.5">
              Threads to pull
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sources.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-white/70 bg-white/10 hover:bg-white/20 hover:text-white border border-white/15 rounded-full px-2 py-0.5 transition-colors backdrop-blur-sm"
                >
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  <span className="line-clamp-1 max-w-[100px]">{s.label}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Play button */}
        <div className="shrink-0 pt-1">
          <button
            onClick={() => onPlay(ep)}
            disabled={!ep.audioUrl}
            className="flex items-center gap-2 bg-[#D9A066] hover:bg-[#c48a4a] disabled:opacity-40 disabled:cursor-not-allowed text-[#1A2E1F] px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-black/50 w-full justify-center"
          >
            <Play className="w-3.5 h-3.5 fill-current shrink-0" />
            {ep.historyTimestamp && ep.historyTimestamp > 0
              ? `Play History @ ${formatTimestamp(ep.historyTimestamp)}`
              : "Play Episode"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ThisDayInHistory() {
  const today = new Date();
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const { load, seek, audioRef } = usePlayer();

  const params = new URLSearchParams(searchString);
  const initMonth = params.has("month") ? Number(params.get("month")) : today.getMonth() + 1;
  const initDay = params.has("day") ? Number(params.get("day")) : today.getDate();

  const [selectedMonth, setSelectedMonth] = useState(initMonth);
  const [selectedDay, setSelectedDay] = useState(initDay);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftMonth, setDraftMonth] = useState(initMonth);
  const [draftDay, setDraftDay] = useState(initDay);
  const pickerRef = useRef<HTMLDivElement>(null);

  const isToday = selectedMonth === today.getMonth() + 1 && selectedDay === today.getDate();
  const dateLabel = `${MONTHS[selectedMonth - 1]} ${selectedDay}`;

  const { data: episodes, isLoading } = useGetThisDayEpisodes(
    { month: selectedMonth, day: selectedDay },
    { query: { queryKey: ["this-day", selectedMonth, selectedDay] } },
  );

  useEffect(() => {
    if (!pickerOpen) return;
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [pickerOpen]);

  const openPicker = () => {
    setDraftMonth(selectedMonth);
    setDraftDay(selectedDay);
    setPickerOpen(true);
  };

  const applyDate = () => {
    const maxDay = daysInMonth(draftMonth);
    const clampedDay = Math.min(draftDay, maxDay);
    setSelectedMonth(draftMonth);
    setSelectedDay(clampedDay);
    setPickerOpen(false);

    const qp = new URLSearchParams();
    if (draftMonth !== today.getMonth() + 1 || clampedDay !== today.getDate()) {
      qp.set("month", String(draftMonth));
      qp.set("day", String(clampedDay));
    }
    const qs = qp.toString();
    setLocation(qs ? `/?${qs}` : "/", { replace: true });
  };

  const resetToToday = () => {
    const m = today.getMonth() + 1;
    const d = today.getDate();
    setSelectedMonth(m);
    setSelectedDay(d);
    setDraftMonth(m);
    setDraftDay(d);
    setPickerOpen(false);
    setLocation("/", { replace: true });
  };

  const handlePlay = (ep: ThisDayEpisode) => {
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
        audio.addEventListener("canplay", () => seek(seekTo), { once: true });
      }
    }
  };

  const dayCount = daysInMonth(draftMonth);

  return (
    <section className="bg-gradient-to-br from-[#1A2E1F] via-[#1e3428] to-[#162a1f] border-b border-white/10 text-white">
      <div className="container mx-auto px-4 md:px-6 py-10 md:py-14">
        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D9A066]/20 border border-[#D9A066]/40 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-[#D9A066]" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#D9A066]/80 mb-0.5">
                This Day in History
              </div>

              <div className="relative" ref={pickerRef}>
                <button
                  onClick={openPicker}
                  className="flex items-center gap-2 group"
                  aria-label="Change date"
                >
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-white leading-none group-hover:text-[#D9A066] transition-colors">
                    {dateLabel}
                  </h2>
                  <ChevronDown
                    className={`w-5 h-5 text-[#D9A066]/60 transition-all group-hover:text-[#D9A066] ${pickerOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {!isToday && (
                  <button
                    onClick={resetToToday}
                    className="flex items-center gap-1 mt-1 text-xs text-[#D9A066]/60 hover:text-[#D9A066] transition-colors"
                    aria-label="Back to today"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Back to today
                  </button>
                )}

                {pickerOpen && (
                  <div className="absolute top-full left-0 mt-2 z-50 bg-[#162a1f] border border-white/15 rounded-xl shadow-2xl shadow-black/60 p-4 min-w-[260px]">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#D9A066]/70 mb-3">
                      Browse any date
                    </p>
                    <div className="flex gap-3 mb-4">
                      <div className="flex-1">
                        <label className="block text-xs text-white/50 mb-1 font-medium">
                          Month
                        </label>
                        <select
                          value={draftMonth}
                          onChange={(e) => {
                            const m = Number(e.target.value);
                            setDraftMonth(m);
                            const max = daysInMonth(m);
                            if (draftDay > max) setDraftDay(max);
                          }}
                          className="w-full bg-white/5 border border-white/15 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#D9A066]/50"
                        >
                          {MONTHS.map((name, i) => (
                            <option key={name} value={i + 1} className="bg-[#1e3428]">
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-white/50 mb-1 font-medium">
                          Day
                        </label>
                        <select
                          value={draftDay}
                          onChange={(e) => setDraftDay(Number(e.target.value))}
                          className="w-full bg-white/5 border border-white/15 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#D9A066]/50"
                        >
                          {Array.from({ length: dayCount }, (_, i) => i + 1).map((d) => (
                            <option key={d} value={d} className="bg-[#1e3428]">
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={applyDate}
                        className="flex-1 bg-[#D9A066] hover:bg-[#c48a4a] text-[#1A2E1F] text-sm font-bold py-2 rounded-lg transition-colors"
                      >
                        Show episodes
                      </button>
                      <button
                        onClick={resetToToday}
                        className="px-3 text-sm text-white/60 hover:text-white border border-white/15 rounded-lg transition-colors"
                      >
                        Today
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="text-white/50 text-sm md:ml-auto md:text-right max-w-sm">
            {isToday
              ? "Every episode Jack published on this date — and what happened in history that day."
              : `Episodes Jack published on ${MONTHS[selectedMonth - 1]} ${selectedDay} — across all years.`}
          </p>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="snap-start shrink-0 w-72 rounded-xl border border-white/10 animate-pulse bg-white/5"
                style={{ height: "380px" }}
              />
            ))}
          </div>
        ) : !episodes || episodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <BookOpen className="w-10 h-10 text-[#D9A066]/40" />
            <p className="text-white/50 font-medium">
              No episodes published on {MONTHS[selectedMonth - 1]} {selectedDay}
              {isToday ? " — check back tomorrow." : "."}
            </p>
            {!isToday && (
              <button
                onClick={resetToToday}
                className="text-sm font-semibold text-[#D9A066]/80 hover:text-[#D9A066] transition-colors underline underline-offset-4"
              >
                Back to today →
              </button>
            )}
            <Link
              href="/series/history"
              className="text-sm font-semibold text-[#D9A066]/80 hover:text-[#D9A066] transition-colors underline underline-offset-4"
            >
              Browse the full History series →
            </Link>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:overflow-x-visible">
            {[...episodes]
              .sort((a, b) => new Date(b.pubDate).getUTCFullYear() - new Date(a.pubDate).getUTCFullYear())
              .map((ep) => (
                <HistoryTile key={ep.slug} ep={ep} onPlay={handlePlay} />
              ))}
          </div>
        )}
      </div>
    </section>
  );
}
