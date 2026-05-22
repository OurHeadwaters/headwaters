import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useLifestyleMap, type LifestyleMap } from "@/hooks/use-lifestyle-map";
import { ZONES } from "@/lib/zones";
import ZoneBubbleMap from "@/components/ZoneBubbleMap";
import {
  Loader2,
  Map,
  Compass,
  Wand2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Zap,
  Star,
  Navigation,
  X,
  MapPin,
} from "lucide-react";

const ZONE_COLORS: Record<string, string> = {
  "zone-0": "#B5853A",
  "zone-1": "#C4A05A",
  "zone-2": "#6B8F47",
  "zone-3": "#4A7A3A",
  "zone-4": "#2C5F2E",
  "zone-5": "#1A3A1C",
};

const ZONE_BG: Record<string, string> = {
  "zone-0": "#B5853A18",
  "zone-1": "#C4A05A18",
  "zone-2": "#6B8F4718",
  "zone-3": "#4A7A3A18",
  "zone-4": "#2C5F2E18",
  "zone-5": "#1A3A1C18",
};

const ZONE_RING: Record<string, string> = {
  "zone-0": "#B5853A",
  "zone-1": "#C4A05A",
  "zone-2": "#6B8F47",
  "zone-3": "#4A7A3A",
  "zone-4": "#2C5F2E",
  "zone-5": "#1A3A1C",
};

const ZONE_DESCRIPTIONS: Record<string, string> = {
  "zone-0": "Mindset, money, freedom, and personal sovereignty",
  "zone-1": "Home preparedness, food storage, and basic resilience",
  "zone-2": "Gardening, permaculture, and food production",
  "zone-3": "Homesteading, livestock, and off-grid systems",
  "zone-4": "Hunting, foraging, and bushcraft skills",
  "zone-5": "Grid-down contingency and wilderness survival",
};

const QUESTIONNAIRE_STEPS = [
  {
    key: "season",
    prompt: "Right now, I'm in a season of",
    placeholder: "e.g. building a career, raising young kids, getting out of debt, settling into a homestead…",
    hint: "Describe where you are in life broadly — not where you want to go.",
  },
  {
    key: "household",
    prompt: "My household is",
    placeholder: "e.g. just me, a couple with no kids, a family with 3 young children, multi-generational…",
    hint: "Who's in the picture and what life stage are you at?",
  },
  {
    key: "time",
    prompt: "In a typical week, I can realistically commit",
    placeholder: "e.g. an hour here and there, 5 hours on weekends, very little — I'm stretched thin…",
    hint: "Be honest — this shapes what's actually achievable for you.",
  },
  {
    key: "gap",
    prompt: "My biggest gap in resilience right now is",
    placeholder: "e.g. we'd be in trouble if the grocery store closed for a week, I have no financial cushion, I don't know how to grow food…",
    hint: "Where would you feel most exposed if something went wrong?",
  },
  {
    key: "budget",
    prompt: "When it comes to investing in resilience, my budget is",
    placeholder: "e.g. tight — under $100/month, moderate — a few hundred a year, I can invest in land/infrastructure…",
    hint: "What you can actually spend shapes which zones are accessible right now.",
  },
  {
    key: "skill",
    prompt: "My strongest existing skill in this space is",
    placeholder: "e.g. cooking from scratch, basic financial planning, I've gardened for years, I hunt every fall…",
    hint: "What do you already do well? This tells us where to build from.",
  },
  {
    key: "change",
    prompt: "The one thing I most want to change or build in the next year is",
    placeholder: "e.g. grow some of my own food, get out of debt, learn to preserve food, feel less financially fragile…",
    hint: "Your gut answer here often points directly to your zone.",
  },
];

