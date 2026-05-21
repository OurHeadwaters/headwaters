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
    client: "807 Food Co-op",
    url: "https://ourheadwaters.ca/listen",
    tier: "Zone Assessment + Hub Implementation",
    year: "2023",
    tagline: "Thunder Bay's food security network, formalized.",
    context:
      "The 807 Food Co-op serves the Thunder Bay district as a member-owned food hub connecting producers to buyers across Northwestern Ontario. Orders were managed by spreadsheet and word-of-mouth; new members had no visibility into what was available each week or how to join. The co-op had outgrown its informal systems but didn't want to hand their data to an outside platform.",
    built: [
      "Zone 0–3 assessment of the Thunder Bay district food economy",
      "Member onboarding and order management system",
      "Seasonal availability calendar for producers",
      "Producer directory with contact and profile flow",
      "Community credit pilot — Zone 1 exchange module",
    ],
    outcome:
      "807 now runs a fully owned ordering platform. Member onboarding time dropped from weeks to days. The producer directory has become the regional reference for food access in the Thunder Bay district — and the co-op holds every byte of its own data.",
    tags: ["Food co-op", "Zone assessment", "Order management", "Community credit"],
    color: "#6B8F4A",
  },
  {
    client: "Parr's Jars",
    url: "https://parrsjars.ca",
    tier: "Brochure Site + Order System",
    year: "2022",
    tagline: "From a spreadsheet and a group chat to a real local food business.",
    context:
      "Bobbie's own preserves and local food operation had outgrown a shared Google Sheet and an Instagram DM inbox. Orders were getting lost. Customers had no way to browse what was available that week. This was the project where the Codetry methodology was first tested on a real operation.",
    built: [
      "Product catalogue with seasonal availability flags",
      "Simple order form with order confirmation emails",
      "Admin view to tally weekly orders at a glance",
      "Static brochure pages for the story behind the business",
    ],
    outcome:
      "Order errors dropped to zero in the first season. Bobbie stopped spending Sunday evenings reconciling spreadsheets and started spending them canning. Parr's Jars became the proof-of-concept for every Hub Implementation that followed.",
    tags: ["Local food", "Order management", "Self-hosted", "Zone 0–1"],
    color: "#D9A066",
  },
  {
    client: "ourheadwaters.ca",
    url: "https://ourheadwaters.ca",
    tier: "Regional Platform + Methodology Home",
    year: "2024",
    tagline: "The zone methodology, built into a living regional platform.",
    context:
      "Headwaters needed a public-facing home for the methodology — a place where communities could understand the six-zone framework, find the tools relevant to their stage, explore the community economy model, and connect with Bobbie directly. The site also needed to host the Odyssey youth entrepreneurship program and the 807 case study as a reference for other northern co-ops.",
    built: [
      "Six-zone resource pages with zone-specific tool recommendations",
      "Community economy explainer and P2P credit model (the /economy section)",
      "Odyssey youth entrepreneurship portal",
      "Producer and service directory for Northwestern Ontario",
      "Privacy-first architecture: no trackers, no analytics platforms, no third-party SDKs",
    ],
    outcome:
      "The site is the living reference for the Headwaters methodology. Communities from Northwestern Ontario to coastal First Nations have used it to initiate zone assessments. The /listen section — mapping six listening zones for community food systems — has become the most-shared resource in the network.",
    tags: ["Community platform", "Zone methodology", "Food systems", "Privacy-first"],
    color: "#4A7A6B",
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
            Real communities. Real hand-offs. Real ownership.
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-lg text-[#E3D9CC] max-w-2xl mx-auto leading-relaxed">
            Every project below started with a community that had outgrown its informal systems. Every one ended with that community holding the keys.
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
                <div className="h-1.5 w-full" style={{ backgroundColor: cs.color }} />

                <CardContent className="p-8 md:p-12">
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
            Describe your community and the problem in one paragraph. Bobbie will tell you honestly which Zone you're in and whether Headwaters is the right fit.
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
              <a href="/codetry/services">See engagement types</a>
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
