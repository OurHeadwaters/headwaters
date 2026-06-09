import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowRight, Droplets, Pause, Play, RefreshCw, Anchor, Coins, Layers } from "lucide-react";
import { useTransformations, type Transformation } from "@/hooks/use-transformations";
import { useAuth } from "@workspace/replit-auth-web";
const GORD_IMG = `${import.meta.env.BASE_URL}gord.png`;

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

// ─── Data hooks ────────────────────────────────────────────────────────────────

export function useGemCount() {
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

export function usePotTotal() {
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
  } catch { /* ignore */ }
  return { drops: 0, running: false, bucket: "", lifetimeSweeps: 0 };
}

function saveWWState(s: WaterWheelState) {
  localStorage.setItem(WW_KEY, JSON.stringify(s));
}

// ─── Thematic SVG Markers ────────────────────────────────────────────────────

function LanternMarker({ isOpen }: { isOpen: boolean }) {
  return (
    <svg viewBox="0 0 52 80" className="w-full h-full" aria-hidden="true">
      {/* Post */}
      <rect x="23" y="38" width="6" height="36" rx="3" fill="#5A3A1A" />
      <rect x="24" y="39" width="2" height="34" rx="1" fill="#7A5030" opacity="0.4" />
      {/* Base */}
      <rect x="18" y="72" width="16" height="5" rx="2.5" fill="#4A2A10" />
      <rect x="20" y="73" width="12" height="2" rx="1" fill="#6A4020" opacity="0.5" />
      {/* Crossbar arm */}
      <rect x="14" y="35" width="20" height="4" rx="2" fill="#6A4828" />
      <rect x="15" y="35.5" width="18" height="1.5" rx="1" fill="#8A6038" opacity="0.4" />
      {/* Chain */}
      <line x1="26" y1="35" x2="26" y2="28" stroke="#8A6030" strokeWidth="1.3" strokeDasharray="2,1.5" />
      {/* Lantern cap */}
      <path d="M16 20 Q26 15 36 20 L34 25 Q26 23 18 25 Z" fill="#4A2E10" stroke="#7A5030" strokeWidth="1" />
      <rect x="23" y="15" width="6" height="5" rx="1.5" fill="#3A2010" />
      {/* Lantern body */}
      <path d="M18 25 L20 44 Q26 47 32 44 L34 25 Z" fill="#2C1A08" stroke="#7A5030" strokeWidth="1.2" />
      {/* Glass panels - warm glow */}
      <path
        d="M20 27 L21.5 43 Q26 45.5 30.5 43 L32 27 Q26 25 20 27 Z"
        fill="#D9A066"
        opacity={isOpen ? "0.88" : "0.65"}
        style={{ animation: "lantern-flicker 3.4s ease-in-out infinite" }}
      />
      {/* Glass ribs */}
      <line x1="26" y1="26" x2="26" y2="45" stroke="#9A6030" strokeWidth="0.8" opacity="0.7" />
      <line x1="20.5" y1="36" x2="31.5" y2="36" stroke="#9A6030" strokeWidth="0.8" opacity="0.5" />
      {/* Inner flame */}
      <ellipse
        cx="26" cy="35" rx="3.5" ry="5"
        fill="#FFE090"
        opacity={isOpen ? "1" : "0.8"}
        style={{ animation: "lantern-flicker 3.4s ease-in-out infinite" }}
      />
      <ellipse cx="26" cy="33" rx="1.5" ry="2.5" fill="#FFF8D0" opacity="0.9" />
      {/* Bottom frame */}
      <ellipse cx="26" cy="44.5" rx="7" ry="2" fill="#4A2E10" stroke="#7A5030" strokeWidth="0.8" />
    </svg>
  );
}

function WellMarker({ isOpen }: { isOpen: boolean }) {
  return (
    <svg viewBox="0 0 60 72" className="w-full h-full" aria-hidden="true">
      {/* Stone base */}
      <ellipse cx="30" cy="56" rx="20" ry="6" fill="#5A4A38" />
      {/* Well walls */}
      <rect x="10" y="30" width="40" height="28" rx="3" fill="#6A5A48" />
      <rect x="10" y="30" width="40" height="5" rx="2" fill="#7A6A58" />
      {/* Stone texture lines */}
      <line x1="10" y1="42" x2="50" y2="42" stroke="#5A4A38" strokeWidth="1" opacity="0.6" />
      <line x1="10" y1="50" x2="50" y2="50" stroke="#5A4A38" strokeWidth="1" opacity="0.5" />
      <line x1="22" y1="30" x2="22" y2="58" stroke="#5A4A38" strokeWidth="0.8" opacity="0.4" />
      <line x1="38" y1="30" x2="38" y2="58" stroke="#5A4A38" strokeWidth="0.8" opacity="0.4" />
      {/* Well opening */}
      <ellipse cx="30" cy="32" rx="16" ry="4" fill="#2C1A10" />
      <ellipse cx="30" cy="31" rx="14" ry="3" fill="#1A0E08" />
      {/* Water ripples */}
      {isOpen && (
        <>
          <circle cx="30" cy="31" r="4" fill="none" stroke="#2C6A8A" strokeWidth="1" opacity="0.7"
            style={{ animation: "water-ripple 2s ease-out infinite" }}
          />
          <circle cx="30" cy="31" r="4" fill="none" stroke="#2C6A8A" strokeWidth="0.8" opacity="0.5"
            style={{ animation: "water-ripple 2s ease-out 0.8s infinite" }}
          />
        </>
      )}
      {/* Posts */}
      <rect x="8" y="12" width="6" height="22" rx="3" fill="#7A5A38" />
      <rect x="46" y="12" width="6" height="22" rx="3" fill="#7A5A38" />
      {/* Crossbar */}
      <rect x="6" y="10" width="48" height="5" rx="2.5" fill="#8A6A40" />
      <rect x="7" y="11" width="46" height="2" rx="1" fill="#AA8A58" opacity="0.4" />
      {/* Rope */}
      <line x1="30" y1="15" x2="30" y2="30" stroke="#C4905A" strokeWidth="1.5" strokeDasharray="2,1" />
      {/* Bucket */}
      <rect x="25" y="18" width="10" height="9" rx="2" fill="#8A6A40" />
      <path d="M25 18 Q30 16 35 18" fill="none" stroke="#6A4A28" strokeWidth="1.2" />
      <rect x="26" y="23" width="8" height="2" rx="1" fill="#2C6A8A" opacity="0.7" />
      {/* Coin glint */}
      <ellipse
        cx="42" cy="26" rx="2.5" ry="1.5"
        fill="#D9A066"
        style={{ animation: "coin-glint 4s ease-in-out infinite" }}
      />
      <ellipse
        cx="17" cy="38" rx="2" ry="1.2"
        fill="#D9A066"
        style={{ animation: "coin-glint 4s ease-in-out 1.8s infinite" }}
      />
    </svg>
  );
}

