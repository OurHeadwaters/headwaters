import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { 
  useSearchLibrary, 
  getSearchLibraryQueryKey, 
  useGetLibraryStats, 
  useListLibraryTags,
  SearchLibrarySort
} from "@workspace/api-client-react";
import { keepPreviousData } from "@tanstack/react-query";
import { LibraryItemCard } from "@/components/library-item-card";
import { useDebounce } from "@/hooks/use-debounce";
import { Search, Filter, ChevronLeft, ChevronRight, Hash, Tag, RefreshCw } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

export function Library() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  
  const initialQ = searchParams.get("q") || "";
  const initialKind = searchParams.get("kind") || "";
  const initialTag = searchParams.get("tag") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialSort = (searchParams.get("sort") as SearchLibrarySort) || SearchLibrarySort.newest;
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const limit = 24;

  const [searchInput, setSearchInput] = useState(initialQ);
  const debouncedSearch = useDebounce(searchInput, 300);

  const { data: stats } = useGetLibraryStats();
  const { data: tagsData } = useListLibraryTags({ limit: 24 });

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (initialKind) params.set("kind", initialKind);
    if (initialTag) params.set("tag", initialTag);
    if (initialCategory) params.set("category", initialCategory);
    if (initialSort && initialSort !== SearchLibrarySort.newest) params.set("sort", initialSort);
    if (pageParam > 1) params.set("page", pageParam.toString());
    
    const newSearch = params.toString();
    if (newSearch !== searchString && debouncedSearch !== initialQ) {
      setLocation(`${location}?${newSearch}`, { replace: true });
    }
  }, [debouncedSearch, initialKind, initialTag, initialCategory, initialSort, pageParam, location, searchString, setLocation, initialQ]);

  const offset = (pageParam - 1) * limit;

  const searchLibraryParams = {
    limit,
    offset,
    q: debouncedSearch || undefined,
    kind: initialKind || undefined,
    tag: initialTag || undefined,
    category: initialCategory || undefined,
    sort: initialSort
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
    // reset to page 1 on filter change
    params.delete("page");
    
    // Default back to newest if search is cleared
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
            Every episode, article, and video from 2008 to today, searchable in one place.
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
              2008 — {new Date().getFullYear()}
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
                if (e.target.value && initialSort !== SearchLibrarySort.relevance) {
                   // Let debounce handle sort update? Or immediate? Let's rely on updateFilter in debounce
                }
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

          {(debouncedSearch || initialKind || initialTag || initialCategory) && !isLoading && libraryPage && (
            <div className="flex items-center justify-between text-sm font-medium text-muted-foreground bg-secondary/50 px-4 py-3 rounded-lg border border-border">
              <div>
                Found <span className="text-foreground font-bold">{libraryPage.total}</span> items
                {debouncedSearch && <span> matching "<span className="text-foreground font-bold">{debouncedSearch}</span>"</span>}
                {initialTag && <span> tagged <span className="text-foreground font-bold">{initialTag}</span></span>}
                {initialCategory && <span> in <span className="text-foreground font-bold">{initialCategory}</span></span>}
              </div>
              <button 
                onClick={clearFilters}
                className="text-primary hover:underline font-semibold"
              >
                Clear all filters
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[300px] bg-muted rounded-xl animate-pulse" />
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
                  <LibraryItemCard key={`${item.kind}-${item.id}`} item={item} />
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
            <div className="mt-12 text-center">
               <p className="text-xs text-muted-foreground font-medium">
                 Library last refreshed {stats.sync[0].finishedAt ? formatDistanceToNow(parseISO(stats.sync[0].finishedAt), { addSuffix: true }) : 'recently'}.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
