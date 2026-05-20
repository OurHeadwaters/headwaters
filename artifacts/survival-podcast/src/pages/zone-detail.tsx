import { Link, useRoute } from "wouter";
import { useGetZoneEpisodes, getGetZoneEpisodesQueryKey } from "@workspace/api-client-react";
import { keepPreviousData } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Mic, FileText, PlaySquare, Clock, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { formatDuration } from "../components/episode-card";

const PAGE_SIZE = 24;

function formatDur(secs: number | null | undefined): string | null {
  if (!secs) return null;
  return formatDuration(secs);
}

type ZoneItem = {
  id: number; source: string; kind: string; slug: string;
  title: string; link: string; summary: string | null;
  publishedAt: string; episodeNumber: number | null;
  durationSeconds: number | null; audioUrl: string | null;
  artworkUrl: string | null; categories: string[]; tags: string[];
  zoneScore: number;
};

function KindIcon({ kind }: { kind: string }) {
  if (kind === "audio") return <Mic className="w-4 h-4" />;
  if (kind === "video") return <PlaySquare className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
}

function KindBadge({ kind }: { kind: string }) {
  const cls =
    kind === "audio"
      ? "bg-primary text-primary-foreground"
      : kind === "video"
      ? "bg-destructive text-destructive-foreground"
      : "bg-accent text-accent-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${cls}`}
    >
      <KindIcon kind={kind} />
      {kind}
    </span>
  );
}

function EpisodeCard({ item, zoneColor }: { item: ZoneItem; zoneColor: string }) {
  const href =
    item.source === "ulg" || item.kind === "audio" || item.kind === "article"
      ? `/library/${item.slug}`
      : `/episodes/${item.slug}`;
  return (
    <Link
      href={href}
      className="group flex flex-col bg-card border border-border rounded-lg overflow-hidden hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30 transition-all duration-200"
    >
      {/* Artwork */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {item.artworkUrl ? (
          <img
            src={item.artworkUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: zoneColor + "22" }}
          >
            <KindIcon kind={item.kind} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute top-2 left-2">
          <KindBadge kind={item.kind} />
        </div>
        {item.episodeNumber && (
          <div className="absolute bottom-2 left-2">
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-sm">
              Ep {item.episodeNumber}
            </span>
          </div>
        )}
      </div>
      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2 font-medium">
          <span>{format(parseISO(item.publishedAt), "MMM d, yyyy")}</span>
          {item.durationSeconds && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDur(item.durationSeconds)}
              </span>
            </>
          )}
        </div>
        <h3 className="font-serif font-bold text-sm leading-snug mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-3">
          {item.title}
        </h3>
        {item.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
            {item.summary.replace(/^https?:\/\/\S+\n\n?/, "").slice(0, 160)}
          </p>
        )}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-border/50">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] uppercase tracking-wider font-semibold text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded-sm border border-primary/10"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function ZoneDetailPage() {
  const [, params] = useRoute("/zones/:slug");
  const slug = params?.slug ?? "";

  const searchParams = new URLSearchParams(window.location.search);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const queryParams = { limit: PAGE_SIZE, offset, excludeSeries: true };
  const { data, isLoading, isError, isFetching } = useGetZoneEpisodes(
    slug,
    queryParams,
    {
      query: {
        enabled: !!slug,
        queryKey: getGetZoneEpisodesQueryKey(slug, queryParams),
        placeholderData: keepPreviousData,
      },
    },
  );

  const zone = data?.zone;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function navigate(p: number) {
    const qs = new URLSearchParams(window.location.search);
    qs.set("page", String(p));
    window.history.pushState({}, "", `${window.location.pathname}?${qs.toString()}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading zone…</p>
        </div>
      </div>
    );
  }

  if (isError || !zone) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-serif font-bold mb-2">Zone not found</p>
          <Link href="/zones" className="text-sm text-primary hover:underline">
            ← Back to all zones
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div
        className="border-b border-border relative overflow-hidden"
        style={{ backgroundColor: zone.color + "18" }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 80% 50%, ${zone.color} 0%, transparent 60%)`,
          }}
        />
        <div className="max-w-5xl mx-auto px-6 py-12 relative">
          <Link
            href="/zones"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            All Zones
          </Link>

          <div
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border-2 mb-3"
            style={{ borderColor: zone.color, color: zone.color }}
          >
            Zone {zone.number}
          </div>

          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-2">
            {zone.name}
          </h1>
          <p className="text-base text-muted-foreground font-medium mb-4">{zone.subtitle}</p>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed mb-6">
            {zone.description}
          </p>
          <blockquote
            className="border-l-2 pl-4 text-sm italic text-muted-foreground max-w-xl"
            style={{ borderColor: zone.color }}
          >
            {zone.philosophy}
          </blockquote>

          <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{total.toLocaleString()}</span>
            <span>standalone episodes &amp; articles</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl font-bold text-foreground">
            Most relevant to this zone
          </h2>
          <span className="text-sm text-muted-foreground">
            {total.toLocaleString()} items · sorted by relevance
          </span>
        </div>

        {/* Episode grid */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 transition-opacity duration-200 ${isFetching ? "opacity-60" : "opacity-100"}`}
        >
          {items.map((item) => (
            <EpisodeCard key={item.id} item={item as ZoneItem} zoneColor={zone.color} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => navigate(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => navigate(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Library link */}
        <div className="mt-10 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Want to include series episodes or search across all zones?
          </p>
          <Link
            href="/library"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Open the full library →
          </Link>
        </div>
      </div>
    </div>
  );
}
