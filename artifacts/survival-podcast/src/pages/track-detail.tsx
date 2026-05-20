import { Link, useRoute } from "wouter";
import { useGetTrackEpisodes } from "@/hooks/use-tracks";
import { OdysseyBridge } from "@/components/odyssey-bridge";
import { keepPreviousData } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  Mic,
  FileText,
  PlaySquare,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { formatDuration } from "@/components/episode-card";

const PAGE_SIZE = 24;

const ZONE_LABELS = ["Zone 0", "Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5"];

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

type TrackItemCardProps = {
  item: {
    id: number;
    source: string;
    kind: string;
    slug: string;
    title: string;
    summary: string | null;
    publishedAt: string;
    episodeNumber: number | null;
    durationSeconds: number | null;
    artworkUrl: string | null;
    categories: string[];
    tags: string[];
    trackScore: number;
  };
  trackColor: string;
  index: number;
  globalOffset: number;
};

function TrackItemCard({ item, trackColor, index, globalOffset }: TrackItemCardProps) {
  const position = globalOffset + index + 1;
  const href =
    item.source === "ulg" || item.kind === "article"
      ? `/library/${item.slug}`
      : item.kind === "audio"
        ? `/episodes/${item.slug}`
        : `/library/${item.slug}`;

  return (
    <Link
      href={href}
      className="group flex gap-4 p-4 rounded-lg border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200"
    >
      {/* Position number */}
      <div
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
        style={{
          color: trackColor,
          background: trackColor + "18",
          border: `1px solid ${trackColor}33`,
        }}
      >
        {position}
      </div>

      {/* Artwork */}
      {item.artworkUrl ? (
        <img
          src={item.artworkUrl}
          alt={item.title}
          className="shrink-0 w-14 h-14 rounded-md object-cover"
        />
      ) : (
        <div
          className="shrink-0 w-14 h-14 rounded-md flex items-center justify-center"
          style={{ background: trackColor + "18" }}
        >
          <KindIcon kind={item.kind} />
        </div>
      )}

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <KindBadge kind={item.kind} />
          {item.episodeNumber && (
            <span className="text-[10px] font-bold text-muted-foreground">
              Ep {item.episodeNumber}
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">
            {format(parseISO(item.publishedAt), "MMM d, yyyy")}
          </span>
          {item.durationSeconds && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(item.durationSeconds)}
            </span>
          )}
        </div>
        <h3 className="font-serif font-bold text-sm leading-snug mb-1 text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {item.title}
        </h3>
        {item.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {item.summary.replace(/^https?:\/\/\S+\n\n?/, "").slice(0, 180)}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function TrackDetailPage() {
  const [, params] = useRoute("/tracks/:slug");
  const slug = params?.slug ?? "";

  const searchParams = new URLSearchParams(window.location.search);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const queryParams = { limit: PAGE_SIZE, offset };
  const { data, isLoading, isError, isFetching } = useGetTrackEpisodes(slug, queryParams);

  const track = data?.track;
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
          <p className="text-sm">Loading track…</p>
        </div>
      </div>
    );
  }

  if (isError || !track) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-serif font-bold mb-2">Track not found</p>
          <Link href="/tracks" className="text-sm text-primary hover:underline">
            ← Back to all tracks
          </Link>
        </div>
      </div>
    );
  }

  const isLastPage = page >= totalPages;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div
        className="border-b border-border relative overflow-hidden"
        style={{ backgroundColor: track.color + "14" }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 80% 50%, ${track.color} 0%, transparent 60%)`,
          }}
        />
        <div className="max-w-4xl mx-auto px-6 py-12 relative">
          <Link
            href="/tracks"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            All Learning Tracks
          </Link>

          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl leading-none">{track.icon}</span>
            <div
              className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border-2"
              style={{ borderColor: track.color, color: track.color }}
            >
              {ZONE_LABELS[track.zoneNumber]} · Learning Track
            </div>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-2">
            {track.title}
          </h1>
          <p className="text-base text-muted-foreground font-medium mb-4">{track.subtitle}</p>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed mb-8">
            {track.description}
          </p>

          {/* What you'll know */}
          <div
            className="rounded-xl p-5 max-w-2xl"
            style={{
              background: track.color + "12",
              border: `1px solid ${track.color}30`,
            }}
          >
            <div
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: track.color }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              What you'll know by the end
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {track.whatYouWillKnow}
            </p>
          </div>

          <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{total.toLocaleString()}</span>
            <span>episodes &amp; resources in this track</span>
          </div>
        </div>
      </div>

      {/* Episode list */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl font-bold text-foreground">
            The track — oldest to newest
          </h2>
          {isFetching && (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        <div
          className={`flex flex-col gap-3 transition-opacity duration-200 ${isFetching ? "opacity-60" : "opacity-100"}`}
        >
          {items.map((item, i) => (
            <TrackItemCard
              key={item.id}
              item={item}
              trackColor={track.color}
              index={i}
              globalOffset={offset}
            />
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

        {/* Odyssey bridge — shown at the end of the last page */}
        {(isLastPage || totalPages === 0) && (
          <div className="mt-12 pt-10 border-t border-border">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                You've reached the end of this track
              </p>
              <h3 className="font-serif text-xl font-bold text-foreground">
                What happens after the archive?
              </h3>
            </div>
            <OdysseyBridge variant="full" />
          </div>
        )}

        {/* Always-visible compact bridge for deeper pages */}
        {!isLastPage && totalPages > 1 && (
          <div className="mt-10 pt-8 border-t border-border">
            <OdysseyBridge variant="compact" />
          </div>
        )}
      </div>
    </div>
  );
}
