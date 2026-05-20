import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useListEpisodes, getListEpisodesQueryKey } from "@workspace/api-client-react";
import { EpisodeCard } from "@/components/episode-card";
import { useDebounce } from "@/hooks/use-debounce";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";

export function Archive() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  
  const initialCategory = searchParams.get("category") || "";
  const initialQ = searchParams.get("q") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const limit = 20;

  const [searchInput, setSearchInput] = useState(initialQ);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (initialCategory) params.set("category", initialCategory);
    if (pageParam > 1) params.set("page", pageParam.toString());
    
    const newSearch = params.toString();
    if (newSearch !== searchString && debouncedSearch !== initialQ) {
      setLocation(`${location}?${newSearch}`, { replace: true });
    }
  }, [debouncedSearch, initialCategory, pageParam, location, searchString, setLocation, initialQ]);

  const offset = (pageParam - 1) * limit;

  const { data: episodePage, isLoading, isError } = useListEpisodes(
    { limit, offset, q: debouncedSearch || undefined, category: initialCategory || undefined },
    { query: { queryKey: getListEpisodesQueryKey({ limit, offset, q: debouncedSearch || undefined, category: initialCategory || undefined }) } }
  );

  const totalPages = episodePage ? Math.ceil(episodePage.total / limit) : 0;

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

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
        <div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">The Archive</h1>
          <p className="text-muted-foreground max-w-2xl">
            Browse years of survival, homesteading, and independence strategies.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search episodes..."
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          
          {initialCategory && (
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

      {(debouncedSearch || initialCategory) && !isLoading && episodePage && (
        <div className="text-sm font-medium text-muted-foreground pb-4 border-b border-border/50">
          Found <span className="text-foreground">{episodePage.total}</span> episode{episodePage.total !== 1 ? 's' : ''} 
          {debouncedSearch && <span> matching "<span className="text-foreground">{debouncedSearch}</span>"</span>}
          {initialCategory && <span> in <span className="text-foreground">{initialCategory}</span></span>}
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
          <p className="text-destructive font-semibold">Failed to load episodes. Please try again.</p>
        </div>
      ) : episodePage?.items.length === 0 ? (
        <div className="py-24 text-center bg-card border border-border rounded-xl flex flex-col items-center justify-center">
          <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="font-serif text-xl font-bold text-foreground mb-2">No episodes found</h3>
          <p className="text-muted-foreground mb-6">
            We couldn't find any episodes matching your current filters.
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
            {episodePage?.items.map(episode => (
              <EpisodeCard key={episode.guid} episode={episode} />
            ))}
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