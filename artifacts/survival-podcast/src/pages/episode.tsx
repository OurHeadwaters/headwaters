import { useRoute } from "wouter";
import { useGetEpisode, getGetEpisodeQueryKey, useListEpisodes, getListEpisodesQueryKey, useListSeries, getListSeriesQueryKey, useGetSeriesEpisodes, getGetSeriesEpisodesQueryKey } from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
import { formatDuration } from "@/components/episode-card";
import { AudioPlayer } from "@/components/audio-player";
import { Calendar, Clock, Tag, ChevronLeft, ChevronRight, Layers, MapPin, BookOpen, Copy, Check } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import tspLogo from "@assets/tsp/tsp-logo.jpeg";
import { decodeHtml } from "@/lib/decode-html";
import { detectSeriesSlug, getSeriesMeta } from "@/lib/detect-series";
import { getSeriesTheme } from "@/lib/seriesTheme";
import { useTransformations, type Transformation } from "@/hooks/use-transformations";
import { matchZones, type ZoneMeta } from "@/lib/zones";
import { HistorySegmentPlayer } from "@/components/history-segment-player";
import type { HistorySegment } from "@workspace/api-client-react";

function matchTransformations(
  episodeCategories: string[],
  transformations: Transformation[],
): Transformation[] {
  const lowerCats = episodeCategories.map((c) => c.toLowerCase());
  return transformations.filter((t) => {
    const tLower = [...t.tags, ...t.categories].map((s) => s.toLowerCase());
    return lowerCats.some((c) => tLower.includes(c));
  });
}