function SignPostMarker({ isOpen }: { isOpen: boolean }) {
  return (
    <svg viewBox="0 0 60 80" className="w-full h-full" aria-hidden="true">
      {/* Post */}
      <rect x="27" y="36" width="6" height="40" rx="3" fill="#7A5A38" />
      <rect x="28.5" y="37" width="2" height="38" rx="1" fill="#9A7A50" opacity="0.35" />
      {/* Post base */}
      <rect x="22" y="73" width="16" height="5" rx="2.5" fill="#5A3A1A" />
      {/* Upper sign plank */}
      <rect x="6" y="14" width="44" height="14" rx="3"
        fill="#9A7248"
        transform="rotate(-3 6 14)"
      />
      <rect x="7" y="15" width="42" height="12" rx="2.5"
        fill="#B08A58"
        opacity="0.4"
        transform="rotate(-3 7 15)"
      />
      {/* Sign arrow notch left */}
      <polygon points="6,21 12,16 12,26" fill="#7A5A38" transform="rotate(-3 6 21)" />
      {/* Sign text lines implied */}
      <rect x="16" y="18" width="22" height="2.5" rx="1" fill="#7A5A38" opacity="0.5" transform="rotate(-3 16 18)" />
      <rect x="16" y="23" width="18" height="2" rx="1" fill="#7A5A38" opacity="0.35" transform="rotate(-3 16 23)" />
      {/* Lower sign plank */}
      <rect x="8" y="30" width="40" height="12" rx="3"
        fill="#8A6A40"
        transform="rotate(2 8 30)"
      />
      <rect x="9" y="31" width="38" height="10" rx="2.5"
        fill="#AA8A58"
        opacity="0.35"
        transform="rotate(2 9 31)"
      />
      {/* Sign arrow notch right */}
      <polygon points="48,36 54,31 54,41" fill="#6A4A28" transform="rotate(2 48 36)" />
      {/* Vine/leaf decoration */}
      <path d="M8 36 Q5 32 8 28" fill="none" stroke="#4A7A3A" strokeWidth="1.5" strokeLinecap="round"
        style={{ animation: `leaf-rustle ${isOpen ? "1.8s" : "4s"} ease-in-out infinite` }}
      />
      <ellipse cx="6" cy="29" rx="4" ry="2.5" fill="#3A6A2A"
        transform="rotate(-20 6 29)"
        style={{ animation: `leaf-rustle ${isOpen ? "1.8s" : "4s"} ease-in-out infinite` }}
      />
      <ellipse cx="7" cy="35" rx="3" ry="2" fill="#4A7A3A"
        transform="rotate(15 7 35)"
        style={{ animation: `leaf-rustle ${isOpen ? "1.8s" : "4s"} ease-in-out 0.3s infinite` }}
      />
      {/* Nail dots */}
      <circle cx="10" cy="21" r="1.5" fill="#4A2E10" />
      <circle cx="46" cy="21" r="1.5" fill="#4A2E10" />
      <circle cx="12" cy="36" r="1.5" fill="#4A2E10" />
      <circle cx="44" cy="36" r="1.5" fill="#4A2E10" />
    </svg>
  );
}

function CampfireMarker({ isOpen }: { isOpen: boolean }) {
  return (
    <svg viewBox="0 0 52 72" className="w-full h-full" aria-hidden="true">
      {/* Ground dirt */}
      <ellipse cx="26" cy="62" rx="18" ry="5" fill="#3A1E08" opacity="0.5" />
      {/* Logs */}
      <rect x="8" y="52" width="36" height="9" rx="4.5" fill="#5A3010" transform="rotate(-16 26 56)" />
      <rect x="8" y="52" width="36" height="9" rx="4.5" fill="#6A3818" transform="rotate(16 26 56)" />
      {/* Ember glow */}
      <ellipse cx="26" cy="55" rx="12" ry="5"
        fill="#E85A2A"
        opacity={isOpen ? "0.6" : "0.35"}
        style={{ animation: "campfire-glow 2.2s ease-in-out infinite" }}
      />
      <ellipse cx="26" cy="55" rx="7" ry="3"
        fill="#FF8C42"
        opacity={isOpen ? "0.75" : "0.5"}
        style={{ animation: "campfire-glow 2.2s ease-in-out 0.3s infinite" }}
      />
      {/* Main flame */}
      <path
        d="M18 54 Q14 40 20 28 Q24 18 26 10 Q28 20 25 30 Q30 20 33 12 Q38 26 35 38 Q38 30 38 42 Q38 54 34 54 Z"
        fill="#E85A2A"
        opacity={isOpen ? "0.95" : "0.75"}
        style={{ animation: "campfire-sway 2.2s ease-in-out infinite" }}
      />
      {/* Inner flame */}
      <path
        d="M20 54 Q18 44 22 34 Q25 24 26 16 Q27 26 25 34 Q28 26 30 18 Q34 30 32 40 Q34 46 32 54 Z"
        fill="#FF8C42"
        opacity={isOpen ? "0.9" : "0.65"}
        style={{ animation: "campfire-sway 2.2s ease-in-out 0.4s infinite" }}
      />
      {/* Core */}
      <path
        d="M22 53 Q21 46 24 38 Q26 30 26 22 Q27 30 26 36 Q28 30 29 24 Q31 34 30 42 Q30 48 28 53 Z"
        fill="#FFD580"
        opacity={isOpen ? "0.95" : "0.7"}
        style={{ animation: "campfire-sway 2.2s ease-in-out 0.8s infinite" }}
      />
      {/* Embers */}
      {isOpen && (
        <>
          <circle cx="18" cy="38" r="1.5" fill="#FF8C42" opacity="0.7"
            style={{ animation: "campfire-spark 1.8s ease-out 0.2s infinite" }}
          />
          <circle cx="34" cy="32" r="1" fill="#FFD580" opacity="0.6"
            style={{ animation: "campfire-spark 2.1s ease-out 0.8s infinite" }}
          />
          <circle cx="15" cy="28" r="1.2" fill="#FF6020" opacity="0.5"
            style={{ animation: "campfire-spark 1.5s ease-out 1.2s infinite" }}
          />
        </>
      )}
    </svg>
  );
}

function MillWheelMarker({ spinning }: { spinning: boolean }) {
  return (
    <svg viewBox="0 0 60 72" className="w-full h-full" aria-hidden="true">
      {/* Water channel */}
      <rect x="0" y="56" width="60" height="16" rx="3" fill="#2C4A5A" opacity="0.6" />
      <rect x="0" y="56" width="60" height="4" rx="2" fill="#2C6A8A" opacity="0.4" />
      {/* Support posts */}
      <rect x="6" y="18" width="5" height="42" rx="2.5" fill="#6A4A28" />
      <rect x="49" y="18" width="5" height="42" rx="2.5" fill="#6A4A28" />
      {/* Axle */}
      <line x1="11" y1="37" x2="49" y2="37" stroke="#5A3A1A" strokeWidth="3" />
      {/* Wheel rim */}
      <circle cx="30" cy="37" r="24" fill="none" stroke="#5A3A1A" strokeWidth="3.5" />
      {/* Rotating group */}
      <g
        style={{
          transformOrigin: "30px 37px",
          animation: spinning
            ? "ww-spin 5s linear infinite"
            : "ww-creak 6s ease-in-out infinite",
        }}
      >
        {/* Spokes */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 30 + 4 * Math.cos(rad);
          const y1 = 37 + 4 * Math.sin(rad);
          const x2 = 30 + 21 * Math.cos(rad);
          const y2 = 37 + 21 * Math.sin(rad);
          const px = 30 + 18 * Math.cos(rad);
          const py = 37 + 18 * Math.sin(rad);
          return (
            <g key={deg}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#7A5030" strokeWidth="2" strokeLinecap="round" />
              {/* Paddle */}
              <rect
                x={px - 5}
                y={py - 3}
                width="10"
                height="6"
                rx="1.5"
                fill="#A07040"
                transform={`rotate(${deg}, ${px}, ${py})`}
              />
              {/* Grain lines on paddle */}
              <line
                x1={px - 3} y1={py}
                x2={px + 3} y2={py}
                stroke="#7A5030"
                strokeWidth="0.6"
                opacity="0.5"
                transform={`rotate(${deg}, ${px}, ${py})`}
              />
            </g>
          );
        })}
        {/* Hub */}
        <circle cx="30" cy="37" r="5" fill="#5A3A1A" stroke="#8A5A30" strokeWidth="1.5" />
        <circle cx="30" cy="37" r="2.5" fill="#7A5030" />
        {/* Hub bolts */}
        <circle cx="30" cy="33" r="1" fill="#3A2010" />
        <circle cx="34" cy="39" r="1" fill="#3A2010" />
        <circle cx="26" cy="39" r="1" fill="#3A2010" />
      </g>
      {/* Drips when spinning */}
      {spinning && (
        <>
          <circle cx="42" cy="52" r="2" fill="#2C8ABA" opacity="0.7">
            <animate attributeName="cy" values="48;58;48" dur="1.1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="1.1s" repeatCount="indefinite" />
          </circle>
          <circle cx="36" cy="55" r="1.5" fill="#2C8ABA" opacity="0.5">
            <animate attributeName="cy" values="50;60;50" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </svg>
  );
}

