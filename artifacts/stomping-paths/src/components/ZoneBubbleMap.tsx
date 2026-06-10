/**
 * ZoneBubbleMap — Read-only Zone Bubble & Gate diagram for the Lifestyle Map page.
 *
 * Ported from the mockup-sandbox prototype and extended to all 6 TSP zones.
 * - Shows concentric zone ellipses with correct zone colors
 * - Gate membranes at each zone boundary; clicking scrolls to / highlights zone cards
 * - "You are here" marker on the primary zone
 * - Prohibition arc from Z1→Z3 (skip Z2)
 * - Eave overhang ring visible at Z0/Z1 boundary
 */

import { useState, useCallback } from "react";

// ─── types ────────────────────────────────────────────────────────────────────

type ZoneDef = {
  slug: string;         // matches zones.ts slugs: "zone-0" … "zone-5"
  number: number;
  name: string;
  color: string;
  fillColor: string;
  cx: number; cy: number; rx: number; ry: number;
};

type GateKind = "eave-flow" | "gear-up" | "prohibition";

type GateDef = {
  id: string;
  fromSlug: string;
  toSlug: string;
  kind: GateKind;
  label: string;
  color: string;
  cx: number; cy: number;
};

// ─── zone + gate data ─────────────────────────────────────────────────────────
// SVG viewBox: 880 × 460  — center (440, 230)
// Zones ordered innermost first; rendered outermost first via .reverse()

const ZONES: ZoneDef[] = [
  { slug: "zone-0", number: 0, name: "The Self",      color: "#B5853A", fillColor: "#1A1205", cx: 440, cy: 230, rx: 62,  ry: 37  },
  { slug: "zone-1", number: 1, name: "The Home",      color: "#C4A05A", fillColor: "#18140A", cx: 440, cy: 230, rx: 124, ry: 74  },
  { slug: "zone-2", number: 2, name: "The Garden",    color: "#6B8F47", fillColor: "#0E1808", cx: 440, cy: 230, rx: 192, ry: 115 },
  { slug: "zone-3", number: 3, name: "The Homestead", color: "#4A7A3A", fillColor: "#091208", cx: 440, cy: 230, rx: 262, ry: 157 },
  { slug: "zone-4", number: 4, name: "The Forest",    color: "#2C5F2E", fillColor: "#060E06", cx: 440, cy: 230, rx: 330, ry: 196 },
  { slug: "zone-5", number: 5, name: "The Wild",      color: "#1A3A1C", fillColor: "#030803", cx: 440, cy: 230, rx: 392, ry: 218 },
];

// Gate x positions sit at the midpoint between adjacent zone east edges
// Z0 east: 502 | Z1 east: 564 | Z2 east: 632 | Z3 east: 702 | Z4 east: 770 | Z5 east: 832
const GATES: GateDef[] = [
  {
    id: "g-z0-z1", fromSlug: "zone-0", toSlug: "zone-1",
    kind: "eave-flow", label: "Eave Flow",
    color: "#9ABF6A",
    cx: 533, cy: 230,
  },
  {
    id: "g-z1-z2", fromSlug: "zone-1", toSlug: "zone-2",
    kind: "gear-up", label: "Garden Gate",
    color: "#7EAA58",
    cx: 598, cy: 230,
  },
  {
    id: "g-z2-z3", fromSlug: "zone-2", toSlug: "zone-3",
    kind: "gear-up", label: "Homestead Gate",
    color: "#5A9E42",
    cx: 667, cy: 230,
  },
  {
    id: "g-z3-z4", fromSlug: "zone-3", toSlug: "zone-4",
    kind: "gear-up", label: "Forest Gate",
    color: "#3D7A3A",
    cx: 736, cy: 230,
  },
  {
    id: "g-z4-z5", fromSlug: "zone-4", toSlug: "zone-5",
    kind: "gear-up", label: "Wilds Gate",
    color: "#24572A",
    cx: 801, cy: 230,
  },
  // Z1→Z3 absolute prohibition (skip Z2)
  {
    id: "g-z1-z3-prohibited", fromSlug: "zone-1", toSlug: "zone-3",
    kind: "prohibition", label: "Z1→Z3 Prohibited",
    color: "#CC3333",
    cx: 598, cy: 140,
  },
];

