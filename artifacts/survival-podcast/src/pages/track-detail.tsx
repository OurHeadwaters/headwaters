import { Link, useRoute } from "wouter";
import { useGetTrackEpisodes } from "@/hooks/use-tracks";
import { useTrackProgress, buildShareUrl, decodeProgressParam } from "@/hooks/use-track-progress";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { OdysseyBridge } from "@/components/odyssey-bridge";
import { keepPreviousData } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useState, useEffect, useRef } from "react";
import {
  Mic,
  FileText,
  PlaySquare,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Share2,
  Download,
  X,
  Check,
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
  isDone: boolean;
  onToggleDone: (id: number) => void;
  isSharedView: boolean;
};

function TrackItemCard({
  item,
  trackColor,
  index,
  globalOffset,
  isDone,
  onToggleDone,
  isSharedView,
}: TrackItemCardProps) {
  const position = globalOffset + index + 1;
  const href =
    item.source === "ulg" || item.kind === "article"
      ? `/library/${item.slug}`
      : item.kind === "audio"
        ? `/episodes/${item.slug}`
        : `/library/${item.slug}`;

  return (
    <div
      className={`group flex gap-4 p-4 rounded-lg border bg-card transition-all duration-200 ${
        isDone
          ? "border-green-500/30 bg-green-500/5"
          : "border-border hover:border-primary/30 hover:shadow-md"
      }`}
    >
      {/* Done toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!isSharedView) onToggleDone(item.id);
        }}
        className={`shrink-0 mt-0.5 transition-colors ${isSharedView ? "cursor-default" : ""}`}
        aria-label={isDone ? "Mark as not done" : "Mark as done"}
        title={isSharedView ? (isDone ? "Done in shared progress" : "Not done in shared progress") : (isDone ? "Mark as not done" : "Mark as done")}
        disabled={isSharedView}
      >
        {isDone ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground/40 hover:text-green-500/60" />
        )}
      </button>

      {/* Position number */}
      <div
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
        style={{
          color: isDone ? "#22c55e" : trackColor,
          background: isDone ? "#22c55e18" : trackColor + "18",
          border: `1px solid ${isDone ? "#22c55e33" : trackColor + "33"}`,
        }}
      >
        {isDone ? <CheckCircle2 className="w-4 h-4" /> : position}
      </div>

      {/* Artwork */}
      <Link href={href} className="shrink-0">
        {item.artworkUrl ? (
          <img
            src={item.artworkUrl}
            alt={item.title}
            className={`w-14 h-14 rounded-md object-cover transition-opacity ${isDone ? "opacity-50" : "opacity-100"}`}
          />
        ) : (
          <div
            className="w-14 h-14 rounded-md flex items-center justify-center"
            style={{ background: trackColor + "18" }}
          >
            <KindIcon kind={item.kind} />
          </div>
        )}
      </Link>

      {/* Body */}
      <Link href={href} className="flex-1 min-w-0">
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
          {isDone && (
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">
              Done
            </span>
          )}
        </div>
        <h3
          className={`font-serif font-bold text-sm leading-snug mb-1 transition-colors ${
            isDone
              ? "text-muted-foreground line-through decoration-muted-foreground/40"
              : "text-foreground group-hover:text-primary"
          }`}
        >
          {item.title}
        </h3>
        {item.summary && !isDone && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {item.summary.replace(/^https?:\/\/\S+\n\n?/, "").slice(0, 180)}
          </p>
        )}
      </Link>
    </div>
  );
}

