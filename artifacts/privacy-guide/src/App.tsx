import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GordBird } from "./components/gord-bird";
import SatelliteDroneSection from "./sections/satellite-drone";
import KeepersKitSection from "./sections/keepers-kit";
import BatteredKitSection from "./sections/battered-kit";

const STORAGE_KEY = "sandbox-handbook-community-name";
const SECTIONS_KEY = "sandbox-handbook-sections";
const CHECKLIST_KEY = "sandbox-handbook-checklist";

const DEFAULT_SECTIONS: Record<string, string> = {
  "the-clearing": `The Clearing is your family's private sandbox — a locally-run workspace where children compose, draft, and experiment without anything leaving your home network. Notes, voice memos, and sketches stay on your device unless you deliberately share them. Think of it as a fenced garden: the gate is closed by default, and only you hold the latch.`,
  "the-lodge": `The Lodge is your community's shared meeting hall — a Saltbox instance hosted by your co-op coordinator. Families post announcements, share curriculum links, and hold threaded discussions here. Everything posted in The Lodge is visible to all enrolled families and stored on the coordinator's server. Post here as you would on a community bulletin board: thoughtfully, and without sensitive personal details.`,
  "the-key": `Every family receives one login per household, protected by a passphrase chosen at enrollment. Your passphrase is never stored in plain text. Do not share it with other families — if a child needs separate access, ask the coordinator to create a junior account. Rotate your passphrase once per school year or immediately if you suspect it has been seen by someone outside your household.`,
  "the-mailbox": `Direct messages sent through The Lodge travel encrypted in transit but are stored on the coordinator's server in readable form for moderation. Do not use Lodge messages for sensitive matters: medical details, financial arrangements, or disciplinary conversations belong in a separate end-to-end encrypted channel such as Signal. The Lodge mailbox is for logistics — field trips, book orders, scheduling.`,
  "three-habits": `<strong>Lock before you leave.</strong> Enable your device's auto-lock after two minutes of inactivity so The Clearing is never open on an unattended screen. <strong>One task, one tab.</strong> Close The Lodge session when you step away from community work; a stray open tab can expose your session token. <strong>Updates are not optional.</strong> When The Clearing or Lodge app prompts for an update, apply it within 48 hours — security patches are the fastest fix for known risks.`,
  "zone-identity": `Treat The Clearing as Zone 0 — intimate, personal, and fully under your control. Treat The Lodge as Zone 2 — shared with trusted neighbours but open to the whole co-op. Never place Zone 0 material (personal journals, health notes, financial records) into a Zone 2 space. When in doubt, ask yourself: "Would I pin this to the co-op noticeboard?" If the answer is no, keep it in The Clearing.`,
  "covered-wagon": `A VPN (Virtual Private Network) encrypts the road between your device and the internet, hiding your family's browsing from your internet provider and from coffee-shop networks. A VPN does not make you anonymous — the VPN provider still sees your traffic — but it does prevent casual surveillance. The comparison panel below lists four vetted providers suitable for family use. Choose one with a published no-log audit and a jurisdiction outside the Five Eyes intelligence alliance.`,
  "legal-landscape": `Canada's <em>Personal Information Protection and Electronic Documents Act</em> (PIPEDA) gives you the right to know what data an organization holds about you and to request its correction or deletion. Quebec's Law 25 strengthens these rights for residents of that province. If your co-op collects enrolment data, the coordinator must have a written privacy policy, obtain meaningful consent, and delete records when no longer needed. You may file a complaint with the Office of the Privacy Commissioner of Canada at priv.gc.ca at no cost.`,
};

const DEFAULT_CHECKLIST = [
  "Device auto-lock set to 2 minutes or less",
  "Lodge passphrase rotated this school year",
  "VPN active on all family devices",
  "Sensitive files stored only in The Clearing",
  "Lodge messages free of medical or financial details",
  "App updates applied within 48 hours",
  "Junior accounts created for children (not shared login)",
  "Signal or equivalent set up for sensitive conversations",
];

