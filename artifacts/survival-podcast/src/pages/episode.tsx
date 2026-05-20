import { useRoute } from "wouter";
import { useGetEpisode, getGetEpisodeQueryKey, useListEpisodes, getListEpisodesQueryKey } from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
import { formatDuration } from "@/components/episode-card";
import { AudioPlayer } from "@/components/audio-player";
import { EpisodeCard } from "@/components/episode-card";
import { Calendar, Clock, Tag, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import tspLogo from "@assets/tsp/tsp-logo.jpeg";

export function EpisodeDetail() {
  const [, params] = useRoute("/episodes/:slug");
  const slug = params?.slug || "";

  const { data: episode, isLoading, isError } = useGetEpisode(slug, {
    query: { enabled: !!slug, queryKey: getGetEpisodeQueryKey(slug) }
  });

  const primaryCategory = episode?.categories?.[0] || "";

  const { data: relatedEpisodes } = useListEpisodes(
    { limit: 3, category: primaryCategory },
    { query: { enabled: !!primaryCategory, queryKey: getListEpisodesQueryKey({ limit: 3, category: primaryCategory }) } }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 animate-pulse flex flex-col gap-8">
        <div className="h-8 w-24 bg-muted rounded"></div>
        <div className="h-16 w-3/4 bg-muted rounded"></div>
        <div className="h-6 w-1/2 bg-muted rounded"></div>
        <div className="h-32 bg-muted rounded-xl"></div>
        <div className="space-y-4 mt-8">
          <div className="h-4 w-full bg-muted rounded"></div>
          <div className="h-4 w-full bg-muted rounded"></div>
          <div className="h-4 w-3/4 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !episode) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-24 text-center">
        <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Episode Not Found</h2>
        <p className="text-muted-foreground mb-8">That one may have moved or never existed. There's still plenty in the archive worth digging into.</p>
        <Link href="/episodes" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
          <ChevronLeft className="w-4 h-4" /> Back to the archive
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 md:py-16">
      <Link href="/episodes" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mb-8">
        <ChevronLeft className="w-4 h-4" /> Back to the archive
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Main Content */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-muted-foreground">
              {episode.episodeNumber && (
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-sm shadow-sm">
                  EPISODE {episode.episodeNumber}
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {format(parseISO(episode.pubDate), "MMMM d, yyyy")}
              </div>
              {episode.durationSeconds ? (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {formatDuration(episode.durationSeconds)}
                </div>
              ) : null}
            </div>

            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-balance">
              {episode.title}
            </h1>
          </header>

          {episode.audioUrl && (
            <div className="my-2">
              <AudioPlayer src={episode.audioUrl} title={episode.title} />
            </div>
          )}

          <div 
            className="prose prose-stone dark:prose-invert max-w-none prose-headings:font-serif prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-xl bg-card border border-border p-6 md:p-10 rounded-xl shadow-sm"
            dangerouslySetInnerHTML={{ __html: episode.descriptionHtml || episode.summary }}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-10">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <img 
              src={episode.artworkUrl || tspLogo} 
              alt="Episode Artwork" 
              className="w-full aspect-square object-cover rounded-lg mb-6 shadow-sm border border-border/50"
            />
            
            <h3 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              Topics Discussed
            </h3>
            <div className="flex flex-wrap gap-2">
              {episode.categories?.map(cat => (
                <Link 
                  key={cat} 
                  href={`/episodes?category=${encodeURIComponent(cat)}`}
                  className="text-xs font-semibold uppercase tracking-wider bg-secondary text-secondary-foreground px-3 py-1.5 rounded hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          {relatedEpisodes?.items && relatedEpisodes.items.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="font-serif font-bold text-xl border-b border-border pb-2">
                More in {primaryCategory}
              </h3>
              <div className="flex flex-col gap-4">
                {relatedEpisodes.items.filter(ep => ep.slug !== episode.slug).slice(0, 3).map(ep => (
                  <Link key={ep.guid} href={`/episodes/${ep.slug}`} className="group flex gap-3 items-start p-3 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
                    <img src={ep.artworkUrl || tspLogo} alt="" className="w-16 h-16 rounded object-cover border border-border/50 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1">{ep.title}</h4>
                      <div className="text-xs text-muted-foreground">{format(parseISO(ep.pubDate), "MMM d, yyyy")}</div>
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