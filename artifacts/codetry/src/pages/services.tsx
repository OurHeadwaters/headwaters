import React from "react";
import { motion, type Variants } from "framer-motion";
import { CheckCircle2, ArrowRight, Map, Hammer, Network, Flame, Radio } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Nav from "@/components/Nav";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const engagements = [
  {
    icon: Map,
    name: "Zone Assessment",
    tagline: "Map before you build.",
    price: "$1,500 – $3,000",
    timeline: "3 – 5 weeks",
    description:
      "A structured read of your community economy across the six Headwaters zones — with zero disruption to how your community already works. Bobbie asks how your people already communicate, then listens through those existing channels. Problems surface naturally. You get a written report and a recommended path — no obligation to proceed.",
    includes: [
      "Ambient signal capture through your existing channels — no new meetings required",
      "Zone-by-zone gap analysis report",
      "Prioritised tool recommendations",
      "Capacity and readiness assessment",
      "Summary presentation for stakeholders",
    ],
    accent: "#D9A066",
    ideal: "First Nations co-operatives, rural municipalities, food hubs starting out",
  },
  {
    icon: Hammer,
    name: "Hub Implementation",
    tagline: "Build it. Hand it off. Run it yourselves.",
    price: "$4,000 – $12,000",
    timeline: "6 – 14 weeks",
    description:
      "Design, build, and hand off a single owned digital tool for your community hub — order management, member portal, producer directory, or community credit module. Scoped to your actual Zone assessment so we're solving the right problem. No retainer. Fully yours at the end.",
    includes: [
      "Scoping session tied to your Zone Assessment",
      "One purpose-built tool, fully owned codebase",
      "Admin dashboard your team can operate",
      "Data export always on — your records, your formats",
      "60-day support window post-launch",
    ],
    accent: "#D9A066",
    ideal: "Food co-ops, CSA networks, homeschool collectives, local producers",
    featured: true,
  },
  {
    icon: Network,
    name: "Regional Platform",
    tagline: "Multi-community, multi-zone infrastructure.",
    price: "From $15,000",
    timeline: "3 – 6 months",
    description:
      "For communities ready to build at Zone 4 or 5 — a regional platform connecting multiple hubs, producer networks, and community credit systems across a watershed or district. Involves multiple stakeholders, staged delivery, and full capacity training for ongoing operation.",
    includes: [
      "Multi-stakeholder engagement and facilitation",
      "Zone 3–5 platform design and build",
      "Inter-community credit module (optional)",
      "Regional producer and resource directory",
      "Full team training and hand-off documentation",
    ],
    accent: "#D9A066",
    ideal: "Watershed alliances, First Nations networks, regional food hubs, development corps",
  },
];

const signalSteps = [
  {
    num: "01",
    title: "Problems surface in your channels",
    body: "Bobbie asks how your community already communicates — phone, WhatsApp, Teams, group texts. She plugs into those same channels as a quiet observer. You change nothing about how you work.",
  },
  {
    num: "02",
    title: "Patterns become visible",
    body: "Over weeks, recurring friction, gaps, and needs surface naturally — not because anyone called a meeting, but because that's where real problems live.",
  },
  {
    num: "03",
    title: "The right extinguisher gets matched",
    body: "Every problem is a fire. Bobbie identifies which extinguisher fits — a specific tool, fix, or system from the toolkit. She makes the call; your community doesn't need to.",
  },
  {
    num: "04",
    title: "Maintained and trained monthly",
    body: "The extinguisher stays current. Monthly upkeep keeps it sharp, and your community gets trained on exactly when to reach for it — so they're never stuck guessing.",
  },
];

const tools = [
  { name: "Producer directory", desc: "Searchable, filterable registry of local growers and makers. Member-managed with admin approval." },
  { name: "Order management", desc: "Seasonal order forms, order confirmation emails, and admin tallying — no spreadsheet required." },
  { name: "Member portal", desc: "Onboarding, profile management, and communication for co-op or hub members." },
  { name: "Community credit module", desc: "Peer-to-peer exchange ledger for communities building a local currency or time-bank." },
  { name: "Resource library", desc: "Curated knowledge base for guides, forms, and local expertise — zone-tagged and searchable." },
  { name: "Booking & scheduling", desc: "Shared equipment, venue, or service booking for community assets." },
  { name: "Zone dashboard", desc: "Aggregated view of community economy activity across multiple tools and zones." },
];

