import { Link, useLocation } from "wouter";
import { useListZones, ZoneSummary, ZoneSeriesSummary } from "@workspace/api-client-react";
import { Sprout, Loader2, Headphones, Users, Building2 } from "lucide-react";

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

const ZONE_NUMBER_LABELS = [
  "Zone 0",
  "Zone 1",
  "Zone 2",
  "Zone 3",
  "Zone 4",
  "Zone 5",
];

type ZoneSummaryExtended = ZoneSummary & {
  expertCount?: number;
  businessCount?: number;
};

export default function ZonesPage() {
  const { data: zones, isLoading, isError } = useListZones();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="flex items-center gap-2 mb-4">
            <Sprout className="w-5 h-5 text-primary" />
            <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
              The Archive, Organized
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            Browse by Zone
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Jack has always taught permaculture in zones — concentric rings of
            care and attention starting from the self outward. We've organized
            his entire archive the same way. Each zone page collects episodes to
            listen to, experts to learn from, and businesses working in that space.
          </p>
          {/* Zone diagram hint */}
          <div className="mt-8 flex items-center gap-3 flex-wrap">
            {ZONE_NUMBER_LABELS.map((label, i) => (
              <span
                key={i}
                className={`text-xs font-bold px-3 py-1 rounded-full border-2 ${ZONE_RING_COLORS[i]} ${ZONE_BG_COLORS[i]} ${ZONE_TEXT_COLORS[i]}`}
              >
                {label}
              </span>
            ))}
            <span className="text-muted-foreground text-xs">→ innermost to outermost</span>
          </div>
        </div>
      </div>

      {/* Zone cards */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {isLoading && (
          <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading zones…</span>
          </div>
        )}
        {isError && (
          <div className="py-24 text-center text-muted-foreground">
            Could not load zones. Try refreshing.
          </div>
        )}
        {zones && (
          <div className="space-y-6">
            {(zones as ZoneSummaryExtended[]).map((zone) => (
              <ZoneCard key={zone.slug} zone={zone} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ZoneCard({ zone }: { zone: ZoneSummaryExtended }) {
  const idx = zone.number;
  const ringColor = ZONE_RING_COLORS[idx] ?? "border-primary";
  const bgColor = ZONE_BG_COLORS[idx] ?? "bg-muted";
  const textColor = ZONE_TEXT_COLORS[idx] ?? "text-foreground";
  const [, navigate] = useLocation();

  return (
    <div
      onClick={() => navigate(`/zones/${zone.slug}`)}
      className={`rounded-xl border-l-4 ${ringColor} border border-border bg-card overflow-hidden group hover:shadow-md transition-shadow cursor-pointer`}
    >
        <div className="flex flex-col md:flex-row">
          {/* Left: zone number + name */}
          <div className={`${bgColor} px-6 py-6 md:w-56 shrink-0 flex flex-col justify-center`}>
            <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${textColor} opacity-70`}>
              Zone {zone.number}
            </div>
            <h2 className={`font-serif text-2xl font-bold ${textColor}`}>{zone.name}</h2>

            {/* Resource counts */}
            <div className="flex flex-col gap-1 mt-3">
              <div className={`flex items-center gap-1.5 text-xs font-medium ${textColor} opacity-60`}>
                <Headphones className="w-3 h-3" />
                <span>{zone.itemCount.toLocaleString()} episodes</span>
              </div>
              {(zone.expertCount ?? 0) > 0 && (
                <div className={`flex items-center gap-1.5 text-xs font-medium ${textColor} opacity-60`}>
                  <Users className="w-3 h-3" />
                  <span>{zone.expertCount} expert{(zone.expertCount ?? 0) !== 1 ? "s" : ""}</span>
                </div>
              )}
              {(zone.businessCount ?? 0) > 0 && (
                <div className={`flex items-center gap-1.5 text-xs font-medium ${textColor} opacity-60`}>
                  <Building2 className="w-3 h-3" />
                  <span>{zone.businessCount} business{(zone.businessCount ?? 0) !== 1 ? "es" : ""}</span>
                </div>
              )}
            </div>

            {/* Sample artwork strip */}
            {zone.sampleArtwork.length > 0 && (
              <div className="flex gap-1 mt-3">
                {zone.sampleArtwork.slice(0, 3).map((url: string, i: number) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-10 h-10 rounded object-cover opacity-80"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: description + series + CTA */}
          <div className="flex-1 p-6">
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {zone.description}
            </p>

            {/* Blockquote philosophy */}
            <blockquote className="border-l-2 border-primary/30 pl-3 text-xs italic text-muted-foreground mb-4">
              {zone.philosophy}
            </blockquote>

            {/* Series chips */}
            {zone.series.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4" onClick={(e) => e.stopPropagation()}>
                {zone.series.map((s: ZoneSeriesSummary) => (
                  <Link
                    key={s.slug}
                    href={`/series/${s.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary hover:bg-primary/15 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>{s.iconEmoji}</span>
                    <span>{s.title}</span>
                    {s.episodeCount > 0 && (
                      <span className="text-muted-foreground font-normal">
                        · {s.episodeCount}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}

            <div className="inline-flex items-center text-sm font-semibold text-primary gap-1.5 group-hover:underline">
              Explore Zone {zone.number} →
            </div>
          </div>
        </div>
      </div>
  );
}
