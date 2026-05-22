/**
 * ZoneBubbleMap — Interactive Zone Bubble & Gate Map
 *
 * Drive zone/adjacency data entirely from ACTIVE_CONFIG below.
 * Swap ACTIVE_CONFIG to change zone sets without touching interaction logic.
 *
 * Built to the updated Eave Rule model:
 * - Two-gate model (Z0/Z1 Eave Flow + Z1/Z2 and Z2/Z3 Gear-Up)
 * - Z0→Z1 uses distinct Eave Flow interaction, not a hat ceremony
 * - Z2→Z3 enforces the resolved Gatekeeper model (personal hat — locked)
 * - Z1→Z3 absolute prohibition shown as dashed/redacted membrane
 * - Giraffe protection language in Z2→Z3 panel
 * - Every label passes Saltbox, Both-States, and Both-Sides naming tests
 */

import { useState, useCallback, useEffect } from "react";

// ============================================================
// TYPES
// ============================================================

type ZoneId = string;

type ZoneDef = {
  id: ZoneId;
  number: number;
  name: string;
  subtitle: string;
  color: string;
  fillColor: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
};

type GateKind = "eave-flow" | "gear-up" | "prohibition";

type HatVariant = {
  id: string;
  label: string;
  description: string;
  side?: "personal" | "workbench";
};

type GateDef = {
  id: string;
  from: ZoneId;
  to: ZoneId;
  kind: GateKind;
  label: string;
  color: string;
  hats?: HatVariant[];
  eaveOptions?: { open: string; clear: string };
  gatekeeperModel?: "personal" | "workbench-only";
  gatekeeperResolution?: string;
  giraffeNote?: string;
  cx: number;
  cy: number;
};

type EaveDef = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  color: string;
};

type ZoneSetConfig = {
  name: string;
  zones: ZoneDef[];
  gates: GateDef[];
  eave: EaveDef;
  viewBox?: string;
};

// ============================================================
// CONFIG — TSP 4-ZONE MODEL (wired and active)
// ============================================================

const TSP_4_ZONE_CONFIG: ZoneSetConfig = {
  name: "TSP 4-Zone",

  // Zones listed innermost-first so config reads inside-out.
  // SVG renders them outermost-first (array reversed below).
  // Ellipses are slightly offset from each other for an organic feel.
  zones: [
    {
      id: "z0",
      number: 0,
      name: "The Self",
      subtitle: "Sovereignty begins here",
      color: "#B5853A",
      fillColor: "#1A1205",
      cx: 402, cy: 256, rx: 90, ry: 54,
    },
    {
      id: "z1",
      number: 1,
      name: "The Home",
      subtitle: "Daily life, resilient by design",
      color: "#C4A05A",
      fillColor: "#18140A",
      cx: 406, cy: 253, rx: 183, ry: 110,
    },
    {
      id: "z2",
      number: 2,
      name: "The Garden",
      subtitle: "Growing food, building soil",
      color: "#6B8F47",
      fillColor: "#0E1808",
      cx: 410, cy: 250, rx: 280, ry: 168,
    },
    {
      id: "z3",
      number: 3,
      name: "The Homestead",
      subtitle: "Working land, real systems",
      color: "#4A7A3A",
      fillColor: "#091208",
      cx: 413, cy: 248, rx: 388, ry: 233,
    },
  ],

  // Gates are positioned at the boundary of each zone pair (east side for navigability).
  gates: [
    // ── Z0 → Z1 ── Eave Flow (not a hat ceremony)
    {
      id: "gate-z0-z1",
      from: "z0",
      to: "z1",
      kind: "eave-flow",
      label: "Eave Flow",
      color: "#7ABF5E",
      eaveOptions: {
        open: "Open the flow",
        clear: "Clear the leaves",
      },
      cx: 492, cy: 256,
    },

    // ── Z1 → Z2 ── Gear-Up: Garden Gate
    {
      id: "gate-z1-z2",
      from: "z1",
      to: "z2",
      kind: "gear-up",
      label: "Garden Gate",
      color: "#94B85A",
      hats: [
        {
          id: "practitioner",
          label: "Practitioner",
          description: "I'm here to build and apply hands-on skills. I am in the work.",
        },
        {
          id: "steward",
          label: "Steward",
          description: "I'm here to tend, sustain, and protect what's already growing.",
        },
        {
          id: "observer",
          label: "Observer",
          description: "I'm here to watch, study, and learn the system before I act.",
        },
      ],
      cx: 589, cy: 253,
    },

    // ── Z2 → Z3 ── Gear-Up: Homestead Gate (with Gatekeeper variants)
    {
      id: "gate-z2-z3",
      from: "z2",
      to: "z3",
      kind: "gear-up",
      label: "Homestead Gate",
      color: "#5A9E42",
      hats: [
        {
          id: "representative",
          label: "Representative",
          description: "I act on behalf of the whole holding. My decisions bind the land.",
          side: "personal",
        },
        {
          id: "neighbour",
          label: "Neighbour",
          description: "I arrive at the boundary as a peer — I don't own this land.",
          side: "personal",
        },
        {
          id: "gatekeeper-personal",
          label: "Gatekeeper",
          description:
            "I hold and enforce the crossing rules. This is a personal hat — I carry it across the threshold.",
          side: "personal",
        },
      ],
      gatekeeperModel: "personal",
      gatekeeperResolution:
        "Resolved (Round Table — May 2026): Gatekeeper is a personal hat. The individual wears it at crossing and carries its obligations across the threshold. The Workbench-only model was considered and set aside — it created an unworkable separation between the decision-maker and the rule they enforce.",
      giraffeNote:
        "Credential appears at crossing only — it is never stored inside Z2 records. Audit visibility is allowed. No composable reverse path back to Z1 exists (giraffe protection: you cannot reconstruct the Z1 identity from Z3 data).",
      cx: 690, cy: 250,
    },

    // ── Z1 → Z3 ── Absolute prohibition (structural, not a locked gate)
    {
      id: "gate-z1-z3-prohibition",
      from: "z1",
      to: "z3",
      kind: "prohibition",
      label: "Z1→Z3 Prohibited",
      color: "#CC3333",
      cx: 592, cy: 164,
    },
  ],

  // Eave overhang: visible green ring that sits structurally behind Z0–Z2,
  // rendered as a slightly larger shape than Z2 so it peeks out at Z2's edge.
  eave: {
    cx: 410, cy: 250, rx: 296, ry: 178,
    color: "#4EAA34",
  },
};

