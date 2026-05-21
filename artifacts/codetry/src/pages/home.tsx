import React, { useState, useRef } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { Map, Layers, Coins, Users, TreePine, Wheat, ArrowRight, CheckCircle2, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm, ValidationError } from "@formspree/react";
import Nav from "@/components/Nav";
import CodetryWordmark from "@/components/CodetryWordmark";

const BASE = import.meta.env.BASE_URL;

export default function Home() {
  const [formspreeState, handleFormspreeSubmit] = useForm("xpzvjdbb");

  const landPhotoRef = useRef<HTMLElement>(null);
  const { scrollYProgress: landPhotoProgress } = useScroll({
    target: landPhotoRef,
    offset: ["start end", "end start"],
  });
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
  const landPhotoY = useTransform(landPhotoProgress, [0, 1], isMobile ? ["0%", "0%"] : ["-10%", "10%"]);

  const scrollToChecklist = () => {
    document.getElementById("checklist")?.scrollIntoView({ behavior: "smooth" });
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground overflow-x-hidden selection:bg-accent/40">
      <Nav />

      {/* Hero Section */}
      <section className="relative w-full text-white pt-40 pb-24 px-6 md:px-12 flex flex-col items-center justify-center text-center overflow-hidden min-h-[90vh]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80')"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A180A]/90 via-[#0A180A]/80 to-[#1A2C18]/85" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.75%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3CfeColorMatrix type=%22saturate%22 values=%220%22/%3E%3C/filter%3E%3Crect width=%22400%22 height=%22400%22 filter=%22url(%23n)%22 opacity=%220.06%22/%3E%3C/svg%3E')] opacity-50 mix-blend-overlay pointer-events-none" />

        <motion.div
          className="max-w-4xl z-10 space-y-8"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.p
            variants={fadeInUp}
            className="text-sm font-bold tracking-widest text-[#D9A066] uppercase"
          >
            Headwaters &mdash; Northwestern Ontario
          </motion.p>
          <motion.h1
            variants={fadeInUp}
            className="text-4xl md:text-6xl lg:text-7xl font-serif font-medium leading-tight tracking-tight text-[#FEFDFC]"
            data-testid="hero-headline"
          >
            Food systems planning for northern communities.
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-[#E3D9CC] max-w-2xl mx-auto leading-relaxed"
            data-testid="hero-subhead"
          >
            The Headwaters methodology maps your community economy across six zones &mdash; finding the gaps, building the tools, and handing everything off so the community runs it.
          </motion.p>

          <motion.div variants={fadeInUp} className="pt-4">
            <Button
              size="lg"
              className="bg-[#D9A066] hover:bg-[#C88E55] text-[#2B2825] font-medium text-lg px-8 py-6 rounded-md shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
              onClick={scrollToChecklist}
              data-testid="button-get-checklist"
            >
              Get the Community Resilience Checklist
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Origin Timeline */}
      <section className="py-24 px-6 md:px-12 max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="space-y-16"
        >
          <div className="relative border-l border-[#D9A066]/30 ml-4 md:ml-8 space-y-16 pb-8">
            <motion.div variants={fadeInUp} className="relative pl-8 md:pl-12">
              <div className="absolute -left-3 top-1 w-6 h-6 rounded-full bg-background border-4 border-[#D9A066] shadow-[0_0_0_4px_var(--background)]" />
              <span className="text-sm font-bold tracking-wider text-[#D9A066] uppercase mb-2 block">1987 &ndash; 2010</span>
              <h3 className="text-2xl font-serif text-foreground mb-4">Free-range Northern Ontario</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Free-range childhood in Northwestern Ontario bush. Coasted through school. Backpacked for a year. Returned home. Living in blissful ignorance to the way the world worked &mdash; until I wasn't.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="relative pl-8 md:pl-12">
              <div className="absolute -left-3 top-1 w-6 h-6 rounded-full bg-background border-4 border-[#D9A066] shadow-[0_0_0_4px_var(--background)]" />
              <span className="text-sm font-bold tracking-wider text-[#D9A066] uppercase mb-2 block">2011</span>
              <h3 className="text-2xl font-serif text-foreground mb-4">Rude Awakening</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                I went down the rabbit hole. Ron Paul. Rosa Koire. My brain broke &mdash; literally. A lack of sleep combined with an earth-shattering reality caused me to slip into psychosis. I spent a month institutionalized. People assumed everything I talked about was just crazy. I knew better. That was over a decade ago.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="relative pl-8 md:pl-12">
              <div className="absolute -left-3 top-1 w-6 h-6 rounded-full bg-background border-4 border-[#D9A066] shadow-[0_0_0_4px_var(--background)]" />
              <span className="text-sm font-bold tracking-wider text-[#D9A066] uppercase mb-2 block">2012 &ndash; 2020</span>
              <h3 className="text-2xl font-serif text-foreground mb-4">Building on the Land</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Jack Spiriko of The Survival Podcast fueled my soul. One step at a time. Homestead with land and fireplace. Hunting, trapping, fishing. Bitcoin ahead of CBDCs. Homeschooling. 160 acres in rural Ontario. Then Parr's Jars: a local food business. We built our self-sufficient dream under the radar.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="relative pl-8 md:pl-12">
              <div className="absolute -left-[14px] top-1 w-7 h-7 rounded-full bg-[#D9A066] border-4 border-background shadow-[0_0_0_4px_var(--background)] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-background" />
              </div>
              <span className="text-sm font-bold tracking-wider text-[#D9A066] uppercase mb-2 block">2020 onward</span>
              <h3 className="text-2xl font-serif text-foreground mb-4">From Self to Community Resilience</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                2020 made us shift from individual resilience to community resilience. The questions kept coming from neighbours &mdash; from food co-ops, from First Nations communities, from rural municipalities. So we built a methodology. Headwaters is that methodology, and Codetry is the toolset that makes it real.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Full-bleed Land Photo */}
      <section
        ref={landPhotoRef}
        className="relative w-full overflow-hidden"
        style={{ height: "clamp(260px, 45vh, 600px)" }}
        aria-hidden="true"
      >
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${BASE}parrs-jars-homestead.jpg')`,
            scale: 1.2,
            y: landPhotoY,
            willChange: "transform",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/40" />
      </section>

      {/* Bobbie Pullquote */}
      <section className="bg-primary/5 py-24 px-6 md:px-12 border-y border-border/50">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-[#D9A066] shadow-xl mx-auto">
              <img
                src={`${BASE}bobbie-headshot.png`}
                alt="Bobbie Parr"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>

          <div className="w-16 h-1 bg-[#D9A066] mx-auto rounded-full" />

          <h2 className="text-3xl md:text-5xl font-serif text-primary leading-tight">
            "I help communities map their local economy, close the gaps, and build the tools that let them run it themselves."
          </h2>
          <div className="pt-4">
            <p className="font-bold text-foreground text-lg">&mdash; Bobbie Parr, Headwaters Practitioner</p>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Degree in Community Development. 13 years building a resilient lifestyle in Northwestern Ontario. Codetry is the methodology and toolset born from that work.
            </p>
          </div>
        </motion.div>
      </section>

      {/* What is Codetry */}
      <section className="py-24 px-6 md:px-12 max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <motion.div variants={fadeInUp}>
            <Card className="bg-primary text-primary-foreground border-none shadow-2xl p-8 md:p-12 overflow-hidden relative card-lift">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Layers className="w-32 h-32" />
              </div>
              <CardContent className="p-0 relative z-10 space-y-6">
                <h2 className="text-3xl font-serif">What is Codetry?</h2>
                <p className="text-lg leading-relaxed text-primary-foreground/90">
                  Codetry maps your community economy across six zones &mdash; from the household (Zone 0) to the regional network (Zone 5). We find where the leaks are, what tools will close them, and build only what the community can own and run without us.
                </p>
                <div className="pt-4 pb-2 border-t border-primary-foreground/20">
                  <p className="font-bold tracking-wide uppercase text-[#D9A066]">Zone by zone. Tool by tool. Community-owned.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp} className="space-y-8">
            <div className="flex gap-4 items-start">
              <div className="mt-1 bg-accent/30 p-3 rounded-full text-[#D9A066]">
                <Map className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">Zone mapping & gap analysis</h4>
                <p className="text-muted-foreground">Where is your local economy leaking? We map the six zones and find the gaps before we build anything.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="mt-1 bg-accent/30 p-3 rounded-full text-[#D9A066]">
                <Wheat className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">Owned food hub software</h4>
                <p className="text-muted-foreground">Inventory, ordering, and marketplace tools for food co-ops and producers &mdash; built to hand off completely, no SaaS fees.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="mt-1 bg-accent/30 p-3 rounded-full text-[#D9A066]">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">Community credit systems</h4>
                <p className="text-muted-foreground">Peer-to-peer exchange infrastructure for local economies that don't want to depend on outside currency.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* The Six Zones */}
      <section className="py-24 px-6 md:px-12 bg-primary/5 border-y border-border/50">
        <div className="max-w-6xl mx-auto space-y-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center"
          >
            <h2 className="text-3xl md:text-5xl font-serif text-foreground mb-4">The Six Zones</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">The Headwaters framework maps community economy from the inside out &mdash; the same way permaculture maps a landscape.</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {[
              { zone: "Z0", label: "Household", desc: "Individual and family food security, skills, and digital sovereignty." },
              { zone: "Z1", label: "Neighbourhood", desc: "Block-level exchange, tool libraries, P2P credit, and mutual aid." },
              { zone: "Z2", label: "Community", desc: "Local food hubs, co-op ordering systems, and community directories." },
              { zone: "Z3", label: "District", desc: "Regional producer networks, shared logistics, and market coordination." },
              { zone: "Z4", label: "Bioregion", desc: "Cross-community platforms, watershed food sheds, and First Nations networks." },
              { zone: "Z5", label: "Regional Economy", desc: "Policy-level tools, regional analytics, and inter-community credit systems." },
            ].map((z) => (
              <motion.div key={z.zone} variants={fadeInUp}>
                <Card className="h-full border-border/60 hover:border-[#D9A066]/40 transition-colors duration-300 p-6">
                  <CardContent className="p-0 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold tracking-widest text-[#D9A066] uppercase bg-[#D9A066]/10 px-2 py-1 rounded">{z.zone}</span>
                      <h3 className="text-lg font-bold">{z.label}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{z.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-24 px-6 md:px-12 bg-card border-y border-border/50">
        <div className="max-w-6xl mx-auto space-y-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center"
          >
            <h2 className="text-3xl md:text-5xl font-serif text-foreground mb-4">Who It's For</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Northern and Indigenous communities building food sovereignty from the ground up.</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-6"
          >
            <motion.div variants={fadeInUp}>
              <Card className="h-full border-border/60 hover:border-border card-lift p-6 md:p-8">
                <CardContent className="p-0 space-y-4">
                  <div className="bg-primary/10 w-12 h-12 flex items-center justify-center rounded-lg text-primary mb-6">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">First Nations food co-operatives</h3>
                  <p className="text-muted-foreground italic border-l-2 border-primary/30 pl-4 py-1">"We need systems our community controls — not another platform we're renting."</p>
                  <p className="text-foreground pt-2"><strong>Outcome:</strong> Owned ordering, inventory, and member tools that stay in community hands after we're gone.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="h-full border-border/60 hover:border-border card-lift p-6 md:p-8">
                <CardContent className="p-0 space-y-4">
                  <div className="bg-primary/10 w-12 h-12 flex items-center justify-center rounded-lg text-primary mb-6">
                    <Wheat className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">Northern food hubs & CSA networks</h3>
                  <p className="text-muted-foreground italic border-l-2 border-primary/30 pl-4 py-1">"Spreadsheets and group chats got us here. They can't get us to the next 200 members."</p>
                  <p className="text-foreground pt-2"><strong>Outcome:</strong> A clean order and member management system built for how your hub actually operates.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="h-full border-border/60 hover:border-border card-lift p-6 md:p-8">
                <CardContent className="p-0 space-y-4">
                  <div className="bg-primary/10 w-12 h-12 flex items-center justify-center rounded-lg text-primary mb-6">
                    <TreePine className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">Rural municipalities & regional planners</h3>
                  <p className="text-muted-foreground italic border-l-2 border-primary/30 pl-4 py-1">"We need to understand our food system before we can fund it."</p>
                  <p className="text-foreground pt-2"><strong>Outcome:</strong> A zone map of your regional food economy — where the capacity is, where the gaps are, what to build next.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="h-full border-border/60 hover:border-border card-lift p-6 md:p-8">
                <CardContent className="p-0 space-y-4">
                  <div className="bg-primary/10 w-12 h-12 flex items-center justify-center rounded-lg text-primary mb-6">
                    <Map className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">Community development organizations</h3>
                  <p className="text-muted-foreground italic border-l-2 border-primary/30 pl-4 py-1">"We've done the research. We just need someone who can build it without locking us in."</p>
                  <p className="text-foreground pt-2"><strong>Outcome:</strong> Purpose-built digital infrastructure that fits your existing programs and stays yours after launch.</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Lead Magnet */}
      <section id="checklist" className="py-24 px-6 md:px-12 bg-accent/20 relative">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center"
        >
          <motion.div variants={fadeInUp} className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-serif text-foreground leading-tight">The Community Resilience Checklist</h2>
              <p className="text-xl text-muted-foreground">5 questions every northern community should answer before building anything digital.</p>
            </div>

            <ul className="space-y-6">
              {[
                { title: "Who owns your food data?", desc: "Producer records, order histories, member lists — are they in your hands or a platform's?" },
                { title: "Can you export everything?", desc: "If the tool disappeared tomorrow, could you recover in a week?" },
                { title: "Do your members know how to use it?", desc: "The best system is the one your least technical member can operate." },
                { title: "Who grows food within 100km of you?", desc: "Can you name three producers? Can your members find them without you?" },
                { title: "What happens when the grant ends?", desc: "Does the tool cost money to run? Who pays? Do you have a plan?" }
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-[#D9A066] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-foreground">{item.title}</span>
                    <span className="text-muted-foreground">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="p-8 shadow-xl bg-card border-none card-lift-warm">
              <CardContent className="p-0 space-y-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif">Get the free guide</h3>
                  <p className="text-muted-foreground">Delivered straight to your inbox. No retainer attached.</p>
                </div>

                {formspreeState.succeeded ? (
                  <div className="space-y-6 py-2">
                    <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-800">You're in — check your inbox!</p>
                        <p className="text-sm text-green-700 mt-1">The guide is on its way. While you wait, download it directly below.</p>
                      </div>
                    </div>
                    <Button
                      asChild
                      className="w-full bg-[#D9A066] hover:bg-[#C88E55] text-[#2B2825] font-bold py-6 text-lg shadow-md transition-transform hover:-translate-y-0.5"
                    >
                      <a href="/codetry/digital-resilience-checklist.pdf" download="Community-Resilience-Checklist.pdf">
                        <Download className="w-5 h-5 mr-2" />
                        Download the checklist PDF
                      </a>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleFormspreeSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-foreground">Email address</label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        className="bg-background border-border/50 focus:border-[#D9A066] focus:ring-[#D9A066]"
                        data-testid="input-email"
                      />
                      <ValidationError prefix="Email" field="email" errors={formspreeState.errors} className="text-sm text-red-600" />
                    </div>
                    {formspreeState.errors && formspreeState.errors.getAllFieldErrors().length === 0 && formspreeState.errors.getFormErrors().length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Something went wrong. Please try again or email codetry@gmail.com directly.</span>
                      </div>
                    )}
                    <Button
                      type="submit"
                      disabled={formspreeState.submitting}
                      className="w-full bg-[#D9A066] hover:bg-[#C88E55] text-[#2B2825] font-bold py-6 text-lg shadow-md transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      data-testid="button-submit-email"
                    >
                      {formspreeState.submitting ? "Sending…" : "Send it to my inbox"}
                    </Button>
                  </form>
                )}

                <div className="pt-6 border-t border-border/50 text-center">
                  <p className="text-muted-foreground mb-4">Ready to map your community economy?</p>
                  <Button
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground font-medium"
                    asChild
                    data-testid="link-book-conversation"
                  >
                    <a href="mailto:codetry@gmail.com">Book a conversation with Bobbie</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
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
