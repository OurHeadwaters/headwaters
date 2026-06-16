import { Link, useRoute, useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Package,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useKitDetail, KIT_META } from "@/hooks/use-kits";

const KIT_FIRST_STEPS: Record<string, { what: string; first: string; next: string }> = {
  "family-kit": {
    what: "Build 30-day food and water baseline this month. Then move to the 90-day pantry rotation and home security audit.",
    first: "Start the Prepared at Home track. The earliest episodes lay the foundation — start there before buying any gear.",
    next: "After you've completed the core preparedness episodes, check the gear shelf for Jack's reviewed supplies that match this kit.",
  },
  "producer-kit": {
    what: "Start the Mind & Money track — specifically the early episodes on financial philosophy and the debt payoff framework.",
    first: "Get your money working for you before you try to build income from scratch. The debt-reduction framework comes first.",
    next: "Once you have a debt-reduction plan in motion, move to the Employee → Owner transformation episodes. Identify one income stream you can build alongside your current work.",
  },
  "care-kit": {
    what: "Filter the Outsourced Health → Health Sovereign episodes by earliest publish date. The philosophical foundation matters most.",
    first: "Build one concrete home-health practice at a time. Most people start with food quality and sleep before adding herbalism or supplements.",
    next: "Master the basics before advanced skills. Return to this kit as your situation changes and your knowledge grows.",
  },
  "digital-kit": {
    what: "Start with the TradFi → Hard Assets transformation episodes. Understand the 'why' before touching a hardware wallet.",
    first: "Set up a hardware wallet with a small amount before you hold anything significant. The gear shelf has Jack's reviewed hardware wallets.",
    next: "Layer in the privacy tools after you've secured your digital assets. Digital security compounds over time.",
  },
  "physical-kit": {
    what: "Start the When Things Get Hard track. It's short and covers the high-probability scenarios most families should prepare for.",
    first: "Work through the Grid → Off-Grid transformation for energy independence concepts, then use the gear shelf to identify the right hardware.",
    next: "Physical resilience is built in layers — grid independence first, then energy production, then energy storage.",
  },
  "budget-kit": {
    what: "The envelope budgeting framework applies immediately to your current income. Start splitting your income into buckets this month.",
    first: "Listen to the Mind & Money track's early episodes on financial philosophy, then set up your first budget buckets.",
    next: "Once you have your budget structure, explore the X-Buckets tool for non-custodial stablecoin budgeting.",
  },
  "pregnancy-kit": {
    what: "Filter the health sovereignty episodes by earliest publish date — the philosophical foundation matters most before you dive into protocols.",
    first: "Start with Jack's foundational health episodes on food quality and the limits of conventional medicine. Get the framework right before the specifics.",
    next: "Layer in the pregnancy-specific content: herbalism safety, birth prep, early infant decisions. Each decision is easier once the frame is solid.",
  },
  "baby-health-kit": {
    what: "Start with the foundational child health and real-food episodes mapped to your child's age. The framework applies at every stage.",
    first: "Build one home-health practice at a time — real food first, then basic herbalism, then illness decision frameworks.",
    next: "Mastery compounds. What you do in year one sets the trajectory. Return to this kit as your kids grow and new challenges arise.",
  },
};

const DEFAULT_STEPS = {
  what: "Work through the curated episodes in this kit in order. Each one builds on the previous.",
  first: "Start with the earliest episodes in your kit's transformation or track — the foundation matters more than the advanced material.",
  next: "Return to this kit as your situation changes. The content compounds over time.",
};

