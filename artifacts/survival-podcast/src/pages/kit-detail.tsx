import { Link, useRoute, useSearch } from "wouter";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  Loader2,
  Mic,
  PlaySquare,
  FileText,
  Clock,
  ArrowRight,
  Package,
  ShoppingBag,
  Compass,
  CreditCard,
  Send,
  CheckCircle2,
} from "lucide-react";
import { goalLabel, situationLabel, companionsLabel, readinessLabel } from "@/lib/kit-finder";
import { useKitDetail, KIT_META, LINK_OUT_KITS } from "@/hooks/use-kits";
import { ProductShelf } from "@/components/product-shelf";
import { formatDuration } from "@/components/episode-card";

const FAMILY_EDITIONS = {
  general: {
    name: "Family Kit",
    tagline: "Daily resilience for the whole household",
    intro:
      "Everything a family needs to become the most resilient household on the block. Covers home preparedness fundamentals — 90-day food and water, home security, emergency planning — starting with what you can do this week.",
    what: [
      "Start by building your 30-day food and water baseline this month.",
      "Next: home security audit and emergency communications plan.",
      "Then: 90-day rotation pantry and water storage for the full household.",
    ],
  },
  homeschool: {
    name: "Family Homeschool Kit",
    tagline: "Building resilience into your homeschool curriculum",
    intro:
      "Resilience education woven into your homeschool. The same household preparedness foundation as the Family Kit — food, water, security, emergency planning — taught through living skills rather than classroom exercises. Pair with the TSP back catalog for rich project-based learning.",
    what: [
      "Start with a family homestead project: map your home's resources and vulnerabilities together.",
      "Next: build a 30-day pantry as a food-math and cooking unit.",
      "Then: explore the Privacy Guide for a unit on digital citizenship and family safety.",
    ],
  },
};

const KIT_MANUALS: Record<
  string,
  { what: string[]; first: string; next: string }
> = {
  "producer-kit": {
    what: [
      "The philosophical foundation: why employee income is fragile, and what owner income looks like at every scale.",
      "The practical path: from side income to primary income, without quitting cold-turkey.",
      "The financial underpinning: debt freedom, cash-flow discipline, and building assets that work while you sleep.",
    ],
    first:
      "Start the Mind & Money track — specifically the early episodes on financial philosophy and the debt payoff framework. Get your money working for you before you try to build income from scratch.",
    next:
      "Once you have a debt-reduction plan in motion, move to the Employee → Owner transformation episodes. Identify one income stream you can build alongside your current work, then iterate.",
  },
  "care-kit": {
    what: [
      "The shift from symptom management to root-cause health: nutrition, sleep, stress, and movement as the foundation.",
      "Herbal and functional medicine — what works, what the evidence says, and where conventional medicine still belongs.",
      "Home treatment skills for common conditions, and how to know when to escalate.",
    ],
    first:
      "Filter the Outsourced Health → Health Sovereign episodes by the earliest publish dates. Jack's earliest health episodes lay the philosophical foundation — they're more important than the specific protocols.",
    next:
      "Build one concrete home-health practice at a time. Most people start with food quality and sleep before adding herbalism or supplements. Master the basics before the advanced skills.",
  },
  "digital-kit": {
    what: [
      "Why digital assets belong in any resilient financial strategy — and what the risks actually are.",
      "Hardware wallets, cold storage, and not losing your keys: the operational security layer most people skip.",
      "Privacy tools alongside financial sovereignty: VPNs, encrypted email, and reducing your digital footprint.",
    ],
    first:
      "Start with the TradFi → Hard Assets transformation episodes. Understand the 'why' before touching a hardware wallet. Jack's framing here is unmatched for getting the mental model right first.",
    next:
      "Set up a hardware wallet with a small amount before you hold anything significant. The gear shelf has Jack's reviewed hardware wallets. Then layer in the privacy tools — digital security compounds over time.",
  },
  "physical-kit": {
    what: [
      "Hard assets in the physical world: silver, gold, and why tangible assets matter in every historical disruption.",
      "Energy independence: solar, battery backup, and the grid-down planning that almost no one does until it's too late.",
      "Contingency planning: water, heat, comms, and the When Things Get Hard track for when supply chains fail.",
    ],
    first:
      "Start the When Things Get Hard track. It's short and covers the high-probability scenarios most families should prepare for before worrying about the low-probability ones.",
    next:
      "Work through the Grid → Off-Grid transformation for energy independence concepts, then use the gear shelf to identify the right hardware for your situation. Physical resilience is built in layers — grid independence, then energy production, then energy storage.",
  },
  "council-kit": {
    what: [
      "The 4-phase community engagement model: assessment, planning, implementation, and maintenance.",
      "How watershed groups and regional councils build resilience at scale — not through heroics, but through coordinated networks.",
      "The Our Headwaters platform: the operational layer for community-scale resilience work.",
    ],
    first:
      "Visit Our Headwaters (linked below) to understand the community coordination model before working on local implementation. The platform was built for exactly this kind of community-scale work.",
    next:
      "Identify the key stakeholders in your watershed or region. The 4-phase model works best when you start with a thorough assessment of your community's existing skills and resources.",
  },
  "practitioner-kit": {
    what: [
      "A structured framework for guiding clients through resilience transitions — from assessment to implementation.",
      "The Headwaters practitioner platform: intake tools, progress tracking, and client management.",
      "How to frame the resilience conversation with clients who are at different stages of their journey.",
    ],
    first:
      "Start with the Headwaters app (linked below) to understand the intake framework. The practitioner flow is designed to meet clients where they are, not where you think they should be.",
    next:
      "Run yourself through the intake tool as if you were a client. Understanding the client experience is the most important preparation for using it professionally.",
  },
};

