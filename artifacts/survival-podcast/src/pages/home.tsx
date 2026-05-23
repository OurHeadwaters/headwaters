import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import {
  Compass, Search, ArrowRight, PlayCircle, Sparkles, Footprints,
  Mountain, Sprout, Sun, Cloud, Wind, Flame, Library as LibraryIcon,
  Mic, ChevronRight, Send, CheckCircle2, X, Map as MapIcon,
} from "lucide-react";
import { useGetFeaturedEpisodes, useListZones } from "@workspace/api-client-react";
import { useTransformations } from "@/hooks/use-transformations";
import { StompingGroundsScene } from "@/components/stomping-grounds-scene";

// ─── Daily Stomp local state ───────────────────────────────────────────────────

const STOMP_KEY = "tsp-daily-stomp-v1";
const PROGRESS_KEY = "tsp-path-progress-v1";

interface StompState {
  date: string;
  completed: boolean;
  streak: number;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function readStomp(): StompState {
  if (typeof window === "undefined") return { date: todayISO(), completed: false, streak: 0 };
  try {
    const raw = localStorage.getItem(STOMP_KEY);
    if (!raw) return { date: todayISO(), completed: false, streak: 0 };
    const parsed = JSON.parse(raw) as StompState;
    if (parsed.date !== todayISO()) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      const wasYesterday = parsed.date === y.toISOString().slice(0, 10);
      return { date: todayISO(), completed: false, streak: wasYesterday && parsed.completed ? parsed.streak : 0 };
    }
    return parsed;
  } catch { return { date: todayISO(), completed: false, streak: 0 }; }
}

function writeStomp(s: StompState) {
  try { localStorage.setItem(STOMP_KEY, JSON.stringify(s)); } catch {}
}

