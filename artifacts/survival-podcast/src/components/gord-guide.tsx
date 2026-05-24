import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Footprints } from "lucide-react";
import { GordBird, type IdleAnim } from "./gord-bird";
import { TrailblazerChat } from "./trailblazer-chat";
import {
  routeKeyFromPath,
  getCurrentGordTip,
  advanceGordVariant,
  hasSeenAllVariants,
  gordTips,
  type GordRouteKey,
} from "@/lib/gord-tips";

interface GordGuideProps {
  path: string;
}

function useEyeTarget(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [eyeTarget, setEyeTarget] = useState({ dx: 0, dy: 0 });
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rawDx = e.clientX - cx;
      const rawDy = e.clientY - cy;
      const dist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
      if (dist < 1) return;
      const maxDist = 280;
      const factor = Math.min(dist, maxDist) / maxDist;
      setEyeTarget({ dx: (rawDx / dist) * factor, dy: (rawDy / dist) * factor });
    });
  }, [containerRef]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [handleMouseMove]);

  return eyeTarget;
}

const FULL_ANIMS: IdleAnim[] = ["head-tilt", "tail-fan", "wing-ruffle"];
const HEAD_ANIMS: IdleAnim[] = ["head-tilt", "head-bob"];
const ANIM_DURATION_MS = 1400;

function useIdleAnimation(paused: boolean, variant: "full" | "head"): IdleAnim {
  const [anim, setAnim] = useState<IdleAnim>(null);
  const pausedRef = useRef(paused);
  const variantRef = useRef(variant);
  pausedRef.current = paused;
  variantRef.current = variant;

  useEffect(() => {
    let cycleTimeout: ReturnType<typeof setTimeout>;
    let clearAnim: ReturnType<typeof setTimeout>;

    function runCycle() {
      const delay = 8000 + Math.random() * 7000;
      cycleTimeout = setTimeout(() => {
        if (pausedRef.current) {
          runCycle();
          return;
        }
        const pool = variantRef.current === "full" ? FULL_ANIMS : HEAD_ANIMS;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        setAnim(pick);
        clearAnim = setTimeout(() => {
          setAnim(null);
          runCycle();
        }, ANIM_DURATION_MS);
      }, delay);
    }

    runCycle();
    return () => {
      clearTimeout(cycleTimeout);
      clearTimeout(clearAnim);
    };
  }, []);

  return anim;
}

export function GordGuide({ path }: GordGuideProps) {
  const [routeKey, setRouteKey] = useState<GordRouteKey | null>(null);
  const [tip, setTip] = useState<{ heading: string; body: string } | null>(null);
  const [visible, setVisible] = useState(false);
  const [perchVisible, setPerchVisible] = useState(false);
  const [tipHovered, setTipHovered] = useState(false);
  const [gordHovered, setGordHovered] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const guideBirdRef = useRef<HTMLDivElement>(null);
  const perchBirdRef = useRef<HTMLDivElement>(null);

  const activeRef = visible ? guideBirdRef : perchBirdRef;
  const eyeTarget = useEyeTarget(activeRef);

  const currentVariant: "full" | "head" = visible ? "full" : "head";
  const idleAnim = useIdleAnimation(tipHovered, currentVariant);

  useEffect(() => {
    const key = routeKeyFromPath(path);
    setRouteKey(key);

    if (!key) {
      setVisible(false);
      setPerchVisible(false);
      return;
    }

    const allSeen = hasSeenAllVariants(key);
    if (!allSeen) {
      const currentTip = getCurrentGordTip(key);
      setTip(currentTip);
      const timer = setTimeout(() => {
        setVisible(true);
        setPerchVisible(false);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      setPerchVisible(true);
    }
  }, [path]);

  function dismiss() {
    if (routeKey) {
      advanceGordVariant(routeKey);
    }
    setVisible(false);
    setTipHovered(false);
    setGordHovered(false);
    setTimeout(() => setPerchVisible(true), 400);
  }

  function recall() {
    if (!routeKey) return;
    const freshTip = getCurrentGordTip(routeKey);
    if (freshTip) {
      setTip(freshTip);
    } else {
      const variants = gordTips[routeKey];
      const lastTip = variants[variants.length - 1] ?? null;
      setTip(lastTip);
    }
    setPerchVisible(false);
    setVisible(true);
  }

  if (!routeKey) return null;

  return (
    <>
      {/* Trailblazer chat panel */}
      <AnimatePresence>
        {chatOpen && (
          <div className="fixed bottom-4 right-4 z-[70]">
            <TrailblazerChat onClose={() => setChatOpen(false)} />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {visible && tip && !chatOpen && (
          <motion.div
            key="gord-guide"
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 140, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="fixed bottom-24 right-4 z-[60] flex flex-col items-end gap-2 pointer-events-none"
            style={{ maxWidth: "calc(100vw - 2rem)" }}
          >
            {/* Tip bubble — hovering = actively reading, pauses idle anim */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 24 }}
              onMouseEnter={() => setTipHovered(true)}
              onMouseLeave={() => setTipHovered(false)}
              className="pointer-events-auto relative bg-[#FDF6EC] border border-[#D9A066]/60 rounded-2xl shadow-xl px-4 py-3 max-w-[280px] sm:max-w-[320px]"
            >
              <div
                className="absolute bottom-[-10px] right-12 w-0 h-0"
                style={{
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderTop: "10px solid #FDF6EC",
                  filter: "drop-shadow(0 2px 1px rgba(0,0,0,0.08))",
                }}
              />
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#D9A066]">
                  Gord&rsquo;s on Board!
                </p>
                <button
                  onClick={dismiss}
                  className="text-[#8B6F47]/60 hover:text-[#8B6F47] transition-colors shrink-0 -mt-0.5 pointer-events-auto"
                  aria-label="Dismiss Gord"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-sm font-semibold text-[#2C1810] leading-snug mb-1">
                {tip.heading}
              </p>
              <p className="text-xs text-[#5A3E2B]/80 leading-relaxed mb-3">
                {tip.body}
              </p>
              <button
                onClick={() => setChatOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 pointer-events-auto"
                style={{ background: "#C4622D", color: "#FDFBF7" }}
              >
                <Footprints className="w-3 h-3" />
                Chat with the Trailblazer
              </button>
            </motion.div>

            <motion.div
              ref={guideBirdRef}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-auto"
              onMouseEnter={() => setGordHovered(true)}
              onMouseLeave={() => setGordHovered(false)}
            >
              <GordBird size={90} variant="full" eyeTarget={eyeTarget} idleAnim={idleAnim} hovered={gordHovered} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {perchVisible && !visible && !chatOpen && (
          <motion.button
            key="gord-perch"
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            onClick={recall}
            aria-label="Recall Gord"
            className="fixed bottom-24 right-0 z-[60] flex items-center cursor-pointer group"
            style={{ transform: "translateX(8px)" }}
          >
            <motion.div
              whileHover={{ x: -6 }}
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
              className="flex items-center"
            >
              <div className="bg-[#FDF6EC] border border-[#D9A066]/50 rounded-l-xl shadow-md px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mr-1 shrink-0">
                <span className="text-[10px] font-bold text-[#D9A066] whitespace-nowrap">Gord&rsquo;s on Board</span>
              </div>
              <motion.div
                ref={perchBirdRef}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                onMouseEnter={() => setGordHovered(true)}
                onMouseLeave={() => setGordHovered(false)}
              >
                <GordBird size={44} variant="head" className="shrink-0" eyeTarget={eyeTarget} idleAnim={idleAnim} hovered={gordHovered} />
              </motion.div>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
