import React from "react";
import { motion, type Variants } from "framer-motion";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const WHY_CARDS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    title: "Self-Reliance",
    body: "Own your tools from day one. No subscriptions, no lock-in, no platform that disappears. Write it, run it, keep it.",
    accent: "#4A8C5C",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <path d="M7 8l3 3-3 3M13 14h4" />
      </svg>
    ),
    title: "Digital Sovereignty",
    body: "Your ideas run in your browser. No cloud, no server, no account required. The Forge is a workbench you control.",
    accent: "#D9A066",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 000 20M2 12h20" />
        <path d="M12 2C8 5.5 6 9 6 12s2 6.5 6 10M12 2c4 3.5 6 7 6 10s-2 6.5-6 10" />
      </svg>
    ),
    title: "Community Building",
    body: "Every snippet you write is a seed. Share knowledge, templates, and working tools with your community without middlemen.",
    accent: "#89C4A8",
  },
];

const BLUEPRINTS = [
  {
    title: "Food Hub Inventory",
    desc: "Track produce, members, and weekly orders for a local food co-op — fully owned, no SaaS fees.",
    tags: ["HTML", "CSS", "Local Storage"],
    color: "#2C4A36",
  },
  {
    title: "Community Map",
    desc: "An interactive Leaflet.js map showing local producers within your bioregion.",
    tags: ["JS", "Leaflet", "GeoJSON"],
    color: "#3A3010",
  },
  {
    title: "Skill Trade Board",
    desc: "A simple P2P skill-exchange board — post what you have, post what you need.",
    tags: ["HTML", "CSS", "JS"],
    color: "#1A1A3A",
  },
  {
    title: "Water Quality Logger",
    desc: "Log daily well readings, flag anomalies, export to CSV for your records.",
    tags: ["JS", "CSV Export"],
    color: "#2C3A20",
  },
];

const COMMUNITY_MEMBERS = [
  { initials: "BP", name: "Bobbie P.", note: "Zone mapping for a First Nations co-op", color: "#2C4A36" },
  { initials: "TR", name: "Tom R.", note: "Food hub inventory tool — live!", color: "#3A3010" },
  { initials: "SK", name: "Sarah K.", note: "Community skill board for rural ON", color: "#1A1A3A" },
  { initials: "MJ", name: "Mike J.", note: "Water quality tracker prototype", color: "#2C3A20" },
  { initials: "AL", name: "Anna L.", note: "P2P credit ledger for neighbourhood", color: "#3A1A10" },
];

