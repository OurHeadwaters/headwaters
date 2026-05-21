import { useState } from "react";
import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useZoneResources, type ZoneExpert, type ZoneBusiness, type ZoneResourceEpisode } from "@/hooks/use-zone-resources";
import { OdysseyBridge } from "@/components/odyssey-bridge";
import { ProductShelfSection, type ReviewedProduct } from "@/components/product-shelf";
import {
  Loader2, Headphones, Users, Building2, ExternalLink,
  ArrowLeft, ChevronRight, Play, Mic, FileText, PlaySquare,
} from "lucide-react";

type SourceFilter = "all" | "tsp" | "ulg";

const ZONE_RING_COLORS = [
  "border-amber-600",
  "border-yellow-600",
  "border-lime-600",
  "border-green-700",
  "border-emerald-800",
  "border-stone-800",
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

function EpisodeRow({ ep }: { ep: ZoneResourceEpisode }) {
  const isUlg = ep.source === "ulg";
  const href = isUlg ? ep.link : `/episodes/${ep.slug}`;

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
          <p className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {ep.title}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span>{new Date(ep.publishedAt).getFullYear()}</span>
          {ep.durationSeconds && <span>{formatDuration(ep.durationSeconds)}</span>}
          {kindIcon(ep.kind)}
          {isUlg && <ExternalLink className="w-3 h-3" />}
        </div>
      </div>
    </div>
  );

  if (isUlg) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return <Link href={href}>{inner}</Link>;
}

