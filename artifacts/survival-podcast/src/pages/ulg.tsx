import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, PlayCircle, Clock, Calendar, Search, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { usePlayer, type PlayerEpisode } from "@/context/player-context";

const LIMIT = 20;

type LibraryItem = {
  id: string;
  source: string;
  kind: string;
  slug: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: string;
  episodeNumber: number | null;
  durationSeconds: number | null;
  audioUrl: string | null;
  audioType: string | null;
  videoUrl: string | null;
  videoId: string | null;
  artworkUrl: string | null;
  categories: string[];
  tags: string[];
};

type SearchResult = {
  items: LibraryItem[];
  total: number;
  limit: number;
  offset: number;
};

function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function useUlgEpisodes(page: number, query: string) {
  const offset = (page - 1) * LIMIT;
  return useQuery<SearchResult>({
    queryKey: ["ulg-episodes", page, query],
    queryFn: async () => {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const params = new URLSearchParams({
        source: "ulg",
        sort: "newest",
        limit: String(LIMIT),
        offset: String(offset),
      });
      if (query) params.set("q", query);
      const res = await fetch(`${base}/api/library/search?${params}`);
      if (!res.ok) throw new Error("Failed to load ULG episodes");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

function GoosePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-amber-950/60 border border-amber-800/40 text-amber-400 rounded-lg select-none ${className ?? ""}`}
      aria-hidden="true"
    >
      <span className="text-2xl">🪿</span>
    </div>
  );
}

function UlgEpisodeCard({ item, position }: { item: LibraryItem; position: number }) {
  const { load } = usePlayer();
  const [imgFailed, setImgFailed] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    if (item.audioUrl) {
      const ep: PlayerEpisode = {
        slug: item.slug,
        title: item.title,
        artworkUrl: item.artworkUrl,
        audioUrl: item.audioUrl,
        episodeNumber: item.episodeNumber,
        durationSeconds: item.durationSeconds,
      };
      load(ep);
    }
  };

  return (
    <div className="group flex gap-4 items-start bg-card border border-border rounded-xl p-4 hover:border-amber-600/40 hover:shadow-md hover:shadow-amber-900/10 transition-all duration-200">
      <div className="relative shrink-0">
        {item.artworkUrl && !imgFailed ? (
          <img
            src={item.artworkUrl}
            alt=""
            onError={() => setImgFailed(true)}
            className="w-16 h-16 rounded-lg object-cover border border-border/50"
          />
        ) : (
          <GoosePlaceholder className="w-16 h-16" />
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handlePlay}
            disabled={!item.audioUrl}
            aria-label={`Play ${item.title}`}
            className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-500 transition-colors"
          >
            <PlayCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
          <span className="bg-amber-900/30 text-amber-300 border border-amber-700/40 px-2 py-0.5 rounded text-[10px] font-bold tabular-nums">
            #{position}
          </span>
          {new Date(item.publishedAt).getTime() >= 86_400_000 && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(parseISO(item.publishedAt), "MMM d, yyyy")}
            </span>
          )}
          {item.durationSeconds && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(item.durationSeconds)}
            </span>
          )}
        </div>

        <h3 className="font-serif font-bold text-sm text-foreground group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
          {item.title}
        </h3>

        {item.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {item.summary}
          </p>
        )}

        {item.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.categories.slice(0, 3).map((cat) => (
              <span
                key={cat}
                className="text-[10px] uppercase tracking-wider font-semibold text-amber-400/70 bg-amber-900/20 px-2 py-0.5 rounded-sm"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handlePlay}
        disabled={!item.audioUrl}
        aria-label={`Play ${item.title}`}
        className="shrink-0 w-9 h-9 rounded-full border border-border text-muted-foreground/50 flex items-center justify-center hover:bg-amber-600 hover:text-white hover:border-amber-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all self-center"
      >
        <PlayCircle className="w-5 h-5" />
      </button>
    </div>
  );
}

export function UlgPage() {
  const [page, setPage] = useState(1);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(inputValue.trim(), 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const { data, isLoading, isError } = useUlgEpisodes(page, debouncedQuery);

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;
  const offset = (page - 1) * LIMIT;

  const firstArtwork = data?.items.find((i) => i.artworkUrl)?.artworkUrl;

  const isFiltering = debouncedQuery.length > 0;

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 flex flex-col gap-8">
      <Link
        href="/series"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> All Series
      </Link>

      {/* Hero */}
      <div
        className="relative rounded-2xl overflow-hidden border border-amber-800/30 bg-gradient-to-br from-amber-950/60 via-stone-900 to-stone-950 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-start"
      >
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={
            firstArtwork
              ? {
                  backgroundImage: `url(${firstArtwork})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "blur(24px)",
                }
              : {}
          }
        />

        <div className="relative shrink-0 w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden border-2 border-amber-700/40 shadow-2xl shadow-amber-900/40">
          {firstArtwork && !heroImgFailed ? (
            <img
              src={firstArtwork}
              alt="Unloose the Goose artwork"
              onError={() => setHeroImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-amber-950/80 text-amber-400">
              <span className="text-5xl md:text-6xl">🪿</span>
            </div>
          )}
        </div>

        <div className="relative flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-500/80">
            <span>🪿</span>
            <span>Podcast Series</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white leading-tight">
            Unloose the Goose
          </h1>
          <p className="text-amber-100/70 max-w-xl leading-relaxed text-base">
            A companion podcast to The Survival Podcast — candid conversations, field reports, and follow-up discussions with Jack Spirko and guests. Raw, unfiltered, and straight to the point.
          </p>

          {data && (
            <div className="flex items-center gap-3 mt-2">
              <span className="bg-amber-600/20 text-amber-400 border border-amber-600/30 px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider">
                {isFiltering
                  ? `${data.total} episode${data.total !== 1 ? "s" : ""} found`
                  : `${data.total} episode${data.total !== 1 ? "s" : ""}`}
              </span>
              {!isFiltering && (
                <span className="text-amber-100/40 text-xs">Sorted newest first</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search ULG episodes…"
          aria-label="Search ULG episodes"
          className="w-full bg-card border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-600/50 focus:border-amber-600/50 transition-all"
        />
        {inputValue && (
          <button
            onClick={() => {
              setInputValue("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Episode list */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="py-20 text-center bg-card border border-border rounded-xl">
          <p className="text-destructive font-semibold">
            Couldn't load ULG episodes right now. Give it a moment and try again.
          </p>
        </div>
      ) : data?.items.length === 0 ? (
        <div className="py-24 text-center bg-card border border-border rounded-xl flex flex-col items-center gap-4">
          <span className="text-5xl">🪿</span>
          <h3 className="font-serif text-xl font-bold text-foreground">
            {isFiltering ? "No episodes matched your search" : "No episodes found"}
          </h3>
          <p className="text-muted-foreground max-w-sm">
            {isFiltering
              ? `No ULG episodes match "${debouncedQuery}". Try different keywords.`
              : "ULG episodes haven't been synced yet. Try refreshing the library from the admin panel."}
          </p>
          {isFiltering && (
            <button
              onClick={() => setInputValue("")}
              className="mt-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {data?.items.map((item, idx) => (
              <UlgEpisodeCard
                key={item.id}
                item={item}
                position={offset + idx + 1}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8 border-t border-border/50">
              <button
                onClick={() => {
                  setPage((p) => p - 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={page <= 1}
                className="p-2 border border-border rounded-md text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1 mx-4">
                <span className="text-sm font-medium text-foreground">Page {page}</span>
                <span className="text-sm text-muted-foreground">of {totalPages}</span>
              </div>
              <button
                onClick={() => {
                  setPage((p) => p + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={page >= totalPages}
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
