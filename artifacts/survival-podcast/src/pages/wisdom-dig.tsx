import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Anchor, Sparkles, RefreshCw, ExternalLink, BookOpen, Globe, Twitter, Users } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface WisdomGem {
  id: number;
  nuggetId?: number;
  episodeSlug: string;
  episodeTitle: string | null;
  gemText: string;
  anchorCount: number;
  featured: boolean;
  source: string;
  attribution: string | null;
  sourceUrl: string | null;
  extractedAt: string;
  isNugget?: boolean;
}

interface GemsResponse {
  gems: WisdomGem[];
  total: number;
  limit: number;
  offset: number;
}

type SourceFilter = "all" | "episode" | "council";

const FILTER_TABS: { id: SourceFilter; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All Gems", icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: "episode", label: "From Episodes", icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: "council", label: "From the Council", icon: <Users className="w-3.5 h-3.5" /> },
];

async function fetchGems(offset = 0, source: SourceFilter = "all"): Promise<GemsResponse> {
  const sourceParam = source !== "all" ? `&source=${source}` : "";
  const res = await fetch(apiUrl(`/wisdom/gems?limit=40&offset=${offset}${sourceParam}`));
  if (!res.ok) throw new Error("Failed to load gems");
  return res.json();
}

async function anchorGem(id: number): Promise<{ anchorCount: number }> {
  const res = await fetch(apiUrl(`/wisdom/gems/anchor/${id}`), {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to anchor");
  return res.json();
}

async function triggerExtraction(): Promise<{ extracted: number; episodes: number }> {
  const res = await fetch(apiUrl("/wisdom/extract"), {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Extraction failed");
  return res.json();
}

const GEM_PALETTE = [
  "from-[#2C4A36]/10 border-[#2C4A36]/30",
  "from-[#D9A066]/10 border-[#D9A066]/40",
  "from-[#A64B36]/10 border-[#A64B36]/30",
  "from-[#E3D9CC]/60 border-[#E3D9CC]",
  "from-[#2C4A36]/8 border-[#2C4A36]/20",
];

function SourceBadge({ source, attribution }: { source: string; attribution: string | null }) {
  if (source === "x") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-sky-600 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-full">
        <Twitter className="w-2.5 h-2.5" />
        {attribution ?? "X Post"}
      </span>
    );
  }
  if (source === "website") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#2C4A36] bg-[#2C4A36]/10 border border-[#2C4A36]/20 px-1.5 py-0.5 rounded-full">
        <Globe className="w-2.5 h-2.5" />
        {attribution ?? "Council"}
      </span>
    );
  }
  return null;
}

function GemCard({
  gem,
  anchored,
  onAnchor,
}: {
  gem: WisdomGem;
  anchored: boolean;
  onAnchor: (id: number) => void;
}) {
  const idxForPalette = gem.isNugget ? (gem.nuggetId ?? 0) : gem.id;
  const palette = GEM_PALETTE[Math.abs(idxForPalette) % GEM_PALETTE.length];
  const isScraped = gem.source === "website" || gem.source === "x";

  return (
    <div
      className={`relative rounded-2xl border bg-gradient-to-br ${palette} to-transparent p-5 shadow-sm flex flex-col gap-3 card-lift`}
    >
      {gem.isNugget && (
        <div className="absolute -top-2 -right-2 bg-[#D9A066] text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shadow">
          💎 Jack's Insight
        </div>
      )}
      {!gem.isNugget && gem.featured && (
        <div className="absolute -top-2 -right-2 bg-[#D9A066] text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shadow">
          ✦ Featured
        </div>
      )}

      {isScraped && gem.attribution && (
        <div className="mb-0.5">
          <SourceBadge source={gem.source} attribution={gem.attribution} />
        </div>
      )}

      <p className="font-serif text-base leading-relaxed text-foreground italic">
        "{gem.gemText}"
      </p>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/40 gap-2">
        {gem.isNugget ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#B5853A]">
            — {gem.attribution ?? "Jack Spirko"}
          </span>
        ) : isScraped && gem.sourceUrl ? (
          <a
            href={gem.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#2C4A36] transition-colors max-w-[65%] truncate"
            title={`Source: ${gem.sourceUrl}`}
          >
            {gem.source === "x" ? (
              <Twitter className="w-3 h-3 shrink-0 text-sky-500" />
            ) : (
              <Globe className="w-3 h-3 shrink-0" />
            )}
            <span className="truncate">
              {gem.attribution ?? "Council Member"}
            </span>
            <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
          </a>
        ) : (
          <a
            href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/episodes/${gem.episodeSlug}`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#2C4A36] transition-colors max-w-[65%] truncate"
            title={gem.episodeTitle ?? gem.episodeSlug}
          >
            <BookOpen className="w-3 h-3 shrink-0" />
            <span className="truncate">{gem.episodeTitle ?? gem.episodeSlug}</span>
            <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
          </a>
        )}

        {!gem.isNugget && (
          <button
            onClick={() => !anchored && onAnchor(gem.id)}
            disabled={anchored}
            aria-label={anchored ? "Anchored" : "Anchor this gem"}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all shrink-0 ${
              anchored
                ? "bg-[#2C4A36] text-white border-[#2C4A36] cursor-default"
                : "border-[#2C4A36]/40 text-[#2C4A36] hover:bg-[#2C4A36] hover:text-white"
            }`}
          >
            <Anchor className="w-3 h-3" />
            {gem.anchorCount > 0 && <span>{gem.anchorCount}</span>}
            {anchored ? "Anchored" : "Anchor"}
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onExtract, extracting }: { onExtract: () => void; extracting: boolean }) {
  return (
    <div className="text-center py-20 flex flex-col items-center gap-5">
      <div className="text-6xl">💎</div>
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
          The dig hasn't started yet
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
          Wisdom Dig mines key phrases and soundbites from thousands of TSP episodes.
          Run the first extraction to surface the gems.
        </p>
      </div>
      <button
        onClick={onExtract}
        disabled={extracting}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2C4A36] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <Sparkles className="w-4 h-4" />
        {extracting ? "Digging…" : "Start the Dig"}
      </button>
    </div>
  );
}

