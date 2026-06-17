import { useState } from "react";
import { TSP_EPISODE_COUNT, TSP_SHOW_AGE } from "@/lib/constants";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { OdysseyBridge } from "@/components/odyssey-bridge";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import {
  ArrowRight, ArrowLeft, Compass, Sprout, Mountain, Shield,
  Flame, CheckCircle2, BookOpen, Radio,
} from "lucide-react";

type Answer = string;
interface QuizQuestion {
  id: string;
  question: string;
  subtext?: string;
  options: { label: string; value: string; emoji?: string }[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "concern",
    question: "What brings you here?",
    subtext: "Pick the one that resonates most right now.",
    options: [
      { value: "food", label: "Building food security", emoji: "🌱" },
      { value: "money", label: "Financial independence", emoji: "💰" },
      { value: "homestead", label: "Homesteading skills", emoji: "🏡" },
      { value: "prep", label: "Grid-down preparedness", emoji: "⚡" },
      { value: "all", label: "All of the above", emoji: "🗺️" },
    ],
  },
  {
    id: "level",
    question: "Where are you starting from?",
    subtext: "Honest answer — there's no wrong one.",
    options: [
      { value: "beginner", label: "Complete beginner", emoji: "🌱" },
      { value: "some", label: "Some skills, filling gaps", emoji: "🧱" },
      { value: "experienced", label: "Experienced, want to go deeper", emoji: "🎯" },
      { value: "community", label: "Already resilient, ready for community", emoji: "🤝" },
    ],
  },
  {
    id: "constraint",
    question: "What's your biggest constraint right now?",
    options: [
      { value: "time", label: "Time — I have 30 min/day at most", emoji: "⏱️" },
      { value: "space", label: "Space — apartment or small lot", emoji: "🏙️" },
      { value: "money", label: "Budget — need low-cost first steps", emoji: "💵" },
      { value: "knowledge", label: "Knowledge — I don't know where to start", emoji: "📚" },
      { value: "motivation", label: "Motivation — I keep starting and stopping", emoji: "🔥" },
    ],
  },
  {
    id: "zone",
    question: "Which fits where you want to be?",
    subtext: "Each zone is a permaculture ring of care — from self outward.",
    options: [
      { value: "zone-0", label: "Zone 0 — My own mindset, health, and money", emoji: "🧠" },
      { value: "zone-1", label: "Zone 1 — My home: pantry, water, power", emoji: "🏠" },
      { value: "zone-2", label: "Zone 2 — Growing food in a garden", emoji: "🥦" },
      { value: "zone-3", label: "Zone 3 — A working homestead with animals", emoji: "🐓" },
      { value: "zone-4", label: "Zone 4 — Wild harvest, foraging, hunting", emoji: "🌲" },
      { value: "zone-5", label: "Zone 5 — Grid-down wilderness contingency", emoji: "🏕️" },
    ],
  },
  {
    id: "timeline",
    question: "What's your timeline?",
    options: [
      { value: "urgent", label: "Urgent — I feel underprepared now", emoji: "🚨" },
      { value: "steady", label: "Steady build — months to years", emoji: "📅" },
      { value: "curious", label: "Curiosity — just exploring for now", emoji: "🔭" },
    ],
  },
];

interface Recommendation {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  color: string;
  Icon: React.ElementType;
}