export default function KitWelcomePage() {
  const [, params] = useRoute("/kits/:slug/welcome");
  const [location] = useLocation();
  const slug = params?.slug ?? "";

  const { data: kit, isLoading } = useKitDetail(slug);
  const meta = KIT_META[slug] ?? { icon: "📦", color: "#6B7280" };

  const steps = KIT_FIRST_STEPS[slug] ?? DEFAULT_STEPS;

  const [sessionVerified, setSessionVerified] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] ?? "");
    if (params.get("session_id")) {
      setSessionVerified(true);
    }
  }, [location]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading your kit…</span>
      </div>
    );
  }

  const kitName = kit?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="min-h-screen bg-background">
      <div
        className="border-b border-border relative overflow-hidden"
        style={{
          background: `linear-gradient(160deg, #0F1F1A 0%, #1A2A20 60%, #1E3028 100%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `radial-gradient(ellipse at 65% 50%, ${meta.color} 0%, transparent 55%)`,
          }}
        />
        <div className="max-w-3xl mx-auto px-6 py-14 relative">
          <Link
            href={`/kits/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 transition-colors"
            style={{ color: "#8FA883" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Kit
          </Link>

          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full"
            style={{
              color: meta.color,
              background: meta.color + "18",
              border: `1px solid ${meta.color}33`,
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Access Confirmed</span>
          </div>

          <div className="flex items-start gap-4 mb-4">
            <span className="text-4xl leading-none mt-1">{meta.icon}</span>
            <div>
              <h1
                className="font-serif text-4xl md:text-5xl font-bold leading-tight"
                style={{ color: "#FDFBF7" }}
              >
                Welcome to the {kitName}
              </h1>
              {sessionVerified && (
                <p
                  className="text-base font-semibold mt-2"
                  style={{ color: meta.color }}
                >
                  Purchase confirmed — you're in.
                </p>
              )}
            </div>
          </div>

          <p className="text-base leading-relaxed max-w-2xl mt-4" style={{ color: "#C8D4C0" }}>
            Here's exactly what to do first. The kit content is organized to build in layers —
            start at the foundation and work forward.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        <section>
          <div
            className="rounded-xl border p-6 md:p-8 space-y-6"
            style={{
              borderColor: meta.color + "33",
              background: meta.color + "08",
            }}
          >
            <div
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: meta.color }}
            >
              <span>📖</span>
              <span>Your User Manual</span>
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                <span style={{ color: meta.color }}>◆</span>
                What this kit is for
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed pl-5">
                {kit?.description ?? steps.what}
              </p>
            </div>

            <div>
              <h3 className="font-serif text-base font-bold text-foreground mb-2 flex items-center gap-2">
                <span style={{ color: meta.color }}>→</span>
                What to do first
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed pl-5">
                {steps.first}
              </p>
            </div>

            <div>
              <h3 className="font-serif text-base font-bold text-foreground mb-2 flex items-center gap-2">
                <span style={{ color: meta.color }}>→→</span>
                What to do next
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed pl-5">
                {steps.next}
              </p>
            </div>
          </div>
        </section>

        {kit && kit.transformations && kit.transformations.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Your Transformation Path
            </h2>
            <div className="flex flex-col gap-3">
              {kit.transformations.map((t: any) => (
                <Link
                  key={t.slug}
                  href={`/episodes?transformation=${encodeURIComponent(t.slug)}`}
                  className="flex items-center justify-between gap-4 p-5 rounded-xl border bg-card hover:shadow-md transition-all duration-200 group"
                  style={{ borderColor: t.color + "33", background: t.color + "06" }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{t.icon}</span>
                    <div>
                      <p className="font-serif font-bold text-sm text-foreground">
                        {t.from} → {t.to}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-1">
                        {t.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {kit && kit.tracks && kit.tracks.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Start Your First Track
            </h2>
            <div className="flex flex-col gap-3">
              {kit.tracks.map((track: any) => (
                <Link
                  key={track.slug}
                  href={`/tracks/${track.slug}`}
                  className="flex items-center justify-between gap-4 p-5 rounded-xl border bg-card hover:shadow-md transition-all duration-200 group"
                  style={{
                    borderColor: (track.color ?? meta.color) + "33",
                    background: (track.color ?? meta.color) + "06",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{track.icon ?? "📚"}</span>
                    <div>
                      <p className="font-serif font-bold text-sm text-foreground">
                        {track.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {track.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {kit && kit.externalLinks && kit.externalLinks.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Kit Resources
            </h2>
            <div className="flex flex-col gap-3">
              {kit.externalLinks.map((link: any) => (
                <a
                  key={link.url}
                  href={link.url}
                  target={link.url.startsWith("http") ? "_blank" : undefined}
                  rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex items-center justify-between gap-4 p-5 rounded-xl border bg-card hover:shadow-md transition-all duration-200 group"
                  style={{ borderColor: meta.color + "33", background: meta.color + "06" }}
                >
                  <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                    {link.label}
                  </span>
                  <ExternalLink className="w-4 h-4 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </section>
        )}

        <section
          className="rounded-2xl border p-8"
          style={{
            borderColor: meta.color + "33",
            background: `linear-gradient(135deg, ${meta.color}10 0%, ${meta.color}06 100%)`,
          }}
        >
          <div className="flex items-start gap-4">
            <Package className="w-6 h-6 shrink-0 mt-0.5" style={{ color: meta.color }} />
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground mb-2">
                Everything is ready
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Your kit content — episodes, gear recommendations, and resources — is organized
                for your transformation. Return to the kit page at any time.
              </p>
              <Link
                href={`/kits/${slug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:-translate-y-px"
                style={{
                  color: "#fff",
                  background: meta.color,
                  boxShadow: `0 4px 20px ${meta.color}40`,
                }}
              >
                View Kit Content
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <div className="pb-4">
          <Link
            href="/kits"
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
            style={{ color: meta.color + "99" }}
          >
            <ArrowLeft className="w-4 h-4" />
            All Kits
          </Link>
        </div>
      </div>
    </div>
  );
}