// ─── Station badges ──────────────────────────────────────────────────────────

function GemBadge({ count }: { count: string }) {
  return (
    <div className="relative flex items-center justify-center">
      <svg width="28" height="26" viewBox="0 0 28 26" aria-hidden="true">
        <polygon points="14,1 26,8 26,18 14,25 2,18 2,8" fill="#2C4A36" stroke="#4A9A5A" strokeWidth="1.2" />
        <polygon points="14,4 23,9 23,17 14,22 5,17 5,9" fill="#3A6A48" opacity="0.5" />
        <line x1="14" y1="4" x2="14" y2="22" stroke="#6AAA7A" strokeWidth="0.6" opacity="0.4" />
        <line x1="5" y1="9" x2="23" y2="17" stroke="#6AAA7A" strokeWidth="0.6" opacity="0.3" />
        <line x1="23" y1="9" x2="5" y2="17" stroke="#6AAA7A" strokeWidth="0.6" opacity="0.3" />
      </svg>
      <span className="absolute text-[9px] font-bold text-white leading-none">{count}</span>
    </div>
  );
}

function CoinBadge({ count }: { count: string }) {
  return (
    <div className="relative flex items-center justify-center">
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="#B5853A" stroke="#D9A066" strokeWidth="1.2" />
        <circle cx="12" cy="12" r="8" fill="#C8963A" opacity="0.5" />
        <ellipse cx="9" cy="9" rx="3" ry="1.5" fill="#FFDC80" opacity="0.4" transform="rotate(-30 9 9)" />
      </svg>
      <span className="absolute text-[9px] font-bold text-white leading-none">{count}</span>
    </div>
  );
}

// ─── Station hotspot (thematic) ──────────────────────────────────────────────

