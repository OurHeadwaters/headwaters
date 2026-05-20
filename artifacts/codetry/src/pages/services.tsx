import React from "react";
import { motion, type Variants } from "framer-motion";
import { CheckCircle2, ArrowRight, Zap, Globe, Wrench } from "lucide-react";
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

const tiers = [
  {
    icon: Globe,
    name: "Brochure Site",
    tagline: "Own your corner of the internet.",
    price: "$800 – $1,500",
    timeline: "2 – 3 weeks",
    description:
      "A clean, fast, hosted-by-you website. No WordPress, no page-builder subscriptions, no mystery fees. You get the code, the domain walkthrough, and the hosting setup — fully handed off.",
    includes: [
      "Custom domain + DNS walkthrough",
      "Static or simple CMS-backed site",
      "Mobile-first, accessible design",
      "Contact form (no third-party required)",
      "One round of revisions",
    ],
    accent: "#D9A066",
    ideal: "Homesteaders, local tradespeople, small producers",
  },
  {
    icon: Zap,
    name: "Local Directory",
    tagline: "Put your community on the map.",
    price: "$2,000 – $4,500",
    timeline: "4 – 8 weeks",
    description:
      "A searchable, filterable directory of local producers, services, or resources — built for your region, owned by your community. Members can self-list with approval. No SaaS fees.",
    includes: [
      "Search + filter by category / distance",
      "Member submission & admin approval flow",
      "Email notifications baked in",
      "Export-your-data always on",
      "Deployment + hand-off documentation",
    ],
    accent: "#D9A066",
    ideal: "Food hubs, homeschool networks, mutual aid groups",
    featured: true,
  },
  {
    icon: Wrench,
    name: "Custom Tooling",
    tagline: "Built to your exact problem.",
    price: "From $5,000",
    timeline: "6 – 12 weeks",
    description:
      "Order management, inventory tracking, booking systems, member portals — purpose-built for how your operation actually works. No off-the-shelf assumptions. Scoped together, built clean, handed off completely.",
    includes: [
      "Discovery & scoping session included",
      "Fully owned codebase (no license fees)",
      "Postgres database you control",
      "Admin dashboard for your team",
      "90-day support window post-launch",
    ],
    accent: "#D9A066",
    ideal: "Co-ops, CSA farms, homeschool collectives, local businesses",
  },
];

const process = [
  {
    step: "01",
    title: "30-minute conversation",
    desc: "No pitch deck. Just a real conversation about what you're trying to do and whether I can help.",
  },
  {
    step: "02",
    title: "Written scope + fixed quote",
    desc: "You get a plain-English document describing exactly what gets built, what it costs, and when it's done.",
  },
  {
    step: "03",
    title: "Build in the open",
    desc: "You see progress weekly. No black boxes. If something changes, we talk.",
  },
  {
    step: "04",
    title: "Hand-off, not hold-on",
    desc: "You get the code, the docs, and a walkthrough. I don't want monthly fees — I want you to own it.",
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
            Services
          </motion.p>
          <motion.h1
            variants={fadeInUp}
            className="text-4xl md:text-6xl font-serif font-medium leading-tight text-[#FEFDFC]"
          >
            What gets built. What it costs. What you own.
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-lg text-[#E3D9CC] max-w-2xl mx-auto leading-relaxed">
            Every engagement ends the same way: you have the code, you have the docs, and I'm gone. No retainer. No platform lock-in. Just yours.
          </motion.p>
        </motion.div>
      </section>

      {/* Tiers */}
      <section className="py-24 px-6 md:px-12 max-w-6xl mx-auto w-full">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-8"
        >
          {tiers.map((tier) => (
            <motion.div key={tier.name} variants={fadeInUp} className="flex">
              <Card
                className={`flex flex-col w-full border-border/60 hover:border-[#D9A066]/40 transition-colors duration-300 ${
                  tier.featured ? "ring-2 ring-[#D9A066]/60 shadow-xl" : ""
                }`}
              >
                {tier.featured && (
                  <div className="bg-[#D9A066] text-[#2B2825] text-xs font-bold tracking-widest uppercase text-center py-2 rounded-t-xl">
                    Most requested
                  </div>
                )}
                <CardContent className="p-8 flex flex-col gap-6 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-3 rounded-lg text-primary">
                      <tier.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{tier.name}</h3>
                      <p className="text-sm text-[#D9A066] font-medium">{tier.tagline}</p>
                    </div>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">{tier.description}</p>

                  <div className="flex gap-6 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Investment</p>
                      <p className="font-bold text-foreground">{tier.price}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Timeline</p>
                      <p className="font-bold text-foreground">{tier.timeline}</p>
                    </div>
                  </div>

                  <ul className="space-y-3 flex-1">
                    {tier.includes.map((item) => (
                      <li key={item} className="flex gap-3 items-start text-sm">
                        <CheckCircle2 className="w-4 h-4 text-[#D9A066] shrink-0 mt-0.5" />
                        <span className="text-foreground/80">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-4">
                      <span className="font-semibold text-foreground">Ideal for:</span> {tier.ideal}
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
            <p className="text-muted-foreground text-lg">No surprises. No scope creep. Just straight talk from the start.</p>
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
            Not sure which tier fits?
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-[#E3D9CC] text-lg">
            Send a one-liner about what you're building. I'll tell you honestly whether it's something I can help with — and roughly what it would cost.
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
          <p>&copy; 2024 Codetry / Above Parr Solutions &mdash; Northwestern Ontario</p>
          <p className="font-medium tracking-wide text-[#D9A066]">Digital self-reliance. No lock-in. No retainer. Just yours.</p>
        </div>
      </footer>
    </div>
  );
}