function getRecommendation(answers: Record<string, Answer>): Recommendation {
  const { concern, level, zone } = answers;

  if (zone === "zone-0" || concern === "money" || level === "beginner") {
    return {
      title: "Start at Zone 0 — Self Sovereignty",
      description:
        "Mindset, financial independence, and personal resilience are the foundation everything else is built on. Jack's Zone 0 content covers how to think about preparedness, how to get out of debt, and how to build income that can't be taken from you.",
      href: "/tracks",
      ctaLabel: "Browse Learning Tracks",
      secondaryHref: "/zones/zone-0",
      secondaryLabel: "Explore Zone 0 episodes",
      color: "#D9A066",
      Icon: Shield,
    };
  }

  if (zone === "zone-1" || concern === "prep") {
    return {
      title: "Zone 1 — Home Preparedness",
      description:
        "Water storage, pantry building, backup power, and home security. Zone 1 is the most immediately practical zone — the skills here give you a buffer against short-term disruptions and a foundation for everything further out.",
      href: "/zones/zone-1",
      ctaLabel: "Explore Zone 1",
      secondaryHref: "/library?q=home+preparedness",
      secondaryLabel: "Search related episodes",
      color: "#8B6BB1",
      Icon: Mountain,
    };
  }

  if (zone === "zone-2" || concern === "food") {
    return {
      title: "Zone 2 — Growing Your Own Food",
      description:
        "Permaculture gardening, soil building, seed saving, and food preservation. Zone 2 is where most people find the most satisfaction — there's nothing quite like eating food you grew yourself.",
      href: "/zones/zone-2",
      ctaLabel: "Explore Zone 2",
      secondaryHref: "/library?q=permaculture+garden",
      secondaryLabel: "Search gardening episodes",
      color: "#5C9E5C",
      Icon: Sprout,
    };
  }

  if (zone === "zone-3" || concern === "homestead") {
    return {
      title: "Zone 3 — The Working Homestead",
      description:
        "Livestock, small farm economics, and the infrastructure of a productive property. Zone 3 is where the homesteading dream becomes practical — chickens, pigs, dairy, orchards, and the systems that make them sustainable.",
      href: "/zones/zone-3",
      ctaLabel: "Explore Zone 3",
      secondaryHref: "/library?q=homesteading+livestock",
      secondaryLabel: "Search homestead episodes",
      color: "#C89B3C",
      Icon: Flame,
    };
  }

  if (zone === "zone-4") {
    return {
      title: "Zone 4 — Wild Harvest & Foraging",
      description:
        "Hunting, fishing, foraging, trapping, and wild plant identification. Zone 4 is the interface between cultivation and wilderness — where you learn to harvest what the land offers freely.",
      href: "/zones/zone-4",
      ctaLabel: "Explore Zone 4",
      secondaryHref: "/library?q=foraging+hunting",
      secondaryLabel: "Search wild harvest episodes",
      color: "#7FAF7F",
      Icon: Sprout,
    };
  }

  if (zone === "zone-5") {
    return {
      title: "Zone 5 — Grid-Down Contingency",
      description:
        "Wilderness survival, long-term preparedness planning, and community-scale resilience. Zone 5 is where you prepare for the scenarios you hope never happen — but that the prepared mind considers regardless.",
      href: "/zones/zone-5",
      ctaLabel: "Explore Zone 5",
      secondaryHref: "/library?q=shtf+survival",
      secondaryLabel: "Search survival episodes",
      color: "#5BA3C9",
      Icon: Flame,
    };
  }

  if (level === "community") {
    return {
      title: "The Headwaters Odyssey",
      description:
        "You've done the individual work. The Headwaters Odyssey is the structured program for people ready to build community-scale resilience — a year-long journey through land, water, food, governance, and relationships.",
      href: "https://ourheadwaters.ca/odyssey",
      ctaLabel: "Learn about the Odyssey ↗",
      secondaryHref: "/tracks",
      secondaryLabel: "Review the Learning Tracks",
      color: "#C4622D",
      Icon: Compass,
    };
  }

  return {
    title: "Browse the Learning Tracks",
    description:
      "Seven structured learning paths — from Zone 0 (self, money, mindset) through Zone 5 (grid-down contingency). Each track is a curated sequence of TSP episodes designed to build genuine competence, not just a playlist.",
    href: "/tracks",
    ctaLabel: "Browse the Tracks",
    secondaryHref: "/zones",
    secondaryLabel: "Explore by Zone",
    color: "#D9A066",
    Icon: BookOpen,
  };
}

