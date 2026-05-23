import { useState } from "react";
import { Link } from "wouter";
import {
  ChevronRight,
  ChevronLeft,
  Droplets,
  MapPin,
  User,
  Compass,
  Lock,
  CheckCircle2,
  Shield,
  Loader2,
} from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useLifestyleMap } from "../hooks/use-lifestyle-map";

const ZONE_NAMES: Record<string, string> = {
  "zone-0": "Zone 0 — The Self",
  "zone-1": "Zone 1 — The Home",
  "zone-2": "Zone 2 — The Garden",
  "zone-3": "Zone 3 — The Homestead",
  "zone-4": "Zone 4 — The Forest",
  "zone-5": "Zone 5 — The Wild",
};

const ZONE_COLORS: Record<string, string> = {
  "zone-0": "#B5853A",
  "zone-1": "#C4A05A",
  "zone-2": "#6B8F47",
  "zone-3": "#4A7A3A",
  "zone-4": "#2C5F2E",
  "zone-5": "#1A3A1C",
};

const RISK_PROFILE_LABELS: Record<number, string> = {
  1: "Tight — one step at a time",
  2: "Guided — structured focus",
  3: "Balanced — curated view",
  4: "Open — wider exploration",
  5: "Self-directed — full map",
};

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

const MEMBER_FEATURES = [
  {
    icon: MapPin,
    title: "Practitioner-placed zone",
    body: "Tasha reviews your situation and places you on the Lifestyle Map based on where you actually are — your land, your resources, your constraints — not just a quiz.",
  },
  {
    icon: Compass,
    title: "Risk-profile filtered map view",
    body: "Your map view is curated to your risk profile so you see the episodes and resources most relevant to where you're headed, not the full firehose.",
  },
  {
    icon: User,
    title: "Personalized intake rationale",
    body: "After your session you receive a written rationale explaining your placement — a reference point you can return to as your situation evolves.",
  },
];

const PROCESS_STEPS = [
  {
    number: "01",
    title: "Submit your intake form",
    body: "Answer questions about your land situation, existing skills, goals, and constraints. This gives Tasha what she needs before your session.",
  },
  {
    number: "02",
    title: "Session with Tasha Parr",
    body: "A one-on-one conversation to go deeper on your answers, clarify tradeoffs, and work through where you sit on the zone map today.",
  },
  {
    number: "03",
    title: "Receive your placement",
    body: "Your zone is set on your Lifestyle Map. You get a written rationale and a risk-profile filter so the site surfaces the right content for your situation.",
  },
];

