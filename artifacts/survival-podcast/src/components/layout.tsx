import { Link, useLocation } from "wouter";
import { Menu, X, LogIn, LogOut, User } from "lucide-react";
import { useState } from "react";
import tspLogo from "@assets/tsp/tsp-logo.jpeg";
import { MiniPlayer } from "./mini-player";
import { usePlayer } from "@/context/player-context";
import { useAuth } from "@workspace/replit-auth-web";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { episode } = usePlayer();
  const { user, isAuthenticated, isLoading: authLoading, login, logout } = useAuth();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/library", label: "Library", isNew: true },
    { href: "/tracks", label: "Tracks" },
    { href: "/zones", label: "Zones" },
    { href: "/transform", label: "Transform" },
    { href: "/council", label: "Creators" },
    { href: "/wisdom-dig", label: "💎 Wisdom" },
    { href: "/wishing-well", label: "🪙 Well" },
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
              <span className="font-serif font-bold text-lg leading-tight tracking-tight text-white">The Stomping Path</span>
              <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold leading-none">TSP Community</span>
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

            {/* Auth button */}
            {!authLoading && (
              isAuthenticated ? (
                <div className="flex items-center gap-2 ml-1">
                  {user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt="Profile"
                      className="w-7 h-7 rounded-full border border-white/30 object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white/70" />
                  )}
                  <button
                    onClick={logout}
                    className="flex items-center gap-1 text-sm text-white/65 hover:text-white transition-colors"
                    title="Log out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="text-xs">Log out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={login}
                  className="flex items-center gap-1.5 text-sm text-white/65 hover:text-white transition-colors ml-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log in</span>
                </button>
              )
            )}
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

            {/* Mobile auth */}
            {!authLoading && (
              <div className="mt-2 pt-2 border-t border-white/10">
                {isAuthenticated ? (
                  <button
                    onClick={() => { setMenuOpen(false); logout(); }}
                    className="flex items-center gap-2 px-3 py-2.5 text-base font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-md w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                ) : (
                  <button
                    onClick={() => { setMenuOpen(false); login(); }}
                    className="flex items-center gap-2 px-3 py-2.5 text-base font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-md w-full"
                  >
                    <LogIn className="w-4 h-4" />
                    Log in
                  </button>
                )}
              </div>
            )}
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
              <span className="font-serif font-semibold text-white/80">The Stomping Path</span>
            </div>
            <p className="text-sm text-white/60 text-center md:text-right max-w-sm italic">
              "Helping you live a better life, if times get tough or even if they don't."
            </p>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-xs text-white/40 flex flex-col md:flex-row justify-between items-center gap-4">
            <span>&copy; {new Date().getFullYear()} The Stomping Path. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Link href="/admin/categories" className="hover:text-white/70 transition-colors">
                Category Descriptions Editor
              </Link>
              <Link href="/admin/content-gaps" className="hover:text-white/70 transition-colors">
                Content Gaps
              </Link>
              <Link href="/admin/gear" className="hover:text-white/70 transition-colors">
                Gear Catalog
              </Link>
              <span>Built for people building a life worth defending.</span>
            </div>
          </div>
        </div>
      </footer>

      <MiniPlayer />
    </div>
  );
}
