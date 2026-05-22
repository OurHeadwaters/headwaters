import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, type Variants } from "framer-motion";
import Nav from "@/components/Nav";
import EmberBackground from "@/components/EmberBackground";
import {
  Loader2,
  Map,
  Compass,
  Wand2,
  ChevronRight,
  ChevronLeft,
  Star,
  Hammer,
  Network,
  X,
  Zap,
  RotateCcw,
} from "lucide-react";

const STORAGE_KEY = "codetry:assessment";

const STAGES = [
  { stage: 1, name: "Dependent",  color: "#8B6F5A", desc: "Fully reliant on platforms you don't own" },
  { stage: 2, name: "Aware",      color: "#A07850", desc: "You see the problem, haven't started yet" },
  { stage: 3, name: "Mapping",    color: "#C4943A", desc: "Assessing gaps and readiness to build" },
  { stage: 4, name: "Building",   color: "#D9A066", desc: "Constructing your first owned tool" },
  { stage: 5, name: "Connected",  color: "#6B9E50", desc: "Hub running, ready to network outward" },
  { stage: 6, name: "Sovereign",  color: "#4A8C5C", desc: "Regional infrastructure, fully owned stack" },
];

const SERVICES: Record<string, { icon: React.ReactNode; tagline: string; href: string; accent: string }> = {
  "Zone Assessment": {
    icon: <Map className="w-5 h-5" />,
    tagline: "Map before you build.",
    href: "/services#zone-assessment",
    accent: "#D9A066",
  },
  "Hub Implementation": {
    icon: <Hammer className="w-5 h-5" />,
    tagline: "Build it. Hand it off. Run it yourselves.",
    href: "/services#hub-implementation",
    accent: "#D9A066",
  },
  "Regional Platform": {
    icon: <Network className="w-5 h-5" />,
    tagline: "Multi-community, multi-zone infrastructure.",
    href: "/services#regional-platform",
    accent: "#4A8C5C",
  },
};

const QUESTIONNAIRE_STEPS = [
  {
    key: "platforms",
    prompt: "Our community currently runs on",
    placeholder: "e.g. Facebook groups, Google Workspace, Mailchimp, a mix of spreadsheets and text messages…",
    hint: "Name the platforms and tools your community actually uses day-to-day — even the messy ones.",
  },
  {
    key: "dependency",
    prompt: "The tool we depend on most that we don't own is",
    placeholder: "e.g. our member directory lives in Squarespace, our orders come through a WhatsApp group, our financials are in a SaaS we pay monthly for…",
    hint: "What would hurt most if the platform shut down or raised prices tomorrow?",
  },
  {
    key: "capacity",
    prompt: "Our technical capacity right now is",
    placeholder: "e.g. none — we're all volunteers, one part-time person with some IT background, a small team that can learn but not build from scratch…",
    hint: "Be honest — this shapes what's actually achievable without outside help.",
  },
  {
    key: "problem",
    prompt: "The community problem we most urgently need to solve digitally is",
    placeholder: "e.g. members can't find local producers, our order intake is chaos every season, we have no way to track who owes what in our time-bank…",
    hint: "The messiest, most time-consuming thing — the one that costs you the most energy right now.",
  },
  {
    key: "budget",
    prompt: "When it comes to budget for owned infrastructure, we're",
    placeholder: "e.g. working with a community grant, self-funded but modest, have some capacity if the ROI is clear, genuinely stretched thin…",
    hint: "This helps match you to the right engagement size — no judgment on where you are.",
  },
  {
    key: "vision",
    prompt: "If we fully owned our digital tools, the first thing we'd do differently is",
    placeholder: "e.g. stop paying $200/month to a platform that owns our member data, run our own local food ordering system, share a platform with the three other hubs in our region…",
    hint: "Your instinct here often points directly to the right starting zone.",
  },
  {
    key: "timeline",
    prompt: "Our timeline and appetite for change is",
    placeholder: "e.g. we want to move this year, we're still in the thinking stage, we have a board presentation in three months, we've been talking about this for two years and need to actually start…",
    hint: "Urgency shapes which path makes the most sense.",
  },
];

