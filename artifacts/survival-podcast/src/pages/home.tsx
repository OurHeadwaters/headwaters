import { useGetEpisodeStats, useGetFeaturedEpisodes, useGetFeed, useListCategories, useGetLibraryStats, useListSeries, getListSeriesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { EpisodeCard } from "@/components/episode-card";
import { StarterEpisodes } from "@/components/starter-episodes";
import { Mic, Headphones, Users, ChevronRight, Compass, Search, Library as LibraryIcon, Layers } from "lucide-react";
import tspLogo from "@assets/tsp/tsp-logo.jpeg";

const SERIES_COLORS: Record<string, string> = {
  "unloose-the-goose": "from-amber-900/40 to-amber-800/20 border-amber-700/30",
  "13-stomps": "from-stone-900/40 to-stone-800/20 border-stone-700/30",
  "tuesday-chats": "from-emerald-900/40 to-emerald-800/20 border-emerald-700/30",
  history: "from-indigo-900/40 to-indigo-800/20 border-indigo-700/30",
};

const SERIES_BADGE_COLORS: Record<string, string> = {
  "unloose-the-goose": "bg-amber-900/30 text-amber-300 border-amber-700/40",
  "13-stomps": "bg-stone-800/50 text-stone-300 border-stone-600/40",
  "tuesday-chats": "bg-emerald-900/30 text-emerald-300 border-emerald-700/40",
  history: "bg-indigo-900/30 text-indigo-300 border-indigo-700/40",
};

export function Home() {
  const { data: feed, isLoading: feedLoading } = useGetFeed();
  const { data: featured, isLoading: featuredLoading } = useGetFeaturedEpisodes();
  const { data: stats, isLoading: statsLoading } = useGetEpisodeStats();
  const { data: libraryStats } = useGetLibraryStats();
  const { data: categories, isLoading: categoriesLoading } = useListCategories();
  const { data: seriesList, isLoading: seriesLoading } = useListSeries({
    query: { queryKey: getListSeriesQueryKey() },
  });

  const yearsOnAir = new Date().getFullYear() - 2008;

  return (
    <div className="flex flex-col w-full">
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
                  const colorClass = SERIES_COLORS[series.slug] ?? "from-zinc-900/40 to-zinc-800/20 border-zinc-700/30";
                  const badgeClass = SERIES_BADGE_COLORS[series.slug] ?? "bg-zinc-800/50 text-zinc-300 border-zinc-600/40";
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