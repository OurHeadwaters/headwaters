import { useState, useMemo } from "react";
import { useListEpisodes } from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
import { BookOpen, Calendar, Search, Clock, History } from "lucide-react";
import { Link } from "wouter";
import { HistorySegmentPlayer } from "@/components/history-segment-player";
import { decodeHtml } from "@/lib/decode-html";
import tspLogo from "@assets/tsp/tsp-logo.jpeg";
import type { HistorySegment } from "@workspace/api-client-react";

const PAGE_SIZE = 24;

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useListEpisodes(
    { hasHistory: true, limit: 1000, offset: 0 } as Parameters<typeof useListEpisodes>[0],
    { query: { queryKey: ["episodes", "hasHistory"] } },
  );

  const allItems = data?.items ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return allItems;
    const needle = search.trim().toLowerCase();
    return allItems.filter(
      (ep) =>
        ep.title.toLowerCase().includes(needle) ||
        ((ep as unknown as { historySegment?: HistorySegment | null }).historySegment?.lessonText ?? "")
          .toLowerCase()
          .includes(needle),
    );
  }, [allItems, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(0);
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 md:py-16">
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-300/50 dark:border-amber-700/40 flex items-center justify-center shrink-0">
            <History className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
            This Day in History
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl ml-13 pl-13">
          Every episode where Jack connects a historical event to a present-day lesson. Browse the archive, search by keyword, and listen to just the history segment.
        </p>
      </div>

      <div className="relative mb-8 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search lesson text or episode title…"
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-56 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Unable to load history episodes.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">
            {search ? `No episodes match "${search}"` : "No history episodes found."}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-6">
            {filtered.length} episode{filtered.length !== 1 ? "s" : ""} with a history segment
            {search ? ` matching "${search}"` : ""}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pageItems.map((ep) => {
              const segment = (ep as unknown as { historySegment?: HistorySegment | null }).historySegment;
              const pubDate = new Date(ep.pubDate);
              const validDate = pubDate.getTime() >= 86_400_000;
              const lessonExcerpt = segment?.lessonText
                ? segment.lessonText.slice(0, 200) + (segment.lessonText.length > 200 ? "…" : "")
                : null;

              return (
                <div
                  key={ep.slug}
                  className="flex flex-col gap-4 bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={ep.artworkUrl || tspLogo}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover border border-border/50 shrink-0"
                    />
                    <div className="flex flex-col gap-1 min-w-0">
                      <Link href={`/episodes/${ep.slug}`}>
                        <h3 className="font-serif font-bold text-base leading-snug text-foreground hover:text-primary transition-colors line-clamp-2">
                          {decodeHtml(ep.title)}
                        </h3>
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {ep.episodeNumber && (
                          <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-sm">
                            EP {ep.episodeNumber}
                          </span>
                        )}
                        {validDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(parseISO(ep.pubDate), "MMM d, yyyy")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {lessonExcerpt && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/30 rounded-lg px-4 py-3">
                      <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed italic">
                        "{lessonExcerpt}"
                      </p>
                    </div>
                  )}

                  {segment && ep.audioUrl && segment.startSeconds > 0 ? (
                    <div className="mt-auto pt-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-medium">History Segment</span>
                      </div>
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
                    </div>
                  ) : (
                    <Link
                      href={`/episodes/${ep.slug}`}
                      className="mt-auto pt-1 text-sm text-primary font-semibold hover:underline"
                    >
                      Listen to full episode →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