export function WisdomDig() {
  const qc = useQueryClient();
  const [anchored, setAnchored] = useState<Set<number>>(new Set());
  const [extractResult, setExtractResult] = useState<{ extracted: number; episodes: number } | null>(null);
  const [activeFilter, setActiveFilter] = useState<SourceFilter>("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["wisdom-gems", activeFilter],
    queryFn: () => fetchGems(0, activeFilter),
  });

  const anchorMutation = useMutation({
    mutationFn: anchorGem,
    onSuccess: (_data, id) => {
      setAnchored((prev) => new Set(prev).add(id));
      qc.invalidateQueries({ queryKey: ["wisdom-gems"] });
    },
  });

  const extractMutation = useMutation({
    mutationFn: triggerExtraction,
    onSuccess: (result) => {
      setExtractResult(result);
      qc.invalidateQueries({ queryKey: ["wisdom-gems"] });
    },
  });

  const handleAnchor = useCallback(
    (id: number) => {
      if (!anchored.has(id)) anchorMutation.mutate(id);
    },
    [anchored, anchorMutation],
  );

  const gems = data?.gems ?? [];
  const hasGems = gems.length > 0;

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 max-w-6xl">
      <header className="mb-10 text-center">
        <div className="text-5xl mb-4">💎</div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-3">Wisdom Dig</h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
          Gems of wisdom mined from 6,000+ episodes of The Stomping Path and the Expert Council —
          principle-language pulled from Jack's best moments and the people he trusts most.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`flex items-center gap-1.5 text-sm font-medium px-3.5 py-1.5 rounded-full border transition-all ${
              activeFilter === tab.id
                ? "bg-[#2C4A36] text-white border-[#2C4A36]"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        {hasGems && (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{data?.total ?? 0}</span> gems surfaced
          </p>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {extractResult && (
            <span className="text-xs text-[#2C4A36] font-medium bg-[#2C4A36]/10 px-3 py-1 rounded-full">
              +{extractResult.extracted} new gems from {extractResult.episodes} episodes
            </span>
          )}
          <button
            onClick={() => extractMutation.mutate()}
            disabled={extractMutation.isPending}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#2C4A36]/40 text-[#2C4A36] hover:bg-[#2C4A36] hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${extractMutation.isPending ? "animate-spin" : ""}`} />
            {extractMutation.isPending ? "Digging…" : "Dig More"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-muted-foreground">
          Failed to load gems. Try refreshing.
        </div>
      ) : !hasGems ? (
        activeFilter !== "all" ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-4">🔍</div>
            <p className="font-medium text-foreground mb-1">No gems found for this filter</p>
            <p className="text-sm">
              {activeFilter === "council"
                ? "Council gems appear after running a scrape from the Wisdom Scraper admin page."
                : "Episode gems appear after running the extraction."}
            </p>
          </div>
        ) : (
          <EmptyState
            onExtract={() => extractMutation.mutate()}
            extracting={extractMutation.isPending}
          />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {gems.map((gem) => (
            <GemCard
              key={gem.id}
              gem={gem}
              anchored={anchored.has(gem.id)}
              onAnchor={handleAnchor}
            />
          ))}
        </div>
      )}

      {hasGems && (
        <div className="mt-10 p-5 rounded-xl border border-dashed border-[#D9A066]/40 bg-[#D9A066]/5 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Wisdom Dig is always growing.</span>{" "}
            Each run mines 30 more episodes. Anchor gems you want to revisit — the most
            anchored rise to the top. Council gems come from member sites and X posts.
          </p>
        </div>
      )}
    </div>
  );
}
