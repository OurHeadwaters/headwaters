import React from "react";
import { Link } from "wouter";
import { motion, type Variants } from "framer-motion";
import { GordBird } from "@/components/GordBird";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

export default function ForgeHero({ onEnterForge }: { onEnterForge: () => void }) {
  return (
    <section className="relative w-full min-h-[70vh] flex flex-col items-center justify-center text-center overflow-hidden pt-28 pb-16 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A180A] via-[#0E2210] to-[#111B0F]" />

      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 60%, rgba(217,160,102,0.08) 0%, transparent 70%)",
        }}
      />

      <motion.div
        className="relative z-10 max-w-4xl mx-auto space-y-6"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div variants={fadeInUp} className="flex justify-center mb-2">
          <span className="text-xs font-bold tracking-widest text-[#D9A066] uppercase bg-[#D9A066]/10 border border-[#D9A066]/20 px-3 py-1 rounded-full">
            The Forge — Word Playground
          </span>
        </motion.div>

        <motion.div variants={fadeInUp} className="relative inline-block">
          <svg
            viewBox="0 0 520 90"
            className="w-full max-w-2xl mx-auto mb-2"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="forgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D9A066" />
                <stop offset="50%" stopColor="#F0C07A" />
                <stop offset="100%" stopColor="#C07840" />
              </linearGradient>
            </defs>
            <path d="M20 70 L40 20 L60 55 L80 10 L100 50 L120 30 L140 60" stroke="#4A8C5C" strokeWidth="1.5" fill="none" opacity="0.5" />
            <circle cx="80" cy="10" r="3" fill="#4A8C5C" opacity="0.6" />
            <circle cx="140" cy="60" r="2" fill="#D9A066" opacity="0.5" />
            <rect x="380" y="30" width="28" height="32" rx="3" fill="#3D2810" stroke="#8B6030" strokeWidth="1.5" />
            <rect x="386" y="26" width="16" height="6" rx="2" fill="#8B6030" />
            <ellipse cx="394" cy="62" rx="10" ry="4" fill="#D9A066" opacity="0.4" />
            <path d="M390 55 Q394 45 398 55" stroke="#D9A066" strokeWidth="1.5" fill="none" opacity="0.6" />
            <line x1="430" y1="72" x2="480" y2="72" stroke="#6B4E2A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="450" y1="40" x2="450" y2="72" stroke="#6B4E2A" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="450" cy="36" rx="12" ry="8" fill="#4A8C5C" opacity="0.4" />
          </svg>

          <h1 className="text-5xl md:text-7xl font-serif font-medium text-[#FEFDFC] leading-tight tracking-tight">
            CodeTry{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #D9A066 0%, #F0C07A 50%, #C07840 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Forge
            </span>
          </h1>

          <div className="absolute -right-4 md:-right-10 top-0 hidden md:block">
            <motion.div
              animate={{ rotate: [0, -3, 3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <GordBird size={72} variant="full" eyeTarget={{ dx: -0.3, dy: 0.1 }} />
            </motion.div>
          </div>
        </motion.div>

        <motion.p
          variants={fadeInUp}
          className="text-lg md:text-xl text-[#C4B49A] max-w-2xl mx-auto leading-relaxed"
        >
          Build it yourself. Own it forever. Start from where you are.
        </motion.p>
        <motion.p
          variants={fadeInUp}
          className="text-sm text-[#8A9E8A] max-w-xl mx-auto leading-relaxed -mt-2"
        >
          The method for people who see the problem clearly and are finally ready to build the solution — with tools they own, in a community they're already part of.
        </motion.p>

        <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 justify-center pt-2">
          <button
            onClick={onEnterForge}
            className="forge-btn-primary px-7 py-3 rounded-md font-medium text-[#2B2825] transition-all duration-200"
          >
            Open the Forge
          </button>
          <Link href="/discover">
            <span className="inline-block px-7 py-3 rounded-md font-medium text-[#D9A066] border border-[#D9A066]/30 hover:border-[#D9A066]/60 hover:bg-[#D9A066]/10 transition-all duration-200 cursor-pointer">
              Find your zone
            </span>
          </Link>
        </motion.div>

        <motion.div variants={fadeInUp} className="flex items-center justify-center gap-6 pt-4 text-[#8A7A66] text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4A8C5C]" />
            Instant results
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D9A066]" />
            No experience needed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#8B6F47]" />
            Nothing to install
          </span>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0D1F0D] to-transparent pointer-events-none" />
    </section>
  );
}
