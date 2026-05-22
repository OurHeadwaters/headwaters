import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Users, ExternalLink, ChevronRight, Radio, Bot, Flame } from "lucide-react";

const FIRESIDE_FREEDOM_IDS = new Set([
  "brian-aleksivich",
  "lettie-loo",
  "tim-toolman-cook",
  "ken-eash",
  "nate-erin-lamaster",
  "amy-fireside",
  "hawkins-j",
]);

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

interface Expert {
  id: string;
  slug: string;
  name: string;
  role: string;
  description: string;
  url: string;
  zones: string[];
  podcastFeedUrl: string | null;
  rssSlug: string | null;
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

function ExpertCard({ expert }: { expert: Expert }) {
  const [, navigate] = useLocation();
  const hasUrl = !!expert.url;
  const isRamsey = expert.slug === "dave-ramsey";

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
            {expert.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
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
  const { data, isLoading } = useExperts();
  const experts = data?.experts ?? [];

  const coreExperts = experts.filter((e) => !FIRESIDE_FREEDOM_IDS.has(e.slug));
  const firesideExperts = experts.filter((e) => FIRESIDE_FREEDOM_IDS.has(e.slug));

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 max-w-5xl">
      <div className="mb-10">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          <Users className="w-4 h-4" />
          <span>The Stomping Path</span>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
          Expert Council
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          The practitioners, teachers, and producers behind The Stomping Path — a community of pragmatic, self-reliant voices covering everything from soil to solar, mindset to markets.
        </p>
      </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {coreExperts.map((expert) => (
              <ExpertCard key={expert.slug} expert={expert} />
            ))}
          </div>

          {firesideExperts.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-bold tracking-wide">Fireside Freedom Crew</span>
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>
              <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
                The hosts of the Fireside Freedom Podcast — a sister community of liberty-minded homesteaders, builders, and everyday freedom practitioners.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {firesideExperts.map((expert) => (
                  <ExpertCard key={expert.slug} expert={expert} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
