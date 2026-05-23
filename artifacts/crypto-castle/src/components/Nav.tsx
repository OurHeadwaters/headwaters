import { useLocation } from "wouter";
import { FACTIONS } from "@/data/factions";
import { useFaction } from "@/context/FactionContext";
import { FactionBadge } from "./FactionBadge";

interface NavProps {
  base: string;
}

export function Nav({ base }: NavProps) {
  const { faction, clearFaction } = useFaction();
  const [location, navigate] = useLocation();

  const factionData = faction ? FACTIONS[faction] : null;

  const links = [
    { path: "/", label: "Choose Faction" },
    { path: "/great-hall", label: "Great Hall" },
    { path: "/forge", label: "Blacksmith's Forge" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(8,8,16,0.95)",
        borderColor: factionData ? `${factionData.colors.primary}30` : "rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <button
          onClick={() => navigate("/")}
          className="text-lg font-black tracking-tight flex items-center gap-2"
          style={{ color: factionData?.colors.primary ?? "#e2e8f0" }}
        >
          <span>⚔️</span>
          <span>The Castle</span>
        </button>

        <div className="flex items-center gap-6">
          {links.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`text-sm font-medium nav-link ${isActive(link.path) ? "active" : ""}`}
              style={{
                color: isActive(link.path)
                  ? (factionData?.colors.primary ?? "#e2e8f0")
                  : "rgba(226,232,240,0.6)",
              }}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {faction && factionData ? (
            <div className="flex items-center gap-2">
              <FactionBadge factionId={faction} size="sm" />
              <button
                onClick={clearFaction}
                className="text-xs opacity-40 hover:opacity-70 transition-opacity"
              >
                switch
              </button>
            </div>
          ) : (
            <span className="text-xs opacity-40">no faction selected</span>
          )}
        </div>
      </div>
    </nav>
  );
}