function loadSections(): Record<string, string> {
  try {
    const raw = localStorage.getItem(SECTIONS_KEY);
    if (raw) return { ...DEFAULT_SECTIONS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SECTIONS };
}

function saveSections(data: Record<string, string>) {
  localStorage.setItem(SECTIONS_KEY, JSON.stringify(data));
}

function loadChecklist(): boolean[] {
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_CHECKLIST.map(() => false);
}

/* ── Particle system ── */
function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    duration: 6 + Math.random() * 10,
    delay: Math.random() * 8,
    size: 2 + Math.random() * 3,
    isLeaf: i % 3 === 0,
  }));

  return (
    <div className="particles-container" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`particle ${p.isLeaf ? "particle-leaf" : "particle-ember"}`}
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.isLeaf ? p.size * 1.4 : p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Clearing Dusk Scene ── */
function DuskScene() {
  return (
    <div className="dusk-scene" aria-hidden="true">
      <svg
        viewBox="0 0 1200 480"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
        className="dusk-svg"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0D1F18" />
            <stop offset="40%" stopColor="#1A3028" />
            <stop offset="70%" stopColor="#2D4A3E" />
            <stop offset="100%" stopColor="#3D5A4A" />
          </linearGradient>
          <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F5C842" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#E8A020" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#C47A20" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF8E8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFF8E8" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width="1200" height="480" fill="url(#sky)" />

        {/* Stars */}
        {[
          [120, 40], [250, 25], [380, 55], [520, 30], [650, 20], [780, 45],
          [900, 35], [1050, 50], [180, 70], [440, 15], [720, 60], [960, 25],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={0.8 + (i % 3) * 0.4} fill="#FFF8E8" opacity={0.4 + (i % 4) * 0.15} />
        ))}

        {/* Moon */}
        <circle cx="950" cy="55" r="22" fill="#FFF8E8" opacity="0.85" filter="url(#glow)" />
        <ellipse cx="958" cy="48" rx="18" ry="18" fill="#1A3028" opacity="0.6" />
        <circle cx="950" cy="55" r="30" fill="url(#moonGlow)" />

        {/* Distant tree line */}
        <path d="M0 280 Q60 220 120 260 Q180 200 240 240 Q300 180 360 220 Q420 170 480 210 Q540 185 600 215 Q660 175 720 205 Q780 190 840 220 Q900 175 960 210 Q1020 185 1080 215 Q1140 200 1200 230 L1200 480 L0 480 Z" fill="#0D1F18" opacity="0.7" />

        {/* Mid tree line */}
        <path d="M0 330 Q40 280 80 310 Q120 270 160 300 Q200 260 240 295 Q280 265 320 290 Q360 255 400 285 Q440 265 480 285 Q520 250 560 275 Q600 265 640 285 Q680 255 720 278 Q760 260 800 282 Q840 250 880 275 Q920 258 960 278 Q1000 255 1040 275 Q1080 258 1120 278 Q1160 265 1200 280 L1200 480 L0 480 Z" fill="#132A1E" opacity="0.85" />

        {/* Foreground trees - left */}
        <path d="M30 480 L30 320 L10 340 L30 310 L20 325 L30 300 L40 325 L30 310 L50 340 L30 320 Z" fill="#0A1A12" />
        <path d="M70 480 L70 350 L50 370 L70 340 L60 358 L70 330 L82 358 L70 340 L90 370 L70 350 Z" fill="#0A1A12" />
        <path d="M110 480 L110 300 L88 325 L110 290 L95 310 L110 278 L126 310 L110 290 L132 325 L110 300 Z" fill="#0A1A12" />

        {/* Foreground trees - right */}
        <path d="M1080 480 L1080 310 L1058 335 L1080 300 L1065 318 L1080 285 L1096 318 L1080 300 L1102 335 L1080 310 Z" fill="#0A1A12" />
        <path d="M1130 480 L1130 340 L1110 360 L1130 330 L1118 348 L1130 318 L1142 348 L1130 330 L1150 360 L1130 340 Z" fill="#0A1A12" />
        <path d="M1165 480 L1165 360 L1148 378 L1165 350 L1155 365 L1165 340 L1175 365 L1165 350 L1182 378 L1165 360 Z" fill="#0A1A12" />

        {/* Ground / clearing */}
        <ellipse cx="600" cy="455" rx="340" ry="40" fill="#0F2418" opacity="0.8" />
        <path d="M200 480 Q400 430 600 440 Q800 430 1000 480 Z" fill="#0F2418" opacity="0.6" />

        {/* Lantern post */}
        <rect x="594" y="260" width="12" height="200" rx="4" fill="#3D2B1A" />
        <rect x="580" y="255" width="40" height="6" rx="2" fill="#4A3520" />
        {/* Lantern housing */}
        <rect x="585" y="220" width="30" height="36" rx="4" fill="#4A3520" stroke="#6B4E2A" strokeWidth="1.5" />
        <rect x="590" y="225" width="20" height="26" rx="2" fill="#F5C842" opacity="0.9" />
        <polygon points="585,220 615,220 608,208 592,208" fill="#3D2B1A" />
        <rect x="598" y="204" width="4" height="8" rx="1" fill="#3D2B1A" />
        {/* Lantern glow */}
        <ellipse cx="600" cy="238" rx="70" ry="55" fill="url(#lanternGlow)" className="lantern-pulse" />

        {/* Path line in clearing */}
        <path d="M600 480 Q600 460 598 440 Q596 420 600 400" stroke="#2A4A34" strokeWidth="3" strokeDasharray="8 6" opacity="0.5" />

        {/* Mist layer */}
        <rect x="0" y="380" width="1200" height="100" fill="#1C3028" opacity="0.5" className="mist-layer" />
      </svg>

      {/* Gord perched on lantern */}
      <GordPerched />

      <Particles />
    </div>
  );
}

