import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import tspLogo from "@assets/tsp/tsp-logo.jpeg";
import { MiniPlayer } from "./mini-player";
import { usePlayer } from "@/context/player-context";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { episode } = usePlayer();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/library", label: "Library", isNew: true },
    { href: "/tracks", label: "Tracks" },
    { href: "/zones", label: "Zones" },
    { href: "/transform", label: "Transform" },
    { href: "/episodes", label: "Archive" },
    { href: "/series", label: "Series" },
    { href: "/about", label: "About" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
      {/* Forest-green header */}
      <header className="sticky top-0 z-50 w-full bg-[#2C4A36] shadow-md">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src={tspLogo} alt="TSP Logo" className="w-10 h-10 rounded-md object-cover border-2 border-white/20" />
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg leading-tight tracking-tight text-white">The Survival Podcast</span>
              <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold leading-none">with Jack Spirko</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-5">
            {navLinks.map((link) => {
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-sm font-medium transition-colors flex items-center pb-0.5 ${
                    isActive
                      ? "text-white border-b-2 border-[#D9A066]"
                      : "text-white/65 hover:text-white"
                  }`}
                >
                  {link.label}
                  {link.isNew && (
                    <span className="absolute -top-1 -right-4 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D9A066] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D9A066]"></span>
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <button
            className="md:hidden p-2 text-white/70 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-[#1e3428] border-t border-white/10 py-4 px-4 flex flex-col gap-1 shadow-xl absolute w-full left-0">
            {navLinks.map((link) => {
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-base font-medium px-3 py-2.5 rounded-md flex items-center ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                  {link.isNew && (
                    <span className="ml-2 bg-[#D9A066] text-[#2C4A36] text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                      New
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      <main className={`flex-1 flex flex-col transition-[padding]${episode ? " pb-20" : ""}`}>
        {children}
      </main>

      <footer className={`border-t border-border bg-[#2C4A36] text-white py-12 mt-auto${episode ? " pb-24" : ""}`}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src={tspLogo} alt="TSP Logo" className="w-8 h-8 rounded-sm opacity-80" />
              <span className="font-serif font-semibold text-white/80">The Survival Podcast</span>
            </div>
            <p className="text-sm text-white/60 text-center md:text-right max-w-sm italic">
              "Helping you live a better life, if times get tough or even if they don't."
            </p>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-xs text-white/40 flex flex-col md:flex-row justify-between items-center gap-4">
            <span>&copy; {new Date().getFullYear()} The Survival Podcast. All rights reserved.</span>
            <span>Built for people building a life worth defending.</span>
          </div>
        </div>
      </footer>

      <MiniPlayer />
    </div>
  );
}
