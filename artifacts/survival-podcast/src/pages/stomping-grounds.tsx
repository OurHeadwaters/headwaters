import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowRight, Droplets, Pause, Play, RefreshCw, Anchor, Coins, Layers } from "lucide-react";
import { useTransformations, type Transformation } from "@/hooks/use-transformations";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

// ─── Data hooks ────────────────────────────────────────────────────────────────

function useGemCount() {
  return useQuery({
    queryKey: ["stomping-gem-count"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/wisdom/gems?limit=1&offset=0"));
      if (!res.ok) return null;
      const data: { total: number } = await res.json();
      return data.total;
    },
    staleTime: 60_000,
  });
}

function usePotTotal() {
  return useQuery({
    queryKey: ["stomping-pot-today"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/wishing-well/pot/today"));
      if (!res.ok) return null;
      const data: { totalUnits: number; tipCount: number } = await res.json();
      return data;
    },
    staleTime: 60_000,
  });
}

// ─── Water Wheel state ──────────────────────────────────────────────────────────

const WW_KEY = "tsp-water-wheel-v1";
const DRIP_INTERVAL_MS = 4000;
const SWEEP_THRESHOLD = 25;

interface WaterWheelState {
  drops: number;
  running: boolean;
  bucket: string;
  lifetimeSweeps: number;
}

function loadWWState(): WaterWheelState {
  try {
    const raw = localStorage.getItem(WW_KEY);
    if (raw) return JSON.parse(raw) as WaterWheelState;
  } catch {
    /* ignore */
  }
  return { drops: 0, running: false, bucket: "", lifetimeSweeps: 0 };
}

function saveWWState(s: WaterWheelState) {
  localStorage.setItem(WW_KEY, JSON.stringify(s));
}

// ─── Animated Water Wheel SVG ───────────────────────────────────────────────────

function WaterWheelSVG({ spinning }: { spinning: boolean }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className="w-full h-full"
      aria-hidden="true"
    >
      {/* Stream bed */}
      <rect x="0" y="92" width="120" height="28" rx="4" fill="#2C6A8A" opacity="0.18" />
      <rect x="0" y="97" width="120" height="6" rx="2" fill="#2C6A8A" opacity="0.25" />

      {/* Axle */}
      <line x1="60" y1="58" x2="60" y2="64" stroke="#5A3A2A" strokeWidth="5" strokeLinecap="round" />
      <circle cx="60" cy="60" r="5" fill="#7A4A30" />

      {/* Wheel rim */}
      <circle cx="60" cy="60" r="34" fill="none" stroke="#5A3A2A" strokeWidth="3.5" />

      {/* Spokes + paddles — rotated by CSS */}
      <g
        style={{
          transformOrigin: "60px 60px",
          animation: spinning ? "ww-spin 4s linear infinite" : "none",
        }}
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 60 + 5 * Math.cos(rad);
          const y1 = 60 + 5 * Math.sin(rad);
          const x2 = 60 + 32 * Math.cos(rad);
          const y2 = 60 + 32 * Math.sin(rad);
          const px = 60 + 28 * Math.cos(rad);
          const py = 60 + 28 * Math.sin(rad);
          const tx = -Math.sin(rad) * 7;
          const ty = Math.cos(rad) * 7;
          return (
            <g key={deg}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#7A4A30" strokeWidth="2.5" strokeLinecap="round" />
              <rect
                x={px - 6}
                y={py - 4}
                width="12"
                height="8"
                rx="2"
                fill="#A0622A"
                transform={`rotate(${deg}, ${px}, ${py}) translate(${tx}, ${ty})`}
              />
            </g>
          );
        })}
      </g>

      {/* Bucket */}
      <rect x="84" y="88" width="18" height="14" rx="3" fill="#D9A066" opacity="0.9" />
      <rect x="86" y="86" width="14" height="4" rx="1.5" fill="#C48844" />

      {/* Water drops when spinning */}
      {spinning && (
        <>
          <circle cx="72" cy="84" r="2.5" fill="#2C8ABA" opacity="0.7">
            <animate attributeName="cy" values="80;90;80" dur="1.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="76" cy="87" r="1.8" fill="#2C8ABA" opacity="0.5">
            <animate attributeName="cy" values="83;92;83" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="1.6s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </svg>
  );
}

// ─── Sweep animation ────────────────────────────────────────────────────────────

