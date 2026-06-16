import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useGetTrackEpisodes, fetchAllTrackEpisodes, type TrackNugget } from "@/hooks/use-tracks";
import { useTrackProgress, buildShareUrl, decodeProgressParam } from "@/hooks/use-track-progress";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { OdysseyBridge } from "@/components/odyssey-bridge";
import { ProductShelf, type ReviewedProduct } from "@/components/product-shelf";
import { useTransformations, type Transformation } from "@/hooks/use-transformations";
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
  Search,
  X,
  Check,
  ClipboardCopy,
  Printer,
} from "lucide-react";
import { ShareModal, SharedNoteBanner } from "@/components/share-modal";
import { formatDuration } from "@/components/episode-card";

const PAGE_SIZE = 24;

const ZONE_ACCENT_COLORS = [
  "#E8853D",
  "#5C9E5C",
  "#C89B3C",
  "#8B6BB1",
  "#7FAF7F",
  "#5BA3C9",
];

function matchTransformations(
  episodeCategories: string[],
  transformations: Transformation[],
  episodeTags?: string[],
): Transformation[] {
  const lowerCats = episodeCategories.map((c) => c.toLowerCase());
  const lowerTags = (episodeTags ?? []).map((t) => t.toLowerCase());
  const episodeTerms = [...lowerCats, ...lowerTags];
  return transformations.filter((t) => {
    const tLower = [...t.tags, ...t.categories].map((s) => s.toLowerCase());
    return episodeTerms.some((term) => tLower.includes(term));
  });
}

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
  transformation?: Transformation | null;
  sharedNote?: string | null;
  sharedFrom?: string | null;
};

function TrackItemCard({
  item,
  trackColor,
  index,
  globalOffset,
  isDone,
  onToggleDone,
  isSharedView,
  transformation,
  sharedNote,
  sharedFrom,
}: TrackItemCardProps) {
  const position = globalOffset + index + 1;
  const isEpisode = item.kind === "audio" && item.source !== "ulg";
  const baseHref =
    item.source === "ulg" || item.kind === "article"
      ? `/library/${item.slug}`
      : item.kind === "audio"
        ? `/episodes/${item.slug}`
        : `/library/${item.slug}`;
  const href = (() => {
    if (!isEpisode || (!sharedNote && !sharedFrom)) return baseHref;
    const p = new URLSearchParams();
    if (sharedNote) p.set("note", sharedNote);
    if (sharedFrom) p.set("from", sharedFrom);
    return `${baseHref}?${p.toString()}`;
  })();

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
        className={`print:hidden shrink-0 mt-0.5 transition-colors ${isSharedView ? "cursor-default" : ""}`}
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
      <Link href={href} className="print:hidden shrink-0">
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
        {transformation && (
          <div className="mt-1.5">
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-sm"
              style={{
                color: transformation.color,
                background: `${transformation.color}18`,
                border: `1px solid ${transformation.color}44`,
              }}
            >
              <span>{transformation.icon}</span>
              <span>{transformation.from}</span>
              <span className="opacity-50 font-normal">→</span>
              <span>{transformation.to}</span>
            </span>
          </div>
        )}
      </Link>
    </div>
  );
}

