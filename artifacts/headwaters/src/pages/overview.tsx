import { motion } from "framer-motion";

const fade = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const, delay: i * 0.05 },
  }),
};

type Feature = {
  name: string;
  desc: string;
  href?: string;
  tag?: string;
  external?: boolean;
};

type Territory = {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  border: string;
  bg: string;
  dot: string;
  summary: string;
  features: Feature[];
};

const STATUS: Record<string, { label: string; color: string }> = {
  live:      { label: "Live",       color: "#4A8C5C" },
  auth:      { label: "Login",      color: "#D9A066" },
  pass:      { label: "Passphrase", color: "#B48C50" },
  mobile:    { label: "Mobile",     color: "#6A7A9A" },
  admin:     { label: "Admin",      color: "#8A6A9A" },
};

const TERRITORIES: Territory[] = [
  {
    id: "tsp",
    label: "The Stomping Path",
    sublabel: "Knowledge hub · Zone 0–5 content",
    color: "#6A9C5A",
    border: "rgba(106,156,90,0.3)",
    bg: "rgba(106,156,90,0.05)",
    dot: "#6A9C5A",
    summary: "Fifteen years of self-reliance knowledge — episodes, zones, tracks, workshops, and the community built around them.",
    features: [
      { name: "Home — Daily Stomp", desc: "Habit tracking, featured episodes, Stomping Grounds scene", href: "/", tag: "live" },
      { name: "Episode Archive", desc: "6,000+ searchable episodes from TSP, Fireside Freedom, and council shows", href: "/library", tag: "live" },
      { name: "Zone Map", desc: "All six zones with structured learning tracks — navigate from Zone 0 to Zone 5", href: "/zones", tag: "live" },
      { name: "Tracks", desc: "Curated topic paths: water, energy, food, finance, community", href: "/tracks", tag: "live" },
      { name: "Cohorts", desc: "Guided group learning — founding waitlist and member cohort management", href: "/cohorts", tag: "live" },
      { name: "Expert Council", desc: "Verified practitioners with searchable listings by zone and specialty", href: "/council", tag: "live" },
      { name: "Workshops", desc: "Browse, host, and manage ground events — public and brigade-exclusive", href: "/workshops-browse", tag: "live" },
      { name: "Wisdom Dig", desc: "AI-assisted extraction of actionable wisdom from the episode archive", href: "/wisdom-dig", tag: "live" },
      { name: "Wishing Well", desc: "Community support — daily pot, shared intentions, practitioner visibility", href: "/wishing-well", tag: "live" },
      { name: "Kit Finder", desc: "Family preparedness assessment — find the right kit for your household stage", href: "/kit-finder", tag: "live" },
      { name: "My Map", desc: "Personal zone tracker — your own lifestyle map across the six zones", href: "/map", tag: "auth" },
      { name: "Brigade", desc: "Headwaters membership hub — member perks, community access, renewal", href: "/brigade", tag: "auth" },
      { name: "Admin Suite", desc: "Brigade stats, series health, kit commerce, content gaps, gear catalog, wisdom scraper", href: "/admin/brigade", tag: "admin" },
    ],
  },
  {
    id: "headwaters",
    label: "Headwaters Field Journal",
    sublabel: "Practitioner tool · Passphrase-guarded",
    color: "#B48C50",
    border: "rgba(180,140,80,0.3)",
    bg: "rgba(180,140,80,0.05)",
    dot: "#B48C50",
    summary: "The practitioner intake and business management tool for 807 Food Co-operative. Passphrase-guarded. Everything from client CRM to financial modelling.",
    features: [
      { name: "Gateway Landing", desc: "Named entry — fork between Field Journal (passphrase) and The Trail (public)", href: "/headwaters/", tag: "live", external: true },
      { name: "Dashboard", desc: "Overview: client queue, monthly revenue projections, stomping path trail marker", href: "/headwaters/", tag: "pass", external: true },
      { name: "Clients & Intake", desc: "Full CRM — new client intake, structured assessment, detailed client records", tag: "pass" },
      { name: "Business Financials", desc: "Monthly income modelling: low/high projections by revenue stream", tag: "pass" },
      { name: "Business Priorities", desc: "Prioritised focus areas — what gets attention and when", tag: "pass" },
      { name: "Online Engine", desc: "Marketing and online presence tracker — channels, output, and revenue attribution", tag: "pass" },
      { name: "Submissions", desc: "All submitted intake forms — timestamped, reviewable, exportable", tag: "pass" },
      { name: "Stomping Path — Compass", desc: "Zone 2 decision-making tool — where are you on the path right now?", href: "/headwaters/stomping-path/compass", tag: "live", external: true },
      { name: "Stomping Path — Dam Days", desc: "Project log — capture progress, export history, clear for next cycle", href: "/headwaters/stomping-path/dam-days", tag: "live", external: true },
      { name: "Stomping Path — Creator", desc: "Personal journey builder — your Zone 2 practice map", href: "/headwaters/stomping-path/creator", tag: "live", external: true },
      { name: "The Shallows — Zone 5", desc: "Still-water destination — leave a name at the water's edge", href: "/headwaters/shallows", tag: "live", external: true },
    ],
  },
  {
    id: "codetry",
    label: "Codetry / Crypto Castle",
    sublabel: "Digital sovereignty · Zone 3",
    color: "#2A8A9A",
    border: "rgba(42,138,154,0.3)",
    bg: "rgba(42,138,154,0.05)",
    dot: "#2A8A9A",
    summary: "The digital sovereignty workbench — code literacy, crypto key ceremonies, community payment rails, and a layered financial architecture built for the watershed.",
    features: [
      { name: "Forge — Code Sandbox", desc: "Live Monaco editor (VS Code engine) — write HTML/CSS/JS, see it run. Four starter templates.", href: "/codetry/", tag: "live", external: true },
      { name: "Discover — Sovereignty Map", desc: "7-step AI assessment → Stage 1–6 sovereignty scale. Stateless, localStorage-persisted.", href: "/codetry/discover", tag: "live", external: true },
      { name: "Council Kit — Services", desc: "Three engagement tiers: Zone Assessment ($1.5k–$3k), Hub Implementation ($4k–$12k), Regional Platform ($15k+)", href: "/codetry/services", tag: "live", external: true },
      { name: "Work — Portfolio", desc: "Community case studies: First Nations co-op, food hub inventory, rural skill board", href: "/codetry/work", tag: "live", external: true },
      { name: "Workbench — Stack Map", desc: "Visual 4-layer architecture: Bitcoin Aquifer → XRPL Membrane → Community Tokens → Shore", href: "/codetry/workbench", tag: "live", external: true },
      { name: "Workbench — Bitcoin Ceremony", desc: "BIP39 12-word seed phrase generation — browser-only, nothing transmitted, write-it-down ceremony", href: "/codetry/workbench", tag: "live", external: true },
      { name: "Workbench — XRPL Ceremony", desc: "XRPL classic address + secret seed generation — Eave Rule stated, 10 XRP reserve noted", href: "/codetry/workbench", tag: "live", external: true },
      { name: "Workbench — The Machine", desc: "4-bucket allocator: Cost Basis / Reserve / Reinvestment / Eave Flow. Honey Principle enforced.", href: "/codetry/workbench", tag: "live", external: true },
      { name: "Gord — Bird Guide", desc: "Deadpan AI bird guide. Floats across every Codetry page. Powered by gpt-4o-mini.", tag: "live" },
    ],
  },
  {
    id: "privacy",
    label: "Family Privacy Kit",
    sublabel: "Digital perimeter guide · Zone 0",
    color: "#7A8A9A",
    border: "rgba(122,138,154,0.3)",
    bg: "rgba(122,138,154,0.05)",
    dot: "#7A8A9A",
    summary: "A single-page household digital perimeter guide — privacy principles, threat model, tools, and the distinction between the Clearing (community) and the Lodge (household).",
    features: [
      { name: "Core Principles", desc: "The five privacy principles that anchor household digital practice", href: "/privacy-guide/", tag: "live", external: true },
      { name: "Family & Lodge", desc: "The Lodge/Clearing distinction — what stays inside, what can cross the threshold", href: "/privacy-guide/", tag: "live", external: true },
      { name: "Threat Clearing", desc: "Active threat model — what's actually at risk and in what order", href: "/privacy-guide/", tag: "live", external: true },
      { name: "Tools & Workshop", desc: "Concrete tool recommendations: VPN, password manager, device hygiene, passphrases", href: "/privacy-guide/", tag: "live", external: true },
      { name: "Resources", desc: "Curated reading and further practice — not exhaustive, just what works", href: "/privacy-guide/", tag: "live", external: true },
      { name: "Print / Save PDF", desc: "One-click print or PDF save — designed to work as a household reference document", href: "/privacy-guide/", tag: "live", external: true },
    ],
  },
  {
    id: "mobile",
    label: "TSP Mobile",
    sublabel: "Expo app · iOS & Android",
    color: "#8A7A9A",
    border: "rgba(138,122,154,0.3)",
    bg: "rgba(138,122,154,0.05)",
    dot: "#8A7A9A",
    summary: "The mobile companion — podcast archive, listening history, zone map, value-for-value wallet, and the daily stomp. One tap from anywhere.",
    features: [
      { name: "Home", desc: "Featured episodes, daily stomp, quick access to recent listening", tag: "mobile" },
      { name: "Archive", desc: "Full episode library — searchable, filterable, streamable or downloadable", tag: "mobile" },
      { name: "History", desc: "Listening history — what you've played, how far you got, resume anywhere", tag: "mobile" },
      { name: "Downloads", desc: "Offline episode management — download for offline listening in the field", tag: "mobile" },
      { name: "Map", desc: "Zone map — visual navigation of the six zones, track your position", tag: "mobile" },
      { name: "Wishing Well", desc: "Community support and daily intention-setting on mobile", tag: "mobile" },
      { name: "Stomp", desc: "Daily stomp tracker — log your practice on mobile, syncs with web", tag: "mobile" },
      { name: "Bookmarks", desc: "Saved episodes, timestamped notes, and personal reference clips", tag: "mobile" },
      { name: "Wallet", desc: "Lightning/V4V integration — stream sats to creators while you listen", tag: "mobile" },
      { name: "Privacy Guide", desc: "The full household privacy guide — available offline once loaded", tag: "mobile" },
    ],
  },
];