function SweepBurst({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="text-4xl animate-bounce">💧</div>
      <div
        className="absolute inset-0 rounded-2xl border-4 border-[#2C6A8A] opacity-0"
        style={{ animation: "sweep-ring 0.6s ease-out forwards" }}
      />
    </div>
  );
}

// ─── Water Wheel Station panel ──────────────────────────────────────────────────

const BUCKET_OPTIONS = [
  "Emergency Fund",
  "Garden Project",
  "Off-Grid Setup",
  "Debt Payoff",
  "Skill Course",
  "Community Fund",
];

function WaterWheelPanel() {
  const [state, setState] = useState<WaterWheelState>(loadWWState);
  const [sweepBurst, setSweepBurst] = useState(false);
  const [editingBucket, setEditingBucket] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const persist = useCallback((next: WaterWheelState) => {
    setState(next);
    saveWWState(next);
  }, []);

  useEffect(() => {
    if (state.running) {
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          const next = { ...prev, drops: prev.drops + 1 };
          saveWWState(next);
          return next;
        });
      }, DRIP_INTERVAL_MS);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.running]);

  const toggleRunning = () => {
    persist({ ...state, running: !state.running });
  };

  const sweep = () => {
    if (state.drops < SWEEP_THRESHOLD) return;
    persist({ ...state, drops: 0, lifetimeSweeps: state.lifetimeSweeps + 1 });
    setSweepBurst(true);
    setTimeout(() => setSweepBurst(false), 1200);
  };

  const canSweep = state.drops >= SWEEP_THRESHOLD;
  const sweepPct = Math.min(100, (state.drops / SWEEP_THRESHOLD) * 100);

  return (
    <div className="flex flex-col gap-5">
      {/* Wheel visual */}
      <div className="relative flex justify-center">
        <div className="w-36 h-36 relative">
          <WaterWheelSVG spinning={state.running} />
          <SweepBurst show={sweepBurst} />
        </div>
      </div>

      {/* Drip counter */}
      <div className="text-center">
        <div className="text-4xl font-bold font-serif text-[#2C6A8A] tabular-nums">
          {state.drops}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
          <Droplets className="w-3 h-3" />
          drops collected this session
        </div>
        {state.lifetimeSweeps > 0 && (
          <div className="text-xs text-[#D9A066] mt-1 font-medium">
            {state.lifetimeSweeps} bucket{state.lifetimeSweeps !== 1 ? "s" : ""} swept ✓
          </div>
        )}
      </div>

      {/* Sweep threshold bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>{state.drops} / {SWEEP_THRESHOLD} drops</span>
          <span className={canSweep ? "text-[#2C4A36] font-semibold" : ""}>
            {canSweep ? "Ready to sweep!" : `${SWEEP_THRESHOLD - state.drops} more to sweep`}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${canSweep ? "bg-gradient-to-r from-[#2C6A8A] to-[#D9A066]" : "bg-[#2C6A8A]"}`}
            style={{ width: `${sweepPct}%` }}
          />
        </div>
      </div>

      {/* Bucket goal picker */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
          Your Bucket (Goal)
        </div>
        {editingBucket ? (
          <div className="flex flex-wrap gap-1.5">
            {BUCKET_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  persist({ ...state, bucket: opt });
                  setEditingBucket(false);
                }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  state.bucket === opt
                    ? "bg-[#2C4A36] text-white border-[#2C4A36]"
                    : "border-border text-muted-foreground hover:border-[#2C4A36] hover:text-foreground"
                }`}
              >
                {opt}
              </button>
            ))}
            <button
              onClick={() => setEditingBucket(false)}
              className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingBucket(true)}
            className="text-sm text-foreground font-medium flex items-center gap-2 hover:text-[#2C4A36] transition-colors group"
          >
            <span className="text-xl">🪣</span>
            <span>{state.bucket || "Set your bucket…"}</span>
            <RefreshCw className="w-3 h-3 text-muted-foreground group-hover:text-[#2C4A36] transition-colors" />
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={toggleRunning}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            state.running
              ? "bg-muted text-muted-foreground hover:bg-muted/80"
              : "bg-[#2C4A36] text-white hover:opacity-90"
          }`}
        >
          {state.running ? (
            <><Pause className="w-4 h-4" /> Pause</>
          ) : (
            <><Play className="w-4 h-4" /> Start Earning</>
          )}
        </button>

        <button
          onClick={sweep}
          disabled={!canSweep}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm border transition-all ${
            canSweep
              ? "bg-[#D9A066] text-white border-[#D9A066] hover:opacity-90 shadow-md"
              : "border-border text-muted-foreground opacity-50 cursor-not-allowed"
          }`}
        >
          <Droplets className="w-4 h-4" />
          Sweep to Bucket
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        Simulated earn agent — mirrors the Headwaters Water Wheel mechanic. Drips accumulate
        each session; sweep to your bucket goal when the threshold is hit.
      </p>
    </div>
  );
}

// ─── Transformation trail mini visual ──────────────────────────────────────────

function TransformTrailPanel({ transformations }: { transformations: Transformation[] }) {
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Six transformation paths. Pick the one that matches where you are right now.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {transformations.map((t) => (
          <button
            key={t.slug}
            onClick={() => navigate(`/transform`)}
            className="flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-sm"
            style={{
              borderColor: t.color + "33",
              background: t.color + "0A",
            }}
          >
            <span className="text-lg leading-none shrink-0">{t.icon}</span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold leading-tight truncate" style={{ color: t.color }}>
                {t.from}
              </div>
              <div className="flex items-center gap-0.5">
                <ArrowRight className="w-2.5 h-2.5 shrink-0" style={{ color: t.color }} />
                <div className="text-[10px] font-semibold truncate text-foreground">{t.to}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <Link
        href="/transform"
        className="mt-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#2C4A36] hover:opacity-90 transition-opacity"
      >
        Explore All Paths <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// ─── Station hotspot ────────────────────────────────────────────────────────────

interface StationConfig {
  id: string;
  icon: string;
  label: string;
  description: string;
  badge?: string | null;
  color: string;
  glowColor: string;
  position: { top: string; left: string };
  mobileOrder: number;
}

function StationHotspot({
  station,
  isOpen,
  onClick,
}: {
  station: StationConfig;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`absolute flex flex-col items-center gap-1.5 group transition-all duration-200 z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white`}
      style={{ top: station.position.top, left: station.position.left, transform: "translate(-50%, -50%)" }}
      aria-label={`Open ${station.label}`}
    >
      {/* Glow ring */}
      <div
        className={`relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ${
          isOpen ? "scale-110 shadow-lg" : "group-hover:scale-105"
        }`}
        style={{
          background: station.glowColor + "22",
          border: `2.5px solid ${station.glowColor}${isOpen ? "cc" : "66"}`,
          boxShadow: isOpen
            ? `0 0 0 6px ${station.glowColor}22, 0 0 20px ${station.glowColor}33`
            : `0 0 0 0px ${station.glowColor}00`,
        }}
      >
        {/* Pulse ring on hover */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-300 ${
            isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          style={{
            animation: isOpen ? "station-pulse 2s ease-in-out infinite" : undefined,
            boxShadow: `0 0 0 8px ${station.glowColor}15`,
          }}
        />
        <span className="text-2xl leading-none relative z-10">{station.icon}</span>
        {station.badge != null && (
          <div
            className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full text-[10px] font-bold flex items-center justify-center px-1.5 text-white shadow-sm"
            style={{ background: station.color }}
          >
            {station.badge}
          </div>
        )}
      </div>

      {/* Label */}
      <div
        className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-white/90 transition-all whitespace-nowrap"
        style={{ background: station.color + "bb", backdropFilter: "blur(4px)" }}
      >
        {station.label}
      </div>
    </button>
  );
}

// ─── Scene background ───────────────────────────────────────────────────────────

function SceneBackground() {
  return (
    <svg
      viewBox="0 0 800 440"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* Sky gradient */}
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8D9CC" />
          <stop offset="100%" stopColor="#E8F0E4" />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3D6B45" />
          <stop offset="100%" stopColor="#2C4A36" />
        </linearGradient>
        <linearGradient id="stream" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2C6A8A" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#4A9ABA" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="path-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C4A96A" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#A88E50" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect width="800" height="220" fill="url(#sky)" />

      {/* Distant hills */}
      <ellipse cx="150" cy="220" rx="200" ry="70" fill="#4A7A3A" opacity="0.5" />
      <ellipse cx="500" cy="225" rx="250" ry="80" fill="#3D6840" opacity="0.4" />
      <ellipse cx="750" cy="220" rx="160" ry="60" fill="#4A7A3A" opacity="0.45" />

      {/* Slow drifting clouds */}
      <g opacity="0.6">
        <ellipse cx="120" cy="70" rx="55" ry="22" fill="white">
          <animateTransform attributeName="transform" type="translate" values="0 0; 8 0; 0 0" dur="18s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="150" cy="62" rx="38" ry="18" fill="white">
          <animateTransform attributeName="transform" type="translate" values="0 0; 8 0; 0 0" dur="18s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="580" cy="90" rx="70" ry="24" fill="white">
          <animateTransform attributeName="transform" type="translate" values="0 0; -6 0; 0 0" dur="22s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="620" cy="82" rx="45" ry="18" fill="white">
          <animateTransform attributeName="transform" type="translate" values="0 0; -6 0; 0 0" dur="22s" repeatCount="indefinite" />
        </ellipse>
      </g>

      {/* Ground */}
      <rect y="215" width="800" height="225" fill="url(#ground)" />

      {/* Footpath / trail across the grounds */}
      <path d="M 0 310 Q 200 295 400 320 Q 600 345 800 330" stroke="url(#path-grad)" strokeWidth="22" fill="none" opacity="0.5" strokeLinecap="round" />
      <path d="M 0 310 Q 200 295 400 320 Q 600 345 800 330" stroke="#C4A96A" strokeWidth="4" fill="none" opacity="0.3" strokeLinecap="round" strokeDasharray="12 8" />

      {/* Stream (for water wheel) */}
      <path d="M 630 440 Q 620 380 610 340 Q 600 300 590 260" stroke="url(#stream)" strokeWidth="18" fill="none" strokeLinecap="round" />
      <path d="M 630 440 Q 620 380 610 340 Q 600 300 590 260" stroke="white" strokeWidth="3" fill="none" opacity="0.2" strokeLinecap="round" strokeDasharray="8 12" />

      {/* Mine shaft entrance (Wisdom Dig) */}
      <rect x="145" y="245" width="50" height="35" rx="4" fill="#3A2A1A" opacity="0.8" />
      <path d="M 130 248 L 170 228 L 210 248" fill="#5A3A20" opacity="0.7" />
      <rect x="155" y="255" width="20" height="25" rx="3" fill="#1A1008" />
      <line x1="170" y1="228" x2="170" y2="212" stroke="#5A3A20" strokeWidth="4" />
      <rect x="162" y="208" width="16" height="7" rx="1" fill="#8A6040" />

      {/* Well (Wishing Well) */}
      <rect x="348" y="254" width="44" height="28" rx="4" fill="#7A5A3A" opacity="0.9" />
      <ellipse cx="370" cy="254" rx="24" ry="7" fill="#9A7A5A" opacity="0.85" />
      <line x1="348" y1="242" x2="348" y2="270" stroke="#5A3A1A" strokeWidth="4" />
      <line x1="392" y1="242" x2="392" y2="270" stroke="#5A3A1A" strokeWidth="4" />
      <path d="M 340 244 L 370 228 L 400 244" fill="#9A6A3A" opacity="0.8" />
      <line x1="370" y1="228" x2="370" y2="218" stroke="#5A3A1A" strokeWidth="3" />
      <rect x="362" y="214" width="16" height="6" rx="1.5" fill="#8A6040" />

      {/* Trail arch (Transformation Trail) */}
      <path d="M 175 340 Q 220 298 265 340" fill="none" stroke="#8A6A3A" strokeWidth="6" strokeLinecap="round" />
      <path d="M 178 340 Q 220 302 262 340" fill="none" stroke="#C4A96A" strokeWidth="3" strokeLinecap="round" strokeDasharray="5 4" />
      <rect x="172" y="336" width="10" height="22" rx="2" fill="#6A4A24" />
      <rect x="258" y="336" width="10" height="22" rx="2" fill="#6A4A24" />

      {/* Trees scattered */}
      {([
        [50, 230], [80, 218], [720, 225], [750, 235], [760, 218],
        [300, 222], [330, 230], [500, 218], [530, 228],
      ] as [number, number][]).map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 3} y={y + 28} width={6} height={16} fill="#5A3A20" />
          <ellipse cx={x} cy={y + 14} rx={16} ry={20} fill="#2C5A28" opacity={0.85} />
          <ellipse cx={x} cy={y + 8} rx={10} ry={13} fill="#3A7A32" opacity={0.75} />
        </g>
      ))}

      {/* Fence posts along path */}
      {[80, 160, 240, 320, 400, 480, 560, 640, 720].map((x, i) => (
        <g key={i}>
          <rect x={x} y={304} width={4} height={18} rx={1} fill="#8A6A40" opacity={0.5} />
          <rect x={x - 1} y={303} width={6} height={3} rx={1} fill="#A08050" opacity={0.5} />
        </g>
      ))}
      <line x1="82" y1="308" x2="722" y2="315" stroke="#8A6A40" strokeWidth="2" opacity="0.3" />
    </svg>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────────

type StationId = "wisdom-dig" | "wishing-well" | "transform" | "water-wheel";

export default function StompingGroundsPage() {
  const [openStation, setOpenStation] = useState<StationId | null>(null);
  const { data: transformations } = useTransformations();
  const { data: gemCount } = useGemCount();
  const { data: pot } = usePotTotal();

  const toggle = (id: StationId) => setOpenStation((prev) => (prev === id ? null : id));

  const stations: StationConfig[] = [
    {
      id: "wisdom-dig",
      icon: "💎",
      label: "Wisdom Dig",
      description: "Mine key phrases and wisdom gems from 6,000+ episodes.",
      badge: gemCount != null ? String(gemCount) : null,
      color: "#2C4A36",
      glowColor: "#4A9A5A",
      position: { top: "57%", left: "20%" },
      mobileOrder: 0,
    },
    {
      id: "wishing-well",
      icon: "🪙",
      label: "Wishing Well",
      description: "Toss a coin, make a wish, and build community momentum.",
      badge: pot != null ? String(pot.totalUnits) : null,
      color: "#B5853A",
      glowColor: "#D9A066",
      position: { top: "60%", left: "48%" },
      mobileOrder: 1,
    },
    {
      id: "transform",
      icon: "🌱",
      label: "Transformation Trail",
      description: "Six paths of change — find the one that matches your journey.",
      badge: transformations ? String(transformations.length) : null,
      color: "#4A7A3A",
      glowColor: "#6AAA5A",
      position: { top: "80%", left: "28%" },
      mobileOrder: 2,
    },
    {
      id: "water-wheel",
      icon: "⚙️",
      label: "Water Wheel",
      description: "Simulated earn agent — let your drops accumulate and sweep to your bucket.",
      badge: null,
      color: "#2C6A8A",
      glowColor: "#4A9ABA",
      position: { top: "62%", left: "76%" },
      mobileOrder: 3,
    },
  ];

  const currentStation = stations.find((s) => s.id === openStation);

  return (
    <>
      <style>{`
        @keyframes station-pulse {
          0%, 100% { box-shadow: 0 0 0 0 currentColor; opacity: 0.6; }
          50% { box-shadow: 0 0 0 12px transparent; opacity: 0; }
        }
        @keyframes ww-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes sweep-ring {
          0% { opacity: 0.8; transform: scale(0.9); }
          100% { opacity: 0; transform: scale(1.4); }
        }
        @keyframes grounds-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      <div className="min-h-screen bg-[#1C3020]">
        {/* Hero banner */}
        <div className="relative overflow-hidden border-b border-white/10"
          style={{ background: "linear-gradient(160deg, #1C3020 0%, #2C4A30 60%, #1A3528 100%)" }}
        >
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: "radial-gradient(ellipse at 30% 50%, #4A7A3A 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, #D9A066 0%, transparent 45%)" }}
          />
          <div className="container mx-auto px-4 md:px-6 py-10 relative">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full text-[#D9A066] bg-[#D9A066]/15 border border-[#D9A066]/30">
              🏡 Interactive Action Hub
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
              The Stomping Grounds
            </h1>
            <p className="text-white/65 max-w-xl leading-relaxed text-base">
              Your homestead hub. Wander between four stations — dig for wisdom, toss a coin,
              chart your transformation, and let the water wheel earn while you build.
            </p>
          </div>
        </div>

        {/* ── Desktop scene ── */}
        <div className="hidden md:block">
          <div className="container mx-auto px-4 md:px-6 py-8">
            <div className="flex gap-6 items-start">
              {/* Scene canvas */}
              <div className="flex-1 min-w-0">
                <div
                  className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                  style={{ aspectRatio: "800 / 440" }}
                >
                  <SceneBackground />

                  {/* Station hotspots */}
                  {stations.map((s) => (
                    <StationHotspot
                      key={s.id}
                      station={s}
                      isOpen={openStation === s.id}
                      onClick={() => toggle(s.id as StationId)}
                    />
                  ))}

                  {/* Hint text */}
                  {!openStation && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs font-medium tracking-wide px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm pointer-events-none">
                      Click a station to explore
                    </div>
                  )}
                </div>
              </div>

              {/* Station panel */}
              <div className="w-80 shrink-0">
                {currentStation ? (
                  <div className="rounded-2xl border border-white/10 bg-[#243A28] shadow-xl overflow-hidden">
                    {/* Panel header */}
                    <div
                      className="px-5 py-4 border-b border-white/10"
                      style={{ background: currentStation.color + "33" }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl leading-none">{currentStation.icon}</span>
                          <h2 className="font-serif text-lg font-bold text-white">{currentStation.label}</h2>
                        </div>
                        <button
                          onClick={() => setOpenStation(null)}
                          className="text-white/40 hover:text-white/80 transition-colors text-lg leading-none"
                          aria-label="Close panel"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-white/60 text-xs mt-1.5 leading-relaxed">{currentStation.description}</p>
                    </div>

                    <div className="p-5">
                      <StationContent stationId={openStation!} transformations={transformations ?? []} />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-[#243A28]/60 p-6 text-center">
                    <div className="text-4xl mb-3" style={{ animation: "grounds-float 3s ease-in-out infinite" }}>🏡</div>
                    <p className="text-white/50 text-sm leading-relaxed">
                      Select a station on the grounds to explore its features.
                    </p>
                    <div className="mt-5 flex flex-col gap-2">
                      {stations.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => toggle(s.id as StationId)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-white/5 transition-colors group"
                        >
                          <span className="text-lg leading-none">{s.icon}</span>
                          <div>
                            <div className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors">{s.label}</div>
                            {s.badge != null && (
                              <div className="text-[10px] text-white/40">{s.badge} {s.id === "wisdom-dig" ? "gems" : s.id === "wishing-well" ? "coins in pot" : "paths"}</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile layout (stacked cards) ── */}
        <div className="md:hidden container mx-auto px-4 py-6 flex flex-col gap-4">
          <p className="text-white/50 text-xs text-center mb-1">Four stations — tap to expand</p>
          {[...stations].sort((a, b) => a.mobileOrder - b.mobileOrder).map((s) => (
            <div key={s.id} className="rounded-2xl border border-white/10 bg-[#243A28] overflow-hidden shadow-lg">
              <button
                onClick={() => toggle(s.id as StationId)}
                className="w-full flex items-center gap-3 px-4 py-4 text-left"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative"
                  style={{ background: s.glowColor + "22", border: `2px solid ${s.glowColor}44` }}
                >
                  <span className="text-2xl leading-none">{s.icon}</span>
                  {s.badge != null && (
                    <div
                      className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full text-[10px] font-bold flex items-center justify-center px-1.5 text-white"
                      style={{ background: s.color }}
                    >
                      {s.badge}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif font-bold text-white text-base">{s.label}</div>
                  <div className="text-white/50 text-xs mt-0.5 line-clamp-1">{s.description}</div>
                </div>
                <div
                  className="shrink-0 text-white/40 transition-transform duration-200"
                  style={{ transform: openStation === s.id ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  ▾
                </div>
              </button>

              {openStation === s.id && (
                <div className="px-4 pb-5 border-t border-white/8 pt-4">
                  <StationContent stationId={s.id as StationId} transformations={transformations ?? []} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom padding */}
        <div className="pb-16" />
      </div>
    </>
  );
}

// ─── Wisdom Dig inline panel ────────────────────────────────────────────────────

interface InlineGem {
  id: number;
  episodeSlug: string;
  episodeTitle: string | null;
  gemText: string;
  anchorCount: number;
  featured: boolean;
}

async function fetchTopGems(): Promise<InlineGem[]> {
  const res = await fetch(apiUrl("/wisdom/gems?limit=40&offset=0"));
  if (!res.ok) throw new Error("Failed to load gems");
  const data: { gems: InlineGem[] } = await res.json();
  return [...data.gems].sort((a, b) => b.anchorCount - a.anchorCount).slice(0, 5);
}

async function anchorGemInline(id: number): Promise<{ anchorCount: number }> {
  const res = await fetch(apiUrl(`/wisdom/gems/anchor/${id}`), {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to anchor");
  return res.json();
}

function WisdomDigInlinePanel() {
  const qc = useQueryClient();
  const [anchored, setAnchored] = useState<Set<number>>(new Set());

  const { data: gems = [], isLoading } = useQuery({
    queryKey: ["stomping-gems-top"],
    queryFn: fetchTopGems,
    staleTime: 60_000,
  });

  const anchorMut = useMutation({
    mutationFn: anchorGemInline,
    onSuccess: (_d, id) => {
      setAnchored((prev) => new Set(prev).add(id));
      qc.invalidateQueries({ queryKey: ["stomping-gems-top"] });
      qc.invalidateQueries({ queryKey: ["stomping-gem-count"] });
    },
  });

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : gems.length === 0 ? (
        <p className="text-white/50 text-sm text-center py-4">
          No gems yet — open the dig to start mining.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {gems.map((gem) => {
            const isAnchored = anchored.has(gem.id);
            return (
              <div
                key={gem.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3 flex flex-col gap-2"
              >
                <p className="font-serif text-sm leading-relaxed text-white/85 italic line-clamp-3">
                  "{gem.gemText}"
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-white/40 truncate">
                    {gem.episodeTitle ?? gem.episodeSlug}
                  </span>
                  <button
                    onClick={() => !isAnchored && anchorMut.mutate(gem.id)}
                    disabled={isAnchored}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 transition-all ${
                      isAnchored
                        ? "bg-[#2C4A36] text-white border-[#2C4A36] cursor-default"
                        : "border-white/30 text-white/70 hover:bg-[#2C4A36] hover:text-white hover:border-[#2C4A36]"
                    }`}
                  >
                    <Anchor className="w-3 h-3" />
                    {gem.anchorCount > 0 && <span>{gem.anchorCount}</span>}
                    {isAnchored ? "Anchored" : "Anchor"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/wisdom-dig"
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#2C4A36] hover:opacity-90 transition-opacity"
      >
        💎 See full page <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// ─── Wishing Well inline panel ──────────────────────────────────────────────────

interface InlineWish {
  id: number;
  amountUnits: number;
  wishText: string;
  listenerName: string | null;
  stackCount: number;
  founderMatchTriggered: boolean;
}

interface InlinePot {
  totalUnits: number;
  tipCount: number;
  drawn: boolean;
}

async function fetchInlinePot(): Promise<InlinePot> {
  const res = await fetch(apiUrl("/wishing-well/pot/today"));
  if (!res.ok) throw new Error("Failed to load pot");
  return res.json();
}

async function fetchInlineWishes(): Promise<InlineWish[]> {
  const res = await fetch(apiUrl("/wishing-well/wishes"));
  if (!res.ok) throw new Error("Failed to load wishes");
  const data: { wishes: InlineWish[] } = await res.json();
  return data.wishes;
}

async function submitMiniTip(data: {
  amountUnits: number;
  wishText: string;
  listenerName: string;
  currency: string;
}): Promise<unknown> {
  const res = await fetch(apiUrl("/wishing-well/tip"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "Failed to submit tip");
  }
  return res.json();
}

function WishingWellInlinePanel() {
  const qc = useQueryClient();
  const [wishText, setWishText] = useState("");
  const [listenerName, setListenerName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: pot } = useQuery({
    queryKey: ["stomping-ww-pot"],
    queryFn: fetchInlinePot,
    staleTime: 30_000,
  });

  const { data: wishes = [] } = useQuery({
    queryKey: ["stomping-ww-wishes"],
    queryFn: fetchInlineWishes,
    staleTime: 30_000,
  });

  const tipMut = useMutation({
    mutationFn: submitMiniTip,
    onSuccess: () => {
      setSubmitted(true);
      qc.invalidateQueries({ queryKey: ["stomping-ww-pot"] });
      qc.invalidateQueries({ queryKey: ["stomping-ww-wishes"] });
      qc.invalidateQueries({ queryKey: ["stomping-pot-today"] });
    },
  });

  const topWishes = wishes.slice(0, 4);

  return (
    <div className="flex flex-col gap-4">
      {/* Pot total */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#B5853A]/15 border border-[#D9A066]/25">
        <Coins className="w-5 h-5 text-[#D9A066] shrink-0" />
        <div>
          <div className="text-lg font-bold text-white font-serif leading-none">
            {pot != null ? pot.totalUnits : "—"}
            <span className="text-sm font-sans font-normal text-white/60 ml-1.5">
              coins in pot
            </span>
          </div>
          <div className="text-[10px] text-white/50 mt-0.5">
            {pot
              ? `${pot.tipCount} wish${pot.tipCount !== 1 ? "es" : ""} today${pot.drawn ? " · Draw complete" : ""}`
              : "Loading…"}
          </div>
        </div>
      </div>

      {/* Mini wish form */}
      {submitted ? (
        <div className="rounded-xl border border-[#2C4A36]/40 bg-[#2C4A36]/15 p-4 text-center">
          <div className="text-2xl mb-1">🪙</div>
          <p className="text-white/80 text-sm font-serif">Your coin is in the well!</p>
          <button
            onClick={() => {
              setSubmitted(false);
              setWishText("");
              setListenerName("");
            }}
            className="mt-2 text-xs text-white/40 hover:text-white/70 underline"
          >
            Toss another
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <input
            type="text"
            value={listenerName}
            onChange={(e) => setListenerName(e.target.value)}
            placeholder="Your name (optional)"
            maxLength={80}
            className="w-full rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#D9A066]"
          />
          <textarea
            value={wishText}
            onChange={(e) => setWishText(e.target.value)}
            placeholder="Make a wish…"
            maxLength={280}
            rows={2}
            className="w-full rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:ring-1 focus:ring-[#D9A066]"
          />
          {tipMut.isError && (
            <p className="text-xs text-red-400">
              {tipMut.error instanceof Error
                ? tipMut.error.message
                : "Something went wrong"}
            </p>
          )}
          <button
            onClick={() =>
              tipMut.mutate({
                amountUnits: 1,
                wishText,
                listenerName,
                currency: "BTC",
              })
            }
            disabled={
              !wishText.trim() ||
              wishText.trim().length < 3 ||
              tipMut.isPending
            }
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#B5853A] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            🪙 {tipMut.isPending ? "Tossing…" : "Toss a Coin"}
          </button>
        </div>
      )}

      {/* Today's wishes (compact) */}
      {topWishes.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
            <Layers className="w-3 h-3" /> Today's Wishes
          </div>
          {topWishes.map((wish) => (
            <div
              key={wish.id}
              className={`rounded-lg border p-2.5 text-xs ${
                wish.founderMatchTriggered
                  ? "border-[#D9A066]/40 bg-[#D9A066]/8"
                  : "border-white/10 bg-white/4"
              }`}
            >
              <p className="font-serif text-white/80 italic line-clamp-2 mb-1">
                "{wish.wishText}"
              </p>
              <div className="flex items-center gap-1.5 text-white/40 flex-wrap">
                <span>🪙 {wish.amountUnits}</span>
                {wish.listenerName && (
                  <>
                    <span>·</span>
                    <span>{wish.listenerName}</span>
                  </>
                )}
                {wish.stackCount > 0 && (
                  <>
                    <span>·</span>
                    <span>{wish.stackCount} stacks</span>
                  </>
                )}
                {wish.founderMatchTriggered && (
                  <span className="text-[#D9A066] font-semibold">⚡ Matched</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/wishing-well"
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white/80 border border-white/20 hover:border-white/40 hover:text-white transition-all"
      >
        See full page <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// ─── Station content router ─────────────────────────────────────────────────────

function StationContent({
  stationId,
  transformations,
}: {
  stationId: StationId;
  transformations: Transformation[];
}) {
  if (stationId === "wisdom-dig") {
    return <WisdomDigInlinePanel />;
  }

  if (stationId === "wishing-well") {
    return <WishingWellInlinePanel />;
  }

  if (stationId === "transform") {
    if (transformations.length === 0) {
      return (
        <div className="text-white/50 text-sm">Loading transformation paths…</div>
      );
    }
    return <TransformTrailPanel transformations={transformations} />;
  }

  if (stationId === "water-wheel") {
    return <WaterWheelPanel />;
  }

  return null;
}
