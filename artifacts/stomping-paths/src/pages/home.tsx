import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import {
  Compass, Search, ArrowRight, PlayCircle, Footprints,
  Mountain, Sprout, Sun, Cloud, Wind, Flame, Library as LibraryIcon,
  Mic, ChevronRight, Send, CheckCircle2, X, Map as MapIcon,
} from "lucide-react";
import { useGetFeaturedEpisodes, useListZones } from "@workspace/api-client-react";
import { useTransformations } from "@/hooks/use-transformations";
import { StompingGroundsScene } from "@/components/stomping-grounds-scene";

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
      className="relative h-[78vh] min-h-[560px] w-full overflow-hidden bg-[#0c1611]"
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
          {/* Crenellations left tower */}
          {[120, 140, 160, 180].map((x, i) => (
            <rect key={i} x={x} y={100} width={14} height={24} fill="url(#castle-body)" />
          ))}
          {/* Left tower window */}
          <rect x="147" y="150" width="16" height="22" rx="2" fill="#0c1611" />
          <ellipse cx="155" cy="150" rx="8" ry="3" fill="#0c1611" />

          {/* === Right flanking tower === */}
          <rect x="610" y="120" width="70" height="140" fill="url(#castle-body)" />
          {/* Crenellations right tower */}
          {[610, 630, 650, 670].map((x, i) => (
            <rect key={i} x={x} y={100} width={14} height={24} fill="url(#castle-body)" />
          ))}
          {/* Right tower window */}
          <rect x="637" y="150" width="16" height="22" rx="2" fill="#0c1611" />
          <ellipse cx="645" cy="150" rx="8" ry="3" fill="#0c1611" />

          {/* === Curtain walls === */}
          <rect x="190" y="155" width="170" height="105" fill="url(#castle-body)" />
          <rect x="440" y="155" width="170" height="105" fill="url(#castle-body)" />
          {/* Wall crenellations */}
          {[190, 215, 240, 265, 290, 315, 340].map((x, i) => (
            <rect key={i} x={x} y={138} width={18} height={20} fill="url(#castle-body)" />
          ))}
          {[440, 465, 490, 515, 540, 565, 590].map((x, i) => (
            <rect key={i} x={x} y={138} width={18} height={20} fill="url(#castle-body)" />
          ))}

          {/* === Central keep — tallest === */}
          <rect x="270" y="60" width="260" height="200" fill="url(#castle-body)" />
          {/* Keep crenellations */}
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

          {/* === Torch brackets — left === */}
          {/* torch glow halo */}
          <ellipse cx="226" cy="148" rx="22" ry="22" fill="url(#torch-glow-L)" />
          {/* torch post */}
          <rect x="222" y="150" width="4" height="16" rx="2" fill="#5A3A1A" />
          {/* torch flame — animated */}
          <path
            d="M224,150 Q220,143 224,136 Q228,143 224,150"
            fill="#D4621A"
            opacity="0.95"
            className="animate-tsp-torch"
          />
          <path
            d="M224,150 Q222,145 224,140 Q226,145 224,150"
            fill="#FFD580"
            opacity="0.8"
            className="animate-tsp-torch-d1"
          />

          {/* === Torch brackets — right === */}
          <ellipse cx="574" cy="148" rx="22" ry="22" fill="url(#torch-glow-R)" />
          <rect x="570" y="150" width="4" height="16" rx="2" fill="#5A3A1A" />
          <path
            d="M572,150 Q568,143 572,136 Q576,143 572,150"
            fill="#D4621A"
            opacity="0.95"
            className="animate-tsp-torch-d2"
          />
          <path
            d="M572,150 Q570,145 572,140 Q574,145 572,150"
            fill="#FFD580"
            opacity="0.8"
            className="animate-tsp-torch-d3"
          />

          {/* Ground line */}
          <rect x="0" y="258" width="800" height="4" fill="#0c1611" opacity="0.8" rx="2" />
        </svg>
      </motion.div>

      {/* Fog band */}
      <motion.div
        className="absolute inset-x-0 bottom-1/4 h-32 pointer-events-none"
        style={{
          y: yFog,
          background: "linear-gradient(to top, rgba(253,251,247,0.15) 0%, transparent 100%)",
          filter: "blur(20px)",
        }}
      />

      {/* The Path — winding SVG with glowing footprints */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none">
        <svg
          viewBox="0 0 1000 400"
          preserveAspectRatio="xMidYMax slice"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="path-grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#3d2b1f" stopOpacity="0" />
              <stop offset="40%" stopColor="#5C3D2E" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#2a1d14" stopOpacity="0.85" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Trail */}
          <path
            d="M500,400 Q420,340 480,280 Q560,220 480,160 Q400,100 510,40 Q580,0 510,-40"
            stroke="url(#path-grad)"
            strokeWidth="120"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M500,400 Q420,340 480,280 Q560,220 480,160 Q400,100 510,40 Q580,0 510,-40"
            stroke="#D9A066"
            strokeWidth="1.5"
            strokeOpacity="0.4"
            strokeDasharray="3 8"
            fill="none"
          />
          {/* Glowing footprints along the path */}
          {footprints.map((i) => {
            const t = 0.05 + (i / footprints.length) * 0.95;
            // Approximate path positions (matches the Q curves above roughly)
            const positions = [
              [500, 380], [468, 350], [478, 310], [510, 280], [495, 240],
              [468, 200], [490, 160], [510, 120], [505, 80],
            ];
            const [cx, cy] = positions[i] ?? [500, 380];
            const side = i % 2 === 0 ? -8 : 8;
            return (
              <g key={i}>
                <ellipse
                  cx={cx + side}
                  cy={cy}
                  rx={5}
                  ry={8}
                  fill="#D9A066"
                  className="animate-tsp-footprint"
                  style={{ animationDelay: `${i * 0.35}s`, transformOrigin: `${cx + side}px ${cy}px` } as React.CSSProperties}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Particles */}
      <ParticleField count={28} />
      <ParticleField count={10} color="#FDFBF7" />
      <ParticleField count={8} color="#00BFDF" />

      {/* Scroll-triggered boot-stomp footprints along path */}
      <ScrollStompParticles />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.55)_100%)]" />

      {/* HEADLINE */}
      <motion.div
        className="relative h-full flex flex-col items-center justify-center text-center px-6"
        style={{ y: headlineY, opacity: headlineOpacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D9A066]/30 bg-black/30 backdrop-blur-sm mb-4 md:mb-6"
        >
          <Footprints className="w-3.5 h-3.5 text-[#D9A066]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D9A066]">A podcast for people building a life worth defending</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
          className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold text-[#FDFBF7] leading-[1.05] tracking-tight mb-4 md:mb-6 drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)] max-w-3xl"
        >
          The clearing is where your <span className="italic text-[#D9A066]">Edgy ideas</span> get neighbours.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="text-base md:text-lg text-[#FDFBF7]/65 max-w-lg mb-7 md:mb-10 leading-relaxed"
        >
          The worn path between the Lodge and the Clearing. Walk it.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          {/* Primary Forge CTA — torch-orange */}
          <a
            href="/codetry/"
            className="group relative inline-flex items-center gap-2 px-7 py-4 rounded-full font-bold text-white shadow-[0_10px_40px_rgba(212,98,26,0.5)] hover:shadow-[0_14px_50px_rgba(212,98,26,0.7)] hover:-translate-y-0.5 transition-all"
            style={{
              background: "linear-gradient(135deg, #D4621A 0%, #E87A38 55%, #C4521A 100%)",
              border: "1.5px solid rgba(232,122,56,0.5)",
            }}
          >
            <Flame className="w-4 h-4" />
            Enter the Forge
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          {/* Secondary — ghost/outline style */}
          <a
            href="#problems"
            className="group inline-flex items-center gap-2 px-7 py-4 rounded-full font-bold text-[#FDFBF7] border border-[#FDFBF7]/25 backdrop-blur-sm hover:bg-[#FDFBF7]/10 transition-all"
          >
            <Footprints className="w-4 h-4 text-[#D9A066]" />
            Begin Your Stomp
            <ArrowRight className="w-4 h-4 text-[#D9A066]/60 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 1 }}
          className="absolute bottom-8 flex flex-col items-center gap-2 text-[#FDFBF7]/40 text-[10px] font-bold uppercase tracking-widest"
        >
          <span>Scroll the trail</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-px h-8 bg-gradient-to-b from-[#FDFBF7]/50 to-transparent"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Problems → Solutions (Storm to Bloom) ─────────────────────────────────────

const STORM_SOLUTIONS = [
  {
    storm: "Squeezed by the grindstone",
    solutionFrom: "Job-dependent. Burning out. One layoff from chaos.",
    solutionTo: "Skills nobody can take. Income you control. Time you own.",
    track: "/tracks/escape-the-grindstone",
    icon: Flame,
    accent: "#A64B36",
  },
  {
    storm: "Fragile supply chain",
    solutionFrom: "One trucker's strike from empty shelves.",
    solutionTo: "Soil, seeds, jars, and skills. A pantry, not a panic.",
    track: "/tracks",
    icon: Sprout,
    accent: "#7FA77F",
  },
  {
    storm: "Money you don't understand",
    solutionFrom: "Inflation eating you. Dollars losing 8% a year.",
    solutionTo: "Bitcoin-only. Real assets. Cash flow you can name.",
    track: "/tracks",
    icon: Mountain,
    accent: "#D9A066",
  },
];

function StormToBloomSection() {
  return (
    <section id="problems" className="relative bg-[#0c1611] py-24 md:py-32 overflow-hidden">
      <ParticleField count={18} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(166,75,54,0.18)_0%,transparent_60%)]" />

      <div className="relative container mx-auto px-4 md:px-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#A64B36]/30 bg-[#A64B36]/10 mb-5">
            <Cloud className="w-3.5 h-3.5 text-[#A64B36]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A64B36]">The Storms</span>
          </div>
          <h2 className="font-serif text-4xl md:text-6xl text-[#FDFBF7] font-bold leading-tight">
            See the problem.<br />
            <span className="italic text-[#D9A066]">Then stomp it flat.</span>
          </h2>
        </motion.div>

        <div className="space-y-10">
          {STORM_SOLUTIONS.map((item, idx) => (
            <StormCard key={idx} item={item} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StormCard({ item, index }: { item: typeof STORM_SOLUTIONS[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.4"] });
  const stormOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.15]);
  const stormBlur = useTransform(scrollYProgress, [0, 0.5], ["0px", "8px"]);
  const stormFilter = useTransform(stormBlur, (v) => `blur(${v})`);
  const bloomScale = useTransform(scrollYProgress, [0.3, 0.7], [0.92, 1]);
  const bloomOpacity = useTransform(scrollYProgress, [0.3, 0.6], [0, 1]);
  const arrowProgress = useTransform(scrollYProgress, [0.3, 0.7], [0, 1]);
  const Icon = item.icon;

  return (
    <div ref={ref} className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-10 items-center">
      {/* STORM side */}
      <motion.div
        style={{ opacity: stormOpacity, filter: stormFilter }}
        className="relative bg-gradient-to-br from-[#1a0f0a] to-[#2a1810] border border-[#A64B36]/20 rounded-2xl p-7 overflow-hidden"
      >
        <Cloud className="absolute -top-4 -right-4 w-32 h-32 text-[#A64B36]/8" strokeWidth={1} />
        <div className="relative">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#A64B36]/80 mb-3">
            <Wind className="w-3 h-3" /> Storm #{index + 1}
          </div>
          <h3 className="font-serif text-2xl md:text-3xl text-[#FDFBF7] font-bold mb-3 leading-tight">
            {item.storm}
          </h3>
          <p className="text-[#FDFBF7]/55 leading-relaxed text-sm md:text-base">{item.solutionFrom}</p>
        </div>
      </motion.div>

      {/* Arrow / transformation indicator */}
      <motion.div className="flex md:flex-col items-center justify-center gap-2 py-2">
        <motion.div
          style={{ scaleX: arrowProgress }}
          className="origin-left h-px md:hidden bg-gradient-to-r from-[#A64B36] to-[#D9A066] w-20"
        />
        <motion.div
          style={{ scaleY: arrowProgress }}
          className="origin-top w-px hidden md:block bg-gradient-to-b from-[#A64B36] to-[#7FA77F] h-16"
        />
        <motion.div
          initial={{ rotate: 0, scale: 0.5 }}
          whileInView={{ rotate: 360, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D9A066] to-[#7FA77F] flex items-center justify-center shadow-[0_0_20px_rgba(217,160,102,0.5)]"
        >
          <Footprints className="w-4 h-4 text-[#0c1611]" />
        </motion.div>
      </motion.div>

      {/* BLOOM side */}
      <motion.div
        style={{ opacity: bloomOpacity, scale: bloomScale }}
        className="relative rounded-2xl p-7 overflow-hidden border"
      >
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${item.accent}22 0%, ${item.accent}08 50%, transparent 100%)`,
            border: `1px solid ${item.accent}55`,
          }}
        />
        <Sun className="absolute -top-4 -right-4 w-32 h-32" style={{ color: `${item.accent}15` }} strokeWidth={1} />
        <div className="relative">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: item.accent }}>
            <Icon className="w-3 h-3" /> The Stomp
          </div>
          <p className="font-serif text-xl md:text-2xl text-[#FDFBF7] font-bold leading-snug mb-4">
            {item.solutionTo}
          </p>
          <Link
            href={item.track}
            className="inline-flex items-center gap-1.5 text-sm font-bold transition-all hover:gap-2.5"
            style={{ color: item.accent }}
          >
            Walk this path
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Journey Map (wraps existing scene) ────────────────────────────────────────

function JourneyMapSection() {
  return (
    <section id="map" className="relative bg-gradient-to-b from-[#0c1611] via-[#15241b] to-[#1a2c20] py-20 md:py-28 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D9A066]/30 bg-[#D9A066]/10 mb-5">
            <MapIcon className="w-3.5 h-3.5 text-[#D9A066]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D9A066]">The Journey Map</span>
          </div>
          <h2 className="font-serif text-4xl md:text-6xl text-[#FDFBF7] font-bold leading-tight mb-3">
            Your homestead, <span className="italic text-[#D9A066]">interactive.</span>
          </h2>
          <p className="text-[#FDFBF7]/65 max-w-2xl mx-auto">
            Every station on the grounds opens a different door — wisdom, action, support, or transformation.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
          className="rounded-3xl overflow-hidden border border-[#D9A066]/15 bg-[#0c1611]/40 shadow-2xl"
        >
          <StompingGroundsScene compact />
        </motion.div>
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

  // Tiny GSAP smoothness ping (no ScrollTrigger plugin — keeps deps tiny)
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-stomp-fade]").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 24,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: undefined, // no plugin registered; fall back to immediate
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
      <StormToBloomSection />
      <JourneyMapSection />
      <CuratedPathsSection />
      <div id="daily" />
      <StoriesSection />
      <CommunitySection />
    </div>
  );
}
