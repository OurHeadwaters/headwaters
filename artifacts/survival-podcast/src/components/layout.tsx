import { Link, useLocation } from "wouter";
import { Menu, X, LogIn, LogOut, User, ChevronDown, Map, Shield } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import tspLogo from "@assets/tsp-stomping-path-logo.svg";
import { MiniPlayer } from "./mini-player";
import { GordGuide } from "./gord-guide";
import { usePlayer } from "@/context/player-context";
import { useAuth } from "@workspace/replit-auth-web";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

function useBrigadeStatus(isAuthenticated: boolean) {
  return useQuery({
    queryKey: ["brigade-status"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/brigade/status"), { credentials: "include" });
      if (!res.ok) return { isMember: false };
      return res.json() as Promise<{ isMember: boolean }>;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

const journeyItems = [
  { href: "/tracks", label: "Tracks", desc: "Structured learning paths through TSP's best content" },
  { href: "/zones", label: "Zones", desc: "Browse episodes by life-skills topic area" },
  { href: "/transform", label: "Transform", desc: "Guided paths for real personal transformation" },
  { href: "/kits", label: "Kits", desc: "Bundled episodes, gear, and resources per transformation" },
  { href: "/series", label: "Series", desc: "Multi-episode deep dives on a single subject" },
  { href: "https://ourheadwaters.ca/headwaters-learning/forge", label: "The Forge", desc: "Crypto Castle — learn blockchain by faction", external: true },
];

const communityItems = [
  { href: "/council", label: "Expert Council", desc: "Creators and experts behind The Stomping Path" },
  { href: "/about", label: "About", desc: "The mission and story of TSP" },
];

const adminItems = [
  { href: "/admin/brigade", label: "The Headwaters", desc: "Membership stats: members, MRR, renewals" },
  { href: "/admin/ground-events", label: "Workshop Board", desc: "Manage ground events and workshops" },
  { href: "/admin/categories", label: "Category Descriptions", desc: "Edit category descriptions" },
  { href: "/admin/content-gaps", label: "Content Gaps", desc: "Identify content gaps" },
  { href: "/admin/gear", label: "Gear Catalog", desc: "Manage the gear catalog" },
  { href: "/admin/wisdom", label: "Wisdom Scraper", desc: "Scrape and manage wisdom entries" },
];

function DropdownMenu({
  label,
  items,
  isActive,
}: {
  label: string;
  items: { href: string; label: string; desc: string }[];
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const closeAndReturnFocus = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [close]);

  function handleTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((v) => {
        if (!v) {
          setTimeout(() => itemRefs.current[0]?.focus(), 0);
        }
        return !v;
      });
    } else if (e.key === "Escape") {
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setTimeout(() => itemRefs.current[0]?.focus(), 0);
    }
  }

  function handleMenuKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const focused = document.activeElement;
    const idx = itemRefs.current.findIndex((el) => el === focused);

    if (e.key === "Escape") {
      e.preventDefault();
      closeAndReturnFocus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = (idx + 1) % items.length;
      itemRefs.current[next]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (idx - 1 + items.length) % items.length;
      itemRefs.current[prev]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      itemRefs.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      itemRefs.current[items.length - 1]?.focus();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const lastIdx = items.length - 1;
      if (e.shiftKey) {
        const prev = idx <= 0 ? lastIdx : idx - 1;
        itemRefs.current[prev]?.focus();
      } else {
        const next = idx >= lastIdx ? 0 : idx + 1;
        itemRefs.current[next]?.focus();
      }
    }
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`relative text-sm font-medium transition-colors flex items-center gap-1 pb-0.5 ${
          isActive
            ? "text-white border-b-2 border-[#D9A066]"
            : "text-white/65 hover:text-white"
        }`}
      >
        {label}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={label}
          onKeyDown={handleMenuKeyDown}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-64 bg-[#1e3428] border border-white/10 rounded-xl shadow-2xl pt-3 pb-2 z-50"
        >
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1e3428] border-l border-t border-white/10 rotate-45" />
          {items.map((item, i) =>
            (item as { external?: boolean }).external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                ref={(el) => { itemRefs.current[i] = el as HTMLAnchorElement | null; }}
                onClick={() => close()}
                className="flex flex-col px-4 py-2.5 hover:bg-white/5 transition-colors focus:outline-none focus:bg-white/10"
              >
                <span className="text-sm font-semibold text-white">{item.label} ↗</span>
                <span className="text-xs text-white/50 mt-0.5 leading-snug">{item.desc}</span>
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                ref={(el) => { itemRefs.current[i] = el as HTMLAnchorElement | null; }}
                onClick={() => close()}
                className="flex flex-col px-4 py-2.5 hover:bg-white/5 transition-colors focus:outline-none focus:bg-white/10"
              >
                <span className="text-sm font-semibold text-white">{item.label}</span>
                <span className="text-xs text-white/50 mt-0.5 leading-snug">{item.desc}</span>
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const { episode } = usePlayer();
  const { user, isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
  const { data: brigadeData } = useBrigadeStatus(isAuthenticated);
  const isBrigadeMember = brigadeData?.isMember === true;

  const journeyPaths = journeyItems.map((i) => i.href);
  const communityPaths = communityItems.map((i) => i.href);
  const adminPaths = adminItems.map((i) => i.href);

  const isJourneyActive = journeyPaths.some(
    (p) => location === p || location.startsWith(p + "/")
  );
  const isCommunityActive = communityPaths.some(
    (p) => location === p || location.startsWith(p + "/")
  );
  const isAdminActive = adminPaths.some(
    (p) => location === p || location.startsWith(p + "/")
  );
  const isGroundsActive =
    location === "/stomping-grounds" ||
    location === "/wisdom-dig" ||
    location === "/wishing-well";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
      {/* Forest-green header */}
      <header className="sticky top-0 z-50 w-full bg-[#2C4A36] shadow-md">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src={tspLogo} alt="TSP Logo" className="w-10 h-10" />
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg leading-tight tracking-tight text-white">The Stomping Path</span>
              <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold leading-none">TSP Community</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {/* Home */}
            <Link
              href="/"
              className={`relative text-sm font-medium transition-colors pb-0.5 ${
                location === "/"
                  ? "text-white border-b-2 border-[#D9A066]"
                  : "text-white/65 hover:text-white"
              }`}
            >
              Home
            </Link>

            {/* Journey dropdown */}
            <DropdownMenu
              label="Journey"
              items={journeyItems}
              isActive={isJourneyActive}
            />

            {/* Library */}
            <Link
              href="/library"
              className={`relative text-sm font-medium transition-colors flex items-center pb-0.5 ${
                location === "/library" || location.startsWith("/library/")
                  ? "text-white border-b-2 border-[#D9A066]"
                  : "text-white/65 hover:text-white"
              }`}
            >
              Library
              <span className="absolute -top-1 -right-4 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D9A066] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D9A066]"></span>
              </span>
            </Link>

            {/* Community dropdown */}
            <DropdownMenu
              label="Community"
              items={communityItems}
              isActive={isCommunityActive}
            />

            {/* Grounds */}
            <Link
              href="/stomping-grounds"
              className={`relative text-sm font-medium transition-colors pb-0.5 ${
                isGroundsActive
                  ? "text-white border-b-2 border-[#D9A066]"
                  : "text-white/65 hover:text-white"
              }`}
            >
              Grounds
            </Link>

            {/* Family Kit */}
            <a
              href="/privacy-guide/"
              className="relative text-sm font-medium transition-colors pb-0.5 text-white/65 hover:text-white"
            >
              Family Kit
            </a>

            {/* The Headwaters */}
            <Link
              href="/headwaters"
              className={`relative text-sm font-medium transition-colors flex items-center gap-1 pb-0.5 ${
                location === "/headwaters"
                  ? "text-white border-b-2 border-[#D9A066]"
                  : "text-white/65 hover:text-white"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              The Headwaters
            </Link>

            {/* Admin dropdown */}
            <DropdownMenu
              label="Admin"
              items={adminItems}
              isActive={isAdminActive}
            />

            {/* My Map — auth-gated */}
            {isAuthenticated && !authLoading && (
              <Link
                href="/map"
                className={`relative text-sm font-medium transition-colors flex items-center gap-1 pb-0.5 ${
                  location === "/map"
                    ? "text-white border-b-2 border-[#D9A066]"
                    : "text-white/65 hover:text-white"
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                My Map
              </Link>
            )}

            {/* Auth button */}
            {!authLoading && (
              isAuthenticated ? (
                <div className="flex items-center gap-2 ml-1">
                  {isBrigadeMember && (
                    <Link
                      href="/brigade"
                      className="flex items-center gap-1 bg-[#D9A066]/20 text-[#D9A066] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#D9A066]/40 hover:bg-[#D9A066]/30 transition-colors uppercase tracking-wider"
                      title="Headwaters Member"
                    >
                      <Shield className="w-2.5 h-2.5" />
                      Headwaters
                    </Link>
                  )}
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
            {/* Home */}
            <Link
              href="/"
              className={`text-base font-medium px-3 py-2.5 rounded-md ${
                location === "/"
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>

            {/* Journey accordion */}
            <div>
              <button
                onClick={() => setJourneyOpen((v) => !v)}
                className={`w-full flex items-center justify-between text-base font-medium px-3 py-2.5 rounded-md ${
                  isJourneyActive
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                Journey
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${journeyOpen ? "rotate-180" : ""}`}
                />
              </button>
              {journeyOpen && (
                <div className="mt-1 ml-3 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                  {journeyItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-sm font-medium px-2 py-2 rounded-md ${
                        location === item.href || location.startsWith(item.href + "/")
                          ? "text-white bg-white/8"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Library */}
            <Link
              href="/library"
              className={`text-base font-medium px-3 py-2.5 rounded-md flex items-center gap-2 ${
                location === "/library" || location.startsWith("/library/")
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
              onClick={() => setMenuOpen(false)}
            >
              Library
              <span className="bg-[#D9A066] text-[#2C4A36] text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                New
              </span>
            </Link>

            {/* Community accordion */}
            <div>
              <button
                onClick={() => setCommunityOpen((v) => !v)}
                className={`w-full flex items-center justify-between text-base font-medium px-3 py-2.5 rounded-md ${
                  isCommunityActive
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                Community
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${communityOpen ? "rotate-180" : ""}`}
                />
              </button>
              {communityOpen && (
                <div className="mt-1 ml-3 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                  {communityItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-sm font-medium px-2 py-2 rounded-md ${
                        location === item.href || location.startsWith(item.href + "/")
                          ? "text-white bg-white/8"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Grounds */}
            <Link
              href="/stomping-grounds"
              className={`text-base font-medium px-3 py-2.5 rounded-md ${
                isGroundsActive
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
              onClick={() => setMenuOpen(false)}
            >
              Grounds
            </Link>

            {/* Family Kit */}
            <a
              href="/privacy-guide/"
              className="text-base font-medium px-3 py-2.5 rounded-md text-white/70 hover:text-white hover:bg-white/5"
              onClick={() => setMenuOpen(false)}
            >
              Family Kit
            </a>

            {/* The Headwaters */}
            <Link
              href="/headwaters"
              className={`text-base font-medium px-3 py-2.5 rounded-md flex items-center gap-2 ${
                location === "/headwaters"
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <Shield className="w-4 h-4" />
              The Headwaters
              {isBrigadeMember && (
                <span className="ml-auto bg-[#D9A066]/20 text-[#D9A066] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#D9A066]/40 uppercase tracking-wider">
                  Member
                </span>
              )}
            </Link>

            {/* Admin accordion */}
            <div>
              <button
                onClick={() => setAdminOpen((v) => !v)}
                className={`w-full flex items-center justify-between text-base font-medium px-3 py-2.5 rounded-md ${
                  isAdminActive
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                Admin
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${adminOpen ? "rotate-180" : ""}`}
                />
              </button>
              {adminOpen && (
                <div className="mt-1 ml-3 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                  {adminItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-sm font-medium px-2 py-2 rounded-md ${
                        location === item.href || location.startsWith(item.href + "/")
                          ? "text-white bg-white/8"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* My Map — mobile, auth-gated */}
            {isAuthenticated && !authLoading && (
              <Link
                href="/map"
                className={`text-base font-medium px-3 py-2.5 rounded-md flex items-center gap-2 ${
                  location === "/map"
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <Map className="w-4 h-4" />
                My Map
              </Link>
            )}

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
              <img src={tspLogo} alt="TSP Logo" className="w-8 h-8 opacity-80" />
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
              <Link href="/admin/wisdom" className="hover:text-white/70 transition-colors">
                Wisdom Scraper
              </Link>
              <Link href="/admin/ground-events" className="hover:text-white/70 transition-colors">
                Ground Events
              </Link>
              <span>Built for people building a life worth defending.</span>
            </div>
          </div>
        </div>
      </footer>

      <MiniPlayer />
      <GordGuide path={location} />
    </div>
  );
}
