import { useGetFeed } from "@workspace/api-client-react";
import { ExternalLink, Coffee, Heart } from "lucide-react";
import tspLogo from "@assets/tsp/tsp-logo.jpeg";

export function About() {
  const { data: feed, isLoading } = useGetFeed();

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-12 flex flex-col items-center text-center">
          <img 
            src={tspLogo} 
            alt="The Stomping Path Logo" 
            className="w-32 h-32 md:w-48 md:h-48 rounded-2xl shadow-lg border-2 border-border mb-8"
          />
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            {feed?.title || "The Stomping Path"}
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-xl text-balance">
            "Helping you live a better life, if times get tough or even if they don't."
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-sm mb-12">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          ) : (
            <div 
              className="prose prose-stone dark:prose-invert max-w-none text-base md:text-lg leading-relaxed prose-p:text-muted-foreground prose-strong:text-foreground"
              dangerouslySetInnerHTML={{ __html: feed?.description?.replace(/\n/g, '<br/>') || "" }}
            />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-secondary/50 border border-secondary border-b-4 rounded-xl p-6 flex flex-col items-center text-center gap-4 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1 text-foreground">Support the Show</h3>
              <p className="text-sm text-muted-foreground mb-4">Keep TSP independent, ad-free, and running on its own terms.</p>
            </div>
            {feed?.tipUrl ? (
              <a 
                href={feed.tipUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              >
                <Coffee className="w-4 h-4" /> Tip the Host
              </a>
            ) : (
              <button disabled className="w-full py-2.5 bg-muted text-muted-foreground font-semibold rounded-md flex items-center justify-center gap-2 cursor-not-allowed">
                Tip Link Unavailable
              </button>
            )}
          </div>

          <div className="bg-secondary/50 border border-secondary border-b-4 rounded-xl p-6 flex flex-col items-center text-center gap-4 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 bg-accent/20 text-accent-foreground rounded-full flex items-center justify-center">
              <ExternalLink className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1 text-foreground">Official Website</h3>
              <p className="text-sm text-muted-foreground mb-4">Jack's main hub — forums, community resources, and more.</p>
            </div>
            <a 
              href={feed?.link || "https://thesurvivalpodcast.com"} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-card border border-border text-foreground font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-muted transition-colors mt-auto"
            >
              Visit TSP <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}