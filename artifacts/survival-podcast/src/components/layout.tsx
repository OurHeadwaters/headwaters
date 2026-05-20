import { Link, useLocation } from "wouter";
import { Menu, X, Mic } from "lucide-react";
import { useState } from "react";
import tspLogo from "@assets/tsp/tsp-logo.jpeg";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/library", label: "Library", isNew: true },
    { href: "/episodes", label: "Archive" },
    { href: "/series", label: "Series" },
    { href: "/categories", label: "Categories" },
    { href: "/about", label: "About" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src={tspLogo} alt="TSP Logo" className="w-10 h-10 rounded-md object-cover border border-border" />
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg leading-tight tracking-tight text-primary">The Survival Podcast</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold leading-none">with Jack Spirko</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm font-medium transition-colors hover:text-primary flex items-center ${
                  location === link.href || (link.href !== '/' && location.startsWith(link.href)) 
                    ? "text-primary border-b-2 border-primary py-5 -mb-[22px]" 
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
                {link.isNew && (
                  <span className="absolute -top-1 -right-4 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <button 
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-background py-4 px-4 flex flex-col gap-4 shadow-lg absolute w-full left-0">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-base font-medium px-2 py-2 rounded-md flex items-center justify-between ${
                  location === link.href || (link.href !== '/' && location.startsWith(link.href)) 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <div className="flex items-center">
                  {link.label}
                  {link.isNew && (
                    <span className="ml-2 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                      New
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border bg-card py-12 mt-auto">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src={tspLogo} alt="TSP Logo" className="w-8 h-8 rounded-sm grayscale opacity-80" />
              <span className="font-serif font-semibold text-muted-foreground">The Survival Podcast</span>
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-right max-w-sm">
              "Helping you live a better life, if times get tough or even if they don't."
            </p>
          </div>
          <div className="mt-8 pt-8 border-t border-border/50 text-xs text-muted-foreground/70 flex flex-col md:flex-row justify-between items-center gap-4">
            <span>&copy; {new Date().getFullYear()} The Survival Podcast. All rights reserved.</span>
            <span className="italic">Built for people building a life worth defending.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}