export function WhyCodeTry() {
  return (
    <section id="why-codetry" className="py-20 px-6 md:px-12 bg-[#0A180A]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="space-y-12"
        >
          <motion.div variants={fadeInUp} className="text-center space-y-3">
            <span className="text-xs font-bold tracking-widest text-[#D9A066] uppercase">Why CodeTry Forge?</span>
            <h2 className="text-3xl md:text-4xl font-serif text-[#FEFDFC]">Built for those who want to own their tools</h2>
            <p className="text-[#8A9E8A] max-w-xl mx-auto">
              The same philosophy that drives the homestead — sovereignty, craftsmanship, community — applied to software.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid md:grid-cols-3 gap-6">
            {WHY_CARDS.map((card) => (
              <motion.div
                key={card.title}
                variants={fadeInUp}
                className="forge-why-card p-6 rounded-lg space-y-4 relative overflow-hidden"
              >
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${card.accent}18 0%, transparent 70%)` }}
                />
                <div style={{ color: card.accent }}>{card.icon}</div>
                <h3 className="text-lg font-serif font-medium text-[#FEFDFC]">{card.title}</h3>
                <p className="text-sm text-[#8A9E8A] leading-relaxed">{card.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export function BlueprintGallery() {
  return (
    <section className="py-20 px-6 md:px-12 bg-[#0D1F0D]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="space-y-12"
        >
          <motion.div variants={fadeInUp} className="text-center space-y-3">
            <span className="text-xs font-bold tracking-widest text-[#D9A066] uppercase">Project Blueprints</span>
            <h2 className="text-3xl md:text-4xl font-serif text-[#FEFDFC]">What you can build</h2>
            <p className="text-[#8A9E8A] max-w-xl mx-auto">Real examples — not demos. Each one solves an actual community need.</p>
          </motion.div>

          <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BLUEPRINTS.map((bp) => (
              <motion.div
                key={bp.title}
                variants={fadeInUp}
                className="forge-blueprint-card rounded-lg overflow-hidden group cursor-pointer"
              >
                <div
                  className="h-28 flex items-center justify-center relative overflow-hidden"
                  style={{ background: bp.color }}
                >
                  <svg
                    viewBox="0 0 160 112"
                    className="w-full h-full absolute inset-0 opacity-20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line x1="20" y1="20" x2="140" y2="20" stroke="#D9A066" strokeWidth="0.8" strokeDasharray="4 4" />
                    <line x1="20" y1="40" x2="140" y2="40" stroke="#D9A066" strokeWidth="0.8" strokeDasharray="4 4" />
                    <line x1="20" y1="60" x2="140" y2="60" stroke="#D9A066" strokeWidth="0.8" strokeDasharray="4 4" />
                    <line x1="20" y1="80" x2="140" y2="80" stroke="#D9A066" strokeWidth="0.8" strokeDasharray="4 4" />
                    <line x1="20" y1="20" x2="20" y2="92" stroke="#D9A066" strokeWidth="0.8" strokeDasharray="4 4" />
                    <line x1="60" y1="20" x2="60" y2="92" stroke="#D9A066" strokeWidth="0.8" strokeDasharray="4 4" />
                    <line x1="100" y1="20" x2="100" y2="92" stroke="#D9A066" strokeWidth="0.8" strokeDasharray="4 4" />
                    <line x1="140" y1="20" x2="140" y2="92" stroke="#D9A066" strokeWidth="0.8" strokeDasharray="4 4" />
                  </svg>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D9A066" strokeWidth="1.5" className="relative z-10 opacity-70">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <div className="absolute bottom-2 right-3 text-[10px] text-[#D9A066]/60 font-mono">blueprint</div>
                </div>
                <div className="p-4 space-y-2 bg-[#111B0F] border border-[#1E3820] border-t-0 rounded-b-lg">
                  <h3 className="text-sm font-medium text-[#D4C9B8] group-hover:text-[#D9A066] transition-colors">{bp.title}</h3>
                  <p className="text-xs text-[#5A7A5A] leading-relaxed">{bp.desc}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {bp.tags.map(t => (
                      <span key={t} className="text-[10px] bg-[#1A2E1A] text-[#6A9A6A] px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export function CommunityForge() {
  return (
    <section className="py-20 px-6 md:px-12 bg-[#0A180A] border-t border-[#1A3020]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="space-y-10"
        >
          <motion.div variants={fadeInUp} className="text-center space-y-3">
            <span className="text-xs font-bold tracking-widest text-[#D9A066] uppercase">Community Forge</span>
            <h2 className="text-3xl md:text-4xl font-serif text-[#FEFDFC]">What others are building</h2>
            <p className="text-[#8A9E8A] max-w-xl mx-auto">Real community members, real tools, real impact.</p>
          </motion.div>

          <motion.div variants={stagger} className="flex flex-wrap gap-4 justify-center">
            {COMMUNITY_MEMBERS.map((m) => (
              <motion.div
                key={m.name}
                variants={fadeInUp}
                className="forge-community-card flex items-start gap-3 p-4 rounded-lg max-w-[240px]"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-[#D4C9B8] shrink-0"
                  style={{ background: m.color }}
                >
                  {m.initials}
                </div>
                <div>
                  <div className="text-sm font-medium text-[#C4B49A]">{m.name}</div>
                  <div className="text-xs text-[#5A7A5A] mt-0.5 leading-relaxed">{m.note}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={fadeInUp} className="text-center pt-4">
            <a
              href="mailto:codetry@gmail.com"
              className="inline-flex items-center gap-2 text-sm text-[#D9A066] hover:text-[#F0C07A] transition-colors border border-[#D9A066]/30 hover:border-[#D9A066]/60 px-6 py-3 rounded-md"
            >
              Share your project with the community
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export function ForgeFooter() {
  return (
    <footer className="bg-[#060E06] border-t border-[#1A3020] px-6 py-10 text-center">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="text-[#D9A066] font-serif text-xl">CodeTry Forge</div>
        <p className="text-[#4A6A4A] text-sm">A Stomping Grounds project. Built for community self-reliance.</p>
        <div className="flex items-center justify-center gap-6 text-xs text-[#3A5A3A]">
          <a href="/codetry/services" className="hover:text-[#D9A066] transition-colors">Services</a>
          <a href="/codetry/work" className="hover:text-[#D9A066] transition-colors">Work</a>
          <a href="mailto:codetry@gmail.com" className="hover:text-[#D9A066] transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}
