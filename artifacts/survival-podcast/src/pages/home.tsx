import { useGetEpisodeStats, useGetFeaturedEpisodes, useGetFeed, useListCategories, useGetLibraryStats, useListSeries, getListSeriesQueryKey, useListZones, ZoneSummary } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { EpisodeCard } from "@/components/episode-card";
import { StarterEpisodes } from "@/components/starter-episodes";
import { ThisDayInHistory } from "@/components/this-day-in-history";
import { Mic, Headphones, Users, ChevronRight, Compass, Search, Library as LibraryIcon, Layers, BookOpen, Sprout, ArrowRight } from "lucide-react";
import tspLogo from "@assets/tsp/tsp-logo.jpeg";
import { getSeriesTheme } from "@/lib/seriesTheme";

const ZONE_CHIP_COLORS = [
  "border-amber-500 text-amber-700 bg-amber-50 hover:bg-amber-100",
  "border-yellow-500 text-yellow-700 bg-yellow-50 hover:bg-yellow-100",
  "border-lime-600 text-lime-700 bg-lime-50 hover:bg-lime-100",
  "border-green-600 text-green-800 bg-green-50 hover:bg-green-100",
  "border-emerald-700 text-emerald-900 bg-emerald-50 hover:bg-emerald-100",
  "border-stone-600 text-stone-700 bg-stone-100 hover:bg-stone-200",
];

type TransformationDef = {
  slug: string;
  from: string;
  to: string;
  description: string;
  color: string;
  icon: string;
};

function useTransformations() {
  return useQuery<TransformationDef[]>({
    queryKey: ["transformations"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.BASE_URL}api/transformations`.replace(/\/+/g, "/").replace(":/", "://"),
      );
      if (!res.ok) throw new Error("Failed to load transformations");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

function TransformationPathsTeaser() {
  const { data: transformations } = useTransformations();

  if (!transformations || transformations.length === 0) return null;

  const featured = transformations.slice(0, 3);

  return (
    <section>
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <Compass className="w-4 h-4" />
            <span>Codetry · Transformation Paths</span>
          </div>
          <h2 className="text-3xl font-serif font-bold text-foreground">What's your transformation?</h2>
          <p className="text-muted-foreground mt-1">Name the journey you're on and find the episodes that matter most.</p>
        </div>
        <Link
          href="/transform"
          className="hidden sm:flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          All six paths <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Featured cards — 3 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {featured.map((t) => (
          <Link
            key={t.slug}
            href={`/episodes?transformation=${encodeURIComponent(t.slug)}`}
            className="group flex flex-col rounded-xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ borderColor: t.color + "33", background: t.color + "08" }}
          >
            <div
              className="px-5 py-4 flex items-start gap-3"
              style={{ borderBottom: `1px solid ${t.color}22` }}
            >
              <span className="text-2xl leading-none mt-0.5 shrink-0">{t.icon}</span>
              <div className="min-w-0">
                <div
                  className="text-[10px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: t.color }}
                >
                  Transformation Path
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-serif text-base font-bold text-foreground leading-tight">{t.from}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: t.color }} />
                  <span className="font-serif text-base font-bold leading-tight" style={{ color: t.color }}>{t.to}</span>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 flex items-center justify-between gap-2 mt-auto">
              <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                {t.description.split(".")[0]}.
              </span>
              <ArrowRight
                className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: t.color }}
              />
            </div>
          </Link>
        ))}
      </div>

      {/* All-six chip row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">All paths:</span>
        {transformations.map((t) => (
          <Link
            key={t.slug}
            href={`/episodes?transformation=${encodeURIComponent(t.slug)}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors hover:opacity-80"
            style={{ color: t.color, borderColor: t.color + "44", background: t.color + "10" }}
          >
            <span>{t.icon}</span>
            <span>{t.from} → {t.to}</span>
          </Link>
        ))}
        <Link
          href="/transform"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors ml-1"
        >
          See all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </section>
  );
}

