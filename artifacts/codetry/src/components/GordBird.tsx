import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GordBirdProps {
  size?: number;
  className?: string;
  variant?: "full" | "head";
  eyeTarget?: { dx: number; dy: number };
}

export function GordBird({ size = 120, className = "", variant = "full", eyeTarget }: GordBirdProps) {
  const ex = eyeTarget?.dx ?? 0;
  const ey = eyeTarget?.dy ?? 0;

  if (variant === "head") {
    const s = size;
    const px = ex * 1.2;
    const py = ey * 0.8;
    return (
      <svg
        width={s}
        height={s}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <ellipse cx="30" cy="28" rx="18" ry="20" fill="#8B6F47" />
        <ellipse cx="30" cy="24" rx="13" ry="14" fill="#C4965A" />
        <ellipse cx="24" cy="20" rx="4.5" ry="5" fill="white" />
        <ellipse cx="36" cy="20" rx="4.5" ry="5" fill="white" />
        <circle cx={24 + px} cy={21 + py} r="3" fill="#2C1810" />
        <circle cx={36 + px} cy={21 + py} r="3" fill="#2C1810" />
        <circle cx={25 + px} cy={20 + py} r="1" fill="white" />
        <circle cx={37 + px} cy={20 + py} r="1" fill="white" />
        <polygon points="30,28 24,35 36,35" fill="#E8B97F" stroke="#6B4E2A" strokeWidth="1.5" />
        <polygon points="30,33.5 26,37 34,37" fill="#D9A066" stroke="#6B4E2A" strokeWidth="1" />
        <line x1="30" y1="28" x2="30" y2="35" stroke="#6B4E2A" strokeWidth="1" />
        <ellipse cx="19" cy="14" rx="5" ry="8" fill="#C4965A" transform="rotate(-20 19 14)" />
        <ellipse cx="41" cy="14" rx="5" ry="8" fill="#C4965A" transform="rotate(20 41 14)" />
        <ellipse cx="19" cy="13" rx="3" ry="5" fill="#8B6F47" transform="rotate(-20 19 13)" />
        <ellipse cx="41" cy="13" rx="3" ry="5" fill="#8B6F47" transform="rotate(20 41 13)" />
      </svg>
    );
  }

  const px = ex * 1.8;
  const py = ey * 1.2;
  return (
    <svg
      width={size}
      height={Math.round(size * 1.8)}
      viewBox="0 0 100 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="50" cy="155" rx="22" ry="6" fill="#6B4E2A" opacity="0.3" />
      <line x1="38" y1="145" x2="28" y2="162" stroke="#8B6F47" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="62" y1="145" x2="72" y2="162" stroke="#8B6F47" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="28" y1="162" x2="18" y2="158" stroke="#8B6F47" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="28" y1="162" x2="24" y2="168" stroke="#8B6F47" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="28" y1="162" x2="32" y2="169" stroke="#8B6F47" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="72" y1="162" x2="82" y2="158" stroke="#8B6F47" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="72" y1="162" x2="76" y2="168" stroke="#8B6F47" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="72" y1="162" x2="68" y2="169" stroke="#8B6F47" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="42" y="110" width="16" height="38" rx="6" fill="#8B6F47" />
      <ellipse cx="50" cy="108" rx="24" ry="18" fill="#8B6F47" />
      <ellipse cx="50" cy="106" rx="19" ry="15" fill="#C4965A" />
      <path d="M26 105 Q14 98 16 88 Q18 78 26 85" fill="#8B6F47" stroke="#6B4E2A" strokeWidth="1" />
      <path d="M74 105 Q86 98 84 88 Q82 78 74 85" fill="#8B6F47" stroke="#6B4E2A" strokeWidth="1" />
      <ellipse cx="50" cy="68" rx="20" ry="22" fill="#C4965A" />
      <ellipse cx="43" cy="62" rx="6" ry="7" fill="white" />
      <ellipse cx="57" cy="62" rx="6" ry="7" fill="white" />
      <circle cx={43 + px} cy={63 + py} r="4.5" fill="#2C1810" />
      <circle cx={57 + px} cy={63 + py} r="4.5" fill="#2C1810" />
      <circle cx={44.5 + px} cy={61.5 + py} r="1.5" fill="white" />
      <circle cx={58.5 + px} cy={61.5 + py} r="1.5" fill="white" />
      <polygon points="50,70 43,79 57,79" fill="#E8B97F" stroke="#6B4E2A" strokeWidth="2" />
      <polygon points="50,77 45,82 55,82" fill="#D9A066" stroke="#6B4E2A" strokeWidth="1.2" />
      <line x1="50" y1="70" x2="50" y2="79" stroke="#6B4E2A" strokeWidth="1.2" />
      <ellipse cx="34" cy="50" rx="7" ry="11" fill="#C4965A" transform="rotate(-15 34 50)" />
      <ellipse cx="66" cy="50" rx="7" ry="11" fill="#C4965A" transform="rotate(15 66 50)" />
      <ellipse cx="34" cy="49" rx="4" ry="7" fill="#8B6F47" transform="rotate(-15 34 49)" />
      <ellipse cx="66" cy="49" rx="4" ry="7" fill="#8B6F47" transform="rotate(15 66 49)" />
      <circle cx="38" cy="56" r="2" fill="#D9A066" opacity="0.6" />
      <circle cx="62" cy="56" r="2" fill="#D9A066" opacity="0.6" />
    </svg>
  );
}

export function FlyingGord() {
  const [visible, setVisible] = useState(false);
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");

  useEffect(() => {
    const scheduleNext = () => {
      const delay = 45000 + Math.random() * 45000;
      return setTimeout(() => {
        setDirection(Math.random() > 0.5 ? "ltr" : "rtl");
        setVisible(true);
        setTimeout(() => {
          setVisible(false);
          scheduleNext();
        }, 3200);
      }, delay);
    };
    const t = scheduleNext();
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-24 z-40 pointer-events-none"
          initial={{ x: direction === "ltr" ? -120 : "calc(100vw + 120px)", opacity: 1 }}
          animate={{ x: direction === "ltr" ? "calc(100vw + 120px)" : -120, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3, ease: "linear" }}
        >
          <motion.div
            animate={{ y: [0, -10, 0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
            style={{ transform: direction === "rtl" ? "scaleX(-1)" : undefined }}
          >
            <GordBird size={56} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
