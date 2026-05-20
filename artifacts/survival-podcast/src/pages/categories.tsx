import { useListCategories } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Folder, Hash } from "lucide-react";

export function Categories() {
  const { data: categories, isLoading, isError } = useListCategories();

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center md:text-left">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">Browse by Topic</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            TSP covers a lot of ground — permaculture, firearms, small business, investing, homesteading, natural health, and more. Pick a topic and go deep.
          </p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="py-20 text-center bg-card border border-border rounded-xl">
            <p className="text-destructive font-semibold">Couldn't load the topic list right now. Try refreshing the page.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories?.map(cat => (
              <Link 
                key={cat.name}
                href={`/episodes?category=${encodeURIComponent(cat.name)}`}
                className="group flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-primary hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                    <Folder className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {cat.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded shrink-0">
                  <Hash className="w-3 h-3" />
                  {cat.count}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}