function ExploreByZoneStrip({ zones }: { zones: ZoneSummary[] }) {
  return (
    <div className="bg-muted/40 border-y border-border">
      <div className="container mx-auto px-4 md:px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Sprout className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Explore by Zone
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {zones.map((zone) => {
              const chipColor = ZONE_CHIP_COLORS[zone.number] ?? "border-border text-foreground bg-muted hover:bg-muted/80";
              return (
                <Link
                  key={zone.slug}
                  href={`/zones/${zone.slug}`}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${chipColor}`}
                >
                  <span className="font-bold opacity-60">Z{zone.number}</span>
                  <span>{zone.name}</span>
                </Link>
              );
            })}
          </div>
          <Link
            href="/zones"
            className="sm:ml-auto shrink-0 text-xs font-semibold text-primary hover:text-primary/80 transition-colors whitespace-nowrap flex items-center gap-1"
          >
            All zones
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Home() {
  const { data: feed, isLoading: feedLoading } = useGetFeed();
  const { data: featured, isLoading: featuredLoading } = useGetFeaturedEpisodes();
  const { data: stats, isLoading: statsLoading } = useGetEpisodeStats();
  const { data: libraryStats } = useGetLibraryStats();
  const { data: categories, isLoading: categoriesLoading } = useListCategories();
  const { data: seriesList, isLoading: seriesLoading } = useListSeries({
    query: { queryKey: getListSeriesQueryKey() },
  });
  const { data: zones } = useListZones();

  const yearsOnAir = new Date().getFullYear() - 2008;

  return (
    <div className="flex flex-col w-full">
      {/* This Day in History — primary front door */}
      <ThisDayInHistory />

      {/* Explore by Zone strip — secondary nav, below the front door */}
      {zones && zones.length > 0 && <ExploreByZoneStrip zones={zones} />}

      {/* Hero Section */}
      <section className="relative bg-primary text-primary-foreground py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1423666639041-f56000c27a9a?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/90"></div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-xs font-semibold tracking-wider uppercase mb-6 backdrop-blur-sm">
              <Mic className="w-3.5 h-3.5" />
              <span>Est. 2008 &bull; {yearsOnAir} Years on Air</span>
            </div>
            
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 text-balance text-[#FDFBF7]">
              {feed?.title || "The Survival Podcast"}
            </h1>
            
            <p className="text-xl md:text-2xl text-primary-foreground/80 mb-10 max-w-2xl font-medium leading-relaxed">
              Practical skills, honest conversations, and a community building resilient lives — whether the headlines are scary or not.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <Link 
                href="/episodes" 
                className="bg-accent text-accent-foreground px-8 py-3.5 rounded-md font-semibold hover:bg-accent/90 transition-colors shadow-sm flex items-center gap-2"
              >
                <Compass className="w-5 h-5" />
                Start Listening
              </Link>
              <Link 
                href="/about" 
                className="bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/20 px-8 py-3.5 rounded-md font-semibold hover:bg-primary-foreground/20 transition-colors backdrop-blur-sm"
              >
                How It Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="bg-card border-b border-border py-6">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left divide-x divide-border">
            <div className="px-4 first:pl-0">
              <div className="text-3xl font-serif font-bold text-foreground">
                {statsLoading ? "..." : stats?.totalEpisodes.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Episodes</div>
            </div>
            <div className="px-4">
              <div className="text-3xl font-serif font-bold text-foreground">
                {statsLoading ? "..." : stats?.latestEpisodeNumber || "3000+"}
              </div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Latest EP</div>
            </div>
            <div className="px-4">
              <div className="text-3xl font-serif font-bold text-foreground">
                {statsLoading ? "..." : stats?.episodesLast30Days || "20+"}
              </div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">This Month</div>
            </div>
            <div className="px-4">
              <div className="text-3xl font-serif font-bold text-foreground">
                {yearsOnAir}
              </div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Years Strong</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-16">
          
          {/* Library CTA */}
          <section className="bg-primary/5 border border-primary/20 rounded-2xl p-8 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <LibraryIcon className="w-48 h-48" />
            </div>
            <div className="relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-1.5 text-accent font-bold uppercase tracking-wider text-xs mb-4 bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                New Feature
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">Fifteen years in one place</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Every audio episode, written article, and YouTube video — indexed and searchable. If Jack covered it, you can find it.
              </p>
              
              {libraryStats && libraryStats.totalItems > 100 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  <div className="flex flex-col">
                    <span className="text-2xl font-serif font-bold text-primary">{libraryStats.totalItems.toLocaleString()}+</span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Total Items</span>
                  </div>
                  {libraryStats.byKind.map(k => (
                    <div key={k.kind} className="flex flex-col">
                      <span className="text-2xl font-serif font-bold text-foreground">{k.count.toLocaleString()}+</span>
                      <span className="text-xs font-semibold text-muted-foreground uppercase">{k.kind}s</span>
                    </div>
                  ))}
                </div>
              )}
              
              <Link 
                href="/library" 
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-md font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <Search className="w-5 h-5" />
                Explore the Library
              </Link>
            </div>
          </section>

          {/* Latest / Featured Rail */}
          <section>
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl font-serif font-bold text-foreground mb-2">Latest Episodes</h2>
                <p className="text-muted-foreground">What Jack's been covering this week.</p>
              </div>
              <Link href="/episodes" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                Full archive <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="flex flex-col gap-6">
              {featuredLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
                ))
              ) : (
                featured?.slice(0, 5).map(episode => (
                  <EpisodeCard key={episode.guid} episode={episode} featured={true} />
                ))
              )}
            </div>
            
            <Link href="/episodes" className="sm:hidden mt-6 flex items-center justify-center w-full py-3 bg-secondary text-secondary-foreground rounded-md font-semibold">
              Browse the full archive
            </Link>
          </section>

          {/* Transformation Paths teaser */}
          <TransformationPathsTeaser />

          {/* Learning Tracks teaser */}
          <section>
            <div
              className="rounded-2xl overflow-hidden border"
              style={{
                background: "linear-gradient(160deg, #1A3218 0%, #0F2010 100%)",
                borderColor: "#C4622D33",
              }}
            >
              <div className="p-8 md:p-10">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <div
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-3 px-3 py-1.5 rounded-full"
                      style={{
                        color: "#C4622D",
                        background: "#C4622D18",
                        border: "1px solid #C4622D33",
                      }}
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Learning Tracks</span>
                    </div>
                    <h2
                      className="font-serif text-2xl md:text-3xl font-bold leading-snug"
                      style={{ color: "#FDFBF7" }}
                    >
                      16 years of episodes,<br className="hidden sm:block" /> organized as a curriculum.
                    </h2>
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-6 max-w-xl" style={{ color: "#8FA883" }}>
                  Six tracks following the permaculture zone framework — from mindset and money
                  through homesteading, wild harvest, and contingency planning. Each track has a
                  clear arc: orientation → core skills → applied practice.
                </p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {["🧭 Mind & Money", "🏠 Prepared at Home", "🌱 Growing Your Own", "🌾 Working Homestead", "🏹 Wild Harvest", "⚡ When Things Get Hard"].map((label) => (
                    <span
                      key={label}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{
                        color: "#C8D4C0",
                        background: "#FDFBF708",
                        border: "1px solid #FDFBF715",
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/tracks"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:-translate-y-0.5"
                    style={{
                      background: "#C4622D",
                      color: "#FDFBF7",
                      boxShadow: "0 4px 16px #C4622D44",
                    }}
                  >
                    <BookOpen className="w-4 h-4" />
                    Browse the tracks
                  </Link>
                  <Link
                    href="/start"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all border"
                    style={{
                      color: "#FDFBF7",
                      borderColor: "#FDFBF730",
                      background: "#FDFBF710",
                    }}
                  >
                    New here? Start here
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Recurring Series */}
          <section>
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  <Layers className="w-4 h-4" />
                  <span>Recurring Series</span>
                </div>
                <h2 className="text-3xl font-serif font-bold text-foreground">Follow a Series</h2>
                <p className="text-muted-foreground mt-1">Themed collections you can follow start to finish.</p>
              </div>
              <Link href="/series" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                All series <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {seriesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-52 bg-muted rounded-2xl animate-pulse" />
                ))
              ) : (
                seriesList?.slice(0, 3).map((series) => {
                  const { card: colorClass, badge: badgeClass } = getSeriesTheme(series.slug);
                  return (
                    <Link
                      key={series.slug}
                      href={`/series/${series.slug}`}
                      className={`group relative flex flex-col gap-4 p-7 rounded-2xl border bg-gradient-to-br ${colorClass} hover:scale-[1.01] transition-all duration-300 hover:shadow-lg hover:shadow-black/20 overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                      {series.sampleArtworkUrl && (
                        <div className="absolute right-0 top-0 bottom-0 w-32 opacity-10 overflow-hidden pointer-events-none">
                          <img src={series.sampleArtworkUrl} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-r from-card to-transparent" />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-4 relative">
                        <div className="text-4xl leading-none">{series.iconEmoji}</div>
                        <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${badgeClass}`}>
                          {series.episodeCount} episode{series.episodeCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 relative">
                        <h3 className="font-serif text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {series.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {series.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-semibold text-primary/80 group-hover:text-primary transition-colors relative mt-auto pt-1">
                        Browse episodes
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            <Link href="/series" className="sm:hidden mt-6 flex items-center justify-center w-full py-3 bg-secondary text-secondary-foreground rounded-md font-semibold">
              View all series
            </Link>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-10">
          {/* Intro Card */}
          <div className="bg-secondary rounded-xl p-6 border border-border">
            <h3 className="font-serif font-bold text-xl mb-4 flex items-center gap-2 text-foreground">
              <Headphones className="w-5 h-5 text-primary" />
              New to the show?
            </h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Forget the bunker stereotype. TSP is about modern survivalism — building a life that's productive, independent, and genuinely good, so that when things get hard, you're ready. And when they don't, you're already winning.
            </p>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Jack covers permaculture, food production, financial independence, small business, natural medicine, firearms, investing, and a dozen other topics that actually matter to people building real lives.
            </p>
            <Link href="/about" className="inline-block border-b border-primary text-primary font-semibold text-sm pb-0.5 hover:text-primary/80 transition-colors">
              Hear how it started
            </Link>
            <StarterEpisodes />
          </div>

          {/* Top Categories */}
          <div>
            <h3 className="font-serif font-bold text-xl mb-4 flex items-center gap-2 text-foreground">
              <Users className="w-5 h-5 text-primary" />
              Find Your Starting Point
            </h3>
            <div className="flex flex-col gap-2">
              {categoriesLoading ? (
                 <div className="h-32 bg-muted rounded-md animate-pulse" />
              ) : (
                categories?.slice(0, 8).map(cat => (
                  <Link 
                    key={cat.name} 
                    href={`/episodes?category=${encodeURIComponent(cat.name)}`}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted transition-colors group"
                  >
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">{cat.name}</span>
                    <span className="text-xs font-semibold text-muted-foreground bg-background border border-border px-2 py-0.5 rounded-full">
                      {cat.count}
                    </span>
                  </Link>
                ))
              )}
            </div>
            <Link href="/categories" className="inline-flex mt-4 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              View all topics &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
