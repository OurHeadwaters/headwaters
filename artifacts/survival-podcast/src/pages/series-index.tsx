import { useListSeries } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ChevronRight, Layers, AlertTriangle } from "lucide-react";
import { getSeriesTheme } from "@/lib/seriesTheme";
import { useQuery } from "@tanstack/react-query";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

function useConsistencyWarning() {
  return useQuery({
    queryKey: ["series-consistency-banner"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/series/consistency"));
      if (!res.ok) return null;
      const data = await res.json();
      return data as { allOk: boolean; series: { status: string }[] };
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function SeriesIndex() {
  const { data: seriesList, isLoading, isError } = useListSeries({ orderBy: "episodeCount:desc" });
  const { data: consistency } = useConsistencyWarning();
  const warningCount = consistency?.series.filter((s) => s.status === "warning").length ?? 0;

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 flex flex-col gap-10">
      {warningCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
          <p className="flex-1">
            <span className="font-semibold">{warningCount} series {warningCount === 1 ? "has" : "have"} count mismatches</span>
            {" — "}episode totals may be inaccurate.{" "}
            <Link href="/admin/series-health" className="underline hover:text-amber-900 font-medium">
              View details →
            </Link>
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          <Layers className="w-4 h-4" />
          <span>Recurring Series</span>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground">
          Episode Series
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          Jack's content has recurring series — themed collections you can follow from start to finish or dip into anywhere.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="py-20 text-center bg-card border border-border rounded-xl">
          <p className="text-destructive font-semibold">Couldn't load series right now. Try again in a moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {seriesList?.map((series) => {
            const { card: colorClass, badge: badgeClass } = getSeriesTheme(series.slug);
            return (
              <Link
                key={series.slug}
                href={`/series/${series.slug}`}
                className={`group relative flex flex-col gap-4 p-7 rounded-2xl border bg-gradient-to-br ${colorClass} hover:scale-[1.01] transition-all duration-300 hover:shadow-lg hover:shadow-black/20 overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                {series.sampleArtworkUrl && (
                  <div className="absolute right-0 top-0 bottom-0 w-32 opacity-10 overflow-hidden pointer-events-none">
                    <img
                      src={series.sampleArtworkUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-card to-transparent" />
                  </div>
                )}

                <div className="flex items-start justify-between gap-4 relative">
                  <div className="text-4xl leading-none">{series.iconEmoji}</div>
                  <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${badgeClass}`}>
                    {series.episodeCount} episode{series.episodeCount !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex flex-col gap-2 relative">
                  <h2 className="font-serif text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {series.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {series.description}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-sm font-semibold text-primary/80 group-hover:text-primary transition-colors relative mt-auto pt-2">
                  Browse episodes
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
