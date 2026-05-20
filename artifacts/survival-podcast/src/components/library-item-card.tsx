import { LibraryItem } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { PlayCircle, Clock, Calendar, FileText, Mic, PlaySquare, File } from "lucide-react";
import { formatDuration } from "./episode-card";

export function LibraryItemCard({ item, featured = false }: { item: LibraryItem; featured?: boolean }) {
  const isRecent = new Date().getTime() - new Date(item.publishedAt).getTime() < 7 * 24 * 60 * 60 * 1000;
  
  const getKindIcon = () => {
    switch (item.kind) {
      case 'audio': return <Mic className="w-5 h-5" />;
      case 'video': return <PlaySquare className="w-5 h-5" />;
      case 'article': return <FileText className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const getKindColor = () => {
    switch (item.kind) {
      case 'audio': return "bg-primary text-primary-foreground";
      case 'video': return "bg-destructive text-destructive-foreground";
      case 'article': return "bg-accent text-accent-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const hasArtwork = !!item.artworkUrl;

  return (
    <Link 
      href={`/library/${item.slug}`}
      className={`group flex flex-col bg-card rounded-lg border border-border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-accent/50 ${featured ? 'md:flex-row' : ''}`}
    >
      <div className={`relative bg-muted ${featured ? 'md:w-1/3 shrink-0' : 'w-full aspect-video'}`}>
        {hasArtwork ? (
          <img 
            src={item.artworkUrl!} 
            alt={item.title} 
            className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-secondary/30 flex items-center justify-center text-muted-foreground/30">
            {item.kind === 'audio' && <Mic className="w-16 h-16" />}
            {item.kind === 'video' && <PlaySquare className="w-16 h-16" />}
            {item.kind === 'article' && <FileText className="w-16 h-16" />}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm uppercase tracking-wider flex items-center gap-1 ${getKindColor()}`}>
            {getKindIcon()}
            {item.kind}
          </span>
          {item.source === 'youtube' && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm uppercase tracking-wider">
              YouTube
            </span>
          )}
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          {item.episodeNumber && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-sm shadow-sm">
              EP {item.episodeNumber}
            </span>
          )}
          {item.kind === 'audio' && (
            <div className="w-10 h-10 rounded-full bg-background/90 text-primary flex items-center justify-center shadow-sm backdrop-blur-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors ml-auto">
              <PlayCircle className="w-6 h-6 ml-0.5" />
            </div>
          )}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3 font-medium">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {format(parseISO(item.publishedAt), "MMM d, yyyy")}
          </div>
          {item.durationSeconds ? (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(item.durationSeconds)}
            </div>
          ) : item.kind === 'article' ? (
            <div className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Read
            </div>
          ) : null}
          {isRecent && !featured && (
            <span className="text-destructive font-semibold">New</span>
          )}
        </div>
        
        <h3 className="font-serif font-bold text-lg mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {item.title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
          {item.summary}
        </p>
        
        {item.categories && item.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-border/50">
            {item.categories.slice(0, 3).map(cat => (
              <span key={cat} className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold text-primary/80 bg-primary/5 px-2 py-1 rounded-sm border border-primary/10">
                {cat}
              </span>
            ))}
            {item.categories.length > 3 && (
              <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-sm border border-border">
                +{item.categories.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
