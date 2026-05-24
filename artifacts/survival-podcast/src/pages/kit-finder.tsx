import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, RotateCcw, Compass } from "lucide-react";
import {
  FINDER_QUESTIONS,
  FinderAnswer,
  resolveKit,
} from "@/lib/kit-finder";

type PartialAnswers = Partial<FinderAnswer>;

const TOTAL = FINDER_QUESTIONS.length;

export default function KitFinderPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<PartialAnswers>({});
  const [selected, setSelected] = useState<string | null>(null);

  const question = FINDER_QUESTIONS[step];

  function handleSelect(value: string) {
    setSelected(value);
  }

  function handleNext() {
    if (!selected) return;
    const newAnswers = { ...answers, [question.id]: selected } as PartialAnswers;
    setAnswers(newAnswers);
    setSelected(null);

    if (step < TOTAL - 1) {
      setStep(step + 1);
    } else {
      const full = newAnswers as FinderAnswer;
      const result = resolveKit(full);
      const params = new URLSearchParams({
        from_finder: "1",
        situation: full.situation,
        goal: full.goal,
        companions: full.companions,
        entry: full.entry,
        readiness: full.readiness,
        reason: result.reason,
        ...(result.secondary ? { secondary: result.secondary } : {}),
      });
      navigate(`/kits/${result.primary}?${params.toString()}`);
    }
  }

  function handleBack() {
    if (step === 0) return;
    const prev = FINDER_QUESTIONS[step - 1];
    setSelected((answers[prev.id] as string) ?? null);
    setStep(step - 1);
  }

  function handleRestart() {
    setStep(0);
    setAnswers({});
    setSelected(null);
  }

  const progress = (step / TOTAL) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div
        className="border-b border-border relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0F1F1A 0%, #1A2E24 60%, #1E3A2E 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(ellipse at 60% 50%, #8FA883 0%, transparent 55%)",
          }}
        />
        <div className="max-w-2xl mx-auto px-6 py-12 relative">
          <Link
            href="/kits"
            className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 transition-colors"
            style={{ color: "#8FA883" }}
          >
            <ArrowLeft className="w-4 h-4" />
            All Kits
          </Link>

          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full"
            style={{
              color: "#8FA883",
              background: "#8FA88318",
              border: "1px solid #8FA88333",
            }}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Kit Finder</span>
          </div>

          <h1
            className="font-serif text-3xl md:text-4xl font-bold leading-tight mb-3"
            style={{ color: "#FDFBF7" }}
          >
            Find your kit.
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "#C8D4C0" }}>
            Answer {TOTAL} short questions and we'll route you to the right kit — no browsing required.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-border">
        <div
          className="h-1 transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #8FA883, #D9A066)",
          }}
        />
      </div>

      {/* Question card */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Question {step + 1} of {TOTAL}
          </span>
          {step > 0 && (
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Start over
            </button>
          )}
        </div>

        <h2 className="font-serif text-2xl font-bold text-foreground mb-1 mt-4">
          {question.text}
        </h2>
        {question.subtext && (
          <p className="text-sm text-muted-foreground mb-6">{question.subtext}</p>
        )}

        <div className="flex flex-col gap-3 mb-8">
          {question.options.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className="w-full text-left rounded-xl border p-4 transition-all duration-150"
                style={
                  isSelected
                    ? {
                        borderColor: "#8FA883",
                        background: "#8FA88315",
                        boxShadow: "0 0 0 2px #8FA88340",
                      }
                    : {
                        borderColor: "var(--border)",
                        background: "var(--card)",
                      }
                }
              >
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all"
                    style={
                      isSelected
                        ? { borderColor: "#8FA883", background: "#8FA883" }
                        : { borderColor: "var(--border)" }
                    }
                  >
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div
                      className="font-semibold text-sm mb-0.5 transition-colors"
                      style={{ color: isSelected ? "#8FA883" : "var(--foreground)" }}
                    >
                      {opt.label}
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      {opt.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={!selected}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
            style={{
              color: "#fff",
              background: selected ? "#8FA883" : "#8FA88360",
              boxShadow: selected ? "0 4px 16px #8FA88340" : "none",
            }}
          >
            {step === TOTAL - 1 ? "Find my kit" : "Next"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