// ============================================================
// CONFIG — TSP 6-ZONE MODEL (fully wired)
// Zone positions re-centered for the wider 1100-wide canvas.
// Swap ACTIVE_CONFIG below to activate.
// ============================================================

const TSP_6_ZONE_CONFIG: ZoneSetConfig = {
  name: "TSP 6-Zone",
  viewBox: "0 0 1100 500",

  // Zones listed innermost-first; SVG renders outermost-first (array reversed below).
  // Centers shift slightly outward for an organic layered feel.
  zones: [
    {
      id: "z0",
      number: 0,
      name: "The Self",
      subtitle: "Sovereignty begins here",
      color: "#B5853A",
      fillColor: "#1A1205",
      cx: 475, cy: 256, rx: 90, ry: 54,
    },
    {
      id: "z1",
      number: 1,
      name: "The Home",
      subtitle: "Daily life, resilient by design",
      color: "#C4A05A",
      fillColor: "#18140A",
      cx: 479, cy: 253, rx: 183, ry: 110,
    },
    {
      id: "z2",
      number: 2,
      name: "The Garden",
      subtitle: "Growing food, building soil",
      color: "#6B8F47",
      fillColor: "#0E1808",
      cx: 483, cy: 250, rx: 280, ry: 168,
    },
    {
      id: "z3",
      number: 3,
      name: "The Homestead",
      subtitle: "Working land, real systems",
      color: "#4A7A3A",
      fillColor: "#091208",
      cx: 486, cy: 248, rx: 388, ry: 233,
    },
    {
      id: "z4",
      number: 4,
      name: "The Forest",
      subtitle: "Wild harvest, managed wilderness",
      color: "#2C5F2E",
      fillColor: "#050F05",
      cx: 489, cy: 246, rx: 490, ry: 290,
    },
    {
      id: "z5",
      number: 5,
      name: "The Wild",
      subtitle: "Unmanaged, unpredictable, essential",
      color: "#1A3A1C",
      fillColor: "#020802",
      cx: 492, cy: 244, rx: 595, ry: 348,
    },
  ],

  gates: [
    // ── Z0 → Z1 ── Eave Flow (not a hat ceremony)
    {
      id: "gate-z0-z1",
      from: "z0",
      to: "z1",
      kind: "eave-flow",
      label: "Eave Flow",
      color: "#7ABF5E",
      eaveOptions: {
        open: "Open the flow",
        clear: "Clear the leaves",
      },
      cx: 565, cy: 256,
    },

    // ── Z1 → Z2 ── Gear-Up: Garden Gate
    {
      id: "gate-z1-z2",
      from: "z1",
      to: "z2",
      kind: "gear-up",
      label: "Garden Gate",
      color: "#94B85A",
      hats: [
        {
          id: "practitioner",
          label: "Practitioner",
          description: "I'm here to build and apply hands-on skills. I am in the work.",
        },
        {
          id: "steward",
          label: "Steward",
          description: "I'm here to tend, sustain, and protect what's already growing.",
        },
        {
          id: "observer",
          label: "Observer",
          description: "I'm here to watch, study, and learn the system before I act.",
        },
      ],
      cx: 662, cy: 253,
    },

    // ── Z2 → Z3 ── Gear-Up: Homestead Gate (with Gatekeeper variants)
    {
      id: "gate-z2-z3",
      from: "z2",
      to: "z3",
      kind: "gear-up",
      label: "Homestead Gate",
      color: "#5A9E42",
      hats: [
        {
          id: "representative",
          label: "Representative",
          description: "I act on behalf of the whole holding. My decisions bind the land.",
          side: "personal",
        },
        {
          id: "neighbour",
          label: "Neighbour",
          description: "I arrive at the boundary as a peer — I don't own this land.",
          side: "personal",
        },
        {
          id: "gatekeeper-personal",
          label: "Gatekeeper",
          description:
            "I hold and enforce the crossing rules. This is a personal hat — I carry it across the threshold.",
          side: "personal",
        },
        {
          id: "gatekeeper-workbench",
          label: "Gatekeeper (Workbench only)",
          description:
            "The Gatekeeper role belongs solely to the Workbench — it cannot be worn by an individual. It enforces the gate but is never a personal identity.",
          side: "workbench",
        },
      ],
      gatekeeperTension:
        "Unresolved tension: Is 'Gatekeeper' a personal hat the individual wears at crossing, or a role that can only be held by the Workbench and never by a person? Both models are coherent in different architectures. This choice must be locked before the gate goes into production.",
      giraffeNote:
        "Credential appears at crossing only — it is never stored inside Z2 records. Audit visibility is allowed. No composable reverse path back to Z1 exists (giraffe protection: you cannot reconstruct the Z1 identity from Z3 data).",
      cx: 763, cy: 250,
    },

    // ── Z3 → Z4 ── Gear-Up: Forest Gate
    {
      id: "gate-z3-z4",
      from: "z3",
      to: "z4",
      kind: "gear-up",
      label: "Forest Gate",
      color: "#3B7034",
      hats: [
        {
          id: "harvester",
          label: "Harvester",
          description:
            "I'm here to take from the wild with skill and intention. The outer margin provides what the homestead cannot.",
        },
        {
          id: "scout",
          label: "Scout",
          description:
            "I'm learning the terrain — mapping what exists before I claim it. I don't harvest until I understand.",
        },
        {
          id: "steward",
          label: "Steward",
          description:
            "I tend the outer margin as I tend the inner zones: sustainably, with long horizons and no waste.",
        },
      ],
      cx: 874, cy: 248,
    },

    // ── Z4 → Z5 ── Gear-Up: Wild Gate
    {
      id: "gate-z4-z5",
      from: "z4",
      to: "z5",
      kind: "gear-up",
      label: "Wild Gate",
      color: "#234D25",
      hats: [
        {
          id: "contingency",
          label: "Contingency Planner",
          description:
            "I'm pre-walking this ground in my mind. I'm here to know Zone 5 before I ever need to live in it.",
        },
        {
          id: "survivor",
          label: "Survivor",
          description:
            "I've stepped past managed systems. My preparation is everything I carry. Civilization ends at this threshold.",
        },
      ],
      giraffeNote:
        "Zone 5 is the edge of the map. No infrastructure, no supply chain, no grid. Whatever identity you carry here must be self-sufficient — nothing from the inner zones follows you in.",
      cx: 979, cy: 246,
    },

    // ── Z1 → Z3 ── Absolute prohibition (structural, not a locked gate)
    {
      id: "gate-z1-z3-prohibition",
      from: "z1",
      to: "z3",
      kind: "prohibition",
      label: "Z1→Z3 Prohibited",
      color: "#CC3333",
      cx: 663, cy: 164,
    },
  ],

  // Eave overhang: sits structurally between Z0 and Z2 — same in all zone models.
  eave: {
    cx: 483, cy: 250, rx: 296, ry: 178,
    color: "#4EAA34",
  },
};

