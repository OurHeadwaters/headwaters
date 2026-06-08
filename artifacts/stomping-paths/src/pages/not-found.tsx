import { Link } from "wouter";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-card border border-border p-10 rounded-2xl shadow-sm">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <Compass className="w-10 h-10 text-muted-foreground" />
        </div>
        
        <h1 className="font-serif text-5xl font-bold text-foreground">404</h1>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Lost in the Woods</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The page you're looking for seems to have gone off-grid. It might have been moved, deleted, or never existed in the first place.
          </p>
        </div>
        
        <div className="pt-6">
          <Link href="/" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold hover:bg-primary/90 transition-colors w-full sm:w-auto">
            Return to Basecamp
          </Link>
        </div>
      </div>
    </div>
  );
}
