import { useState, useEffect } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { 
  useSearchLibrary, 
  getSearchLibraryQueryKey, 
  useGetLibraryStats, 
  useListLibraryTags,
  useListSeries,
  SearchLibrarySort,
} from "@workspace/api-client-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { LibraryItemCard } from "@/components/library-item-card";
import { useDebounce } from "@/hooks/use-debounce";
import { Search, ChevronLeft, ChevronRight, Tag, RefreshCw, Users, ExternalLink, MapPin, ChevronRight as ChevRight, Radio, Mic, Clock, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { formatDistanceToNow, parseISO, format } from "date-fns";

type FieldNote = {
  id: string;
  sourceType: string;
  rawContent: string;
  published: boolean;
  tags: string[];
  contextUrl?: string | null;
  createdAt?: string;
  metaTitle?: string | null;
};

type ExpertResult = {
  id: string;
  name: string;
  role: string;
  description: string;
  url: string;
  zones: string[];
};

type BusinessResult = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  zones: string[];
};

function useExpertsSearch(q: string) {
  return useQuery<{ experts: ExpertResult[]; businesses: BusinessResult[] }>({
    queryKey: ["experts-search", q],
    queryFn: async () => {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const params = q ? `?q=${encodeURIComponent(q)}` : "";
      const res = await fetch(`${base}/api/experts${params}`);
      if (!res.ok) throw new Error("Failed to load experts");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!q,
  });
}

function zoneLabel(slug: string): string {
  const labels: Record<string, string> = {
    "zone-0": "Zone 0 — Self",
    "zone-1": "Zone 1 — Home",
    "zone-2": "Zone 2 — Garden",
    "zone-3": "Zone 3 — Homestead",
    "zone-4": "Zone 4 — Forest",
    "zone-5": "Zone 5 — Wild",
  };
  return labels[slug] ?? slug;
}

function FieldNoteCard({ note }: { note: FieldNote }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = note.rawContent.length > 240;
  const preview = isLong && !expanded ? note.rawContent.slice(0, 240) + "…" : note.rawContent;

  const zoneTags = note.tags.filter((t: string) => t.startsWith("zone-"));

  return (
    <div className="flex flex-col gap-2.5 p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all bg-background">
      <div className="flex items-center gap-2 flex-wrap">
        {note.sourceType === "nostr" ? (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300/60 dark:border-purple-600/40">
            <Radio className="w-2.5 h-2.5" /> Nostr
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300/60 dark:border-blue-600/40">
            <Mic className="w-2.5 h-2.5" /> Audio Memo
          </span>
        )}
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {note.createdAt ? format(new Date(note.createdAt), "MMM d, yyyy") : ""}
        </span>
      </div>

      {note.metaTitle && (
        <p className="text-xs font-semibold text-foreground">{note.metaTitle}</p>
      )}

      <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{preview}</p>

      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="self-start inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
        >
          {expanded ? <><ChevronUp className="w-2.5 h-2.5" /> Show less</> : <><ChevronDown className="w-2.5 h-2.5" /> Show more</>}
        </button>
      )}

      {(zoneTags.length > 0 || note.contextUrl) && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/50 mt-auto">
          {zoneTags.slice(0, 2).map((z: string) => (
            <Link
              key={z}
              href={`/zones/${z}`}
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {zoneLabel(z)}
            </Link>
          ))}
          {note.contextUrl && zoneTags.length === 0 && (
            <Link
              href={note.contextUrl}
              className="text-[10px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
            >
              View context <ChevRight className="w-2.5 h-2.5" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function FieldNotesSection({ notes }: { notes: FieldNote[] }) {
  if (notes.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-primary/5">
        <BookOpen className="w-4 h-4 text-primary" />
        <h2 className="font-serif font-bold text-base text-foreground">Field Notes</h2>
        <span className="ml-auto text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {notes.length}
        </span>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {notes.map((note) => (
          <FieldNoteCard key={note.id} note={note} />
        ))}
      </div>
      <div className="px-5 py-3 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground">
          Bobbie's Nostr notes and voice memos, surfaced from the field.
        </p>
      </div>
    </div>
  );
}

function PeopleAndBusinesses({ q }: { q: string }) {
  const { data, isLoading } = useExpertsSearch(q);

  const experts = data?.experts ?? [];
  const businesses = data?.businesses ?? [];

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 animate-pulse">
        <div className="h-5 w-40 bg-muted rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2].map((i) => <div key={i} className="h-24 bg-muted rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (experts.length === 0 && businesses.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-primary/5">
        <Users className="w-4 h-4 text-primary" />
        <h2 className="font-serif font-bold text-base text-foreground">
          People &amp; Businesses
        </h2>
        <span className="ml-auto text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {experts.length + businesses.length}
        </span>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {experts.map((expert) => (
          <div
            key={expert.id}
            className="flex flex-col gap-1.5 p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all bg-background"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded">Expert</span>
                </div>
                <a
                  href={expert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1 font-semibold text-sm text-foreground hover:text-primary transition-colors"
                >
                  {expert.name}
                  <ExternalLink className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                </a>
                <p className="text-xs text-muted-foreground font-medium">{expert.role}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {expert.description}
            </p>
            {expert.zones.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {expert.zones.slice(0, 3).map((z) => (
                  <Link
                    key={z}
                    href={`/zones/${z}`}
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {zoneLabel(z)}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        {businesses.map((biz) => (
          <div
            key={biz.id}
            className="flex flex-col gap-1.5 p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all bg-background"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">ULG</span>
                </div>
                <a
                  href={biz.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1 font-semibold text-sm text-foreground hover:text-primary transition-colors"
                >
                  {biz.name}
                  <ExternalLink className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                </a>
                <p className="text-xs text-muted-foreground italic">{biz.tagline}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {biz.description}
            </p>
            {biz.zones.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {biz.zones.slice(0, 3).map((z) => (
                  <Link
                    key={z}
                    href={`/zones/${z}`}
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {zoneLabel(z)}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Expert Council members and ULG-affiliated businesses
        </p>
        <Link
          href="/zones"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Browse all Zones <ChevRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function Library() {
  useDocumentMeta({
    title: "The Library — 6,000+ TSP Episodes | The Stomping Path",
    description:
      "Search Jack Spirko's entire Survival Podcast archive: 6,000+ episodes, articles, and videos on homesteading, permaculture, financial independence, and self-reliance. 2009 to today.",
    ogTitle: "The Library — The Stomping Path",
    ogDescription: "Search 6,000+ episodes on homesteading, permaculture, financial independence, and self-reliance.",
  });
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  
  const initialQ = searchParams.get("q") || "";
  const initialKind = searchParams.get("kind") || "";
  const initialTag = searchParams.get("tag") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialSeries = searchParams.get("series") || "";
  const initialSort = (searchParams.get("sort") as SearchLibrarySort) || SearchLibrarySort.newest;
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const limit = 24;

  const [searchInput, setSearchInput] = useState(initialQ);
  const debouncedSearch = useDebounce(searchInput, 300);

  const { data: stats } = useGetLibraryStats();
  const { data: tagsData } = useListLibraryTags({ limit: 24 });
  const { data: seriesData } = useListSeries();

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (initialKind) params.set("kind", initialKind);
    if (initialTag) params.set("tag", initialTag);
    if (initialCategory) params.set("category", initialCategory);
    if (initialSeries) params.set("series", initialSeries);
    if (initialSort && initialSort !== SearchLibrarySort.newest) params.set("sort", initialSort);
    if (pageParam > 1) params.set("page", pageParam.toString());
    
    const newSearch = params.toString();
    if (newSearch !== searchString && debouncedSearch !== initialQ) {
      setLocation(`${location}?${newSearch}`, { replace: true });
    }
  }, [debouncedSearch, initialKind, initialTag, initialCategory, initialSeries, initialSort, pageParam, location, searchString, setLocation, initialQ]);

  const offset = (pageParam - 1) * limit;

  const searchLibraryParams = {
    limit,
    offset,
    q: debouncedSearch || undefined,
    kind: initialKind || undefined,
    tag: initialTag || undefined,
    category: initialCategory || undefined,
    series: initialSeries || undefined,
    sort: initialSort,
    include: "field-notes",
  };

  const { data: libraryPage, isLoading, isError } = useSearchLibrary(
    searchLibraryParams,
    { 
      query: { 
        queryKey: getSearchLibraryQueryKey(searchLibraryParams),
        placeholderData: keepPreviousData
      } 
    }
  );

  const totalPages = libraryPage ? Math.ceil(libraryPage.total / limit) : 0;

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchString);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    
    if (key === 'q' && !value && params.get("sort") === SearchLibrarySort.relevance) {
       params.set("sort", SearchLibrarySort.newest);
    } else if (key === 'q' && value && !params.get("sort")) {
       params.set("sort", SearchLibrarySort.relevance);
    }
    
    setLocation(`${location}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchString);
    if (newPage > 1) {
      params.set("page", newPage.toString());
    } else {
      params.delete("page");
    }
    setLocation(`${location}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchInput("");
    setLocation(location);
  };

  const toggleKind = (kind: string) => {
    const currentKinds = initialKind ? initialKind.split(',') : [];
    let newKinds;
    if (currentKinds.includes(kind)) {
      newKinds = currentKinds.filter(k => k !== kind);
    } else {
      newKinds = [...currentKinds, kind];
    }
    updateFilter("kind", newKinds.join(','));
  };

  const isIndexing = stats && stats.totalItems < 100 || stats?.sync?.some(s => s.status === 'running' || s.status === 'never');
  const itemsSynced = stats?.totalItems || 0;

  return (
    <div className="flex flex-col w-full min-h-screen bg-background">
      {/* Hero Strip */}
      <section className="bg-card border-b border-border py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">The Library</h1>
          <p className="text-lg text-muted-foreground max-w-2xl font-medium">
            Every episode, article, and video from 2009 to today, searchable in one place.
          </p>
        </div>
      </section>

      {/* Stats Strip */}
      {stats && !isIndexing && (
        <div className="bg-primary/5 border-b border-border py-4">
          <div className="container mx-auto px-4 md:px-6 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm font-semibold text-primary/80 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span className="text-xl font-serif font-bold text-primary">{stats.totalItems.toLocaleString()}</span> items
            </div>
            <div className="h-4 w-px bg-primary/20 hidden md:block" />
            <div className="flex gap-4">
              {stats.byKind.map(k => (
                <span key={k.kind}>{k.count.toLocaleString()} {k.kind}s</span>
              ))}
            </div>
            <div className="h-4 w-px bg-primary/20 hidden md:block" />
            <div>
              2009 — {new Date().getFullYear()}
            </div>
          </div>
        </div>
      )}

      {isIndexing && (
        <div className="bg-accent/10 border-b border-accent/20 py-4">
          <div className="container mx-auto px-4 md:px-6 flex items-center gap-3 text-accent-foreground font-medium">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Indexing the archive… {itemsSynced.toLocaleString()} of ~6,000 items so far. Results may be incomplete.</span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar */}
        <aside className="lg:col-span-1 flex flex-col gap-8">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="font-serif font-bold text-lg mb-4 text-foreground">Filters</h3>
            
            {/* Kind Filters */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Format</h4>
              <div className="flex flex-col gap-2">
                {['audio', 'article', 'video'].map(k => {
                  const isActive = initialKind.split(',').includes(k);
                  return (
                    <label key={k} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary" 
                        checked={isActive}
                        onChange={() => toggleKind(k)}
                      />
                      <span className={`text-sm font-medium capitalize ${isActive ? 'text-foreground font-bold' : 'text-muted-foreground group-hover:text-foreground transition-colors'}`}>
                        {k}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Series Filters */}
            {seriesData && seriesData.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Series</h4>
                <div className="flex flex-col gap-2">
                  {seriesData.map(s => {
                    const isActive = initialSeries === s.slug;
                    return (
                      <label key={s.slug} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="series-filter"
                          className="w-4 h-4 border-border text-primary focus:ring-primary accent-primary"
                          checked={isActive}
                          onChange={() => updateFilter("series", isActive ? "" : s.slug)}
                        />
                        <span className={`text-sm font-medium ${isActive ? 'text-foreground font-bold' : 'text-muted-foreground group-hover:text-foreground transition-colors'}`}>
                          {s.iconEmoji} {s.title}
                        </span>
                      </label>
                    );
                  })}
                  {initialSeries && (
                    <button
                      onClick={() => updateFilter("series", "")}
                      className="text-xs text-primary hover:underline text-left mt-1 font-medium"
                    >
                      Clear series filter
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Sort */}
            <div className="mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Sort</h4>
              <select 
                value={initialSort} 
                onChange={(e) => updateFilter("sort", e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:outline-none"
              >
                <option value={SearchLibrarySort.newest}>Newest First</option>
                <option value={SearchLibrarySort.oldest}>Oldest First</option>
                <option value={SearchLibrarySort.relevance} disabled={!debouncedSearch}>Relevance</option>
              </select>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="font-serif font-bold text-lg mb-4 text-foreground flex items-center gap-2">
              <Tag className="w-4 h-4" /> Browse Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {tagsData?.map(tag => {
                const isActive = initialTag === tag.name;
                return (
                  <button
                    key={tag.name}
                    onClick={() => updateFilter("tag", isActive ? "" : tag.name)}
                    className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary border border-border/50'
                    }`}
                  >
                    {tag.name} <span className="opacity-70 ml-1 text-[10px]">{tag.count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Zone Resources promo */}
          <Link
            href="/zones"
            className="group block bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="font-serif font-bold text-base text-foreground group-hover:text-primary transition-colors">
                Zone Resources
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Browse Expert Council members and ULG businesses organized by permaculture zone — from Zone 0 (Self) to Zone 5 (Wild).
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
              Explore all Zones <ChevRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search 6,000+ episodes and articles — try 'permaculture', 'EMP', 'chicken coop'…"
              className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-xl text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
              }}
            />
            {searchInput && (
              <button 
                onClick={() => setSearchInput("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                &times;
              </button>
            )}
          </div>

          {(debouncedSearch || initialKind || initialTag || initialCategory || initialSeries) && !isLoading && libraryPage && (
            <div className="flex items-center justify-between text-sm font-medium text-muted-foreground bg-secondary/50 px-4 py-3 rounded-lg border border-border">
              <div>
                Found <span className="text-foreground font-bold">{libraryPage.total}</span> items
                {debouncedSearch && <span> matching "<span className="text-foreground font-bold">{debouncedSearch}</span>"</span>}
                {initialTag && <span> tagged <span className="text-foreground font-bold">{initialTag}</span></span>}
                {initialCategory && <span> in <span className="text-foreground font-bold">{initialCategory}</span></span>}
                {initialSeries && <span> in series <span className="text-foreground font-bold">{seriesData?.find(s => s.slug === initialSeries)?.title ?? initialSeries}</span></span>}
              </div>
              <button 
                onClick={clearFilters}
                className="text-primary hover:underline font-semibold"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* People & Businesses panel — shown only when there's a search query */}
          {debouncedSearch && <PeopleAndBusinesses q={debouncedSearch} />}

          {/* Field Notes — shown when results include matching field notes */}
          {(libraryPage as any)?.fieldNotes && (libraryPage as any).fieldNotes.length > 0 && (
            <FieldNotesSection notes={(libraryPage as any).fieldNotes} />
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[300px] bg-card border border-border rounded-xl animate-pulse overflow-hidden">
                  <div className="h-2 bg-muted w-full" />
                  <div className="p-5 flex flex-col gap-3">
                    <div className="h-3 bg-muted rounded w-1/3" />
                    <div className="h-5 bg-muted rounded w-4/5" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="mt-auto h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="py-20 text-center bg-card border border-border rounded-xl">
              <p className="text-destructive font-semibold">Failed to load the library. Please try again.</p>
            </div>
          ) : libraryPage?.items.length === 0 ? (
            <div className="py-24 text-center bg-card border border-border rounded-xl flex flex-col items-center justify-center">
              <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">No items found</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                We couldn't find anything matching your search. Try different keywords or clearing your filters.
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {libraryPage?.items.map(item => (
                  <LibraryItemCard key={`${item.kind}-${item.id}`} item={item} series={seriesData ?? undefined} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-8 border-t border-border/50">
                  <button
                    onClick={() => handlePageChange(pageParam - 1)}
                    disabled={pageParam <= 1}
                    className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  
                  <div className="hidden sm:flex items-center gap-1">
                    <span className="text-sm font-bold text-foreground">Page {pageParam}</span>
                    <span className="text-sm text-muted-foreground font-medium">of {totalPages}</span>
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pageParam + 1)}
                    disabled={pageParam >= totalPages}
                    className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

          {stats?.sync?.[0] && (
            <div className="mt-12 text-center space-y-1">
               <p className="text-xs text-muted-foreground font-medium">
                 Library last refreshed {stats.sync[0].finishedAt ? formatDistanceToNow(parseISO(stats.sync[0].finishedAt), { addSuffix: true }) : 'recently'}.
               </p>
               {(() => {
                 const ct = (stats as unknown as { chapterTimestamps?: { checked: number; found: number } }).chapterTimestamps;
                 if (!ct || ct.checked === 0) return null;
                 const pct = Math.round((ct.found / ct.checked) * 100);
                 return (
                   <p className="text-xs text-muted-foreground">
                     Chapter timestamps: {ct.found} of {ct.checked} checked episodes have a confirmed timestamp ({pct}%).
                   </p>
                 );
               })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
