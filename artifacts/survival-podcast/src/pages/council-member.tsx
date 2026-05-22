import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { ChevronLeft, ExternalLink, Radio, Mic, Users, PlayCircle, PauseCircle, FileText, Video, Rss, X } from "lucide-react";
import { usePlayer } from "@/context/player-context";

const FEED_URL = "https://feeds.captivate.fm/fireside-freedom/";

const PODCAST_PLATFORMS = [
  {
    name: "Apple Podcasts",
    url: `https://podcasts.apple.com/search?term=Fireside+Freedom`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.5c4.142 0 7.5 3.358 7.5 7.5 0 4.142-3.358 7.5-7.5 7.5S4.5 16.142 4.5 12c0-4.142 3.358-7.5 7.5-7.5zm0 2a5.5 5.5 0 100 11 5.5 5.5 0 000-11zm0 2c1.93 0 3.5 1.57 3.5 3.5S13.93 15.5 12 15.5 8.5 13.93 8.5 12s1.57-3.5 3.5-3.5zm0 1.5a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
    color: "text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100",
  },
  {
    name: "Spotify",
    url: `https://open.spotify.com/search/Fireside%20Freedom`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    ),
    color: "text-green-600 bg-green-50 border-green-200 hover:bg-green-100",
  },
  {
    name: "Pocket Casts",
    url: `https://pca.st/itunes/search?q=Fireside+Freedom`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm4.25 16.5a.75.75 0 01-.75-.75 3.5 3.5 0 10-7 0 .75.75 0 01-1.5 0 5 5 0 1110 0 .75.75 0 01-.75.75zm2.5-2a.75.75 0 01-.75-.75 6 6 0 10-12 0 .75.75 0 01-1.5 0 7.5 7.5 0 1115 0 .75.75 0 01-.75.75zM12 13a1 1 0 100-2 1 1 0 000 2z" />
      </svg>
    ),
    color: "text-red-600 bg-red-50 border-red-200 hover:bg-red-100",
  },
  {
    name: "RSS Feed",
    url: FEED_URL,
    icon: <Rss className="w-5 h-5" />,
    color: "text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100",
  },
];

