import { useState, useEffect } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { useListEpisodes, useListCategories, useListZones, getListEpisodesQueryKey } from "@workspace/api-client-react";
import { EpisodeCard } from "@/components/episode-card";
import { useDebounce } from "@/hooks/use-debounce";
import { useTransformations, type Transformation } from "@/hooks/use-transformations";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { Search, Filter, ChevronLeft, ChevronRight, ArrowRight, Compass, X, Layers } from "lucide-react";

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

export function Archive() {
  useDocumentMeta({
    title: "All Episodes — TSP Archive | The Stomping Path",
    description:
      "Browse all 6,000+ episodes of The Survival Podcast — filter by zone, category, or transformation. Homesteading, permaculture, financial independence, bushcraft, and more.",
    ogTitle: "All Episodes — The Stomping Path",
    ogDescription: "6,000+ episodes on homesteading, permaculture, financial independence, and self-reliance. Filter by zone or category.",
  });
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);

  const initialCategory = searchParams.get("category") || "";
  const initialQ = searchParams.get("q") || "";
  const initialTransformation = searchParams.get("transformation") || "";
  const initialZone = searchParams.get("zone") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const limit = 20;

  const [searchInput, setSearchInput] = useState(initialQ);
  const [showTransformPicker, setShowTransformPicker] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 300);

  const { data: transformations } = useTransformations();
  const { data: zones } = useListZones();
  const activeTransformation = transformations?.find(
    (t) => t.slug === initialTransformation,
  ) ?? null;
  const activeZone = zones?.find((z) => z.slug === initialZone) ?? null;

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (initialCategory) params.set("category", initialCategory);
    if (initialTransformation) params.set("transformation", initialTransformation);
    if (initialZone) params.set("zone", initialZone);
    if (pageParam > 1) params.set("page", pageParam.toString());

    const newSearch = params.toString();
    if (newSearch !== searchString && debouncedSearch !== initialQ) {
      setLocation(`${location}?${newSearch}`, { replace: true });
    }
  }, [debouncedSearch, initialCategory, initialTransformation, initialZone, pageParam, location, searchString, setLocation, initialQ]);

  const offset = (pageParam - 1) * limit;

  // Build query params: transformation or zone filters take priority, user search overlays on top
  let queryCategory: string | undefined;
  let queryTags: string[] | undefined;
  let queryQ: string | undefined;
  let queryZone: string | undefined;

  if (activeTransformation) {
    // Combine tags + categories into a single OR filter for richer results
    const allTerms = [
      ...activeTransformation.tags,
      ...activeTransformation.categories,
    ];
    queryTags = [...new Set(allTerms.map((t) => t.toLowerCase()))];
    // User search overlays on top of the tag filter
    if (debouncedSearch) {
      queryQ = debouncedSearch;
    }
  } else if (initialZone) {
    queryZone = initialZone;
    if (debouncedSearch) {
      queryQ = debouncedSearch;
    }
  } else {
    queryCategory = initialCategory || undefined;
    queryQ = debouncedSearch || undefined;
  }

  const { data: episodePage, isLoading, isError } = useListEpisodes(
    { limit, offset, q: queryQ, category: queryCategory, tags: queryTags, zone: queryZone },
    { query: { queryKey: getListEpisodesQueryKey({ limit, offset, q: queryQ, category: queryCategory, tags: queryTags, zone: queryZone }) } },
  );

  const { data: categoryList } = useListCategories();
  const categoryDescription = initialCategory
    ? (categoryList?.find((c) => c.name.toLowerCase() === initialCategory.toLowerCase())?.description ?? null)
    : null;

  const totalPages = episodePage ? Math.ceil(episodePage.total / limit) : 0;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchString);
    if (newPage > 1) {
      params.set("page", newPage.toString());
    } else {
      params.delete("page");
    }
    setLocation(`${location}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setSearchInput("");
    setShowTransformPicker(false);
    setLocation(location);
  };

  const selectTransformation = (slug: string) => {
    const params = new URLSearchParams();
    params.set("transformation", slug);
    setLocation(`${location}?${params.toString()}`);
    setShowTransformPicker(false);
  };

  const clearTransformation = () => {
    const params = new URLSearchParams(searchString);
    params.delete("transformation");
    params.delete("page");
    const newSearch = params.toString();
    setLocation(newSearch ? `${location}?${newSearch}` : location);
  };

  const clearZone = () => {
    const params = new URLSearchParams(searchString);
    params.delete("zone");
    params.delete("page");
    const newSearch = params.toString();
    setLocation(newSearch ? `${location}?${newSearch}` : location);
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 flex flex-col gap-8">
      {/* Transformation banner */}
      {activeTransformation && (
        <div
          className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 rounded-xl border"
          style={{
            background: activeTransformation.color + "0D",
            borderColor: activeTransformation.color + "44",
          }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-2xl leading-none shrink-0">{activeTransformation.icon}</span>
            <div>
              <div
                className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                style={{ color: activeTransformation.color }}
              >
                Transformation Path
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-serif text-base font-bold text-foreground">
                  {activeTransformation.from}
                </span>
                <ArrowRight
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: activeTransformation.color }}
                />
                <span
                  className="font-serif text-base font-bold"
                  style={{ color: activeTransformation.color }}
                >
                  {activeTransformation.to}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/transform"
              className="text-xs font-semibold flex items-center gap-1 transition-colors"
              style={{ color: activeTransformation.color }}
            >
              <Compass className="w-3.5 h-3.5" />
              All paths
            </Link>
            <button
              onClick={clearTransformation}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Clear transformation filter"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Zone banner */}
      {activeZone && !activeTransformation && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 rounded-xl border border-border bg-muted/30">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 text-xs font-bold"
              style={{ background: activeZone.color + "22", color: activeZone.color, border: `1px solid ${activeZone.color}44` }}
            >
              Z{activeZone.number}
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                Zone Filter
              </div>
              <div className="font-serif text-base font-bold text-foreground">
                {activeZone.name}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/zones/${activeZone.slug}`}
              className="text-xs font-semibold flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              Zone page
            </Link>
            <button
              onClick={clearZone}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Clear zone filter"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
        <div>
          {activeTransformation ? (
            <>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Episodes for this path
              </p>
              <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
                {activeTransformation.from} → {activeTransformation.to}
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                {activeTransformation.description}
              </p>
            </>
          ) : activeZone ? (
            <>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Zone {activeZone.number} Episodes
              </p>
              <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
                {activeZone.name}
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                {activeZone.description}
              </p>
            </>
          ) : initialCategory ? (
            <>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Topic</p>
              <h1 className="font-serif text-4xl font-bold text-foreground mb-2">{initialCategory}</h1>
              <p className="text-muted-foreground max-w-2xl">
                {categoryDescription ?? "Browse every episode tagged under this topic."}
              </p>
            </>
          ) : (
            <>
              <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Episode Archive</h1>
              <p className="text-muted-foreground max-w-2xl">
                Thousands of conversations on skills, strategy, and self-reliance. Search by topic, browse by transformation, or explore straight through.
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, topic, or keyword..."
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* By Transformation toggle */}
          <button
            onClick={() => setShowTransformPicker((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm font-medium transition-all ${
              showTransformPicker || activeTransformation
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-card border-border text-foreground hover:bg-muted"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>By Transformation</span>
          </button>

          {initialCategory && !activeTransformation && !activeZone && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary border border-primary/20 rounded-md text-sm font-medium">
              <Filter className="w-4 h-4" />
              <span>{initialCategory}</span>
              <button
                onClick={clearFilters}
                className="ml-2 w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/40 transition-colors"
                aria-label="Clear category"
              >
                &times;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transformation quick-pick */}
      {showTransformPicker && transformations && (
        <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Browse by Transformation</span>
            <Link href="/transform" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              See all paths <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {transformations.map((t) => {
              const isActive = t.slug === initialTransformation;
              return (
                <button
                  key={t.slug}
                  onClick={() => selectTransformation(t.slug)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-medium transition-all"
                  style={{
                    color: isActive ? "#FDFBF7" : t.color,
                    background: isActive ? t.color : t.color + "12",
                    borderColor: isActive ? t.color : t.color + "44",
                  }}
                >
                  <span>{t.icon}</span>
                  <span>{t.from}</span>
                  <ArrowRight className="w-3 h-3 opacity-70" />
                  <span>{t.to}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {(debouncedSearch || initialCategory || activeTransformation || activeZone) && !isLoading && episodePage && (
        <div className="text-sm font-medium text-muted-foreground pb-4 border-b border-border/50">
          <span className="text-foreground">{episodePage.total}</span> episode{episodePage.total !== 1 ? "s" : ""} found
          {debouncedSearch && (
            <span> matching "<span className="text-foreground">{debouncedSearch}</span>"</span>
          )}
          {activeTransformation && (
            <span> on the <span className="text-foreground">{activeTransformation.from} → {activeTransformation.to}</span> path</span>
          )}
          {activeZone && !activeTransformation && (
            <span> in <span className="text-foreground">{activeZone.name}</span></span>
          )}
          {initialCategory && !activeTransformation && !activeZone && (
            <span> in <span className="text-foreground">{initialCategory}</span></span>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="py-20 text-center bg-card border border-border rounded-xl">
          <p className="text-destructive font-semibold">Couldn't reach the archive right now. Give it a moment and try again.</p>
        </div>
      ) : episodePage?.items.length === 0 ? (
        <div className="py-24 text-center bg-card border border-border rounded-xl flex flex-col items-center justify-center">
          <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="font-serif text-xl font-bold text-foreground mb-2">Nothing matched that search</h3>
          <p className="text-muted-foreground mb-6">
            Try a broader term, or clear the filters and browse what's in the archive.
          </p>
          <button
            onClick={clearFilters}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {episodePage?.items.map((episode) => {
              const episodeTransformation = activeTransformation
                ? activeTransformation
                : transformations
                  ? (matchTransformations(episode.categories ?? [], transformations, episode.tags ?? [])[0] ?? null)
                  : null;
              return (
                <EpisodeCard key={episode.guid} episode={episode} transformation={episodeTransformation} />
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 pt-8 border-t border-border/50">
              <button
                onClick={() => handlePageChange(pageParam - 1)}
                disabled={pageParam <= 1}
                className="p-2 border border-border rounded-md text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1 mx-4">
                <span className="text-sm font-medium text-foreground">Page {pageParam}</span>
                <span className="text-sm text-muted-foreground">of {totalPages}</span>
              </div>

              <button
                onClick={() => handlePageChange(pageParam + 1)}
                disabled={pageParam >= totalPages}
                className="p-2 border border-border rounded-md text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
