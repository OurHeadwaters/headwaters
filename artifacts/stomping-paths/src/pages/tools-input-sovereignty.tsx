import { useState } from "react";
import { Link } from "wouter";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { ChevronRight, Printer, Shield, CheckSquare, Square } from "lucide-react";

const DIET_AUDIT_ITEMS = [
  { id: "da1", text: "I know which apps I open first thing in the morning." },
  { id: "da2", text: "I can name the top 5 sources that shaped my beliefs this week." },
  { id: "da3", text: "I know which of those sources have a financial interest in my attention." },
  { id: "da4", text: "I have at least one source that actively challenges my current worldview." },
  { id: "da5", text: "I have gone 24 hours without checking news or social media in the past month." },
  { id: "da6", text: "My screen time for the past week was intentional rather than habitual." },
  { id: "da7", text: "I can articulate what I believe — vs. what I've simply been told to believe." },
  { id: "da8", text: "I consume at least some primary sources, not just summaries or takes." },
];

const KILL_ALGO_ITEMS = [
  { id: "ka1", text: "Delete or log out of TikTok. It is an industrial dopamine delivery system. Not metaphorically — literally." },
  { id: "ka2", text: "Switch your YouTube home page to Subscription feed only. Never let the algorithm choose what comes next." },
  { id: "ka3", text: "Set a 15-minute daily timer for Twitter/X. When it rings, close the app. No exceptions." },
  { id: "ka4", text: "Replace Instagram scrolling with a specific, named activity (walk, book, conversation). The slot must be filled." },
  { id: "ka5", text: "Use an RSS reader (Feedly, NetNewsWire) instead of social feeds for news. You choose what's in it." },
  { id: "ka6", text: "Move social media apps off your home screen. Add a blank folder where they were." },
  { id: "ka7", text: "Disable all social media push notifications. Every ping is a summons designed to override your intention." },
  { id: "ka8", text: "Set one \"phone-free hour\" per day. First hour of morning and last hour of night are the highest-leverage slots." },
];

const CONSCIOUS_COMMS = [
  {
    title: "The 24-hour rule",
    body: "Before sharing, forwarding, or arguing about a piece of information you encountered in the last 24 hours, sleep on it. Urgency is a manipulation tool. Real information is still real tomorrow.",
  },
  {
    title: "Source before summary",
    body: "Whenever possible, find the primary source before forming an opinion. A headline, a tweet about a study, or a pundit's take is not the thing itself — it's someone else's interpretation of the thing. Read the abstract. Watch the clip. Read the bill.",
  },
  {
    title: "Steel-man the opposition",
    body: "Before posting a critique, write down the strongest version of the opposing argument. If you can't state it in terms its proponents would recognize, you're not ready to argue against it. You're shadow-boxing.",
  },
  {
    title: "Separate emotion from information",
    body: "Anger and fear are valid responses to real things. They are also the primary levers of algorithmic engagement. Ask: 'Am I sharing this because it's true and important — or because it made me feel something?'",
  },
  {
    title: "Signal-to-noise triage",
    body: "For any ongoing situation (political crisis, health scare, emerging story), designate one weekly check-in rather than hourly monitoring. Ninety percent of 'breaking news' is irrelevant within 72 hours. Your nervous system doesn't know that.",
  },
];

const MEDIA_LITERACY_QUESTIONS = [
  { category: "Authorship", questions: ["Who created this?", "What is their expertise and track record?", "What do they want me to believe, do, or buy?"] },
  { category: "Techniques", questions: ["What techniques are used to attract my attention?", "What emotional response is it designed to trigger?", "What editing, framing, or omission choices were made?"] },
  { category: "Values", questions: ["What values, lifestyles, or perspectives are represented?", "What is left out or shown as abnormal?", "Whose voices are missing?"] },
  { category: "Interpretation", questions: ["How might different people interpret this differently?", "What would someone with the opposite belief say about it?", "Is this claim falsifiable?"] },
  { category: "Impact", questions: ["Why is this message being sent now?", "Who benefits from me believing this?", "What action am I being pushed toward?"] },
];

type ChecklistId = string;

function CheckItem({
  id,
  text,
  checked,
  onToggle,
}: {
  id: ChecklistId;
  text: string;
  checked: boolean;
  onToggle: (id: ChecklistId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(id)}
      className="flex items-start gap-3 text-left w-full group print:pointer-events-none"
      aria-pressed={checked}
    >
      <span className="shrink-0 mt-0.5 print:hidden">
        {checked ? (
          <CheckSquare className="w-4.5 h-4.5 text-purple-600" />
        ) : (
          <Square className="w-4.5 h-4.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
        )}
      </span>
      <span className="hidden print:inline shrink-0 mt-0.5">
        <Square className="w-4 h-4" />
      </span>
      <span
        className={`text-sm leading-relaxed transition-colors ${
          checked ? "line-through text-muted-foreground" : "text-foreground"
        } print:no-underline print:text-foreground`}
      >
        {text}
      </span>
    </button>
  );
}

