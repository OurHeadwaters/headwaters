import { useRoute, Link } from "wouter";
import {
  useGetSeriesEpisodes,
  getGetSeriesEpisodesQueryKey,
  type Episode,
} from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Layers, PlayCircle, Calendar, Clock, RotateCcw, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { EpisodeCard } from "@/components/episode-card";
import { formatDuration } from "@/components/episode-card";
import { getMostRecentSlugAmong, getProgress, isCompleted } from "@/lib/playback-progress";
import { getSeriesTheme, type SeriesTheme } from "@/lib/seriesTheme";
import tspLogo from "@assets/tsp/tsp-logo.jpeg";

const LIMIT = 20;
const HISTORY_LIMIT = 500;

function useContinueSlug(episodes: Episode[]): string | null {
  const [continueSlug, setContinueSlug] = useState<string | null>(null);

  useEffect(() => {
    if (episodes.length === 0) return;
    const slugs = episodes.map((ep) => ep.slug);
    setContinueSlug(getMostRecentSlugAmong(slugs));
  }, [episodes]);

  return continueSlug;
}

function ContinueBadge({ slug }: { slug: string }) {
  const entry = getProgress(slug);
  const position = entry?.position ?? 0;
  const dur = entry?.duration ?? 0;
  const pct = dur > 0 ? Math.round((position / dur) * 100) : 0;

  return (
    <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-t-xl pointer-events-none">
      <div className="flex items-center gap-1.5">
        <RotateCcw className="w-3 h-3 shrink-0" />
        <span className="text-[11px] font-bold uppercase tracking-wider">Continue</span>
        {position > 0 && (
          <span className="text-[11px] font-medium opacity-80">— {formatDuration(position)} in</span>
        )}
      </div>
      {pct > 0 && (
        <span className="text-[10px] font-bold tabular-nums opacity-80">{pct}%</span>
      )}
    </div>
  );
}

function CompletedBadge() {
  return (
    <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-2 bg-emerald-700 text-white px-3 py-1.5 rounded-t-xl pointer-events-none">
      <CheckCircle2 className="w-3 h-3 shrink-0" />
      <span className="text-[11px] font-bold uppercase tracking-wider">Played</span>
    </div>
  );
}