function ExpertCard({ expert }: { expert: ZoneExpert }) {
  return (
    <a
      href={expert.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-2 p-5 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {expert.name}
          </p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">{expert.role}</p>
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-primary/60 transition-colors" />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
        {expert.description}
      </p>
    </a>
  );
}

function BusinessCard({ biz }: { biz: ZoneBusiness }) {
  return (
    <a
      href={biz.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-2 p-5 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {biz.name}
          </p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5 italic">{biz.tagline}</p>
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-primary/60 transition-colors" />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
        {biz.description}
      </p>
    </a>
  );
}

function ShelfHeader({
  icon,
  title,
  count,
  zoneColor,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  zoneColor: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
        style={{ background: `${zoneColor}20`, color: zoneColor }}
      >
        {icon}
      </div>
      <h2 className="font-serif text-xl font-bold text-foreground">{title}</h2>
      {count > 0 && (
        <span className="ml-auto text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          {count.toLocaleString()}
        </span>
      )}
    </div>
  );
}

export default function ZoneDetailPage() {
  const [, params] = useRoute("/zones/:slug");
  const slug = params?.slug ?? "";
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  const apiSource = sourceFilter === "all" ? undefined : sourceFilter;
  const { data, isLoading, isError } = useZoneResources(slug, apiSource);

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const { data: gearProducts = [] } = useQuery<ReviewedProduct[]>({
    queryKey: ["gear-zone", slug],
    queryFn: async () => {
      const res = await fetch(`${base}/api/gear?zone=${encodeURIComponent(slug)}&limit=6`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading zone resources…</span>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Could not load this zone. Try refreshing.</p>
        <Link href="/zones" className="text-sm font-semibold text-primary hover:underline">
          ← Back to all zones
        </Link>
      </div>
    );
  }

  const { zone, episodes, episodeTotal, experts, businesses } = data;

  const idx = zone.number;
  const ringColor = ZONE_RING_COLORS[idx] ?? "border-primary";
  const bgColor = ZONE_BG_COLORS[idx] ?? "bg-muted";
  const textColor = ZONE_TEXT_COLORS[idx] ?? "text-foreground";
  const badgeColor = ZONE_BADGE_BG[idx] ?? "bg-muted border-border text-foreground";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className={`border-b border-border ${bgColor}`}>
        <div className="max-w-5xl mx-auto px-6 py-12">
          <Link
            href="/zones"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Zones
          </Link>

          <div className="flex items-start gap-5">
            {/* Zone number badge */}
            <div
              className={`shrink-0 w-16 h-16 rounded-2xl border-2 ${ringColor} ${bgColor} flex flex-col items-center justify-center`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-widest ${textColor} opacity-60`}>
                Zone
              </span>
              <span className={`text-2xl font-serif font-bold ${textColor}`}>{zone.number}</span>
            </div>

            <div className="flex-1 min-w-0">
              {/* Resource count pills */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badgeColor}`}>
                  Zone {zone.number}
                </span>
                {episodeTotal > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {episodeTotal.toLocaleString()} episodes
                  </span>
                )}
                {experts.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    · {experts.length} expert{experts.length !== 1 ? "s" : ""}
                  </span>
                )}
                {businesses.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    · {businesses.length} business{businesses.length !== 1 ? "es" : ""}
                  </span>
                )}
              </div>

              <h1 className={`font-serif text-3xl md:text-4xl font-bold ${textColor} mb-2`}>
                {zone.name}
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
                {zone.description}
              </p>
              <blockquote className="mt-3 border-l-2 border-primary/30 pl-3 text-sm italic text-muted-foreground max-w-xl">
                {zone.philosophy}
              </blockquote>
            </div>
          </div>
        </div>
      </div>

      {/* Three shelves */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-14">

        {/* Shelf 1: Listen */}
        <section>
          <ShelfHeader
            icon={<Headphones className="w-4 h-4" />}
            title="Listen"
            count={episodeTotal}
            zoneColor={zone.color}
          />
          <p className="text-sm text-muted-foreground mb-4 ml-11">
            TSP and Unloose the Goose episodes relevant to {zone.name.toLowerCase()}.
          </p>

          {/* Source filter tabs */}
          <div className="flex items-center gap-1.5 ml-11 mb-5">
            {(["all", "tsp", "ulg"] as SourceFilter[]).map((f) => {
              const label = f === "all" ? "All" : f === "tsp" ? "TSP Only" : "ULG Only";
              const active = sourceFilter === f;
              return (
                <button
                  key={f}
                  onClick={() => setSourceFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {episodes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No {sourceFilter === "tsp" ? "TSP" : sourceFilter === "ulg" ? "ULG" : ""} episodes found for this zone yet.
            </p>
          ) : (
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
              {episodes.map((ep) => (
                <EpisodeRow key={ep.id} ep={ep} />
              ))}
            </div>
          )}

          {episodeTotal > episodes.length && (
            <div className="mt-4 text-center">
              <Link
                href={`/zones/${zone.slug}/episodes`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Browse all {episodeTotal.toLocaleString()} episodes for this zone
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>

        {/* Shelf 2: Learn from (Expert Council) */}
        <section>
          <ShelfHeader
            icon={<Users className="w-4 h-4" />}
            title="Learn From"
            count={experts.length}
            zoneColor={zone.color}
          />
          <p className="text-sm text-muted-foreground mb-5 ml-11">
            Expert Council members whose work lives in {zone.name.toLowerCase()}.
          </p>

          {experts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No Expert Council members tagged for this zone yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {experts.map((expert) => (
                <ExpertCard key={expert.id} expert={expert} />
              ))}
            </div>
          )}
        </section>

        {/* Shelf 3: Businesses */}
        {businesses.length > 0 && (
          <section>
            <ShelfHeader
              icon={<Building2 className="w-4 h-4" />}
              title="Businesses in This Zone"
              count={businesses.length}
              zoneColor={zone.color}
            />
            <p className="text-sm text-muted-foreground mb-5 ml-11">
              ULG-affiliated companies operating in {zone.name.toLowerCase()}.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {businesses.map((biz) => (
                <BusinessCard key={biz.id} biz={biz} />
              ))}
            </div>
          </section>
        )}

        {/* Gear shelf */}
        {gearProducts.length > 0 && (
          <ProductShelfSection
            products={gearProducts}
            heading="Tools you may need"
            subheading={`Products Jack has reviewed for ${zone.name.toLowerCase()} — links go directly to his site.`}
            zoneColor={zone.color}
          />
        )}

        {/* Headwaters Odyssey CTA */}
        <OdysseyBridge variant="full" />
      </div>
    </div>
  );
}