function readProgress(): number {
  if (typeof window === "undefined") return 0;
  try { return parseInt(localStorage.getItem(PROGRESS_KEY) || "0", 10) || 0; } catch { return 0; }
}
function bumpProgress(by = 5) {
  try {
    const cur = readProgress();
    const next = Math.min(100, cur + by);
    localStorage.setItem(PROGRESS_KEY, String(next));
    window.dispatchEvent(new CustomEvent("path-progress", { detail: next }));
  } catch {}
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
  const [bonus, setBonus] = useState(0);

  useEffect(() => {
    setBonus(readProgress());
    const onProgress = (e: Event) => setBonus((e as CustomEvent<number>).detail);
    window.addEventListener("path-progress", onProgress);
    return () => window.removeEventListener("path-progress", onProgress);
  }, []);

  return (
    <div className="hidden lg:block fixed left-6 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
      <div className="relative h-[55vh] w-[3px] rounded-full bg-white/8">
        <motion.div
          className="absolute inset-x-0 top-0 origin-top rounded-full bg-gradient-to-b from-[#D9A066] via-[#A64B36] to-[#2C4A36] shadow-[0_0_18px_rgba(217,160,102,0.6)]"
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
            <Sprout className="w-4 h-4 text-[#7FA77F] drop-shadow-[0_0_6px_rgba(127,167,127,0.6)]" />
          </motion.div>
        ))}
        <div className="absolute -bottom-8 -left-3 flex flex-col items-center gap-1">
          <Footprints className="w-3 h-3 text-[#D9A066]" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#D9A066]/80">
            {bonus}xp
          </span>
        </div>
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
  const [state, setState] = useState<StompState>(() => ({ date: todayISO(), completed: false, streak: 0 }));
  const [response, setResponse] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prompt = useMemo(() => {
    const day = new Date().getDate();
    return STOMP_PROMPTS[day % STOMP_PROMPTS.length];
  }, []);

  useEffect(() => { setState(readStomp()); }, []);
  useEffect(() => () => {
    if (confettiTimer.current) clearTimeout(confettiTimer.current);
  }, []);

  function complete() {
    setState((prev) => {
      if (prev.completed) return prev;
      const next: StompState = { date: todayISO(), completed: true, streak: prev.streak + 1 };
      writeStomp(next);
      bumpProgress(10);
      setShowConfetti(true);
      if (confettiTimer.current) clearTimeout(confettiTimer.current);
      confettiTimer.current = setTimeout(() => setShowConfetti(false), 2500);
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
          {state.completed
            ? <CheckCircle2 className="w-7 h-7 text-[#FDFBF7]" />
            : <Footprints className="w-7 h-7 text-[#FDFBF7] group-hover:rotate-12 transition-transform" />}
        </span>
        {state.streak > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#2C4A36] text-[#D9A066] text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-[#FDFBF7] shadow">
            {state.streak}
          </span>
        )}
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
                  Today's Stomp · Day {state.streak + (state.completed ? 0 : 1)}
                </div>
                <h3 className="font-serif text-2xl text-white leading-snug mb-4">{prompt}</h3>

                {!state.completed ? (
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
                    <p className="text-white font-serif text-lg mb-1">Stomped.</p>
                    <p className="text-white/60 text-sm">{state.streak}-day streak. Come back tomorrow.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showConfetti && (
          <motion.div
            key="conf"
            className="fixed inset-0 z-[60] pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            {Array.from({ length: 40 }).map((_, i) => {
              const angle = (i / 40) * Math.PI * 2;
              const dist = 200 + Math.random() * 200;
              const color = ["#D9A066", "#A64B36", "#7FA77F", "#FDFBF7"][i % 4];
              return (
                <motion.span
                  key={i}
                  className="absolute rounded-sm"
                  style={{
                    left: "calc(100% - 4rem - 32px)", top: "calc(100% - 4rem - 32px)",
                    width: 6 + Math.random() * 4, height: 6 + Math.random() * 4,
                    background: color,
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                  animate={{
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist - 50,
                    opacity: 0,
                    rotate: Math.random() * 720,
                  }}
                  transition={{ duration: 1.6 + Math.random() * 0.6, ease: "easeOut" }}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── HERO — The Path Entrance ──────────────────────────────────────────────────

function HeroEntrance() {
  const ref = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioMuted, setAudioMuted] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);

  function toggleAudio() {
    const el = audioRef.current;
    if (!el) return;
    if (!audioStarted) {
      el.volume = 0.25;
      el.play().catch(() => {});
      el.muted = false;
      setAudioStarted(true);
      setAudioMuted(false);
    } else {
      el.muted = !el.muted;
      setAudioMuted(el.muted);
    }
  }

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yMountains = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const yMid = useTransform(scrollYProgress, [0, 1], ["0%", "55%"]);
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
      className="relative h-[100vh] min-h-[640px] w-full overflow-hidden bg-[#0c1611]"
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
              <g key={i} filter="url(#glow)">
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

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.55)_100%)]" />

      {/* Freedom ambient audio — muted/paused by default */}
      <audio ref={audioRef} src={`${import.meta.env.BASE_URL}freedom-ambient.mp3`} loop preload="none" muted />

      {/* Audio toggle button */}
      <button
        onClick={toggleAudio}
        title={audioMuted ? "Play ambient music" : "Mute ambient music"}
        className="absolute bottom-8 right-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 bg-black/30 backdrop-blur-sm text-white/60 hover:text-white hover:border-white/40 transition-all text-[11px] font-semibold uppercase tracking-wider"
      >
        {audioMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
        {audioMuted ? "Music off" : "Music on"}
      </button>

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
          <Sparkles className="w-3.5 h-3.5 text-[#D9A066]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D9A066]">A Fan Redesign · The Stomping Path</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
          className="font-serif text-5xl sm:text-7xl md:text-8xl font-bold text-[#FDFBF7] leading-[0.95] tracking-tight mb-4 md:mb-6 drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)]"
        >
          The <span className="italic text-[#D9A066]">Stomping</span><br /> Path
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-lg md:text-xl text-[#FDFBF7]/85 max-w-2xl mb-6 md:mb-10 font-light leading-relaxed"
        >
          See the problems. Stomp the solutions. <br className="hidden sm:block" />
          Reclaim your sovereignty — one footprint at a time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <a
            href="#problems"
            onClick={() => bumpProgress(3)}
            className="group relative inline-flex items-center gap-2 px-7 py-4 rounded-full font-bold text-[#2C4A36] bg-gradient-to-r from-[#D9A066] to-[#e8b06b] shadow-[0_10px_40px_rgba(217,160,102,0.45)] hover:shadow-[0_14px_50px_rgba(217,160,102,0.65)] hover:-translate-y-0.5 transition-all"
          >
            <Footprints className="w-4 h-4" />
            Begin Your Stomp
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#daily"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-bold text-[#FDFBF7] border border-[#FDFBF7]/25 backdrop-blur-sm hover:bg-[#FDFBF7]/10 transition-all"
          >
            <Sparkles className="w-4 h-4 text-[#D9A066]" />
            Join the Daily Path
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
            onClick={() => bumpProgress(4)}
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
                <Link key={t.slug} href={`/episodes?transformation=${encodeURIComponent(t.slug)}`} onClick={() => bumpProgress(4)}>
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
                    onClick={() => bumpProgress(3)}
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
    bumpProgress(8);
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
            <Sparkles className="w-3.5 h-3.5 text-[#D9A066]" />
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
                  key={z.id ?? `zone-${i}`}
                  href={`/zones/${z.id}`}
                  className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-[#D9A066]/20 text-[#FDFBF7]/70 hover:text-[#D9A066] hover:border-[#D9A066]/50 transition-colors"
                >
                  {z.label ?? z.id}
                </Link>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
            {[
              { href: "/library", label: "Search Archive", desc: "6,000+ episodes", Icon: Search },
              { href: "/tracks", label: "Learning Tracks", desc: "Seven curated paths", Icon: Compass },
              { href: "/stomping-grounds", label: "Full Grounds", desc: "Wisdom · Pot · Wheel", Icon: MapIcon },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                onClick={() => bumpProgress(3)}
                className="group flex flex-col items-center gap-2 p-5 rounded-xl border border-white/8 hover:border-[#D9A066]/40 hover:bg-white/[0.02] transition-all"
              >
                <card.Icon className="w-6 h-6 text-[#D9A066] group-hover:scale-110 transition-transform" />
                <div className="font-serif font-bold text-[#FDFBF7]">{card.label}</div>
                <div className="text-xs text-[#FDFBF7]/50">{card.desc}</div>
              </Link>
            ))}
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

      html { scroll-behavior: smooth; }
    `}</style>
  );
}

// ─── Page export ───────────────────────────────────────────────────────────────

export function Home() {
  // Reset progress if it's been a while — just keep it light
  useEffect(() => {
    // bump small progress on first paint so the vine isn't empty
    if (readProgress() === 0) bumpProgress(2);
  }, []);

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