// ============================================================
// ACTIVE CONFIG — swap here to change zone set
// ============================================================

const ACTIVE_CONFIG: ZoneSetConfig = TSP_6_ZONE_CONFIG;

// ============================================================
// ZONE PROGRESS — fetch listened/total counts per zone
// ============================================================

type ZoneProgressItem = {
  slug: string;
  number: number;
  listened: number;
  total: number;
};

type ZoneProgressMap = Record<string, ZoneProgressItem>;

function useZoneProgress(): ZoneProgressMap | null {
  const [data, setData] = useState<ZoneProgressMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/zones/progress", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return;
        const items = (await res.json()) as ZoneProgressItem[];
        if (cancelled) return;
        const map: ZoneProgressMap = {};
        for (const item of items) {
          map[item.slug] = item;
        }
        setData(map);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}

/** Approximate ellipse perimeter via Ramanujan's second formula. */
function ellipsePerimeter(rx: number, ry: number): number {
  const h = Math.pow((rx - ry) / (rx + ry), 2);
  return Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}

// ============================================================
// HELPERS
// ============================================================

function blendColors(a: string, b: string): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${hex((ar + br) / 2)}${hex((ag + bg) / 2)}${hex((ab + bb) / 2)}`;
}

// ============================================================
// GATE PANELS
// ============================================================

function BrowseEpisodesLink({ zoneNumber, zoneColor }: { zoneNumber: number; zoneColor: string }) {
  const href = `/episodes?zone=zone-${zoneNumber}`;
  return (
    <a
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "10px 16px",
        borderRadius: 10,
        border: `1px solid ${zoneColor}44`,
        background: zoneColor + "14",
        color: zoneColor,
        fontSize: 12,
        fontWeight: 600,
        textDecoration: "none",
        transition: "background 0.15s",
      }}
    >
      <span style={{ fontSize: 14 }}>🎧</span>
      Browse episodes for this zone
      <span style={{ fontSize: 12, opacity: 0.7 }}>→</span>
    </a>
  );
}

function EaveFlowPanel({
  gate,
  toZone,
  onConfirm,
  onClose,
}: {
  gate: GateDef;
  toZone: ZoneDef;
  onConfirm: (choice: string) => void;
  onClose: () => void;
}) {
  const [choice, setChoice] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function handleCross() {
    if (!choice) return;
    setConfirmed(true);
    setTimeout(() => {
      onConfirm(choice);
      onClose();
    }, 900);
  }

  if (confirmed) {
    return (
      <div className="p-8 text-center space-y-3">
        <div style={{ fontSize: 40 }}>🌿</div>
        <p className="font-serif text-xl font-bold" style={{ color: gate.color }}>
          Flow opened.
        </p>
        <p className="text-sm" style={{ color: "#88AA88" }}>
          The Eave carries you through.
        </p>
      </div>
    );
  }

  const options = [
    {
      id: "open",
      label: gate.eaveOptions!.open,
      desc: "You arrive in The Home with intention — ready to show up in daily life.",
    },
    {
      id: "clear",
      label: gate.eaveOptions!.clear,
      desc: "You clear what blocks the threshold — releasing before you arrive.",
    },
  ];

  return (
    <div className="p-6 space-y-5">
      <div>
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-1"
          style={{ color: gate.color }}
        >
          Z0 → Z1 — Eave Flow
        </p>
        <h2 className="font-serif text-2xl font-bold" style={{ color: "#E8EBE8" }}>
          The Eave Flow
        </h2>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: "#7A8A7A" }}>
          The Eave is the canopy that shelters The Self into The Home. This is{" "}
          <strong style={{ color: "#AAC8AA" }}>not a hat ceremony</strong> — there is no role to
          put on. The Eave Flow is a threshold of presence, not permission. You move through it
          by choosing your posture as you arrive.
        </p>
      </div>

      <div className="space-y-2">
        <p
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "#556655" }}
        >
          How are you crossing?
        </p>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setChoice(opt.id)}
            className="w-full text-left p-4 rounded-xl border-2 transition-all"
            style={{
              borderColor: choice === opt.id ? gate.color : "#2A3A2A",
              background: choice === opt.id ? gate.color + "22" : "#111A11",
            }}
          >
            <p className="font-semibold text-sm" style={{ color: "#D8EBD8" }}>
              {opt.label}
            </p>
            <p className="text-xs mt-0.5 leading-snug" style={{ color: "#6A7A6A" }}>
              {opt.desc}
            </p>
          </button>
        ))}
      </div>

      <button
        onClick={handleCross}
        disabled={!choice}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
        style={{
          background: choice ? gate.color : "#1A2A1A",
          color: choice ? "#fff" : "#445544",
          border: `1px solid ${choice ? gate.color : "#2A3A2A"}`,
          cursor: choice ? "pointer" : "not-allowed",
        }}
      >
        Cross the Eave
      </button>

      <BrowseEpisodesLink zoneNumber={toZone.number} zoneColor={toZone.color} />
    </div>
  );
}

function GearUpPanel({
  gate,
  fromZone,
  toZone,
  onConfirm,
  onClose,
}: {
  gate: GateDef;
  fromZone: ZoneDef;
  toZone: ZoneDef;
  onConfirm: (hatId: string) => void;
  onClose: () => void;
}) {
  const [selectedHat, setSelectedHat] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "narrative" | "confirmed">("select");

  // Enforce the resolved gatekeeper model: filter out the variant that was not chosen.
  const visibleHats = gate.hats?.filter((hat) => {
    if (!gate.gatekeeperModel) return true;
    if (hat.id === "gatekeeper-workbench" && gate.gatekeeperModel === "personal") return false;
    if (hat.id === "gatekeeper-personal" && gate.gatekeeperModel === "workbench-only") return false;
    return true;
  }) ?? [];

  const personalHats = visibleHats.filter((h) => h.side !== "workbench");
  const workbenchHats = visibleHats.filter((h) => h.side === "workbench");
  const hasVariants = workbenchHats.length > 0;
  const selectedHatDef = visibleHats.find((h) => h.id === selectedHat);

  if (step === "confirmed") {
    return (
      <div className="p-8 text-center space-y-3">
        <div style={{ fontSize: 40 }}>🎩</div>
        <p className="font-serif text-xl font-bold" style={{ color: gate.color }}>
          {selectedHatDef?.label} hat on.
        </p>
        <p className="text-sm" style={{ color: "#88AA88" }}>
          You've crossed into {toZone.name}.
        </p>
      </div>
    );
  }

  if (step === "narrative" && selectedHatDef) {
    const isGatekeeperHat = selectedHat?.startsWith("gatekeeper");
    return (
      <div className="p-6 space-y-5">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-1"
            style={{ color: gate.color }}
          >
            Crossing narrative
          </p>
          <h2 className="font-serif text-2xl font-bold" style={{ color: "#E8EBE8" }}>
            {selectedHatDef.label}
          </h2>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: "#7A8A7A" }}>
            {selectedHatDef.description}
          </p>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: "#6A7A6A" }}>
            You are crossing from{" "}
            <strong style={{ color: fromZone.color }}>{fromZone.name}</strong> into{" "}
            <strong style={{ color: toZone.color }}>{toZone.name}</strong> as{" "}
            <strong style={{ color: "#D0E0D0" }}>{selectedHatDef.label}</strong>. This hat shapes
            what you can do, what you can see, and what commitments you carry across the threshold.
          </p>
        </div>

        {isGatekeeperHat && gate.gatekeeperResolution && (
          <div
            className="p-4 rounded-xl border"
            style={{ borderColor: "#4A9A4455", background: "#4A9A4412" }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
              style={{ color: "#7ABF5E" }}
            >
              ✓ Architectural decision resolved
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#7ABF5EBB" }}>
              {gate.gatekeeperResolution}
            </p>
          </div>
        )}

        {gate.giraffeNote && (
          <div
            className="p-4 rounded-xl border"
            style={{ borderColor: gate.color + "44", background: gate.color + "12" }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
              style={{ color: gate.color }}
            >
              🦒 Giraffe Protection
            </p>
            <p className="text-xs leading-relaxed" style={{ color: gate.color + "BB" }}>
              {gate.giraffeNote}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setStep("select")}
            className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
            style={{ border: "1px solid #2A3A2A", color: "#7A8A7A" }}
          >
            Change hat
          </button>
          <button
            onClick={() => {
              setStep("confirmed");
              setTimeout(() => {
                onConfirm(selectedHat!);
                onClose();
              }, 900);
            }}
            className="flex-1 py-3 rounded-xl font-semibold text-sm"
            style={{ background: gate.color, color: "#fff" }}
          >
            Confirm crossing
          </button>
        </div>
      </div>
    );
  }

  // step === "select"
  return (
    <div className="p-6 space-y-5">
      <div>
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-1"
          style={{ color: gate.color }}
        >
          {gate.label} — Gear-Up
        </p>
        <h2 className="font-serif text-xl font-bold" style={{ color: "#E8EBE8" }}>
          What hat are you putting on?
        </h2>
        <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "#7A8A7A" }}>
          To cross from{" "}
          <strong style={{ color: fromZone.color }}>{fromZone.name}</strong> into{" "}
          <strong style={{ color: toZone.color }}>{toZone.name}</strong>, choose the
          identity you're carrying across the threshold.
        </p>
      </div>

      {hasVariants ? (
        // Side-by-side layout: personal hats | workbench hats
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: "#556655" }}
            >
              Personal hat
            </p>
            <div className="space-y-2">
              {personalHats.map((hat) => (
                <button
                  key={hat.id}
                  onClick={() => setSelectedHat(hat.id)}
                  className="w-full text-left p-3 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: selectedHat === hat.id ? gate.color : "#2A3A2A",
                    background: selectedHat === hat.id ? gate.color + "22" : "#111A11",
                  }}
                >
                  <p className="font-semibold text-sm" style={{ color: "#D8EBD8" }}>
                    {hat.label}
                  </p>
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: "#5A6A5A" }}>
                    {hat.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: "#556655" }}
            >
              Workbench-only
            </p>
            <div className="space-y-2">
              {workbenchHats.map((hat) => (
                <button
                  key={hat.id}
                  onClick={() => setSelectedHat(hat.id)}
                  className="w-full text-left p-3 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: selectedHat === hat.id ? gate.color : "#2A3A2A",
                    background: selectedHat === hat.id ? gate.color + "22" : "#111A11",
                  }}
                >
                  <p className="font-semibold text-sm" style={{ color: "#D8EBD8" }}>
                    {hat.label}
                  </p>
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: "#5A6A5A" }}>
                    {hat.description}
                  </p>
                </button>
              ))}
            </div>

          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleHats.map((hat) => (
            <button
              key={hat.id}
              onClick={() => setSelectedHat(hat.id)}
              className="w-full text-left p-4 rounded-xl border-2 transition-all"
              style={{
                borderColor: selectedHat === hat.id ? gate.color : "#2A3A2A",
                background: selectedHat === hat.id ? gate.color + "22" : "#111A11",
              }}
            >
              <p className="font-semibold text-sm" style={{ color: "#D8EBD8" }}>
                {hat.label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#5A6A5A" }}>
                {hat.description}
              </p>
            </button>
          ))}
        </div>
      )}

      {gate.giraffeNote && (
        <div
          className="p-3 rounded-xl border"
          style={{ borderColor: gate.color + "44", background: gate.color + "0E" }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-1"
            style={{ color: gate.color }}
          >
            🦒 Giraffe Protection
          </p>
          <p className="text-[11px] leading-relaxed" style={{ color: gate.color + "BB" }}>
            {gate.giraffeNote}
          </p>
        </div>
      )}

      <button
        onClick={() => selectedHat && setStep("narrative")}
        disabled={!selectedHat}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
        style={{
          background: selectedHat ? gate.color : "#1A2A1A",
          color: selectedHat ? "#fff" : "#445544",
          border: `1px solid ${selectedHat ? gate.color : "#2A3A2A"}`,
          cursor: selectedHat ? "pointer" : "not-allowed",
        }}
      >
        {selectedHat
          ? `Gear up as ${visibleHats.find((h) => h.id === selectedHat)?.label}`
          : "Select a hat to continue"}
      </button>

      <BrowseEpisodesLink zoneNumber={toZone.number} zoneColor={toZone.color} />
    </div>
  );
}

function ProhibitionPanel({
  onClose,
}: {
  gate: GateDef;
  onClose: () => void;
}) {
  return (
    <div className="p-6 space-y-4">
      <div>
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-1"
          style={{ color: "#CC3333" }}
        >
          Crossing prohibited
        </p>
        <h2 className="font-serif text-xl font-bold" style={{ color: "#E8EBE8" }}>
          Z1 → Z3: Absolute prohibition
        </h2>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: "#7A8A7A" }}>
          You cannot cross directly from{" "}
          <strong style={{ color: "#C4A05A" }}>The Home</strong> to{" "}
          <strong style={{ color: "#4A7A3A" }}>The Homestead</strong>. This path is{" "}
          <strong style={{ color: "#CC3333" }}>redacted</strong> — not locked behind a key,
          but structurally absent from the map. There is no gate here to open.
        </p>
        <p className="text-sm mt-3 leading-relaxed" style={{ color: "#6A7A6A" }}>
          The zone model requires you to build through{" "}
          <strong style={{ color: "#6B8F47" }}>The Garden</strong> (Z2) first. Skipping Z2
          means arriving at Z3 without the foundational competencies Z2 builds. This is not a
          permission problem — it is an architecture problem.
        </p>
      </div>

      <div
        className="p-4 rounded-xl border font-mono text-xs space-y-1"
        style={{ borderColor: "#CC333333", background: "#CC333310" }}
      >
        <p style={{ color: "#6A7A6A" }}>
          Z1 → Z3:{" "}
          <span style={{ color: "#CC3333", textDecoration: "line-through" }}>
            path does not exist
          </span>
        </p>
        <p style={{ color: "#4A7A3A" }}>Correct path: Z1 → Z2 → Z3</p>
      </div>

      <button
        onClick={onClose}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
        style={{ border: "1px solid #2A3A2A", color: "#8A9A8A" }}
      >
        Understood
      </button>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

type CrossedGate = { gateId: string; hatId?: string };

export default function ZoneBubbleMap() {
  const config = ACTIVE_CONFIG;

  const [currentZone, setCurrentZone] = useState<ZoneId>("z0");
  const [activeGateId, setActiveGateId] = useState<string | null>(null);
  const [crossedGates, setCrossedGates] = useState<CrossedGate[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const zoneProgress = useZoneProgress();

  const zoneById = useCallback(
    (id: ZoneId): ZoneDef =>
      config.zones.find((z) => z.id === id) ?? config.zones[0],
    [config.zones],
  );

  const activeGate = activeGateId
    ? config.gates.find((g) => g.id === activeGateId) ?? null
    : null;

  const currentZoneDef = zoneById(currentZone);
  const isGateCrossed = useCallback(
    (gateId: string) => crossedGates.some((g) => g.gateId === gateId),
    [crossedGates],
  );

  function openGate(gateId: string) {
    setActiveGateId(gateId);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setTimeout(() => setActiveGateId(null), 250);
  }

  function handleGateConfirm(gateId: string, hatId?: string) {
    setCrossedGates((prev) => {
      const filtered = prev.filter((g) => g.gateId !== gateId);
      return [...filtered, { gateId, hatId }];
    });
    const gate = config.gates.find((g) => g.id === gateId);
    if (gate?.to && gate.kind !== "prohibition") {
      setCurrentZone(gate.to);
    }
  }

  // SVG rendering helpers
  const zonesOuterFirst = [...config.zones].reverse();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080E08",
        color: "#D0E0D0",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#445544",
              marginBottom: 2,
            }}
          >
            {config.name}
          </p>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 17,
              fontWeight: 700,
              color: "#C8E0C8",
              margin: 0,
            }}
          >
            Zone Bubble &amp; Gate Map
          </h1>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            borderRadius: 999,
            border: `1px solid ${currentZoneDef.color}44`,
            background: currentZoneDef.color + "18",
            fontSize: 11,
            fontWeight: 600,
            color: currentZoneDef.color,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: currentZoneDef.color,
              display: "inline-block",
            }}
          />
          You are in {currentZoneDef.name}
        </div>
      </div>

      {/* ── SVG Map ── */}
      <div style={{ position: "relative", width: "100%", flexShrink: 0 }}>
        <svg
          viewBox={ACTIVE_CONFIG.viewBox ?? "0 0 820 500"}
          style={{ width: "100%", maxHeight: 400, display: "block" }}
          aria-label="Zone Bubble and Gate Map"
        >
          <defs>
            <filter id="eave-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="gate-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="marker-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Zone bubbles — outermost first so inner zones paint on top */}
          {zonesOuterFirst.map((zone) => {
            const isCurrent = zone.id === currentZone;
            return (
              <g
                key={zone.id}
                onClick={() => {
                  setCurrentZone(zone.id);
                  window.location.href = `/episodes?zone=zone-${zone.number}`;
                }}
                style={{ cursor: "pointer" }}
                aria-label={`Zone ${zone.number}: ${zone.name} — click to browse episodes`}
              >
                <ellipse
                  cx={zone.cx}
                  cy={zone.cy}
                  rx={zone.rx}
                  ry={zone.ry}
                  fill={zone.fillColor}
                  stroke={zone.color}
                  strokeWidth={isCurrent ? 2.5 : 1.5}
                  opacity={0.97}
                />

                {/* Zone progress arc — only rendered when user has listened episodes */}
                {(() => {
                  const slug = `zone-${zone.number}`;
                  const prog = zoneProgress?.[slug];
                  if (!prog || prog.listened === 0) return null;
                  const fraction = Math.min(prog.listened / Math.max(prog.total, 1), 1);
                  const perim = ellipsePerimeter(zone.rx, zone.ry);
                  const arcLen = fraction * perim;
                  return (
                    <ellipse
                      cx={zone.cx}
                      cy={zone.cy}
                      rx={zone.rx}
                      ry={zone.ry}
                      fill="none"
                      stroke={zone.color}
                      strokeWidth={4}
                      strokeOpacity={0.7}
                      strokeDasharray={`${arcLen} ${perim}`}
                      strokeDashoffset={perim * 0.75}
                      style={{ pointerEvents: "none" }}
                    />
                  );
                })()}

                {/* Zone number label — lower inside edge */}
                <text
                  x={zone.cx - zone.rx * 0.58}
                  y={zone.cy + zone.ry - 20}
                  fill={zone.color}
                  fontSize={zone.number === 3 ? 13 : 11}
                  fontWeight="700"
                  letterSpacing="0.07em"
                  style={{ fontFamily: "Georgia, serif", userSelect: "none" }}
                >
                  Z{zone.number}
                </text>

                {/* Zone name label */}
                <text
                  x={zone.cx - zone.rx * 0.58}
                  y={zone.cy + zone.ry - 6}
                  fill={zone.color + "88"}
                  fontSize={9}
                  letterSpacing="0.04em"
                  style={{ fontFamily: "system-ui, sans-serif", userSelect: "none" }}
                >
                  {zone.name}
                </text>
              </g>
            );
          })}

          {/* Eave overhang — green ring visible at Z2 inner edge, behind Z2/Z1/Z0 */}
          <ellipse
            cx={config.eave.cx}
            cy={config.eave.cy}
            rx={config.eave.rx}
            ry={config.eave.ry}
            fill="none"
            stroke={config.eave.color}
            strokeWidth={10}
            opacity={0.32}
            filter="url(#eave-glow)"
            style={{ pointerEvents: "none" }}
          />
          <text
            x={config.eave.cx - config.eave.rx + 6}
            y={config.eave.cy - config.eave.ry + 15}
            fill={config.eave.color}
            fontSize={8}
            fontWeight="700"
            letterSpacing="0.1em"
            opacity={0.55}
            style={{ fontFamily: "system-ui, sans-serif", userSelect: "none" }}
          >
            EAVE
          </text>

          {/* Gates */}
          {config.gates.map((gate) => {
            const crossed = isGateCrossed(gate.id);

            if (gate.kind === "prohibition") {
              const z1 = zoneById("z1");
              const z3 = zoneById("z3");
              return (
                <g
                  key={gate.id}
                  onClick={() => openGate(gate.id)}
                  style={{ cursor: "pointer" }}
                  aria-label="Z1 to Z3 prohibition"
                >
                  {/* Dashed prohibition line */}
                  <line
                    x1={z1.cx + z1.rx * 0.15}
                    y1={z1.cy - z1.ry}
                    x2={z3.cx + z3.rx * 0.55}
                    y2={z3.cy - z3.ry * 0.45}
                    stroke="#CC3333"
                    strokeWidth={2}
                    strokeDasharray="7 5"
                    opacity={0.65}
                  />
                  {/* Prohibition stamp */}
                  <circle
                    cx={gate.cx}
                    cy={gate.cy}
                    r={15}
                    fill="#CC333322"
                    stroke="#CC3333"
                    strokeWidth={1.5}
                    opacity={0.9}
                    filter="url(#gate-glow)"
                  />
                  <text
                    x={gate.cx}
                    y={gate.cy + 5}
                    textAnchor="middle"
                    fill="#CC3333"
                    fontSize={14}
                    fontWeight="900"
                    style={{ userSelect: "none" }}
                  >
                    ⊘
                  </text>
                  <text
                    x={gate.cx}
                    y={gate.cy + 25}
                    textAnchor="middle"
                    fill="#CC333399"
                    fontSize={7.5}
                    letterSpacing="0.07em"
                    style={{ fontFamily: "system-ui", userSelect: "none" }}
                  >
                    PROHIBITED
                  </text>
                </g>
              );
            }

            // Normal gate membrane
            const fromZone = zoneById(gate.from);
            const toZone = zoneById(gate.to);
            const membraneColor = blendColors(fromZone.color, toZone.color);

            return (
              <g
                key={gate.id}
                onClick={() => openGate(gate.id)}
                style={{ cursor: "pointer" }}
                aria-label={`Gate: ${gate.label}`}
              >
                {/* Membrane circle at zone boundary */}
                <circle
                  cx={gate.cx}
                  cy={gate.cy}
                  r={19}
                  fill={crossed ? membraneColor + "55" : membraneColor + "22"}
                  stroke={membraneColor}
                  strokeWidth={crossed ? 2.5 : 1.5}
                  opacity={0.95}
                  filter="url(#gate-glow)"
                />

                {/* Crossed (stamped) vs uncrossed icon */}
                {crossed ? (
                  <text
                    x={gate.cx}
                    y={gate.cy + 6}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={15}
                    fontWeight="900"
                    style={{ userSelect: "none" }}
                  >
                    ✓
                  </text>
                ) : (
                  <text
                    x={gate.cx}
                    y={gate.cy + 5}
                    textAnchor="middle"
                    fill={membraneColor}
                    fontSize={14}
                    style={{ userSelect: "none" }}
                  >
                    ⬡
                  </text>
                )}

                {/* Gate label */}
                <text
                  x={gate.cx}
                  y={gate.cy + 32}
                  textAnchor="middle"
                  fill={membraneColor + "AA"}
                  fontSize={8}
                  letterSpacing="0.06em"
                  style={{ fontFamily: "system-ui", userSelect: "none" }}
                >
                  {gate.kind === "eave-flow"
                    ? "EAVE FLOW"
                    : gate.label.toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* "You are here" marker */}
          <g style={{ pointerEvents: "none" }}>
            <circle
              cx={currentZoneDef.cx}
              cy={currentZoneDef.cy}
              r={18}
              fill="none"
              stroke={currentZoneDef.color}
              strokeWidth={1.5}
              opacity={0.3}
              filter="url(#marker-glow)"
            />
            <circle
              cx={currentZoneDef.cx}
              cy={currentZoneDef.cy}
              r={9}
              fill={currentZoneDef.color}
              opacity={0.9}
            />
            <text
              x={currentZoneDef.cx}
              y={currentZoneDef.cy - 24}
              textAnchor="middle"
              fill={currentZoneDef.color}
              fontSize={8.5}
              fontWeight="700"
              letterSpacing="0.07em"
              style={{ fontFamily: "system-ui", userSelect: "none" }}
            >
              YOU ARE HERE
            </text>
          </g>
        </svg>
      </div>

      {/* ── Legend strip ── */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "8px 20px",
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          fontSize: 10,
          color: "#556655",
        }}
      >
        {[
          { color: "#7ABF5E", label: "Eave Flow (Z0→Z1)" },
          { color: "#8A9A6A", label: "Gate membrane — click to cross" },
          { color: "#CCDDCC", label: "✓ Stamped — already crossed" },
          { color: "#CC3333", label: "⊘ Z1→Z3 prohibition — no path exists" },
          { color: "#B5853A", label: "● You are here" },
          { color: "#88CC88", label: "Arc glow — your zone exploration progress (logged in)" },
        ].map((item) => (
          <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                width: 8,
                height: 8,
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

      {/* ── Gate Panel Overlay ── */}
      {panelOpen && activeGate && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closePanel();
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(5px)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 540,
              background: "#0D180D",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px 18px 0 0",
              maxHeight: "88vh",
              overflowY: "auto",
            }}
          >
            {/* Panel top bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#445544",
                }}
              >
                Gate
              </span>
              <button
                onClick={closePanel}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                  color: "#6A8A6A",
                  fontSize: 18,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
                aria-label="Close panel"
              >
                ×
              </button>
            </div>

            {/* Panel body */}
            {activeGate.kind === "eave-flow" && (
              <EaveFlowPanel
                gate={activeGate}
                toZone={zoneById(activeGate.to)}
                onConfirm={(choice) => handleGateConfirm(activeGate.id, choice)}
                onClose={closePanel}
              />
            )}
            {activeGate.kind === "gear-up" && (
              <GearUpPanel
                gate={activeGate}
                fromZone={zoneById(activeGate.from)}
                toZone={zoneById(activeGate.to)}
                onConfirm={(hatId) => handleGateConfirm(activeGate.id, hatId)}
                onClose={closePanel}
              />
            )}
            {activeGate.kind === "prohibition" && (
              <ProhibitionPanel gate={activeGate} onClose={closePanel} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
