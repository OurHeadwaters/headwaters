import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  Users, ExternalLink, ChevronRight, Radio, Bot, Flame, Star,
  Globe, Calendar, ArrowRight, Filter,
} from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

const ZONE_LABELS: Record<string, string> = {
  "zone-0": "Mind & Money",
  "zone-1": "Home & Prepared",
  "zone-2": "Garden",
  "zone-3": "Homestead",
  "zone-4": "Wild Harvest",
  "zone-5": "Community",
};

const ZONE_COLORS: Record<string, string> = {
  "zone-0": "border-amber-500/40 text-amber-700 bg-amber-50",
  "zone-1": "border-yellow-500/40 text-yellow-700 bg-yellow-50",
  "zone-2": "border-lime-500/40 text-lime-700 bg-lime-50",
  "zone-3": "border-green-600/40 text-green-800 bg-green-50",
  "zone-4": "border-emerald-700/40 text-emerald-900 bg-emerald-50",
  "zone-5": "border-stone-500/40 text-stone-700 bg-stone-100",
};

const ALL_ZONES = ["zone-0", "zone-1", "zone-2", "zone-3", "zone-4", "zone-5"];

interface Expert {
  id: string;
  slug: string;
  name: string;
  role: string;
  description: string;
  url: string;
  zones: string[];
  crew: string | null;
  podcastFeedUrl: string | null;
  rssSlug: string | null;
  photoUrl: string | null;
}

interface FeaturedExpert {
  id: number;
  slug: string;
  name: string;
  role: string;
  description: string;
  url: string;
  zones: string[];
  podcastFeedUrl: string | null;
  consultUrl: string | null;
  photoUrl: string | null;
  listingStatus: string;
}

