import { useGetEpisodeStats, useGetFeaturedEpisodes, useGetFeed, useListCategories, useGetLibraryStats } from "@workspace/api-client-react";
import { Link } from "wouter";
import { EpisodeCard } from "@/components/episode-card";
import { Mic, Headphones, Users, ChevronRight, Compass, Search, Library as LibraryIcon } from "lucide-react";
import tspLogo from "@assets/tsp/tsp-logo.jpeg";

export function Home() {
  const { data: feed, isLoading: feedLoading } = useGetFeed();
  const { data: featured, isLoading: featuredLoading } = useGetFeaturedEpisodes();
  const { data: stats, isLoading: statsLoading } = useGetEpisodeStats();
  const { data: libraryStats } = useGetLibraryStats();
  const { data: categories, isLoading: categoriesLoading } = useListCategories();

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