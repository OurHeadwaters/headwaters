import { useState } from "react";
import { Link } from "wouter";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { ChevronRight, Printer, RotateCcw, Scale } from "lucide-react";

const CRITERIA = [
  {
    id: "replication",
    label: "Replication",
    question: "Has this been independently replicated by researchers who were not involved in the original study?",
    hint: "0 = never tested | 3 = replicated once or twice | 5 = replicated many times across different labs",
  },
  {
    id: "peer_review",
    label: "Peer Review & Pre-registration",
    question: "Was the study pre-registered before data collection and published in a peer-reviewed journal?",
    hint: "0 = no peer review | 3 = peer reviewed but not pre-registered | 5 = pre-registered and peer reviewed",
  },
  {
    id: "sample",
    label: "Sample Size & Diversity",
    question: "Was the sample size large enough and drawn from a diverse population to support generalization?",
    hint: "0 = n < 20 or single group | 3 = reasonable size, limited diversity | 5 = large, diverse, representative",
  },
  {
    id: "effect",
    label: "Effect Size & Clinical Relevance",
    question: "Is the reported effect large enough to matter in the real world — not just statistically significant?",
    hint: "0 = tiny effect barely above noise | 3 = modest, possibly meaningful | 5 = large, clearly meaningful",
  },
  {
    id: "conflict",
    label: "Conflict of Interest",
    question: "Are the researchers and funders free from financial or ideological conflicts of interest?",
    hint: "0 = obvious funding conflict | 3 = minor conflicts disclosed | 5 = fully independent, no conflicts",
  },
  {
    id: "mechanism",
    label: "Plausible Mechanism",
    question: "Is there a credible, testable mechanism that explains *how* the effect could occur?",
    hint: "0 = no mechanism proposed | 3 = hypothesized mechanism, not fully tested | 5 = mechanism well understood",
  },
] as const;

type CriterionId = (typeof CRITERIA)[number]["id"];

const TIERS: {
  min: number;
  max: number;
  label: string;
  color: string;
  bg: string;
  border: string;
  summary: string;
}[] = [
  {
    min: 0,
    max: 5,
    label: "Tier 4 — Not Yet Reliable",
    color: "#dc2626",
    bg: "#ef444415",
    border: "#ef444440",
    summary:
      "The evidence base is too thin to draw conclusions. Treat as hypothesis only. Do not act on this claim without significantly more evidence.",
  },
  {
    min: 6,
    max: 12,
    label: "Tier 3 — Weak / Contested",
    color: "#ea580c",
    bg: "#f9731615",
    border: "#f9731640",
    summary:
      "Some evidence exists but serious problems remain — small samples, unreplicated results, or conflicting findings. Worth watching, but hold loosely.",
  },
  {
    min: 13,
    max: 18,
    label: "Tier 2 — Emerging",
    color: "#d97706",
    bg: "#f59e0b15",
    border: "#f59e0b40",
    summary:
      "Promising early evidence that hasn't been rigorously replicated across contexts yet. Reasonable to consider, but update quickly when new data arrives.",
  },
  {
    min: 19,
    max: 24,
    label: "Tier 1 — Well Supported",
    color: "#65a30d",
    bg: "#84cc1615",
    border: "#84cc1640",
    summary:
      "Consistent evidence from quality research. Reasonable to act on. Continue monitoring for updates or contradicting findings.",
  },
  {
    min: 25,
    max: 30,
    label: "Tier 0 — Foundational",
    color: "#16a34a",
    bg: "#22c55e15",
    border: "#22c55e40",
    summary:
      "Strong, replicated, independently verified evidence. This represents scientific consensus territory. Very reliable basis for decisions.",
  },
];

const FINAL_QUESTIONS = [
  "Who benefits if I believe this? (Follow the money and incentives.)",
  "What would it take to change my mind? (If nothing could, that's a flag.)",
  "Am I evaluating the evidence — or defending a prior belief?",
];

