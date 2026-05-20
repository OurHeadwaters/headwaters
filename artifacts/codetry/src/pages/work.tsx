import React from "react";
import { motion, type Variants } from "framer-motion";
import { ExternalLink, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Nav from "@/components/Nav";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.18 } },
};

const caseStudies = [
  {
    client: "Parr's Jars",
    url: "https://parrsjars.ca",
    tier: "Brochure Site + Order System",
    year: "2022",
    tagline: "From a spreadsheet and a group chat to a real local food business.",
    context:
      "Bobbie's own preserves and local food operation had outgrown a shared Google Sheet and an Instagram DM inbox. Orders were getting lost. Customers had no way to browse what was available that week.",
    built: [
      "Product catalogue with seasonal availability flags",
      "Simple order form with order confirmation emails",
      "Admin view to tally weekly orders at a glance",
      "Static brochure pages for the story behind the business",
    ],
    outcome:
      "Order errors dropped to zero in the first season. Bobbie stopped spending Sunday evenings reconciling spreadsheets and started spending them canning.",
    tags: ["Local food", "Order management", "Self-hosted"],
    color: "#6B8F4A",
  },
  {
    client: "The Survival Podcast Archive",
    url: "https://survivalpodcast.ca",
    tier: "Custom Directory + Search",
    year: "2023",
    tagline: "16 years of practical self-reliance content — finally searchable.",
    context:
      "The Survival Podcast produced over 3,500 episodes across 16 years. The original site made finding anything nearly impossible. Fans wanted to search by topic, filter by series, and discover episodes they'd never heard.",
    built: [
      "Full-text search across 3,500+ episode titles and descriptions",
      "Series-based filtering and browsing",
      "Transformation path tagging (financial, food, health, etc.)",
      "RSS-synced episode library that stays current automatically",
      "Mobile-first responsive design",
    ],
    outcome:
      "A community of longtime listeners finally has a way to navigate the full archive. The site surfaces content the original platform buried — and runs on infrastructure the community controls.",
    tags: ["Podcast archive", "Search & filter", "RSS sync"],
    color: "#4A6B8F",
  },
  {
    client: "ourheadwaters.ca",
    url: "https://ourheadwaters.ca",
    tier: "Community Platform",
    year: "2024",
    tagline: "Community-scale resilience for Northwestern Ontario.",
    context:
      "Individual self-reliance has a ceiling. Ourheadwaters.ca was built to raise that ceiling — a regional resource hub connecting local producers, service providers, and community groups in Northwestern Ontario.",
    built: [
      "Regional producer and service directory",
      "Zone-based resource pages by geographic area",
      "Expert council listings with contact info",
      "Searchable library of local knowledge and guides",
      "Privacy-first: no trackers, no analytics platforms",
    ],
    outcome:
      "A living index of the local economy that the community owns and updates. When neighbours ask 'who grows food near me?' — there's now an answer.",
    tags: ["Community platform", "Local directory", "Privacy-first"],
    color: "#8F6B4A",
  },
];

export default function Work() {
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
            Work
          </motion.p>
          <motion.h1
            variants={fadeInUp}
            className="text-4xl md:text-6xl font-serif font-medium leading-tight text-[#FEFDFC]"
          >
            Real projects. Real hand-offs. Real ownership.
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-lg text-[#E3D9CC] max-w-2xl mx-auto leading-relaxed">
            Every project below started with a problem a spreadsheet or a group chat couldn't solve. Every one ended with the client holding the keys.
          </motion.p>
        </motion.div>
      </section>

      {/* Case Studies */}
      <section className="py-24 px-6 md:px-12 max-w-5xl mx-auto w-full space-y-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="space-y-16"
        >
          {caseStudies.map((cs, i) => (
            <motion.div key={cs.client} variants={fadeInUp}>
              <Card className="border-border/60 overflow-hidden hover:border-[#D9A066]/40 transition-colors duration-300">
                {/* Colour bar */}
                <div className="h-1.5 w-full" style={{ backgroundColor: cs.color }} />

                <CardContent className="p-8 md:p-12">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-bold tracking-widest text-[#D9A066] uppercase">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-xs text-muted-foreground">{cs.year}</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          {cs.tier}
                        </span>
                      </div>
                      <h2 className="text-3xl font-serif font-medium">{cs.client}</h2>
                      <p className="text-lg text-muted-foreground italic">{cs.tagline}</p>
                    </div>
                    <a
                      href={cs.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm font-medium text-[#D9A066] hover:text-[#C88E55] transition-colors shrink-0 mt-1"
                    >
                      Visit site <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="grid md:grid-cols-2 gap-10">
                    {/* Left column */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3">
                          The situation
                        </h4>
                        <p className="text-foreground/80 leading-relaxed">{cs.context}</p>
                      </div>

                      <div className="pt-4 border-t border-border/50">
                        <h4 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3">
                          The outcome
                        </h4>
                        <p className="text-foreground/80 leading-relaxed">{cs.outcome}</p>
                      </div>
                    </div>

                    {/* Right column */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3">
                        What was built
                      </h4>
                      <ul className="space-y-3">
                        {cs.built.map((item) => (
                          <li key={item} className="flex gap-3 items-start text-sm">
                            <span
                              className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                              style={{ backgroundColor: cs.color }}
                            />
                            <span className="text-foreground/80">{item}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-6 flex flex-wrap gap-2">
                        {cs.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-3 py-1 rounded-full border border-border/60 text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
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
            Have something to build?
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-[#E3D9CC] text-lg">
            Describe the problem in one paragraph. I'll tell you whether it's something Codetry is the right fit for — and what it would roughly cost to solve it.
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-[#D9A066] hover:bg-[#C88E55] text-[#2B2825] font-bold text-lg px-10 py-6"
              asChild
            >
              <a href="mailto:codetry@gmail.com">
                Start the conversation <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 text-lg px-10 py-6"
              asChild
            >
              <a href="/services">See service tiers</a>
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
