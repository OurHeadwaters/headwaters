import { useState, useCallback } from "react";

// =============================================================================
// CONFIG — swap this object to use a different zone set
// =============================================================================
// Each zone needs: id, number, name, color, description, identity
// Each adjacency needs: id, from, to, narrative, chips
// To use your own zone set, replace ZONE_CONFIG and ADJACENCY_CONFIG below.
// =============================================================================

const ZONE_RADIUS = 130;

const ZONE_CONFIG = [
  {
    id: "z0",
    number: 0,
    name: "The Self",
    color: "#B5853A",
    description:
      "Mindset, money, freedom, and personal sovereignty. This is your foundation — how you think, how you earn, and how you secure your future.",
    identity:
      "The Sovereign Individual: economist, philosopher, freedom-seeker, investor",
  },
  {
    id: "z1",
    number: 1,
    name: "The Home",
    color: "#C4A05A",
    description:
      "Basic home preparedness. Food storage, water security, first aid, and the skills that keep your household resilient when systems fail.",
    identity:
      "The Provider: protector, planner, household manager, security-minded parent",
  },
  {
    id: "z2",
    number: 2,
    name: "The Garden",
    color: "#6B8F47",
    description:
      "Food production and permaculture. Growing your own food, keeping bees, tending chickens — the zone where you start producing rather than just consuming.",
    identity:
      "The Grower: gardener, cultivator, beekeeper, fermentation hobbyist",
  },
  {
    id: "z3",
    number: 3,
    name: "The Homestead",
    color: "#4A7A3A",
    description:
      "Full-scale homesteading. Livestock, off-grid energy, woodworking — a self-sufficient property that can sustain life indefinitely.",
    identity:
      "The Homesteader: farmer, rancher, off-grid engineer, animal husbandrist",
  },
  {
    id: "z4",
    number: 4,
    name: "The Forest",
    color: "#2C5F2E",
    description:
      "Hunting, foraging, and bushcraft. Extracting life from the wild world — skills that work when there is no property at all.",
    identity:
      "The Wildcrafter: hunter, forager, bushcraft practitioner, tracker",
  },
  {
    id: "z5",
    number: 5,
    name: "The Wild",
    color: "#1A3A1C",
    description:
      "Grid-down survival and contingency planning. Bug-out scenarios, wilderness survival, communications — the outermost edge of the self-reliant life.",
    identity:
      "The Survivor: operator, navigator, grid-down communicator, wilderness sentinel",
  },
];

const ADJACENCY_CONFIG = [
  {
    id: "g0-1",
    from: "z0",
    to: "z1",
    narrative:
      "Crossing from inner sovereignty into the physical household. You're moving from philosophy into action — protecting and providing for those under your roof.",
    chips: ["Thinker → Provider", "Dreamer → Builder", "Philosopher → Protector", "Planner → Doer"],
  },
  {
    id: "g1-2",
    from: "z1",
    to: "z2",
    narrative:
      "Crossing from the prepared home into food production. You're moving from storing food to growing it — from consumer to cultivator.",
    chips: ["Homeowner → Grower", "Buyer → Producer", "Consumer → Cultivator", "Tenant → Steward"],
  },
  {
    id: "g2-3",
    from: "z2",
    to: "z3",
    narrative:
      "Crossing from the garden into the full homestead. You're moving from hobby production to whole-property self-sufficiency — from grower to farmer.",
    chips: ["Gardener → Farmer", "Grower → Rancher", "Hobbyist → Homesteader", "Part-timer → Committed"],
  },
  {
    id: "g3-4",
    from: "z3",
    to: "z4",
    narrative:
      "Crossing from the managed homestead into the wild. You're moving from tended land to untamed forest — from keeper to seeker.",
    chips: ["Farmer → Hunter", "Land-tender → Wildcrafter", "Keeper → Seeker", "Domestic → Feral"],
  },
  {
    id: "g4-5",
    from: "z4",
    to: "z5",
    narrative:
      "Crossing from the forest into the wild frontier. You're moving from skilled outdoorsman to full-spectrum survivor — from knowledgeable to hardened.",
    chips: ["Woodsman → Survivor", "Outdoorsman → Operator", "Skilled → Prepared", "Knowledgeable → Hardened"],
  },
];

// =============================================================================
// LAYOUT — fixed coordinates for the 6 zones (hand-tuned)
// =============================================================================