/* ── Gord perched on the hero lantern ── */
function GordPerched() {
  const [headTurn, setHeadTurn] = useState(0);
  const [patrolX, setPatrolX] = useState(0);
  const [isPatrolling, setIsPatrolling] = useState(false);
  const [isStartled, setIsStartled] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [scrollDir, setScrollDir] = useState<"down" | "up" | null>(null);
  // 0 = normal, 1 = agitated (2nd startle), 2 = fed-up (3rd+ startle)
  const [startleLevel, setStartleLevel] = useState(0);
  // Ref mirrors isPatrolling so the idle interval callback always sees the current value
  const isPatrollingRef = useRef(false);
  const isStartledRef = useRef(false);
  const isSettlingRef = useRef(false);
  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollYRef = useRef(typeof window !== "undefined" ? window.scrollY : 0);
  // Consecutive startle tracking (resets ~3 s after last startle)
  const startleCountRef = useRef(0);
  const startleLevelRef = useRef(0);
  const startleResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only twitch head when idle — patrol controls head direction during movement
    const headTimer = setInterval(() => {
      if (isPatrollingRef.current) return;
      if (isStartledRef.current) return;
      setHeadTurn((p) => (p === 0 ? (Math.random() > 0.5 ? 8 : -8) : 0));
    }, 2800);
    return () => clearInterval(headTimer);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    function patrol() {
      timeout = setTimeout(() => {
        if (isStartledRef.current || isSettlingRef.current) {
          // Delay patrol start if Gord is currently startled or settling
          patrol();
          return;
        }
        // Full left-right-left (or right-left-right) pacing sequence
        const dist = 30 + Math.random() * 10; // 30–40 px per leg
        const firstDir = Math.random() > 0.5 ? 1 : -1;
        const step1 = dist * firstDir;
        const step2 = dist * -firstDir; // opposite direction

        // Leg 1: move in first direction, head faces that way
        isPatrollingRef.current = true;
        setIsPatrolling(true);
        setHeadTurn(firstDir > 0 ? 8 : -8);
        setPatrolX(step1);

        // Leg 2: move in opposite direction, head follows
        timeout = setTimeout(() => {
          setHeadTurn(firstDir > 0 ? -8 : 8);
          setPatrolX(step2);

          // Leg 3: return to centre, face forward
          timeout = setTimeout(() => {
            setPatrolX(0);
            setHeadTurn(0);
            timeout = setTimeout(() => {
              isPatrollingRef.current = false;
              setIsPatrolling(false);
              patrol();
            }, 1800);
          }, 2400);
        }, 2200);
      }, 8000 + Math.random() * 6000);
    }
    patrol();
    return () => clearTimeout(timeout);
  }, []);

  // Scroll → startled reaction (debounced, once per scroll burst)
  useEffect(() => {
    function handleScroll() {
      const currentY = window.scrollY;
      const dir: "down" | "up" = currentY >= lastScrollYRef.current ? "down" : "up";
      lastScrollYRef.current = currentY;

      // Clear any pending debounce so we fire once at the end of a burst
      if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
      scrollDebounceRef.current = setTimeout(() => {
        if (isStartledRef.current) return; // already reacting

        // Increment consecutive startle counter; reset it ~3 s after this startle
        if (startleResetRef.current) clearTimeout(startleResetRef.current);
        startleCountRef.current += 1;
        const level = Math.min(startleCountRef.current - 1, 2); // 0 | 1 | 2
        startleLevelRef.current = level;
        setStartleLevel(level);
        startleResetRef.current = setTimeout(() => {
          startleCountRef.current = 0;
          startleLevelRef.current = 0;
          setStartleLevel(0);
        }, 3000);

        isStartledRef.current = true;
        setScrollDir(dir);
        setIsStartled(true);
        // Directional head flick at level 0; escalate magnitude on repeat startles
        const headFlick = level === 0 ? 18 : level === 1 ? 28 : 35;
        setHeadTurn(dir === "down" ? headFlick : -headFlick);
        // After the hop lands, relax head then run a settling ruffle before resuming patrol
        const hopDuration = level === 0 ? 900 : level === 1 ? 1000 : 1100;
        setTimeout(() => {
          setHeadTurn(0);
          isStartledRef.current = false;
          setIsStartled(false);
          setScrollDir(null);
          // Settling phase: ruffle intensity scales with level
          isSettlingRef.current = true;
          setIsSettling(true);
          const settleDuration = level === 0 ? 420 : level === 1 ? 520 : 650;
          setTimeout(() => {
            isSettlingRef.current = false;
            setIsSettling(false);
          }, settleDuration);
        }, hopDuration);
      }, 120);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
      if (startleResetRef.current) clearTimeout(startleResetRef.current);
    };
  }, []);

  return (
    <motion.div
      className="gord-hero"
      animate={{ x: isPatrolling && !isStartled ? patrolX : 0 }}
      transition={{ type: "spring", stiffness: 60, damping: 16 }}
    >
      <motion.div
        animate={
          isStartled
            ? startleLevel === 0
              ? scrollDir === "down"
                ? { y: [0, -14, 4, -8, 1, 0], rotate: [0, 8, -3, 5, 0] }   // lean forward on scroll-down
                : { y: [0, -10, 6, -5, 1, 0], rotate: [0, -10, 4, -5, 0] } // pull back on scroll-up
              : startleLevel === 1
              ? { y: [0, -28, 6, -14, 3, 0],  rotate: [0, -7, 7, -3, 0] }
              : { y: [0, -38, 8, -18, 4, -2, 0], rotate: [0, -10, 10, -5, 2, 0] }
            : isSettling
            ? startleLevel === 0
              ? { scaleX: [1, 1.08, 0.96, 1.04, 1], scaleY: [1, 0.94, 1.06, 0.98, 1], rotate: [0, -2,  2, -1, 0] }
              : startleLevel === 1
              ? { scaleX: [1, 1.14, 0.92, 1.06, 1], scaleY: [1, 0.88, 1.10, 0.96, 1], rotate: [0, -4,  4, -2, 0] }
              : { scaleX: [1, 1.20, 0.88, 1.10, 1], scaleY: [1, 0.82, 1.14, 0.94, 1], rotate: [0, -6,  6, -3, 0] }
            : { y: [0, -5, 0] }
        }
        transition={
          isStartled
            ? { duration: startleLevel === 0 ? 0.7 : startleLevel === 1 ? 0.85 : 1.0, ease: "easeOut" }
            : isSettling
            ? { duration: startleLevel === 0 ? 0.42 : startleLevel === 1 ? 0.52 : 0.65, ease: "easeOut" }
            : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <motion.div
          animate={{ rotateY: headTurn }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
        >
          <GordBird size={72} variant="full" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ── Gord corner perch ── */
function GordPerch({ side = "right", size = 38 }: { side?: "left" | "right"; size?: number }) {
  const [headTilt, setHeadTilt] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setHeadTilt((p) => (p === 0 ? (Math.random() > 0.6 ? 10 : -7) : 0));
    }, 3400 + Math.random() * 1200);
    return () => clearInterval(t);
  }, []);
  return (
    <div
      className={`gord-corner-perch gord-corner-perch-${side} no-print`}
      aria-hidden="true"
      style={{ transform: side === "left" ? "scaleX(-1)" : undefined }}
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          animate={{ rotateY: side === "left" ? -headTilt : headTilt }}
          transition={{ type: "spring", stiffness: 180, damping: 14 }}
        >
          <GordBird size={size} variant="full" />
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ── Scroll-reveal hook ── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ── Trail Marker Signpost Nav ── */
const NAV_SECTIONS = [
  { id: "core-principles", label: "Core Principles", icon: "🌿" },
  { id: "family-lodge", label: "Family & Lodge", icon: "🏡" },
  { id: "threat-clearing", label: "Threat Clearing", icon: "🛡️" },
  { id: "satellite-drone", label: "Satellite & Drone", icon: "🛰️" },
  { id: "keepers-kit", label: "Keeper's Kit", icon: "🗂️" },
  { id: "battered-kit", label: "Duck Song Signal", icon: "🦆" },
  { id: "tools-workshop", label: "Tools & Workshop", icon: "🔧" },
  { id: "resources", label: "Resources", icon: "📜" },
];

function TrailNav() {
  const [active, setActive] = useState("");

  useEffect(() => {
    const sectionEls = NAV_SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { threshold: 0.3 }
    );
    sectionEls.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="trail-nav no-print" aria-label="Section navigation">
      <div className="trail-nav-post" aria-hidden="true" />
      {NAV_SECTIONS.map((s, i) => (
        <motion.button
          key={s.id}
          className={`trail-marker${active === s.id ? " trail-marker-active" : ""}`}
          onClick={() => scrollTo(s.id)}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08, type: "spring", stiffness: 180, damping: 20 }}
          aria-label={`Navigate to ${s.label}`}
        >
          <span className="trail-marker-icon" aria-hidden="true">{s.icon}</span>
          <span className="trail-marker-label">{s.label}</span>
        </motion.button>
      ))}
    </nav>
  );
}

