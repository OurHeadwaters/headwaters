import { Link } from "wouter";
import { Shield, ArrowLeft, ChevronRight, Flame, ExternalLink } from "lucide-react";

const TORCH_ORANGE = "#D4621A";

const CONVICTION_PRINCIPLES = [
  {
    title: "Hold without preaching",
    body: "The Keep rewards those who carry Bitcoin quietly. Conviction isn't a sales pitch — it's a position held through noise.",
  },
  {
    title: "Self-custody is the floor",
    body: "Not your keys, not your coins. The Keep starts with sovereignty. Hardware wallets, seed phrase discipline, inheritance planning.",
  },
  {
    title: "Time preference over price chasing",
    body: "Low time preference is the Bitcoin philosophy made practical. The Keep is not a trading room. It is a vault.",
  },
  {
    title: "Zone 0: before ideology",
    body: "Zone 0 resources ground the Keep. Preparedness before politics — stack sats the way you stack firewood, not because the world is ending but because winter comes.",
  },
];

const ZONE_0_RESOURCES = [
  {
    label: "Zone 0 — The Threshold",
    description: "Core resources anchoring the Keep. Mindset, supply, and the decision to take any of this seriously.",
    href: "/zones/zone-0",
  },
  {
    label: "Bitcoin Keep resources on TSP",
    description: "Episodes where Jack touches Bitcoin, hard money, and financial sovereignty from a preparedness lens.",
    href: "/episodes?zone=zone-0",
  },
  {
    label: "Kits with financial sovereignty content",
    description: "Structured content paths covering hard asset positioning and offline financial resilience.",
    href: "/kits",
  },
];

export default function BitcoinKeepPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(160deg, #1A0D06 0%, #120A04 40%, #0D0803 70%, #090603 100%)",
        color: "#FDFBF7",
      }}
    >
      <div className="relative overflow-hidden border-b" style={{ borderColor: `${TORCH_ORANGE}28` }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${TORCH_ORANGE}14 0%, transparent 70%)`,
          }}
        />
        <div className="relative max-w-3xl mx-auto px-6 pt-10 pb-12">
          <Link
            href="/crypto-castle"
            className="inline-flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-80"
            style={{ color: `${TORCH_ORANGE}BB` }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Crypto Castle
          </Link>

          <div className="flex flex-col items-start gap-5">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest"
              style={{ borderColor: `${TORCH_ORANGE}44`, color: TORCH_ORANGE, background: `${TORCH_ORANGE}12` }}
            >
              Faction Wing
            </div>

            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${TORCH_ORANGE}18`, border: `1px solid ${TORCH_ORANGE}44` }}
              >
                <Shield className="w-7 h-7" style={{ color: TORCH_ORANGE }} />
              </div>
              <div>
                <h1 className="font-serif text-4xl md:text-5xl font-bold" style={{ color: "#FDFBF7" }}>
                  Bitcoin Keep
                </h1>
                <p className="text-sm font-semibold uppercase tracking-wider mt-1" style={{ color: TORCH_ORANGE }}>
                  Hold your ground.
                </p>
              </div>
            </div>

            <p className="text-base leading-relaxed max-w-2xl" style={{ color: "#A8BCAA" }}>
              Conviction lives here. This wing is for those who have already chosen their path and carry it quietly —
              sharing strength with the shared hall without demanding anyone follow.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-10">
        <section>
          <h2 className="font-serif text-2xl font-bold mb-6" style={{ color: "#FDFBF7" }}>
            Keep Principles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CONVICTION_PRINCIPLES.map((p, i) => (
              <div
                key={i}
                className="rounded-2xl border p-6 flex flex-col gap-3"
                style={{ background: `${TORCH_ORANGE}08`, borderColor: `${TORCH_ORANGE}25` }}
              >
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 flex-shrink-0" style={{ color: TORCH_ORANGE }} />
                  <h3 className="font-semibold text-sm" style={{ color: "#FDFBF7" }}>{p.title}</h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#9AADA0" }}>{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold mb-2" style={{ color: "#FDFBF7" }}>
            Zone 0 Resources
          </h2>
          <p className="text-sm mb-6" style={{ color: "#7A9A80" }}>
            The Keep is anchored in Zone 0 — the threshold of serious preparation. Start here.
          </p>
          <div className="flex flex-col gap-3">
            {ZONE_0_RESOURCES.map((r, i) => (
              <Link
                key={i}
                href={r.href}
                className="rounded-2xl border p-5 flex items-center justify-between gap-4 transition-all hover:border-opacity-60 group"
                style={{ background: `${TORCH_ORANGE}06`, borderColor: `${TORCH_ORANGE}22` }}
              >
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#FDFBF7" }}>{r.label}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "#8A9E8E" }}>{r.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: TORCH_ORANGE }} />
              </Link>
            ))}
          </div>
        </section>

        <div
          className="rounded-2xl border p-6 text-center"
          style={{ background: `${TORCH_ORANGE}06`, borderColor: `${TORCH_ORANGE}22` }}
        >
          <p className="text-sm leading-relaxed mb-5" style={{ color: "#7A9A80" }}>
            More structured content for the Bitcoin Keep is being assembled — conviction-based episode paths,
            self-custody guides, and Zone 0 hard asset resources.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/crypto-castle"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: `${TORCH_ORANGE}18`, border: `1px solid ${TORCH_ORANGE}44`, color: TORCH_ORANGE }}
            >
              <ArrowLeft className="w-4 h-4" />
              Return to the Castle
            </Link>
            <Link
              href="/zones/zone-0"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "#1A3A1C", border: "1px solid #2C5F2E88", color: "#8BAD78" }}
            >
              Zone 0 — The Threshold
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
