import { useRoute } from "wouter";
import { useGetLibraryItem, getGetLibraryItemQueryKey } from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
import { formatDuration } from "@/components/episode-card";
import { AudioPlayer } from "@/components/audio-player";
import { LibraryItemCard } from "@/components/library-item-card";
import { Calendar, Clock, Tag, ChevronLeft, Mic, FileText, PlaySquare } from "lucide-react";
import { Link } from "wouter";
import tspLogo from "@assets/tsp/tsp-logo.jpeg";

export function LibraryItemDetail() {
  const [, params] = useRoute("/library/:slug");
  const slug = params?.slug || "";

  // Assume api.ts has useGetLibraryItem with getGetLibraryItemQueryKey
  // It returns LibraryItemDetail { bodyHtml, related }
  const { data: item, isLoading, isError } = useGetLibraryItem(slug, {
    query: { enabled: !!slug, queryKey: getGetLibraryItemQueryKey(slug) }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 animate-pulse flex flex-col gap-8">
        <div className="h-8 w-24 bg-muted rounded"></div>
        <div className="h-16 w-3/4 bg-muted rounded"></div>
        <div className="h-6 w-1/2 bg-muted rounded"></div>
        <div className="h-96 bg-muted rounded-xl"></div>
        <div className="space-y-4 mt-8">
          <div className="h-4 w-full bg-muted rounded"></div>
          <div className="h-4 w-full bg-muted rounded"></div>
          <div className="h-4 w-3/4 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-24 text-center">
        <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Item Not Found</h2>
        <p className="text-muted-foreground mb-8">This piece of the archive could not be located.</p>
        <Link href="/library" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
          <ChevronLeft className="w-4 h-4" /> Back to Library
        </Link>
      </div>
    );
  }

  const getKindIcon = () => {
    switch (item.kind) {
      case 'audio': return <Mic className="w-4 h-4" />;
      case 'video': return <PlaySquare className="w-4 h-4" />;
      case 'article': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
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

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 md:py-16">
      <Link href="/library" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mb-8">
        <ChevronLeft className="w-4 h-4" /> Back to Library
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Main Content */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-muted-foreground">
              <span className={`px-2 py-1 rounded-sm shadow-sm uppercase tracking-wider flex items-center gap-1.5 ${getKindColor()}`}>
                {getKindIcon()}
                {item.kind}
              </span>
              
              {item.episodeNumber && (
                <span className="bg-secondary text-secondary-foreground border border-border px-3 py-1 rounded-sm shadow-sm">
                  EP {item.episodeNumber}
                </span>
              )}
              
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {format(parseISO(item.publishedAt), "MMMM d, yyyy")}
              </div>
              
              {item.durationSeconds ? (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {formatDuration(item.durationSeconds)}
                </div>
              ) : item.kind === 'article' ? (
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Read
                </div>
              ) : null}
            </div>

            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-balance mt-2">
              {item.title}
            </h1>
          </header>

          {item.kind === 'audio' && item.audioUrl && (
            <div className="my-2">
              <AudioPlayer src={item.audioUrl} title={item.title} />
            </div>
          )}

          {item.kind === 'video' && item.videoId && (
            <div className="my-4 aspect-video w-full rounded-xl overflow-hidden shadow-lg border border-border bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${item.videoId}`}
                title={item.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              ></iframe>
            </div>
          )}

          <div 
            className="prose prose-stone dark:prose-invert max-w-none prose-headings:font-serif prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-xl bg-card border border-border p-6 md:p-10 rounded-xl shadow-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: item.bodyHtml || item.summary }}
          />

          {/* Categories and Tags Footer */}
          <div className="flex flex-col gap-6 mt-8 pt-8 border-t border-border">
            {item.categories && item.categories.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  {item.categories.map(cat => (
                    <Link 
                      key={cat} 
                      href={`/library?category=${encodeURIComponent(cat)}`}
                      className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1.5 rounded-md hover:bg-primary/20 transition-colors"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {item.tags && item.tags.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Tag className="w-3 h-3" /> Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <Link 
                      key={tag} 
                      href={`/library?tag=${encodeURIComponent(tag)}`}
                      className="text-xs font-medium bg-secondary text-secondary-foreground border border-border px-3 py-1.5 rounded hover:bg-muted transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-10">
          {(item.artworkUrl || item.kind !== 'video') && (
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hidden lg:block">
              {item.artworkUrl ? (
                <img 
                  src={item.artworkUrl} 
                  alt="Artwork" 
                  className="w-full aspect-square object-cover rounded-lg shadow-sm border border-border/50"
                />
              ) : (
                <div className="w-full aspect-square bg-secondary/30 rounded-lg flex items-center justify-center text-muted-foreground/30">
                  {getKindIcon()}
                </div>
              )}
            </div>
          )}

          {item.related && item.related.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="font-serif font-bold text-xl border-b border-border pb-2">
                Explore Related
              </h3>
              <div className="flex flex-col gap-4">
                {item.related.slice(0, 4).map(relatedItem => (
                  <Link key={relatedItem.id} href={`/library/${relatedItem.slug}`} className="group flex gap-3 items-start p-3 bg-card border border-border rounded-lg hover:border-accent/50 transition-colors shadow-sm">
                    {relatedItem.artworkUrl ? (
                      <img src={relatedItem.artworkUrl} alt="" className="w-16 h-16 rounded object-cover border border-border/50 shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded bg-secondary/30 border border-border/50 shrink-0 flex items-center justify-center text-muted-foreground/40">
                         {relatedItem.kind === 'audio' ? <Mic className="w-6 h-6" /> : relatedItem.kind === 'video' ? <PlaySquare className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                      </div>
                    )}
                    <div className="flex flex-col flex-1">
                      <h4 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1">{relatedItem.title}</h4>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{relatedItem.kind}</span>
                        <span className="text-xs text-muted-foreground">{format(parseISO(relatedItem.publishedAt), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
