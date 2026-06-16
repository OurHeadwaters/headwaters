import React, { useEffect, useRef } from "react";
import { motion, type Variants } from "framer-motion";
import { useListSuiteCreators, useListSuiteKits } from "@workspace/api-client-react";

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
    title: "Built from the soil up",
    body: "Not a bootcamp. Not a subscription. One-time access, lifetime ownership. No ongoing fees, no dependency on platforms you didn't build.",
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
    title: "A method, not a shortcut",
    body: "Codetry uses literate programming and AI tools to give you the method to create real, working systems — without writing a line of traditional code.",
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
    title: "A node in something bigger",
    body: "Codetry is part of a decentralized, grassroots economic system fifteen years in the making. We are the soil — the activity network — growing something different before the flood.",
    accent: "#89C4A8",
  },
];

const BLUEPRINTS = [
  {
    zone: "Blueprint 1 — Zone 0",
    title: "Root Work",
    desc: "Health is infrastructure. Before you build anything else, you build the body and habits that make everything else possible. Map what a stable Zone 0 looks like — and get the tools to get there.",
    tags: ["Zone 0", "Health", "Foundation"],
    color: "#2C4A36",
  },
  {
    zone: "Blueprint 2 — Zone 1",
    title: "Follow the Money",
    desc: "Channel your income and watch the ripple effect. See where your dollars are going, redirect them with intention, and build a financial picture that belongs to your household — not a bank's spreadsheet.",
    tags: ["Zone 1", "Finance", "Sovereignty"],
    color: "#3A3010",
  },
  {
    zone: "Blueprint 3 — Zone 3",
    title: "Community Architecture",
    desc: "Build community like a pro, even if you'd rather be shovelling. The relational and organizational infrastructure of a local economy — how to run a table, hold a room, and create conditions where people show up and stay.",
    tags: ["Zone 3", "Community", "Local Economy"],
    color: "#1A2C3A",
  },
];

const COMMUNITY_MEMBERS = [
  { initials: "BP", name: "Bobbie P.", note: "Zone mapping for a First Nations co-op", color: "#2C4A36" },
  { initials: "TR", name: "Tom R.", note: "Food hub inventory tool — live!", color: "#3A3010" },
  { initials: "SK", name: "Sarah K.", note: "Community skill board for rural ON", color: "#1A1A3A" },
  { initials: "MJ", name: "Mike J.", note: "Water quality tracker prototype", color: "#2C3A20" },
  { initials: "DL", name: "David L.", note: "Barter network ledger, zone 3 ready", color: "#2A3A10" },
  { initials: "FW", name: "Fiona W.", note: "Privacy-first client onboarding tool", color: "#1A3A3A" },
];

const DIGITAL_ACCENT = "#3A5A8A";