function ScoreSlider({
  id,
  value,
  onChange,
}: {
  id: CriterionId;
  value: number;
  onChange: (id: CriterionId, val: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={0}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(id, parseInt(e.target.value, 10))}
        className="flex-1 accent-purple-600 print:hidden"
        aria-label={`Score 0 to 5`}
      />
      <span className="w-6 text-center font-bold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}

function getTier(total: number) {
  return TIERS.find((t) => total >= t.min && total <= t.max) ?? TIERS[0];
}

export default function SlidingTrustScalePage() {
  useDocumentMeta({
    title: "Sliding Trust Scale — The Stomping Path",
    description:
      "Score any claim across 6 evidence criteria, see your evidence tier, and apply Bayesian updating to your beliefs.",
  });

  const [claimText, setClaimText] = useState("");
  const [scores, setScores] = useState<Record<CriterionId, number>>({
    replication: 0,
    peer_review: 0,
    sample: 0,
    effect: 0,
    conflict: 0,
    mechanism: 0,
  });

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const tier = getTier(total);
  const pct = Math.round((total / 30) * 100);

  function handleScore(id: CriterionId, val: number) {
    setScores((prev) => ({ ...prev, [id]: val }));
  }

  function handleReset() {
    setClaimText("");
    setScores({ replication: 0, peer_review: 0, sample: 0, effect: 0, conflict: 0, mechanism: 0 });
  }

  return (
    <>
      <style>{`
        @media print {
          header, footer, nav, .print-hide { display: none !important; }
          .print-page { max-width: 100%; padding: 1rem; }
          body { font-size: 11pt; }
          .tier-result { page-break-inside: avoid; }
        }
      `}</style>

      <div className="min-h-screen bg-background print-page">
        {/* Hero */}
        <div
          className="border-b border-border print:hidden"
          style={{
            background: "linear-gradient(160deg, #1a0a2e 0%, #2d1b4e 60%, #1e1035 100%)",
            borderTop: "4px solid #7B5EA7",
          }}
        >
          <div className="max-w-3xl mx-auto px-6 py-12">
            <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-6 print:hidden" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3 opacity-40" />
              <Link href="/zones/zone-0" className="hover:text-white transition-colors">Zone 0</Link>
              <ChevronRight className="w-3 h-3 opacity-40" />
              <Link href="/tracks/vessel-sovereignty" className="hover:text-white transition-colors">Vessel Sovereignty</Link>
              <ChevronRight className="w-3 h-3 opacity-40" />
              <span className="text-white/80">Sliding Trust Scale</span>
            </nav>

            <div
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full"
              style={{ color: "#b197fc", background: "#7B5EA720", border: "1px solid #7B5EA750" }}
            >
              <Scale className="w-3.5 h-3.5" />
              Interactive Tool
            </div>

            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              The Sliding Trust Scale
            </h1>
            <p className="text-lg text-white/70 leading-relaxed max-w-xl">
              Score any claim across 6 evidence criteria. Get an evidence tier. Know how much weight to give what you're hearing.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">

          {/* Print header — only shows when printing */}
          <div className="hidden print:block mb-6">
            <h1 className="font-serif text-3xl font-bold mb-1">The Sliding Trust Scale</h1>
            <p className="text-sm text-muted-foreground">thesurvivalpodcast.com · Vessel Sovereignty Track · Zone 0</p>
          </div>

          {/* Claim input */}
          <section>
            <h2 className="font-serif text-xl font-bold text-foreground mb-2">
              What claim are you evaluating?
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              State it clearly and specifically. Vague claims get vague scores.
            </p>
            <textarea
              value={claimText}
              onChange={(e) => setClaimText(e.target.value)}
              placeholder="e.g. 'Cold water immersion improves mood in people with depression.'"
              rows={3}
              className="w-full rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm px-4 py-3 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {claimText && (
              <p
                className="mt-2 text-sm font-medium italic text-muted-foreground border-l-2 pl-3"
                style={{ borderColor: "#7B5EA7" }}
              >
                "{claimText}"
              </p>
            )}
          </section>

          {/* Criteria */}
          <section>
            <h2 className="font-serif text-xl font-bold text-foreground mb-1">
              Score each criterion (0 – 5)
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              0 = completely absent · 5 = clearly present and strong
            </p>
            <div className="space-y-6">
              {CRITERIA.map((c, i) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span
                      className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: "#7B5EA720", color: "#7B5EA7", border: "1px solid #7B5EA740" }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground text-sm mb-0.5">{c.label}</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">{c.question}</div>
                      <div className="text-[11px] text-muted-foreground/70 mt-1 italic">{c.hint}</div>
                    </div>
                    <span
                      className="shrink-0 text-lg font-bold tabular-nums"
                      style={{ color: "#7B5EA7" }}
                    >
                      {scores[c.id]}
                    </span>
                  </div>
                  <ScoreSlider id={c.id} value={scores[c.id]} onChange={handleScore} />
                  {/* Print score row */}
                  <div className="hidden print:flex items-center justify-between mt-1">
                    <div className="flex gap-1">
                      {[0,1,2,3,4,5].map((n) => (
                        <span
                          key={n}
                          className="w-6 h-6 rounded flex items-center justify-center text-xs border"
                          style={
                            n === scores[c.id]
                              ? { background: "#7B5EA7", color: "#fff", borderColor: "#7B5EA7" }
                              : { borderColor: "#ccc", color: "#999" }
                          }
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Result */}
          <section className="tier-result">
            <div
              className="rounded-2xl border p-6"
              style={{ background: tier.bg, borderColor: tier.border }}
            >
              <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Evidence Tier
                  </div>
                  <h3
                    className="font-serif text-2xl font-bold leading-tight"
                    style={{ color: tier.color }}
                  >
                    {tier.label}
                  </h3>
                </div>
                <div className="text-right">
                  <div
                    className="text-4xl font-bold tabular-nums"
                    style={{ color: tier.color }}
                  >
                    {total}
                    <span className="text-xl font-normal text-muted-foreground"> / 30</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{pct}% confidence</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full bg-border mb-4 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, background: tier.color }}
                />
              </div>

              <p className="text-sm leading-relaxed" style={{ color: tier.color }}>
                {tier.summary}
              </p>
            </div>
          </section>

          {/* Final questions */}
          <section>
            <h2 className="font-serif text-xl font-bold text-foreground mb-2">
              Three questions to ask yourself before updating your belief
            </h2>
            <div className="space-y-3">
              {FINAL_QUESTIONS.map((q, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                  <span
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "#7B5EA720", color: "#7B5EA7", border: "1px solid #7B5EA740" }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-foreground">{q}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Bayesian & replication crisis explainer */}
          <section className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <h2 className="font-serif text-xl font-bold text-foreground">
              Why this works: Bayesian updating
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A Bayesian approach means you don't accept or reject claims outright — you update the probability you assign to them as new evidence arrives. You start with a{" "}
              <em>prior</em> (what you already believe) and adjust it based on the quality and strength of new evidence. A high score on this scale doesn't mean something is true; it means the evidence is strong enough that you should meaningfully update your prior toward believing it.
            </p>
            <div
              className="rounded-xl p-4 text-sm leading-relaxed"
              style={{ background: "#7B5EA710", border: "1px solid #7B5EA730", color: "#7B5EA7" }}
            >
              <strong>Key insight:</strong> A claim can be logical, internally consistent, and emotionally compelling — and still have a Tier 4 evidence base. Logic and evidence are not the same thing. Always score the evidence, not the argument.
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">The replication crisis</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Between 2011 and 2020, researchers attempted to replicate hundreds of published psychology and medical studies. Roughly{" "}
                <strong className="text-foreground">50–70% failed to reproduce</strong> under the same conditions. This doesn't mean science is broken — it means the system for publishing exciting new findings was better than the system for correcting them. Pre-registration, larger samples, and independent replication are the corrective. That's why{" "}
                <strong className="text-foreground">Criterion 1 (Replication)</strong> gets the top billing on this scale.
              </p>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border border-border bg-card text-foreground hover:bg-muted transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset scale
            </button>
            <Link
              href="/tools/input-sovereignty"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{ color: "#7B5EA7", background: "#7B5EA715", border: "1px solid #7B5EA740" }}
            >
              Next: Input Sovereignty →
            </Link>
          </div>

          {/* Related links */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Related paths
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/tracks/vessel-sovereignty" className="text-sm font-semibold text-primary hover:underline">
                ← Vessel Sovereignty Track
              </Link>
              <Link href="/zones/zone-0" className="text-sm font-semibold text-primary hover:underline">
                ← Zone 0: The Self
              </Link>
              <Link href="/tools/input-sovereignty" className="text-sm font-semibold text-primary hover:underline">
                Input Sovereignty Module →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