type Assessment = {
  stage: number;
  stageName: string;
  primaryService: string;
  secondaryService: string;
  rationale: string;
  answers: Record<string, string>;
  entryMode: "guided" | "free";
};

type Phase = "entryGate" | "questionnaire" | "assessing" | "results";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function EntryGate({ onChoose }: { onChoose: (mode: "guided" | "free") => void }) {
  const [dismissed, setDismissed] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12">
      <motion.div
        className="max-w-2xl w-full"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {!dismissed && (
          <motion.div
            variants={fadeInUp}
            className="relative mb-8 rounded-2xl border px-6 py-5 flex items-start gap-4"
            style={{ background: "linear-gradient(135deg, #0E1E0E 0%, #0A180A 100%)", borderColor: "#D9A06633" }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#D9A06618", border: "1px solid #D9A06640" }}>
              <Map className="w-4 h-4" style={{ color: "#D9A066" }} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#D9A066" }}>
                Digital Sovereignty Map
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#B8C4A8" }}>
                The Headwaters zone framework maps your community's digital readiness — from fully platform-dependent to regionally sovereign. Answer 7 questions and we'll tell you exactly where you stand and which engagement fits.
              </p>
            </div>
            <button onClick={() => setDismissed(true)} className="shrink-0 p-1 rounded-lg transition-colors hover:bg-white/10" style={{ color: "#D9A06660" }} aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        <motion.div variants={fadeInUp} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full" style={{ color: "#D9A066", background: "#D9A06618", border: "1px solid #D9A06630" }}>
            <Map className="w-3 h-3" />
            Community Readiness Map
          </div>
          <h1 className="font-serif text-4xl font-bold text-white mb-4">
            Find your community's starting zone.
          </h1>
          <p className="text-lg leading-relaxed max-w-lg mx-auto" style={{ color: "#8FA882" }}>
            Digital sovereignty isn't a single leap. It's a zone-by-zone build. Tell us where your community is, and we'll tell you where to start.
          </p>
        </motion.div>

        <motion.div variants={fadeInUp} className="grid md:grid-cols-2 gap-5">
          <button
            onClick={() => onChoose("guided")}
            className="group text-left p-7 rounded-2xl border-2 transition-all duration-200 hover:shadow-xl"
            style={{ background: "#0E1E0E", borderColor: "#2A3A2A" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#D9A06660")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#2A3A2A")}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "#D9A06618", border: "1px solid #D9A06640" }}>
              <Wand2 className="w-5 h-5" style={{ color: "#D9A066" }} />
            </div>
            <h2 className="font-serif text-xl font-bold text-white mb-2">Walk me through it</h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "#8FA882" }}>
              Answer 7 questions about your community's digital situation. The system reads your context and tells you exactly which zone is your ground floor — with a plain-language explanation.
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2.5 transition-all" style={{ color: "#D9A066" }}>
              Take me through it
              <ChevronRight className="w-4 h-4" />
            </span>
          </button>

          <button
            onClick={() => onChoose("free")}
            className="group text-left p-7 rounded-2xl border-2 transition-all duration-200 hover:shadow-xl"
            style={{ background: "#0E1E0E", borderColor: "#2A3A2A" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#4A8C5C60")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#2A3A2A")}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "#4A8C5C18", border: "1px solid #4A8C5C40" }}>
              <Compass className="w-5 h-5" style={{ color: "#4A8C5C" }} />
            </div>
            <h2 className="font-serif text-xl font-bold text-white mb-2">I already know where we are</h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "#8FA882" }}>
              Skip the questions. Explore all six sovereignty stages and find the service that fits your community's current position. You can always run the guided assessment later.
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2.5 transition-all" style={{ color: "#4A8C5C" }}>
              Show me the map
              <ChevronRight className="w-4 h-4" />
            </span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

function Questionnaire({
  onComplete,
  initialAnswers = {},
}: {
  onComplete: (answers: Record<string, string>) => void;
  initialAnswers?: Record<string, string>;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [value, setValue] = useState(initialAnswers[QUESTIONNAIRE_STEPS[0].key] ?? "");

  const current = QUESTIONNAIRE_STEPS[step];
  const total = QUESTIONNAIRE_STEPS.length;
  const progress = (step / total) * 100;

  function handleNext() {
    if (!value.trim()) return;
    const updated = { ...answers, [current.key]: value.trim() };
    setAnswers(updated);
    if (step + 1 >= total) {
      onComplete(updated);
    } else {
      const nextKey = QUESTIONNAIRE_STEPS[step + 1].key;
      setValue(updated[nextKey] ?? "");
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (step === 0) return;
    const prev = QUESTIONNAIRE_STEPS[step - 1];
    setValue(answers[prev.key] ?? "");
    setStep((s) => s - 1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleNext();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12">
      <motion.div className="max-w-2xl w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#8FA882" }}>
              Question {step + 1} of {total}
            </span>
            <span className="text-xs font-semibold" style={{ color: "#8FA882" }}>
              {Math.round(progress)}% done
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1C2E1C" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "#D9A066" }}
            />
          </div>
        </div>

        <div className="rounded-2xl border p-8 md:p-10" style={{ background: "#0E1E0E", borderColor: "#2A3A2A" }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "#D9A06699" }}>
            Complete the sentence
          </p>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-2 leading-snug">
            {current.prompt}…
          </h2>
          <p className="text-sm mb-6 leading-relaxed italic" style={{ color: "#6B8060" }}>
            {current.hint}
          </p>

          <textarea
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={current.placeholder}
            rows={3}
            className="w-full rounded-xl border px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:ring-2 transition-all"
            style={{
              background: "#0A180A",
              borderColor: "#2A3A2A",
              fontFamily: "inherit",
            }}
          />

          <p className="text-[11px] mt-1.5 mb-6" style={{ color: "#6B806050" }}>
            Press Cmd/Ctrl+Enter to advance
          </p>

          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: "#8FA882" }}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!value.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              style={{ background: "#D9A066", color: "#2B2825" }}
            >
              {step + 1 >= total ? "See our zone" : "Next question"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AssessingScreen() {
  const messages = [
    "Reading your community context…",
    "Mapping to the Headwaters zones…",
    "Forging your recommendation…",
  ];
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % messages.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#D9A06618", border: "1px solid #D9A06640" }}>
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#D9A066" }} />
        </div>
        <h2 className="font-serif text-2xl font-bold text-white mb-3">
          {messages[msgIdx]}
        </h2>
        <p className="text-base leading-relaxed" style={{ color: "#8FA882" }}>
          Matching your community's position to the zone framework. This takes a moment.
        </p>
      </div>
    </div>
  );
}

function StageBar({ currentStage, isGuided }: { currentStage: number; isGuided: boolean }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#6B8060" }}>
          Digital Sovereignty Spectrum
        </span>
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#6B8060" }}>
          Stage {currentStage} of 6
        </span>
      </div>
      <div className="flex gap-1">
        {STAGES.map((s) => {
          const isActive = s.stage === currentStage;
          const isPast = s.stage < currentStage;
          return (
            <div key={s.stage} className="flex-1 relative group">
              <div
                className="h-2.5 rounded-sm transition-all duration-300"
                style={{
                  background: isActive ? s.color : isPast ? s.color + "66" : "#1C2E1C",
                  boxShadow: isActive ? `0 0 8px ${s.color}60` : "none",
                }}
              />
              {isGuided && isActive && (
                <div
                  className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap"
                  style={{ background: s.color + "22", color: s.color, border: `1px solid ${s.color}44` }}
                >
                  You are here
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px]" style={{ color: "#6B806050" }}>Dependent</span>
        <span className="text-[10px]" style={{ color: "#6B806050" }}>Sovereign</span>
      </div>
    </div>
  );
}

function ServiceCard({
  name,
  isPrimary,
  isSecondary,
}: {
  name: string;
  isPrimary: boolean;
  isSecondary: boolean;
}) {
  const svc = SERVICES[name];
  if (!svc) return null;

  return (
    <Link href={svc.href}>
      <div
        className="group block rounded-2xl border-2 p-6 cursor-pointer transition-all duration-200 hover:shadow-xl"
        style={{
          background: isPrimary ? "#0E1E0E" : "#0A180A",
          borderColor: isPrimary ? svc.accent : isSecondary ? svc.accent + "55" : "#1C2E1C",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: svc.accent + "18", border: `1px solid ${svc.accent}40` }}
            >
              <span style={{ color: svc.accent }}>{svc.icon}</span>
            </div>
            <h3 className="font-serif text-lg font-bold text-white">{name}</h3>
          </div>
          {isPrimary && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: svc.accent + "22", color: svc.accent, border: `1px solid ${svc.accent}44` }}
            >
              <Star className="w-2.5 h-2.5" />
              Recommended
            </span>
          )}
          {isSecondary && !isPrimary && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: svc.accent + "12", color: svc.accent + "99", border: `1px solid ${svc.accent}30` }}
            >
              Next step
            </span>
          )}
        </div>
        <p className="text-sm mb-3 leading-relaxed" style={{ color: "#8FA882" }}>
          {svc.tagline}
        </p>
        <span
          className="inline-flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all"
          style={{ color: svc.accent + "cc" }}
        >
          See full details
          <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}

function ResultsView({
  assessment,
  onRetake,
}: {
  assessment: Assessment;
  onRetake: () => void;
}) {
  const stage = STAGES.find((s) => s.stage === assessment.stage) ?? STAGES[0];
  const isGuided = assessment.entryMode === "guided";

  return (
    <div className="min-h-screen" style={{ background: "#0A180A" }}>
      <div
        className="border-b relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0A180A 0%, #0E1E0E 60%, #121E0F 100%)",
          borderColor: "#1C2E1C",
        }}
      >
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(ellipse at 30% 60%, #D9A066 0%, transparent 55%)" }}
        />
        <div className="max-w-4xl mx-auto px-6 pt-28 pb-14 relative">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div>
              <div
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full"
                style={{ color: "#D9A066", background: "#D9A06618", border: "1px solid #D9A06630" }}
              >
                <Map className="w-3 h-3" />
                Your Community's Zone
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-3">
                {isGuided
                  ? `Stage ${assessment.stage}: ${stage.name}.`
                  : "Explore the territory."}
              </h1>
              {assessment.rationale && (
                <p className="text-base leading-relaxed max-w-xl" style={{ color: "#B8C4A8" }}>
                  {assessment.rationale}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {isGuided && (
              <button
                onClick={onRetake}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all"
                style={{ background: "transparent", color: "#FDFBF7cc", borderColor: "#FDFBF720" }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reassess
              </button>
            )}
            {!isGuided && (
              <button
                onClick={onRetake}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all"
                style={{ background: "#D9A066", color: "#2B2825", borderColor: "#D9A066" }}
              >
                <Wand2 className="w-3.5 h-3.5" />
                Get a guided recommendation
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <StageBar currentStage={assessment.stage} isGuided={isGuided} />

        {isGuided && (
          <div className="mb-8 rounded-2xl border p-6" style={{ background: stage.color + "10", borderColor: stage.color + "30" }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: stage.color + "22", border: `1px solid ${stage.color}44` }}>
                <Zap className="w-4 h-4" style={{ color: stage.color }} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white mb-1">Your next move</h3>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "#B8C4A8" }}>
                  Based on where your community stands, the right starting point is a{" "}
                  <strong style={{ color: stage.color }}>{assessment.primaryService}</strong>.
                  {assessment.secondaryService !== assessment.primaryService && (
                    <> After that, a <strong style={{ color: stage.color }}>{assessment.secondaryService}</strong> is the natural next step.</>
                  )}
                </p>
                <a
                  href="mailto:codetry@gmail.com?subject=Community Readiness Conversation"
                  className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
                  style={{ color: stage.color }}
                >
                  Start a conversation
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}

        <h2 className="font-serif text-xl font-bold text-white mb-4">All engagement paths</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {Object.keys(SERVICES).map((name) => (
            <ServiceCard
              key={name}
              name={name}
              isPrimary={assessment.primaryService === name}
              isSecondary={assessment.secondaryService === name}
            />
          ))}
        </div>

        <div
          className="rounded-2xl border p-6 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between"
          style={{ background: "#0E1E0E", borderColor: "#2A3A2A" }}
        >
          <div>
            <h3 className="font-serif text-lg font-bold text-white mb-1">Want to talk it through?</h3>
            <p className="text-sm leading-relaxed" style={{ color: "#8FA882" }}>
              Every community is different. If your situation doesn't fit neatly into a stage, reach out — we'll tell you straight what makes sense.
            </p>
          </div>
          <a
            href="mailto:codetry@gmail.com?subject=Community Readiness Conversation"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap"
            style={{ background: "#D9A066", color: "#2B2825" }}
          >
            Get in touch
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <div className="mt-6 text-center">
          <Link href="/services">
            <span className="text-sm font-medium transition-colors cursor-pointer" style={{ color: "#6B8060" }}>
              View full service details →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const [phase, setPhase] = useState<Phase>("entryGate");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Assessment;
        setAssessment(parsed);
        setPhase("results");
      }
    } catch {
    }
  }, []);

  function handleEntryChoice(mode: "guided" | "free") {
    if (mode === "free") {
      const freeAssessment: Assessment = {
        stage: 1,
        stageName: "Dependent",
        primaryService: "Zone Assessment",
        secondaryService: "Hub Implementation",
        rationale: "",
        answers: {},
        entryMode: "free",
      };
      setAssessment(freeAssessment);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(freeAssessment)); } catch {}
      setPhase("results");
    } else {
      setPhase("questionnaire");
    }
  }

  async function handleQuestionnaireComplete(answers: Record<string, string>) {
    setPhase("assessing");
    setError(null);
    try {
      const res = await fetch("/api/codetry/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `Server error ${res.status}`);
      }
      const data = await res.json() as {
        stage: number;
        stageName: string;
        primaryService: string;
        secondaryService: string;
        rationale: string;
      };
      const result: Assessment = {
        ...data,
        answers,
        entryMode: "guided",
      };
      setAssessment(result);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(result)); } catch {}
      setPhase("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
      setPhase("questionnaire");
    }
  }

  function handleRetake() {
    setAssessment(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setPhase("entryGate");
  }

  return (
    <div className="min-h-screen" style={{ background: "#0A180A", color: "#FDFBF7" }}>
      <EmberBackground />
      <Nav />

      {error && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl border text-sm font-medium shadow-xl" style={{ background: "#1C0E0E", borderColor: "#8B2020", color: "#F87171" }}>
          {error}
          <button onClick={() => setError(null)} className="ml-3 opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      {phase === "entryGate" && <EntryGate onChoose={handleEntryChoice} />}
      {phase === "questionnaire" && (
        <Questionnaire
          onComplete={handleQuestionnaireComplete}
          initialAnswers={assessment?.answers ?? {}}
        />
      )}
      {phase === "assessing" && <AssessingScreen />}
      {phase === "results" && assessment && (
        <ResultsView assessment={assessment} onRetake={handleRetake} />
      )}
    </div>
  );
}
