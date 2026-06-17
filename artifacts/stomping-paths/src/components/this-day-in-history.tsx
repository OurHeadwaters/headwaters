import { useGetThisDayEpisodes } from "@workspace/api-client-react";
import type { ThisDayEpisode } from "@workspace/api-client-react";
import { BookOpen, Calendar, ChevronDown, RotateCcw, ExternalLink } from "lucide-react";
import { Link, useSearch, useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import { decodeHtml } from "@/lib/decode-html";
import { HistorySegmentPlayer } from "@/components/history-segment-player";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function daysInMonth(month: number): number {
  return new Date(2000, month, 0).getDate();
}

function yearsAgo(year: number): number {
  return new Date().getFullYear() - year;
}

function formatSegmentDuration(startSeconds: number, endSeconds: number): string {
  const durationSecs = Math.max(0, endSeconds - startSeconds);
  const minutes = Math.round(durationSecs / 60);
  if (minutes < 1) return "history segment";
  return `${minutes} min history segment`;
}

/**
 * Derive a tile headline from Jack's lesson text.
 * Extracts the first meaningful sentence when the text is long enough to
 * split; falls back to the episode title when lessonText is absent or short.
 */
function getTileContent(ep: ThisDayEpisode): { headline: string; body: string | null } {
  const lessonText = ep.historySegment?.lessonText?.trim() ?? "";

  if (!lessonText) {
    return { headline: decodeHtml(ep.title), body: null };
  }

  // Try to split at the first sentence boundary when the text is substantive
  const firstSentenceMatch = lessonText.match(/^.{40,200}[.!?]/);
  if (firstSentenceMatch && lessonText.length > firstSentenceMatch[0].length + 30) {
    return { headline: firstSentenceMatch[0], body: lessonText };
  }

  // Short or single sentence: episode title as headline, lessonText as body
  return { headline: decodeHtml(ep.title), body: lessonText };
}

function formatFullDate(pubDate: string): string {
  const d = new Date(pubDate);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function HistoryTile({ ep }: { ep: ThisDayEpisode }) {
  const year = new Date(ep.pubDate).getUTCFullYear();
  const ago = yearsAgo(year);
  const fullDate = formatFullDate(ep.pubDate);
  const { headline, body } = getTileContent(ep);

  const segment = ep.historySegment;
  const hasSegmentPlayer =
    segment != null &&
    segment.startSeconds > 0 &&
    !!ep.audioUrl;

  const segmentDurationLabel =
    hasSegmentPlayer && segment
      ? formatSegmentDuration(segment.startSeconds, segment.endSeconds)
      : null;

  return (
    <div
      className="snap-start shrink-0 w-72 md:w-auto relative rounded-xl overflow-hidden border border-white/10 group flex flex-col"
      style={{ height: "380px" }}
    >
      {/* Wikipedia image — background wash only at low opacity */}
      {ep.historyImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${ep.historyImageUrl})`, opacity: 0.12 }}
          aria-hidden="true"
        />
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/60" />

      {/* Content stacked above overlay */}
      <div className="relative flex flex-col h-full p-4 gap-2">

        {/* Year + episode badge */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div>
            <span className="text-4xl font-serif font-bold text-[#D9A066] leading-none drop-shadow-lg">
              {year}
            </span>
            <p className="text-xs text-[#D9A066]/90 font-medium mt-0.5">
              {fullDate}
            </p>
            {ago >= 1 && (
              <p className="text-xs text-[#D9A066]/60 font-medium">
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

        {/* Headline — Jack's framing of the history topic */}
        <Link href={`/episodes/${ep.slug}`}>
          <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 drop-shadow-md shrink-0 hover:text-[#D9A066]/90 transition-colors">
            {headline}
          </h3>
        </Link>

        {/* Audio segment — visual hero */}
        <div className="shrink-0">
          {segmentDurationLabel && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#D9A066]/60 mb-1.5">
              {segmentDurationLabel}
            </p>
          )}
          {hasSegmentPlayer && segment && ep.audioUrl ? (
            <HistorySegmentPlayer
              audioUrl={ep.audioUrl}
              startSeconds={segment.startSeconds}
              endSeconds={segment.endSeconds}
              episode={{
                slug: ep.slug,
                title: ep.title,
                artworkUrl: ep.artworkUrl,
                episodeNumber: ep.episodeNumber,
                durationSeconds: ep.durationSeconds,
              }}
            />
          ) : (
            <Link
              href={`/episodes/${ep.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D9A066]/80 hover:text-[#D9A066] transition-colors"
            >
              Listen to full episode →
            </Link>
          )}
        </div>

        {/* Lesson text — Jack's words as primary body copy */}
        {body && (
          <p className="text-xs text-white/75 leading-relaxed line-clamp-4 shrink-0">
            {body}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-0" />

        {/* Cross-links: ULG and Expert Council historian */}
        {(ep.ulgCrossLink || ep.expertLink) && (
          <div className="shrink-0 flex flex-col gap-1 border-t border-white/10 pt-2">
            {ep.ulgCrossLink && (
              <a
                href={ep.ulgCrossLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-[#D9A066]/65 hover:text-[#D9A066] transition-colors"
              >
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                <span className="line-clamp-1">
                  <span className="font-semibold">Also on ULG:</span>{" "}
                  {ep.ulgCrossLink.title}
                </span>
              </a>
            )}
            {ep.expertLink && (
              <Link
                href={`/episodes/${ep.expertLink.slug}`}
                className="inline-flex items-center gap-1 text-[10px] text-[#D9A066]/65 hover:text-[#D9A066] transition-colors"
              >
                <span className="line-clamp-1">
                  <span className="font-semibold">Expert perspective:</span>{" "}
                  {ep.expertLink.title}
                </span>
              </Link>
            )}
          </div>
        )}

        {/* Episode link footer */}
        <div className="shrink-0">
          <Link
            href={`/episodes/${ep.slug}`}
            className="text-[10px] text-white/35 hover:text-white/60 transition-colors"
          >
            View full episode →
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Tile shown when an episode's history segment has not yet been detected.
 * Keeps the tile in the grid with a clear "not confirmed" label rather than
 * silently dropping the episode — ensures editors can see what's missing.
 */
function SegmentPendingTile({ ep }: { ep: ThisDayEpisode }) {
  const year = new Date(ep.pubDate).getUTCFullYear();
  const ago = yearsAgo(year);
  const fullDate = formatFullDate(ep.pubDate);

  return (
    <div
      className="snap-start shrink-0 w-72 md:w-auto relative rounded-xl overflow-hidden border border-white/5 group flex flex-col opacity-40"
      style={{ height: "380px" }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/50" />
      <div className="relative flex flex-col h-full p-4 gap-2">
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div>
            <span className="text-4xl font-serif font-bold text-[#D9A066]/50 leading-none">
              {year}
            </span>
            <p className="text-xs text-[#D9A066]/45 font-medium mt-0.5">
              {fullDate}
            </p>
            {ago >= 1 && (
              <p className="text-xs text-[#D9A066]/30 font-medium">
                {ago === 1 ? "1 year ago" : `${ago} years ago`}
              </p>
            )}
          </div>
          {ep.episodeNumber != null && (
            <span className="text-xs font-bold uppercase tracking-widest text-white/30 bg-black/30 border border-white/10 px-2 py-0.5 rounded-full shrink-0">
              EP {ep.episodeNumber}
            </span>
          )}
        </div>
        <Link href={`/episodes/${ep.slug}`}>
          <h3 className="text-sm font-medium text-white/50 leading-snug line-clamp-3">
            {decodeHtml(ep.title)}
          </h3>
        </Link>
        <div className="flex-1" />
        <p className="text-[10px] text-white/30 italic">History segment not yet detected</p>
        <Link
          href={`/episodes/${ep.slug}`}
          className="text-[10px] text-white/30 hover:text-white/50 transition-colors"
        >
          View full episode →
        </Link>
      </div>
    </div>
  );
}

export function ThisDayInHistory() {
  const today = new Date();
  const searchString = useSearch();
  const [, setLocation] = useLocation();

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

  const dayCount = daysInMonth(draftMonth);

  // Separate confirmed-segment episodes from pending ones
  const confirmed = episodes?.filter(
    (ep) => ep.historyTimestamp != null && ep.historyTimestamp > 0,
  ) ?? [];
  const pending = episodes?.filter(
    (ep) => !ep.historyTimestamp || ep.historyTimestamp <= 0,
  ) ?? [];

  // Sort oldest → newest (historical journey flow)
  const sortedConfirmed = [...confirmed].sort(
    (a, b) => new Date(a.pubDate).getUTCFullYear() - new Date(b.pubDate).getUTCFullYear(),
  );
  const sortedPending = [...pending].sort(
    (a, b) => new Date(a.pubDate).getUTCFullYear() - new Date(b.pubDate).getUTCFullYear(),
  );

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
            {sortedConfirmed.map((ep) => (
              <HistoryTile key={ep.slug} ep={ep} />
            ))}
            {sortedPending.map((ep) => (
              <SegmentPendingTile key={ep.slug} ep={ep} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