const ZONE_POSITIONS: Record<string, { cx: number; cy: number }> = {
  z0: { cx: 165, cy: 360 },
  z1: { cx: 355, cy: 230 },
  z2: { cx: 560, cy: 195 },
  z3: { cx: 735, cy: 315 },
  z4: { cx: 885, cy: 205 },
  z5: { cx: 1055, cy: 325 },
};

const SVG_WIDTH = 1230;
const SVG_HEIGHT = 540;

// =============================================================================
// HELPERS
// =============================================================================

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function blendColors(hex1: string, hex2: string, t = 0.5): string {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

/**
 * Compute the SVG arc path for the lens (vesica) intersection of two equal-radius circles.
 * Returns null if circles don't overlap.
 */
function lensPath(
  cx1: number, cy1: number,
  cx2: number, cy2: number,
  r: number,
): string | null {
  const dx = cx2 - cx1;
  const dy = cy2 - cy1;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d >= 2 * r || d === 0) return null;

  const a = d / 2; // for equal radii: a = d/2
  const h = Math.sqrt(r * r - a * a);

  const mx = (cx1 + cx2) / 2;
  const my = (cy1 + cy2) / 2;

  const nx = -dy / d;
  const ny = dx / d;

  const p1x = mx + h * nx;
  const p1y = my + h * ny;
  const p2x = mx - h * nx;
  const p2y = my - h * ny;

  // Both arcs use sweep=1 for equal-radius circles
  return `M ${p1x} ${p1y} A ${r} ${r} 0 0 1 ${p2x} ${p2y} A ${r} ${r} 0 0 1 ${p1x} ${p1y} Z`;
}

/** Midpoint of the lens region (used for gate click target and label) */
function lensMidpoint(cx1: number, cy1: number, cx2: number, cy2: number) {
  return { x: (cx1 + cx2) / 2, y: (cy1 + cy2) / 2 };
}

// =============================================================================
// TYPES
// =============================================================================

type SelectedItem =
  | { type: "zone"; id: string }
  | { type: "gate"; id: string };

type CurrentPosition =
  | { type: "zone"; id: string }
  | { type: "gate"; id: string }
  | null;

// =============================================================================
// COMPONENT
// =============================================================================

