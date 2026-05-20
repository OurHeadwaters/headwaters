import { Link } from "wouter";
import { OdysseyBridge } from "@/components/odyssey-bridge";
import { ArrowRight, Radio, BookOpen, Mountain } from "lucide-react";

const PATHWAY_STEPS = [
  {
    icon: Radio,
    label: "Step 1",
    title: "The Survival Podcast",
    body: "Since 2008, Jack Spirko has been building one of the largest practical self-reliance archives anywhere. Over 3,000 episodes covering permaculture, food production, financial independence, bushcraft, homesteading, natural medicine, and a dozen other disciplines that actually matter to people building real lives.",
    cta: null,
    accentColor: "#4A7A3A",
  },
  {
    icon: BookOpen,
    label: "Step 2",
    title: "The Learning Tracks",
    body: "The archive is deep. The Learning Tracks organize it into structured paths following the permaculture zone framework — six zones from the self outward, each with an orientation-to-applied arc. Work through a track to build genuine competence in an area, not just a playlist of random episodes.",
    cta: { href: "/tracks", label: "Browse the tracks" },
    accentColor: "#6B8F47",
  },
  {
    icon: Mountain,
    label: "Step 3",
    title: "The Headwaters Odyssey",
    body: "TSP gives you the theory and the skills. The Headwaters Odyssey — offered through Codetry — is for people who've done that work and are ready to build community-scale resilience with others in their watershed. A year-long structured journey through land, water, food, governance, and the relationships that make self-reliance possible at scale.",
    cta: {
      href: "https://ourheadwaters.ca/odyssey",
      label: "Learn about the Odyssey",
      external: true,
    },
    accentColor: "#C4622D",
  },
];

const TSP_PILLARS = [
  { label: "Zone 0", topic: "Mindset & Money" },
  { label: "Zone 1", topic: "Home Preparedness" },
  { label: "Zone 2", topic: "Food Production" },
  { label: "Zone 3", topic: "Working Homestead" },
  { label: "Zone 4", topic: "Wild Harvest" },
  { label: "Zone 5", topic: "Grid-Down Contingency" },
];

export default function StartPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div
        className="border-b border-border relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0A180A 0%, #12241A 60%, #1A2C18 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 30% 60%, #4A7A3A 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #C4622D 0%, transparent 40%)",
          }}
        />
        <div className="max-w-4xl mx-auto px-6 py-20 relative">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-6 px-3 py-1.5 rounded-full"
            style={{
              color: "#C4622D",
              background: "#C4622D18",
              border: "1px solid #C4622D33",
            }}
          >
            <span>New here?</span>
          </div>

          <h1
            className="font-serif text-4xl md:text-6xl font-bold leading-tight mb-6"
            style={{ color: "#FDFBF7" }}
          >
            Start here.
          </h1>

          <p className="text-xl leading-relaxed max-w-2xl mb-4" style={{ color: "#C8D4C0" }}>
            TSP is a 16-year archive of practical self-reliance content. This page explains what
            it is, how the Learning Tracks work, and where the Headwaters Odyssey fits after.
          </p>

          <p className="text-base leading-relaxed max-w-xl" style={{ color: "#8FA883" }}>
            Whether you're here for permaculture, financial independence, homesteading, or all of
            it — there's a track for where you are right now.
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-6 py-14">

        {/* What TSP is */}
        <section className="mb-14">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            <span className="w-6 h-px bg-border" />
            What is TSP?
          </div>
          <h2 className="font-serif text-3xl font-bold text-foreground mb-5">
            Modern survivalism — not what you think.
          </h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                Forget the bunker stereotype. The Survival Podcast is Jack Spirko's argument that
                resilience and abundance aren't opposites — that you can build a genuinely good
                life <em>and</em> be prepared for the hard parts.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                That means growing food, building financial independence, learning skills that
                actually matter, and thinking carefully about your vulnerabilities — without
                becoming paralyzed by fear or obsessed with gear.
              </p>
            </div>
            <div>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                Jack has organized his framework around the permaculture zone model — a way of
                thinking about care, attention, and distance that starts at the self and works
                outward through home, garden, homestead, forest, and wild.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                The Learning Tracks apply that same structure to the archive, so you're building
                knowledge in the same order you'd build resilience in real life.
              </p>
            </div>
          </div>

          {/* Zone pills */}
          <div className="flex flex-wrap gap-2">
            {TSP_PILLARS.map((p) => (
              <span
                key={p.label}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-muted border border-border text-muted-foreground"
              >
                <span className="font-bold text-foreground">{p.label}</span> — {p.topic}
              </span>
            ))}
          </div>
        </section>

        {/* The pathway */}
        <section className="mb-14">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            <span className="w-6 h-px bg-border" />
            The Pathway
          </div>
          <h2 className="font-serif text-3xl font-bold text-foreground mb-8">
            Theory → practice → community.
          </h2>

          <div className="space-y-6">
            {PATHWAY_STEPS.map((step, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row gap-6 p-6 rounded-xl border border-border bg-card"
              >
                <div className="shrink-0">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: step.accentColor + "18", border: `1px solid ${step.accentColor}33` }}
                  >
                    <step.icon className="w-5 h-5" style={{ color: step.accentColor }} />
                  </div>
                </div>
                <div className="flex-1">
                  <div
                    className="text-[10px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: step.accentColor }}
                  >
                    {step.label}
                  </div>
                  <h3 className="font-serif text-xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.body}</p>
                  {step.cta && (
                    step.cta.external ? (
                      <a
                        href={step.cta.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                        style={{ color: step.accentColor }}
                      >
                        {step.cta.label}
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    ) : (
                      <Link
                        href={step.cta.href}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80"
                        style={{ color: step.accentColor }}
                      >
                        {step.cta.label}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Where to start */}
        <section className="mb-14">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            <span className="w-6 h-px bg-border" />
            Where to Start
          </div>
          <h2 className="font-serif text-3xl font-bold text-foreground mb-6">
            Pick the track that matches where you are.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-2xl">
            You don't need to start at Zone 0. If you're already financially stable and want to
            learn to grow food, start at Zone 2. If you want to understand how Jack thinks, start
            at Zone 0. The tracks are designed to be independent — work through them in any order.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tracks"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:-translate-y-0.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md"
            >
              <BookOpen className="w-4 h-4" />
              Browse Learning Tracks
            </Link>
            <Link
              href="/zones"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all border border-border bg-card hover:bg-muted text-foreground"
            >
              Browse by Zone
            </Link>
            <Link
              href="/episodes"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all border border-border bg-card hover:bg-muted text-foreground"
            >
              Browse All Episodes
            </Link>
          </div>
        </section>

        {/* Odyssey bridge */}
        <section>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            <span className="w-6 h-px bg-border" />
            The Next Step
          </div>
          <h2 className="font-serif text-3xl font-bold text-foreground mb-6">
            After the archive — the Odyssey.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-2xl">
            TSP is about individual and household resilience. The Headwaters Odyssey is what
            comes next: applying those skills with other people, in your actual watershed, through
            a structured program designed to build genuine community-scale resilience.
          </p>
          <OdysseyBridge variant="full" />
        </section>
      </div>
    </div>
  );
}