function ProgressBar({
  doneCount,
  total,
  color,
}: {
  doneCount: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.min(100, (doneCount / total) * 100) : 0;
  const isComplete = doneCount >= total && total > 0;

  return (
    <div
      className="rounded-xl p-5 max-w-2xl"
      style={{
        background: isComplete ? "#22c55e12" : color + "12",
        border: `1px solid ${isComplete ? "#22c55e30" : color + "30"}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
          style={{ color: isComplete ? "#22c55e" : color }}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {isComplete ? "Track complete!" : "Your progress"}
        </div>
        <span className="text-sm font-bold text-foreground">
          {doneCount.toLocaleString()} / {total.toLocaleString()}
        </span>
      </div>

      {/* Bar */}
      <div className="h-2 rounded-full bg-border overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: isComplete ? "#22c55e" : color,
          }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {doneCount === 0
          ? "Click the circle next to any episode to mark it done."
          : isComplete
            ? "You've completed this entire learning track."
            : `${(total - doneCount).toLocaleString()} episodes remaining`}
      </p>
    </div>
  );
}

type ShareButtonProps = {
  slug: string;
  doneIds: Set<number>;
  doneCount: number;
  total: number;
};

function ShareProgressButton({ slug, doneIds, doneCount, total }: ShareButtonProps) {
  const [state, setState] = useState<"idle" | "copied">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleShare() {
    if (doneCount === 0) return;
    const url = buildShareUrl(slug, doneIds);
    navigator.clipboard.writeText(url).then(() => {
      setState("copied");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setState("idle"), 2500);
    });
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  if (doneCount === 0) return null;

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-200 ${
        state === "copied"
          ? "bg-green-500/10 border-green-500/40 text-green-600"
          : "bg-background border-border hover:border-primary/40 hover:bg-primary/5 text-foreground"
      }`}
    >
      {state === "copied" ? (
        <>
          <Check className="w-4 h-4" />
          Link copied!
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Share my progress ({doneCount}/{total})
        </>
      )}
    </button>
  );
}

type SharedProgressBannerProps = {
  sharedDoneCount: number;
  total: number;
  onImport: () => void;
  onDismiss: () => void;
};

function SharedProgressBanner({ sharedDoneCount, total, onImport, onDismiss }: SharedProgressBannerProps) {
  const pct = total > 0 ? Math.round((sharedDoneCount / total) * 100) : 0;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground mb-0.5">
          You're viewing someone's shared progress
        </p>
        <p className="text-xs text-muted-foreground">
          They've completed {sharedDoneCount} of {total} episodes ({pct}% done). Import it to start
          tracking from where they left off.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onImport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Import progress
        </button>
        <button
          onClick={onDismiss}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium text-muted-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default function TrackDetailPage() {
  const [, params] = useRoute("/tracks/:slug");
  const slug = params?.slug ?? "";
  const [copied, setCopied] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const sharedParam = searchParams.get("shared");
  const sharedIds = sharedParam ? decodeProgressParam(sharedParam) : null;
  const [isSharedView, setIsSharedView] = useState(sharedIds !== null);
  const [sharedDismissed, setSharedDismissed] = useState(false);

  const queryParams = { limit: PAGE_SIZE, offset };
  const { data, isLoading, isError, isFetching } = useGetTrackEpisodes(slug, queryParams);
  const progress = useTrackProgress(slug);

  const track = data?.track;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const displayDoneIds = isSharedView && sharedIds ? sharedIds : progress.doneIds;
  const displayDoneCount = displayDoneIds.size;
  const isDone = (id: number) => displayDoneIds.has(id);

  function importSharedProgress() {
    if (!sharedIds) return;
    sharedIds.forEach((id) => progress.markDone(id));
    setIsSharedView(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("shared");
    window.history.replaceState({}, "", url.toString());
  }

  function dismissShared() {
    setIsSharedView(false);
    setSharedDismissed(true);
    const url = new URL(window.location.href);
    url.searchParams.delete("shared");
    window.history.replaceState({}, "", url.toString());
  }

  const trackUrl = `${window.location.origin}${window.location.pathname.split("/tracks/")[0]}/tracks/${slug}`;

  useDocumentMeta(
    track
      ? {
          title: `${track.title} — TSP Learning Track`,
          description: track.description,
          ogTitle: `${track.title} — TSP Learning Track`,
          ogDescription: track.description,
          ogImage: track.artworkUrl ?? undefined,
          ogUrl: trackUrl,
          ogType: "website",
        }
      : {},
  );

  async function handleShare() {
    const shareData = {
      title: track ? `${track.title} — TSP Learning Track` : "TSP Learning Track",
      text: track
        ? `${track.title}: ${track.description}`
        : "Check out this learning track on The Survival Podcast.",
      url: trackUrl,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
      }
    }

    try {
      await navigator.clipboard.writeText(trackUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = trackUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

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
            className="rounded-xl p-5 max-w-2xl mb-4"
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

          {/* Progress bar */}
          <ProgressBar doneCount={displayDoneCount} total={total} color={track.color} />

          {/* Share button — only shown when user has their own progress */}
          {!isSharedView && (
            <div className="mt-4">
              <ShareProgressButton
                slug={slug}
                doneIds={progress.doneIds}
                doneCount={progress.doneCount}
                total={total}
              />
            </div>
          )}

          <div className="mt-6 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{total.toLocaleString()}</span>
              <span>episodes &amp; resources in this track</span>
            </div>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-200"
              style={
                copied
                  ? {
                      color: "#22c55e",
                      borderColor: "#22c55e44",
                      background: "#22c55e12",
                    }
                  : {
                      color: track.color,
                      borderColor: track.color + "44",
                      background: track.color + "12",
                    }
              }
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Link copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Share this track
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Episode list */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Shared progress banner */}
        {isSharedView && sharedIds && !sharedDismissed && (
          <SharedProgressBanner
            sharedDoneCount={sharedIds.size}
            total={total}
            onImport={importSharedProgress}
            onDismiss={dismissShared}
          />
        )}

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
              isDone={isDone(item.id)}
              onToggleDone={progress.toggleDone}
              isSharedView={isSharedView}
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