function HistoryTimeline({ episodes, continueSlug, theme }: { episodes: Episode[]; continueSlug: string | null; theme: SeriesTheme }) {
  const byDecade = new Map<string, { ep: Episode; position: number }[]>();
  episodes.forEach((ep, idx) => {
    const year = new Date(ep.pubDate).getFullYear();
    const decade = `${Math.floor(year / 10) * 10}s`;
    if (!byDecade.has(decade)) byDecade.set(decade, []);
    byDecade.get(decade)!.push({ ep, position: idx + 1 });
  });
  const decades = [...byDecade.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="relative flex flex-col gap-0">
      {/* Vertical spine */}
      <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-500/60 via-indigo-400/30 to-transparent" aria-hidden="true" />

      {decades.map(([decade, decItems]) => (
        <div key={decade} className="flex flex-col gap-0">
          {/* Decade marker */}
          <div className="flex items-center gap-4 mb-3 mt-6 first:mt-0">
            <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-indigo-900/80 border-2 border-indigo-500/60 shadow-lg shadow-indigo-900/40 shrink-0">
              <span className="text-indigo-200 text-[10px] font-black uppercase tracking-widest leading-none text-center">{decade}</span>
            </div>
            <div className="h-px flex-1 bg-indigo-500/20" />
          </div>

          {decItems.map(({ ep, position }) => {
            const pubDate = parseISO(ep.pubDate);
            const isContinue = ep.slug === continueSlug;
            const done = isCompleted(ep.slug);
            return (
              <div key={ep.guid} className="flex items-start gap-4 pl-0 pb-4 relative">
                {/* Timeline dot */}
                <div className="relative z-10 flex items-center justify-center w-12 shrink-0 pt-3">
                  <div className={`w-3 h-3 rounded-full border-2 shadow-sm ${done ? "bg-emerald-500 border-emerald-700/60" : isContinue ? "bg-primary border-primary/60 scale-125" : "bg-indigo-400/80 border-indigo-600/60"}`} />
                </div>

                {/* Card */}
                <Link
                  href={`/episodes/${ep.slug}`}
                  className={`group flex-1 flex gap-3 items-start bg-card border rounded-xl p-4 hover:shadow-md transition-all duration-200 ml-0 ${done ? "border-emerald-700/30 ring-1 ring-emerald-700/20 hover:border-emerald-600/40" : isContinue ? "border-primary/40 ring-1 ring-primary/20 hover:border-primary/60" : "border-border hover:border-indigo-500/40 hover:shadow-indigo-900/20"}`}
                >
                  <img
                    src={ep.artworkUrl || tspLogo}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover border border-border/50 shrink-0"
                  />
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
                      {done && (
                        <span className="flex items-center gap-1 bg-emerald-900/30 text-emerald-400 border border-emerald-700/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Played
                        </span>
                      )}
                      {isContinue && !done && (
                        <span className="flex items-center gap-1 bg-primary/15 text-primary border border-primary/25 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                          <RotateCcw className="w-2.5 h-2.5" />
                          Continue
                        </span>
                      )}
                      <span className={`${theme.badge} px-2 py-0.5 rounded text-[10px] font-bold tabular-nums`}>
                        #{position}
                      </span>
                      {pubDate.getTime() >= 86_400_000 && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(pubDate, "MMM d, yyyy")}
                        </span>
                      )}
                      {ep.durationSeconds && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(ep.durationSeconds)}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {ep.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{ep.summary}</p>
                  </div>
                  <PlayCircle className={`w-5 h-5 transition-colors shrink-0 mt-1 ${isContinue ? "text-primary" : "text-muted-foreground/50 group-hover:text-primary"}`} />
                </Link>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function SeriesDetail() {
  const [, params] = useRoute("/series/:slug");
  const slug = params?.slug || "";
  const isHistory = slug === "history";
  const [page, setPage] = useState(1);
  const offset = isHistory ? 0 : (page - 1) * LIMIT;
  const limit = isHistory ? HISTORY_LIMIT : LIMIT;

  const { data, isLoading, isError } = useGetSeriesEpisodes(
    slug,
    { limit, offset },
    {
      query: {
        enabled: !!slug,
        queryKey: getGetSeriesEpisodesQueryKey(slug, { limit, offset }),
      },
    },
  );

  const series = data?.series;
  const totalPages = data && !isHistory ? Math.ceil(data.total / LIMIT) : 0;
  const episodes = data?.items ?? [];
  const continueSlug = useContinueSlug(episodes);
  const theme = getSeriesTheme(slug);


  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 flex flex-col gap-8 animate-pulse">
        <div className="h-6 w-24 bg-muted rounded" />
        <div className="h-20 w-2/3 bg-muted rounded" />
        <div className="h-10 w-1/3 bg-muted rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || (!isLoading && !data)) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-24 text-center">
        <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Series Not Found</h2>
        <p className="text-muted-foreground mb-8">That series doesn't exist or couldn't be loaded.</p>
        <Link href="/series" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
          <ChevronLeft className="w-4 h-4" /> Back to all series
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 flex flex-col gap-8">
      <Link
        href="/series"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> All Series
      </Link>

      {/* Series hero */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-5xl leading-none">{series?.iconEmoji}</span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              Series
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-tight">
              {series?.title}
            </h1>
          </div>
        </div>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">{series?.description}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
          <span className={`${theme.badge} px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wider`}>
            {data?.total} episode{data?.total !== 1 ? "s" : ""}
          </span>
          {isHistory && (
            <span className={`${theme.badge} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`}>
              Timeline View
            </span>
          )}
          {continueSlug && (
            <span className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <RotateCcw className="w-3 h-3" />
              In Progress
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Episodes */}
      {isHistory ? (
        <HistoryTimeline episodes={episodes} continueSlug={continueSlug} theme={theme} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {episodes.map((ep, idx) => {
              const position = offset + idx + 1;
              const total = data!.total;
              const isContinue = ep.slug === continueSlug;
              const done = isCompleted(ep.slug);
              return (
                <div key={ep.guid} className="relative">
                  {isContinue && !done && <ContinueBadge slug={ep.slug} />}
                  {done && <CompletedBadge />}
                  <div className={isContinue && !done ? "ring-2 ring-primary/30 rounded-xl" : done ? "ring-1 ring-emerald-700/30 rounded-xl" : ""}>
                    <EpisodeCard
                      episode={ep}
                      seriesPosition={position}
                      seriesTotal={total}
                      seriesSlug={slug}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8 border-t border-border/50">
              <button
                onClick={() => {
                  setPage((p) => p - 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={page <= 1}
                className="p-2 border border-border rounded-md text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1 mx-4">
                <span className="text-sm font-medium text-foreground">Page {page}</span>
                <span className="text-sm text-muted-foreground">of {totalPages}</span>
              </div>
              <button
                onClick={() => {
                  setPage((p) => p + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={page >= totalPages}
                className="p-2 border border-border rounded-md text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
