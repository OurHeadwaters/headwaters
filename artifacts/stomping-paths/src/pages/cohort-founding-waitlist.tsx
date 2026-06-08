import { useState } from "react";
import { Link } from "wouter";
import {
  Star,
  Users,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Lock,
  Flame,
  Radio,
  ChevronRight,
} from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

const TRANSFORMATION = {
  icon: "🌱",
  from: "Conventional",
  to: "Regenerative",
  color: "#4caf50",
};

const BENEFITS = [
  "12-week guided cohort with a vetted TSP Expert Council member",
  "Weekly live sessions + lifetime recordings",
  "Private community of serious, like-minded students",
  "Founding pricing locked in — never increases for you",
  "Direct Q&A access you can't get from a course or a book",
  "Progress accountability from peers on the same transformation path",
];

const EXPERT = {
  name: "Joel Salatin — Revealed with the episode",
  role: "Regenerative Farming · Polyface Farm · TSP Expert Council",
  note: "The full expert profile and cohort curriculum will be revealed when the podcast episode airs on TSP. Waitlist members get the details first.",
};

const TIMELINE = [
  { label: "Waitlist opens", date: "Now", done: true },
  { label: "Episode airs on TSP", date: "Fall 2026 — expert announced here", done: false },
  { label: "Enrollment opens (waitlist first)", date: "Episode drop day — 12-hour head start for waitlist", done: false },
  { label: "Enrollment closes", date: "14 days after episode airs — no extensions", done: false },
  { label: "Founding Cohort #1 begins", date: "Early 2027", done: false },
  { label: "Standard pricing ($797) takes effect", date: "After founding seats fill or enrollment closes", done: false },
];

export function CohortFoundingWaitlistPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(apiUrl("/cohorts/waitlist"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Could not join waitlist");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div
        className="relative overflow-hidden border-b"
        style={{
          background: `linear-gradient(135deg, ${TRANSFORMATION.color}12 0%, transparent 60%)`,
          borderColor: TRANSFORMATION.color + "22",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border mb-6"
            style={{
              borderColor: TRANSFORMATION.color + "44",
              background: TRANSFORMATION.color + "15",
              color: TRANSFORMATION.color,
            }}
          >
            <Star className="w-3.5 h-3.5" />
            Founding Cohort · Limited Seats
          </div>

          <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-4">
            The First-Ever{" "}
            <span style={{ color: TRANSFORMATION.color }}>
              Transformation Path Cohort
            </span>{" "}
            is Coming
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Join the waitlist and get first access when enrollment opens — at the
            founding-member price that won't be offered again. Launching in partnership
            with <strong className="text-foreground">The Survival Podcast</strong>.
          </p>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground mb-10">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" style={{ color: TRANSFORMATION.color }} />
              30 founding seats
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" style={{ color: TRANSFORMATION.color }} />
              Launching Fall 2026
            </span>
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4" style={{ color: TRANSFORMATION.color }} />
              Founding price: $497 (reg. $797)
            </span>
          </div>

          {/* Waitlist form */}
          {submitted ? (
            <div
              className="inline-flex flex-col items-center gap-3 rounded-xl border px-8 py-6 text-center"
              style={{ borderColor: TRANSFORMATION.color + "44", background: TRANSFORMATION.color + "10" }}
            >
              <CheckCircle2 className="w-8 h-8" style={{ color: TRANSFORMATION.color }} />
              <p className="font-semibold text-foreground text-lg">You're on the list!</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                You're saved. We'll reach out the moment enrollment opens — before we
                announce it anywhere else.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                style={{ "--tw-ring-color": TRANSFORMATION.color } as React.CSSProperties}
              />
              <button
                type="submit"
                disabled={submitting || !email.trim()}
                className="flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ background: TRANSFORMATION.color }}
              >
                {submitting ? "Joining…" : (
                  <>
                    Get Early Access <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {error && (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          )}

          <p className="mt-4 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" />
            No spam. One email when enrollment opens. Unsubscribe anytime.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 py-14 space-y-14">

        {/* What is a cohort */}
        <section>
          <h2 className="font-serif text-2xl font-bold mb-3">What is a Transformation Path Cohort?</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            A cohort is a small, structured group program led by a vetted{" "}
            <Link href="/council" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Expert Council member
            </Link>
            . Instead of watching a course alone, you work through the material
            together with a tight group of students — with weekly live sessions,
            direct expert access, and a community that holds you accountable.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The <strong className="text-foreground">
              {TRANSFORMATION.icon} {TRANSFORMATION.from} → {TRANSFORMATION.to}
            </strong> path is the first cohort to launch. It walks you through the
            practical, real-world steps to move from conventional food, land, and
            lifestyle choices toward a regenerative, self-reliant way of living.
          </p>
        </section>

        {/* Expert */}
        <section>
          <h2 className="font-serif text-2xl font-bold mb-4">Who's leading the cohort?</h2>
          <div
            className="rounded-xl border p-5 flex items-start gap-4"
            style={{ borderColor: TRANSFORMATION.color + "33", background: TRANSFORMATION.color + "08" }}
          >
            <div
              className="w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 text-xl"
              style={{ borderColor: TRANSFORMATION.color + "44", background: TRANSFORMATION.color + "18" }}
            >
              🌱
            </div>
            <div>
              <p className="font-semibold text-foreground">{EXPERT.name}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{EXPERT.role}</p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{EXPERT.note}</p>
              <p className="text-xs text-muted-foreground mt-2 italic">
                Selection criteria: working homestead or farm operation, prior TSP connection or recognized name in
                the permaculture / regenerative agriculture space, proven teaching track record.
                Jack's input on the selection is part of the process.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section>
          <h2 className="font-serif text-2xl font-bold mb-5">What founding members get</h2>
          <ul className="space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckCircle2
                  className="w-5 h-5 shrink-0 mt-0.5"
                  style={{ color: TRANSFORMATION.color }}
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Pricing callout */}
        <section>
          <div
            className="rounded-xl border p-6 flex flex-col sm:flex-row gap-6 items-start"
            style={{ borderColor: TRANSFORMATION.color + "33", background: TRANSFORMATION.color + "08" }}
          >
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: TRANSFORMATION.color }}>
                Founding Member Pricing
              </p>
              <p className="font-serif text-3xl font-bold text-foreground">$497</p>
              <p className="text-sm text-muted-foreground mt-1">
                One-time enrollment · payment plans available
              </p>
            </div>
            <div className="flex-1 border-l pl-6" style={{ borderColor: TRANSFORMATION.color + "22" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1 text-muted-foreground">
                Standard Price (after launch)
              </p>
              <p className="font-serif text-3xl font-bold text-muted-foreground line-through">$797</p>
              <p className="text-sm text-muted-foreground mt-1">
                Price increases once founding seats fill
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Founding pricing is available only to waitlist members during the initial enrollment window.
          </p>
        </section>

        {/* Timeline */}
        <section>
          <h2 className="font-serif text-2xl font-bold mb-5">What happens next</h2>
          <div className="space-y-0">
            {TIMELINE.map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{
                      borderColor: item.done ? TRANSFORMATION.color : "#6B728055",
                      background: item.done ? TRANSFORMATION.color + "20" : "transparent",
                    }}
                  >
                    {item.done ? (
                      <CheckCircle2 className="w-4 h-4" style={{ color: TRANSFORMATION.color }} />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-border" />
                    )}
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div className="w-px flex-1 my-1 bg-border" />
                  )}
                </div>
                <div className="pb-6">
                  <p className="font-semibold text-sm text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TSP connection */}
        <section
          className="rounded-xl border p-6"
          style={{ borderColor: "#6B728033" }}
        >
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-foreground/5 border border-border flex items-center justify-center">
              <Radio className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Launching on The Survival Podcast</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The official announcement — including enrollment details, founding pricing, and
                the expert leading the cohort — will drop as a full episode on{" "}
                <strong className="text-foreground">The Survival Podcast with Jack Spirko</strong>.
                Waitlist members hear about enrollment before the episode publishes to the general
                audience, so get on the list now.
              </p>
            </div>
          </div>
        </section>

        {/* Second CTA */}
        {!submitted && (
          <section className="text-center">
            <h2 className="font-serif text-2xl font-bold mb-3">Don't miss the founding window</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              30 seats. One shot at founding pricing. Waitlist gets first access.
            </p>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
              />
              <button
                type="submit"
                disabled={submitting || !email.trim()}
                className="flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ background: TRANSFORMATION.color }}
              >
                {submitting ? "Joining…" : (
                  <>
                    Join the Waitlist <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
            {error && (
              <p className="mt-3 text-sm text-destructive">{error}</p>
            )}
          </section>
        )}

        {/* Nav to cohorts */}
        <div className="border-t pt-8 flex items-center justify-between text-sm">
          <Link href="/cohorts" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
            <ChevronRight className="w-4 h-4 rotate-180" /> All Cohorts
          </Link>
          <Link href="/transform" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
            Explore Transformation Paths <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