export default function ZoneBubbleMap() {
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [currentPosition, setCurrentPosition] = useState<CurrentPosition>(null);
  const [crossedGates, setCrossedGates] = useState<Set<string>>(new Set());
  const [selectedChip, setSelectedChip] = useState<string | null>(null);

  const zoneMap = Object.fromEntries(ZONE_CONFIG.map((z) => [z.id, z]));
  const adjMap = Object.fromEntries(ADJACENCY_CONFIG.map((a) => [a.id, a]));

  const handleZoneClick = useCallback((id: string) => {
    setSelected({ type: "zone", id });
    setSelectedChip(null);
  }, []);

  const handleGateClick = useCallback((id: string) => {
    setSelected({ type: "gate", id });
    setSelectedChip(null);
  }, []);

  const handleSetPosition = useCallback((type: "zone" | "gate", id: string) => {
    setCurrentPosition({ type, id });
  }, []);

  const handleCrossGate = useCallback(
    (gateId: string) => {
      if (!selectedChip) return;
      setCrossedGates((prev) => {
        const next = new Set(prev);
        next.add(gateId);
        return next;
      });
      setSelectedChip(null);
    },
    [selectedChip],
  );

  const closePanel = useCallback(() => {
    setSelected(null);
    setSelectedChip(null);
  }, []);

  const panelOpen = selected !== null;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0f1a0f",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Georgia', serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          borderBottom: "1px solid #2a3a2a",
          flexShrink: 0,
        }}
      >
        <div>
          <h1 style={{ color: "#C4A05A", margin: 0, fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>
            ZONE BUBBLE MAP
          </h1>
          <p style={{ color: "#5a7a5a", margin: 0, fontSize: "0.72rem", marginTop: 2 }}>
            The Survival Podcast · TSP 6-Zone Territory
          </p>
        </div>
        <Legend crossedGates={crossedGates} currentPosition={currentPosition} />
      </div>

      {/* Map + Panel row */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {/* SVG Map */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            padding: "12px",
          }}
        >
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            style={{ width: "100%", maxHeight: "100%", overflow: "visible" }}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-strong" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="14" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {ZONE_CONFIG.map((z) => {
                const [r, g, b] = hexToRgb(z.color);
                return (
                  <radialGradient key={z.id} id={`grad-${z.id}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={`rgb(${r},${g},${b})`} stopOpacity="0.55" />
                    <stop offset="70%" stopColor={`rgb(${r},${g},${b})`} stopOpacity="0.30" />
                    <stop offset="100%" stopColor={`rgb(${r},${g},${b})`} stopOpacity="0.12" />
                  </radialGradient>
                );
              })}
            </defs>

            {/*
             * LAYER ORDER (SVG paints top-to-bottom; last element = topmost hit target):
             *   1. Zone fill circles       — clickable for non-overlap areas
             *   2. Gate lens paths         — ON TOP of fills, so they win clicks in overlap regions
             *   3. Zone labels + markers   — purely visual, pointer-events: none
             */}

            {/* ── Layer 1: Zone fill circles (clickable) ── */}
            {ZONE_CONFIG.map((zone) => {
              const pos = ZONE_POSITIONS[zone.id];
              const isSelected = selected?.type === "zone" && selected.id === zone.id;
              const isCurrent = currentPosition?.type === "zone" && currentPosition.id === zone.id;

              return (
                <g
                  key={zone.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleZoneClick(zone.id)}
                >
                  {isCurrent && (
                    <circle
                      cx={pos.cx}
                      cy={pos.cy}
                      r={ZONE_RADIUS + 14}
                      fill="none"
                      stroke={zone.color}
                      strokeWidth={3}
                      strokeOpacity={0.5}
                      filter="url(#glow)"
                    />
                  )}
                  <circle
                    cx={pos.cx}
                    cy={pos.cy}
                    r={ZONE_RADIUS}
                    fill={`url(#grad-${zone.id})`}
                    stroke={zone.color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeOpacity={isSelected ? 1 : 0.65}
                    filter={isSelected ? "url(#glow)" : undefined}
                    style={{ transition: "stroke-width 0.2s, stroke-opacity 0.2s" }}
                  />
                </g>
              );
            })}

            {/* ── Layer 2: Gate lens paths (clickable, on top of zone fills) ── */}
            {ADJACENCY_CONFIG.map((adj) => {
              const z1pos = ZONE_POSITIONS[adj.from];
              const z2pos = ZONE_POSITIONS[adj.to];
              const path = lensPath(z1pos.cx, z1pos.cy, z2pos.cx, z2pos.cy, ZONE_RADIUS);
              if (!path) return null;

              const fromZone = zoneMap[adj.from];
              const toZone = zoneMap[adj.to];
              const blended = blendColors(fromZone.color, toZone.color, 0.5);
              const isCrossed = crossedGates.has(adj.id);
              const isSelected = selected?.type === "gate" && selected.id === adj.id;

              return (
                <g key={adj.id} style={{ cursor: "pointer" }} onClick={() => handleGateClick(adj.id)}>
                  <path
                    d={path}
                    fill={blended}
                    fillOpacity={isCrossed ? 0.75 : isSelected ? 0.65 : 0.42}
                    stroke={blended}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeOpacity={isSelected ? 1 : 0.7}
                    filter={isSelected ? "url(#glow)" : undefined}
                    style={{ transition: "fill-opacity 0.2s, stroke-width 0.2s" }}
                  />
                  {!isCrossed && (
                    <path
                      d={path}
                      fill="none"
                      stroke={blended}
                      strokeWidth={2}
                      strokeOpacity={0}
                      style={{ animation: "gatePulse 2.4s ease-in-out infinite" }}
                    />
                  )}
                </g>
              );
            })}

            {/* ── Layer 3: Zone labels + gate labels + position markers (no pointer events) ── */}
            {ZONE_CONFIG.map((zone) => {
              const pos = ZONE_POSITIONS[zone.id];
              const isCurrent = currentPosition?.type === "zone" && currentPosition.id === zone.id;
              return (
                <g key={`label-${zone.id}`} style={{ pointerEvents: "none" }}>
                  <text
                    x={pos.cx}
                    y={pos.cy - 12}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight="700"
                    fill={zone.color}
                    fillOpacity={0.9}
                    style={{ userSelect: "none" }}
                  >
                    {zone.number}
                  </text>
                  <text
                    x={pos.cx}
                    y={pos.cy + 14}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight="600"
                    fill="white"
                    fillOpacity={0.85}
                    style={{ userSelect: "none" }}
                  >
                    {zone.name}
                  </text>
                  {isCurrent && (
                    <g transform={`translate(${pos.cx}, ${pos.cy - ZONE_RADIUS - 8})`}>
                      <circle cx={0} cy={0} r={7} fill={zone.color} stroke="white" strokeWidth={1.5} />
                      <text x={0} y={4} textAnchor="middle" fontSize={8} fill="white" fontWeight="700">▼</text>
                    </g>
                  )}
                </g>
              );
            })}
            {ADJACENCY_CONFIG.map((adj) => {
              const z1pos = ZONE_POSITIONS[adj.from];
              const z2pos = ZONE_POSITIONS[adj.to];
              const path = lensPath(z1pos.cx, z1pos.cy, z2pos.cx, z2pos.cy, ZONE_RADIUS);
              if (!path) return null;
              const mid = lensMidpoint(z1pos.cx, z1pos.cy, z2pos.cx, z2pos.cy);
              const fromZone = zoneMap[adj.from];
              const toZone = zoneMap[adj.to];
              const blended = blendColors(fromZone.color, toZone.color, 0.5);
              const isCrossed = crossedGates.has(adj.id);
              const isCurrent = currentPosition?.type === "gate" && currentPosition.id === adj.id;
              return (
                <g key={`gate-label-${adj.id}`} style={{ pointerEvents: "none" }}>
                  {isCrossed ? (
                    <text x={mid.x} y={mid.y + 5} textAnchor="middle" fontSize={16} fill="white" fillOpacity={0.85} style={{ userSelect: "none" }}>✦</text>
                  ) : (
                    <text x={mid.x} y={mid.y + 4} textAnchor="middle" fontSize={10} fill="white" fillOpacity={0.55} style={{ userSelect: "none" }}>gate</text>
                  )}
                  {isCurrent && (
                    <g transform={`translate(${mid.x}, ${mid.y - 22})`}>
                      <circle cx={0} cy={0} r={7} fill={blended} stroke="white" strokeWidth={1.5} />
                      <text x={0} y={4} textAnchor="middle" fontSize={8} fill="white" fontWeight="700">▼</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Side panel */}
        {panelOpen && (
          <SidePanel
            selected={selected!}
            zoneMap={zoneMap}
            adjMap={adjMap}
            currentPosition={currentPosition}
            crossedGates={crossedGates}
            selectedChip={selectedChip}
            onSetPosition={handleSetPosition}
            onSelectChip={setSelectedChip}
            onCrossGate={handleCrossGate}
            onClose={closePanel}
          />
        )}
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes gatePulse {
          0%   { stroke-opacity: 0; stroke-width: 2; }
          40%  { stroke-opacity: 0.55; stroke-width: 5; }
          100% { stroke-opacity: 0; stroke-width: 9; }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// LEGEND
// =============================================================================

function Legend({
  crossedGates,
  currentPosition,
}: {
  crossedGates: Set<string>;
  currentPosition: CurrentPosition;
}) {
  return (
    <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
      <LegendItem
        symbol={<span style={{ fontSize: 13, opacity: 0.6 }}>◉</span>}
        label="Zone"
      />
      <LegendItem
        symbol={
          <span
            style={{
              display: "inline-block",
              width: 14,
              height: 14,
              borderRadius: 3,
              background: "rgba(180,160,90,0.55)",
              border: "1px solid rgba(180,160,90,0.7)",
            }}
          />
        }
        label="Uncrossed gate"
      />
      <LegendItem
        symbol={<span style={{ fontSize: 14, color: "#C4A05A" }}>✦</span>}
        label="Crossed gate"
      />
      {currentPosition && (
        <LegendItem
          symbol={<span style={{ fontSize: 12, color: "#C4A05A" }}>●</span>}
          label="You are here"
        />
      )}
      {crossedGates.size > 0 && (
        <span style={{ color: "#5a7a5a", fontSize: "0.72rem" }}>
          {crossedGates.size} gate{crossedGates.size !== 1 ? "s" : ""} crossed
        </span>
      )}
    </div>
  );
}

function LegendItem({ symbol, label }: { symbol: React.ReactNode; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#8a9a8a", fontSize: "0.72rem" }}>
      {symbol}
      <span>{label}</span>
    </div>
  );
}

// =============================================================================
// SIDE PANEL
// =============================================================================

function SidePanel({
  selected,
  zoneMap,
  adjMap,
  currentPosition,
  crossedGates,
  selectedChip,
  onSetPosition,
  onSelectChip,
  onCrossGate,
  onClose,
}: {
  selected: SelectedItem;
  zoneMap: Record<string, (typeof ZONE_CONFIG)[number]>;
  adjMap: Record<string, (typeof ADJACENCY_CONFIG)[number]>;
  currentPosition: CurrentPosition;
  crossedGates: Set<string>;
  selectedChip: string | null;
  onSetPosition: (type: "zone" | "gate", id: string) => void;
  onSelectChip: (chip: string | null) => void;
  onCrossGate: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        background: "#111c11",
        borderLeft: "1px solid #2a3a2a",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "slideIn 0.2s ease-out",
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
      `}</style>

      {/* Panel header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 16px 10px",
          borderBottom: "1px solid #2a3a2a",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "#5a7a5a", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {selected.type === "zone" ? "Zone Detail" : "Gate · Gear Up"}
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#5a7a5a",
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
            padding: "0 2px",
          }}
        >
          ×
        </button>
      </div>

      {/* Panel body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {selected.type === "zone" ? (
          <ZonePanel
            zone={zoneMap[selected.id]}
            isCurrent={currentPosition?.type === "zone" && currentPosition.id === selected.id}
            onSetPosition={(id) => onSetPosition("zone", id)}
          />
        ) : (
          <GatePanel
            adj={adjMap[selected.id]}
            zoneMap={zoneMap}
            isCrossed={crossedGates.has(selected.id)}
            isCurrent={currentPosition?.type === "gate" && currentPosition.id === selected.id}
            selectedChip={selectedChip}
            onSetPosition={(id) => onSetPosition("gate", id)}
            onSelectChip={onSelectChip}
            onCrossGate={onCrossGate}
          />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// ZONE PANEL
// =============================================================================

function ZonePanel({
  zone,
  isCurrent,
  onSetPosition,
}: {
  zone: (typeof ZONE_CONFIG)[number];
  isCurrent: boolean;
  onSetPosition: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Zone badge + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: zone.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            fontWeight: 700,
            color: "white",
            flexShrink: 0,
          }}
        >
          {zone.number}
        </div>
        <div>
          <div style={{ color: "white", fontWeight: 700, fontSize: "1rem" }}>{zone.name}</div>
          <div style={{ color: zone.color, fontSize: "0.7rem", marginTop: 2 }}>Zone {zone.number}</div>
        </div>
      </div>

      {/* Description */}
      <p style={{ color: "#b0c0b0", fontSize: "0.82rem", lineHeight: 1.55, margin: 0 }}>
        {zone.description}
      </p>

      {/* Identity */}
      <div
        style={{
          background: "#1a2a1a",
          border: `1px solid ${zone.color}40`,
          borderRadius: 6,
          padding: "10px 12px",
        }}
      >
        <div style={{ color: "#5a7a5a", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>
          Who lives here
        </div>
        <div style={{ color: "#c0d0c0", fontSize: "0.8rem", lineHeight: 1.4 }}>
          {zone.identity}
        </div>
      </div>

      {/* Set position button */}
      {isCurrent ? (
        <div
          style={{
            background: `${zone.color}20`,
            border: `1px solid ${zone.color}60`,
            borderRadius: 6,
            padding: "9px 14px",
            color: zone.color,
            fontSize: "0.78rem",
            textAlign: "center",
          }}
        >
          ● You are here
        </div>
      ) : (
        <button
          onClick={() => onSetPosition(zone.id)}
          style={{
            background: `${zone.color}22`,
            border: `1px solid ${zone.color}55`,
            borderRadius: 6,
            padding: "9px 14px",
            color: zone.color,
            fontSize: "0.78rem",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = `${zone.color}40`)}
          onMouseLeave={(e) => (e.currentTarget.style.background = `${zone.color}22`)}
        >
          Set as my position
        </button>
      )}
    </div>
  );
}

// =============================================================================
// GATE PANEL
// =============================================================================

function GatePanel({
  adj,
  zoneMap,
  isCrossed,
  isCurrent,
  selectedChip,
  onSetPosition,
  onSelectChip,
  onCrossGate,
}: {
  adj: (typeof ADJACENCY_CONFIG)[number];
  zoneMap: Record<string, (typeof ZONE_CONFIG)[number]>;
  isCrossed: boolean;
  isCurrent: boolean;
  selectedChip: string | null;
  onSetPosition: (id: string) => void;
  onSelectChip: (chip: string | null) => void;
  onCrossGate: (id: string) => void;
}) {
  const fromZone = zoneMap[adj.from];
  const toZone = zoneMap[adj.to];
  const blended = blendColors(fromZone.color, toZone.color);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* From → To header */}
      <div
        style={{
          background: "#1a2a1a",
          border: `1px solid ${blended}40`,
          borderRadius: 8,
          padding: "12px 14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ZonePill zone={fromZone} />
          <span style={{ color: "#5a7a5a", fontSize: "1rem" }}>→</span>
          <ZonePill zone={toZone} />
        </div>
        <div style={{ color: "#5a7a5a", fontSize: "0.65rem", marginTop: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Crossing the gate
        </div>
      </div>

      {/* Narrative */}
      <p style={{ color: "#b0c0b0", fontSize: "0.82rem", lineHeight: 1.55, margin: 0 }}>
        {adj.narrative}
      </p>

      {/* Set as my position */}
      {isCurrent ? (
        <div
          style={{
            background: `${blended}20`,
            border: `1px solid ${blended}55`,
            borderRadius: 6,
            padding: "9px 14px",
            color: blended,
            fontSize: "0.78rem",
            textAlign: "center",
          }}
        >
          ● You are here
        </div>
      ) : (
        <button
          onClick={() => onSetPosition(adj.id)}
          style={{
            background: `${blended}18`,
            border: `1px solid ${blended}45`,
            borderRadius: 6,
            padding: "9px 14px",
            color: blended,
            fontSize: "0.78rem",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = `${blended}35`)}
          onMouseLeave={(e) => (e.currentTarget.style.background = `${blended}18`)}
        >
          Set as my position
        </button>
      )}

      {isCrossed ? (
        /* Already crossed */
        <div
          style={{
            background: `${blended}20`,
            border: `1px solid ${blended}55`,
            borderRadius: 6,
            padding: "12px 14px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 20, marginBottom: 4 }}>✦</div>
          <div style={{ color: blended, fontSize: "0.82rem", fontWeight: 600 }}>Gate crossed</div>
          <div style={{ color: "#5a7a5a", fontSize: "0.72rem", marginTop: 4 }}>
            You've made this transition
          </div>
        </div>
      ) : (
        /* Gear-up prompt */
        <>
          <div>
            <div style={{ color: "#8a9a8a", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              What hat are you putting on?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {adj.chips.map((chip) => {
                const active = selectedChip === chip;
                return (
                  <button
                    key={chip}
                    onClick={() => onSelectChip(active ? null : chip)}
                    style={{
                      background: active ? `${blended}35` : "#1a2a1a",
                      border: `1px solid ${active ? blended : "#2a3a2a"}`,
                      borderRadius: 6,
                      padding: "8px 12px",
                      color: active ? "white" : "#8a9a8a",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.borderColor = `${blended}80`;
                        e.currentTarget.style.color = "#b0c0b0";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.borderColor = "#2a3a2a";
                        e.currentTarget.style.color = "#8a9a8a";
                      }
                    }}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            disabled={!selectedChip}
            onClick={() => onCrossGate(adj.id)}
            style={{
              background: selectedChip ? `${blended}30` : "#1a2a1a",
              border: `1px solid ${selectedChip ? blended : "#2a3a2a"}`,
              borderRadius: 6,
              padding: "10px 14px",
              color: selectedChip ? "white" : "#3a4a3a",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: selectedChip ? "pointer" : "not-allowed",
              transition: "all 0.15s",
              letterSpacing: "0.03em",
            }}
          >
            Cross this gate →
          </button>
        </>
      )}
    </div>
  );
}

function ZonePill({ zone }: { zone: (typeof ZONE_CONFIG)[number] }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        background: `${zone.color}20`,
        border: `1px solid ${zone.color}50`,
        borderRadius: 5,
        padding: "3px 8px",
      }}
    >
      <span style={{ color: zone.color, fontWeight: 700, fontSize: "0.78rem" }}>{zone.number}</span>
      <span style={{ color: "#b0c0b0", fontSize: "0.75rem" }}>{zone.name}</span>
    </div>
  );
}
