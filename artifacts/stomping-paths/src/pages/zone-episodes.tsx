import { useState, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2, Headphones, Play, Mic, FileText, PlaySquare,
  ExternalLink, ChevronRight, ArrowLeft,
} from "lucide-react";

type SourceFilter = "all" | "tsp" | "ulg" | "fireside-freedom";

type ZoneInfo = {
  number: number;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  philosophy: string;
  color: string;
};

type Episode = {
  id: number;
  source: string;
  kind: string;
  slug: string;
  title: string;
  link: string;
  summary: string | null;
  publishedAt: string;
  episodeNumber: number | null;
  durationSeconds: number | null;
  audioUrl: string | null;
  audioType: string | null;
  videoUrl: string | null;
  videoId: string | null;
  artworkUrl: string | null;
  categories: string[];
  tags: string[];
  zoneScore: number;
};

type EpisodesResponse = {
  zone: ZoneInfo;
  items: Episode[];
  total: number;
  limit: number;
  offset: number;
};

const ZONE_ACCENT_COLORS = [
  "#E8853D",
  "#5C9E5C",
  "#C89B3C",
  "#8B6BB1",
  "#7FAF7F",
  "#5BA3C9",
];

const ZONE_BG_COLORS = [
  "bg-amber-50",
  "bg-yellow-50",
  "bg-lime-50",
  "bg-green-50",
  "bg-emerald-50",
  "bg-stone-100",
];

const ZONE_TEXT_COLORS = [
  "text-amber-700",
  "text-yellow-700",
  "text-lime-700",
  "text-green-800",
  "text-emerald-900",
  "text-stone-800",
];

const ZONE_BADGE_BG = [
  "bg-amber-100 border-amber-300 text-amber-800",
  "bg-yellow-100 border-yellow-300 text-yellow-800",
  "bg-lime-100 border-lime-300 text-lime-800",
  "bg-green-100 border-green-300 text-green-800",
  "bg-emerald-100 border-emerald-300 text-emerald-900",
  "bg-stone-200 border-stone-400 text-stone-800",
];

const ZONE_RING_COLORS = [
  "border-amber-600",
  "border-yellow-600",
  "border-lime-600",
  "border-green-700",
  "border-emerald-800",
  "border-stone-800",
];

const PAGE_SIZE = 30;