const process = [
  {
    step: "01",
    title: "Plug into how you already communicate",
    desc: "No pitch deck. No new meeting on your calendar. Bobbie asks how your community already talks — then observes through those same channels. Problems are already there; they just need someone listening.",
  },
  {
    step: "02",
    title: "Zone assessment & written scope",
    desc: "A plain-language document that maps your economy across the six zones, identifies the gaps, and proposes what to build first.",
  },
  {
    step: "03",
    title: "Build with the community, not for it",
    desc: "You see progress weekly. Key members test as we go. If something doesn't fit how your community actually works, we change it.",
  },
  {
    step: "04",
    title: "Capacity training & hand-off",
    desc: "You get the code, the documentation, and a training session. We leave when your team can run it without us.",
  },
];

export default function Services() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground overflow-x-hidden">
      <Nav />

      {/* Hero */}
      <section className="relative w-full bg-gradient-to-br from-[#0A180A] to-[#1A2C18] text-white pt-40 pb-24 px-6 md:px-12 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.75%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3CfeColorMatrix type=%22saturate%22 values=%220%22/%3E%3C/filter%3E%3Crect width=%22400%22 height=%22400%22 filter=%22url(%23n)%22 opacity=%220.08%22/%3E%3C/svg%3E')] opacity-50 mix-blend-overlay pointer-events-none" />
        <motion.div
          className="max-w-3xl z-10 space-y-6"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.p variants={fadeInUp} className="text-sm font-bold tracking-widest text-[#D9A066] uppercase">
            Council Kit
          </motion.p>
          <motion.h1
            variants={fadeInUp}
            className="text-4xl md:text-6xl font-serif font-medium leading-tight text-[#FEFDFC]"
          >
            Three ways to work together. All of them end the same way.
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-lg text-[#E3D9CC] max-w-2xl mx-auto leading-relaxed">
            Every engagement ends with your community holding the tools, the data, and the documentation. No retainer. No platform lock-in. Just yours.
          </motion.p>
        </motion.div>
      </section>

      {/* Council Kit — Engagement Types */}
      <section className="py-24 px-6 md:px-12 max-w-6xl mx-auto w-full">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-16 space-y-4"
        >
          <p className="text-sm font-bold tracking-widest text-[#D9A066] uppercase">The Council Kit</p>
          <h2 className="text-3xl md:text-4xl font-serif text-foreground">A 4-phase, community-owned journey</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            The Council Kit is a structured engagement for communities ready to own their digital infrastructure. Starting from ambient listening and ending with full hand-off — your tools, your data, your team running it without us.
          </p>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-8"
        >
          {engagements.map((eng) => (
            <motion.div key={eng.name} variants={fadeInUp} className="flex">
              <Card
                className={`flex flex-col w-full border-border/60 hover:border-[#D9A066]/40 transition-colors duration-300 ${
                  eng.featured ? "ring-2 ring-[#D9A066]/60 shadow-xl" : ""
                }`}
              >
                {eng.featured && (
                  <div className="bg-[#D9A066] text-[#2B2825] text-xs font-bold tracking-widest uppercase text-center py-2 rounded-t-xl">
                    Most common starting point
                  </div>
                )}
                <CardContent className="p-8 flex flex-col gap-6 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-3 rounded-lg text-primary">
                      <eng.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{eng.name}</h3>
                      <p className="text-sm text-[#D9A066] font-medium">{eng.tagline}</p>
                    </div>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">{eng.description}</p>

                  <div className="flex gap-6 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Investment</p>
                      <p className="font-bold text-foreground">{eng.price}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Timeline</p>
                      <p className="font-bold text-foreground">{eng.timeline}</p>
                    </div>
                  </div>

                  <ul className="space-y-3 flex-1">
                    {eng.includes.map((item) => (
                      <li key={item} className="flex gap-3 items-start text-sm">
                        <CheckCircle2 className="w-4 h-4 text-[#D9A066] shrink-0 mt-0.5" />
                        <span className="text-foreground/80">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-4">
                      <span className="font-semibold text-foreground">Ideal for:</span> {eng.ideal}
                    </p>
                    <Button
                      className="w-full bg-[#D9A066] hover:bg-[#C88E55] text-[#2B2825] font-bold"
                      asChild
                    >
                      <a href="mailto:codetry@gmail.com">
                        Start a conversation <ArrowRight className="ml-2 w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Signal → Extinguisher explainer */}
      <section className="py-24 px-6 md:px-12 bg-gradient-to-br from-[#1A2C18] to-[#0A180A] text-white">
        <div className="max-w-5xl mx-auto space-y-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center space-y-4"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <Radio className="w-5 h-5 text-[#D9A066]" />
              <p className="text-sm font-bold tracking-widest text-[#D9A066] uppercase">How the Zone Assessment actually works</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif text-[#FEFDFC]">
              Signal captured. Extinguisher matched.
            </h2>
            <p className="text-[#E3D9CC] text-lg max-w-2xl mx-auto leading-relaxed">
              Every problem is a fire. The Zone Assessment isn't a scheduled check-in — it's ambient listening through the channels your community already uses, so friction surfaces the moment it happens, not when someone finally calls a meeting about it.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid sm:grid-cols-2 gap-6"
          >
            {signalSteps.map((s) => (
              <motion.div
                key={s.num}
                variants={fadeInUp}
                className="flex gap-5 items-start p-6 rounded-xl border border-white/10 bg-white/5 hover:border-[#D9A066]/30 transition-colors"
              >
                <span className="text-3xl font-serif font-bold text-[#D9A066]/40 leading-none shrink-0 w-8">
                  {s.num}
                </span>
                <div>
                  <h4 className="font-bold text-[#FEFDFC] mb-2">{s.title}</h4>
                  <p className="text-[#C8C0B4] text-sm leading-relaxed">{s.body}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="flex items-start gap-5 p-7 rounded-xl border border-[#D9A066]/30 bg-[#D9A066]/8"
          >
            <Flame className="w-6 h-6 text-[#D9A066] shrink-0 mt-1" />
            <div className="space-y-1">
              <p className="font-bold text-[#FEFDFC]">The client changes nothing about how they work.</p>
              <p className="text-[#C8C0B4] text-sm leading-relaxed">
                No new software. No new habits. No onboarding your team into a new platform. Bobbie listens through the channels already in use, surfaces the pattern, and delivers the decision. That decision — which extinguisher, when — is the only thing that requires her active time. Everything else runs on your existing infrastructure.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Seven Tools */}
      <section className="py-24 px-6 md:px-12 bg-primary/5 border-y border-border/50">
        <div className="max-w-5xl mx-auto space-y-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center"
          >
            <h2 className="text-3xl md:text-5xl font-serif mb-4">The seven tools</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Every Hub Implementation and Regional Platform is built from this toolkit. Your Zone Assessment determines which ones you actually need.</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid sm:grid-cols-2 gap-6"
          >
            {tools.map((tool, i) => (
              <motion.div key={tool.name} variants={fadeInUp} className="flex gap-4 items-start p-6 rounded-xl border border-border/60 hover:border-[#D9A066]/30 transition-colors">
                <span className="text-2xl font-serif font-bold text-[#D9A066]/40 leading-none shrink-0 w-8">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h4 className="font-bold text-foreground mb-1">{tool.name}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{tool.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 md:px-12 bg-card border-y border-border/50">
        <div className="max-w-4xl mx-auto space-y-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center"
          >
            <h2 className="text-3xl md:text-5xl font-serif mb-4">How it works</h2>
            <p className="text-muted-foreground text-lg">No surprises. No scope creep. Straight talk from the first conversation.</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-2 gap-8"
          >
            {process.map((p) => (
              <motion.div key={p.step} variants={fadeInUp} className="flex gap-6 items-start">
                <span className="text-4xl font-serif font-bold text-[#D9A066]/40 leading-none shrink-0">
                  {p.step}
                </span>
                <div>
                  <h4 className="text-lg font-bold mb-2">{p.title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 md:px-12 bg-gradient-to-br from-[#0A180A] to-[#1A2C18] text-white text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="max-w-2xl mx-auto space-y-8"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-serif">
            Not sure which engagement fits?
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-[#E3D9CC] text-lg">
            Send one paragraph about your community and what you're trying to solve. Bobbie will reply with an honest read on which Zone you're in and what makes sense next.
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Button
              size="lg"
              className="bg-[#D9A066] hover:bg-[#C88E55] text-[#2B2825] font-bold text-lg px-10 py-6"
              asChild
            >
              <a href="mailto:codetry@gmail.com">
                Email Bobbie directly <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8 px-6 md:px-12 border-t-4 border-[#D9A066]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/60">
          <p>&copy; 2024 Headwaters / Above Parr Solutions &mdash; Northwestern Ontario</p>
          <p className="font-medium tracking-wide text-[#D9A066]">Food sovereignty. No lock-in. No retainer. Just yours.</p>
        </div>
      </footer>
    </div>
  );
}