function TagBadge({ tag }: { tag: string }) {
  const s = STATUS[tag] ?? { label: tag, color: "#666" };
  return (
    <span
      className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
      style={{ color: s.color, background: `${s.color}18`, border: `1px solid ${s.color}33` }}
    >
      {s.label}
    </span>
  );
}

function FeatureRow({ f, color }: { f: Feature; color: string }) {
  const inner = (
    <div className="flex items-start justify-between gap-3 py-2.5 px-3 rounded-lg transition-colors hover:bg-white/4 group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/80 group-hover:text-white/95 transition-colors leading-snug">
          {f.name}
        </p>
        <p className="text-xs text-white/35 leading-snug mt-0.5">{f.desc}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0 mt-0.5">
        {f.tag && <TagBadge tag={f.tag} />}
        {f.href && (
          <span className="text-[10px] opacity-0 group-hover:opacity-60 transition-opacity" style={{ color }}>
            →
          </span>
        )}
      </div>
    </div>
  );

  if (!f.href) return inner;
  if (f.external) {
    return <a href={f.href} target="_blank" rel="noopener noreferrer" className="block">{inner}</a>;
  }
  return <a href={f.href} className="block">{inner}</a>;
}

export default function Overview() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(160deg, #0a0f08 0%, #080c06 60%, #0b0f09 100%)",
        fontFamily: "Georgia, serif",
        color: "#d4c9a8",
      }}
    >
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.p
            custom={0} variants={fade}
            className="text-[10px] font-bold uppercase tracking-[0.25em] mb-4"
            style={{ color: "#6a5e40" }}
          >
            Headwaters · 807 Food Co-operative · The Watershed
          </motion.p>
          <motion.h1
            custom={1} variants={fade}
            className="text-5xl md:text-6xl font-bold mb-4 leading-tight"
            style={{ color: "#e8dcc8" }}
          >
            The Full Map
          </motion.h1>
          <motion.p
            custom={2} variants={fade}
            className="text-base leading-relaxed max-w-2xl"
            style={{ color: "#7a6e54" }}
          >
            Everything that's been built, where it lives, and how it connects.
            Five artifacts. One watershed.
          </motion.p>

          {/* Legend */}
          <motion.div
            custom={3} variants={fade}
            className="flex flex-wrap gap-3 mt-8"
          >
            {Object.entries(STATUS).map(([, s]) => (
              <span key={s.label} className="flex items-center gap-1.5 text-xs" style={{ color: "#6a5e40" }}>
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Territory sections */}
      <div className="max-w-5xl mx-auto px-6 pb-24 space-y-10">
        {TERRITORIES.map((t, ti) => (
          <motion.div
            key={t.id}
            custom={ti}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fade}
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: t.border, background: t.bg }}
          >
            {/* Territory header */}
            <div className="px-6 py-5 border-b" style={{ borderColor: t.border }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.dot }} />
                    <h2 className="text-lg font-bold" style={{ color: "#e8dcc8" }}>{t.label}</h2>
                  </div>
                  <p className="text-[10px] uppercase tracking-widest ml-4.5" style={{ color: t.color }}>
                    {t.sublabel}
                  </p>
                </div>
                <span
                  className="shrink-0 text-xs font-bold px-2 py-1 rounded-full border"
                  style={{ color: t.color, borderColor: t.border, background: `${t.dot}14` }}
                >
                  {t.features.length} features
                </span>
              </div>
              <p className="text-sm leading-relaxed mt-3" style={{ color: "#7a6e54" }}>{t.summary}</p>
            </div>

            {/* Feature list */}
            <div className="px-3 py-3">
              <div className="grid md:grid-cols-2 gap-0.5">
                {t.features.map((f) => (
                  <FeatureRow key={f.name} f={f} color={t.color} />
                ))}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Footer note */}
        <div className="text-center pt-4">
          <p className="text-xs" style={{ color: "#4a4030" }}>
            Headwaters · 807 Food Co-operative Inc. · Dryden, Ontario
          </p>
          <a
            href="/headwaters/"
            className="inline-block mt-3 text-xs transition-colors"
            style={{ color: "#6a5e40" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#b48c50")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6a5e40")}
          >
            ← Back to Headwaters
          </a>
        </div>
      </div>
    </div>
  );
}