function PlacementStatus({
  primaryZone,
  secondaryZone,
  riskProfile,
  rationale,
}: {
  primaryZone: string;
  secondaryZone: string | null;
  riskProfile: number | null;
  rationale: string | null;
}) {
  const primaryColor = ZONE_COLORS[primaryZone] ?? "#4A7A3A";
  const secondaryColor = secondaryZone ? (ZONE_COLORS[secondaryZone] ?? "#4A7A3A") : null;

  return (
    <div
      className="rounded-2xl border p-6 md:p-8"
      style={{ background: "#0A180A", borderColor: `${primaryColor}44` }}
    >
      <div className="flex items-center gap-2 mb-5">
        <CheckCircle2 className="w-4 h-4" style={{ color: primaryColor }} />
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: primaryColor }}
        >
          Your Headwaters placement
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {/* Primary zone */}
        <div
          className="rounded-xl p-4"
          style={{ background: `${primaryColor}12`, border: `1px solid ${primaryColor}33` }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: primaryColor }}>
            Primary zone
          </p>
          <p className="font-semibold text-base" style={{ color: "#FDFBF7" }}>
            {ZONE_NAMES[primaryZone] ?? primaryZone}
          </p>
        </div>

        {/* Secondary zone */}
        {secondaryZone && secondaryColor ? (
          <div
            className="rounded-xl p-4"
            style={{ background: `${secondaryColor}12`, border: `1px solid ${secondaryColor}33` }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: secondaryColor }}>
              Secondary zone
            </p>
            <p className="font-semibold text-base" style={{ color: "#FDFBF7" }}>
              {ZONE_NAMES[secondaryZone] ?? secondaryZone}
            </p>
          </div>
        ) : (
          /* Risk profile takes the second slot if no secondary zone */
          riskProfile != null && (
            <div
              className="rounded-xl p-4"
              style={{ background: "#FDFBF708", border: "1px solid #4A7A3A33" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#8BAD78" }}>
                Risk profile
              </p>
              <p className="font-semibold text-base" style={{ color: "#FDFBF7" }}>
                {RISK_PROFILE_LABELS[riskProfile] ?? `Level ${riskProfile}`}
              </p>
            </div>
          )
        )}
      </div>

      {/* Risk profile row (only shown when secondary zone is also present) */}
      {secondaryZone && riskProfile != null && (
        <div
          className="rounded-xl p-4 mb-5"
          style={{ background: "#FDFBF708", border: "1px solid #4A7A3A33" }}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 flex-shrink-0" style={{ color: "#8BAD78" }} />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider mr-2" style={{ color: "#8BAD78" }}>
                Risk profile
              </span>
              <span className="text-sm" style={{ color: "#C8D4C0" }}>
                {RISK_PROFILE_LABELS[riskProfile] ?? `Level ${riskProfile}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Rationale */}
      {rationale && (
        <div
          className="rounded-xl p-4 mb-5"
          style={{ background: "#FDFBF705", border: "1px solid #FDFBF710" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#8BAD78" }}>
            Your placement rationale
          </p>
          <p className="text-sm leading-relaxed italic" style={{ color: "#C8D4C0" }}>
            "{rationale}"
          </p>
        </div>
      )}

      <Link
        href="/map"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
        style={{ background: primaryColor, color: "#FDFBF7" }}
      >
        View your Lifestyle Map
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

const RISK_OPTIONS = [
  {
    value: "conservative",
    label: "Conservative",
    description: "I prefer to take one step at a time and get each piece right before moving on.",
  },
  {
    value: "moderate",
    label: "Moderate",
    description: "I like structure and guidance but can handle a few things at once.",
  },
  {
    value: "open",
    label: "Open",
    description: "I'm motivated, can handle a bigger map, and like having options to explore.",
  },
  {
    value: "self-directed",
    label: "Self-directed",
    description: "I'm experienced and learn best by wandering. Give me the full picture.",
  },
];

interface FormData {
  name: string;
  email: string;
  householdSize: string;
  landSituation: string;
  landYears: string;
  keySkills: string;
  primaryGoals: string;
  riskTolerance: string;
  additionalNotes: string;
}

const EMPTY_FORM: FormData = {
  name: "",
  email: "",
  householdSize: "",
  landSituation: "",
  landYears: "",
  keySkills: "",
  primaryGoals: "",
  riskTolerance: "",
  additionalNotes: "",
};

const INPUT_STYLE = {
  background: "#0E1F0E",
  borderColor: "#4A7A3A44",
  color: "#FDFBF7",
};

const LABEL_STYLE = { color: "#C8D4C0" };
const HINT_STYLE = { color: "#8AAB82", fontSize: "0.8rem" };

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1 rounded-full flex-1 transition-all"
          style={{ background: i < current ? "#4A7A3A" : "#4A7A3A33" }}
        />
      ))}
    </div>
  );
}

function IntakeForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 4;

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function canProceed(): boolean {
    if (step === 1) return form.name.trim().length > 0 && form.email.trim().includes("@");
    if (step === 2) return form.landSituation.trim().length > 0;
    if (step === 3) return form.primaryGoals.trim().length > 0;
    if (step === 4) return form.riskTolerance.length > 0;
    return false;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(apiUrl("/headwaters/intake"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          householdSize: form.householdSize ? parseInt(form.householdSize, 10) : null,
          landSituation: form.landSituation.trim() || null,
          landYears: form.landYears.trim() || null,
          keySkills: form.keySkills.trim() || null,
          primaryGoals: form.primaryGoals.trim() || null,
          riskTolerance: form.riskTolerance || null,
          additionalNotes: form.additionalNotes.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Submission failed");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="rounded-2xl border p-8 md:p-10 text-center"
        style={{ background: "#0A180A", borderColor: "#4A7A3A55" }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: "#4A7A3A22" }}
        >
          <CheckCircle2 className="w-7 h-7" style={{ color: "#4A7A3A" }} />
        </div>
        <h3 className="font-serif text-2xl font-bold mb-3" style={{ color: "#FDFBF7" }}>
          You're in the queue
        </h3>
        <p className="text-base leading-relaxed max-w-md mx-auto" style={{ color: "#C8D4C0" }}>
          Tasha will review your intake and reach out to schedule your session. Keep an eye on{" "}
          <span style={{ color: "#FDFBF7" }}>{form.email}</span> — she typically follows up within
          a few business days.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border p-7 md:p-10"
      style={{ background: "#0A180A", borderColor: "#4A7A3A33" }}
    >
      <StepIndicator current={step} total={totalSteps} />

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#4A7A3A" }}>
              Step 1 of 4
            </p>
            <h3 className="font-serif text-2xl font-bold mb-1" style={{ color: "#FDFBF7" }}>
              About you
            </h3>
            <p className="text-sm mb-6" style={HINT_STYLE}>
              Your contact info so Tasha can reach you to schedule the session.
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium" style={LABEL_STYLE}>
              Full name <span style={{ color: "#4A7A3A" }}>*</span>
            </label>
            <input
              type="text"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{ ...INPUT_STYLE, "--tw-ring-color": "#4A7A3A" } as React.CSSProperties}
              placeholder="Your name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium" style={LABEL_STYLE}>
              Email address <span style={{ color: "#4A7A3A" }}>*</span>
            </label>
            <input
              type="email"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
              style={INPUT_STYLE}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium" style={LABEL_STYLE}>
              Household size
            </label>
            <input
              type="number"
              min="1"
              max="20"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
              style={INPUT_STYLE}
              placeholder="Number of people in your household"
              value={form.householdSize}
              onChange={(e) => set("householdSize", e.target.value)}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#4A7A3A" }}>
              Step 2 of 4
            </p>
            <h3 className="font-serif text-2xl font-bold mb-1" style={{ color: "#FDFBF7" }}>
              Your land
            </h3>
            <p className="text-sm mb-6" style={HINT_STYLE}>
              Describe where you live and what you're working with. No land at all is a valid answer.
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium" style={LABEL_STYLE}>
              Land situation <span style={{ color: "#4A7A3A" }}>*</span>
            </label>
            <textarea
              rows={4}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none"
              style={INPUT_STYLE}
              placeholder="e.g. 2-acre suburban lot in Tennessee, mostly lawn right now. Renting, so limited to container gardening on a patio. City apartment with a small balcony. 20 acres of mixed timber in rural Ontario…"
              value={form.landSituation}
              onChange={(e) => set("landSituation", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium" style={LABEL_STYLE}>
              How long have you been working this land / situation?
            </label>
            <input
              type="text"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
              style={INPUT_STYLE}
              placeholder="e.g. Just moved in, 3 years, 10+ years"
              value={form.landYears}
              onChange={(e) => set("landYears", e.target.value)}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#4A7A3A" }}>
              Step 3 of 4
            </p>
            <h3 className="font-serif text-2xl font-bold mb-1" style={{ color: "#FDFBF7" }}>
              Skills &amp; goals
            </h3>
            <p className="text-sm mb-6" style={HINT_STYLE}>
              Be honest about where you actually are — not where you want to be. That's how Tasha
              gets the placement right.
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium" style={LABEL_STYLE}>
              Key skills you already have
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none"
              style={INPUT_STYLE}
              placeholder="e.g. Basic food storage, raised bed gardening, some canning. Or: nothing yet — that's why I'm here."
              value={form.keySkills}
              onChange={(e) => set("keySkills", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium" style={LABEL_STYLE}>
              Primary goals <span style={{ color: "#4A7A3A" }}>*</span>
            </label>
            <textarea
              rows={4}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none"
              style={INPUT_STYLE}
              placeholder="What are you working toward? What problem are you trying to solve? What does 'more resilient' look like for your family?"
              value={form.primaryGoals}
              onChange={(e) => set("primaryGoals", e.target.value)}
            />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#4A7A3A" }}>
              Step 4 of 4
            </p>
            <h3 className="font-serif text-2xl font-bold mb-1" style={{ color: "#FDFBF7" }}>
              How you approach new things
            </h3>
            <p className="text-sm mb-6" style={HINT_STYLE}>
              This shapes your risk profile — which determines how the site filters content for you
              after your placement.
            </p>
          </div>

          <div className="space-y-3">
            {RISK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("riskTolerance", opt.value)}
                className="w-full rounded-xl border p-4 text-left transition-all"
                style={{
                  background: form.riskTolerance === opt.value ? "#4A7A3A22" : "#0E1F0E",
                  borderColor: form.riskTolerance === opt.value ? "#4A7A3A" : "#4A7A3A33",
                }}
              >
                <p className="font-semibold text-sm mb-0.5" style={{ color: "#FDFBF7" }}>
                  {opt.label}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "#C8D4C0" }}>
                  {opt.description}
                </p>
              </button>
            ))}
          </div>

          <div className="space-y-1 pt-2">
            <label className="block text-sm font-medium" style={LABEL_STYLE}>
              Anything else Tasha should know?
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none resize-none"
              style={INPUT_STYLE}
              placeholder="Constraints, timeline, specific concerns, or context that didn't fit above."
              value={form.additionalNotes}
              onChange={(e) => set("additionalNotes", e.target.value)}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm rounded-lg px-3 py-2" style={{ background: "#3A0A0A", color: "#F5A0A0" }}>
          {error}
        </p>
      )}

      <div className="flex items-center justify-between mt-7">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ color: "#C8D4C0", border: "1px solid #4A7A3A33" }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        ) : (
          <div />
        )}

        {step < totalSteps ? (
          <button
            type="button"
            disabled={!canProceed()}
            onClick={() => setStep((s) => s + 1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#4A7A3A", color: "#FDFBF7" }}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={!canProceed() || submitting}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#4A7A3A", color: "#FDFBF7" }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Submit intake
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function HeadwatersPage() {
  const { isAuthenticated } = useAuth();
  const { map, loading: mapLoading } = useLifestyleMap();

  const isPlaced =
    isAuthenticated &&
    map !== null &&
    map.entryMode === "practitioner" &&
    map.primaryZone != null;

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
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 70% 30%, #4A7A3A44 0%, transparent 60%), radial-gradient(circle at 20% 80%, #2C5F2E33 0%, transparent 50%)",
          }}
        />
        <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <Droplets className="w-5 h-5" style={{ color: "#4A7A3A" }} />
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "#4A7A3A" }}
              >
                Headwaters
              </span>
            </div>
            <h1
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              style={{ color: "#FDFBF7" }}
            >
              Know where you stand
            </h1>
            <p className="text-lg md:text-xl leading-relaxed mb-8 max-w-2xl" style={{ color: "#C8D4C0" }}>
              Headwaters is a practitioner intake program for The Stomping Path community. A personal
              session with Tasha Parr places you on the Lifestyle Map based on your actual situation —
              your land, your resources, your risk profile — and unlocks a filtered view of the site
              built around where you are today.
            </p>
            {!isPlaced && (
              <a
                href="#intake-form"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all hover:opacity-90"
                style={{ background: "#4A7A3A", color: "#FDFBF7" }}
              >
                Start the intake process
                <ChevronRight className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-16 md:py-20 max-w-4xl space-y-20">

        {/* Member placement status — shown to authenticated placed members */}
        {isAuthenticated && !mapLoading && isPlaced && map && map.primaryZone && (
          <section>
            <PlacementStatus
              primaryZone={map.primaryZone}
              secondaryZone={map.secondaryZone}
              riskProfile={map.riskProfile}
              rationale={map.rationale}
            />
          </section>
        )}

        {/* Who is Tasha Parr */}
        <section>
          <div
            className="rounded-2xl border p-8 md:p-10"
            style={{ background: "#0A180A", borderColor: "#4A7A3A33" }}
          >
            <div className="flex items-start gap-5">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                style={{ background: "#4A7A3A22", border: "1px solid #4A7A3A44" }}
              >
                <User className="w-6 h-6" style={{ color: "#4A7A3A" }} />
              </div>
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: "#4A7A3A" }}
                >
                  Your practitioner
                </p>
                <h2
                  className="font-serif text-2xl md:text-3xl font-bold mb-4"
                  style={{ color: "#FDFBF7" }}
                >
                  Tasha Parr
                </h2>
                <p className="text-base leading-relaxed mb-4" style={{ color: "#C8D4C0" }}>
                  Tasha is a permaculture practitioner and long-time Stomping Path community member
                  who has worked through the zone framework with dozens of families and homesteaders.
                  She brings a practical, no-quiz-required approach to zone placement: she asks about
                  your land, your household, your goals, and your constraints, and she uses that
                  picture to put you in the right place on the map.
                </p>
                <p className="text-base leading-relaxed" style={{ color: "#C8D4C0" }}>
                  Her intake sessions typically run 45–60 minutes. There is no upsell, no follow-on
                  program, and no pressure. The deliverable is a placement, a written rationale, and
                  a risk profile that shapes what the site shows you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What you get */}
        <section>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: "#4A7A3A" }}
          >
            Member features
          </p>
          <h2
            className="font-serif text-3xl md:text-4xl font-bold mb-8"
            style={{ color: "#FDFBF7" }}
          >
            What Headwaters unlocks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MEMBER_FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border p-6"
                style={{ background: "#0A180A", borderColor: "#4A7A3A33" }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: "#4A7A3A22" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "#4A7A3A" }} />
                </div>
                <h3
                  className="font-semibold text-base mb-2"
                  style={{ color: "#FDFBF7" }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#C8D4C0" }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
          <div
            className="mt-6 rounded-xl p-4 flex items-start gap-3"
            style={{ background: "#FDFBF708", border: "1px solid #4A7A3A22" }}
          >
            <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#4A7A3A" }} />
            <p className="text-sm" style={{ color: "#C8D4C0" }}>
              Member features are visible on the{" "}
              <Link
                href="/map"
                className="underline underline-offset-2"
                style={{ color: "#4A7A3A" }}
              >
                Lifestyle Map
              </Link>{" "}
              once your placement is set. They remain active for as long as you are a Headwaters
              member.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: "#4A7A3A" }}
          >
            The process
          </p>
          <h2
            className="font-serif text-3xl md:text-4xl font-bold mb-8"
            style={{ color: "#FDFBF7" }}
          >
            How intake works
          </h2>
          <div className="space-y-4">
            {PROCESS_STEPS.map(({ number, title, body }) => (
              <div
                key={number}
                className="rounded-2xl border p-6 flex items-start gap-6"
                style={{ background: "#0A180A", borderColor: "#4A7A3A33" }}
              >
                <span
                  className="font-serif text-3xl font-bold leading-none flex-shrink-0 mt-1"
                  style={{ color: "#4A7A3A33" }}
                >
                  {number}
                </span>
                <div>
                  <h3
                    className="font-semibold text-base mb-1"
                    style={{ color: "#FDFBF7" }}
                  >
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#C8D4C0" }}>
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Intake Form — only shown to non-placed visitors */}
        {!isPlaced && (
          <section id="intake-form">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: "#4A7A3A" }}
            >
              Apply now
            </p>
            <h2
              className="font-serif text-3xl md:text-4xl font-bold mb-3"
              style={{ color: "#FDFBF7" }}
            >
              Submit your intake
            </h2>
            <p className="text-base leading-relaxed mb-8 max-w-2xl" style={{ color: "#C8D4C0" }}>
              Fill out the form below. Tasha reviews every submission personally and will reach out
              to schedule your session.
            </p>
            <IntakeForm />
          </section>
        )}

        {/* Bottom CTA — View the map */}
        <section>
          <div
            className="rounded-2xl border p-8 md:p-10 text-center"
            style={{ background: "#0A180A", borderColor: "#4A7A3A33" }}
          >
            <Droplets className="w-10 h-10 mx-auto mb-4" style={{ color: "#4A7A3A" }} />
            <h2
              className="font-serif text-2xl md:text-3xl font-bold mb-3"
              style={{ color: "#FDFBF7" }}
            >
              {isPlaced ? "Your placement is active" : "Curious what the map looks like?"}
            </h2>
            <p className="text-base leading-relaxed mb-6 max-w-xl mx-auto" style={{ color: "#C8D4C0" }}>
              {isPlaced
                ? "Your zone and risk profile are shaping what the site shows you. Visit your Lifestyle Map to see your filtered view."
                : "You can explore the Lifestyle Map before your session. Your zone placement will activate once Tasha completes your intake."}
            </p>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base border transition-all hover:opacity-80"
              style={{ borderColor: "#4A7A3A44", color: "#C8D4C0" }}
            >
              View the Lifestyle Map
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