// Eave overhang: subtle green halo just outside Z1
const EAVE = { cx: 440, cy: 230, rx: 134, ry: 80, color: "#4EAA34" };

// ─── helpers ──────────────────────────────────────────────────────────────────

function blendHex(a: string, b: string): string {
  const p = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [ar, ag, ab] = p(a);
  const [br, bg, bb] = p(b);
  const x = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${x((ar + br) / 2)}${x((ag + bg) / 2)}${x((ab + bb) / 2)}`;
}

function zoneBySlug(slug: string): ZoneDef {
  return ZONES.find((z) => z.slug === slug) ?? ZONES[0];
}

// ─── tooltip ──────────────────────────────────────────────────────────────────

function GateTooltip({
  gate,
  x,
  y,
}: {
  gate: GateDef;
  x: number;
  y: number;
}) {
  if (gate.kind === "prohibition") {
    return (
      <g style={{ pointerEvents: "none" }}>
        <rect
          x={x - 70} y={y - 44}
          width={140} height={36}
          rx={5}
          fill="#1A0808" stroke="#CC333344"
          strokeWidth={1}
        />
        <text x={x} y={y - 28} textAnchor="middle" fill="#CC3333" fontSize={9} fontWeight="700" letterSpacing="0.07em" style={{ fontFamily: "system-ui", userSelect: "none" }}>
          Z1→Z3: NO DIRECT PATH
        </text>
        <text x={x} y={y - 16} textAnchor="middle" fill="#CC333399" fontSize={8} style={{ fontFamily: "system-ui", userSelect: "none" }}>
          Must go through Z2
        </text>
      </g>
    );
  }

  const from = zoneBySlug(gate.fromSlug);
  const to = zoneBySlug(gate.toSlug);
  const label = gate.kind === "eave-flow" ? "Eave Flow" : gate.label;
  const action = "Click to go to zone";

  return (
    <g style={{ pointerEvents: "none" }}>
      <rect
        x={x - 72} y={y - 52}
        width={144} height={44}
        rx={5}
        fill="#0E1A0E" stroke={gate.color + "55"}
        strokeWidth={1}
      />
      <text x={x} y={y - 36} textAnchor="middle" fill={gate.color} fontSize={9} fontWeight="700" letterSpacing="0.06em" style={{ fontFamily: "system-ui", userSelect: "none" }}>
        {label}
      </text>
      <text x={x} y={y - 24} textAnchor="middle" fill="#7A8A7A" fontSize={8} style={{ fontFamily: "system-ui", userSelect: "none" }}>
        {from.name} → {to.name}
      </text>
      <text x={x} y={y - 12} textAnchor="middle" fill={gate.color + "99"} fontSize={7.5} style={{ fontFamily: "system-ui", userSelect: "none" }}>
        {action}
      </text>
    </g>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

type Props = {
  /** slug of the user's primary zone, e.g. "zone-2" */
  primaryZone?: string | null;
  /** slugs the user has already visited */
  visitedZones?: string[];
  /** called when a zone bubble or gate is clicked — scroll target */
  onZoneClick?: (slug: string) => void;
};

export default function ZoneBubbleMap({
  primaryZone,
  visitedZones = [],
  onZoneClick,
}: Props) {
  const [hoveredGateId, setHoveredGateId] = useState<string | null>(null);
  const [flashedSlug, setFlashedSlug] = useState<string | null>(null);

  const handleGateClick = useCallback(
    (gate: GateDef) => {
      if (gate.kind === "prohibition") return;
      const target = gate.toSlug;
      setFlashedSlug(target);
      setTimeout(() => setFlashedSlug(null), 1400);
      onZoneClick?.(target);
    },
    [onZoneClick],
  );

  const handleZoneClick = useCallback(
    (slug: string) => {
      setFlashedSlug(slug);
      setTimeout(() => setFlashedSlug(null), 1400);
      onZoneClick?.(slug);
    },
    [onZoneClick],
  );

  const primaryDef = primaryZone ? zoneBySlug(primaryZone) : null;
  const zonesOuterFirst = [...ZONES].reverse();

  // Z1 / Z3 references for prohibition arc endpoints
  const z1 = zoneBySlug("zone-1");
  const z3 = zoneBySlug("zone-3");
  const hoveredGate = hoveredGateId ? GATES.find((g) => g.id === hoveredGateId) ?? null : null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0D1A10 0%, #09130B 45%, #060E08 75%, #040B06 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        backgroundImage: [
          "linear-gradient(160deg, #0D1A10 0%, #09130B 45%, #060E08 75%, #040B06 100%)",
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.055'/%3E%3C/svg%3E\")",
        ].join(", "),
      }}
    >
      {/* ── SVG diagram ── */}
      <div style={{ position: "relative", width: "100%" }}>
        <svg
          viewBox="0 0 880 460"
          style={{ width: "100%", display: "block" }}
          aria-label="TSP Zone Bubble and Gate Map"
        >
          <defs>
            <filter id="zbm-eave-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="zbm-gate-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="zbm-marker-glow" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="zbm-flash-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Per-zone radial gradients: dark core → zone color glow at rim */}
            <radialGradient id="zbm-fill-z0" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#100B02" />
              <stop offset="70%"  stopColor="#1A1205" />
              <stop offset="100%" stopColor="#B5853A" stopOpacity="0.45" />
            </radialGradient>
            <radialGradient id="zbm-fill-z1" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#0E0C04" />
              <stop offset="65%"  stopColor="#18140A" />
              <stop offset="100%" stopColor="#C4A05A" stopOpacity="0.38" />
            </radialGradient>
            <radialGradient id="zbm-fill-z2" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#080E04" />
              <stop offset="65%"  stopColor="#0E1808" />
              <stop offset="100%" stopColor="#6B8F47" stopOpacity="0.35" />
            </radialGradient>
            <radialGradient id="zbm-fill-z3" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#050D04" />
              <stop offset="65%"  stopColor="#091208" />
              <stop offset="100%" stopColor="#4A7A3A" stopOpacity="0.32" />
            </radialGradient>
            <radialGradient id="zbm-fill-z4" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#030A03" />
              <stop offset="65%"  stopColor="#060E06" />
              <stop offset="100%" stopColor="#2C5F2E" stopOpacity="0.30" />
            </radialGradient>
            <radialGradient id="zbm-fill-z5" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#020703" />
              <stop offset="65%"  stopColor="#030803" />
              <stop offset="100%" stopColor="#1A3A1C" stopOpacity="0.28" />
            </radialGradient>
          </defs>

          {/* Zone ellipses — outermost first */}
          {zonesOuterFirst.map((zone) => {
            const isPrimary = zone.slug === primaryZone;
            const isVisited = visitedZones.includes(zone.slug);
            const isFlashing = zone.slug === flashedSlug;
            const gradId = `zbm-fill-z${zone.number}`;

            return (
              <g
                key={zone.slug}
                onClick={() => handleZoneClick(zone.slug)}
                style={{ cursor: "pointer" }}
                aria-label={`Zone ${zone.number}: ${zone.name}`}
              >
                {/* Flash highlight ring */}
                {isFlashing && (
                  <ellipse
                    cx={zone.cx} cy={zone.cy} rx={zone.rx + 6} ry={zone.ry + 6}
                    fill="none"
                    stroke={zone.color}
                    strokeWidth={4}
                    opacity={0.6}
                    filter="url(#zbm-flash-glow)"
                  />
                )}

                <ellipse
                  cx={zone.cx} cy={zone.cy} rx={zone.rx} ry={zone.ry}
                  fill={`url(#${gradId})`}
                  stroke={zone.color}
                  strokeWidth={isPrimary ? 2.5 : isVisited ? 2 : 1.5}
                  opacity={0.97}
                />

                {/* Zone number + name — centered inside each ellipse (small, non-competing) */}
                <text
                  x={zone.cx}
                  y={zone.cy - 4}
                  textAnchor="middle"
                  fill={zone.color}
                  fontSize={zone.number >= 4 ? 9 : 8}
                  fontWeight="700"
                  letterSpacing="0.08em"
                  opacity={0.65}
                  style={{ fontFamily: "Georgia, serif", userSelect: "none" }}
                >
                  Z{zone.number}
                </text>
                <text
                  x={zone.cx}
                  y={zone.cy + 7}
                  textAnchor="middle"
                  fill={zone.color}
                  fontSize={7}
                  letterSpacing="0.04em"
                  opacity={0.45}
                  style={{ fontFamily: "system-ui, sans-serif", userSelect: "none" }}
                >
                  {zone.name}
                </text>

                {/* Zone number — bottom-left corner label (larger, easier to scan) */}
                <text
                  x={zone.cx - zone.rx * 0.55}
                  y={zone.cy + zone.ry - 18}
                  fill={zone.color}
                  fontSize={zone.number >= 4 ? 13 : 11}
                  fontWeight="700"
                  letterSpacing="0.07em"
                  style={{ fontFamily: "Georgia, serif", userSelect: "none" }}
                >
                  Z{zone.number}
                </text>

                {/* Zone name — bottom-left inside */}
                <text
                  x={zone.cx - zone.rx * 0.55}
                  y={zone.cy + zone.ry - 5}
                  fill={zone.color + "88"}
                  fontSize={8.5}
                  letterSpacing="0.04em"
                  style={{ fontFamily: "system-ui, sans-serif", userSelect: "none" }}
                >
                  {zone.name}
                </text>
              </g>
            );
          })}

          {/* Eave overhang ring (sits just outside Z1) */}
          <ellipse
            cx={EAVE.cx} cy={EAVE.cy} rx={EAVE.rx} ry={EAVE.ry}
            fill="none"
            stroke={EAVE.color}
            strokeWidth={10}
            opacity={0.28}
            filter="url(#zbm-eave-glow)"
            style={{ pointerEvents: "none" }}
          />
          <text
            x={EAVE.cx - EAVE.rx + 6}
            y={EAVE.cy - EAVE.ry + 13}
            fill={EAVE.color}
            fontSize={7.5}
            fontWeight="700"
            letterSpacing="0.1em"
            opacity={0.5}
            style={{ fontFamily: "system-ui, sans-serif", userSelect: "none" }}
          >
            EAVE
          </text>

          {/* Gates */}
          {GATES.map((gate) => {
            const isHovered = hoveredGateId === gate.id;

            if (gate.kind === "prohibition") {
              return (
                <g
                  key={gate.id}
                  style={{ pointerEvents: "none" }}
                  aria-label="Z1 to Z3 direct crossing is prohibited"
                >
                  <line
                    x1={z1.cx + z1.rx * 0.12}
                    y1={z1.cy - z1.ry}
                    x2={z3.cx + z3.rx * 0.52}
                    y2={z3.cy - z3.ry * 0.44}
                    stroke="#CC3333"
                    strokeWidth={1.8}
                    strokeDasharray="7 5"
                    opacity={0.55}
                  />
                  <circle
                    cx={gate.cx} cy={gate.cy} r={14}
                    fill="#CC333318"
                    stroke="#CC3333"
                    strokeWidth={1.5}
                    opacity={0.8}
                  />
                  <text
                    x={gate.cx} y={gate.cy + 5}
                    textAnchor="middle"
                    fill="#CC3333"
                    fontSize={14}
                    fontWeight="900"
                    style={{ userSelect: "none" }}
                  >
                    ⊘
                  </text>
                  <text
                    x={gate.cx} y={gate.cy + 24}
                    textAnchor="middle"
                    fill="#CC333399"
                    fontSize={7}
                    letterSpacing="0.07em"
                    style={{ fontFamily: "system-ui", userSelect: "none" }}
                  >
                    PROHIBITED
                  </text>
                </g>
              );
            }

            const fromZone = zoneBySlug(gate.fromSlug);
            const toZone = zoneBySlug(gate.toSlug);
            const membraneColor = blendHex(fromZone.color, toZone.color);

            return (
              <g
                key={gate.id}
                onClick={() => handleGateClick(gate)}
                onMouseEnter={() => setHoveredGateId(gate.id)}
                onMouseLeave={() => setHoveredGateId(null)}
                style={{ cursor: "pointer" }}
                aria-label={`Gate: ${gate.label} — ${fromZone.name} to ${toZone.name}`}
              >
                <circle
                  cx={gate.cx} cy={gate.cy} r={18}
                  fill={isHovered ? membraneColor + "55" : membraneColor + "22"}
                  stroke={membraneColor}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  opacity={0.95}
                  filter="url(#zbm-gate-glow)"
                />
                <text
                  x={gate.cx} y={gate.cy + 5}
                  textAnchor="middle"
                  fill={isHovered ? "#fff" : membraneColor}
                  fontSize={14}
                  style={{ userSelect: "none" }}
                >
                  {gate.kind === "eave-flow" ? "🌿" : "⬡"}
                </text>
                <text
                  x={gate.cx} y={gate.cy + 31}
                  textAnchor="middle"
                  fill={membraneColor + "99"}
                  fontSize={7.5}
                  letterSpacing="0.06em"
                  style={{ fontFamily: "system-ui", userSelect: "none" }}
                >
                  {gate.kind === "eave-flow" ? "EAVE" : gate.label.split(" ")[0].toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* "You are here" marker */}
          {primaryDef && (
            <g style={{ pointerEvents: "none" }}>
              <circle
                cx={primaryDef.cx} cy={primaryDef.cy} r={20}
                fill="none"
                stroke={primaryDef.color}
                strokeWidth={1.5}
                opacity={0.3}
                filter="url(#zbm-marker-glow)"
              />
              <circle
                cx={primaryDef.cx} cy={primaryDef.cy} r={9}
                fill={primaryDef.color}
                opacity={0.92}
              />
              <text
                x={primaryDef.cx} y={primaryDef.cy - 26}
                textAnchor="middle"
                fill={primaryDef.color}
                fontSize={8}
                fontWeight="700"
                letterSpacing="0.07em"
                style={{ fontFamily: "system-ui", userSelect: "none" }}
              >
                YOU ARE HERE
              </text>
            </g>
          )}

          {/* Gate tooltip (rendered last so it floats above everything) */}
          {hoveredGate && (
            <GateTooltip
              gate={hoveredGate}
              x={hoveredGate.cx}
              y={hoveredGate.cy}
            />
          )}
        </svg>
      </div>

      {/* ── Legend strip ── */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "8px 18px",
          display: "flex",
          gap: 18,
          flexWrap: "wrap",
          fontSize: 10,
          color: "#556655",
        }}
      >
        {[
          { color: "#7ABF5E", label: "Eave Flow  (Z0→Z1)" },
          { color: "#6A9A55", label: "Gate membrane — click to go to zone" },
          { color: "#CC3333", label: "⊘  Z1→Z3 — no direct crossing" },
          ...(primaryZone ? [{ color: zoneBySlug(primaryZone).color, label: "● You are here" }] : []),
        ].map((item) => (
          <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                width: 7, height: 7,
                borderRadius: "50%",
                background: item.color,
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
