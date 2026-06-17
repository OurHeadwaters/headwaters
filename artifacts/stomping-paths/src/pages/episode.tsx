import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useGetEpisode, getGetEpisodeQueryKey, useListEpisodes, getListEpisodesQueryKey, useListSeries, getListSeriesQueryKey, useGetSeriesEpisodes, getGetSeriesEpisodesQueryKey, useListSuiteCreators, useListSuiteKits } from "@workspace/api-client-react";
import type { SuiteCreator, SuiteKit } from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
import { formatDuration } from "@/components/episode-card";
import { AudioPlayer } from "@/components/audio-player";
import { Calendar, Clock, Tag, ChevronLeft, ChevronRight, Layers, MapPin, BookOpen, Copy, Check, Package, ArrowRight, ExternalLink } from "lucide-react";
import { KIT_META, LINK_OUT_KITS } from "@/hooks/use-kits";
import { Link } from "wouter";
import { useState } from "react";
import { SharedNoteBanner } from "@/components/share-modal";
import { ProductShelf, type ReviewedProduct } from "@/components/product-shelf";
import tspLogo from "@assets/tsp/tsp-logo.jpeg";
import { decodeHtml } from "@/lib/decode-html";
import { detectSeriesSlug, getSeriesMeta } from "@/lib/detect-series";
import { getSeriesTheme } from "@/lib/seriesTheme";
import { useTransformations, type Transformation } from "@/hooks/use-transformations";
import { OdysseyBridge } from "@/components/odyssey-bridge";
import { matchZones, type ZoneMeta } from "@/lib/zones";
import { HistorySegmentPlayer } from "@/components/history-segment-player";
import type { HistorySegment } from "@workspace/api-client-react";