function useExperts() {
  return useQuery<{ experts: Expert[] }>({
    queryKey: ["experts-all"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/experts"));
      if (!res.ok) throw new Error("Failed to load experts");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

function useFeaturedListings(zone: string) {
  return useQuery<{ featured: FeaturedExpert[] }>({
    queryKey: ["featured-listings", zone],
    queryFn: async () => {
      const url = zone
        ? apiUrl(`/expert-listings/featured?zone=${encodeURIComponent(zone)}`)
        : apiUrl("/expert-listings/featured");
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load featured listings");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

/* ─────────────────── Featured (paid) listing card ─────────────────── */
function FeaturedCard({ expert }: { expert: FeaturedExpert }) {
  const initials = expert.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="group relative flex flex-col rounded-xl border border-primary/30 bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="absolute top-3 right-3">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          <Star className="w-2.5 h-2.5" /> Featured
        </span>
      </div>

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start gap-3">
          {expert.photoUrl ? (
            <img
              src={expert.photoUrl}
              alt={expert.name}
              className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-primary/20"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm border-2 border-primary/20">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1 pr-16">
            <h3 className="font-semibold text-foreground leading-tight">{expert.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{expert.role}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
          {expert.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {expert.zones.map((z) => (
            <span
              key={z}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ZONE_COLORS[z] ?? "border-border text-muted-foreground bg-muted"}`}
            >
              {ZONE_LABELS[z] ?? z}
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-border px-5 py-3 flex items-center gap-2 flex-wrap">
        <Link
          href={`/council/${expert.slug}`}
          className="flex-1 flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          View profile <ChevronRight className="w-3.5 h-3.5" />
        </Link>
        {expert.consultUrl && (
          <a
            href={expert.consultUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-full transition-colors"
          >
            <Calendar className="w-3 h-3" /> Book Consult
          </a>
        )}
        {expert.url && !expert.consultUrl && (
          <a
            href={expert.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Globe className="w-3 h-3" /> Site
          </a>
        )}
        {expert.podcastFeedUrl && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
            <Radio className="w-2.5 h-2.5" /> Podcast
          </span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── Standard member card ─────────────────── */
function ExpertCard({ expert }: { expert: Expert }) {
  const [, navigate] = useLocation();
  const hasUrl = !!expert.url;
  const isRamsey = expert.slug === "dave-ramsey";
  const initials = expert.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start gap-3">
          {expert.photoUrl ? (
            <img
              src={expert.photoUrl}
              alt={expert.name}
              className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-primary/20"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground leading-tight">{expert.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{expert.role}</p>
              </div>
              {expert.podcastFeedUrl && (
                <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
                  <Radio className="w-2.5 h-2.5" />
                  Podcast
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
          {expert.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {expert.zones.map((z) => (
            <span
              key={z}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ZONE_COLORS[z] ?? "border-border text-muted-foreground bg-muted"}`}
            >
              {ZONE_LABELS[z] ?? z}
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-border px-5 py-3 flex items-center gap-3">
        <Link
          href={`/council/${expert.slug}`}
          className="flex-1 flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors group-hover:gap-2"
        >
          View profile <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>

        {isRamsey ? (
          <button
            onClick={() => navigate("/zones/zone-0#debt-coach-panel")}
            className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors"
          >
            <Bot className="w-3 h-3" />
            Debt Coach →
          </button>
        ) : hasUrl ? (
          <a
            href={expert.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Site
          </a>
        ) : (
          <span className="text-[10px] text-muted-foreground italic">site coming soon</span>
        )}
      </div>
    </div>
  );
}

export function CouncilPage() {
  const [zoneFilter, setZoneFilter] = useState("");
  const { data, isLoading } = useExperts();
  const { data: featuredData, isLoading: featuredLoading } = useFeaturedListings(zoneFilter);

  const experts = data?.experts ?? [];
  const featured = featuredData?.featured ?? [];

  const coreExperts = experts.filter((e) => e.crew !== "fireside-freedom");
  const firesideExperts = experts.filter((e) => e.crew === "fireside-freedom");

  const filteredCore = zoneFilter
    ? coreExperts.filter((e) => e.zones.includes(zoneFilter))
    : coreExperts;
  const filteredFireside = zoneFilter
    ? firesideExperts.filter((e) => e.zones.includes(zoneFilter))
    : firesideExperts;

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 max-w-5xl">
      <div className="mb-10">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          <Users className="w-4 h-4" />
          <span>The Stomping Path</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground">
            Expert Council
          </h1>
          <Link
            href="/council/join"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-semibold shrink-0"
          >
            <Star className="w-4 h-4" /> Get Featured →
          </Link>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          The practitioners, teachers, and producers behind The Stomping Path — a community of pragmatic, self-reliant voices covering everything from soil to solar, mindset to markets.
        </p>
      </div>

      {/* Zone filter */}
      <div className="flex flex-wrap gap-2 mb-8 items-center">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        <button
          onClick={() => setZoneFilter("")}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            !zoneFilter
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          All zones
        </button>
        {ALL_ZONES.map((z) => (
          <button
            key={z}
            onClick={() => setZoneFilter(z === zoneFilter ? "" : z)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              zoneFilter === z
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {ZONE_LABELS[z]}
          </button>
        ))}
      </div>

      {/* Featured paid listings */}
      {(featuredLoading || featured.length > 0) && (
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
              <Star className="w-4 h-4" />
              <span className="text-sm font-bold tracking-wide">Featured Practitioners</span>
            </div>
            <div className="flex-1 h-px bg-border" />
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map((expert) => (
                <FeaturedCard key={expert.slug} expert={expert} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Standard members */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-52 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : experts.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-border rounded-xl">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground">No council members found.</p>
        </div>
      ) : (
        <div className="space-y-14">
          {filteredCore.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCore.map((expert) => (
                <ExpertCard key={expert.slug} expert={expert} />
              ))}
            </div>
          )}

          {filteredFireside.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-bold tracking-wide">Fireside Freedom Crew</span>
                </div>
                <a
                  href="https://www.firesidefreedompodcast.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Listen to Fireside Freedom
                </a>
                <div className="flex-1 h-px bg-border" />
              </div>
              <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
                The hosts of the Fireside Freedom Podcast — a sister community of liberty-minded homesteaders, builders, and everyday freedom practitioners.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredFireside.map((expert) => (
                  <ExpertCard key={expert.slug} expert={expert} />
                ))}
              </div>
            </div>
          )}

          {filteredCore.length === 0 && filteredFireside.length === 0 && zoneFilter && (
            <div className="py-16 text-center border border-dashed border-border rounded-xl">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground">No council members for this zone filter.</p>
              <button onClick={() => setZoneFilter("")} className="mt-3 text-sm text-primary hover:underline">
                Clear filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* CTA for practitioners */}
      <div className="mt-16 p-8 rounded-2xl border border-primary/20 bg-primary/5 text-center">
        <h2 className="font-serif text-2xl font-bold text-foreground mb-3">Are you a practitioner?</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          Get a featured listing on the Expert Council directory. Reach thousands of self-reliant listeners who are looking for experts exactly like you.
        </p>
        <Link
          href="/council/join"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-semibold"
        >
          Apply for a featured listing <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