function kindIcon(kind: string) {
  if (kind === "audio") return <Mic className="w-3.5 h-3.5" />;
  if (kind === "video") return <PlaySquare className="w-3.5 h-3.5" />;
  return <FileText className="w-3.5 h-3.5" />;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function EpisodeRow({ ep }: { ep: Episode }) {
  const isUlg = ep.source === "ulg";
  const isFireside = ep.source === "fireside-freedom";
  const isCouncil = ep.source.startsWith("council-");
  const isExternal = isUlg || isFireside || isCouncil;
  const href = isExternal ? ep.link : `/episodes/${ep.slug}`;

  const inner = (
    <div className="group flex items-start gap-3 py-3 px-3 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer">
      {ep.artworkUrl ? (
        <img
          src={ep.artworkUrl}
          alt=""
          className="w-12 h-12 rounded object-cover shrink-0 mt-0.5"
        />
      ) : (
        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0 mt-0.5">
          <Play className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-0.5">
          {isUlg && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-300 shrink-0 leading-none">
              ULG
            </span>
          )}
          {isFireside && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-300 shrink-0 leading-none">
              Fireside
            </span>
          )}
          {isCouncil && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-300 shrink-0 leading-none">
              Council
            </span>
          )}
          <p className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {ep.title}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span>
            {new Date(ep.publishedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {ep.durationSeconds && <span>{formatDuration(ep.durationSeconds)}</span>}
          {kindIcon(ep.kind)}
          {isExternal && <ExternalLink className="w-3 h-3" />}
        </div>
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return <Link href={href}>{inner}</Link>;
}

function parseSourceParam(raw: string | null): SourceFilter {
  if (raw === "tsp" || raw === "ulg" || raw === "fireside-freedom") return raw;
  return "all";
}

export default function ZoneEpisodesPage() {
  const [, params] = useRoute("/zones/:slug/episodes");
  const slug = params?.slug ?? "";
  const [location, setLocation] = useLocation();

  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const initialSource = parseSourceParam(searchParams.get("source"));
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>(initialSource);
  const [page, setPage] = useState(0);

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    const params = new URLSearchParams();
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    const qs = params.toString();
    const newPath = `/zones/${slug}/episodes${qs ? `?${qs}` : ""}`;
    if (location !== newPath) {
      setLocation(newPath, { replace: true });
    }
    setPage(0);
  }, [sourceFilter, slug]);

  const apiSource = sourceFilter === "all" ? undefined : sourceFilter;

  const { data, isLoading, isError } = useQuery<EpisodesResponse>({
    queryKey: ["zone-episodes-full", slug, apiSource, page],
    queryFn: async () => {
      const url = new URL(
        `${base}/api/zones/${encodeURIComponent(slug)}/episodes`,
        window.location.origin
      );
      url.searchParams.set("limit", String(PAGE_SIZE));
      url.searchParams.set("offset", String(page * PAGE_SIZE));
      url.searchParams.set("excludeSeries", "false");
      if (apiSource) url.searchParams.set("source", apiSource);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load episodes");
      return res.json();
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  const zone = data?.zone;
  const idx = zone?.number ?? 0;
  const accentColor = ZONE_ACCENT_COLORS[idx] ?? "#D9A066";
  const bgColor = ZONE_BG_COLORS[idx] ?? "bg-muted";
  const textColor = ZONE_TEXT_COLORS[idx] ?? "text-foreground";
  const badgeColor = ZONE_BADGE_BG[idx] ?? "bg-muted border-border text-foreground";
  const ringColor = ZONE_RING_COLORS[idx] ?? "border-primary";

  const SOURCE_FILTERS: { value: SourceFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "tsp", label: "TSP Only" },
    { value: "ulg", label: "ULG Only" },
    { value: "fireside-freedom", label: "Fireside Freedom" },
  ];

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading episodes…</span>
        </div>
      </div>
    );
  }

  if (isError || (!isLoading && !data)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Could not load episodes. Try refreshing.</p>
        <Link href="/zones" className="text-sm font-semibold text-primary hover:underline">
          ← Back to all zones
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div
        className={`border-b border-border ${bgColor}`}
        style={{ borderTop: `4px solid ${accentColor}` }}
      >
        <div className="max-w-5xl mx-auto px-6 py-10">
          <nav
            className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <Link href="/zones" className="hover:text-foreground transition-colors">Zones</Link>
            <ChevronRight className="w-3 h-3 opacity-40" />
            {zone && (
              <>
                <Link
                  href={`/zones/${zone.slug}`}
                  className="hover:text-foreground transition-colors truncate max-w-[120px]"
                >
                  {zone.name}
                </Link>
                <ChevronRight className="w-3 h-3 opacity-40" />
              </>
            )}
            <span className="text-foreground font-semibold">All Episodes</span>
          </nav>

          <div className="flex items-start gap-5">
            {zone && (
              <div
                className={`shrink-0 w-14 h-14 rounded-2xl border-2 ${ringColor} ${bgColor} flex flex-col items-center justify-center`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-widest ${textColor} opacity-60`}>
                  Zone
                </span>
                <span className={`text-2xl font-serif font-bold ${textColor}`}>
                  {zone.number}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              {zone && (
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badgeColor}`}>
                    Zone {zone.number}
                  </span>
                  {data && (
                    <span className="text-xs text-muted-foreground">
                      {data.total.toLocaleString()} episode{data.total !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )}
              <h1 className={`font-serif text-2xl md:text-3xl font-bold ${textColor} mb-1`}>
                {zone ? `${zone.name} — All Episodes` : "All Episodes"}
              </h1>
              {zone && (
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  {zone.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Back link + filter row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <Link
            href={`/zones/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {zone?.name ?? "zone"}
          </Link>

          <div className="flex items-center gap-1.5 sm:ml-auto flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Filter:</span>
            {SOURCE_FILTERS.map((f) => {
              const active = sourceFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setSourceFilter(f.value)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Header row */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
            style={{ background: `${accentColor}20`, color: accentColor }}
          >
            <Headphones className="w-4 h-4" />
          </div>
          <h2 className="font-serif text-xl font-bold text-foreground">
            {sourceFilter === "all"
              ? "All Episodes"
              : sourceFilter === "tsp"
              ? "TSP Episodes"
              : sourceFilter === "ulg"
              ? "ULG Episodes"
              : "Fireside Freedom Episodes"}
          </h2>
          {data && (
            <span className="ml-auto text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {data.total.toLocaleString()}
            </span>
          )}
        </div>

        {/* Episode list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : data && data.items.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="text-muted-foreground text-sm">
              No{" "}
              {sourceFilter !== "all"
                ? sourceFilter === "tsp"
                  ? "TSP"
                  : sourceFilter === "ulg"
                  ? "ULG"
                  : "Fireside Freedom"
                : ""}{" "}
              episodes found for this zone.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {data?.items.map((ep) => (
              <EpisodeRow key={ep.id} ep={ep} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => { setPage((p) => Math.max(0, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              disabled={page === 0}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => { setPage((p) => Math.min(totalPages - 1, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
