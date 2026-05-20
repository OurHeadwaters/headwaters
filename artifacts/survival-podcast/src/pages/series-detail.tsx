import { useRoute, Link } from "wouter";
import {
  useGetSeriesEpisodes,
  getGetSeriesEpisodesQueryKey,
  type Episode,
} from "@workspace/api-client-react";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Layers, PlayCircle, Calendar, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { EpisodeCard } from "@/components/episode-card";
import { formatDuration } from "@/components/episode-card";
import tspLogo from "@assets/tsp/tsp-logo.jpeg";

const LIMIT = 20;
const HISTORY_LIMIT = 500;

function HistoryTimeline({ episodes }: { episodes: Episode[] }) {
  const byDecade = new Map<string, Episode[]>();
  for (const ep of episodes) {
    const year = new Date(ep.pubDate).getFullYear();
    const decade = `${Math.floor(year / 10) * 10}s`;
    if (!byDecade.has(decade)) byDecade.set(decade, []);
    byDecade.get(decade)!.push(ep);
  }
  const decades = [...byDecade.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="relative flex flex-col gap-0">
      {/* Vertical spine */}
      <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-500/60 via-indigo-400/30 to-transparent" aria-hidden="true" />

      {decades.map(([decade, decEps]) => (
        <div key={decade} className="flex flex-col gap-0">
          {/* Decade marker */}
          <div className="flex items-center gap-4 mb-3 mt-6 first:mt-0">
            <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-indigo-900/80 border-2 border-indigo-500/60 shadow-lg shadow-indigo-900/40 shrink-0">
              <span className="text-indigo-200 text-[10px] font-black uppercase tracking-widest leading-none text-center">{decade}</span>
            </div>
            <div className="h-px flex-1 bg-indigo-500/20" />
          </div>

          {decEps.map((ep, idx) => {
            const pubDate = parseISO(ep.pubDate);
            return (
              <div key={ep.guid} className="flex items-start gap-4 pl-0 pb-4 relative">
                {/* Timeline dot */}
                <div className="relative z-10 flex items-center justify-center w-12 shrink-0 pt-3">
                  <div className="w-3 h-3 rounded-full bg-indigo-400/80 border-2 border-indigo-600/60 shadow-sm" />
                </div>

                {/* Card */}
                <Link
                  href={`/episodes/${ep.slug}`}
                  className="group flex-1 flex gap-3 items-start bg-card border border-border rounded-xl p-4 hover:border-indigo-500/40 hover:shadow-md hover:shadow-indigo-900/20 transition-all duration-200 ml-0"
                >
                  <img
                    src={ep.artworkUrl || tspLogo}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover border border-border/50 shrink-0"
                  />
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(pubDate, "MMM d, yyyy")}
                      </span>
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
                  <PlayCircle className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0 mt-1" />
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
          <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wider">
            {data?.total} episode{data?.total !== 1 ? "s" : ""}
          </span>
          {isHistory && (
            <span className="bg-indigo-900/30 text-indigo-300 border border-indigo-700/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Timeline View
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Episodes */}
      {isHistory ? (
        <HistoryTimeline episodes={data?.items ?? []} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.items.map((ep) => (
              <EpisodeCard key={ep.guid} episode={ep} />
            ))}
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