export default function InputSovereigntyPage() {
  useDocumentMeta({
    title: "Input Sovereignty — The Stomping Path",
    description:
      "Audit your information diet, kill the algorithm, and reclaim conscious control of what goes into your head.",
  });

  const [dietChecked, setDietChecked] = useState<Set<ChecklistId>>(new Set());
  const [algoChecked, setAlgoChecked] = useState<Set<ChecklistId>>(new Set());

  function toggleDiet(id: ChecklistId) {
    setDietChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAlgo(id: ChecklistId) {
    setAlgoChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const dietScore = dietChecked.size;
  const algoScore = algoChecked.size;

  return (
    <>
      <style>{`
        @media print {
          header, footer, nav, .print-hide { display: none !important; }
          body { font-size: 11pt; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div
          className="border-b border-border"
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
              <span className="text-white/80">Input Sovereignty</span>
            </nav>

            <div
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full"
              style={{ color: "#b197fc", background: "#7B5EA720", border: "1px solid #7B5EA750" }}
            >
              <Shield className="w-3.5 h-3.5" />
              Module
            </div>

            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Input Sovereignty
            </h1>
            <p className="text-lg text-white/70 leading-relaxed max-w-xl">
              The sovereign starts here: deciding what goes in. Audit your information diet, eliminate algorithmic feeds, and build conscious communication practices.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-12 space-y-14">

          {/* Print header */}
          <div className="hidden print:block mb-4">
            <h1 className="font-serif text-3xl font-bold mb-1">Input Sovereignty — One-Pager</h1>
            <p className="text-sm text-muted-foreground">thesurvivalpodcast.com · Vessel Sovereignty Track · Zone 0</p>
          </div>

          {/* Section 1: Information Diet Audit */}
          <section>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold"
                style={{ background: "#7B5EA720", color: "#7B5EA7", border: "1px solid #7B5EA740" }}
              >
                1
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Information Diet Audit</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6 ml-12">
              Check each statement that is true for you right now. Honesty only — no one's watching.
            </p>

            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              {DIET_AUDIT_ITEMS.map((item) => (
                <CheckItem
                  key={item.id}
                  id={item.id}
                  text={item.text}
                  checked={dietChecked.has(item.id)}
                  onToggle={toggleDiet}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3 print:hidden">
              <div
                className="h-2 flex-1 rounded-full bg-border overflow-hidden"
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${(dietScore / DIET_AUDIT_ITEMS.length) * 100}%`, background: "#7B5EA7" }}
                />
              </div>
              <span className="text-sm text-muted-foreground tabular-nums">
                {dietScore} / {DIET_AUDIT_ITEMS.length}
              </span>
            </div>

            <div
              className="mt-4 rounded-lg p-4 text-sm leading-relaxed"
              style={{ background: "#7B5EA710", border: "1px solid #7B5EA730", color: "#9B7EC7" }}
            >
              <strong className="text-foreground">What a low score means:</strong> Most people score 2–4 on their first audit. That's not failure — it's a baseline. The point is to know the real number, not the number you wish were true. Come back in 30 days.
            </div>
          </section>

          {/* Section 2: Kill the Algorithm */}
          <section>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold"
                style={{ background: "#7B5EA720", color: "#7B5EA7", border: "1px solid #7B5EA740" }}
              >
                2
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Kill the Algorithm</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-2 ml-12">
              Quick-start checklist. Each item is specific and actionable. Do as many as you're willing to do today.
            </p>
            <p className="text-xs text-muted-foreground mb-6 ml-12 italic">
              The algorithm is not neutral — it is optimized to maximize your time-on-platform regardless of the cost to you. These are not suggestions. They're countermeasures.
            </p>

            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              {KILL_ALGO_ITEMS.map((item) => (
                <CheckItem
                  key={item.id}
                  id={item.id}
                  text={item.text}
                  checked={algoChecked.has(item.id)}
                  onToggle={toggleAlgo}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3 print:hidden">
              <div className="h-2 flex-1 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${(algoScore / KILL_ALGO_ITEMS.length) * 100}%`, background: "#7B5EA7" }}
                />
              </div>
              <span className="text-sm text-muted-foreground tabular-nums">
                {algoScore} / {KILL_ALGO_ITEMS.length} steps taken
              </span>
            </div>
          </section>

          {/* Section 3: Conscious Communication */}
          <section className="print-break">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold"
                style={{ background: "#7B5EA720", color: "#7B5EA7", border: "1px solid #7B5EA740" }}
              >
                3
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Conscious Communication Practices</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6 ml-12">
              How you share information is as important as what you consume. These practices reduce your contribution to the noise.
            </p>

            <div className="space-y-4">
              {CONSCIOUS_COMMS.map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Media Literacy */}
          <section>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold"
                style={{ background: "#7B5EA720", color: "#7B5EA7", border: "1px solid #7B5EA740" }}
              >
                4
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Media Literacy Questions</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-2 ml-12">
              Adapted from the NAMLE and UNESCO media literacy frameworks.
            </p>
            <p className="text-xs text-muted-foreground mb-6 ml-12">
              Apply these questions to anything you are about to share, act on, or form a belief about.
            </p>

            <div className="space-y-4">
              {MEDIA_LITERACY_QUESTIONS.map((cat) => (
                <div key={cat.category} className="rounded-xl border border-border bg-card p-5">
                  <div
                    className="text-[10px] font-bold uppercase tracking-widest mb-3"
                    style={{ color: "#7B5EA7" }}
                  >
                    {cat.category}
                  </div>
                  <ul className="space-y-2">
                    {cat.questions.map((q) => (
                      <li key={q} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400" />
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div
              className="mt-4 rounded-lg p-4 text-sm"
              style={{ background: "#7B5EA710", border: "1px solid #7B5EA730" }}
            >
              <p className="text-muted-foreground leading-relaxed">
                These questions are not designed to make you cynical about all media. They're designed to keep you in the driver's seat — as an active decoder rather than a passive receiver. The goal is not distrust; it's calibrated trust backed by your own evaluation.
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
              Print one-pager
            </button>
            <Link
              href="/tools/sliding-trust-scale"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{ color: "#7B5EA7", background: "#7B5EA715", border: "1px solid #7B5EA740" }}
            >
              ← Sliding Trust Scale
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
              <Link href="/tools/sliding-trust-scale" className="text-sm font-semibold text-primary hover:underline">
                Sliding Trust Scale →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