function LoginGate() {
  const { login } = useAuth();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "#4A7A3A18", border: "1px solid #4A7A3A44" }}
        >
          <Map className="w-7 h-7" style={{ color: "#4A7A3A" }} />
        </div>
        <h1 className="font-serif text-3xl font-bold text-foreground mb-4">
          Your Lifestyle Map
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed mb-8">
          The Lifestyle Map is a private tool that places you in the territory based on your
          actual life context — so you start in the right zone, not just the first one.
          Log in to access your map.
        </p>
        <button
          onClick={login}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-sm transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md"
        >
          Log in to continue
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function EntryGate({ onChoose }: { onChoose: (mode: "guided" | "free") => void }) {
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        {/* Welcome banner — shown only on first visit (no map record yet) */}
        {!welcomeDismissed && (
          <div
            className="relative mb-8 rounded-2xl border px-6 py-5 flex items-start gap-4"
            style={{
              background: "linear-gradient(135deg, #1A2C1A 0%, #12241A 100%)",
              borderColor: "#4A7A3A44",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "#4A7A3A22", border: "1px solid #4A7A3A55" }}
            >
              <MapPin className="w-4 h-4" style={{ color: "#6B9E50" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-1"
                style={{ color: "#6B9E50" }}
              >
                Welcome to TSP
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#C8D4C0" }}>
                Your Lifestyle Map is a personalized guide to the TSP Zone framework — a
                permaculture-inspired model that moves from the self outward. It places you
                in the territory based on where you actually are right now, so you build
                real resilience in the right order.
              </p>
            </div>
            <button
              onClick={() => setWelcomeDismissed(true)}
              aria-label="Dismiss welcome message"
              className="shrink-0 p-1 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: "#6B9E5099" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full"
            style={{ color: "#4A7A3A", background: "#4A7A3A18", border: "1px solid #4A7A3A33" }}
          >
            <Map className="w-3 h-3" />
            Your Lifestyle Map
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">
            Find your place in the territory.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Self-reliance is a territory, not a checklist. This map places you in it
            — so you know where you stand and where to go next.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <button
            onClick={() => onChoose("guided")}
            className="group text-left p-7 rounded-2xl border-2 border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-200"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
              style={{ background: "#4A7A3A18", border: "1px solid #4A7A3A44" }}
            >
              <Wand2 className="w-5 h-5" style={{ color: "#4A7A3A" }} />
            </div>
            <h2 className="font-serif text-xl font-bold text-foreground mb-2">
              Guide me through the territory
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Answer 7 quick questions about your life context. The system will read
              your answers and tell you exactly which zone is your ground floor —
              with a plain-language explanation of why.
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
              Take me through it
              <ChevronRight className="w-4 h-4" />
            </span>
          </button>

          <button
            onClick={() => onChoose("free")}
            className="group text-left p-7 rounded-2xl border-2 border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-200"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
              style={{ background: "#B5853A18", border: "1px solid #B5853A44" }}
            >
              <Compass className="w-5 h-5" style={{ color: "#B5853A" }} />
            </div>
            <h2 className="font-serif text-xl font-bold text-foreground mb-2">
              I'll find my own way
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Skip the questions. Explore all six zones at will and drop into
              whatever territory pulls you in. You can always run the guided
              assessment later if you want a recommendation.
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#B5853A" }}>
              Open the map
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>
      </div>
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
  const progress = ((step) / total) * 100;

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
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleNext();
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Question {step + 1} of {total}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {Math.round(progress)}% done
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "#4A7A3A" }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 md:p-10">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Complete the sentence
          </p>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2 leading-snug">
            {current.prompt}…
          </h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed italic">
            {current.hint}
          </p>

          <textarea
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={current.placeholder}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
          />

          <p className="text-[11px] text-muted-foreground/60 mt-1.5 mb-6">
            Press Cmd/Ctrl+Enter to advance
          </p>

          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!value.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {step + 1 >= total ? "See my map" : "Next question"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssessingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "#4A7A3A18", border: "1px solid #4A7A3A44" }}
        >
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#4A7A3A" }} />
        </div>
        <h2 className="font-serif text-2xl font-bold text-foreground mb-3">
          Reading your territory…
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Mapping your life context to the zone framework. This takes a moment.
        </p>
      </div>
    </div>
  );
}

function ZoneCard({
  zone,
  isPrimary,
  isSecondary,
  isVisited,
  onVisit,
}: {
  zone: (typeof ZONES)[0];
  isPrimary: boolean;
  isSecondary: boolean;
  isVisited: boolean;
  onVisit: (slug: string) => void;
}) {
  const color = ZONE_COLORS[zone.slug] ?? "#4A7A3A";
  const bg = ZONE_BG[zone.slug] ?? "#4A7A3A18";

  return (
    <Link
      href={`/zones/${zone.slug}`}
      onClick={() => onVisit(zone.slug)}
      className="group relative block rounded-2xl border-2 transition-all duration-200 overflow-hidden hover:shadow-lg"
      style={{
        borderColor: isPrimary
          ? color
          : isSecondary
          ? color + "88"
          : isVisited
          ? color + "55"
          : "var(--border)",
        background: isPrimary ? bg : isVisited ? bg + "80" : "var(--card)",
      }}
    >
      {/* Badge row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-0">
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: color + "cc" }}
        >
          Zone {zone.number}
        </span>
        <div className="flex items-center gap-1.5">
          {isPrimary && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: color + "22", color: color, border: `1px solid ${color}44` }}
            >
              <Star className="w-2.5 h-2.5" />
              Your zone
            </span>
          )}
          {isSecondary && !isPrimary && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: color + "18", color: color + "cc", border: `1px solid ${color}33` }}
            >
              <Navigation className="w-2.5 h-2.5" />
              Next step
            </span>
          )}
          {isVisited && (
            <CheckCircle2
              className="w-3.5 h-3.5"
              style={{ color: color + "99" }}
            />
          )}
        </div>
      </div>

      <div className="p-4 pt-2">
        <h3
          className="font-serif text-lg font-bold mb-1"
          style={{ color: isPrimary || isSecondary ? color : "var(--foreground)" }}
        >
          {zone.name}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {ZONE_DESCRIPTIONS[zone.slug]}
        </p>
        <div
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all"
          style={{ color: color + "cc" }}
        >
          Explore this zone
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  );
}

function SurrenderModeCard({ map }: { map: LifestyleMap }) {
  const primaryZone = ZONES.find((z) => z.slug === map.primaryZone);
  if (!primaryZone) return null;

  const color = ZONE_COLORS[primaryZone.slug] ?? "#4A7A3A";

  return (
    <div
      className="rounded-2xl border p-6"
      style={{ background: color + "12", borderColor: color + "33" }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: color + "22", border: `1px solid ${color}44` }}
        >
          <Zap className="w-4 h-4" style={{ color }} />
        </div>
        <div className="flex-1">
          <h3 className="font-serif text-lg font-bold text-foreground mb-1">
            Your next step
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Based on your zone placement, the best move right now is to start the{" "}
            <strong style={{ color }}>{primaryZone.name}</strong> learning track.
            It's organized to build exactly the competencies that match your position
            in the territory.
          </p>
          <Link
            href="/tracks"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color }}
          >
            Browse learning tracks
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Returns the subset of ZONES a client should see based on their risk profile.
 * Only applied for practitioner-placed maps (entryMode === "practitioner").
 * riskProfile 1–2 → primary zone only
 * riskProfile 3   → primary + secondary zones
 * riskProfile 4–5 → full map
 * null / other    → full map
 */
function filteredZones(
  allZones: typeof ZONES,
  entryMode: string,
  riskProfile: number | null,
  primaryZone: string | null,
  secondaryZone: string | null,
): typeof ZONES {
  if (entryMode !== "practitioner" || riskProfile == null) return allZones;
  if (riskProfile <= 2) {
    return primaryZone ? allZones.filter((z) => z.slug === primaryZone) : allZones;
  }
  if (riskProfile === 3) {
    const keep = new Set<string>([
      ...(primaryZone ? [primaryZone] : []),
      ...(secondaryZone ? [secondaryZone] : []),
    ]);
    return allZones.filter((z) => keep.has(z.slug));
  }
  return allZones;
}

function MapView({
  map,
  onToggleSurrender,
  onVisit,
  onRetake,
}: {
  map: LifestyleMap;
  onToggleSurrender: () => void;
  onVisit: (slug: string) => void;
  onRetake: () => void;
}) {
  const primaryZone = map.primaryZone;
  const secondaryZone = map.secondaryZone;
  const visitedZones = (map.visitedZones as string[]) ?? [];
  const isGuided = map.entryMode === "guided";
  const shownZones = filteredZones(ZONES, map.entryMode, map.riskProfile ?? null, primaryZone, secondaryZone);

  const [highlightedZone, setHighlightedZone] = useState<string | null>(null);

  const handleBubbleMapZoneClick = useCallback((slug: string) => {
    setHighlightedZone(slug);
    setTimeout(() => setHighlightedZone(null), 1600);
    const el = document.getElementById(`zone-card-${slug}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

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
              "radial-gradient(ellipse at 30% 60%, #4A7A3A 0%, transparent 50%)",
          }}
        />
        <div className="max-w-4xl mx-auto px-6 py-14 relative">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full"
                style={{
                  color: "#4A7A3A",
                  background: "#4A7A3A18",
                  border: "1px solid #4A7A3A33",
                }}
              >
                <Map className="w-3 h-3" />
                Your Lifestyle Map
              </div>
              <h1
                className="font-serif text-3xl md:text-4xl font-bold mb-3"
                style={{ color: "#FDFBF7" }}
              >
                {isGuided && primaryZone
                  ? `You're in ${ZONES.find((z) => z.slug === primaryZone)?.name ?? "the territory"}.`
                  : "The Territory"}
              </h1>
              {map.rationale && (
                <p
                  className="text-base leading-relaxed max-w-xl"
                  style={{ color: "#C8D4C0" }}
                >
                  {map.rationale}
                </p>
              )}
              {!isGuided && (
                <p
                  className="text-base leading-relaxed max-w-xl"
                  style={{ color: "#C8D4C0" }}
                >
                  Explore all six zones at your own pace. Zones you visit will be
                  stamped on the map.
                </p>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 mt-6">
            {/* Surrender mode toggle */}
            <button
              onClick={onToggleSurrender}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border"
              style={
                map.surrenderMode
                  ? {
                      background: "#4A7A3A",
                      color: "#FDFBF7",
                      borderColor: "#4A7A3A",
                    }
                  : {
                      background: "transparent",
                      color: "#FDFBF7cc",
                      borderColor: "#FDFBF730",
                    }
              }
            >
              <Zap className="w-3.5 h-3.5" />
              {map.surrenderMode ? "Surrender Mode: On" : "Surrender Mode"}
            </button>

            {isGuided ? (
              <button
                onClick={onRetake}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border"
                style={{
                  background: "transparent",
                  color: "#FDFBF7cc",
                  borderColor: "#FDFBF730",
                }}
              >
                <Wand2 className="w-3.5 h-3.5" />
                Reassess my zone
              </button>
            ) : (
              <button
                onClick={onRetake}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border"
                style={{
                  background: "transparent",
                  color: "#FDFBF7cc",
                  borderColor: "#FDFBF730",
                }}
              >
                <Wand2 className="w-3.5 h-3.5" />
                Get a recommendation
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Surrender mode card */}
        {map.surrenderMode && isGuided && map.primaryZone && (
          <SurrenderModeCard map={map} />
        )}
        {map.surrenderMode && !isGuided && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary/10 border border-primary/20">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground mb-1">
                  Your next step
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Not sure where to start? The Learning Tracks organize the entire archive
                  into structured paths through the zone framework — start with the zone
                  that matches where you are right now.
                </p>
                <Link
                  href="/tracks"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Browse learning tracks <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Zone map */}
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">
            <span className="w-6 h-px bg-border" />
            The Territory — Zone 0 (innermost) to Zone 5 (outermost)
          </div>

          {/* Zone Bubble & Gate Diagram */}
          <div className="mb-8">
            <ZoneBubbleMap
              primaryZone={isGuided ? (primaryZone ?? null) : null}
              visitedZones={visitedZones}
              onZoneClick={handleBubbleMapZoneClick}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shownZones.map((zone) => (
              <div
                key={zone.slug}
                id={`zone-card-${zone.slug}`}
                style={
                  highlightedZone === zone.slug
                    ? {
                        borderRadius: "1rem",
                        boxShadow: `0 0 0 3px ${ZONE_COLORS[zone.slug] ?? "#4A7A3A"}66, 0 0 20px ${ZONE_COLORS[zone.slug] ?? "#4A7A3A"}33`,
                        transition: "box-shadow 0.3s ease",
                      }
                    : { transition: "box-shadow 0.5s ease" }
                }
              >
                <ZoneCard
                  zone={zone}
                  isPrimary={isGuided && zone.slug === primaryZone}
                  isSecondary={isGuided && zone.slug === secondaryZone && zone.slug !== primaryZone}
                  isVisited={visitedZones.includes(zone.slug)}
                  onVisit={onVisit}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer hints */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t border-border pt-6">
          {isGuided && (
            <span className="flex items-center gap-1.5">
              <Star className="w-3 h-3" />
              Highlighted zone = your AI-recommended starting point
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            Checkmark = zone you've visited
          </span>
          {isGuided && (
            <span className="flex items-center gap-1.5">
              <Navigation className="w-3 h-3" />
              "Next step" = your secondary zone
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MapPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { map, loading, saveMap, markVisited, assess } = useLifestyleMap();
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<
    "loading" | "gate" | "questionnaire" | "assessing" | "map"
  >("loading");
  const [retake, setRetake] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("retake") === "true") {
      setRetake(true);
    }
  }, []);

  useEffect(() => {
    if (authLoading || loading) return;

    if (!isAuthenticated) {
      setPhase("gate");
      return;
    }

    if (!map) {
      setPhase("gate");
      return;
    }

    if (retake) {
      setPhase("questionnaire");
      return;
    }

    setPhase("map");
  }, [authLoading, loading, isAuthenticated, map, retake]);

  if (phase === "loading" || authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginGate />;
  }

  if (phase === "gate") {
    return (
      <EntryGate
        onChoose={async (mode) => {
          if (mode === "free") {
            await saveMap({ entryMode: "free" });
            setPhase("map");
          } else {
            setPhase("questionnaire");
          }
        }}
      />
    );
  }

  if (phase === "questionnaire") {
    return (
      <Questionnaire
        initialAnswers={(map?.answers as Record<string, string>) ?? {}}
        onComplete={async (answers) => {
          setPhase("assessing");
          try {
            const result = await assess(answers);
            await saveMap({
              entryMode: "guided",
              answers,
              primaryZone: result.primaryZone,
              secondaryZone: result.secondaryZone,
              rationale: result.rationale,
            });
            setRetake(false);
            navigate("/map", { replace: true });
            setPhase("map");
          } catch {
            await saveMap({ entryMode: "guided", answers });
            setRetake(false);
            navigate("/map", { replace: true });
            setPhase("map");
          }
        }}
      />
    );
  }

  if (phase === "assessing") {
    return <AssessingScreen />;
  }

  if (!map) {
    return <LoginGate />;
  }

  return (
    <MapView
      map={map}
      onToggleSurrender={async () => {
        await saveMap({ surrenderMode: !map.surrenderMode });
      }}
      onVisit={(slug) => {
        markVisited(slug);
      }}
      onRetake={() => {
        setRetake(true);
        setPhase("questionnaire");
      }}
    />
  );
}
