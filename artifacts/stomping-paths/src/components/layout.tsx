import { Link, useLocation } from "wouter";
import { Menu, X, LogIn, LogOut, User, ChevronDown, Map, Shield, Package } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import tspLogo from "@assets/tsp-stomping-path-logo.svg";
import { MiniPlayer } from "./mini-player";
import { WatershedRibbon } from "./watershed-ribbon";
import { usePlayer } from "@/context/player-context";
import { useAuth } from "@workspace/replit-auth-web";
import { TAGLINE } from "@workspace/tsp-constants";

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

function useKitPurchaseCount(isAuthenticated: boolean) {
  return useQuery({
    queryKey: ["kit-purchase-count"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/kits/my-purchases"), { credentials: "include" });
      if (!res.ok) return 0;
      const data = await res.json() as unknown[];
      return Array.isArray(data) ? data.length : 0;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

const landmarkItems = [
  { href: "/start", label: "Find Your Path", desc: "New here? 5 questions → recommendation" },
  { href: "/tracks", label: "Learning Tracks", desc: "7 structured paths by permaculture zone" },
  { href: "/zones", label: "Browse by Zone", desc: "Zone map — navigate the archive" },
  { href: "/library", label: "The Archive", desc: "6,000+ episodes — search everything" },
  { href: "/council", label: "Expert Council", desc: "Practitioners and advisors" },
  { href: "/headwaters", label: "The Headwaters", desc: "Member area — community and resources" },
  { href: "/privacy-guide/", label: "Family Kit", desc: "Privacy guide for families", external: true },
  { href: "/codetry/", label: "The Arch", desc: "Digital sovereignty — Codetry", external: true },
  { href: "/resources", label: "Resources", desc: "PDFs, guides, and media files" },
];

const adminItems = [
  { href: "/admin/brigade", label: "The Headwaters", desc: "Membership stats: members, MRR, renewals" },
  { href: "/admin/gord-tips", label: "Gord Tips", desc: "Tip history: tipper names and amounts" },
  { href: "/admin/ground-events", label: "Workshop Board", desc: "Manage ground events and workshops" },
  { href: "/admin/kit-purchases", label: "Kit Commerce", desc: "Kit purchases, revenue, and inquiries" },
  { href: "/admin/shares", label: "Share Analytics", desc: "Track episode share activity by surface" },
  { href: "/admin/council", label: "Expert Council", desc: "Manage council members and listings" },
  { href: "/admin/categories", label: "Category Descriptions", desc: "Edit category descriptions" },
  { href: "/admin/content-gaps", label: "Content Gaps", desc: "Identify content gaps" },
  { href: "/admin/gear", label: "Gear Catalog", desc: "Manage the gear catalog" },
  { href: "/admin/wisdom", label: "Wisdom Scraper", desc: "Scrape and manage wisdom entries" },
  { href: "/admin/media-library", label: "Media Library", desc: "Upload PDFs and videos to the resource library" },
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

  function handleContainerBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!ref.current?.contains(e.relatedTarget as Node | null)) {
      close();
    }
  }

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
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setTimeout(() => itemRefs.current[0]?.focus(), 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setTimeout(() => itemRefs.current[items.length - 1]?.focus(), 0);
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
      close();
    }
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={handleContainerBlur}
    >
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${label}-menu` : undefined}
        className={`relative text-sm font-medium transition-colors flex items-center gap-1 pb-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9A066] rounded-sm ${
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
          id={`${label}-menu`}
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
                tabIndex={0}
                ref={(el) => { itemRefs.current[i] = el as HTMLAnchorElement | null; }}
                onClick={() => close()}
                className="flex flex-col px-4 py-2.5 hover:bg-white/5 transition-colors focus:outline-none focus:bg-white/10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D9A066]"
              >
                <span className="text-sm font-semibold text-white">{item.label} ↗</span>
                <span className="text-xs text-white/50 mt-0.5 leading-snug">{item.desc}</span>
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                tabIndex={0}
                ref={(el) => { itemRefs.current[i] = el as HTMLAnchorElement | null; }}
                onClick={() => close()}
                className="flex flex-col px-4 py-2.5 hover:bg-white/5 transition-colors focus:outline-none focus:bg-white/10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D9A066]"
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
  const [adminOpen, setAdminOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { episode } = usePlayer();
  const { user, isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
  const { data: brigadeData } = useBrigadeStatus(isAuthenticated);
  const isBrigadeMember = brigadeData?.isMember === true;
  const { data: kitCount = 0 } = useKitPurchaseCount(isAuthenticated);

  const adminPaths = adminItems.map((i) => i.href);
  const landmarkPaths = landmarkItems.map((i) => i.href);

  const isAdminActive = adminPaths.some(
    (p) => location === p || location.startsWith(p + "/")
  );
  const isLandmarkActive = landmarkPaths.some(
    (p) => !p.startsWith("http") && (location === p || location.startsWith(p + "/"))
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
            <span className="font-serif font-bold text-lg leading-tight tracking-tight text-white whitespace-nowrap">The Stomping Path</span>
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

            {/* Explore dropdown — consolidated landmark links */}
            <DropdownMenu
              label="Explore"
              items={landmarkItems}
              isActive={isLandmarkActive}
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

            {/* Admin dropdown */}
            <DropdownMenu
              label="Admin"
              items={adminItems}
              isActive={isAdminActive}
            />

            {/* Auth */}
            {!authLoading && (
              isAuthenticated ? (
                <div
                  ref={userMenuRef}
                  className="relative ml-1"
                  onMouseEnter={() => setUserMenuOpen(true)}
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-1.5 text-white/65 hover:text-white transition-colors"
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                  >
                    {isBrigadeMember && (
                      <span className="flex items-center bg-[#D9A066]/20 text-[#D9A066] text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#D9A066]/40 uppercase tracking-wider">
                        <Shield className="w-2.5 h-2.5" />
                      </span>
                    )}
                    <span className="relative inline-flex">
                      {user?.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt="Profile" className="w-7 h-7 rounded-full border border-white/30 object-cover" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                      {kitCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center bg-[#D9A066] text-[#1a2d1e] text-[9px] font-bold rounded-full px-0.5 leading-none shadow-sm" aria-label={`${kitCount} kit${kitCount === 1 ? "" : "s"} purchased`}>
                          {kitCount > 9 ? "9+" : kitCount}
                        </span>
                      )}
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                  {userMenuOpen && (
                    <div role="menu" className="absolute top-full right-0 mt-0 w-52 bg-[#1e3428] border border-white/10 rounded-xl shadow-2xl pt-2 pb-2 z-50">
                      <div className="absolute -top-1.5 right-3 w-3 h-3 bg-[#1e3428] border-l border-t border-white/10 rotate-45" />
                      {isBrigadeMember && (
                        <Link href="/brigade" onClick={() => setUserMenuOpen(false)} className="flex flex-col px-4 py-2 hover:bg-white/5 transition-colors">
                          <span className="text-sm font-semibold text-[#D9A066]">Headwaters Member</span>
                          <span className="text-xs text-white/50 mt-0.5">Your member area</span>
                        </Link>
                      )}
                      <Link href="/kits/my-purchases" onClick={() => setUserMenuOpen(false)} className="flex flex-col px-4 py-2 hover:bg-white/5 transition-colors">
                        <span className="text-sm font-semibold text-white">My Kits</span>
                        <span className="text-xs text-white/50 mt-0.5">Your purchased kit library</span>
                      </Link>
                      <Link href="/map" onClick={() => setUserMenuOpen(false)} className="flex flex-col px-4 py-2 hover:bg-white/5 transition-colors">
                        <span className="text-sm font-semibold text-white">My Map</span>
                        <span className="text-xs text-white/50 mt-0.5">Your practitioner journey</span>
                      </Link>
                      <Link href="/suggest-creator" onClick={() => setUserMenuOpen(false)} className="flex flex-col px-4 py-2 hover:bg-white/5 transition-colors">
                        <span className="text-sm font-semibold text-white">Suggest a Creator</span>
                        <span className="text-xs text-white/50 mt-0.5">Recommend for the Kitchen Table</span>
                      </Link>
                      <div className="border-t border-white/10 mt-1 pt-1">
                        <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white/65 hover:text-white hover:bg-white/5 transition-colors rounded-lg">
                          <LogOut className="w-3.5 h-3.5" />
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
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

            {/* Explore — mobile flat list */}
            <div className="ml-1 border-l border-white/10 pl-3 flex flex-col gap-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2 pt-1 pb-0.5">Explore</p>
              {landmarkItems.map((item) =>
                (item as { external?: boolean }).external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium px-2 py-2 rounded-md text-white/60 hover:text-white hover:bg-white/5"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label} ↗
                  </a>
                ) : (
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
                )
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

            {/* Suggest a Creator — mobile, auth-gated */}
            {isAuthenticated && !authLoading && (
              <Link
                href="/suggest-creator"
                className={`text-base font-medium px-3 py-2.5 rounded-md ${
                  location === "/suggest-creator"
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                Suggest a Creator
              </Link>
            )}

            {/* My Kits — mobile, auth-gated */}
            {isAuthenticated && !authLoading && (
              <Link
                href="/kits/my-purchases"
                className={`text-base font-medium px-3 py-2.5 rounded-md flex items-center gap-2 ${
                  location === "/kits/my-purchases"
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <Package className="w-4 h-4" />
                My Kits
              </Link>
            )}

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
              {`"${TAGLINE}"`}
            </p>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap justify-center md:justify-start gap-4 text-sm text-white/55">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/council" className="hover:text-white transition-colors">Expert Council</Link>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10 text-xs text-white/40 flex flex-col md:flex-row justify-between items-center gap-4">
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
      <WatershedRibbon />
    </div>
  );
}
