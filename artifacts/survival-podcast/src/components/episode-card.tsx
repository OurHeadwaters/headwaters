import { Episode } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { PlayCircle, Clock, Calendar, Layers } from "lucide-react";
import tspLogo from "@assets/tsp/tsp-logo.jpeg";
import { detectSeriesSlug, getSeriesMeta } from "@/lib/detect-series";
import { getSeriesTheme } from "@/lib/seriesTheme";

export function formatDuration(seconds?: number | null) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface TransformationBadgeInfo {
  slug: string;
  from: string;
  to: string;
  icon: string;
  color: string;
}

interface EpisodeCardProps {
  episode: Episode;
  featured?: boolean;
  seriesPosition?: number;
  seriesTotal?: number;
  transformation?: TransformationBadgeInfo | null;
}

export function EpisodeCard({ episode, featured = false, seriesPosition, seriesTotal, transformation }: EpisodeCardProps) {
  const isRecent = new Date().getTime() - new Date(episode.pubDate).getTime() < 7 * 24 * 60 * 60 * 1000;

  const seriesSlug = detectSeriesSlug(episode);
  const seriesMeta = seriesSlug ? getSeriesMeta(seriesSlug) : null;
  const seriesTheme = seriesSlug ? getSeriesTheme(seriesSlug) : null;

  return (
    <Link 
      href={`/episodes/${episode.slug}`}
      className={`group flex flex-col bg-card rounded-lg border border-border overflow-hidden card-lift hover:border-primary/30 ${featured ? 'md:flex-row' : ''}`}
    >
      <div className={`relative bg-muted ${featured ? 'md:w-1/3 shrink-0' : 'w-full aspect-video'}`}>
        <img 
          src={episode.artworkUrl || tspLogo} 
          alt={episode.title} 
          className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          {episode.episodeNumber && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-sm shadow-sm">
              EP {episode.episodeNumber}
            </span>
          )}
          <div className="w-10 h-10 rounded-full bg-background/90 text-primary flex items-center justify-center shadow-sm backdrop-blur-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors ml-auto">
            <PlayCircle className="w-6 h-6 ml-0.5" />
          </div>
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3 font-medium">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {format(parseISO(episode.pubDate), "MMM d, yyyy")}
          </div>
          {episode.durationSeconds ? (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(episode.durationSeconds)}
            </div>
          ) : null}
          {isRecent && !featured && (
            <span className="text-destructive font-semibold">New</span>
          )}
        </div>
        
        <h3 className="font-serif font-bold text-lg mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {episode.title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
          {episode.summary}
        </p>

        {transformation && (
          <div className="mt-auto pt-3 border-t border-border/50">
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-sm"
              style={{
                color: transformation.color,
                background: `${transformation.color}18`,
                border: `1px solid ${transformation.color}44`,
              }}
            >
              <span>{transformation.icon}</span>
              <span>{transformation.from}</span>
              <span className="opacity-50 font-normal">→</span>
              <span>{transformation.to}</span>
            </span>
          </div>
        )}

        {!transformation && seriesMeta && seriesTheme && (
          <div className="mt-auto pt-3 border-t border-border/50">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider border px-2 py-1 rounded-sm ${seriesTheme.badge}`}>
              <Layers className="w-3 h-3 shrink-0" />
              <span>{seriesMeta.emoji}</span>
              <span>{seriesMeta.name}</span>
              {seriesPosition && seriesTotal ? (
                <span className="opacity-70 font-medium normal-case tracking-normal">· {seriesPosition} of {seriesTotal}</span>
              ) : null}
            </span>
          </div>
        )}

        {!transformation && !seriesMeta && episode.categories && episode.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-border/50">
            {episode.categories.slice(0, 3).map(cat => (
              <span key={cat} className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold text-primary/80 bg-primary/5 px-2 py-1 rounded-sm">
                {cat}
              </span>
            ))}
            {episode.categories.length > 3 && (
              <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-sm">
                +{episode.categories.length - 3}
              </span>
            )}
          </div>
        )}

        {seriesMeta && episode.categories && episode.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {episode.categories.slice(0, 2).map(cat => (
              <span key={cat} className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold text-primary/80 bg-primary/5 px-2 py-1 rounded-sm">
                {cat}
              </span>
            ))}
            {episode.categories.length > 2 && (
              <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-sm">
                +{episode.categories.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
