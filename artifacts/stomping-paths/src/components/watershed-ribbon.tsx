import { useState, useEffect } from "react";
import { Flame, Droplets, Map, X, ChevronDown } from "lucide-react";
import { Link } from "wouter";

const RIBBON_DISMISSED_KEY = "tsp-ribbon-dismissed-v1";

interface RibbonLink {
  label: string;
  sublabel: string;
  href: string;
  icon: React.ElementType;
  external?: boolean;
  accentColor: string;
}

const RIBBON_LINKS: RibbonLink[] = [
  {
    label: "The Well",
    sublabel: "Headwaters",
    href: "/headwaters",
    icon: Droplets,
    accentColor: "#00BFDF",
  },
  {
    label: "The Forge",
    sublabel: "Codetry",
    href: "/codetry/",
    icon: Flame,
    external: true,
    accentColor: "#D4621A",
  },
  {
    label: "The Path",
    sublabel: "Zone Map",
    href: "/zones",
    icon: Map,
    accentColor: "#7FA77F",
  },
];

export function WatershedRibbon() {
  const [dismissed, setDismissed] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(RIBBON_DISMISSED_KEY);
    const isDismissed = stored === "true";
    setDismissed(isDismissed);
    setMounted(true);
  }, []);

  function dismiss() {
    setDismissed(true);
    localStorage.setItem(RIBBON_DISMISSED_KEY, "true");
  }

  if (!mounted || dismissed) return null;

  return (
    <div
      className="watershed-ribbon-enter fixed bottom-0 left-0 right-0 z-[45] select-none"
      role="navigation"
      aria-label="Watershed quick links"
      style={{
        background: "var(--surface-dark, #111C15)",
        borderTop: "1px solid rgba(0,191,223,0.18)",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.55), 0 -1px 0 rgba(0,191,223,0.08)",
      }}
    >
      {minimized ? (
        /* Minimized tab */
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 px-4 py-1.5 mx-auto text-xs font-bold uppercase tracking-wider transition-colors"
          style={{ color: "rgba(0,191,223,0.7)" }}
          aria-label="Expand Watershed Ribbon"
        >
          <ChevronDown className="w-3.5 h-3.5 rotate-180" />
          Watershed
          <ChevronDown className="w-3.5 h-3.5 rotate-180" />
        </button>
      ) : (
        /* Full ribbon */
        <div className="container mx-auto px-3 md:px-6 flex items-center h-11 gap-1 md:gap-2">
          {/* Label */}
          <span
            className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.2em] mr-2 shrink-0"
            style={{ color: "rgba(0,191,223,0.45)" }}
          >
            Watershed
          </span>

          {/* Links */}
          <div className="flex items-center gap-1 flex-1">
            {RIBBON_LINKS.map((link) => {
              const Icon = link.icon;
              const inner = (
                <>
                  <Icon
                    className="w-3.5 h-3.5 shrink-0 transition-colors"
                    style={{ color: link.accentColor }}
                  />
                  <span className="font-bold text-white/80 group-hover:text-white transition-colors text-xs">
                    {link.label}
                  </span>
                  <span className="hidden sm:block text-[10px] text-white/35 ml-0.5">
                    → {link.sublabel}
                  </span>
                </>
              );

              const sharedClass =
                "group flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-200 " +
                "hover:-translate-y-px";
              const sharedStyle = {
                background: `${link.accentColor}12`,
                border: `1px solid ${link.accentColor}28`,
              };
              const hoverStyle = {
                "--ribbon-hover-bg": `${link.accentColor}22`,
              } as React.CSSProperties;

              if (link.external) {
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={sharedClass}
                    style={{ ...sharedStyle, ...hoverStyle }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = `${link.accentColor}22`;
                      (e.currentTarget as HTMLElement).style.borderColor = `${link.accentColor}55`;
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 0 12px ${link.accentColor}30`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = `${link.accentColor}12`;
                      (e.currentTarget as HTMLElement).style.borderColor = `${link.accentColor}28`;
                      (e.currentTarget as HTMLElement).style.boxShadow = "";
                    }}
                  >
                    {inner}
                  </a>
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={sharedClass}
                  style={{ ...sharedStyle, ...hoverStyle }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = `${link.accentColor}22`;
                    (e.currentTarget as HTMLElement).style.borderColor = `${link.accentColor}55`;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 12px ${link.accentColor}30`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = `${link.accentColor}12`;
                    (e.currentTarget as HTMLElement).style.borderColor = `${link.accentColor}28`;
                    (e.currentTarget as HTMLElement).style.boxShadow = "";
                  }}
                >
                  {inner}
                </Link>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            <button
              onClick={() => setMinimized(true)}
              className="p-1.5 rounded-md text-white/25 hover:text-white/60 hover:bg-white/8 transition-colors"
              aria-label="Minimize ribbon"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={dismiss}
              className="p-1.5 rounded-md text-white/25 hover:text-white/60 hover:bg-white/8 transition-colors"
              aria-label="Close watershed ribbon"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
