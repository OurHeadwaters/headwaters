import { useGetEpisode } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Play, Clock } from "lucide-react";
import { STARTER_EPISODES } from "@/data/starter-episodes";
import { formatDuration } from "./episode-card";

function StarterEpisodeRow({ slug, label }: { slug: string; label: string }) {
  const { data: episode, isLoading, isError } = useGetEpisode(slug);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-2 animate-pulse">
        <div className="w-6 h-6 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-muted rounded w-3/4" />
          <div className="h-2.5 bg-muted rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (isError || !episode) {
    return null;
  }

  const duration = formatDuration(episode.durationSeconds);

  return (
    <Link
      href={`/episodes/${episode.slug}`}
      className="flex items-start gap-3 py-2.5 px-2 -mx-2 rounded-md hover:bg-background/60 transition-colors group"
    >
      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Play className="w-3 h-3 ml-0.5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {episode.title
            .replace(/&#8211;/g, "–")
            .replace(/&#8212;/g, "—")
            .replace(/&#8217;/g, "'")
            .replace(/&#8216;/g, "'")
            .replace(/&#8220;/g, "\u201C")
            .replace(/&#8221;/g, "\u201D")
            .replace(/&#038;/g, "&")
            .replace(/&amp;/g, "&")
            .replace(/&#\d+;/g, "")
            .replace(/\s*[–—-]\s*(?:Epi[-\s]?\d{2,5}|TSP\s+Rewind\s*[-–—]?\s*Epi[-\s]?\d{2,5})\s*$/i, "")
            .trim()}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-primary/70 bg-primary/8 px-1.5 py-0.5 rounded-sm border border-primary/15">
            {label}
          </span>
          {duration && (
            <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <Clock className="w-2.5 h-2.5" />
              {duration}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function StarterEpisodes() {
  return (
    <div className="mt-5 pt-5 border-t border-border/60">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
        Start here &rarr;
      </p>
      <div className="flex flex-col divide-y divide-border/40">
        {STARTER_EPISODES.map(({ slug, label }) => (
          <StarterEpisodeRow key={slug} slug={slug} label={label} />
        ))}
      </div>
    </div>
  );
}
