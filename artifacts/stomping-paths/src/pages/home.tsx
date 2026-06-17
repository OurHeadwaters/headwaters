import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import {
  Compass, Search, ArrowRight, PlayCircle, Footprints,
  Mountain, Sprout, Sun, Cloud, Wind, Flame, Library as LibraryIcon,
  Mic, ChevronRight, Send, CheckCircle2, X, Map as MapIcon, Package,
} from "lucide-react";
import { useGetFeaturedEpisodes, useListZones, useListSuiteCreators, useListSuiteKits } from "@workspace/api-client-react";
import type { SuiteCreator, SuiteKit } from "@workspace/api-client-react";
import { useTransformations } from "@/hooks/use-transformations";
import { useSelectedTransformation } from "@/hooks/use-selected-transformation";
import { useTransformationEpisodes } from "@/hooks/use-transformation-episodes";
import { StompingGroundsScene } from "@/components/stomping-grounds-scene";
import { KIT_META } from "@/hooks/use-kits";
import { useAllActiveTracksState, type ActiveTrackEntry } from "@/hooks/use-track-progress";
import { useListTracks, useGetTrackNextUndone, type TrackSummary } from "@/hooks/use-tracks";

// ─── Daily Stomp (Imprint) local state ────────────────────────────────────────

const IMPRINT_KEY = "tsp-imprint-v1";
const STOMP_KEY_LEGACY = "tsp-daily-stomp-v1";

