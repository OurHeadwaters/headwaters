import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ChevronLeft, ExternalLink, Radio, Mic, Users, PlayCircle, FileText, Video } from "lucide-react";

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

  return (
    <Link
      href={href}
      className="group flex gap-3 p-4 rounded-xl border border-border bg-card hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
    >
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
      {item.audioUrl && (
        <PlayCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 self-center" />
      )}
    </Link>
  );
}

export function CouncilMemberPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const { data, isLoading, isError } = useExpertProfile(slug);

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

  const { expert, ownEpisodes, tspAppearances } = data;

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
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20">
                <Radio className="w-3 h-3" />
                Has Podcast
              </span>
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
      {ownEpisodes.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <Radio className="w-4 h-4 text-accent" />
            <h2 className="font-serif text-xl font-bold text-foreground">
              {expert.name.split(" ")[0]}'s Podcast
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
        ownEpisodes.length === 0 && (
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