export function WhyCodeTry() {
  return (
    <section className="py-20 px-6 md:px-12 bg-[#060E06]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="space-y-10"
        >
          <motion.div variants={fadeInUp} className="text-center space-y-3">
            <span className="text-xs font-bold tracking-widest text-[#D9A066] uppercase">Why Codetry</span>
            <h2 className="text-3xl md:text-4xl font-serif text-[#FEFDFC]">Sovereignty is a skill stack</h2>
            <p className="text-[#8A9E8A] max-w-xl mx-auto">Not a platform. Not a plugin. The ability to build your own systems — owned, local, and lasting.</p>
          </motion.div>

          <motion.div variants={stagger} className="grid md:grid-cols-3 gap-6">
            {WHY_CARDS.map((card) => (
              <motion.div
                key={card.title}
                variants={fadeInUp}
                className="forge-card p-6 rounded-lg space-y-4"
              >
                <div style={{ color: card.accent }}>{card.icon}</div>
                <h3 className="font-serif text-lg text-[#FEFDFC]">{card.title}</h3>
                <p className="text-[#8A9E8A] text-sm leading-relaxed">{card.body}</p>
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
    <section className="py-20 px-6 md:px-12 bg-[#090F09] border-t border-[#1A3020]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="space-y-12"
        >
          <motion.div variants={fadeInUp} className="text-center space-y-3">
            <span className="text-xs font-bold tracking-widest text-[#D9A066] uppercase">Blueprint Gallery</span>
            <h2 className="text-3xl md:text-4xl font-serif text-[#FEFDFC]">Start with a map</h2>
            <p className="text-[#8A9E8A] max-w-xl mx-auto">Each blueprint is a working starting point — a zone-mapped system you can actually run.</p>
          </motion.div>

          <motion.div variants={stagger} className="grid md:grid-cols-3 gap-6">
            {BLUEPRINTS.map((bp) => (
              <motion.div
                key={bp.title}
                variants={fadeInUp}
                className="forge-card rounded-lg overflow-hidden"
              >
                <div className="h-2 w-full" style={{ background: bp.color }} />
                <div className="p-6 space-y-3">
                  <span className="text-xs font-bold tracking-widest uppercase" style={{ color: bp.color === "#2C4A36" ? "#4A8C5C" : bp.color === "#3A3010" ? "#D9A066" : "#5B8AB0" }}>
                    {bp.zone}
                  </span>
                  <h3 className="font-serif text-xl text-[#FEFDFC]">{bp.title}</h3>
                  <p className="text-[#8A9E8A] text-sm leading-relaxed">{bp.desc}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {bp.tags.map((t) => (
                      <span key={t} className="text-[10px] font-bold uppercase tracking-wider border border-white/10 text-white/40 px-2 py-0.5 rounded-full">
                        {t}
                      </span>
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

export function AmbientListeningStrip() {
  return (
    <section className="py-10 px-6 md:px-12 bg-[#060E06] border-t border-[#1A3020]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-4 md:gap-10 text-center md:text-left">
        <div className="flex-1 space-y-2">
          <span className="text-xs font-bold tracking-widest text-[#D9A066] uppercase">Listen while you build</span>
          <h3 className="font-serif text-xl text-[#FEFDFC]">The Stomping Path podcast runs alongside everything Codetry does.</h3>
          <p className="text-[#8A9E8A] text-sm">Thousands of episodes on food, finance, community, and digital sovereignty — from the same roots.</p>
        </div>
        <a
          href="/stomping-paths"
          className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-[#D9A066] border border-[#D9A066]/40 hover:border-[#D9A066] px-5 py-2.5 rounded-md transition-colors"
        >
          Go to the archive
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </section>
  );
}

export function SovereigntyVoicesSection() {
  const { data: allCreators = [] } = useListSuiteCreators();
  const { data: allKits = [] } = useListSuiteKits();

  const digitalCreators = allCreators.filter(
    (c) => c.kitSlugs.includes("digital-kit") || c.transformationSlugs.includes("analog-to-digital-sovereign")
  );
  const displayCreators = digitalCreators.length > 0 ? digitalCreators : allCreators.slice(0, 3);

  const digitalKit = allKits.find((k) => k.slug === "digital-kit") ?? null;

  return (
    <section className="py-20 px-6 md:px-12 bg-[#080F10] border-t border-[#1A2A30]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="space-y-10"
        >
          <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-3">
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: DIGITAL_ACCENT }}>
                Sovereignty Voices
              </span>
              <h2 className="text-3xl md:text-4xl font-serif text-[#FEFDFC]">
                Follow their path — or take the kit.
              </h2>
              <p className="text-[#8A9E8A] max-w-xl">
                These creators are doing what Codetry teaches. Learn from them at your own pace, free and self-directed.
                Or use the Digital Kit when you're ready to move faster.
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
            {/* Creators column */}
            <motion.div variants={stagger} className="space-y-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#4A6A4A] mb-2">
                Free · self-directed · go at your own pace
              </div>
              {displayCreators.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-lg bg-white/5 animate-pulse border border-white/5" />
                  ))}
                </div>
              ) : (
                displayCreators.slice(0, 4).map((creator) => {
                  const isComingSoon = creator.status === "coming-soon";
                  const linkTypes: Record<string, string> = { podcast: "🎙", video: "▶", article: "📄", book: "📚" };

                  const card = (
                    <motion.div
                      variants={fadeInUp}
                      className="group flex items-start gap-4 p-4 rounded-lg border border-white/8 bg-white/[0.02] hover:border-[#3A5A8A]/50 hover:bg-white/[0.04] transition-all"
                    >
                      {creator.avatarUrl ? (
                        <img
                          src={creator.avatarUrl}
                          alt={creator.name}
                          className={`w-11 h-11 rounded-full object-cover shrink-0 border-2 border-white/15 ${isComingSoon ? "opacity-50 grayscale" : ""}`}
                        />
                      ) : (
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-2 border-white/15 font-bold text-base"
                          style={{ background: `${DIGITAL_ACCENT}30`, color: DIGITAL_ACCENT }}
                        >
                          {creator.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-[#FEFDFC] text-sm">{creator.name}</span>
                          {isComingSoon && (
                            <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-white/10 text-white/40 border border-white/10">
                              coming soon
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#8A9E8A] leading-relaxed line-clamp-1 mb-2">{creator.bio}</p>
                        {creator.curatedLinks.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {creator.curatedLinks.slice(0, 3).map((link) => (
                              <span
                                key={link.url}
                                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/50 ${isComingSoon ? "opacity-40" : ""}`}
                              >
                                {linkTypes[link.type] ?? "🔗"} {link.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {!isComingSoon && (
                        <svg className="w-4 h-4 text-white/20 group-hover:text-[#3A5A8A] transition-colors shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      )}
                    </motion.div>
                  );

                  if (!isComingSoon && creator.websiteUrl) {
                    return (
                      <a key={creator.slug} href={creator.websiteUrl} target="_blank" rel="noopener noreferrer">
                        {card}
                      </a>
                    );
                  }
                  return <div key={creator.slug}>{card}</div>;
                })
              )}
            </motion.div>

            {/* Kit CTA column — always visible */}
            <motion.div variants={fadeInUp} className="lg:sticky lg:top-8">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#4A6A4A] mb-3">
                The easy button — packaged
              </div>
              {digitalKit ? (
                <div
                  className="rounded-xl border p-5 flex flex-col gap-4"
                  style={{
                    borderColor: `${DIGITAL_ACCENT}50`,
                    background: `linear-gradient(145deg, ${DIGITAL_ACCENT}18 0%, ${DIGITAL_ACCENT}06 100%)`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl leading-none">🔐</span>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: DIGITAL_ACCENT }}>
                        Digital Kit
                      </div>
                      <h3 className="font-serif text-lg font-bold text-[#FEFDFC] leading-tight">{digitalKit.name}</h3>
                      <p className="text-xs text-[#8A9E8A] mt-1 leading-relaxed">{digitalKit.tagline}</p>
                    </div>
                  </div>
                  {digitalKit.priceCents && (
                    <div className="text-sm text-white/60">
                      <span className="text-[#FEFDFC] font-bold text-lg">${(digitalKit.priceCents / 100).toFixed(0)}</span>
                      <span className="ml-1">one-time</span>
                    </div>
                  )}
                  <a
                    href="/stomping-paths/kits/digital-kit"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-sm text-white transition-all hover:-translate-y-px"
                    style={{
                      background: DIGITAL_ACCENT,
                      boxShadow: `0 4px 18px ${DIGITAL_ACCENT}50`,
                    }}
                  >
                    <span>Get Digital Kit</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </a>
                  <p className="text-[10px] text-white/30 text-center -mt-1">
                    Skip the deep dive — this is the packaged path
                  </p>
                </div>
              ) : (
                <div
                  className="rounded-xl border p-5 flex flex-col gap-3"
                  style={{ borderColor: `${DIGITAL_ACCENT}30`, background: `${DIGITAL_ACCENT}08` }}
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: DIGITAL_ACCENT }}>
                    Digital Sovereignty Kit
                  </div>
                  <p className="text-sm text-[#FEFDFC] font-semibold leading-snug">
                    Own your digital infrastructure — communication, data, tools.
                  </p>
                  <a
                    href="/stomping-paths/kits/find"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm border transition-colors"
                    style={{ color: DIGITAL_ACCENT, borderColor: `${DIGITAL_ACCENT}50`, background: `${DIGITAL_ACCENT}10` }}
                  >
                    Find my kit →
                  </a>
                </div>
              )}

              <div className="mt-3 text-center">
                <a
                  href="/stomping-paths/kits"
                  className="text-xs text-[#4A6A4A] hover:text-[#8A9E8A] transition-colors"
                >
                  Browse all kits →
                </a>
              </div>
            </motion.div>
          </div>
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