function NuggetWaypointCard({
  nugget,
  trackColor,
}: {
  nugget: TrackNugget;
  trackColor: string;
}) {
  return (
    <div
      className="rounded-xl px-5 py-4 flex flex-col gap-2 print:hidden"
      style={{
        background: `${trackColor}10`,
        border: `1.5px solid ${trackColor}30`,
      }}
    >
      <div
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
        style={{ color: trackColor }}
      >
        <span>💎</span>
        <span>Jack's Insight</span>
      </div>
      <p className="font-serif text-sm leading-relaxed text-foreground italic">
        "{nugget.text}"
      </p>
      <p className="text-xs font-semibold text-muted-foreground">— {nugget.attribution}</p>
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

type ExportPdfButtonProps = {
  slug: string;
  trackTitle: string;
  trackSubtitle: string;
  trackIcon: string;
  trackColor: string;
  zoneLabel: string;
  doneIds: Set<number>;
  doneCount: number;
  total: number;
};

function ExportPdfButton({
  slug,
  trackTitle,
  trackSubtitle,
  trackIcon,
  trackColor,
  zoneLabel,
  doneIds,
  doneCount,
  total,
}: ExportPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const allItems = await fetchAllTrackEpisodes(slug);
      const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
      const isComplete = doneCount >= total && total > 0;
      const dateStr = format(new Date(), "MMMM d, yyyy");

      const rows = allItems
        .map((item, i) => {
          const done = doneIds.has(item.id);
          const ep = item.episodeNumber ? ` · Ep ${item.episodeNumber}` : "";
          const pub = format(parseISO(item.publishedAt), "MMM d, yyyy");
          const rowBg = done ? "#f0fdf4" : i % 2 === 0 ? "#ffffff" : "#f9fafb";
          const checkCell = done
            ? `<td style="width:28px;padding:6px 8px;text-align:center;font-size:16px;color:#16a34a;">&#10003;</td>`
            : `<td style="width:28px;padding:6px 8px;text-align:center;font-size:14px;color:#d1d5db;">&#9675;</td>`;
          const titleStyle = done
            ? "font-size:12px;color:#6b7280;text-decoration:line-through;"
            : "font-size:12px;color:#111827;font-weight:500;";
          return `<tr style="background:${rowBg};border-bottom:1px solid #f3f4f6;">
            ${checkCell}
            <td style="padding:6px 8px;width:28px;font-size:11px;color:#9ca3af;text-align:right;">${i + 1}</td>
            <td style="padding:6px 10px;">
              <div style="${titleStyle}">${item.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
              <div style="font-size:10px;color:#9ca3af;margin-top:1px;">${pub}${ep}</div>
            </td>
          </tr>`;
        })
        .join("");

      const statusColor = isComplete ? "#16a34a" : trackColor;
      const statusText = isComplete
        ? "Track complete!"
        : `${doneCount.toLocaleString()} of ${total.toLocaleString()} done · ${pct}% complete`;

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${trackTitle} — Progress Checklist</title>
<style>
  @media print {
    @page { margin: 0.6in 0.5in; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  body { font-family: Georgia, 'Times New Roman', serif; margin: 0; padding: 0; color: #111827; background: #fff; }
  .header { padding: 24px 0 16px; border-bottom: 2px solid ${trackColor}; margin-bottom: 16px; }
  .zone-badge { display: inline-block; font-family: sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: ${statusColor}; border: 1.5px solid ${statusColor}; border-radius: 100px; padding: 3px 10px; margin-bottom: 10px; }
  h1 { font-size: 26px; margin: 0 0 4px; color: #111827; font-weight: 700; }
  .subtitle { font-size: 13px; color: #6b7280; margin: 0 0 12px; font-family: sans-serif; }
  .progress-bar-wrap { background: #f3f4f6; border-radius: 100px; height: 8px; margin-bottom: 8px; overflow: hidden; }
  .progress-bar-fill { height: 8px; border-radius: 100px; background: ${statusColor}; width: ${pct}%; }
  .status-row { font-family: sans-serif; font-size: 12px; font-weight: 600; color: ${statusColor}; margin-bottom: 4px; }
  .meta-row { font-family: sans-serif; font-size: 11px; color: #9ca3af; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-family: sans-serif; }
  thead tr { background: ${trackColor}18; }
  thead th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${trackColor}; padding: 7px 8px; text-align: left; border-bottom: 1px solid ${trackColor}40; }
  .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-family: sans-serif; font-size: 10px; color: #9ca3af; text-align: center; }
</style>
</head>
<body>
<div class="header">
  <div class="zone-badge">${zoneLabel} · Learning Track</div>
  <h1>${trackIcon} ${trackTitle.replace(/</g, "&lt;")}</h1>
  <p class="subtitle">${trackSubtitle.replace(/</g, "&lt;")}</p>
  <div class="progress-bar-wrap"><div class="progress-bar-fill"></div></div>
  <div class="status-row">${statusText}</div>
</div>
<table>
  <thead>
    <tr>
      <th style="width:28px;">&#10003;</th>
      <th style="width:28px;">#</th>
      <th>Episode / Resource</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">Exported ${dateStr} · The Stomping Path Learning Tracks</div>
</body>
</html>`;

      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
      }, 400);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-200 bg-background border-border hover:border-primary/40 hover:bg-primary/5 text-foreground disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Building PDF…
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Export as PDF
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

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function TrackDetailPage() {
  const [, params] = useRoute("/tracks/:slug");
  const slug = params?.slug ?? "";
  const [copied, setCopied] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [noteBannerDismissed, setNoteBannerDismissed] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const sharedNote = searchParams.get("note");
  const sharedFrom = searchParams.get("from");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const sharedParam = searchParams.get("shared");
  const sharedIds = sharedParam ? decodeProgressParam(sharedParam) : null;
  const [isSharedView, setIsSharedView] = useState(sharedIds !== null);
  const [sharedDismissed, setSharedDismissed] = useState(false);

  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const [activeTag, setActiveTag] = useState<string | null>(searchParams.get("tag") ?? null);
  const debouncedSearch = useDebounce(searchInput, 300);

  const queryParams = {
    limit: PAGE_SIZE,
    offset,
    q: debouncedSearch || undefined,
    tag: activeTag || undefined,
  };


  const { data, isLoading, isError, isFetching } = useGetTrackEpisodes(slug, queryParams);
  const progress = useTrackProgress(slug);

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const { data: gearProducts = [] } = useQuery<ReviewedProduct[]>({
    queryKey: ["gear-track", slug],
    queryFn: async () => {
      const res = await fetch(`${base}/api/gear?track=${encodeURIComponent(slug)}&limit=6`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!slug,
  });

  const { data: transformations } = useTransformations();

  const track = data?.track;

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const topTags = data?.topTags ?? [];
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
        : "Check out this learning track on The Stomping Path.",
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
  async function handleCopySummary() {
    if (!track) return;
    const zoneLabel = ZONE_LABELS[track.zoneNumber];
    const summary = `${track.icon} ${track.title} — TSP ${zoneLabel} Learning Track · ${total.toLocaleString()} episodes · ${trackUrl}`;
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = summary;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  }

  const isFiltering = !!debouncedSearch || !!activeTag;

  function navigate(p: number) {
    const qs = new URLSearchParams(window.location.search);
    qs.set("page", String(p));
    window.history.pushState({}, "", `${window.location.pathname}?${qs.toString()}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSearchChange(val: string) {
    setSearchInput(val);
    const qs = new URLSearchParams(window.location.search);
    qs.set("page", "1");
    if (val) qs.set("q", val); else qs.delete("q");
    window.history.replaceState({}, "", `${window.location.pathname}?${qs.toString()}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  function handleTagClick(tag: string) {
    const newTag = activeTag === tag ? null : tag;
    setActiveTag(newTag);
    const qs = new URLSearchParams(window.location.search);
    qs.set("page", "1");
    if (newTag) qs.set("tag", newTag); else qs.delete("tag");
    window.history.replaceState({}, "", `${window.location.pathname}?${qs.toString()}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  function clearFilters() {
    setSearchInput("");
    setActiveTag(null);
    const qs = new URLSearchParams(window.location.search);
    qs.set("page", "1");
    qs.delete("q");
    qs.delete("tag");
    window.history.replaceState({}, "", `${window.location.pathname}?${qs.toString()}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
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
      {/* Shared-with-you banner */}
      {sharedNote && !noteBannerDismissed && (
        <SharedNoteBanner
          note={sharedNote}
          from={sharedFrom}
          accentColor={track.color}
          onDismiss={() => setNoteBannerDismissed(true)}
        />
      )}

      {/* Hero */}
      <div
        className="border-b border-border relative overflow-hidden"
        style={{
          backgroundColor: track.color + "14",
          borderTop: `4px solid ${ZONE_ACCENT_COLORS[track.zoneNumber] ?? track.color}`,
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 80% 50%, ${track.color} 0%, transparent 60%)`,
          }}
        />
        <div className="max-w-4xl mx-auto px-6 py-12 relative">
          {/* Breadcrumb */}
          <nav className="print:hidden flex items-center gap-1.5 text-xs text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <Link href="/tracks" className="hover:text-foreground transition-colors">Learning Tracks</Link>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span className="text-foreground font-semibold truncate max-w-[200px]">{track.title}</span>
          </nav>

          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="text-3xl leading-none">{track.icon}</span>
            <div
              className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border-2"
              style={{ borderColor: track.color, color: track.color }}
            >
              {ZONE_LABELS[track.zoneNumber]} · Learning Track
            </div>
            {total > 0 && (
              <div
                className="text-xs font-bold px-3 py-1 rounded-full border-2 flex items-center gap-1.5"
                style={{ borderColor: track.color + "60", color: track.color, background: track.color + "12" }}
              >
                {isFiltering ? (
                  <>
                    {total.toLocaleString()} matching
                    <span className="opacity-50 font-normal">/ filtered</span>
                  </>
                ) : (
                  <>{total.toLocaleString()} episodes</>
                )}
              </div>
            )}
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
          <div className="print:hidden">
            <ProgressBar doneCount={displayDoneCount} total={total} color={track.color} />
          </div>

          {/* Share + Export buttons — only shown when user has their own progress */}
          {!isSharedView && (
            <div className="print:hidden mt-4 flex items-center gap-3 flex-wrap">
              <ShareProgressButton
                slug={slug}
                doneIds={progress.doneIds}
                doneCount={progress.doneCount}
                total={total}
              />
              <ExportPdfButton
                slug={slug}
                trackTitle={track.title}
                trackSubtitle={track.subtitle}
                trackIcon={track.icon}
                trackColor={track.color}
                zoneLabel={ZONE_LABELS[track.zoneNumber]}
                doneIds={progress.doneIds}
                doneCount={progress.doneCount}
                total={total}
              />
            </div>
          )}

          <div className="print:hidden mt-6 flex items-center gap-4 flex-wrap">
            {isFiltering ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{total.toLocaleString()}</span>
                <span>matching episodes</span>
                <span className="text-muted-foreground/50">·</span>
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary hover:underline"
                >
                  clear filters
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{total.toLocaleString()}</span>
                <span>episodes &amp; resources in this track</span>
              </div>
            )}

            <button
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-200"
              style={{
                color: track.color,
                borderColor: track.color + "44",
                background: track.color + "12",
              }}
            >
              <Share2 className="w-4 h-4" />
              Share this track
            </button>

            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-200"
              style={
                copiedSummary
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
              title={`Copy a text summary you can paste anywhere`}
            >
              {copiedSummary ? (
                <>
                  <Check className="w-4 h-4" />
                  Summary copied!
                </>
              ) : (
                <>
                  <ClipboardCopy className="w-4 h-4" />
                  Copy summary
                </>
              )}
            </button>
          </div>

          {/* Print overview button */}
          <div className="print:hidden mt-6">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-foreground transition-all duration-200"
            >
              <Printer className="w-4 h-4" />
              Print overview
            </button>
          </div>

          {/* Print-only: track URL footer note */}
          <div className="hidden print:block mt-4 text-xs text-gray-500">
            {trackUrl}
          </div>
        </div>
      </div>

      {/* Search + tag filter bar */}
      <div className="print:hidden border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex flex-col gap-3">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search episodes in this track…"
              className="w-full pl-9 pr-9 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-muted-foreground/60"
            />
            {searchInput && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tag chips */}
          {topTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">
                Filter:
              </span>
              {topTags.slice(0, 16).map((tag) => {
                const isActive = activeTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                      isActive
                        ? "border-transparent text-white"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                    style={isActive ? { background: track.color, borderColor: track.color } : {}}
                  >
                    {tag}
                  </button>
                );
              })}
              {isFiltering && (
                <button
                  onClick={clearFilters}
                  className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Episode list */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Shared progress banner */}
        {isSharedView && sharedIds && !sharedDismissed && (
          <div className="print:hidden">
            <SharedProgressBanner
              sharedDoneCount={sharedIds.size}
              total={total}
              onImport={importSharedProgress}
              onDismiss={dismissShared}
            />
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl font-bold text-foreground">
            {isFiltering
              ? `${total.toLocaleString()} result${total !== 1 ? "s" : ""}`
              : "The track — oldest to newest"}
          </h2>
          {isFetching && (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {items.length === 0 && !isFetching && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium mb-1">No episodes match your search</p>
            <p className="text-xs mb-4">Try different keywords or remove a filter.</p>
            <button
              onClick={clearFilters}
              className="text-xs text-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}

        <div
          className={`flex flex-col gap-3 transition-opacity duration-200 ${isFetching ? "opacity-60" : "opacity-100"}`}
        >
          {(() => {
            const nuggets = data?.nuggets ?? [];
            const beginningNuggets = nuggets.filter((n) => n.trackPosition === "beginning");
            const middleNuggets = nuggets.filter((n) => n.trackPosition === "middle");
            const endNuggets = nuggets.filter((n) => n.trackPosition === "end");
            const isFirstPage = offset === 0;
            const isLastPage = page >= totalPages;

            // Middle position: the single page that contains the global midpoint episode.
            // globalMidIdx is zero-based index in the full sorted list.
            const globalMidIdx = total > 1 ? Math.floor(total / 2) : -1;
            // Local index within the current page (-1 if not on this page)
            const localMidIdx =
              !isFiltering &&
              globalMidIdx >= offset &&
              globalMidIdx < offset + items.length
                ? globalMidIdx - offset
                : -1;

            const rendered: React.ReactNode[] = [];
            items.forEach((item, i) => {
              const itemTransformation = transformations
                ? (matchTransformations(item.categories ?? [], transformations, item.tags ?? [])[0] ?? null)
                : null;
              rendered.push(
                <TrackItemCard
                  key={item.id}
                  item={item}
                  trackColor={track.color}
                  index={i}
                  globalOffset={offset}
                  isDone={isDone(item.id)}
                  onToggleDone={progress.toggleDone}
                  isSharedView={isSharedView}
                  transformation={itemTransformation}
                  sharedNote={sharedNote}
                  sharedFrom={sharedFrom}
                />
              );

              if (!isFiltering && isFirstPage && i === 0) {
                beginningNuggets.forEach((n) =>
                  rendered.push(
                    <NuggetWaypointCard key={`nugget-b-${n.id}`} nugget={n} trackColor={track.color} />
                  )
                );
              }
              if (localMidIdx !== -1 && i === localMidIdx) {
                middleNuggets.forEach((n) =>
                  rendered.push(
                    <NuggetWaypointCard key={`nugget-m-${n.id}`} nugget={n} trackColor={track.color} />
                  )
                );
              }
              if (!isFiltering && isLastPage && i === items.length - 1) {
                endNuggets.forEach((n) =>
                  rendered.push(
                    <NuggetWaypointCard key={`nugget-e-${n.id}`} nugget={n} trackColor={track.color} />
                  )
                );
              }
            });
            return rendered;
          })()}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="print:hidden flex items-center justify-center gap-3 mt-10">
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

        {/* Gear shelf — shown at the end of the last page or when not filtering */}
        {!isFiltering && gearProducts.length > 0 && (
          <div className="print:hidden mt-10 pt-8 border-t border-border">
            <ProductShelf
              products={gearProducts}
              heading="Gear for this track"
              subheading="Products Jack has reviewed that are relevant to this subject."
            />
          </div>
        )}

        {/* Odyssey bridge — shown at the end of the last page */}
        {!isFiltering && (isLastPage || totalPages === 0) && (
          <div className="print:hidden mt-12 pt-10 border-t border-border">
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
        {!isFiltering && !isLastPage && totalPages > 1 && (
          <div className="print:hidden mt-10 pt-8 border-t border-border">
            <OdysseyBridge variant="compact" />
          </div>
        )}

        {/* Print-only footer */}
        <div className="hidden print:block mt-8 pt-6 border-t border-gray-300 text-xs text-gray-500">
          <p>Printed from The Stomping Path</p>
          <p className="mt-0.5">Episodes shown: page {page} of {totalPages} (up to {PAGE_SIZE} per page)</p>
        </div>
      </div>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        surface="track"
        slug={slug}
        name={track.title}
        accentColor={track.color}
      />
    </div>
  );
}