interface ImprintState {
  date: string;
  completed: boolean;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function readImprint(): ImprintState {
  if (typeof window === "undefined") return { date: todayISO(), completed: false };
  try {
    const raw = localStorage.getItem(IMPRINT_KEY)
      ?? localStorage.getItem(STOMP_KEY_LEGACY);
    if (!raw) return { date: todayISO(), completed: false };
    const parsed = JSON.parse(raw) as ImprintState & { streak?: number };
    if (parsed.date !== todayISO()) {
      return { date: todayISO(), completed: false };
    }
    return { date: parsed.date, completed: parsed.completed };
  } catch { return { date: todayISO(), completed: false }; }
}

function writeImprint(s: ImprintState) {
  try { localStorage.setItem(IMPRINT_KEY, JSON.stringify(s)); } catch {}
}

// ─── Custom Cursor (subtle glowing orb) ────────────────────────────────────────

function GlowCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { damping: 24, stiffness: 220, mass: 0.3 });
  const sy = useSpring(y, { damping: 24, stiffness: 220, mass: 0.3 });

  useEffect(() => {
    const handle = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      className="hidden md:block fixed pointer-events-none z-[100] mix-blend-screen"
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
    >
      <div className="w-8 h-8 rounded-full bg-[#D9A066]/30 blur-md" />
      <div className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-[#D9A066] shadow-[0_0_12px_4px_rgba(217,160,102,0.7)]" />
    </motion.div>
  );
}

// ─── Particle field (drifting dust / sparks / leaves) ──────────────────────────

function ParticleField({ count = 24, color = "#D9A066" }: { count?: number; color?: string }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 12,
        duration: 10 + Math.random() * 14,
        size: 2 + Math.random() * 4,
        drift: (Math.random() - 0.5) * 80,
      })),
    [count]
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full opacity-0 animate-tsp-float"
          style={{
            left: `${p.left}%`,
            bottom: `-20px`,
            width: p.size,
            height: p.size,
            background: color,
            boxShadow: `0 0 ${p.size * 3}px ${color}`,
            // @ts-expect-error custom prop
            "--drift": `${p.drift}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Vine path progress (left rail that grows as you scroll) ───────────────────

function VineProgress() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { damping: 30, stiffness: 90 });

  return (
    <div className="hidden lg:block fixed left-6 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
      <div className="relative h-[55vh] w-[3px] rounded-full bg-white/8">
        <motion.div
          className="absolute inset-x-0 top-0 origin-top rounded-full bg-gradient-to-b from-[#D9A066] via-[#A64B36] to-[#2C4A36]"
          style={{ height: "100%", scaleY }}
        />
        {/* Vine leaves */}
        {[0.15, 0.35, 0.55, 0.78].map((t, i) => (
          <motion.div
            key={i}
            className="absolute -left-2 w-4 h-4"
            style={{ top: `${t * 100}%` }}
            initial={{ scale: 0, rotate: -20 }}
            whileInView={{ scale: 1, rotate: i % 2 === 0 ? 0 : 12 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 200 }}
          >
            <Sprout className="w-4 h-4 text-[#7FA77F]" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Daily Stomp orb (floating, fixed bottom-right) ────────────────────────────

const STOMP_PROMPTS = [
  "Name one thing you'll do today that nobody can take from you.",
  "What system did you rely on this week that you could replace with a skill?",
  "Which Zone in your life needs the most stomping this week — 0, 1, or further out?",
  "Pick one. Plant something, fix something, or learn something. Which is it today?",
  "Whose permission have you stopped waiting for? Whose are you still waiting on?",
];

function DailyStompOrb() {
  const [open, setOpen] = useState(false);
  const [imprint, setImprint] = useState<ImprintState>(() => ({ date: todayISO(), completed: false }));
  const [response, setResponse] = useState("");
  const prompt = useMemo(() => {
    const day = new Date().getDate();
    return STOMP_PROMPTS[day % STOMP_PROMPTS.length];
  }, []);

  useEffect(() => { setImprint(readImprint()); }, []);

  function complete() {
    setImprint((prev) => {
      if (prev.completed) return prev;
      const next: ImprintState = { date: todayISO(), completed: true };
      writeImprint(next);
      window.dispatchEvent(new CustomEvent("StompOn"));
      return next;
    });
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        aria-label="Open today's Daily Stomp"
        className="fixed bottom-6 right-6 z-40 group"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, type: "spring" }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="absolute inset-0 rounded-full bg-[#D9A066]/40 animate-tsp-pulse-ring" />
        <span className="absolute inset-0 rounded-full bg-[#D9A066]/20 animate-tsp-pulse-ring" style={{ animationDelay: "0.7s" }} />
        <span className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#D9A066] to-[#A64B36] shadow-[0_8px_30px_rgba(217,160,102,0.5)] border-2 border-[#FDFBF7]/90">
          {imprint.completed
            ? <CheckCircle2 className="w-7 h-7 text-[#FDFBF7]" />
            : <Footprints className="w-7 h-7 text-[#FDFBF7] group-hover:rotate-12 transition-transform" />}
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="relative w-full max-w-md bg-gradient-to-b from-[#1c2e22] to-[#2C4A36] rounded-2xl border border-[#D9A066]/30 shadow-2xl overflow-hidden"
              initial={{ y: 80, scale: 0.9, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 80, scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 22 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ParticleField count={14} />
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative p-7">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A066] mb-3">
                  <Footprints className="w-3.5 h-3.5" />
                  Today's Stomp
                </div>
                <h3 className="font-serif text-2xl text-white leading-snug mb-4">{prompt}</h3>

                {!imprint.completed ? (
                  <>
                    <textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="One sentence is enough. Nobody but you will see this."
                      rows={3}
                      className="w-full bg-black/30 border border-white/15 text-white placeholder-white/30 rounded-lg p-3 text-sm focus:outline-none focus:border-[#D9A066]/60 transition-colors"
                    />
                    <button
                      onClick={complete}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-[#2C4A36] bg-gradient-to-r from-[#D9A066] to-[#e8b06b] hover:from-[#e0a972] hover:to-[#f1bb78] transition-all shadow-lg shadow-[#D9A066]/20"
                    >
                      <Footprints className="w-4 h-4" />
                      Stomp it
                    </button>
                  </>
                ) : (
                  <div className="text-center py-2">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#D9A066]/15 border border-[#D9A066]/40 mb-3">
                      <CheckCircle2 className="w-7 h-7 text-[#D9A066]" />
                    </div>
                    <p className="text-white font-serif text-lg">Stomped. Come back tomorrow.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Scroll-triggered boot-stomp particles ─────────────────────────────────────

const SCROLL_FOOTPRINTS = [
  { x: 492, y: 374, rot: -15, opacity: 0.50, threshold: 80  },
  { x: 460, y: 346, rot:  12, opacity: 0.45, threshold: 150 },
  { x: 486, y: 308, rot: -10, opacity: 0.55, threshold: 220 },
  { x: 518, y: 278, rot:  15, opacity: 0.40, threshold: 290 },
  { x: 487, y: 238, rot: -12, opacity: 0.50, threshold: 360 },
  { x: 460, y: 198, rot:  10, opacity: 0.45, threshold: 420 },
  { x: 498, y: 158, rot: -15, opacity: 0.55, threshold: 480 },
  { x: 518, y: 118, rot:  12, opacity: 0.40, threshold: 540 },
  { x: 505, y:  78, rot:  -8, opacity: 0.50, threshold: 600 },
];

function ScrollStompParticles() {
  const { scrollY } = useScroll();
  const [active, setActive] = useState<Set<number>>(new Set());

  useEffect(() => {
    const unsub = scrollY.on("change", (y) => {
      setActive((prev) => {
        let changed = false;
        const next = new Set(prev);
        SCROLL_FOOTPRINTS.forEach((fp, i) => {
          if (y >= fp.threshold && !next.has(i)) { next.add(i); changed = true; }
        });
        return changed ? next : prev;
      });
    });
    return unsub;
  }, [scrollY]);

  if (active.size === 0) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none z-[4]">
      <svg viewBox="0 0 1000 400" preserveAspectRatio="xMidYMax slice" className="w-full h-full">
        {SCROLL_FOOTPRINTS.map((fp, i) =>
          active.has(i) ? (
            <ellipse
              key={i}
              cx={fp.x}
              cy={fp.y}
              rx={6}
              ry={9}
              fill="#D4621A"
              className="scroll-stomp-particle"
              style={{
                "--stomp-rot": `${fp.rot}deg`,
                "--stomp-max-opacity": String(fp.opacity),
                filter: "drop-shadow(0 0 6px rgba(212,98,26,0.7))",
              } as React.CSSProperties}
            />
          ) : null
        )}
      </svg>
    </div>
  );
}

// ─── HERO — The Path Entrance ──────────────────────────────────────────────────

function HeroEntrance() {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yMountains = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const yMid = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const yFog = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const headlineY = useTransform(scrollYProgress, [0.4, 1], ["0%", "120%"]);
  const headlineOpacity = useTransform(scrollYProgress, [0.55, 0.92], [1, 0]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { damping: 30, stiffness: 100 });
  const smy = useSpring(my, { damping: 30, stiffness: 100 });
  const mtnsX = useTransform(smx, (v) => v * 0.3);
  const treesX = useTransform(smx, (v) => v * 0.6);

  function handleMouseMove(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    mx.set(px * 30);
    my.set(py * 18);
  }

  // Glowing footprints along the path — staggered animation
  const footprints = Array.from({ length: 9 }, (_, i) => i);

  return (
    <section
      ref={ref}
      onMouseMove={handleMouseMove}
      className="relative h-[90vh] min-h-[680px] sm:h-[78vh] sm:min-h-[560px] w-full overflow-hidden bg-[#0c1611]"
      style={{ background: "radial-gradient(ellipse at 50% 100%, #2C4A36 0%, #15241b 55%, #0c1611 100%)" }}
    >
      {/* Sky gradient + sun */}
      <motion.div
        className="absolute inset-x-0 top-0 h-2/3 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 70% 30%, rgba(217,160,102,0.35) 0%, rgba(217,160,102,0.08) 30%, transparent 60%)",
          x: smx, y: smy,
        }}
      />

      {/* Distant mountain silhouette */}
      <motion.svg
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-1/3 w-full h-[35vh] pointer-events-none"
        style={{ y: yMountains, x: mtnsX }}
      >
        <defs>
          <linearGradient id="mtn-far" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1f3128" />
            <stop offset="100%" stopColor="#15241b" />
          </linearGradient>
        </defs>
        <path
          d="M0,400 L0,260 L120,180 L240,220 L360,140 L520,200 L680,120 L840,180 L1000,160 L1160,200 L1320,150 L1440,200 L1440,400 Z"
          fill="url(#mtn-far)"
        />
      </motion.svg>

      {/* Mid-range trees silhouette */}
      <motion.svg
        viewBox="0 0 1440 300"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-[18%] w-full h-[28vh] pointer-events-none"
        style={{ y: yMid, x: treesX }}
      >
        <defs>
          <linearGradient id="mtn-mid" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1a2c20" />
            <stop offset="100%" stopColor="#0c1611" />
          </linearGradient>
        </defs>
        {/* Tree silhouettes */}
        {Array.from({ length: 18 }).map((_, i) => {
          const x = (i / 17) * 1440;
          const h = 80 + (Math.sin(i * 1.7) + 1) * 60;
          return (
            <path
              key={i}
              d={`M${x - 18},300 L${x},${300 - h} L${x + 18},300 Z`}
              fill="url(#mtn-mid)"
            />
          );
        })}
      </motion.svg>

      {/* Crypto Castle SVG silhouette — torchlit fortress */}
      <motion.div
        className="absolute inset-x-0 bottom-[18%] flex justify-center pointer-events-none"
        style={{ y: yMid, x: treesX }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, delay: 0.3, ease: "easeOut" }}
      >
        <svg
          viewBox="0 0 800 260"
          className="w-full max-w-3xl h-auto"
          aria-hidden="true"
          style={{ filter: "drop-shadow(0 0 24px rgba(212,98,26,0.22))" }}
        >
          <defs>
            <linearGradient id="castle-body" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#1a2c20" />
              <stop offset="100%" stopColor="#0c1611" />
            </linearGradient>
            <radialGradient id="torch-glow-L" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D4621A" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#D4621A" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="torch-glow-R" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D4621A" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#D4621A" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="xrpl-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00BFDF" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#00BFDF" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ambient glow pools behind castle */}
          <ellipse cx="400" cy="200" rx="280" ry="60" fill="url(#torch-glow-L)" opacity="0.5" />

          {/* === Left flanking tower === */}
          <rect x="120" y="120" width="70" height="140" fill="url(#castle-body)" />
          {[120, 140, 160, 180].map((x, i) => (
            <rect key={i} x={x} y={100} width={14} height={24} fill="url(#castle-body)" />
          ))}
          <rect x="147" y="150" width="16" height="22" rx="2" fill="#0c1611" />
          <ellipse cx="155" cy="150" rx="8" ry="3" fill="#0c1611" />

          {/* === Right flanking tower === */}
          <rect x="610" y="120" width="70" height="140" fill="url(#castle-body)" />
          {[610, 630, 650, 670].map((x, i) => (
            <rect key={i} x={x} y={100} width={14} height={24} fill="url(#castle-body)" />
          ))}
          <rect x="637" y="150" width="16" height="22" rx="2" fill="#0c1611" />
          <ellipse cx="645" cy="150" rx="8" ry="3" fill="#0c1611" />

          {/* === Curtain walls === */}
          <rect x="190" y="155" width="170" height="105" fill="url(#castle-body)" />
          <rect x="440" y="155" width="170" height="105" fill="url(#castle-body)" />
          {[190, 215, 240, 265, 290, 315, 340].map((x, i) => (
            <rect key={i} x={x} y={138} width={18} height={20} fill="url(#castle-body)" />
          ))}
          {[440, 465, 490, 515, 540, 565, 590].map((x, i) => (
            <rect key={i} x={x} y={138} width={18} height={20} fill="url(#castle-body)" />
          ))}

          {/* === Central keep — tallest === */}
          <rect x="270" y="60" width="260" height="200" fill="url(#castle-body)" />
          {[270, 300, 330, 360, 390, 420, 450, 480].map((x, i) => (
            <rect key={i} x={x} y={38} width={22} height={26} fill="url(#castle-body)" />
          ))}

          {/* Gate arch */}
          <rect x="362" y="178" width="76" height="82" fill="#0c1611" />
          <ellipse cx="400" cy="178" rx="38" ry="18" fill="#0c1611" />

          {/* Keep windows */}
          <rect x="310" y="110" width="22" height="32" rx="3" fill="#0c1611" />
          <ellipse cx="321" cy="110" rx="11" ry="5" fill="#0c1611" />
          <rect x="468" y="110" width="22" height="32" rx="3" fill="#0c1611" />
          <ellipse cx="479" cy="110" rx="11" ry="5" fill="#0c1611" />

          {/* Center window with XRPL glow */}
          <rect x="382" y="85" width="36" height="52" rx="4" fill="#0a120e" />
          <ellipse cx="400" cy="85" rx="18" ry="7" fill="#0a120e" />
          <ellipse cx="400" cy="100" rx="14" ry="18" fill="url(#xrpl-glow)" />
        </svg>
      </motion.div>

      {/* Fog layer */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[30%] pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(12,22,17,0.95) 0%, transparent 100%)",
          y: yFog,
        }}
      />

      {/* Glowing footprints SVG */}
      <ScrollStompParticles />

      {/* Headline */}
      <motion.div
        className="absolute inset-x-0 bottom-16 flex flex-col items-center text-center px-6 pointer-events-none"
        style={{ y: headlineY, opacity: headlineOpacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D9A066]/30 bg-[#D9A066]/10 mb-5">
            <Footprints className="w-3.5 h-3.5 text-[#D9A066]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D9A066]">Self-Reliance Since 2008</span>
          </div>
        </motion.div>
        <motion.h1
          className="font-serif text-5xl sm:text-6xl md:text-7xl text-[#FDFBF7] font-bold leading-[1.05] tracking-tight mb-5 max-w-4xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          Stomp your path.<br />
          <span className="italic text-[#D9A066]">Own your life.</span>
        </motion.h1>
        <motion.p
          className="text-[#FDFBF7]/65 text-lg max-w-xl mb-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65 }}
        >
          Seven transformation journeys.<br />Content curated to move you — not just inform you.
        </motion.p>
        <motion.p
          className="text-[#8FA883]/80 text-sm max-w-xl mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
        >
          Built by and for families doing it differently.
        </motion.p>
        <motion.div
          className="flex flex-col sm:flex-row gap-3 pointer-events-auto"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8 }}
        >
          <Link
            href="/episodes"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-[#2C4A36] bg-gradient-to-r from-[#D9A066] to-[#e8b06b] hover:from-[#e0a972] hover:to-[#f1bb78] transition-all shadow-lg shadow-[#D9A066]/30 hover:shadow-[#D9A066]/50 hover:-translate-y-0.5"
          >
            <PlayCircle className="w-5 h-5" />
            Browse the archive
          </Link>
          <Link
            href="/kits/find"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-[#FDFBF7] border border-[#FDFBF7]/25 hover:border-[#D9A066]/60 hover:text-[#D9A066] transition-all backdrop-blur-sm"
          >
            <Compass className="w-5 h-5" />
            Find my kit
          </Link>
        </motion.div>
      </motion.div>

      {/* Bottom fog */}
      <div className="absolute inset-x-0 bottom-0 h-[15%] bg-gradient-to-t from-[#0c1611] to-transparent pointer-events-none" />
    </section>
  );
}

// ─── Continue Learning Widget ──────────────────────────────────────────────────

function ContinueLearningRow({
  entry,
  track,
}: {
  entry: ActiveTrackEntry;
  track: TrackSummary;
}) {
  const { doneIds } = entry;
  const doneCount = doneIds.size;
  const isComplete = track.episodeCount > 0 && doneCount >= track.episodeCount;
  const pct = track.episodeCount > 0 ? Math.min(100, (doneCount / track.episodeCount) * 100) : 0;

  const { data: nextUndone } = useGetTrackNextUndone(
    isComplete ? null : track.slug,
    doneIds,
  );
  const nextEp = nextUndone?.item ?? null;
  const href = nextEp?.slug ? `/episodes/${nextEp.slug}` : `/tracks/${track.slug}`;

  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 px-4 py-3 rounded-xl border border-white/8 bg-white/[0.03] hover:border-[#D9A066]/40 hover:bg-white/[0.06] transition-all"
    >
      <span className="text-2xl leading-none shrink-0">{track.icon}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-sm font-semibold text-[#FDFBF7] truncate leading-tight">
            {track.title}
          </span>
          {isComplete ? (
            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#22c55e]">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Finished
            </span>
          ) : (
            <span className="shrink-0 text-[11px] text-[#FDFBF7]/45 font-medium">
              {doneCount.toLocaleString()} / {track.episodeCount.toLocaleString()}
            </span>
          )}
        </div>

        <div className="h-1 rounded-full bg-white/10 overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: isComplete ? "#22c55e" : track.color,
            }}
          />
        </div>

        {!isComplete && nextEp && (
          <p className="text-[11px] text-[#FDFBF7]/40 truncate leading-tight">
            Next: {nextEp.title}
          </p>
        )}
        {isComplete && (
          <p className="text-[11px] text-[#FDFBF7]/40 leading-tight">
            Review this track
          </p>
        )}
      </div>

      <ArrowRight className="w-4 h-4 text-[#FDFBF7]/25 group-hover:text-[#D9A066] transition-colors shrink-0" />
    </Link>
  );
}

function ContinueLearningSkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-xl p-3 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-[#FDFBF7]/10 shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="h-3 w-2/5 rounded bg-[#FDFBF7]/10" />
        <div className="h-2 w-full rounded bg-[#FDFBF7]/7" />
      </div>
      <div className="w-4 h-4 rounded bg-[#FDFBF7]/10 shrink-0" />
    </div>
  );
}

function ContinueLearningWidget() {
  const { entries: activeEntries, isLoading, serverReturnedEmpty } = useAllActiveTracksState();
  const { data: tracks } = useListTracks();

  const trackMap = tracks ? new Map(tracks.map((t) => [t.slug, t])) : null;
  const rows = trackMap
    ? activeEntries
        .map((entry) => ({ entry, track: trackMap.get(entry.slug) }))
        .filter((r): r is { entry: ActiveTrackEntry; track: TrackSummary } => !!r.track)
    : [];

  const inProgress = rows.filter(
    ({ entry, track }) => entry.doneIds.size < track.episodeCount || track.episodeCount === 0,
  );
  const completed = rows.filter(
    ({ entry, track }) => track.episodeCount > 0 && entry.doneIds.size >= track.episodeCount,
  );
  const ordered = [...inProgress, ...completed];

  // Show skeleton only for returning users (local entries exist) while server sync is in-flight.
  // Brand-new users with no local history should see nothing — not a misleading loading state.
  const showSkeleton = isLoading && activeEntries.length > 0;
  const showContent = !showSkeleton && ordered.length > 0;

  if (serverReturnedEmpty || (!showSkeleton && !showContent)) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="relative bg-[#0c1611] pt-10 pb-0 overflow-hidden"
    >
      <div className="container mx-auto px-4 md:px-6 max-w-2xl">
        <motion.div
          layout
          className="rounded-2xl border border-[#D9A066]/20 bg-[#D9A066]/5 p-5 overflow-hidden"
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Footprints className="w-4 h-4 text-[#D9A066]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D9A066]">
              Continue Learning
            </span>
            <AnimatePresence mode="wait" initial={false}>
              {showSkeleton ? (
                <motion.div
                  key="skeleton-count"
                  className="ml-auto h-2.5 w-20 rounded bg-[#FDFBF7]/10 animate-pulse"
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              ) : (
                <motion.span
                  key="real-count"
                  className="ml-auto text-[11px] text-[#FDFBF7]/35"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {inProgress.length > 0
                    ? `${inProgress.length} track${inProgress.length !== 1 ? "s" : ""} in progress`
                    : "All tracks finished"}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {showSkeleton ? (
              <motion.div
                key="skeleton-rows"
                className="flex flex-col gap-2"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <ContinueLearningSkeletonRow />
                <ContinueLearningSkeletonRow />
              </motion.div>
            ) : (
              <motion.div
                key="real-rows"
                className="flex flex-col gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {ordered.map(({ entry, track }, i) => (
                  <motion.div
                    key={track.slug}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.07 }}
                  >
                    <ContinueLearningRow entry={entry} track={track} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Always reserve footer space; opacity hides it during skeleton so no height jump */}
          <motion.div
            className="mt-4 text-center"
            animate={{ opacity: showSkeleton ? 0 : 1 }}
            transition={{ duration: 0.3, delay: showSkeleton ? 0 : 0.2 }}
          >
            <Link
              href="/tracks"
              className="text-xs text-[#FDFBF7]/35 hover:text-[#D9A066] transition-colors"
              tabIndex={showSkeleton ? -1 : 0}
              aria-hidden={showSkeleton}
            >
              Browse all learning tracks →
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}

// ─── Your Path Rail ────────────────────────────────────────────────────────────

function YourPathRail() {
  const { selectedSlug, clear } = useSelectedTransformation();
  const { data: transformations } = useTransformations();
  const { data: episodesResult, isLoading } = useTransformationEpisodes(selectedSlug, 5);

  const transformation = transformations?.find((t) => t.slug === selectedSlug) ?? null;
  const episodes = episodesResult?.items ?? [];

  if (!selectedSlug || !transformation) return null;

  return (
    <AnimatePresence>
      <motion.section
        key={selectedSlug}
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-gradient-to-b from-[#0c1611] to-[#15241b] border-b border-white/8 py-10 overflow-hidden"
      >
        {/* Subtle ambient glow in the transformation's color */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${transformation.color}18 0%, transparent 65%)`,
          }}
        />

        <div className="relative container mx-auto px-4 md:px-6 max-w-6xl">
          {/* Header row */}
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl leading-none">{transformation.icon}</span>
              <div className="min-w-0">
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5"
                  style={{ color: transformation.color }}
                >
                  For your path
                </div>
                <h2 className="font-serif text-lg sm:text-xl text-[#FDFBF7] font-bold leading-tight truncate">
                  {transformation.from} <span className="text-[#FDFBF7]/40 font-normal">→</span>{" "}
                  <span style={{ color: transformation.color }}>{transformation.to}</span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={`/episodes?transformation=${encodeURIComponent(selectedSlug)}`}
                className="text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:opacity-80 transition-opacity"
                style={{ color: transformation.color }}
              >
                All episodes <ArrowRight className="w-3 h-3" />
              </Link>
              <button
                onClick={clear}
                aria-label="Clear selected path"
                className="p-1.5 rounded-full text-[#FDFBF7]/35 hover:text-[#FDFBF7]/70 hover:bg-white/8 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Episode cards row */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse border border-white/5" />
              ))}
            </div>
          ) : episodes.length === 0 ? (
            <p className="text-sm text-[#FDFBF7]/45">No episodes found for this path yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {episodes.map((ep, i) => (
                <motion.div
                  key={ep.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                >
                  <Link
                    href={`/episodes/${ep.slug}`}
                    className="group flex flex-col h-full rounded-xl overflow-hidden border border-white/8 bg-[#15241b] hover:border-white/20 hover:-translate-y-0.5 transition-all"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-[#0c1611] overflow-hidden">
                      {ep.artworkUrl ? (
                        <img
                          src={ep.artworkUrl}
                          alt={ep.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Mic className="w-8 h-8 text-[#D9A066]/25" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[#FDFBF7] shadow"
                          style={{ background: transformation.color }}
                        >
                          <PlayCircle className="w-4 h-4" />
                        </span>
                        {ep.episodeNumber && (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-white/80 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                            Ep. {ep.episodeNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Text */}
                    <div className="p-3 flex flex-col flex-1">
                      <h3 className="font-serif text-sm text-[#FDFBF7] font-bold leading-snug line-clamp-3 group-hover:text-[#D9A066] transition-colors">
                        {ep.title}
                      </h3>
                      {ep.summary && (
                        <p className="mt-1.5 text-[11px] text-[#FDFBF7]/45 leading-relaxed line-clamp-2">
                          {ep.summary}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.section>
    </AnimatePresence>
  );
}

// ─── Storm to Bloom (zone overview) ────────────────────────────────────────────

function StormToBloomSection() {
  return (
    <section className="relative bg-gradient-to-b from-[#0c1611] to-[#15241b] py-20 md:py-28 overflow-hidden">
      <ParticleField count={10} color="#7FA77F" />
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.9 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#7FA77F]/30 bg-[#7FA77F]/10 mb-5">
            <Mountain className="w-3.5 h-3.5 text-[#7FA77F]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7FA77F]">The Zones</span>
          </div>
          <h2 className="font-serif text-4xl md:text-6xl text-[#FDFBF7] font-bold leading-tight mb-4">
            Start where you are.<br /><span className="italic text-[#D9A066]">Use what you have.</span>
          </h2>
          <p className="text-[#FDFBF7]/60 max-w-2xl mx-auto text-lg">
            Do what you can. Six zones — from your own body and daily habits out to the wider world. Everything in between is territory you can actually change.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { n: 0, label: "Self", icon: Sun, color: "#D9A066", desc: "Health & mindset" },
            { n: 1, label: "Home", icon: Flame, color: "#A64B36", desc: "Family & finance" },
            { n: 2, label: "Homestead", icon: Sprout, color: "#7FA77F", desc: "Food & land" },
            { n: 3, label: "Community", icon: Wind, color: "#5B8A9A", desc: "Local networks" },
            { n: 4, label: "Local", icon: Cloud, color: "#8A6B9A", desc: "Market & trade" },
            { n: 5, label: "Wild", icon: Mountain, color: "#4A7A5A", desc: "Edge & frontier" },
          ].map((zone, i) => (
            <motion.div
              key={zone.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
            >
              <Link href={`/zones/zone-${zone.n}`}>
                <div
                  className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/8 hover:border-white/20 hover:-translate-y-1 transition-all cursor-pointer"
                  style={{ background: `${zone.color}12` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold font-serif text-lg shadow-inner"
                    style={{ background: `${zone.color}25`, color: zone.color }}
                  >
                    {zone.n}
                  </div>
                  <zone.icon className="w-5 h-5" style={{ color: zone.color }} />
                  <div className="text-center">
                    <p className="font-bold text-[#FDFBF7] text-sm">{zone.label}</p>
                    <p className="text-[10px] text-[#FDFBF7]/45 leading-tight mt-0.5">{zone.desc}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-8 text-center"
        >
          <Link
            href="/map"
            className="group inline-flex items-center gap-3 px-7 py-4 rounded-full font-bold text-[#2C4A36] bg-gradient-to-r from-[#D9A066] to-[#e8b06b] hover:from-[#e0a972] hover:to-[#f1bb78] transition-all shadow-lg shadow-[#D9A066]/25 hover:shadow-[#D9A066]/40 hover:-translate-y-0.5"
          >
            <MapIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Explore the Zone Map
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <p className="mt-3 text-sm text-[#FDFBF7]/45">
            See how the zones fit together — and where you stand.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Journey Map Section ────────────────────────────────────────────────────────

function JourneyMapSection() {
  return (
    <section className="relative bg-[#15241b] py-20 md:py-28 overflow-hidden border-y border-white/5">
      <ParticleField count={8} color="#D9A066" />
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D9A066]/30 bg-[#D9A066]/10 mb-5">
              <Compass className="w-3.5 h-3.5 text-[#D9A066]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D9A066]">Your Map</span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl text-[#FDFBF7] font-bold leading-tight mb-5">
              The Stomping Grounds are your territory.
            </h2>
            <p className="text-[#FDFBF7]/60 leading-relaxed mb-6">
              Not a curriculum. Not a course. A living map of the archive — organized by zone, by transformation, and by what you're actually trying to change.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/stomping-grounds"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-[#2C4A36] bg-gradient-to-r from-[#D9A066] to-[#e8b06b] hover:from-[#e0a972] hover:to-[#f1bb78] transition-all"
              >
                Open the Grounds
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/tracks"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-[#FDFBF7] border border-[#FDFBF7]/20 hover:bg-[#FDFBF7]/5 transition-colors"
              >
                Browse learning tracks
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative"
          >
            <StompingGroundsScene />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Curated Creators / Transformation Cards (3D tilt) ─────────────────────────

function TiltCard({ children, accent }: { children: React.ReactNode; accent: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { damping: 20, stiffness: 200 });
  const sry = useSpring(ry, { damping: 20, stiffness: 200 });

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 14);
    rx.set(-py * 14);
  }
  function onLeave() { rx.set(0); ry.set(0); }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 800 }}
      whileHover={{ y: -6 }}
      className="relative rounded-2xl border bg-gradient-to-br from-[#1a2c20] to-[#15241b] p-6 overflow-hidden group"
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `radial-gradient(circle at 50% 0%, ${accent}25 0%, transparent 70%)`, border: `1px solid ${accent}55` }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

function CuratedPathsSection() {
  const { data: transformations } = useTransformations();
  const featured = (transformations ?? []).slice(0, 6);

  return (
    <section id="creators" className="relative bg-[#1a2c20] py-24 md:py-28 overflow-hidden">
      <ParticleField count={14} color="#7FA77F" />
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#7FA77F]/30 bg-[#7FA77F]/10 mb-5">
            <Compass className="w-3.5 h-3.5 text-[#7FA77F]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7FA77F]">Curated Paths</span>
          </div>
          <h2 className="font-serif text-4xl md:text-6xl text-[#FDFBF7] font-bold leading-tight mb-3">
            Name the <span className="italic text-[#D9A066]">transformation.</span>
          </h2>
          <p className="text-[#FDFBF7]/65 max-w-2xl mx-auto">
            Six (now seven) sovereignty arcs. Pick the one that names where you are — episodes follow you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-56 rounded-2xl bg-[#0c1611] animate-pulse border border-white/5" />
              ))
            : featured.map((t) => (
                <Link key={t.slug} href={`/episodes?transformation=${encodeURIComponent(t.slug)}`}>
                  <TiltCard accent={t.color}>
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-4xl leading-none">{t.icon}</span>
                      <span
                        className="text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border"
                        style={{ color: t.color, borderColor: `${t.color}55`, background: `${t.color}15` }}
                      >
                        Sovereignty
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="font-serif text-lg text-[#FDFBF7]/55 line-through decoration-[#A64B36]/40">{t.from}</p>
                      <p className="font-serif text-xl text-[#FDFBF7] font-bold leading-snug">→ {t.to}</p>
                    </div>
                    <p className="mt-4 text-sm text-[#FDFBF7]/55 leading-relaxed line-clamp-2">
                      {t.description}
                    </p>
                    <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: t.color }}>
                      Walk this path
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </TiltCard>
                </Link>
              ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/transform"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-[#FDFBF7] border border-[#FDFBF7]/20 hover:bg-[#FDFBF7]/5 transition-colors"
          >
            See all seven paths <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Your Path, Your Way — Creators + Kit CTA ──────────────────────────────────

function YourPathYourWaySection() {
  const { data: allCreators = [] } = useListSuiteCreators();
  const { data: allKits = [] } = useListSuiteKits();

  const spotlightCreators = useMemo(() => {
    const live = allCreators.filter((c) => c.status === "live");
    return live.length > 0 ? live.slice(0, 3) : allCreators.slice(0, 3);
  }, [allCreators]);

  const featuredKit = useMemo(() => {
    return allKits.find((k) => k.priceType === "direct" && k.priceCents) ?? allKits[0] ?? null;
  }, [allKits]);

  const featuredKitMeta = featuredKit ? (KIT_META[featuredKit.slug] ?? { icon: "📦", color: "#D9A066" }) : null;

  if (spotlightCreators.length === 0 && !featuredKit) return null;

  return (
    <section className="relative bg-[#0c1611] py-24 overflow-hidden border-t border-white/5">
      <ParticleField count={10} color="#8FA883" />
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#8FA883]/30 bg-[#8FA883]/10 mb-5">
            <Compass className="w-3.5 h-3.5 text-[#8FA883]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8FA883]">Your Path, Your Way</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-[#FDFBF7] font-bold leading-tight mb-3">
            Self-directed or <span className="italic text-[#D9A066]">packaged.</span>
          </h2>
          <p className="text-[#FDFBF7]/60 max-w-2xl">
            Follow trusted voices at your own pace — or let a kit do the heavy lifting when you're ready to leap.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

          {/* Left: spotlight creators */}
          <div className="flex flex-col gap-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#FDFBF7]/35 mb-1">
              Trusted Voices — free, self-directed
            </div>
            {spotlightCreators.length === 0 ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse border border-white/5" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {spotlightCreators.map((creator) => {
                  const isComingSoon = creator.status === "coming-soon";
                  const linkTypes: Record<string, string> = { podcast: "🎙", video: "▶", article: "📄", book: "📚" };

                  const cardContent = (
                    <div className="group flex items-start gap-4 p-4 rounded-xl border border-white/8 bg-white/[0.03] hover:border-[#D9A066]/30 hover:bg-white/[0.05] transition-all">
                      {creator.avatarUrl ? (
                        <img
                          src={creator.avatarUrl}
                          alt={creator.name}
                          className={`w-12 h-12 rounded-full object-cover shrink-0 border-2 border-white/15 ${isComingSoon ? "opacity-50 grayscale" : ""}`}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-[#2C4A36] border-2 border-white/15 text-[#D9A066] font-bold text-lg">
                          {creator.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-[#FDFBF7] text-sm leading-tight">{creator.name}</span>
                          {isComingSoon && (
                            <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-white/10 text-[#FDFBF7]/50 border border-white/15">
                              coming soon
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#FDFBF7]/50 leading-relaxed line-clamp-1 mb-2">{creator.bio}</p>
                        {creator.curatedLinks.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {creator.curatedLinks.slice(0, 3).map((link) => (
                              <span
                                key={link.url}
                                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/15 bg-white/5 text-[#FDFBF7]/60 ${isComingSoon ? "opacity-40" : ""}`}
                              >
                                {linkTypes[link.type] ?? "🔗"} {link.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {!isComingSoon && (
                        <ArrowRight className="w-4 h-4 text-[#FDFBF7]/30 group-hover:text-[#D9A066] transition-colors shrink-0 mt-1" />
                      )}
                    </div>
                  );

                  if (!isComingSoon && creator.websiteUrl) {
                    return (
                      <a key={creator.slug} href={creator.websiteUrl} target="_blank" rel="noopener noreferrer">
                        {cardContent}
                      </a>
                    );
                  }
                  return <div key={creator.slug}>{cardContent}</div>;
                })}
              </div>
            )}

            <div className="mt-1">
              <Link
                href="/transform"
                className="text-xs text-[#FDFBF7]/40 hover:text-[#8FA883] transition-colors inline-flex items-center gap-1"
              >
                Browse paths to find more voices <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Right: Kit easy-button — always visible, sticky */}
          <div className="lg:sticky lg:top-8">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#FDFBF7]/35 mb-3">
              The easy button — packaged
            </div>

            {featuredKit && featuredKitMeta ? (
              <div
                className="rounded-2xl border p-6 flex flex-col gap-5"
                style={{
                  borderColor: `${featuredKitMeta.color}50`,
                  background: `linear-gradient(145deg, ${featuredKitMeta.color}15 0%, ${featuredKitMeta.color}06 100%)`,
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl leading-none">{featuredKitMeta.icon}</span>
                  <div>
                    <div
                      className="text-[10px] font-bold uppercase tracking-widest mb-1"
                      style={{ color: featuredKitMeta.color }}
                    >
                      Featured Kit
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#FDFBF7] leading-tight">
                      {featuredKit.name}
                    </h3>
                    <p className="text-xs text-[#FDFBF7]/55 mt-1 leading-relaxed">{featuredKit.tagline}</p>
                  </div>
                </div>

                {featuredKit.priceCents && (
                  <div className="text-sm text-[#FDFBF7]/70">
                    <span className="text-[#FDFBF7] font-bold text-xl">${(featuredKit.priceCents / 100).toFixed(0)}</span>
                    <span className="ml-1">one-time</span>
                  </div>
                )}

                <Link
                  href={`/kits/${featuredKit.slug}`}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-px"
                  style={{
                    color: "#fff",
                    background: featuredKitMeta.color,
                    boxShadow: `0 6px 24px ${featuredKitMeta.color}45`,
                  }}
                >
                  <Package className="w-4 h-4" />
                  Get {featuredKit.name}
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="text-center -mt-2">
                  <Link
                    href="/kits"
                    className="text-xs text-[#FDFBF7]/35 hover:text-[#FDFBF7]/60 transition-colors"
                  >
                    Browse all kits →
                  </Link>
                </div>
              </div>
            ) : null}

            {/* Kit Finder */}
            <div className="mt-4 rounded-xl border border-[#8FA883]/25 bg-[#8FA883]/8 p-4 flex items-center gap-3">
              <Compass className="w-5 h-5 text-[#8FA883] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#FDFBF7] leading-tight">Not sure where to start?</p>
                <p className="text-xs text-[#FDFBF7]/45 mt-0.5">5 questions · instant recommendation</p>
              </div>
              <Link
                href="/kits/find"
                className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-[#8FA883]/40 text-[#8FA883] hover:bg-[#8FA883]/15 transition-colors"
              >
                Find kit <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Transformation Stories (featured episodes) ────────────────────────────────

function StoriesSection() {
  const { data: featured } = useGetFeaturedEpisodes();
  const episodes = (featured ?? []).slice(0, 3);

  return (
    <section id="stories" className="relative bg-gradient-to-b from-[#1a2c20] to-[#0c1611] py-24 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D9A066]/30 bg-[#D9A066]/10 mb-5">
            <Mic className="w-3.5 h-3.5 text-[#D9A066]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D9A066]">Trail Markers</span>
          </div>
          <h2 className="font-serif text-4xl md:text-6xl text-[#FDFBF7] font-bold leading-tight">
            Episodes that <span className="italic text-[#D9A066]">move people.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {episodes.length === 0
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-80 rounded-2xl bg-[#15241b] animate-pulse border border-white/5" />
              ))
            : episodes.map((ep, i) => (
                <motion.div
                  key={ep.slug}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, delay: i * 0.1 }}
                >
                  <Link
                    href={`/episodes/${ep.slug}`}
                    className="group block h-full rounded-2xl overflow-hidden border border-white/8 bg-[#15241b] hover:border-[#D9A066]/50 transition-all hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(217,160,102,0.2)]"
                  >
                    <div className="relative aspect-[16/10] bg-[#0c1611] overflow-hidden">
                      {ep.artworkUrl
                        ? <img src={ep.artworkUrl} alt={ep.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center"><Mic className="w-12 h-12 text-[#D9A066]/30" /></div>}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <span className="w-9 h-9 rounded-full bg-[#D9A066] flex items-center justify-center text-[#2C4A36] shadow-lg">
                          <PlayCircle className="w-5 h-5" />
                        </span>
                        {ep.episodeNumber && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                            Ep. {ep.episodeNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-serif text-lg text-[#FDFBF7] font-bold leading-snug line-clamp-2 group-hover:text-[#D9A066] transition-colors">
                        {ep.title}
                      </h3>
                      {ep.summary && (
                        <p className="mt-2 text-sm text-[#FDFBF7]/55 leading-relaxed line-clamp-3">{ep.summary}</p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-[#FDFBF7] border border-[#FDFBF7]/20 hover:bg-[#FDFBF7]/5 transition-colors"
          >
            <LibraryIcon className="w-4 h-4" />
            Search the 6,000+ archive
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── About Jack blurb ──────────────────────────────────────────────────────────

function AboutJackSection() {
  return (
    <section className="relative bg-[#15241b] py-20 overflow-hidden border-t border-white/5">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="grid md:grid-cols-[auto_1fr] gap-10 items-center">
          {/* Headshot placeholder */}
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#2C4A36] border-4 border-[#D9A066]/30 overflow-hidden flex items-center justify-center shadow-xl shadow-black/30">
              <Mic className="w-14 h-14 text-[#D9A066]/50" />
            </div>
          </div>
          {/* Bio */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D9A066]/20 bg-[#D9A066]/8 mb-4">
              <Mic className="w-3 h-3 text-[#D9A066]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D9A066]">About Jack</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl text-[#FDFBF7] font-bold leading-tight mb-4">
              Jack Spirko has been doing this since 2008.
            </h2>
            <p className="text-[#FDFBF7]/65 leading-relaxed max-w-2xl mb-3">
              Jack Spirko started The Survival Podcast to challenge the bunker-and-canned-beans stereotype of preparedness. His argument: resilience and abundance aren't opposites. You can build a genuinely good life — food security, financial independence, real skills — and be prepared for the hard parts at the same time.
            </p>
            <p className="text-[#FDFBF7]/50 leading-relaxed max-w-2xl mb-6">
              Sixteen years, 6,000+ episodes, and one organizing framework: the permaculture zone model, adapted for modern life. The result is the most practical self-reliance archive on the internet.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://thesurvivalpodcast.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-[#FDFBF7] border border-[#FDFBF7]/20 hover:bg-[#FDFBF7]/8 transition-colors"
              >
                TSP Website ↗
              </a>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-[#D9A066] border border-[#D9A066]/30 hover:bg-[#D9A066]/8 transition-colors"
              >
                Full About page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Community & Next Steps ────────────────────────────────────────────────────

function CommunitySection() {
  const { data: zones } = useListZones();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setSubmitted(true);
  }

  return (
    <section id="community" className="relative bg-[#0c1611] py-24 md:py-32 overflow-hidden border-t border-white/5">
      <ParticleField count={20} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(44,74,54,0.6)_0%,transparent_70%)]" />

      <div className="relative container mx-auto px-4 md:px-6 max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D9A066]/30 bg-[#D9A066]/10 mb-6">
            <Footprints className="w-3.5 h-3.5 text-[#D9A066]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D9A066]">Next Steps</span>
          </div>

          <h2 className="font-serif text-4xl md:text-6xl text-[#FDFBF7] font-bold leading-tight mb-5">
            Stay on <span className="italic text-[#D9A066]">the path.</span>
          </h2>
          <p className="text-[#FDFBF7]/65 text-lg max-w-2xl mx-auto mb-10">
            One stomp at a time. A weekly nudge with the best episode, the best gear find, and the day's prompt.
          </p>

          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto mb-12">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={submitted}
              className="flex-1 bg-white/8 border border-white/15 rounded-full px-6 py-4 text-[#FDFBF7] placeholder-white/30 focus:outline-none focus:border-[#D9A066]/60 transition-colors"
            />
            <button
              type="submit"
              disabled={submitted}
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full font-bold text-[#2C4A36] bg-gradient-to-r from-[#D9A066] to-[#e8b06b] hover:from-[#e0a972] hover:to-[#f1bb78] transition-all shadow-lg disabled:opacity-70"
            >
              {submitted ? (<><CheckCircle2 className="w-4 h-4" /> On the path</>) : (<><Send className="w-4 h-4" /> Stay on the Path</>)}
            </button>
          </form>

          {/* Zone quick links */}
          {zones && zones.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              {zones.slice(0, 6).map((z, i) => (
                <Link
                  key={z.slug ?? `zone-${i}`}
                  href={`/zones/${z.slug}`}
                  className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-[#D9A066]/20 text-[#FDFBF7]/70 hover:text-[#D9A066] hover:border-[#D9A066]/50 transition-colors"
                >
                  {z.name ?? z.slug}
                </Link>
              ))}
            </div>
          )}

          {/* Kit Finder secondary CTA */}
          <div className="flex justify-center mb-8">
            <Link
              href="/kits/find"
              className="group inline-flex items-center gap-3 px-6 py-3.5 rounded-xl border border-[#8FA883]/30 bg-[#8FA883]/10 hover:bg-[#8FA883]/18 hover:border-[#8FA883]/50 transition-all"
            >
              <Compass className="w-5 h-5 text-[#8FA883] group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="font-serif font-bold text-[#FDFBF7] text-sm leading-tight">
                  Find your kit
                </div>
                <div className="text-xs text-[#FDFBF7]/50">5 questions · instant recommendation</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8FA883]/60 group-hover:text-[#8FA883] group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-0">
            {[
              { href: "/library", label: "Search Archive", desc: "6,000+ episodes", Icon: Search },
              { href: "/tracks", label: "Learning Tracks", desc: "Seven curated paths", Icon: Compass },
              { href: "/stomping-grounds", label: "Full Grounds", desc: "Wisdom · Pot · Wheel", Icon: MapIcon },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group flex flex-col items-center gap-2 p-5 rounded-xl border border-white/8 hover:border-[#D9A066]/40 hover:bg-white/[0.02] transition-all"
              >
                <card.Icon className="w-6 h-6 text-[#D9A066] group-hover:scale-110 transition-transform" />
                <div className="font-serif font-bold text-[#FDFBF7]">{card.label}</div>
                <div className="text-xs text-[#FDFBF7]/50">{card.desc}</div>
              </Link>
            ))}
            <a
              href="https://ourheadwaters.ca/headwaters-learning/forge"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-2 p-5 rounded-xl border border-white/8 hover:border-[#D9A066]/40 hover:bg-white/[0.02] transition-all"
            >
              <Flame className="w-6 h-6 text-[#D9A066] group-hover:scale-110 transition-transform" />
              <div className="font-serif font-bold text-[#FDFBF7]">The Forge ↗</div>
              <div className="text-xs text-[#FDFBF7]/50">Crypto Castle learning</div>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Inject CSS keyframes once ─────────────────────────────────────────────────

function GlobalStompStyles() {
  return (
    <style>{`
      @keyframes tsp-float {
        0% { transform: translateY(0) translateX(0); opacity: 0; }
        10% { opacity: 0.8; }
        90% { opacity: 0.6; }
        100% { transform: translateY(-110vh) translateX(var(--drift, 0px)); opacity: 0; }
      }
      .animate-tsp-float { animation: tsp-float linear infinite; will-change: transform, opacity; }

      @keyframes tsp-pulse-ring {
        0% { transform: scale(1); opacity: 0.7; }
        100% { transform: scale(1.9); opacity: 0; }
      }
      .animate-tsp-pulse-ring { animation: tsp-pulse-ring 1.8s cubic-bezier(0.4,0,0.2,1) infinite; }

      @keyframes tsp-footprint {
        0%, 100% { opacity: 0.15; transform: scale(0.85); }
        50% { opacity: 1; transform: scale(1.1); }
      }
      .animate-tsp-footprint { animation: tsp-footprint 3s ease-in-out infinite; }

      @keyframes scroll-stomp-in {
        0%   { opacity: 0; transform: scale(0.2) rotate(var(--stomp-rot, -12deg)); }
        45%  { opacity: var(--stomp-max-opacity, 0.55); transform: scale(1.2) rotate(var(--stomp-rot, -12deg)); }
        100% { opacity: var(--stomp-max-opacity, 0.45); transform: scale(1) rotate(var(--stomp-rot, -12deg)); }
      }
      .scroll-stomp-particle {
        animation: scroll-stomp-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }
      @media (prefers-reduced-motion: reduce) {
        .scroll-stomp-particle { animation: none !important; opacity: 0.4 !important; }
      }

      html { scroll-behavior: smooth; }
    `}</style>
  );
}

// ─── Page export ───────────────────────────────────────────────────────────────

export function Home() {
  useEffect(() => {
    document.title = "The Stomping Path — Practical Self-Reliance Podcast | Jack Spirko";
    const desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (desc) desc.content = "Jack Spirko's Survival Podcast archive — 6,000+ episodes on homesteading, permaculture, food production, financial independence, and bushcraft. Curated paths to take you from curious to capable.";
    return () => {
      document.title = "The Stomping Path";
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-stomp-fade]").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 24,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: undefined,
        });
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="relative bg-[#0c1611] text-[#FDFBF7] min-h-screen">
      <GlobalStompStyles />
      <GlowCursor />
      <VineProgress />
      <DailyStompOrb />

      <HeroEntrance />
      <YourPathRail />
      <ContinueLearningWidget />
      <StormToBloomSection />
      <JourneyMapSection />
      <CuratedPathsSection />
      <YourPathYourWaySection />
      <div id="daily" />
      <StoriesSection />
      <AboutJackSection />
      <CommunitySection />
    </div>
  );
}