function matchTransformations(
  episodeCategories: string[],
  transformations: Transformation[],
  episodeTags?: string[],
): Transformation[] {
  const lowerCats = episodeCategories.map((c) => c.toLowerCase());
  const lowerTags = (episodeTags ?? []).map((t) => t.toLowerCase());
  const episodeTerms = [...lowerCats, ...lowerTags];
  return transformations.filter((t) => {
    const tLower = [...t.tags, ...t.categories].map((s) => s.toLowerCase());
    return episodeTerms.some((term) => tLower.includes(term));
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
  const [noteBannerDismissed, setNoteBannerDismissed] = useState(false);
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );
  const sharedNote = searchParams.get("note");
  const sharedFrom = searchParams.get("from");
  const urlTransformationSlug = searchParams.get("transformation");

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

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const { data: gearProducts = [] } = useQuery<ReviewedProduct[]>({
    queryKey: ["gear-episode", slug],
    queryFn: async () => {
      const res = await fetch(`${base}/api/gear?episode=${encodeURIComponent(slug)}&limit=3`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!slug,
  });

  const contentMatchedTransformations =
    episode && transformations
      ? matchTransformations(episode.categories, transformations, episode.tags)
      : [];

  const urlTransformation =
    urlTransformationSlug && transformations
      ? transformations.find((t) => t.slug === urlTransformationSlug) ?? null
      : null;

  const matchedTransformations = (() => {
    if (!urlTransformation) return contentMatchedTransformations;
    const alreadyIncluded = contentMatchedTransformations.some(
      (t) => t.slug === urlTransformation.slug,
    );
    if (alreadyIncluded) return contentMatchedTransformations;
    return [urlTransformation, ...contentMatchedTransformations];
  })();

  const matchedZones: ZoneMeta[] =
    episode
      ? matchZones(episode.categories ?? [], episode.categories ?? [])
      : [];

  const { data: allCreators = [] } = useListSuiteCreators();
  const { data: allKits = [] } = useListSuiteKits();

  const EPISODE_ZONE_KIT_MAP: Record<string, string> = {
    "zone-0": "care-kit", "zone-1": "budget-kit", "zone-2": "family-kit",
    "zone-3": "council-kit", "zone-4": "producer-kit", "zone-5": "physical-kit",
  };
  const tSlugs = matchedTransformations.map((t) => t.slug);
  const zoneKitSlugs = matchedZones.map((z) => EPISODE_ZONE_KIT_MAP[z.slug]).filter(Boolean);
  const sidebarCreators: SuiteCreator[] = (() => {
    const byTransformation = allCreators.filter(
      (c) => c.transformationSlugs.some((s) => tSlugs.includes(s))
    );
    if (byTransformation.length > 0) return byTransformation.slice(0, 2);
    const byZoneKit = allCreators.filter(
      (c) => c.kitSlugs.some((k) => zoneKitSlugs.includes(k))
    );
    return byZoneKit.slice(0, 2);
  })();
  const sidebarKit: SuiteKit | null =
    allKits.find((k) => k.transformationSlugs.some((s) => tSlugs.includes(s)))
    ?? allKits.find((k) => zoneKitSlugs.includes(k.slug))
    ?? null;

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
    <div>
      {sharedNote && !noteBannerDismissed && (
        <SharedNoteBanner
          note={sharedNote}
          from={sharedFrom}
          accentColor={matchedTransformations[0]?.color ?? "#5C9E5C"}
          onDismiss={() => setNoteBannerDismissed(true)}
        />
      )}
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
                  href={`/transform/${t.slug}`}
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

            {sidebarCreators[0] && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {sidebarCreators[0].avatarUrl ? (
                  <img
                    src={sidebarCreators[0].avatarUrl}
                    alt={sidebarCreators[0].name}
                    className={`w-5 h-5 rounded-full object-cover border border-border shrink-0 ${sidebarCreators[0].status === "coming-soon" ? "opacity-50 grayscale" : ""}`}
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground border border-border shrink-0">
                    {sidebarCreators[0].name.charAt(0)}
                  </div>
                )}
                <span className="font-medium text-foreground/70">{sidebarCreators[0].name}</span>
                {sidebarCreators[0].status === "coming-soon" && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground border border-border rounded-sm px-1 py-px">
                    coming soon
                  </span>
                )}
              </div>
            )}
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

          {(episode as any).historySegment && (
            <HistoryLessonCard
              episode={{
                slug: episode.slug,
                title: episode.title,
                audioUrl: episode.audioUrl,
                artworkUrl: episode.artworkUrl,
                episodeNumber: episode.episodeNumber,
                durationSeconds: episode.durationSeconds,
              }}
              historySegment={(episode as any).historySegment as HistorySegment}
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


            {gearProducts.length > 0 && (
              <div className="mb-5 -mx-6 px-6">
                <ProductShelf
                  products={gearProducts}
                  heading="Gear mentioned or related"
                  compact
                />
              </div>
            )}

            {/* Creator chips — voices on this path */}
            {sidebarCreators.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  <ExternalLink className="w-3 h-3" />
                  Trusted voices on this path
                </div>
                <div className="flex flex-col gap-2">
                  {sidebarCreators.map((creator) => {
                    const isComingSoon = creator.status === "coming-soon";
                    const inner = (
                      <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors group">
                        {creator.avatarUrl ? (
                          <img
                            src={creator.avatarUrl}
                            alt={creator.name}
                            className={`w-7 h-7 rounded-full object-cover shrink-0 border border-border ${isComingSoon ? "opacity-50 grayscale" : ""}`}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold text-muted-foreground border border-border">
                            {creator.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-foreground leading-tight block truncate">{creator.name}</span>
                          {isComingSoon && (
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">coming soon</span>
                          )}
                        </div>
                        {!isComingSoon && (
                          <ArrowRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                        )}
                      </div>
                    );
                    if (!isComingSoon && creator.websiteUrl) {
                      return (
                        <a key={creator.slug} href={creator.websiteUrl} target="_blank" rel="noopener noreferrer">
                          {inner}
                        </a>
                      );
                    }
                    return <div key={creator.slug}>{inner}</div>;
                  })}
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

          {/* Kit easy-button — always at a glance, outside the main card */}
          {sidebarKit && (() => {
            const meta = KIT_META[sidebarKit.slug] ?? { icon: "📦", color: "#6B7280" };
            const isInquiry = LINK_OUT_KITS.has(sidebarKit.slug);
            return (
              <div
                className="rounded-xl border p-4 flex flex-col gap-3"
                style={{
                  borderColor: `${meta.color}44`,
                  background: `linear-gradient(135deg, ${meta.color}12 0%, ${meta.color}05 100%)`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: meta.color }}>
                      Easy button
                    </div>
                    <p className="font-serif font-bold text-sm text-foreground leading-tight line-clamp-1">{sidebarKit.name}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{sidebarKit.tagline}</p>
                <Link
                  href={`/kits/${sidebarKit.slug}`}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition-all hover:-translate-y-px"
                  style={{ color: "#fff", background: meta.color, boxShadow: `0 4px 14px ${meta.color}35` }}
                >
                  <Package className="w-3.5 h-3.5" />
                  {isInquiry ? "Inquire about this kit" : `Get ${sidebarKit.name}`}
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <p className="text-[10px] text-muted-foreground text-center -mt-1">
                  Ready to move faster? This kit packages the path.
                </p>
              </div>
            );
          })()}

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

          <FieldNotesSection slug={slug} />

          <OdysseyBridge variant="compact" />
        </div>
      </div>
    </div>
    </div>
  );
}

/* ── "From the Field" section ─────────────────────────────────────── */

type FieldNote = {
  id: number;
  sourceType: string;
  rawContent: string;
  metaTitle?: string | null;
  tags: string[];
  createdAt: string;
  metaUrl?: string | null;
  metaImageUrl?: string | null;
};

type FieldNoteSource = "all" | "nostr" | "audio" | "youtube";

const FIELD_NOTE_SOURCE_FILTERS: { value: FieldNoteSource; label: string }[] = [
  { value: "all", label: "All" },
  { value: "nostr", label: "Nostr" },
  { value: "audio", label: "Audio" },
  { value: "youtube", label: "YouTube" },
];

function FieldNotesSection({ slug }: { slug: string }) {
  const [open, setOpen] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<FieldNoteSource>("all");
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  const { data: allNotes = [] } = useQuery<FieldNote[]>({
    queryKey: ["field-notes-episode", slug],
    queryFn: async () => {
      const res = await fetch(
        `${base}/api/field-notes?episode=${encodeURIComponent(slug)}`,
      );
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!slug,
  });

  const { data: filteredNotes = [] } = useQuery<FieldNote[]>({
    queryKey: ["field-notes-episode", slug, sourceFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ episode: slug });
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      const res = await fetch(`${base}/api/field-notes?${params}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!slug && sourceFilter !== "all",
  });

  const notes = sourceFilter === "all" ? allNotes : filteredNotes;

  if (allNotes.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-6 py-4 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-foreground font-serif">
            From the Field
          </span>
          <span className="text-xs font-semibold bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full">
            {allNotes.length}
          </span>
        </div>
        {open ? (
          <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-90" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-muted-foreground -rotate-90" />
        )}
      </button>

      {open && (
        <div className="border-t border-border">
          <div className="flex items-center gap-1.5 px-6 py-3 border-b border-border">
            {FIELD_NOTE_SOURCE_FILTERS.map((f) => {
              const active = sourceFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setSourceFilter(f.value)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No {sourceFilter} notes for this episode yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {notes.map((note) => (
                <FieldNoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FieldNoteCard({ note }: { note: FieldNote }) {
  const [expanded, setExpanded] = useState(false);
  const isYouTube = note.sourceType === "youtube";
  const isLong = note.rawContent.length > 320;
  const preview =
    isLong && !expanded ? note.rawContent.slice(0, 320) + "…" : note.rawContent;

  const dateStr = (() => {
    try {
      return new Date(note.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  })();

  const badge = isYouTube ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300/50">
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5V8.5l6.25 3.5-6.25 3.5z" />
      </svg>
      YouTube
    </span>
  ) : note.sourceType === "nostr" ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300/50">
      Nostr
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300/50">
      Audio Memo
    </span>
  );

  const cardContent = (
    <div className={`px-6 py-4 flex flex-col gap-2 ${isYouTube && note.metaUrl ? "hover:bg-muted/30 transition-colors" : ""}`}>
      {isYouTube && note.metaImageUrl && (
        <img
          src={note.metaImageUrl}
          alt=""
          className="w-full aspect-video object-cover rounded-lg border border-border/50"
        />
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {badge}
        {dateStr && (
          <span className="text-xs text-muted-foreground">{dateStr}</span>
        )}
        {isYouTube && note.metaUrl && (
          <span className="ml-auto text-xs font-semibold text-red-600 dark:text-red-400">
            Watch on YouTube →
          </span>
        )}
      </div>
      {isYouTube && note.metaTitle && (
        <p className="text-sm font-semibold text-foreground leading-snug">
          {note.metaTitle}
        </p>
      )}
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {preview}
      </p>
      {isLong && !isYouTube && (
        <button
          onClick={(e) => { e.preventDefault(); setExpanded((v) => !v); }}
          className="self-start text-xs font-semibold text-primary hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );

  if (isYouTube && note.metaUrl) {
    return (
      <a href={note.metaUrl} target="_blank" rel="noopener noreferrer">
        {cardContent}
      </a>
    );
  }

  return <div>{cardContent}</div>;
}