/* ── Journal Card wrapper ── */
function JournalCard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <motion.div
      ref={ref}
      className={`journal-card ${className}`}
      initial={{ opacity: 0, y: 28 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/* ── Section Icon ── */
function SectionIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    clearing: (
      <svg viewBox="0 0 40 40" fill="none" width="36" height="36" aria-hidden="true">
        <circle cx="20" cy="20" r="14" stroke="#4A6741" strokeWidth="2" fill="none" />
        <path d="M20 10 Q24 16 20 20 Q16 16 20 10Z" fill="#4A6741" opacity="0.7" />
        <path d="M13 15 Q18 19 16 24 Q12 20 13 15Z" fill="#4A6741" opacity="0.5" />
        <path d="M27 15 Q22 19 24 24 Q28 20 27 15Z" fill="#4A6741" opacity="0.5" />
        <rect x="19" y="24" width="2" height="6" rx="1" fill="#6B4E2A" />
      </svg>
    ),
    lodge: (
      <svg viewBox="0 0 40 40" fill="none" width="36" height="36" aria-hidden="true">
        <path d="M20 8 L32 18 L32 34 L8 34 L8 18 Z" stroke="#4A6741" strokeWidth="2" fill="none" />
        <path d="M20 8 L32 18 L8 18 Z" fill="#4A6741" opacity="0.3" />
        <rect x="15" y="24" width="10" height="10" rx="1" stroke="#6B4E2A" strokeWidth="1.5" fill="none" />
        <circle cx="24" cy="29" r="1" fill="#6B4E2A" />
      </svg>
    ),
    shield: (
      <svg viewBox="0 0 40 40" fill="none" width="36" height="36" aria-hidden="true">
        <path d="M20 6 L32 11 L32 22 Q32 30 20 35 Q8 30 8 22 L8 11 Z" stroke="#4A6741" strokeWidth="2" fill="none" />
        <path d="M15 20 L19 24 L25 16" stroke="#4A6741" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    key: (
      <svg viewBox="0 0 40 40" fill="none" width="36" height="36" aria-hidden="true">
        <circle cx="16" cy="18" r="8" stroke="#C7613B" strokeWidth="2" fill="none" />
        <line x1="22" y1="22" x2="34" y2="30" stroke="#C7613B" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="30" y1="27" x2="30" y2="32" stroke="#C7613B" strokeWidth="2" strokeLinecap="round" />
        <line x1="26" y1="30" x2="26" y2="34" stroke="#C7613B" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    mailbox: (
      <svg viewBox="0 0 40 40" fill="none" width="36" height="36" aria-hidden="true">
        <rect x="6" y="14" width="28" height="18" rx="3" stroke="#4A6741" strokeWidth="2" fill="none" />
        <path d="M6 14 L20 24 L34 14" stroke="#4A6741" strokeWidth="2" strokeLinejoin="round" />
        <line x1="20" y1="6" x2="20" y2="14" stroke="#C7613B" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 3" />
      </svg>
    ),
    vpn: (
      <svg viewBox="0 0 40 40" fill="none" width="36" height="36" aria-hidden="true">
        <ellipse cx="20" cy="20" rx="14" ry="10" stroke="#4A6741" strokeWidth="2" fill="none" />
        <path d="M20 10 Q26 16 26 20 Q26 24 20 30" stroke="#4A6741" strokeWidth="1.5" fill="none" />
        <path d="M20 10 Q14 16 14 20 Q14 24 20 30" stroke="#4A6741" strokeWidth="1.5" fill="none" />
        <line x1="6" y1="20" x2="34" y2="20" stroke="#4A6741" strokeWidth="1.5" />
        <circle cx="30" cy="14" r="6" fill="#1C3020" stroke="#F5C842" strokeWidth="1.5" />
        <path d="M28 14 L30 16 L33 12" stroke="#F5C842" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    zone: (
      <svg viewBox="0 0 40 40" fill="none" width="36" height="36" aria-hidden="true">
        <circle cx="20" cy="20" r="6" fill="#4A6741" opacity="0.6" />
        <circle cx="20" cy="20" r="11" stroke="#4A6741" strokeWidth="1.5" fill="none" opacity="0.7" />
        <circle cx="20" cy="20" r="16" stroke="#4A6741" strokeWidth="1" fill="none" opacity="0.4" strokeDasharray="3 3" />
        <text x="20" y="24" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">0</text>
      </svg>
    ),
    scroll: (
      <svg viewBox="0 0 40 40" fill="none" width="36" height="36" aria-hidden="true">
        <path d="M10 8 Q8 8 8 10 L8 32 Q8 34 10 34 L30 34 Q32 34 32 32 L32 12 L26 6 L10 6 Q8 6 8 8Z" stroke="#4A6741" strokeWidth="2" fill="none" />
        <path d="M26 6 L26 12 L32 12" stroke="#4A6741" strokeWidth="1.5" />
        <line x1="13" y1="18" x2="27" y2="18" stroke="#4A6741" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="13" y1="22" x2="27" y2="22" stroke="#4A6741" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="13" y1="26" x2="21" y2="26" stroke="#4A6741" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  };
  return <>{icons[type] ?? null}</>;
}

/* ── Tip Callout ── */
function TipCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tip-callout">
      <span className="tip-quill" aria-hidden="true">✍</span>
      <p>{children}</p>
    </div>
  );
}

/* ── Editable Section (preserved functionality) ── */
function EditableSection({
  id, label, html, isEditing, onStartEdit, onSave, icon, showModified,
}: {
  id: string; label: string; html: string; isEditing: boolean;
  onStartEdit: () => void; onSave: (id: string, html: string) => void;
  icon?: string; showModified?: boolean;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const isModified = html !== DEFAULT_SECTIONS[id];

  useEffect(() => {
    if (isEditing && bodyRef.current) {
      bodyRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(bodyRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onSave(id, bodyRef.current?.innerHTML ?? html);
    }
  }

  function handleBlur() {
    if (!isEditing) return;
    onSave(id, bodyRef.current?.innerHTML ?? html);
  }

  return (
    <div className={`editable-section${isEditing ? " editable-section-active" : ""}`}>
      <div className="editable-section-header">
        {icon && <SectionIcon type={icon} />}
        <h3 className="journal-section-title">
          {label}
          {showModified && isModified && (
            <span className="modified-dot no-print" title="Customised" />
          )}
        </h3>
      </div>
      {/* Read view */}
      {!isEditing && (
        <p
          className="journal-section-body clickable-body no-print"
          onClick={onStartEdit}
          title="Click to edit"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
      {/* Print-only static copy */}
      <p className="journal-section-body print-only" dangerouslySetInnerHTML={{ __html: html }} />
      {/* Editable */}
      <div
        ref={bodyRef}
        className={`journal-section-body editable-body no-print${isEditing ? " editable-body-active" : ""}`}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        dangerouslySetInnerHTML={isEditing ? { __html: html } : undefined}
        style={{ display: isEditing ? undefined : "none" }}
      />
      {isEditing && (
        <span className="edit-hint no-print">Click away or press Esc to save</span>
      )}
    </div>
  );
}

/* ── Workshop Wall Tool Card ── */
function ToolCard({ name, tag, detail, highlight }: {
  name: string; tag: string; detail: string; highlight?: boolean;
}) {
  const { ref, visible } = useReveal();
  return (
    <motion.div
      ref={ref}
      className={`tool-card${highlight ? " tool-card-highlight" : ""}`}
      initial={{ opacity: 0, y: 16 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <div className="tool-peg" aria-hidden="true" />
      <div className="tool-card-inner">
        <span className="tool-name">{name}</span>
        <span className="tool-tag">{tag}</span>
        <span className="tool-detail">{detail}</span>
      </div>
    </motion.div>
  );
}

/* ── Nightfall Checklist ── */
function NightfallChecklist() {
  const [checked, setChecked] = useState<boolean[]>(loadChecklist);

  function toggle(i: number) {
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
      return next;
    });
  }

  const done = checked.filter(Boolean).length;

  return (
    <div className="nightfall-checklist">
      <div className="checklist-header">
        <span className="checklist-moon" aria-hidden="true">🌙</span>
        <div>
          <h4 className="checklist-title">Things to Secure Before Nightfall</h4>
          <p className="checklist-progress">{done} of {DEFAULT_CHECKLIST.length} secured</p>
        </div>
      </div>
      <ul className="checklist-list" role="list">
        {DEFAULT_CHECKLIST.map((item, i) => (
          <li key={i} className="checklist-item">
            <button
              className={`checklist-box${checked[i] ? " checklist-box-done" : ""}`}
              onClick={() => toggle(i)}
              aria-checked={checked[i]}
              role="checkbox"
              aria-label={item}
            >
              {checked[i] && (
                <motion.svg
                  viewBox="0 0 16 16"
                  fill="none"
                  width="12"
                  height="12"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <motion.path
                    d="M3 8 L7 12 L13 5"
                    stroke="#FAF6F0"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.25 }}
                  />
                </motion.svg>
              )}
            </button>
            <span className={`checklist-label${checked[i] ? " checklist-label-done" : ""}`}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Lantern Glow Divider ── */
function LanternDivider() {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className="lantern-divider" aria-hidden="true">
      <motion.div
        className="lantern-divider-line"
        initial={{ scaleX: 0 }}
        animate={visible ? { scaleX: 1 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <motion.span
        className="lantern-glyph"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={visible ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        🏮
      </motion.span>
      <motion.div
        className="lantern-divider-line"
        initial={{ scaleX: 0 }}
        animate={visible ? { scaleX: 1 } : {}}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
      />
    </div>
  );
}

/* ── Data Table (styled) ── */
function FieldTable({ heading, children, note }: { heading: string; children: React.ReactNode; note?: string }) {
  const { ref, visible } = useReveal();
  return (
    <motion.div
      ref={ref}
      className="field-table-wrap"
      initial={{ opacity: 0, y: 20 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <h4 className="field-table-heading">{heading}</h4>
      <div className="field-table-scroll">
        <table className="field-table">{children}</table>
      </div>
      {note && <p className="field-table-note">{note}</p>}
    </motion.div>
  );
}

/* ── Metaphor Key ── */
const METAPHORS = [
  { term: "The Clearing", def: "Your private Sandbox workspace" },
  { term: "The Lodge", def: "Your co-op Saltbox instance" },
  { term: "Zone 0", def: "Intimate, device-only space" },
  { term: "Zone 2", def: "Shared with trusted co-op families" },
  { term: "Covered wagon", def: "A VPN tunnel" },
  { term: "Key on the hook", def: "Your household passphrase" },
];

/* ── Floating Gord Tip ── */
function GordTip({ text, visible: show }: { text: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="gord-tip no-print"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 60 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
        >
          <div className="gord-tip-bubble">
            <span className="gord-tip-label">Gord's on Board!</span>
            <p className="gord-tip-text">{text}</p>
          </div>
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <GordBird size={54} variant="full" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Main App ── */
export default function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sections, setSections] = useState<Record<string, string>>(loadSections);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [gordTipSection, setGordTipSection] = useState<string | null>(null);
  const [communityName, setCommunityName] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || "";
    if (inputRef.current) inputRef.current.value = saved;
    setCommunityName(saved);
  }, []);

  function handleCommunityChange(e: React.ChangeEvent<HTMLInputElement>) {
    localStorage.setItem(STORAGE_KEY, e.target.value);
    setCommunityName(e.target.value);
  }

  const handleSectionSave = useCallback((id: string, html: string) => {
    const next = { ...sections, [id]: html.trim() };
    setSections(next);
    saveSections(next);
    setEditingId(null);
  }, [sections]);

  function handleReset() {
    setSections({ ...DEFAULT_SECTIONS });
    localStorage.removeItem(SECTIONS_KEY);
    setEditingId(null);
  }

  const isCustomized = Object.keys(DEFAULT_SECTIONS).some((k) => sections[k] !== DEFAULT_SECTIONS[k]);

  /* Gord tip triggers on section scroll */
  useEffect(() => {
    const tips: Record<string, string> = {
      "core-principles": "Zone 0 is sacred — keep the personal stuff in The Clearing!",
      "tools-workshop": "Mullvad & ProtonVPN are the trail-tested choices. Both accept cash!",
      "threat-clearing": "A good VPN is like a covered wagon — nobody sees what's inside.",
    };
    const sectionIds = Object.keys(tips);
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          setGordTipSection(e.target.id);
          setTimeout(() => setGordTipSection(null), 5000);
        }
      }
    }, { threshold: 0.5 });
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const gordTips: Record<string, string> = {
    "core-principles": "Zone 0 is sacred — keep the personal stuff in The Clearing. Your Privacy Kit starts here!",
    "tools-workshop": "Mullvad & ProtonVPN are the trail-tested choices. Both accept cash!",
    "threat-clearing": "A good VPN is like a covered wagon — nobody sees what's inside.",
  };

  return (
    <>
      {/* ── Fixed header ── */}
      <header className="site-header no-print">
        <div className="site-header-inner">
          <div className="site-header-brand">
            <span className="site-header-title">Privacy Kit</span>
            <span className="site-header-sub">Clearing &amp; Lodge Privacy Guide</span>
          </div>
          <div className="site-header-controls">
            {isCustomized && (
              <button className="reset-btn" onClick={handleReset}>Reset to defaults</button>
            )}
            <div className="community-field">
              <label className="community-label" htmlFor="community-input">Community</label>
              <input
                id="community-input"
                ref={inputRef}
                className="community-input"
                type="text"
                placeholder="Your community name"
                onChange={handleCommunityChange}
                maxLength={40}
                aria-label="Community name"
              />
            </div>
            <button className="print-btn" onClick={() => window.print()} aria-label="Print or save as PDF">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <rect x="2" y="9" width="10" height="4" rx="0.75" stroke="currentColor" strokeWidth="1.2" />
                <rect x="3.5" y="1" width="7" height="6" rx="0.75" stroke="currentColor" strokeWidth="1.2" />
                <path d="M3.5 11H2a.75.75 0 0 1-.75-.75V6.25A.75.75 0 0 1 2 5.5h10a.75.75 0 0 1 .75.75v4A.75.75 0 0 1 12 11h-1.5" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="10.5" cy="7.5" r="0.6" fill="currentColor" />
              </svg>
              Print / Save PDF
            </button>
          </div>
        </div>
      </header>

      {/* ── Print header (shows only on print) ── */}
      <header className="print-header print-only">
        {communityName && (
          <span className="print-header-community">{communityName}</span>
        )}
        <span className="print-header-title">Privacy Kit — Clearing &amp; Lodge Privacy Guide</span>
        <span className="print-header-sub">Homeschool Digital Handbook</span>
      </header>

      {/* ── Hero ── */}
      <section className="hero-section no-print" aria-label="Privacy on the Stomping Path">
        <DuskScene />
        <div className="hero-content">
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          >
            Privacy Kit
          </motion.h1>
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7, ease: "easeOut" }}
          >
            Your family's digital perimeter — keeping what you build at home private, so your self-reliance work stays yours
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="hero-scroll-hint"
            aria-hidden="true"
          >
            <span>Walk the trail ↓</span>
          </motion.div>
        </div>
      </section>

      {/* ── Trail nav ── */}
      <TrailNav />

      {/* ── Kit intro ── */}
      <div className="kit-intro">
        <div className="kit-intro-inner">
          <div className="kit-intro-gord no-print">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <GordBird size={52} variant="full" />
            </motion.div>
          </div>
          <div className="kit-intro-text">
            <p className="kit-intro-welcome">Your family's digital homestead starts here.</p>
            <p className="kit-intro-body">
              The Privacy Kit is a core self-reliance tool — the same discipline that keeps your pantry stocked and your land held, applied to your family's digital perimeter. Work through the five trails at your own pace: Zone 0 (your private Clearing), the Lodge (your co-op), key habits, the covered-wagon VPN route, and the legal landscape. Every step keeps the gate closed by default, so the sovereignty work your household is doing stays inside the watershed.
            </p>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="trail-content">

        {/* ══ Section 1: Core Principles ══ */}
        <section id="core-principles" className="trail-section">
          <div className="section-signpost">
            <span className="signpost-emoji" aria-hidden="true">🌿</span>
            <h2 className="signpost-title">Core Principles</h2>
          </div>

          <div className="journal-grid journal-grid-2">
            <JournalCard delay={0}>
              <EditableSection
                id="the-clearing"
                label="The Clearing"
                html={sections["the-clearing"]}
                isEditing={editingId === "the-clearing"}
                onStartEdit={() => setEditingId("the-clearing")}
                onSave={handleSectionSave}
                icon="clearing"
                showModified
              />
            </JournalCard>

            <JournalCard delay={0.1}>
              <EditableSection
                id="the-lodge"
                label="The Lodge"
                html={sections["the-lodge"]}
                isEditing={editingId === "the-lodge"}
                onStartEdit={() => setEditingId("the-lodge")}
                onSave={handleSectionSave}
                icon="lodge"
                showModified
              />
            </JournalCard>
          </div>

          <div className="gord-perch-wrapper">
            <GordPerch side="right" size={40} />
            <JournalCard delay={0.15}>
              <EditableSection
                id="zone-identity"
                label="Zone Identity"
                html={sections["zone-identity"]}
                isEditing={editingId === "zone-identity"}
                onStartEdit={() => setEditingId("zone-identity")}
                onSave={handleSectionSave}
                icon="zone"
                showModified
              />
              <TipCallout>
                Zone 0 = your hearth. Zone 2 = the co-op noticeboard. Never mix them.
              </TipCallout>
            </JournalCard>
          </div>

          {/* What's stored where table */}
          <FieldTable
            heading="What's Stored Where"
            note="Zone 0 material belongs in The Clearing — never in The Lodge."
          >
            <thead>
              <tr>
                <th className="ft-th ft-th-label"></th>
                <th className="ft-th ft-th-terracotta">Clearing</th>
                <th className="ft-th ft-th-moss">Lodge</th>
                <th className="ft-th ft-th-brown">Cloud</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="ft-row-label">Notes &amp; drafts</td><td className="ft-check">Your device</td><td className="ft-no">No</td><td className="ft-no">No</td></tr>
              <tr><td className="ft-row-label">Posts &amp; replies</td><td className="ft-no">No</td><td className="ft-check">Co-op server</td><td className="ft-no">No</td></tr>
              <tr><td className="ft-row-label">Direct messages</td><td className="ft-no">No</td><td className="ft-check">Co-op server</td><td className="ft-no">No</td></tr>
              <tr><td className="ft-row-label">Enrolment info</td><td className="ft-no">No</td><td className="ft-check">Co-op server</td><td className="ft-no">No</td></tr>
              <tr><td className="ft-row-label">Curriculum files</td><td className="ft-check">Your device</td><td className="ft-opt">Optional</td><td className="ft-no">No</td></tr>
            </tbody>
          </FieldTable>
        </section>

        <LanternDivider />

        {/* ══ Section 2: Family & Lodge Protection ══ */}
        <section id="family-lodge" className="trail-section">
          <div className="section-signpost">
            <span className="signpost-emoji" aria-hidden="true">🏡</span>
            <h2 className="signpost-title">Family &amp; Lodge Protection</h2>
          </div>

          <div className="journal-grid journal-grid-2">
            <JournalCard delay={0}>
              <EditableSection
                id="the-key"
                label="The Key on the Hook"
                html={sections["the-key"]}
                isEditing={editingId === "the-key"}
                onStartEdit={() => setEditingId("the-key")}
                onSave={handleSectionSave}
                icon="key"
                showModified
              />
            </JournalCard>

            <JournalCard delay={0.1}>
              <EditableSection
                id="the-mailbox"
                label="The Mailbox"
                html={sections["the-mailbox"]}
                isEditing={editingId === "the-mailbox"}
                onStartEdit={() => setEditingId("the-mailbox")}
                onSave={handleSectionSave}
                icon="mailbox"
                showModified
              />
            </JournalCard>
          </div>

          <JournalCard delay={0.15}>
            <EditableSection
              id="three-habits"
              label="Three Simple Habits"
              html={sections["three-habits"]}
              isEditing={editingId === "three-habits"}
              onStartEdit={() => setEditingId("three-habits")}
              onSave={handleSectionSave}
              icon="shield"
              showModified
            />
            <TipCallout>
              Two minutes of auto-lock keeps The Clearing closed when you step away.
            </TipCallout>
          </JournalCard>

          {/* Nightfall Checklist */}
          <div className="gord-perch-wrapper">
            <GordPerch side="left" size={36} />
            <JournalCard delay={0.2}>
              <NightfallChecklist />
            </JournalCard>
          </div>
        </section>

        <LanternDivider />

        {/* ══ Section 3: Threat Clearing ══ */}
        <section id="threat-clearing" className="trail-section">
          <div className="section-signpost">
            <span className="signpost-emoji" aria-hidden="true">🛡️</span>
            <h2 className="signpost-title">Threat Clearing</h2>
          </div>

          <div className="gord-perch-wrapper">
            <GordPerch side="right" size={34} />
            <JournalCard delay={0}>
              <EditableSection
                id="covered-wagon"
                label="The Covered Wagon Route"
                html={sections["covered-wagon"]}
                isEditing={editingId === "covered-wagon"}
                onStartEdit={() => setEditingId("covered-wagon")}
                onSave={handleSectionSave}
                icon="vpn"
                showModified
              />
              <TipCallout>
                Choose a VPN with a jurisdiction outside the Five Eyes alliance for best privacy.
              </TipCallout>
            </JournalCard>
          </div>
        </section>

        <LanternDivider />

        <SatelliteDroneSection />

        <LanternDivider />

        <KeepersKitSection />

        <LanternDivider />

        <BatteredKitSection />

        <LanternDivider />

        {/* ══ Section 4: Tools & Workshop ══ */}
        <section id="tools-workshop" className="trail-section">
          <div className="section-signpost">
            <span className="signpost-emoji" aria-hidden="true">🔧</span>
            <h2 className="signpost-title">Tools &amp; Workshop</h2>
          </div>

          <div className="workshop-wall-heading">
            <h3 className="workshop-wall-title">VPN Providers — Hanging on the Wall</h3>
            <p className="workshop-wall-sub">Tested tools for the trail. Highlighted rows carry independently audited no-log policies.</p>
          </div>

          <div className="workshop-wall">
            <ToolCard name="Mullvad" tag="Sweden · 5 devices" detail="Audited no-log · Accepts cash" highlight />
            <ToolCard name="ProtonVPN" tag="Switzerland · 10 devices" detail="Audited no-log · Open source" highlight />
            <ToolCard name="IVPN" tag="Gibraltar · 7 devices" detail="Audited no-log · Privacy-first" />
            <ToolCard name="Windscribe" tag="Canada · Unlimited" detail="Partial audit · Free tier" />
          </div>

          <FieldTable
            heading="VPN Provider Comparison"
            note="Shaded rows have independently audited no-log policies."
          >
            <thead>
              <tr>
                <th className="ft-th ft-th-label">Provider</th>
                <th className="ft-th ft-th-moss">No-log audit</th>
                <th className="ft-th ft-th-moss">Jurisdiction</th>
                <th className="ft-th ft-th-moss">Family plan</th>
              </tr>
            </thead>
            <tbody>
              <tr className="ft-row-highlight"><td className="ft-row-label">Mullvad</td><td className="ft-check">Yes</td><td className="ft-neutral">Sweden</td><td className="ft-neutral">5 devices</td></tr>
              <tr className="ft-row-highlight"><td className="ft-row-label">ProtonVPN</td><td className="ft-check">Yes</td><td className="ft-neutral">Switzerland</td><td className="ft-neutral">10 devices</td></tr>
              <tr><td className="ft-row-label">IVPN</td><td className="ft-check">Yes</td><td className="ft-neutral">Gibraltar</td><td className="ft-neutral">7 devices</td></tr>
              <tr><td className="ft-row-label">Windscribe</td><td className="ft-neutral">Partial</td><td className="ft-neutral">Canada</td><td className="ft-neutral">Unlimited</td></tr>
            </tbody>
          </FieldTable>

          <div className="workshop-wall-heading" style={{ marginTop: "2.5rem" }}>
            <h3 className="workshop-wall-title">Recommended Hardware — Off the Peg</h3>
            <p className="workshop-wall-sub">Pre-configured devices, ready for the trail.</p>
          </div>

          <div className="workshop-wall">
            <ToolCard name="Above Phone Pixel 10" tag="GrapheneOS · takebackourtech.org" detail="Google-free · Pre-configured" highlight />
            <ToolCard name="Above Phone Pixel 9" tag="GrapheneOS · takebackourtech.org" detail="Google-free · Pre-configured" highlight />
            <ToolCard name="DIY: Pixel + GrapheneOS" tag="grapheneos.org" detail="Google-free · Self-installed" />
          </div>

          <FieldTable
            heading="Recommended Hardware"
            note="Shaded rows are pre-configured and ready to use. GrapheneOS passes reCAPTCHA scanning; standard de-Googled builds may require a workaround for QR-based CAPTCHAs."
          >
            <thead>
              <tr>
                <th className="ft-th ft-th-label">Device</th>
                <th className="ft-th ft-th-moss">OS</th>
                <th className="ft-th ft-th-moss">Google-free</th>
                <th className="ft-th ft-th-moss">Source</th>
              </tr>
            </thead>
            <tbody>
              <tr className="ft-row-highlight"><td className="ft-row-label">Above Phone Pixel 10</td><td className="ft-check">GrapheneOS</td><td className="ft-check">Yes</td><td className="ft-neutral">takebackourtech.org</td></tr>
              <tr className="ft-row-highlight"><td className="ft-row-label">Above Phone Pixel 9</td><td className="ft-check">GrapheneOS</td><td className="ft-check">Yes</td><td className="ft-neutral">takebackourtech.org</td></tr>
              <tr><td className="ft-row-label">DIY: Pixel + GrapheneOS</td><td className="ft-check">GrapheneOS</td><td className="ft-check">Yes</td><td className="ft-neutral">grapheneos.org</td></tr>
            </tbody>
          </FieldTable>
        </section>

        <LanternDivider />

        {/* ══ Section 5: Resources ══ */}
        <section id="resources" className="trail-section">
          <div className="section-signpost">
            <span className="signpost-emoji" aria-hidden="true">📜</span>
            <h2 className="signpost-title">Resources</h2>
          </div>

          <div className="journal-grid journal-grid-2">
            <JournalCard delay={0}>
              <EditableSection
                id="legal-landscape"
                label="The Canadian Legal Landscape"
                html={sections["legal-landscape"]}
                isEditing={editingId === "legal-landscape"}
                onStartEdit={() => setEditingId("legal-landscape")}
                onSave={handleSectionSave}
                icon="scroll"
                showModified
              />
            </JournalCard>

            <JournalCard delay={0.1}>
              <div className="editable-section-header">
                <SectionIcon type="lodge" />
                <h3 className="journal-section-title">Metaphor Key</h3>
              </div>
              <dl className="metaphor-list">
                {METAPHORS.map(({ term, def }) => (
                  <div key={term} className="metaphor-row">
                    <dt>{term}</dt>
                    <dd>{def}</dd>
                  </div>
                ))}
              </dl>
            </JournalCard>
          </div>

          <JournalCard delay={0.15} className="questions-card">
            <div className="questions-inner">
              <div>
                <h3 className="journal-section-title">Questions?</h3>
                <p className="journal-section-body">
                  Bring concerns to your co-op privacy steward at the next gathering,
                  or send a Signal message to the coordinator. For escalations, contact
                  the Office of the Privacy Commissioner of Canada.
                </p>
                <p className="questions-contact">
                  <strong>priv.gc.ca</strong> &nbsp;·&nbsp; 1-800-282-1376
                </p>
              </div>
              <div className="questions-gord no-print">
                <GordBird size={60} variant="full" />
              </div>
            </div>
          </JournalCard>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-message">
            <h2 className="footer-title">A secure family is a sovereign family.</h2>
            <p className="footer-sub">Privacy is Zone 0 stewardship — close the gate on your digital homestead before you build the rest of the watershed.</p>
          </div>
          <nav className="footer-links no-print" aria-label="Next steps">
            <a href="https://mullvad.net" target="_blank" rel="noopener noreferrer" className="footer-link">Get Mullvad VPN</a>
            <a href="https://grapheneos.org" target="_blank" rel="noopener noreferrer" className="footer-link">GrapheneOS</a>
            <a href="https://priv.gc.ca" target="_blank" rel="noopener noreferrer" className="footer-link">Privacy Commissioner</a>
          </nav>
          <p className="footer-disclaimer">
            This guide provides general privacy information for homeschool and homestead families and does not constitute legal advice.
            Consult a qualified privacy professional for advice specific to your situation. Prepared for The Clearing &amp; The Lodge communities.
          </p>
        </div>
      </footer>

      {/* ── Gord Tip Overlay ── */}
      <GordTip
        text={gordTips[gordTipSection ?? ""] ?? ""}
        visible={gordTipSection !== null && Boolean(gordTips[gordTipSection])}
      />
    </>
  );
}