export interface StationConfig {
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

const FORGE_STATION_IDS = new Set(["water-wheel"]);

function ThematicHotspot({
  station,
  isOpen,
  onClick,
  parallax,
  spinning,
}: {
  station: StationConfig;
  isOpen: boolean;
  onClick: () => void;
  parallax: { x: number; y: number };
  spinning?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const translateX = `calc(-50% + ${parallax.x}px)`;
  const translateY = `calc(-50% + ${parallax.y}px)`;
  const isForge = FORGE_STATION_IDS.has(station.id);
  const emberClass = isForge ? "ember-pulse-cyan" : "ember-pulse-orange";

  const markerSize =
    station.id === "water-wheel" ? { w: "w-14 h-14" } : { w: "w-14 h-[4.5rem]" };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute flex flex-col items-center gap-1 group transition-all duration-200 z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      style={{
        top: station.position.top,
        left: station.position.left,
        transform: `translate(${translateX}, ${translateY})`,
        transition: "transform 0.15s ease-out",
      }}
      aria-label={`Open ${station.label}`}
    >
      {/* Marker container */}
      <div
        className={`relative ${markerSize.w} transition-all duration-300 ${
          isOpen ? "scale-110 drop-shadow-2xl" : "group-hover:scale-105"
        }`}
        style={{
          filter: isOpen
            ? `drop-shadow(0 0 12px ${station.glowColor}88) drop-shadow(0 4px 8px rgba(0,0,0,0.4))`
            : `drop-shadow(0 2px 4px rgba(0,0,0,0.3))`,
          transition: "filter 0.3s ease",
        }}
      >
        {/* Ember glow pulse on hover */}
        {(isHovered || isOpen) && (
          <div
            aria-hidden="true"
            className={`absolute pointer-events-none rounded-full ${isOpen ? "" : emberClass}`}
            style={{
              inset: "-14px",
              background: `radial-gradient(ellipse at center, ${
                isForge ? "rgba(0,191,223,0.18)" : "rgba(212,98,26,0.18)"
              } 0%, transparent 70%)`,
              boxShadow: isOpen
                ? `0 0 30px 10px ${isForge ? "rgba(0,191,223,0.25)" : "rgba(212,98,26,0.25)"}`
                : undefined,
            }}
          />
        )}
        {station.id === "wisdom-dig" && <LanternMarker isOpen={isOpen} />}
        {station.id === "wishing-well" && <WellMarker isOpen={isOpen} />}
        {station.id === "transform" && <SignPostMarker isOpen={isOpen} />}
        {station.id === "water-wheel" && <MillWheelMarker spinning={spinning ?? false} />}
        {station.id === "campfire" && <CampfireMarker isOpen={isOpen} />}

        {/* Badge */}
        {station.badge != null && (
          <div className="absolute -top-2 -right-2 z-10">
            {station.id === "wisdom-dig" ? (
              <GemBadge count={station.badge} />
            ) : station.id === "wishing-well" ? (
              <CoinBadge count={station.badge} />
            ) : (
              <div
                className="min-w-[20px] h-5 rounded-full text-[10px] font-bold flex items-center justify-center px-1.5 text-white shadow-sm"
                style={{ background: station.color }}
              >
                {station.badge}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wooden plank label */}
      <div
        className="relative text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md text-white whitespace-nowrap transition-all"
        style={{
          background: `linear-gradient(170deg, ${station.color}ee 0%, ${station.color}cc 100%)`,
          border: `1px solid ${station.glowColor}44`,
          boxShadow: "0 2px 6px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
          fontFamily: "Georgia, serif",
          letterSpacing: "0.06em",
        }}
      >
        {/* Nail dots */}
        <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-black/30" />
        <span className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-black/30" />
        {station.label}
      </div>

      {/* Open glow ring */}
      {isOpen && (
        <div
          className="absolute inset-[-6px] rounded-full pointer-events-none"
          style={{
            boxShadow: `0 0 0 3px ${station.glowColor}44, 0 0 20px ${station.glowColor}22`,
          }}
        />
      )}
    </button>
  );
}

// ─── Legacy StationHotspot (kept for backward compat) ────────────────────────

export function StationHotspot({
  station,
  isOpen,
  onClick,
}: {
  station: StationConfig;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <ThematicHotspot
      station={station}
      isOpen={isOpen}
      onClick={onClick}
      parallax={{ x: 0, y: 0 }}
    />
  );
}

// ─── Atmospheric layers ──────────────────────────────────────────────────────

function MistLayer({ parallaxX }: { parallaxX: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
      <div
        style={{
          position: "absolute",
          bottom: "18%",
          left: "-8%",
          width: "50%",
          height: "28%",
          background: "radial-gradient(ellipse, rgba(190,215,195,0.22) 0%, transparent 68%)",
          filter: "blur(22px)",
          animation: "mist-drift 20s ease-in-out infinite",
          transform: `translateX(${parallaxX * 0.25}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "35%",
          right: "-4%",
          width: "38%",
          height: "22%",
          background: "radial-gradient(ellipse, rgba(175,200,178,0.16) 0%, transparent 68%)",
          filter: "blur(28px)",
          animation: "mist-drift2 25s ease-in-out infinite",
          transform: `translateX(${-parallaxX * 0.18}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "25%",
          left: "30%",
          width: "30%",
          height: "18%",
          background: "radial-gradient(ellipse, rgba(200,220,200,0.10) 0%, transparent 68%)",
          filter: "blur(18px)",
          animation: "mist-drift 28s ease-in-out 5s infinite",
        }}
      />
    </div>
  );
}

const FIREFLY_POSITIONS = [
  { top: "18%", left: "7%",  delay: "0s",    dur: "5.2s",  size: 3 },
  { top: "32%", left: "22%", delay: "1.7s",  dur: "6.8s",  size: 2.5 },
  { top: "12%", left: "52%", delay: "0.9s",  dur: "4.9s",  size: 2 },
  { top: "62%", left: "85%", delay: "2.4s",  dur: "7.1s",  size: 3 },
  { top: "72%", left: "10%", delay: "3.6s",  dur: "5.5s",  size: 2.5 },
  { top: "42%", left: "68%", delay: "0.4s",  dur: "6.3s",  size: 2 },
  { top: "24%", left: "40%", delay: "4.2s",  dur: "5.8s",  size: 3 },
  { top: "78%", left: "58%", delay: "1.9s",  dur: "7.4s",  size: 2.5 },
  { top: "50%", left: "30%", delay: "3.1s",  dur: "4.6s",  size: 2 },
  { top: "16%", left: "75%", delay: "0.7s",  dur: "6.6s",  size: 3 },
];

function FireflyLayer() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[3]">
      {FIREFLY_POSITIONS.map((f, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: f.top,
            left: f.left,
            width: f.size,
            height: f.size,
            borderRadius: "50%",
            background: "#AAEE88",
            boxShadow: `0 0 ${f.size * 3}px #88CC66, 0 0 ${f.size * 6}px #66AA44`,
            animation: `firefly-float ${f.dur} ease-in-out ${f.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Water Wheel SVG (enhanced) ──────────────────────────────────────────────

function WaterWheelSVG({ spinning }: { spinning: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden="true">
      {/* Water channel */}
      <rect x="0" y="90" width="120" height="30" rx="4" fill="#2C4A5A" opacity="0.35" />
      <rect x="0" y="90" width="120" height="6" rx="2" fill="#2C6A8A" opacity="0.4" />
      {/* Animated wave */}
      {spinning && (
        <path d="M0 92 Q20 88 40 92 Q60 96 80 92 Q100 88 120 92" fill="none"
          stroke="#2C8ABA" strokeWidth="2" opacity="0.6">
          <animate attributeName="d"
            values="M0 92 Q20 88 40 92 Q60 96 80 92 Q100 88 120 92;M0 96 Q20 92 40 96 Q60 92 80 96 Q100 92 120 96;M0 92 Q20 88 40 92 Q60 96 80 92 Q100 88 120 92"
            dur="2s" repeatCount="indefinite" />
        </path>
      )}
      {/* Support posts */}
      <rect x="5" y="20" width="8" height="74" rx="4" fill="#6A4A28" />
      <rect x="107" y="20" width="8" height="74" rx="4" fill="#6A4A28" />
      {/* Axle */}
      <rect x="13" y="56" width="94" height="6" rx="3" fill="#5A3A1A" />
      {/* Wheel rim */}
      <circle cx="60" cy="59" r="36" fill="none" stroke="#5A3A1A" strokeWidth="4" />
      <circle cx="60" cy="59" r="33" fill="none" stroke="#7A5A30" strokeWidth="1" opacity="0.4" />
      {/* Rotating group */}
      <g
        style={{
          transformOrigin: "60px 59px",
          animation: spinning
            ? "ww-spin 4.5s linear infinite"
            : "ww-creak 7s ease-in-out infinite",
        }}
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 60 + 5 * Math.cos(rad);
          const y1 = 59 + 5 * Math.sin(rad);
          const x2 = 60 + 33 * Math.cos(rad);
          const y2 = 59 + 33 * Math.sin(rad);
          const px = 60 + 29 * Math.cos(rad);
          const py = 59 + 29 * Math.sin(rad);
          const tx = -Math.sin(rad) * 8;
          const ty = Math.cos(rad) * 8;
          const grainRad = ((deg + 90) * Math.PI) / 180;
          return (
            <g key={deg}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#7A4A30" strokeWidth="2.5" strokeLinecap="round" />
              {/* Curved paddle */}
              <rect
                x={px - 7}
                y={py - 4}
                width="14"
                height="8"
                rx="2"
                fill="#A07040"
                transform={`rotate(${deg}, ${px}, ${py}) translate(${tx * 0.5}, ${ty * 0.5})`}
              />
              {/* Grain lines */}
              <line
                x1={px + grainRad * 0 - 4}
                y1={py - 1}
                x2={px - grainRad * 0 + 4}
                y2={py - 1}
                stroke="#7A5030"
                strokeWidth="0.7"
                opacity="0.4"
                transform={`rotate(${deg}, ${px}, ${py}) translate(${tx * 0.5}, ${ty * 0.5})`}
              />
              <line
                x1={px - 4}
                y1={py + 1.5}
                x2={px + 4}
                y2={py + 1.5}
                stroke="#7A5030"
                strokeWidth="0.5"
                opacity="0.3"
                transform={`rotate(${deg}, ${px}, ${py}) translate(${tx * 0.5}, ${ty * 0.5})`}
              />
            </g>
          );
        })}
        {/* Hub */}
        <circle cx="60" cy="59" r="7" fill="#5A3A1A" stroke="#8A5A30" strokeWidth="1.5" />
        <circle cx="60" cy="59" r="4" fill="#7A5030" />
        {/* Hub bolts */}
        {[0, 120, 240].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <circle
              key={deg}
              cx={60 + 5.5 * Math.cos(rad)}
              cy={59 + 5.5 * Math.sin(rad)}
              r="1.2"
              fill="#3A2010"
            />
          );
        })}
        {/* Bucket (visible fill indicator) */}
        <rect x="84" y="84" width="14" height="11" rx="2.5" fill="#D9A066" opacity="0.9" />
        <rect x="85" y="82" width="12" height="3.5" rx="1.5" fill="#C48844" />
      </g>

      {/* Drips when spinning */}
      {spinning && (
        <>
          <circle cx="74" cy="84" r="2.5" fill="#2C8ABA" opacity="0.7">
            <animate attributeName="cy" values="80;92;80" dur="1.3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="1.3s" repeatCount="indefinite" />
          </circle>
          <circle cx="78" cy="88" r="1.8" fill="#2C8ABA" opacity="0.5">
            <animate attributeName="cy" values="84;94;84" dur="1.7s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="1.7s" repeatCount="indefinite" />
          </circle>
          <circle cx="68" cy="86" r="1.5" fill="#2C8ABA" opacity="0.45">
            <animate attributeName="cy" values="82;93;82" dur="2.1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="2.1s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </svg>
  );
}

// ─── Wooden trough progress ──────────────────────────────────────────────────

function WoodenTroughProgress({ pct, canSweep }: { pct: number; canSweep: boolean }) {
  return (
    <div
      className="relative h-7 rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #3A1E08 0%, #5A3010 45%, #4A2808 100%)",
        border: "1.5px solid #7A4A20",
        boxShadow: "inset 0 2px 5px rgba(0,0,0,0.55), inset 0 -1px 2px rgba(255,140,40,0.08)",
      }}
    >
      {/* Wood grain texture */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(93deg, transparent 0px, transparent 9px, rgba(255,255,255,0.07) 9px, rgba(255,255,255,0.07) 10px)",
        }}
      />
      {/* Water fill */}
      <div
        className="absolute left-0 top-[3px] bottom-[3px] rounded-lg transition-all duration-700"
        style={{
          width: `${pct}%`,
          background: canSweep
            ? "linear-gradient(90deg, #1A66AA 0%, #2C8ABB 35%, #44AACC 75%, #5ABBD8 100%)"
            : "linear-gradient(90deg, #1A52A0 0%, #2070B0 40%, #2888BC 100%)",
          boxShadow: canSweep
            ? "0 0 10px #2C8ABB88, inset 0 1px 0 rgba(255,255,255,0.3)"
            : "inset 0 1px 0 rgba(255,255,255,0.15)",
        }}
      />
      {/* Top rim */}
      <div
        className="absolute inset-x-0 top-0 h-[3.5px] rounded-t-xl"
        style={{ background: "linear-gradient(90deg, #8A5022, #A07035, #7A4018)" }}
      />
      {/* Bottom rim */}
      <div
        className="absolute inset-x-0 bottom-0 h-[3.5px] rounded-b-xl"
        style={{ background: "linear-gradient(90deg, #2E1206, #442010, #2E1206)" }}
      />
      {/* Overflow sparkle */}
      {canSweep && (
        <div
          className="absolute top-1/2 pointer-events-none"
          style={{ right: "4%", zIndex: 5 }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#60C4DA",
              boxShadow: "0 0 8px #44AACC",
              animation: "sparkle-burst 1.5s ease-out infinite",
              position: "absolute",
              top: "-5px",
              left: "-5px",
            }}
          />
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#88DDEE",
              boxShadow: "0 0 6px #60C4DA",
              animation: "sparkle-burst 1.5s ease-out 0.4s infinite",
              position: "absolute",
              top: "-3px",
              left: "-3px",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Sweep animation ─────────────────────────────────────────────────────────

function SweepBurst({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="text-4xl" style={{ animation: "grounds-float 0.5s ease-out" }}>💧</div>
      <div
        className="absolute inset-0 rounded-2xl border-4 border-[#2C6A8A] opacity-0"
        style={{ animation: "sweep-ring 0.7s ease-out forwards" }}
      />
      {/* Radial sparkle lines */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <div
          key={deg}
          className="absolute w-1 h-6 rounded-full bg-[#60C4DA]"
          style={{
            transformOrigin: "center 100%",
            transform: `rotate(${deg}deg)`,
            animation: "sparkle-burst 0.8s ease-out forwards",
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

// ─── Water Wheel station panel ────────────────────────────────────────────────

const BUCKET_OPTIONS = [
  "Emergency Fund", "Garden Project", "Off-Grid Setup",
  "Debt Payoff", "Skill Course", "Community Fund",
];

function WaterWheelPanel() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<WaterWheelState>(loadWWState);
  const [sweepBurst, setSweepBurst] = useState(false);
  const [editingBucket, setEditingBucket] = useState(false);
  const [dropTick, setDropTick] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const serverSyncedRef = useRef(false);
  const prevDropsRef = useRef(state.drops);

  const syncToServer = useCallback((bucket: string, lifetimeSweeps: number) => {
    fetch(apiUrl("/water-wheel/state"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ bucket, lifetimeSweeps }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated || serverSyncedRef.current) return;
    serverSyncedRef.current = true;
    fetch(apiUrl("/water-wheel/state"), { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { bucket: string; lifetimeSweeps: number } | null) => {
        if (!data) return;
        setState((prev) => {
          const merged: WaterWheelState = {
            ...prev,
            bucket: data.bucket || prev.bucket,
            lifetimeSweeps: Math.max(data.lifetimeSweeps, prev.lifetimeSweeps),
          };
          saveWWState(merged);
          return merged;
        });
      })
      .catch(() => {});
  }, [isAuthenticated, authLoading]);

  const persist = useCallback(
    (next: WaterWheelState, serverFields?: { bucket?: string; lifetimeSweeps?: number }) => {
      setState(next);
      saveWWState(next);
      if (isAuthenticated && serverFields) {
        syncToServer(serverFields.bucket ?? next.bucket, serverFields.lifetimeSweeps ?? next.lifetimeSweeps);
      }
    },
    [isAuthenticated, syncToServer],
  );

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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.running]);

  // Drop tick animation
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    if (state.drops !== prevDropsRef.current) {
      prevDropsRef.current = state.drops;
      setDropTick(true);
      t = setTimeout(() => setDropTick(false), 450);
    }
    return () => { if (t !== undefined) clearTimeout(t); };
  }, [state.drops]);

  const toggleRunning = () => persist({ ...state, running: !state.running });

  const sweep = () => {
    if (state.drops < SWEEP_THRESHOLD) return;
    const next = { ...state, drops: 0, lifetimeSweeps: state.lifetimeSweeps + 1 };
    persist(next, { lifetimeSweeps: next.lifetimeSweeps });
    setSweepBurst(true);
    setTimeout(() => setSweepBurst(false), 1300);
  };

  const canSweep = state.drops >= SWEEP_THRESHOLD;
  const sweepPct = Math.min(100, (state.drops / SWEEP_THRESHOLD) * 100);

  return (
    <div className="flex flex-col gap-5">
      <div className="relative flex justify-center">
        <div className="w-36 h-36 relative">
          <WaterWheelSVG spinning={state.running} />
          <SweepBurst show={sweepBurst} />
        </div>
      </div>

      <div className="text-center">
        <div
          className={`text-4xl font-bold font-serif text-[#2C6A8A] tabular-nums inline-block ${dropTick ? "drop-tick-anim" : ""}`}
          key={state.drops}
        >
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

      {/* Wooden trough progress */}
      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>{state.drops} / {SWEEP_THRESHOLD} drops</span>
          <span className={canSweep ? "text-[#60C4DA] font-semibold" : ""}>
            {canSweep ? "🌊 Ready to sweep!" : `${SWEEP_THRESHOLD - state.drops} more to go`}
          </span>
        </div>
        <WoodenTroughProgress pct={sweepPct} canSweep={canSweep} />
      </div>

      {/* Bucket goal */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
          Your Bucket (Goal)
        </div>
        {editingBucket ? (
          <div className="flex flex-wrap gap-1.5">
            {BUCKET_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => { persist({ ...state, bucket: opt }, { bucket: opt }); setEditingBucket(false); }}
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

      <div className="flex gap-2">
        <button
          onClick={toggleRunning}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            state.running
              ? "bg-muted text-muted-foreground hover:bg-muted/80"
              : "bg-[#2C4A36] text-white hover:opacity-90"
          }`}
        >
          {state.running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start Earning</>}
        </button>
        <button
          onClick={sweep}
          disabled={!canSweep}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm border transition-all ${
            canSweep
              ? "bg-[#D9A066] text-white border-[#D9A066] hover:opacity-90 shadow-md"
              : "border-border text-muted-foreground opacity-50 cursor-not-allowed"
          }`}
          style={canSweep ? { animation: "sweep-pulse 2s ease-in-out infinite" } : undefined}
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

// ─── Transformation trail panel ───────────────────────────────────────────────

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
            style={{ borderColor: t.color + "33", background: t.color + "0A" }}
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

// ─── Wisdom Dig inline panel ─────────────────────────────────────────────────

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
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />)}
        </div>
      ) : gems.length === 0 ? (
        <p className="text-white/50 text-sm text-center py-4">No gems yet — open the dig to start mining.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {gems.map((gem) => {
            const isAnchored = anchored.has(gem.id);
            return (
              <div key={gem.id} className="rounded-xl border border-white/10 bg-white/5 p-3 flex flex-col gap-2">
                <p className="font-serif text-sm leading-relaxed text-white/85 italic line-clamp-3">
                  &ldquo;{gem.gemText}&rdquo;
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

// ─── Wishing Well inline panel ────────────────────────────────────────────────

interface InlineWish {
  id: number;
  amountUnits: number;
  wishText: string;
  listenerName: string | null;
  stackCount: number;
  founderMatchTriggered: boolean;
}
interface InlinePot { totalUnits: number; tipCount: number; drawn: boolean; }

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
async function submitMiniTip(data: { amountUnits: number; wishText: string; listenerName: string; currency: string }): Promise<unknown> {
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
  const { data: pot } = useQuery({ queryKey: ["stomping-ww-pot"], queryFn: fetchInlinePot, staleTime: 30_000 });
  const { data: wishes = [] } = useQuery({ queryKey: ["stomping-ww-wishes"], queryFn: fetchInlineWishes, staleTime: 30_000 });
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
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#B5853A]/15 border border-[#D9A066]/25">
        <Coins className="w-5 h-5 text-[#D9A066] shrink-0" />
        <div>
          <div className="text-lg font-bold text-white font-serif leading-none">
            {pot != null ? pot.totalUnits : "—"}
            <span className="text-sm font-sans font-normal text-white/60 ml-1.5">coins in pot</span>
          </div>
          <div className="text-[10px] text-white/50 mt-0.5">
            {pot ? `${pot.tipCount} wish${pot.tipCount !== 1 ? "es" : ""} today${pot.drawn ? " · Draw complete" : ""}` : "Loading…"}
          </div>
        </div>
      </div>
      {submitted ? (
        <div className="rounded-xl border border-[#2C4A36]/40 bg-[#2C4A36]/15 p-4 text-center">
          <div className="text-2xl mb-1">🪙</div>
          <p className="text-white/80 text-sm font-serif">Your coin is in the well!</p>
          <button
            onClick={() => { setSubmitted(false); setWishText(""); setListenerName(""); }}
            className="mt-2 text-xs text-white/40 hover:text-white/70 underline"
          >
            Toss another
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <input
            type="text" value={listenerName} onChange={(e) => setListenerName(e.target.value)}
            placeholder="Your name (optional)" maxLength={80}
            className="w-full rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#D9A066]"
          />
          <textarea
            value={wishText} onChange={(e) => setWishText(e.target.value)}
            placeholder="Make a wish…" maxLength={280} rows={2}
            className="w-full rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:ring-1 focus:ring-[#D9A066]"
          />
          {tipMut.isError && (
            <p className="text-xs text-red-400">
              {tipMut.error instanceof Error ? tipMut.error.message : "Something went wrong"}
            </p>
          )}
          <button
            onClick={() => tipMut.mutate({ amountUnits: 1, wishText, listenerName, currency: "BTC" })}
            disabled={!wishText.trim() || wishText.trim().length < 3 || tipMut.isPending}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#B5853A] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            🪙 {tipMut.isPending ? "Tossing…" : "Toss a Coin"}
          </button>
        </div>
      )}
      {topWishes.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
            <Layers className="w-3 h-3" /> Today&rsquo;s Wishes
          </div>
          {topWishes.map((wish) => (
            <div key={wish.id} className={`rounded-lg border p-2.5 text-xs ${wish.founderMatchTriggered ? "border-[#D9A066]/40 bg-[#D9A066]/8" : "border-white/10 bg-white/4"}`}>
              <p className="font-serif text-white/80 italic line-clamp-2 mb-1">&ldquo;{wish.wishText}&rdquo;</p>
              <div className="flex items-center gap-1.5 text-white/40 flex-wrap">
                <span>🪙 {wish.amountUnits}</span>
                {wish.listenerName && <><span>·</span><span>{wish.listenerName}</span></>}
                {wish.stackCount > 0 && <><span>·</span><span>{wish.stackCount} stacks</span></>}
                {wish.founderMatchTriggered && <span className="text-[#D9A066] font-semibold">⚡ Matched</span>}
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

// ─── Fireside Chats inline panel ─────────────────────────────────────────────

interface InlineFlame {
  id: number;
  title: string;
  fanCount: number;
  authorName: string | null;
  createdAt: string;
}

async function fetchHotFlames(): Promise<InlineFlame[]> {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const res = await fetch(`${base}/api/fireside-flames?sort=hot&limit=3`);
  if (!res.ok) return [];
  const data: { flames: InlineFlame[] } = await res.json();
  return data.flames;
}

async function fanFlameInline(
  flameId: number,
  sessionId: string,
): Promise<{ fanCount: number; alreadyFanned: boolean }> {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const res = await fetch(`${base}/api/fireside-flames/${flameId}/fan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({})) as { alreadyFanned?: boolean };
    if (j.alreadyFanned) return { fanCount: 0, alreadyFanned: true };
    return { fanCount: 0, alreadyFanned: false };
  }
  return res.json();
}

function getOrCreateFiresideSessionId(): string {
  let id = sessionStorage.getItem("fc_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("fc_session_id", id);
  }
  return id;
}

function FiresideChatsInlinePanel() {
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [fanned, setFanned] = useState<Set<number>>(new Set());

  const { data: flames = [], isLoading } = useQuery({
    queryKey: ["fireside-flames-preview"],
    queryFn: fetchHotFlames,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const fanMut = useMutation({
    mutationFn: ({ id }: { id: number }) =>
      fanFlameInline(id, getOrCreateFiresideSessionId()),
    onSuccess: (_d, { id }) => {
      setFanned((prev) => new Set(prev).add(id));
      qc.invalidateQueries({ queryKey: ["fireside-flames-preview"] });
    },
  });

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: "rgba(232,90,42,0.1)" }} />
          ))}
        </div>
      ) : flames.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: "rgba(255,200,130,0.5)" }}>
          No flames yet — be the first to spark a discussion.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {flames.map((flame) => {
            const isFanned = fanned.has(flame.id);
            return (
              <div
                key={flame.id}
                className="rounded-xl p-3 flex flex-col gap-2"
                style={{
                  background: "rgba(232,90,42,0.08)",
                  border: "1px solid rgba(232,90,42,0.2)",
                }}
              >
                <p
                  className="text-sm font-semibold leading-snug line-clamp-2"
                  style={{ color: "#FFD580", fontFamily: "Georgia, serif" }}
                >
                  {flame.title}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px]" style={{ color: "rgba(255,200,130,0.4)" }}>
                    {flame.authorName ? flame.authorName : "Anonymous"}
                    {flame.fanCount > 0 && (
                      <span style={{ color: "#E85A2A" }}> · 🔥 {flame.fanCount}</span>
                    )}
                  </span>
                  <button
                    onClick={() => !isFanned && fanMut.mutate({ id: flame.id })}
                    disabled={isFanned}
                    className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 transition-all"
                    style={{
                      background: isFanned ? "rgba(232,90,42,0.3)" : "transparent",
                      color: isFanned ? "#FF8C42" : "rgba(255,140,66,0.6)",
                      borderColor: isFanned ? "rgba(232,90,42,0.5)" : "rgba(232,90,42,0.25)",
                      cursor: isFanned ? "default" : "pointer",
                    }}
                  >
                    🔥 {isFanned ? "Fanned" : "Fan"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => navigate("/stomping-grounds?tab=chats")}
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: "linear-gradient(135deg, rgba(192,64,16,0.7) 0%, rgba(138,40,0,0.7) 100%)",
          color: "#FFD580",
          border: "1.5px solid rgba(232,90,42,0.4)",
        }}
      >
        🔥 Join the fire <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Station content router ───────────────────────────────────────────────────

export type StationId = "wisdom-dig" | "wishing-well" | "transform" | "water-wheel" | "campfire";

export function StationContent({
  stationId,
  transformations,
}: {
  stationId: StationId;
  transformations: Transformation[];
}) {
  if (stationId === "wisdom-dig") return <WisdomDigInlinePanel />;
  if (stationId === "wishing-well") return <WishingWellInlinePanel />;
  if (stationId === "transform") {
    if (transformations.length === 0)
      return <div className="text-white/50 text-sm">Loading transformation paths…</div>;
    return <TransformTrailPanel transformations={transformations} />;
  }
  if (stationId === "water-wheel") return <WaterWheelPanel />;
  if (stationId === "campfire") return <FiresideChatsInlinePanel />;
  return null;
}

// ─── Front Porch empty state ──────────────────────────────────────────────────

const STATION_TEASERS: Record<string, { headline: string; teaser: string }> = {
  "wisdom-dig":   { headline: "Wisdom Dig",         teaser: "Unearth key phrases and gems from 6,000+ episodes." },
  "wishing-well": { headline: "Wishing Well",        teaser: "Toss a coin, make a wish, build community momentum." },
  "transform":    { headline: "Transformation Trail", teaser: "Six paths of change — find the one that fits your life." },
  "water-wheel":  { headline: "Water Wheel",          teaser: "Let your drops accumulate and sweep them to your bucket." },
  "campfire":     { headline: "Fireside Chats",       teaser: "Community flames sparked by Fireside Freedom episodes. Fan the fire." },
};

function WoodenSignSVG() {
  return (
    <svg viewBox="0 0 200 90" className="w-full max-w-[220px]" aria-hidden="true">
      {/* Post left */}
      <rect x="30" y="55" width="8" height="32" rx="4" fill="#6A4828" />
      {/* Post right */}
      <rect x="162" y="55" width="8" height="32" rx="4" fill="#6A4828" />
      {/* Sign board shadow */}
      <rect x="12" y="18" width="176" height="48" rx="6" fill="#2C1A08" opacity="0.3" transform="translate(2 3)" />
      {/* Sign board */}
      <rect x="12" y="14" width="176" height="48" rx="6" fill="#8A6A40" />
      <rect x="12" y="14" width="176" height="5" rx="3" fill="#AA8A58" opacity="0.5" />
      {/* Wood grain lines */}
      {[22, 32, 42, 50, 55].map((y) => (
        <line key={y} x1="16" y1={y} x2="184" y2={y} stroke="#6A4A28" strokeWidth="0.8" opacity="0.3" />
      ))}
      {/* Left decorative notch */}
      <polygon points="12,38 2,32 2,44" fill="#7A5A38" />
      {/* Right decorative notch */}
      <polygon points="188,38 198,32 198,44" fill="#7A5A38" />
      {/* Nail dots */}
      <circle cx="22" cy="22" r="3" fill="#3A2010" />
      <circle cx="178" cy="22" r="3" fill="#3A2010" />
      <circle cx="22" cy="54" r="3" fill="#3A2010" />
      <circle cx="178" cy="54" r="3" fill="#3A2010" />
      {/* Main text area — engraved look */}
      <rect x="20" y="22" width="160" height="34" rx="3" fill="#7A5A38" opacity="0.3" />
      {/* Engraved text lines (implied) */}
      <rect x="55" y="28" width="90" height="5" rx="2.5" fill="#5A3A18" opacity="0.5" />
      <rect x="65" y="37" width="70" height="4" rx="2" fill="#5A3A18" opacity="0.35" />
      <rect x="75" y="45" width="50" height="3.5" rx="1.75" fill="#5A3A18" opacity="0.25" />
    </svg>
  );
}

function FrontPorchEmptyState({
  stations,
  onSelect,
}: {
  stations: StationConfig[];
  onSelect: (id: StationId) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#8A6038]/40 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #2A3C26 0%, #243428 60%, #1E2E22 100%)" }}
    >
      {/* Illustrated wooden sign */}
      <div className="flex justify-center pt-6 pb-2 px-4">
        <WoodenSignSVG />
      </div>

      {/* Welcome copy */}
      <div className="px-5 pb-4 text-center">
        <h3 className="font-serif text-base font-bold text-white/90 mb-1.5">
          Welcome to the Grounds
        </h3>
        <p className="text-white/55 text-xs leading-relaxed">
          Five stations, each with its own story. Dig for wisdom, make a wish,
          find your path, or set the wheel turning.
        </p>
      </div>

      {/* Station plaque cards */}
      <div className="grid grid-cols-2 gap-2.5 px-4 pb-5">
        {stations.map((s) => {
          const teaser = STATION_TEASERS[s.id];
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id as StationId)}
              className="flex flex-col items-start gap-1.5 p-3 rounded-xl text-left transition-all duration-200 hover:-translate-y-1 group"
              style={{
                background: `linear-gradient(160deg, ${s.color}22 0%, ${s.color}10 100%)`,
                border: `1.5px solid ${s.glowColor}30`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 18px rgba(0,0,0,0.35), 0 0 12px ${s.glowColor}22`;
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${s.glowColor}55`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${s.glowColor}30`;
              }}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-xl leading-none">{s.icon}</span>
                {s.badge != null && (
                  <span
                    className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: s.color }}
                  >
                    {s.badge}
                  </span>
                )}
              </div>
              <div
                className="text-[11px] font-bold leading-tight"
                style={{ color: s.glowColor, fontFamily: "Georgia, serif" }}
              >
                {teaser?.headline ?? s.label}
              </div>
              <p className="text-[10px] text-white/50 leading-tight line-clamp-2">
                {teaser?.teaser ?? s.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Station header texture + iron latch ────────────────────────────────────

const HEADER_TEXTURES: Record<string, string> = {
  "wisdom-dig":
    "radial-gradient(ellipse at 20% 50%, #2C4A3622 0%, transparent 50%), " +
    "repeating-linear-gradient(125deg, transparent 0px, transparent 10px, rgba(74,154,90,0.06) 10px, rgba(74,154,90,0.06) 11px)",
  "wishing-well":
    "radial-gradient(circle at 50% 50%, #2C6A8A18 0%, transparent 60%), " +
    "radial-gradient(circle at 50% 50%, #2C6A8A0A 30%, transparent 80%)",
  "transform":
    "repeating-linear-gradient(100deg, transparent 0px, transparent 8px, rgba(74,122,58,0.07) 8px, rgba(74,122,58,0.07) 9px), " +
    "radial-gradient(ellipse at 80% 20%, #4A7A3A15 0%, transparent 50%)",
  "water-wheel":
    "repeating-linear-gradient(95deg, transparent 0px, transparent 6px, rgba(44,106,138,0.08) 6px, rgba(44,106,138,0.08) 7px), " +
    "repeating-linear-gradient(5deg, transparent 0px, transparent 18px, rgba(0,0,0,0.05) 18px, rgba(0,0,0,0.05) 19px)",
};

function IronLatchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:bg-white/10 group"
      aria-label="Close panel"
      style={{ border: "1px solid rgba(255,255,255,0.12)" }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        {/* Latch pivot */}
        <circle cx="9" cy="9" r="2.5" fill="#8A7060" stroke="#C0A080" strokeWidth="1" />
        {/* Latch bar horizontal */}
        <rect x="5" y="8" width="8" height="2" rx="1" fill="#8A7060"
          className="group-hover:fill-[#C0A080] transition-colors"
        />
        {/* Latch bar vertical */}
        <rect x="8" y="4" width="2" height="10" rx="1" fill="#6A5040"
          className="group-hover:fill-[#9A8060] transition-colors"
          transform="rotate(-45 9 9)"
        />
        {/* Rivet */}
        <circle cx="9" cy="9" r="1.2" fill="#C0A080" />
      </svg>
    </button>
  );
}

// ─── Gord idle perch ──────────────────────────────────────────────────────────

function GordIdlePerch({ mapContainerRef }: { mapContainerRef: React.RefObject<HTMLDivElement> }) {
  const [phase, setPhase] = useState<"hidden" | "flying-in" | "perching" | "flying-out">("hidden");
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (phaseRef.current !== "hidden") return;
    idleTimerRef.current = setTimeout(() => {
      setPhase("flying-in");
      setTimeout(() => setPhase("perching"), 1200);
      setTimeout(() => setPhase("flying-out"), 4500);
      setTimeout(() => setPhase("hidden"), 5800);
    }, 12000);
  }, []);

  useEffect(() => {
    resetIdleTimer();
    const onActivity = () => {
      if (phaseRef.current === "hidden") resetIdleTimer();
    };
    window.addEventListener("mousemove", onActivity, { passive: true });
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity, { passive: true });
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, [resetIdleTimer]);

  return (
    <AnimatePresence>
      {(phase === "flying-in" || phase === "perching" || phase === "flying-out") && (
        <motion.div
          key="gord-idle"
          className="absolute pointer-events-none z-20"
          style={{ top: "12%", right: 0 }}
          initial={{ x: 80, opacity: 0 }}
          animate={
            phase === "flying-in"
              ? { x: 80, opacity: 1 }
              : phase === "perching"
              ? { x: 0, opacity: 1 }
              : { x: 80, opacity: 0 }
          }
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            style={{
              animation: phase === "perching" ? "grounds-float 2.5s ease-in-out infinite" : undefined,
            }}
          >
            <img src={GORD_IMG} alt="Gord" style={{ width: 52, height: 52, objectFit: "contain" }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Parallax hook ────────────────────────────────────────────────────────────

function useParallax(containerRef: React.RefObject<HTMLDivElement>, maxOffset = 7) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setOffset({ x: nx * maxOffset, y: ny * maxOffset });
    };
    const onLeave = () => setOffset({ x: 0, y: 0 });
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [containerRef, maxOffset]);

  return offset;
}

// ─── Scene background ─────────────────────────────────────────────────────────

export function SceneBackground() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <img
      src={`${base}/homestead-map.png`}
      alt=""
      className="absolute inset-0 w-full h-full object-cover"
      aria-hidden="true"
      draggable={false}
    />
  );
}

// ─── Mobile station door ──────────────────────────────────────────────────────

function TrailConnector() {
  return (
    <div className="flex justify-center h-5 relative my-0.5">
      <svg width="24" height="20" viewBox="0 0 24 20" aria-hidden="true">
        <line x1="12" y1="0" x2="12" y2="20" stroke="#7A5A38" strokeWidth="1.5" strokeDasharray="3,2" />
        <circle cx="12" cy="10" r="2.5" fill="#7A5A38" />
        <circle cx="12" cy="10" r="1.2" fill="#9A7A50" />
      </svg>
    </div>
  );
}

function MobileStationDoor({
  station,
  isOpen,
  onClick,
  transformations,
}: {
  station: StationConfig;
  isOpen: boolean;
  onClick: () => void;
  transformations: Transformation[];
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-lg"
      style={{
        border: `1.5px solid ${station.glowColor}28`,
        background: "linear-gradient(160deg, #243A28 0%, #1E3022 100%)",
      }}
    >
      {/* Door header */}
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-white/5"
        style={{
          background: isOpen
            ? `linear-gradient(90deg, ${station.color}33 0%, ${station.color}18 100%)`
            : `linear-gradient(90deg, ${station.color}18 0%, transparent 100%)`,
          borderBottom: isOpen ? `1px solid ${station.glowColor}20` : "1px solid transparent",
        }}
      >
        {/* Station icon container */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 relative"
          style={{
            background: `linear-gradient(135deg, ${station.glowColor}25 0%, ${station.color}15 100%)`,
            border: `1.5px solid ${station.glowColor}38`,
          }}
        >
          <span className="text-xl leading-none">{station.icon}</span>
          {station.badge != null && (
            <div
              className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full text-[9px] font-bold flex items-center justify-center px-1 text-white"
              style={{ background: station.color }}
            >
              {station.badge}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div
            className="font-bold text-white text-sm"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {station.label}
          </div>
          <div className="text-white/45 text-xs mt-0.5 line-clamp-1">{station.description}</div>
        </div>

        {/* Wrought-iron expand icon */}
        <div
          className="shrink-0 transition-transform duration-300"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <rect x="2" y="2" width="18" height="18" rx="4" fill={station.color + "33"} stroke={station.glowColor + "44"} strokeWidth="1.2" />
            <path d="M7 9 L11 13 L15 9" stroke={station.glowColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {/* Animated content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="door-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-5 pt-4">
              <StationContent stationId={station.id as StationId} transformations={transformations} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Shared scene component ───────────────────────────────────────────────────

export function StompingGroundsScene({ compact = false }: { compact?: boolean }) {
  const [openStation, setOpenStation] = useState<StationId | null>(null);
  const { data: transformations } = useTransformations();
  const { data: gemCount } = useGemCount();
  const { data: pot } = usePotTotal();

  const mapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const parallax = useParallax(mapRef as React.RefObject<HTMLDivElement>);

  const toggle = (id: StationId) => setOpenStation((prev) => (prev === id ? null : id));

  // Load local WW state to see if wheel is running
  const [wwRunning, setWwRunning] = useState(() => loadWWState().running);
  useEffect(() => {
    const interval = setInterval(() => {
      setWwRunning(loadWWState().running);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const stations: StationConfig[] = [
    {
      id: "wisdom-dig",
      icon: "💎",
      label: "Wisdom Dig",
      description: "Mine key phrases and wisdom gems from 6,000+ episodes.",
      badge: gemCount != null ? String(gemCount) : null,
      color: "#2C4A36",
      glowColor: "#4A9A5A",
      position: { top: "54%", left: "15%" },
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
      position: { top: "57%", left: "47%" },
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
      position: { top: "80%", left: "22%" },
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
      position: { top: "66%", left: "73%" },
      mobileOrder: 3,
    },
    {
      id: "campfire",
      icon: "🔥",
      label: "Fireside Chats",
      description: "Community flames sparked by Fireside Freedom episodes.",
      badge: null,
      color: "#8A2800",
      glowColor: "#E85A2A",
      position: { top: "38%", left: "58%" },
      mobileOrder: 4,
    },
  ];

  const currentStation = stations.find((s) => s.id === openStation);

  return (
    <div className="bg-[#1C3020]">
      {compact && (
        <div
          className="border-b border-white/10 px-4 md:px-6 py-3 flex items-center justify-between"
          style={{ background: "linear-gradient(90deg, #1C3020 0%, #2C4A30 100%)" }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg leading-none">🏡</span>
            <span className="font-serif font-bold text-white text-base leading-none">
              The Stomping Grounds
            </span>
            <span className="hidden sm:inline text-white/40 text-xs">
              — your homestead action hub
            </span>
          </div>
          <Link
            href="/stomping-grounds"
            className="text-xs font-semibold text-[#D9A066]/80 hover:text-[#D9A066] transition-colors flex items-center gap-1"
          >
            Full grounds <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* ── Desktop ── */}
      <div className="hidden md:block">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="flex gap-6 items-start">
            {/* Map */}
            <div className="flex-1 min-w-0">
              <div
                ref={mapRef}
                className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                style={{ aspectRatio: "800 / 440" }}
              >
                <SceneBackground />
                <MistLayer parallaxX={parallax.x} />
                <FireflyLayer />

                {stations.map((s) => (
                  <ThematicHotspot
                    key={s.id}
                    station={s}
                    isOpen={openStation === s.id}
                    onClick={() => toggle(s.id as StationId)}
                    parallax={parallax}
                    spinning={s.id === "water-wheel" && wwRunning}
                  />
                ))}

                {!openStation && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/55 text-xs font-medium tracking-wide px-3 py-1.5 rounded-full bg-black/25 backdrop-blur-sm pointer-events-none"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    Click a station to explore
                  </div>
                )}

                {/* Gord idle perch (relative to this container) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <GordIdlePerch mapContainerRef={mapRef as React.RefObject<HTMLDivElement>} />
                </div>
              </div>
            </div>

            {/* Panel */}
            <div className="w-80 shrink-0" ref={panelRef}>
              <AnimatePresence mode="wait">
                {currentStation ? (
                  <motion.div
                    key={currentStation.id}
                    initial={{ x: 18, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 18, opacity: 0 }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    className="rounded-2xl border border-white/10 bg-[#243A28] shadow-xl overflow-hidden"
                  >
                    {/* Panel header with texture */}
                    <div
                      className="px-5 py-4 border-b border-white/10"
                      style={{
                        background: `${currentStation.color}2A`,
                        backgroundImage: HEADER_TEXTURES[currentStation.id],
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl leading-none">{currentStation.icon}</span>
                          <h2
                            className="font-serif text-lg font-bold text-white"
                            style={{
                              textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                            }}
                          >
                            {currentStation.label}
                          </h2>
                        </div>
                        <IronLatchButton onClick={() => setOpenStation(null)} />
                      </div>
                      <p className="text-white/55 text-xs mt-1.5 leading-relaxed">
                        {currentStation.description}
                      </p>
                    </div>

                    <div className="p-5">
                      <StationContent stationId={openStation!} transformations={transformations ?? []} />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="front-porch"
                    initial={{ x: 18, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 18, opacity: 0 }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <FrontPorchEmptyState
                      stations={stations}
                      onSelect={(id) => setOpenStation(id)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile (station doors) ── */}
      <div className="md:hidden container mx-auto px-4 py-6">
        <p
          className="text-white/45 text-xs text-center mb-4"
          style={{ fontFamily: "Georgia, serif", letterSpacing: "0.04em" }}
        >
          Five stations — tap to open
        </p>
        <div className="flex flex-col">
          {[...stations]
            .sort((a, b) => a.mobileOrder - b.mobileOrder)
            .map((s, idx) => (
              <div key={s.id}>
                <MobileStationDoor
                  station={s}
                  isOpen={openStation === s.id}
                  onClick={() => toggle(s.id as StationId)}
                  transformations={transformations ?? []}
                />
                {idx < stations.length - 1 && <TrailConnector />}
              </div>
            ))}
        </div>
        {/* Gord on mobile — small perch below active card */}
        <div className="flex justify-center mt-4">
          <div style={{ animation: "grounds-float 3.5s ease-in-out infinite", opacity: 0.7 }}>
            <img src={GORD_IMG} alt="Gord" style={{ width: 36, height: 36, objectFit: "contain" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