function HistoryLessonCard({
  episode,
  historySegment,
}: {
  episode: {
    slug: string;
    title: string;
    audioUrl?: string | null;
    artworkUrl?: string | null;
    episodeNumber?: number | null;
    durationSeconds?: number | null;
  };
  historySegment: HistorySegment;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!historySegment.lessonText) return;
    navigator.clipboard.writeText(historySegment.lessonText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-xl border border-amber-300/50 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/20 p-5 md:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
            History Lesson
          </span>
        </div>
        {historySegment.lessonText && (
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors border border-amber-300/60 dark:border-amber-600/40 rounded-lg px-2.5 py-1"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy lesson
              </>
            )}
          </button>
        )}
      </div>

      {historySegment.lessonText ? (
        <blockquote className="text-sm leading-relaxed text-amber-900 dark:text-amber-100 italic border-l-2 border-amber-400/60 pl-4">
          {historySegment.lessonText}
        </blockquote>
      ) : (
        <p className="text-sm text-amber-700 dark:text-amber-400 italic">
          Listen to the segment for Jack's history lesson.
        </p>
      )}

      {episode.audioUrl && historySegment.startSeconds > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-amber-700/70 dark:text-amber-400/70 font-medium">
            <Clock className="w-3 h-3" />
            Listen to just the history segment
          </div>
          <HistorySegmentPlayer
            audioUrl={episode.audioUrl}
            startSeconds={historySegment.startSeconds}
            endSeconds={historySegment.endSeconds}
            episode={episode}
          />
        </div>
      )}
      {episode.audioUrl && historySegment.startSeconds === 0 && (
        <p className="text-xs text-amber-700/70 dark:text-amber-400/60 italic">
          This historical event is covered in the full episode.
        </p>
      )}
    </div>
  );
}

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

  const { data: seriesList } = useListSeries(undefined, {
    query: { queryKey: getListSeriesQueryKey() }
  });

  const { data: transformations } = useTransformations();

  const matchedTransformations =
    episode && transformations
      ? matchTransformations(episode.categories, transformations)
      : [];

  const matchedZones: ZoneMeta[] =
    episode
      ? matchZones(episode.categories ?? [], episode.categories ?? [])
      : [];

  const episodeSeriesSlug = episode?.seriesSlug ?? null;
  const episodeSeries = episodeSeriesSlug
    ? seriesList?.find((s) => s.slug === episodeSeriesSlug)
    : null;
  const seriesTheme = episodeSeries ? getSeriesTheme(episodeSeries.slug) : null;

  const { data: seriesEpisodesData } = useGetSeriesEpisodes(
    episodeSeriesSlug ?? "",
    { limit: 500, offset: 0 },
    {
      query: {
        enabled: !!episodeSeriesSlug,
        queryKey: getGetSeriesEpisodesQueryKey(episodeSeriesSlug ?? "", { limit: 500, offset: 0 }),
      },
    }
  );

  const seriesEpisodes = seriesEpisodesData?.items ?? [];
  const currentSeriesIndex = episode
    ? seriesEpisodes.findIndex((ep) => ep.slug === episode.slug)
    : -1;
  const positionInSeries = episode?.positionInSeries ?? (currentSeriesIndex >= 0 ? currentSeriesIndex + 1 : null);
  const totalInSeries = seriesEpisodesData?.total ?? null;
  const prevSeriesEpisode = currentSeriesIndex > 0 ? seriesEpisodes[currentSeriesIndex - 1] : null;
  const nextSeriesEpisode =
    currentSeriesIndex >= 0 && currentSeriesIndex < seriesEpisodes.length - 1
      ? seriesEpisodes[currentSeriesIndex + 1]
      : null;

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
              {new Date(episode.pubDate).getTime() >= 86_400_000 && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {format(parseISO(episode.pubDate), "MMMM d, yyyy")}
                </div>
              )}
              {episode.durationSeconds ? (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {formatDuration(episode.durationSeconds)}
                </div>
              ) : null}
              {episodeSeries && positionInSeries && totalInSeries && (
                <Link
                  href={`/series/${episodeSeries.slug}`}
                  className={`inline-flex items-center gap-1.5 ${seriesTheme!.badge} px-3 py-1 rounded-full hover:opacity-90 transition-colors font-bold text-xs uppercase tracking-wider`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{episodeSeries.iconEmoji}</span>
                  Part of: {episodeSeries.title} ({positionInSeries} of {totalInSeries}) →
                </Link>
              )}
              {episodeSeries && !positionInSeries && (
                <Link
                  href={`/series/${episodeSeries.slug}`}
                  className={`inline-flex items-center gap-1.5 ${seriesTheme!.badge} px-3 py-1 rounded-full hover:opacity-90 transition-colors font-bold text-xs uppercase tracking-wider`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{episodeSeries.iconEmoji}</span>
                  Part of: {episodeSeries.title} →
                </Link>
              )}
              {matchedTransformations.map((t) => (
                <Link
                  key={t.slug}
                  href={`/episodes?transformation=${encodeURIComponent(t.slug)}`}
                  className="inline-flex items-center gap-1.5 border px-2.5 py-1 rounded-full font-bold text-xs uppercase tracking-wider transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: `${t.color}18`,
                    borderColor: `${t.color}40`,
                    color: t.color,
                  }}
                >
                  <span className="text-sm leading-none">{t.icon}</span>
                  {t.from} → {t.to}
                </Link>
              ))}
            </div>

            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-balance">
              {decodeHtml(episode.title)}
            </h1>
          </header>

          {episode.audioUrl && (
            <div className="my-2">
              <AudioPlayer episode={{
                title: episode.title,
                audioUrl: episode.audioUrl,
                artworkUrl: episode.artworkUrl,
                slug: episode.slug,
                episodeNumber: episode.episodeNumber,
                durationSeconds: episode.durationSeconds,
              }} />
            </div>
          )}

          {episode.historySegment && (
            <HistoryLessonCard
              episode={{
                slug: episode.slug,
                title: episode.title,
                audioUrl: episode.audioUrl,
                artworkUrl: episode.artworkUrl,
                episodeNumber: episode.episodeNumber,
                durationSeconds: episode.durationSeconds,
              }}
              historySegment={episode.historySegment as HistorySegment}
            />
          )}

          {/* Series prev/next navigation */}
          {episodeSeries && (prevSeriesEpisode || nextSeriesEpisode) && (
            <div className="flex items-stretch gap-3 border border-border rounded-xl overflow-hidden bg-card">
              {prevSeriesEpisode ? (
                <Link
                  href={`/episodes/${prevSeriesEpisode.slug}`}
                  className="group flex-1 flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors min-w-0 border-r border-border"
                >
                  <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                      {episodeSeries.iconEmoji} Previous in series
                    </span>
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {prevSeriesEpisode.title}
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="flex-1 border-r border-border" />
              )}
              {nextSeriesEpisode ? (
                <Link
                  href={`/episodes/${nextSeriesEpisode.slug}`}
                  className="group flex-1 flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors min-w-0 text-right justify-end"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                      Next in series {episodeSeries.iconEmoji}
                    </span>
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {nextSeriesEpisode.title}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </Link>
              ) : (
                <div className="flex-1" />
              )}
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

            {episodeSeries && seriesTheme && (
              <div className="mb-5">
                <Link
                  href={`/series/${episodeSeries.slug}`}
                  className={`flex items-center gap-3 p-3 rounded-lg ${seriesTheme.badge} hover:opacity-90 transition-colors group`}
                >
                  <span className="text-2xl leading-none">{episodeSeries.iconEmoji}</span>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <Layers className="w-3 h-3" />
                      Part of Series
                    </div>
                    <span className="font-serif font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                      {episodeSeries.title}
                    </span>
                    {positionInSeries && totalInSeries && (
                      <span className="text-xs text-muted-foreground font-medium">
                        Episode {positionInSeries} of {totalInSeries}
                      </span>
                    )}
                  </div>
                  <ChevronLeft className="w-4 h-4 text-primary rotate-180 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              </div>
            )}


            {matchedZones.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  <MapPin className="w-3 h-3" />
                  Zone Resources
                </div>
                <div className="flex flex-col gap-2">
                  {matchedZones.map((zone) => (
                    <Link
                      key={zone.slug}
                      href={`/zones/${zone.slug}`}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors group hover:shadow-sm"
                      style={{
                        backgroundColor: `${zone.color}10`,
                        borderColor: `${zone.color}30`,
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs font-bold"
                        style={{ background: `${zone.color}25`, color: zone.color }}
                      >
                        {zone.number}
                      </div>
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="text-xs font-bold text-foreground leading-tight">
                          Zone {zone.number} — {zone.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          Experts &amp; businesses
                        </span>
                      </div>
                      <ChevronRight
                        className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity shrink-0"
                        style={{ color: zone.color }}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}


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
                {relatedEpisodes.items.filter(ep => ep.slug !== episode.slug).slice(0, 3).map(ep => {
                  const relSeriesSlug = detectSeriesSlug(ep);
                  const relSeriesMeta = relSeriesSlug ? getSeriesMeta(relSeriesSlug) : null;
                  const relSeriesTheme = relSeriesSlug ? getSeriesTheme(relSeriesSlug) : null;
                  return (
                    <Link key={ep.guid} href={`/episodes/${ep.slug}`} className="group flex gap-3 items-start p-3 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
                      <img src={ep.artworkUrl || tspLogo} alt="" className="w-16 h-16 rounded object-cover border border-border/50 shrink-0" />
                      <div className="flex flex-col gap-1 min-w-0">
                        <h4 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">{ep.title}</h4>
                        {new Date(ep.pubDate).getTime() >= 86_400_000 && (
                          <div className="text-xs text-muted-foreground">{format(parseISO(ep.pubDate), "MMM d, yyyy")}</div>
                        )}
                        {relSeriesMeta && relSeriesTheme && (
                          <span
                            title={`Part of the ${relSeriesMeta.name} series`}
                            aria-label={`Series: ${relSeriesMeta.name}`}
                            className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider border px-1.5 py-0.5 rounded-sm w-fit ${relSeriesTheme.badge}`}
                          >
                            <Layers className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                            <span aria-hidden="true">{relSeriesMeta.emoji}</span>
                            <span>{relSeriesMeta.name}</span>
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