function KindIcon({ kind }: { kind: string }) {
  if (kind === "audio") return <Mic className="w-3.5 h-3.5" />;
  if (kind === "video") return <PlaySquare className="w-3.5 h-3.5" />;
  return <FileText className="w-3.5 h-3.5" />;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function apiUrl(path: string): string {
  const base = (import.meta as any).env?.BASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/api${path}`;
}

function KitPricingBlock({
  kit,
  displayName,
  meta,
}: {
  kit: NonNullable<ReturnType<typeof useKitDetail>["data"]>;
  displayName: string;
  meta: { icon: string; color: string };
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inquiryName, setInquiryName] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryNotes, setInquiryNotes] = useState("");
  const [inquirySent, setInquirySent] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/kits/${kit.slug}/checkout`), { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleInquiry(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/kits/${kit.slug}/inquire`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: inquiryName, email: inquiryEmail, notes: inquiryNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setInquirySent(true);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isDirect = kit.priceType === "direct";

  return (
    <section id="get-access">
      <div
        className="rounded-2xl border p-8"
        style={{
          borderColor: meta.color + "44",
          background: `linear-gradient(135deg, ${meta.color}10 0%, ${meta.color}06 100%)`,
        }}
      >
        <div
          className="text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: meta.color }}
        >
          {isDirect ? "Purchase" : "Apply for Access"}
        </div>

        {isDirect ? (
          <>
            <div className="flex items-baseline gap-3 mb-2">
              <span
                className="font-serif text-4xl font-bold"
                style={{ color: "#FDFBF7" }}
              >
                {kit.priceCents ? formatPrice(kit.priceCents) : "—"}
              </span>
              <span className="text-sm text-muted-foreground">one-time</span>
            </div>
            <h2 className="font-serif text-xl font-bold text-foreground mb-2">
              {kit.ctaLabel ?? `Get the ${displayName}`}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mb-6">
              Purchase includes episodes, gear recommendations, and resources — organized
              for your transformation. Immediate access after checkout.
            </p>

            {error && (
              <p className="text-sm text-red-500 mb-4">{error}</p>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-bold transition-all hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{
                color: "#fff",
                background: meta.color,
                boxShadow: `0 4px 24px ${meta.color}50`,
              }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              {loading ? "Redirecting to checkout…" : (kit.ctaLabel ?? "Get This Kit")}
            </button>
            <p className="text-xs text-muted-foreground mt-4">
              Secure checkout via Stripe. One-time payment, no subscription.
            </p>
          </>
        ) : inquirySent ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle2 className="w-10 h-10" style={{ color: meta.color }} />
            <h2 className="font-serif text-xl font-bold text-foreground">
              Inquiry received!
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Thank you for your interest in the {displayName}. You'll hear back within a few business days.
            </p>
          </div>
        ) : (
          <>
            <h2 className="font-serif text-xl font-bold text-foreground mb-2">
              {kit.ctaLabel ?? `Apply for the ${displayName}`}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mb-6">
              This kit works best with a conversation first. Fill out the form below and
              you'll hear back within a few business days.
            </p>

            <form onSubmit={handleInquiry} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: meta.color + "44",
                    boxShadow: undefined,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = meta.color)}
                  onBlur={(e) => (e.target.style.borderColor = meta.color + "44")}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: meta.color + "44" }}
                  onFocus={(e) => (e.target.style.borderColor = meta.color)}
                  onBlur={(e) => (e.target.style.borderColor = meta.color + "44")}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Tell us about your situation (optional)
                </label>
                <textarea
                  value={inquiryNotes}
                  onChange={(e) => setInquiryNotes(e.target.value)}
                  placeholder="What are you working on? Where are you in your journey?"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-all resize-none"
                  style={{ borderColor: meta.color + "44" }}
                  onFocus={(e) => (e.target.style.borderColor = meta.color)}
                  onBlur={(e) => (e.target.style.borderColor = meta.color + "44")}
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  color: "#fff",
                  background: meta.color,
                  boxShadow: `0 4px 20px ${meta.color}40`,
                }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {loading ? "Sending…" : "Send Inquiry"}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}

export default function KitDetailPage() {
  const [, params] = useRoute("/kits/:slug");
  const slug = params?.slug ?? "";
  const { data: kit, isLoading, isError } = useKitDetail(slug);
  const [edition, setEdition] = useState<"general" | "homeschool">("general");
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const fromFinder = searchParams.get("from_finder") === "1";
  const finderSituation = searchParams.get("situation") as Parameters<typeof situationLabel>[0] | null;
  const finderGoal = searchParams.get("goal") as Parameters<typeof goalLabel>[0] | null;
  const finderCompanions = searchParams.get("companions") as Parameters<typeof companionsLabel>[0] | null;
  const finderReadiness = searchParams.get("readiness") as Parameters<typeof readinessLabel>[0] | null;
  const finderReason = searchParams.get("reason");
  const finderSecondary = searchParams.get("secondary");

  const meta = KIT_META[slug] ?? { icon: "📦", color: "#6B7280" };
  const isLinkOut = LINK_OUT_KITS.has(slug);
  const isFamilyKit = slug === "family-kit";
  const manual = KIT_MANUALS[slug];

  const displayName =
    isFamilyKit
      ? FAMILY_EDITIONS[edition].name
      : kit?.name ?? "";

  const displayTagline =
    isFamilyKit
      ? FAMILY_EDITIONS[edition].tagline
      : kit?.tagline ?? "";

  const displayIntro =
    isFamilyKit
      ? FAMILY_EDITIONS[edition].intro
      : kit?.description ?? "";

  const displayWhat =
    isFamilyKit ? FAMILY_EDITIONS[edition].what : manual?.what ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading kit…</span>
      </div>
    );
  }

  if (isError || !kit) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Could not load this kit.</p>
        <Link
          href="/kits"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Kits
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Finder recommendation banner */}
      {fromFinder && finderReason && (
        <div
          className="border-b"
          style={{ background: "#8FA88312", borderColor: "#8FA88333" }}
        >
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-start gap-3">
            <div
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
              style={{ background: "#8FA88320", border: "1px solid #8FA88344" }}
            >
              <Compass className="w-4 h-4" style={{ color: "#8FA883" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: "#8FA883" }}
              >
                Kit Finder recommendation
              </div>
              {(finderSituation || finderGoal) && (
                <p className="text-xs text-muted-foreground mb-1.5">
                  {[
                    finderSituation && situationLabel(finderSituation),
                    finderGoal && `focused on ${goalLabel(finderGoal)}`,
                    finderCompanions && companionsLabel(finderCompanions),
                    finderReadiness && readinessLabel(finderReadiness),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              <p className="text-sm leading-relaxed text-foreground/90">
                {finderReason}
              </p>
              {finderSecondary && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Also consider:{" "}
                  <Link
                    href={`/kits/${finderSecondary}`}
                    className="font-semibold hover:underline"
                    style={{ color: "#8FA883" }}
                  >
                    {finderSecondary.replace(/-kit$/, "").replace(/-/g, " ")} kit →
                  </Link>
                </p>
              )}
            </div>
            <Link
              href="/kits/find"
              className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap ml-2"
            >
              Retake
            </Link>
          </div>
        </div>
      )}

      {/* Hero */}
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
        <div className="max-w-4xl mx-auto px-6 py-14 relative">
          <Link
            href="/kits"
            className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 transition-colors"
            style={{ color: "#8FA883" }}
          >
            <ArrowLeft className="w-4 h-4" />
            All Kits
          </Link>

          {/* Edition toggle for Family Kit */}
          {isFamilyKit && (
            <div className="flex items-center gap-2 mb-6">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: meta.color }}
              >
                Edition
              </span>
              <div
                className="flex rounded-lg overflow-hidden border text-xs font-semibold"
                style={{ borderColor: meta.color + "44" }}
              >
                {(["general", "homeschool"] as const).map((ed) => (
                  <button
                    key={ed}
                    onClick={() => setEdition(ed)}
                    className="px-4 py-1.5 transition-colors"
                    style={
                      edition === ed
                        ? { background: meta.color, color: "#fff" }
                        : { color: meta.color + "cc", background: meta.color + "10" }
                    }
                  >
                    {ed === "general" ? "General" : "Homeschool"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full"
            style={{
              color: meta.color,
              background: meta.color + "18",
              border: `1px solid ${meta.color}33`,
            }}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Headwaters Kit</span>
          </div>

          <div className="flex items-start gap-4 mb-4">
            <span className="text-4xl leading-none mt-1">{meta.icon}</span>
            <div>
              <h1
                className="font-serif text-4xl md:text-5xl font-bold leading-tight"
                style={{ color: "#FDFBF7" }}
              >
                {displayName}
              </h1>
              <p
                className="text-lg font-semibold mt-2"
                style={{ color: meta.color }}
              >
                {displayTagline}
              </p>
            </div>
          </div>

          <p className="text-base leading-relaxed max-w-2xl mt-4" style={{ color: "#C8D4C0" }}>
            {displayIntro}
          </p>

          {/* CTA */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {kit.externalLinks.length > 0 ? (
              kit.externalLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target={link.url.startsWith("http") ? "_blank" : undefined}
                  rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all hover:-translate-y-px"
                  style={{
                    color: "#fff",
                    background: meta.color,
                    boxShadow: `0 4px 20px ${meta.color}40`,
                  }}
                >
                  {link.label}
                  <ExternalLink className="w-4 h-4" />
                </a>
              ))
            ) : kit.priceType === "direct" ? (
              <div className="flex flex-wrap items-center gap-4">
                {kit.priceCents && (
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-3xl font-bold" style={{ color: "#FDFBF7" }}>
                      {formatPrice(kit.priceCents)}
                    </span>
                    <span className="text-sm" style={{ color: "#8FA883" }}>one-time</span>
                  </div>
                )}
                <a
                  href="#get-access"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all hover:-translate-y-px"
                  style={{
                    color: "#fff",
                    background: meta.color,
                    boxShadow: `0 4px 20px ${meta.color}40`,
                  }}
                >
                  <CreditCard className="w-4 h-4" />
                  {kit.ctaLabel ?? "Get This Kit"}
                </a>
              </div>
            ) : (
              <a
                href="#get-access"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all hover:-translate-y-px"
                style={{
                  color: "#fff",
                  background: meta.color,
                  boxShadow: `0 4px 20px ${meta.color}40`,
                }}
              >
                {kit.ctaLabel ?? "Apply for Access"}
                <ChevronRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="lg:flex lg:gap-10 lg:items-start">

        {/* ── Main content column ───────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-14">

        {/* ── Mobile-only pricing block (above content) ─────────────── */}
        {kit && (
          <div className="lg:hidden">
            <KitPricingBlock kit={kit} displayName={displayName} meta={meta} />
          </div>
        )}

        {/* ── External link kits (Practitioner / Council) ───────────── */}
        {isLinkOut && (
          <section>
            <div
              className="rounded-2xl border p-8 flex flex-col items-center text-center gap-4"
              style={{
                borderColor: meta.color + "44",
                background: meta.color + "08",
              }}
            >
              <span className="text-5xl">{meta.icon}</span>
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                  {kit.name}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                  {kit.description}
                </p>
              </div>
              {kit.externalLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target={link.url.startsWith("http") ? "_blank" : undefined}
                  rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all hover:-translate-y-px"
                  style={{
                    color: "#fff",
                    background: meta.color,
                    boxShadow: `0 4px 20px ${meta.color}40`,
                  }}
                >
                  {link.label}
                  <ExternalLink className="w-4 h-4" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── User Manual ───────────────────────────────────────────── */}
        {(manual || isFamilyKit) && (
          <section>
            <div
              className="rounded-xl border p-6 md:p-8"
              style={{
                borderColor: meta.color + "33",
                background: meta.color + "08",
              }}
            >
              <div
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-5"
                style={{ color: meta.color }}
              >
                <span>📖</span>
                <span>User Manual</span>
              </div>

              {displayWhat.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-serif text-lg font-bold text-foreground mb-3">
                    What's in this kit
                  </h3>
                  <ul className="space-y-2">
                    {displayWhat.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                        <span
                          className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                          style={{
                            color: meta.color,
                            background: meta.color + "20",
                            border: `1px solid ${meta.color}44`,
                          }}
                        >
                          {i + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {manual?.first && (
                <div className="mb-4">
                  <h3 className="font-serif text-base font-bold text-foreground mb-2 flex items-center gap-2">
                    <span style={{ color: meta.color }}>→</span>
                    What to do first
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-5">
                    {manual.first}
                  </p>
                </div>
              )}

              {manual?.next && (
                <div>
                  <h3 className="font-serif text-base font-bold text-foreground mb-2 flex items-center gap-2">
                    <span style={{ color: meta.color }}>→→</span>
                    What to do next
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                    {manual.next}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Transformations ──────────────────────────────────────── */}
        {!isLinkOut && kit.transformations.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Transformation Paths in this Kit
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {kit.transformations.map((t) => (
                <Link
                  key={t.slug}
                  href={`/episodes?transformation=${encodeURIComponent(t.slug)}`}
                  className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
                  style={{ borderColor: t.color + "33", background: t.color + "06" }}
                >
                  <span className="text-2xl leading-none mt-0.5 shrink-0">{t.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-serif font-bold text-foreground text-sm">
                        {t.from}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: t.color }} />
                      <span className="font-serif font-bold text-sm" style={{ color: t.color }}>
                        {t.to}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {t.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground/30 group-hover:text-primary transition-colors mt-1" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Tracks ───────────────────────────────────────────────── */}
        {!isLinkOut && kit.tracks.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Learning Tracks in this Kit
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {kit.tracks.map((track) => (
                <Link
                  key={track.slug}
                  href={`/tracks/${track.slug}`}
                  className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
                  style={{
                    borderColor: (track.color ?? "#6B7280") + "33",
                    background: (track.color ?? "#6B7280") + "06",
                  }}
                >
                  <span className="text-2xl leading-none mt-0.5 shrink-0">
                    {track.icon ?? "📚"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-bold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
                      {track.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {track.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground/30 group-hover:text-primary transition-colors mt-1" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Curated Episodes ─────────────────────────────────────── */}
        {!isLinkOut && kit.episodes.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold text-foreground mb-1">
              Curated Episodes
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              A hand-curated selection from this kit's transformation and track content.
            </p>
            <div className="flex flex-col gap-3">
              {kit.episodes.map((ep) => {
                const href =
                  ep.kind === "audio"
                    ? `/episodes/${ep.slug}`
                    : `/library/${ep.slug}`;
                return (
                  <Link
                    key={ep.id}
                    href={href}
                    className="group flex gap-4 p-4 rounded-xl border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200"
                  >
                    {ep.artworkUrl ? (
                      <img
                        src={ep.artworkUrl}
                        alt={ep.title}
                        className="w-14 h-14 rounded-lg object-cover shrink-0 opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: meta.color + "18" }}
                      >
                        <KindIcon kind={ep.kind} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          {ep.kind}
                        </span>
                        {ep.episodeNumber && (
                          <span className="text-[10px] text-muted-foreground">
                            Ep {ep.episodeNumber}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {format(parseISO(ep.publishedAt), "MMM d, yyyy")}
                        </span>
                        {ep.durationSeconds && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(ep.durationSeconds)}
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-snug mb-1">
                        {ep.title}
                      </h3>
                      {ep.summary && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {ep.summary.replace(/^https?:\/\/\S+\n\n?/, "").slice(0, 160)}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground/30 group-hover:text-primary transition-colors self-center" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Gear Shelf ───────────────────────────────────────────── */}
        {!isLinkOut && kit.gear.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="w-4 h-4 shrink-0" style={{ color: meta.color }} />
              <h2 className="font-serif text-xl font-bold text-foreground">Gear Shelf</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Jack-reviewed gear matched to this kit's content.
            </p>
            <ProductShelf products={kit.gear} compact />
          </section>
        )}

        {/* ── Resource Links ───────────────────────────────────────── */}
        {kit.externalLinks.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Related Resources
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {kit.externalLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target={link.url.startsWith("http") ? "_blank" : undefined}
                  rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex items-center justify-between gap-4 p-5 rounded-xl border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
                  style={{
                    borderColor: meta.color + "33",
                    background: meta.color + "06",
                  }}
                >
                  <div>
                    <div
                      className="text-[10px] font-bold uppercase tracking-widest mb-1"
                      style={{ color: meta.color }}
                    >
                      External Resource
                    </div>
                    <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {link.label}
                    </span>
                  </div>
                  <ExternalLink
                    className="w-4 h-4 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors"
                  />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── Back nav ─────────────────────────────────────────────── */}
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

        </div>{/* end main content column */}

        {/* ── Desktop sticky pricing sidebar ───────────────────────── */}
        {kit && (
          <div className="hidden lg:block w-80 shrink-0 sticky top-6 self-start">
            <KitPricingBlock kit={kit} displayName={displayName} meta={meta} />
          </div>
        )}

        </div>{/* end lg:flex */}
      </div>
    </div>
  );
}