function SubscribePicker({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div
        ref={ref}
        className="relative w-full max-w-sm bg-background rounded-2xl shadow-2xl border border-border p-6"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Radio className="w-4 h-4 text-accent" />
          <h2 className="font-serif text-lg font-bold text-foreground">
            Subscribe to Fireside Freedom
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Pick your podcast app to follow the show.
        </p>

        <div className="flex flex-col gap-2">
          {PODCAST_PLATFORMS.map((platform) => (
            <a
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-medium text-sm transition-colors ${platform.color}`}
              onClick={onClose}
            >
              {platform.icon}
              {platform.name}
              <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-50" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
>>>>>>> efbc680 (feat: subscription picker modal for Fireside Freedom (task #512))

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

interface ContentItem {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  artworkUrl: string | null;
  publishedAt: string | null;
  durationSeconds: number | null;
  audioUrl: string | null;
  episodeNumber: number | null;
  kind: string;
  source: string;
  guid: string;
}

interface ProfileData {
  expert: Expert;
  ownEpisodes: ContentItem[];
  firesideEpisodes: ContentItem[];
  tspAppearances: ContentItem[];
}

function useExpertProfile(slug: string) {
  return useQuery<ProfileData>({
    queryKey: ["expert-profile", slug],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/experts/${encodeURIComponent(slug)}`));
      if (!res.ok) throw new Error("Expert not found");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function OwnEpisodeCard({ item }: { item: ContentItem }) {
  const href = item.kind === "audio" ? `/episodes/${item.slug}` : `/library/${item.slug}`;
  const pubDate = item.publishedAt ? new Date(item.publishedAt) : null;
  const dateStr = pubDate ? pubDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
  const { load, toggle, episode: activeEpisode, isPlaying } = usePlayer();

  const isThisEpisodePlaying = isPlaying && activeEpisode?.audioUrl === item.audioUrl;
  const isThisEpisodeLoaded = activeEpisode?.audioUrl === item.audioUrl;

  function handlePlayPause(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!item.audioUrl) return;
    if (isThisEpisodeLoaded) {
      toggle();
    } else {
      load({
        title: item.title,
        audioUrl: item.audioUrl,
        artworkUrl: item.artworkUrl,
        slug: item.slug,
        episodeNumber: item.episodeNumber,
        durationSeconds: item.durationSeconds,
      }, true);
    }
  }

  return (
    <div className="group flex gap-3 p-4 rounded-xl border border-border bg-card hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200">
      <Link href={href} className="flex gap-3 flex-1 min-w-0">
        {item.artworkUrl ? (
          <img
            src={item.artworkUrl}
            alt={item.title}
            className="w-14 h-14 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {item.kind === "audio" ? (
              <Mic className="w-5 h-5 text-primary/40" />
            ) : item.kind === "video" ? (
              <Video className="w-5 h-5 text-primary/40" />
            ) : (
              <FileText className="w-5 h-5 text-primary/40" />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {item.episodeNumber && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Ep. {item.episodeNumber}
            </span>
          )}
          <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
            {dateStr && <span>{dateStr}</span>}
            {item.durationSeconds && (
              <>
                <span>·</span>
                <span>{formatDuration(item.durationSeconds)}</span>
              </>
            )}
          </div>
        </div>
      </Link>
      {item.audioUrl && (
        <button
          onClick={handlePlayPause}
          aria-label={isThisEpisodePlaying ? "Pause episode" : "Play episode"}
          className="text-muted-foreground hover:text-primary transition-colors shrink-0 self-center"
        >
          {isThisEpisodePlaying ? (
            <PauseCircle className="w-6 h-6 text-primary" />
          ) : (
            <PlayCircle className="w-6 h-6 group-hover:text-primary transition-colors" />
          )}
        </button>
      )}
    </div>
  );
}

function FiresideEpisodeCard({
  item,
  playingId,
  onPlay,
}: {
  item: ContentItem;
  playingId: number | null;
  onPlay: (id: number | null) => void;
}) {
  const pubDate = item.publishedAt ? new Date(item.publishedAt) : null;
  const dateStr = pubDate ? pubDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
  const playing = playingId === item.id;
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!playing) {
      audioRef.current?.pause();
    }
  }, [playing]);

  function handlePlayPause(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      onPlay(null);
    } else {
      audio.play();
      onPlay(item.id);
    }
  }

  const externalHref = (item as any).link || (!item.audioUrl ? "#" : undefined);

  return (
    <div className="group rounded-xl border border-border bg-card hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="flex gap-3 p-4">
        {item.artworkUrl ? (
          <img
            src={item.artworkUrl}
            alt={item.title}
            className="w-14 h-14 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 text-accent/40" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded">
              Fireside
            </span>
            {item.episodeNumber && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Ep. {item.episodeNumber}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2">
            {item.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
            {dateStr && <span>{dateStr}</span>}
            {item.durationSeconds && (
              <>
                <span>·</span>
                <span>{formatDuration(item.durationSeconds)}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-center">
          {item.audioUrl && (
            <button
              onClick={handlePlayPause}
              aria-label={playing ? "Pause episode" : "Play episode"}
              className="text-accent hover:text-accent/80 transition-colors"
            >
              {playing ? (
                <PauseCircle className="w-7 h-7" />
              ) : (
                <PlayCircle className="w-7 h-7" />
              )}
            </button>
          )}
          {externalHref && (
            <a
              href={externalHref}
              target="_blank"
              rel="noreferrer"
              aria-label="Open episode page"
              className="text-muted-foreground hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
      {item.audioUrl && (
        <div className={`px-4 pb-3 ${playing ? "" : "hidden"}`}>
          <audio
            ref={audioRef}
            src={item.audioUrl}
            controls
            className="w-full h-8"
            onEnded={() => { if (playingId === item.id) onPlay(null); }}
            onPause={() => { if (playingId === item.id) onPlay(null); }}
            onPlay={() => onPlay(item.id)}
          />
        </div>
      )}
    </div>
  );
}

export function CouncilMemberPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const { data, isLoading, isError } = useExpertProfile(slug);
  const [playingFiresideId, setPlayingFiresideId] = useState<number | null>(null);
  const [showSubscribePicker, setShowSubscribePicker] = useState(false);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
        <div className="space-y-4">
          <div className="h-8 w-40 bg-muted rounded animate-pulse" />
          <div className="h-12 w-72 bg-muted rounded animate-pulse" />
          <div className="h-24 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-4xl text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-3">Member not found</h1>
        <p className="text-muted-foreground mb-6">That expert profile doesn't exist or couldn't be loaded.</p>
        <Link href="/council" className="text-primary hover:text-primary/80 font-semibold">
          ← Back to Expert Council
        </Link>
      </div>
    );
  }

  const { expert, ownEpisodes, firesideEpisodes = [], tspAppearances } = data;

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 md:py-14 max-w-4xl">
      <Link
        href="/council"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ChevronLeft className="w-4 h-4" />
        Expert Council
      </Link>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row gap-6 mb-10">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-2xl">
          {expert.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              {expert.name}
            </h1>
            {expert.podcastFeedUrl && (
              <>
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20">
                  <Radio className="w-3 h-3" />
                  Has Podcast
                </span>
                <a
                  href={expert.podcastFeedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  <Rss className="w-3 h-3" />
                  Subscribe
                </a>
              </>
            )}
          </div>
          <p className="text-base text-muted-foreground font-medium mb-3">{expert.role}</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {expert.zones.map((z) => (
              <span
                key={z}
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${ZONE_COLORS[z] ?? "border-border text-muted-foreground bg-muted"}`}
              >
                {ZONE_LABELS[z] ?? z}
              </span>
            ))}
          </div>
          <p className="text-base text-muted-foreground leading-relaxed mb-4">{expert.description}</p>
          {expert.url ? (
            <a
              href={expert.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {expert.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground italic">
              Site coming soon
            </span>
          )}
        </div>
      </div>

      {/* Own Podcast Episodes */}
      {expert.podcastFeedUrl && ownEpisodes.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <Radio className="w-4 h-4 text-accent" />
            <h2 className="font-serif text-xl font-bold text-foreground">
              From {expert.name.split(" ")[0]}'s Podcast
            </h2>
            <span className="ml-1 text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {ownEpisodes.length} episode{ownEpisodes.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {ownEpisodes.slice(0, 20).map((item) => (
              <OwnEpisodeCard key={item.id} item={item} />
            ))}
          </div>
          {ownEpisodes.length > 20 && (
            <p className="mt-4 text-sm text-muted-foreground text-center">
              Showing 20 of {ownEpisodes.length} episodes
            </p>
          )}
        </section>
      )}

      {/* Fireside Freedom Episodes */}
      {firesideEpisodes.length > 0 && (
        <section className="mb-12">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <Radio className="w-4 h-4 text-accent" />
            <h2 className="font-serif text-xl font-bold text-foreground">
              Their Episodes
            </h2>
            <span className="ml-1 text-xs font-semibold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full">
              Fireside Freedom
            </span>
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {firesideEpisodes.length} episode{firesideEpisodes.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => setShowSubscribePicker(true)}
              className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-accent border border-accent/40 bg-accent/5 hover:bg-accent/10 transition-colors px-3 py-1.5 rounded-full"
            >
              <Rss className="w-3.5 h-3.5" />
              Subscribe to Fireside Freedom
            </button>
            {showSubscribePicker && (
              <SubscribePicker onClose={() => setShowSubscribePicker(false)} />
            )}
          </div>
          <div className="grid grid-cols-1 gap-3">
            {firesideEpisodes.slice(0, 20).map((item) => (
              <FiresideEpisodeCard
                key={item.id}
                item={item}
                playingId={playingFiresideId}
                onPlay={setPlayingFiresideId}
              />
            ))}
          </div>
          {firesideEpisodes.length > 20 && (
            <p className="mt-4 text-sm text-muted-foreground text-center">
              Showing 20 of {firesideEpisodes.length} episodes
            </p>
          )}
        </section>
      )}

      {/* TSP Appearances */}
      {tspAppearances.length > 0 ? (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Mic className="w-4 h-4 text-primary" />
            <h2 className="font-serif text-xl font-bold text-foreground">
              TSP Appearances
            </h2>
            <span className="ml-1 text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {tspAppearances.length} episode{tspAppearances.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {tspAppearances.slice(0, 20).map((ep) => (
              <OwnEpisodeCard key={ep.id} item={ep} />
            ))}
          </div>
          {tspAppearances.length > 20 && (
            <p className="mt-4 text-sm text-muted-foreground text-center">
              Showing 20 of {tspAppearances.length} appearances
            </p>
          )}
        </section>
      ) : (
        ownEpisodes.length === 0 && firesideEpisodes.length === 0 && (
          <div className="py-16 text-center border border-dashed border-border rounded-xl">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground text-sm">
              No episodes indexed yet for this member.
            </p>
          </div>
        )
      )}
    </div>
  );
}
