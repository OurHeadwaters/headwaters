import { Link } from "wouter";
import { ArrowRight, Check, Compass, Flame, Loader2, PlayCircle, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { OdysseyBridge } from "@/components/odyssey-bridge";
import { useListEpisodes, getListEpisodesQueryKey } from "@workspace/api-client-react";
import { useTransformations, type Transformation } from "@/hooks/use-transformations";
import { useSelectedTransformation } from "@/hooks/use-selected-transformation";
import { useShareCounts } from "@/hooks/use-share-counts";

function buildEpisodesUrl(t: Transformation): string {
  return `/episodes?transformation=${encodeURIComponent(t.slug)}`;
}

function buildTagsFilter(t: Transformation): string[] {
  const allTerms = [...t.tags, ...t.categories];
  return [...new Set(allTerms.map((s) => s.toLowerCase()))];
}

function TransformationCard({
  t,
  isSelected,
  onSelect,
  shareCount,
}: {
  t: Transformation;
  isSelected: boolean;
  onSelect: (slug: string) => void;
  shareCount: number;
}) {
  const queryTags = buildTagsFilter(t);
  const params = { limit: 3, offset: 0, tags: queryTags, sort: "popular" as const };
  const { data: episodePage } = useListEpisodes(params, {
    query: { queryKey: getListEpisodesQueryKey(params) },
  });
  const count = episodePage?.total ?? null;
  const sampleEpisodes = episodePage?.items ?? [];

  return (
    <div
      className="flex flex-col rounded-xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        borderColor: isSelected ? t.color + "88" : t.color + "33",
        background: isSelected ? t.color + "12" : t.color + "08",
        boxShadow: isSelected ? `0 0 0 2px ${t.color}44` : undefined,
      }}
    >
      <div
        className="px-6 py-5 flex items-start gap-4"
        style={{ borderBottom: `1px solid ${t.color}22` }}
      >
        <span className="text-3xl leading-none mt-0.5">{t.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: t.color }}
            >
              Transformation Path
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {shareCount > 0 && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    color: t.color,
                    background: t.color + "18",
                    border: `1px solid ${t.color}33`,
                  }}
                >
                  <Flame className="w-2.5 h-2.5" />
                  {shareCount.toLocaleString()} share{shareCount !== 1 ? "s" : ""}
                </span>
              )}
              {isSelected && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    color: t.color,
                    background: t.color + "20",
                    border: `1px solid ${t.color}55`,
                  }}
                >
                  <Check className="w-2.5 h-2.5" />
                  Your Path
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-serif text-lg font-bold text-foreground">
              {t.from}
            </span>
            <ArrowRight className="w-4 h-4 shrink-0" style={{ color: t.color }} />
            <span className="font-serif text-lg font-bold" style={{ color: t.color }}>
              {t.to}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 flex flex-col flex-1">
        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
          {t.description}
        </p>
        {count !== null ? (
          <p className="text-xs font-semibold mb-4" style={{ color: t.color }}>
            {count.toLocaleString()} episode{count !== 1 ? "s" : ""}
          </p>
        ) : (
          <p className="text-xs font-semibold mb-4 text-muted-foreground/50">Loading…</p>
        )}

        {sampleEpisodes.length > 0 && (
          <div className="mb-5 flex flex-col gap-1.5">
            {sampleEpisodes.map((ep) => (
              <Link
                key={ep.slug}
                href={`/episodes/${ep.slug}`}
                className="group flex items-start gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-black/5"
                style={{ border: `1px solid ${t.color}18`, background: t.color + "05" }}
              >
                <PlayCircle
                  className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
                  style={{ color: t.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                    {ep.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {format(parseISO(ep.pubDate), "MMM d, yyyy")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-auto flex-wrap">
          <button
            onClick={() => onSelect(t.slug)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px"
            style={
              isSelected
                ? {
                    color: t.color,
                    background: t.color + "25",
                    border: `1px solid ${t.color}55`,
                  }
                : {
                    color: t.color,
                    background: t.color + "15",
                    border: `1px solid ${t.color}33`,
                  }
            }
          >
            {isSelected ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Your path
              </>
            ) : (
              <>
                Select this path
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
          <Link
            href={`/transform/${t.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px"
            style={{
              color: t.color + "99",
              background: t.color + "08",
              border: `1px solid ${t.color}22`,
            }}
          >
            Explore Path
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={buildEpisodesUrl(t)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px"
            style={{
              color: t.color + "80",
              background: t.color + "05",
              border: `1px solid ${t.color}18`,
            }}
          >
            All Episodes
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

type SortMode = "default" | "popular";

export default function TransformPage() {
  const { data: transformations, isLoading, isError } = useTransformations();
  const { selectedSlug, select } = useSelectedTransformation();
  const [sortMode, setSortMode] = useState<SortMode>("default");

  const slugs = transformations?.map((t) => t.slug) ?? [];
  const shareCounts = useShareCounts("transform", slugs);

  const sorted =
    transformations && sortMode === "popular"
      ? [...transformations].sort(
          (a, b) => (shareCounts[b.slug] ?? 0) - (shareCounts[a.slug] ?? 0),
        )
      : transformations;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div
        className="border-b border-border relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0F1A28 0%, #14222E 60%, #1A2C30 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 70% 40%, #4A7A3A 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, #C4622D 0%, transparent 45%)",
          }}
        />
        <div className="max-w-5xl mx-auto px-6 py-16 relative">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full"
            style={{
              color: "#C4622D",
              background: "#C4622D18",
              border: "1px solid #C4622D33",
            }}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Codetry · Transformation Paths</span>
          </div>

          <h1
            className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-5"
            style={{ color: "#FDFBF7" }}
          >
            You've started the shift.
            <br />
            <span style={{ color: "#8FA883" }}>Here's how to build it.</span>
          </h1>

          <p className="text-lg leading-relaxed max-w-2xl mb-4" style={{ color: "#C8D4C0" }}>
            TSP listeners are people mid-transformation — from conventional to regenerative, debt
            to freedom, employee to owner, grid to off-grid. These paths name the journey you're
            on and surface the episodes that matter most for where you are.
          </p>

          <p className="text-sm leading-relaxed max-w-xl" style={{ color: "#8FA883" }}>
            Each path is framed through the Codetry lens: the personal shift is just the
            beginning. Once you've made the change yourself, there's a way to build it at
            community scale.
          </p>
        </div>
      </div>

      {/* Transformation grid */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-1">
              The six transformations
            </h2>
            <p className="text-sm text-muted-foreground">
              {selectedSlug
                ? "Your selected path is highlighted."
                : "Pick the path that matches where you are right now."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortMode("default")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={
                sortMode === "default"
                  ? { background: "#C4622D", color: "#fff", border: "1px solid #C4622D" }
                  : { background: "transparent", color: "var(--muted-foreground)", border: "1px solid var(--border)" }
              }
            >
              Default
            </button>
            <button
              onClick={() => setSortMode("popular")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={
                sortMode === "popular"
                  ? { background: "#C4622D", color: "#fff", border: "1px solid #C4622D" }
                  : { background: "transparent", color: "var(--muted-foreground)", border: "1px solid var(--border)" }
              }
            >
              <TrendingUp className="w-3 h-3" />
              Popular
            </button>
            <Link
              href="/episodes"
              className="hidden sm:flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors ml-2"
            >
              Browse all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading transformation paths…</span>
          </div>
        )}

        {isError && (
          <div className="py-24 text-center text-muted-foreground">
            Could not load transformations. Try refreshing.
          </div>
        )}

        {sorted && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {sorted.map((t) => (
              <TransformationCard
                key={t.slug}
                t={t}
                isSelected={selectedSlug === t.slug}
                onSelect={select}
                shareCount={shareCounts[t.slug] ?? 0}
              />
            ))}
          </div>
        )}

        {/* Soft next-step nudge — no ask until they're deep in a path */}
        <div className="mt-14 mb-8 text-center">
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Pick a path above and start listening. When you've made the shift yourself, there's a next step — building it at community scale.
          </p>
        </div>
      </div>
    </div>
  );
}
