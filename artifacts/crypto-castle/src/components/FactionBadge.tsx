import type { FactionId } from "@/data/factions";
import { FACTIONS } from "@/data/factions";

interface FactionBadgeProps {
  factionId: FactionId;
  size?: "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "text-sm px-2 py-0.5",
  md: "text-base px-3 py-1",
  lg: "text-lg px-4 py-1.5",
  xl: "text-2xl px-5 py-2",
};

export function FactionBadge({
  factionId,
  size = "md",
  showName = true,
  className = "",
}: FactionBadgeProps) {
  const faction = FACTIONS[factionId];
  if (!faction) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold border ${sizeClasses[size]} ${className}`}
      style={{
        color: faction.colors.primary,
        borderColor: faction.colors.primary,
        background: `${faction.colors.primary}15`,
        boxShadow: `0 0 8px ${faction.colors.glow}`,
      }}
    >
      <span>{faction.badge}</span>
      {showName && <span>{faction.shortName}</span>}
    </span>
  );
}
