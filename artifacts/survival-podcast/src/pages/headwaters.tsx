import { Link } from "wouter";
import { ChevronRight, Droplets, MapPin, User, Compass, Lock, CheckCircle2 } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";

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

export default function HeadwatersPage() {
  const { isAuthenticated } = useAuth();

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
            <a
              href="mailto:headwaters@thestompingpath.com?subject=Headwaters%20Intake%20Inquiry"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all hover:opacity-90"
              style={{ background: "#4A7A3A", color: "#FDFBF7" }}
            >
              Start the intake process
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-16 md:py-20 max-w-4xl space-y-20">

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

        {/* CTA */}
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
              Ready to get placed?
            </h2>
            <p className="text-base leading-relaxed mb-6 max-w-xl mx-auto" style={{ color: "#C8D4C0" }}>
              Send a short message to Tasha to kick off the intake process. She'll send you the
              pre-session form and schedule a time that works.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:headwaters@thestompingpath.com?subject=Headwaters%20Intake%20Inquiry"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all hover:opacity-90"
                style={{ background: "#4A7A3A", color: "#FDFBF7" }}
              >
                <CheckCircle2 className="w-5 h-5" />
                Start intake — email Tasha
              </a>
              <Link
                href="/map"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base border transition-all hover:opacity-80"
                style={{ borderColor: "#4A7A3A44", color: "#C8D4C0" }}
              >
                View the Lifestyle Map
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