export default function StartPage() {
  useDocumentMeta({
    title: "Start Here — Find Your Path | The Stomping Path",
    description:
      "New to TSP? Answer 5 quick questions and we'll recommend the best track or zone to start your self-reliance journey — homesteading, food security, financial independence, and more.",
    ogTitle: "Find Your Path — The Stomping Path",
    ogDescription:
      "5 questions · instant recommendation · no account needed.",
  });

  const [step, setStep] = useState<"intro" | number | "result">("intro");
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  const currentQ = typeof step === "number" ? QUESTIONS[step] : null;
  const totalSteps = QUESTIONS.length;
  const progress =
    typeof step === "number"
      ? ((step + 1) / totalSteps) * 100
      : step === "result"
      ? 100
      : 0;

  function selectAnswer(value: string) {
    if (!currentQ) return;
    const next = { ...answers, [currentQ.id]: value };
    setAnswers(next);
    const nextStep = (step as number) + 1;
    if (nextStep >= totalSteps) {
      setStep("result");
    } else {
      setStep(nextStep);
    }
  }

  function goBack() {
    if (step === "result") {
      setStep(totalSteps - 1);
    } else if (typeof step === "number" && step > 0) {
      setStep(step - 1);
    } else {
      setStep("intro");
    }
  }

  const recommendation = step === "result" ? getRecommendation(answers) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div
        className="border-b border-border relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, #0A180A 0%, #12241A 60%, #1A2C18 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 30% 60%, #4A7A3A 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #C4622D 0%, transparent 40%)",
          }}
        />
        <div className="max-w-3xl mx-auto px-6 py-16 relative">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full"
            style={{
              color: "#C4622D",
              background: "#C4622D18",
              border: "1px solid #C4622D33",
            }}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>New here? Start here.</span>
          </div>
          <h1
            className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-4"
            style={{ color: "#FDFBF7" }}
          >
            Find your path into TSP.
          </h1>
          <p className="text-lg leading-relaxed max-w-xl" style={{ color: "#C8D4C0" }}>
            Five quick questions — we'll recommend the right zone, track, or entry point for exactly where you are right now. No account needed.
          </p>
        </div>
      </div>

      {/* Quiz area */}
      <div className="max-w-2xl mx-auto px-6 py-14">
        <AnimatePresence mode="wait">

          {/* INTRO */}
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-8">
                <Compass className="w-9 h-9 text-primary" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
                Where should you start?
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-2 max-w-lg mx-auto">
                TSP has {TSP_EPISODE_COUNT} episodes spanning permaculture, homesteading, financial independence, bushcraft, and more. That's a lot of trail to navigate.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-10 max-w-lg mx-auto">
                Answer five questions and we'll point you at the track or zone that fits your situation right now.
              </p>
              <button
                onClick={() => setStep(0)}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-colors shadow-sm"
              >
                Let's go
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="mt-8 text-sm text-muted-foreground">
                Or jump straight to:{" "}
                <Link href="/tracks" className="text-primary hover:underline font-medium">
                  Learning Tracks
                </Link>
                {" · "}
                <Link href="/zones" className="text-primary hover:underline font-medium">
                  Browse by Zone
                </Link>
                {" · "}
                <Link href="/library" className="text-primary hover:underline font-medium">
                  Search Archive
                </Link>
              </div>
            </motion.div>
          )}

          {/* QUESTIONS */}
          {typeof step === "number" && currentQ && (
            <motion.div
              key={`q-${step}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
            >
              {/* Progress */}
              <div className="mb-8">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
                  <span>
                    Question {step + 1} of {totalSteps}
                  </span>
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                </div>
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">
                {currentQ.question}
              </h2>
              {currentQ.subtext && (
                <p className="text-muted-foreground mb-7">{currentQ.subtext}</p>
              )}
              {!currentQ.subtext && <div className="mb-7" />}

              <div className="space-y-3">
                {currentQ.options.map((opt) => (
                  <motion.button
                    key={opt.value}
                    onClick={() => selectAnswer(opt.value)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                  >
                    {opt.emoji && (
                      <span className="text-2xl leading-none shrink-0">{opt.emoji}</span>
                    )}
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {opt.label}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground/40 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* RESULT */}
          {step === "result" && recommendation && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-6">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Your recommendation is ready
              </div>

              {/* Recommendation card */}
              <div
                className="rounded-2xl border p-7 mb-8 relative overflow-hidden"
                style={{
                  borderColor: `${recommendation.color}44`,
                  background: `linear-gradient(135deg, ${recommendation.color}10 0%, transparent 60%)`,
                }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
                  style={{
                    background: `${recommendation.color}18`,
                    border: `1px solid ${recommendation.color}44`,
                  }}
                >
                  <recommendation.Icon
                    className="w-6 h-6"
                    style={{ color: recommendation.color }}
                  />
                </div>

                <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                  {recommendation.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-7">
                  {recommendation.description}
                </p>

                <div className="flex flex-wrap gap-3">
                  {recommendation.href.startsWith("http") ? (
                    <a
                      href={recommendation.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:-translate-y-0.5 text-white"
                      style={{ background: recommendation.color }}
                    >
                      {recommendation.ctaLabel}
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <Link
                      href={recommendation.href}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:-translate-y-0.5 text-white"
                      style={{ background: recommendation.color }}
                    >
                      {recommendation.ctaLabel}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                  {recommendation.secondaryHref && recommendation.secondaryLabel && (
                    <Link
                      href={recommendation.secondaryHref}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm border border-border bg-card hover:bg-muted transition-colors text-foreground"
                    >
                      {recommendation.secondaryLabel}
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <button
                  onClick={() => {
                    setStep("intro");
                    setAnswers({});
                  }}
                  className="hover:text-foreground transition-colors"
                >
                  ↺ Retake the quiz
                </button>
                <span className="text-border">·</span>
                <Link href="/tracks" className="hover:text-foreground transition-colors">
                  All learning tracks
                </Link>
                <span className="text-border">·</span>
                <Link href="/zones" className="hover:text-foreground transition-colors">
                  Browse by zone
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Static info section below quiz */}
      <div className="border-t border-border bg-muted/20">
        <div className="max-w-4xl mx-auto px-6 py-14">

          <section className="mb-14">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              <span className="w-6 h-px bg-border" />
              What is TSP?
            </div>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-5">
              Modern survivalism — not what you think.
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  Forget the bunker stereotype. TSP is built on the argument that resilience and abundance aren't opposites — that you can build a genuinely good life <em>and</em> be prepared for the hard parts.
                </p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  That means growing food, building financial independence, learning skills that actually matter, and thinking carefully about your vulnerabilities — without becoming paralyzed by fear or obsessed with gear.
                </p>
              </div>
              <div>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  Jack Spirko has organized his framework around the permaculture zone model — a way of thinking about care, attention, and distance that starts at the self and works outward through home, garden, homestead, forest, and wild.
                </p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  The Learning Tracks apply that same structure to the archive, so you're building knowledge in the same order you'd build resilience in real life.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-14">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              <span className="w-6 h-px bg-border" />
              The Pathway
            </div>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-8">
              Theory → practice → community.
            </h2>
            <div className="space-y-4">
              {[
                {
                  label: "Step 1",
                  title: "The Archive",
                  body: `${TSP_SHOW_AGE} years of episodes covering permaculture, food production, financial independence, bushcraft, homesteading, natural medicine, and more. Over 6,000 hours of content organized so you can find what you need.`,
                  color: "#4A7A3A",
                  Icon: Radio,
                  cta: null as null | { href: string; label: string; external?: boolean },
                },
                {
                  label: "Step 2",
                  title: "The Learning Tracks",
                  body: "The archive organized into structured paths following the permaculture zone framework — six zones from the self outward, each with an orientation-to-applied arc. Work through a track to build genuine competence.",
                  color: "#6B8F47",
                  Icon: BookOpen,
                  cta: { href: "/tracks", label: "Browse the tracks" },
                },
                {
                  label: "Step 3",
                  title: "The Headwaters Odyssey",
                  body: "For people who've done that work and are ready to build community-scale resilience with others in their watershed. A year-long structured journey through land, water, food, governance, and the relationships that make self-reliance possible at scale.",
                  color: "#C4622D",
                  Icon: Compass,
                  cta: {
                    href: "https://ourheadwaters.ca/odyssey",
                    label: "Learn about the Odyssey",
                    external: true,
                  },
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row gap-6 p-6 rounded-xl border border-border bg-card"
                >
                  <div className="shrink-0">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        background: s.color + "18",
                        border: `1px solid ${s.color}33`,
                      }}
                    >
                      <s.Icon className="w-5 h-5" style={{ color: s.color }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div
                      className="text-[10px] font-bold uppercase tracking-widest mb-1"
                      style={{ color: s.color }}
                    >
                      {s.label}
                    </div>
                    <h3 className="font-serif text-xl font-bold text-foreground mb-3">
                      {s.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{s.body}</p>
                    {s.cta &&
                      (s.cta.external ? (
                        <a
                          href={s.cta.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                          style={{ color: s.color }}
                        >
                          {s.cta.label}
                          <ArrowRight className="w-4 h-4" />
                        </a>
                      ) : (
                        <Link
                          href={s.cta.href}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-opacity"
                          style={{ color: s.color }}
                        >
                          {s.cta.label}
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              <span className="w-6 h-px bg-border" />
              The Next Step
            </div>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-6">
              After the archive — the Odyssey.
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-2xl">
              TSP is about individual and household resilience. The Headwaters Odyssey is what comes next: applying those skills with other people, in your actual watershed, through a structured program designed to build genuine community-scale resilience.
            </p>
            <OdysseyBridge variant="full" />
          </section>
        </div>
      </div>
    </div>
  );
}
