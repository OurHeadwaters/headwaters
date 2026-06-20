import { Link } from "wouter";
import { Hammer, ArrowLeft, ChevronRight, Zap, Wrench, ExternalLink } from "lucide-react";

const XRPL_CYAN = "#00BFDF";

const FORGE_PILLARS = [
  {
    title: "XRPL as infrastructure",
    body: "The Forge treats XRPL as rails, not ideology. Fast settlement, native DEX, Hooks for programmable logic — these are tools, not a tribe.",
  },
  {
    title: "Hooks: on-chain programmability",
    body: "XRPL Hooks bring smart-contract-adjacent logic directly to the ledger layer. The Forge is where builders experiment with Hook implementations.",
  },
  {
    title: "Tokenization for real assets",
    body: "Fractional ownership of physical assets — land, equipment, inventory — is a Forge-native use case. Token design that maps to the real world.",
  },
  {
    title: "Interoperability with every wing",
    body: "XRPL rails run through the entire castle. The Forge builds for Bitcoin Keep holders, Community Hall members, and Gyroscope Tower monitors alike.",
  },
];

const FORGE_RESOURCES = [
  {
    label: "Codetry — Digital Self-Reliance",
    description: "Tools, code snippets, and digital skill builders. The Forge's closest cousin in the broader ecosystem.",
    href: "/codetry",
    external: false,
  },
  {
    label: "XRPL Developer Docs",
    description: "Official documentation for the XRP Ledger — protocol specs, APIs, Hooks documentation.",
    href: "https://xrpl.org/docs",
    external: true,
  },
  {
    label: "Zone 5 — The Wild",
    description: "The Crypto Castle sits at the edge of Zone 5. Builder territory begins here.",
    href: "/zones/zone-5",
    external: false,
  },
];

export default function XrplForgePage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(160deg, #040F12 0%, #030C10 40%, #020A0D 70%, #020809 100%)",
        color: "#FDFBF7",
      }}
    >
      <div className="relative overflow-hidden border-b" style={{ borderColor: `${XRPL_CYAN}28` }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${XRPL_CYAN}10 0%, transparent 70%)`,
          }}
        />
        <div className="relative max-w-3xl mx-auto px-6 pt-10 pb-12">
          <Link
            href="/crypto-castle"
            className="inline-flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-80"
            style={{ color: `${XRPL_CYAN}BB` }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Crypto Castle
          </Link>

          <div className="flex flex-col items-start gap-5">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest"
              style={{ borderColor: `${XRPL_CYAN}44`, color: XRPL_CYAN, background: `${XRPL_CYAN}12` }}
            >
              Faction Wing
            </div>

            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${XRPL_CYAN}18`, border: `1px solid ${XRPL_CYAN}44` }}
              >
                <Hammer className="w-7 h-7" style={{ color: XRPL_CYAN }} />
              </div>
              <div>
                <h1 className="font-serif text-4xl md:text-5xl font-bold" style={{ color: "#FDFBF7" }}>
                  XRPL Forge
                </h1>
                <p className="text-sm font-semibold uppercase tracking-wider mt-1" style={{ color: XRPL_CYAN }}>
                  Build on the rails.
                </p>
              </div>
            </div>

            <p className="text-base leading-relaxed max-w-2xl" style={{ color: "#A8BCAA" }}>
              Builders, tokenizers, and Hook writers. XRPL rails run through every wing of the castle — this is where
              the infrastructure gets hammered out and the tools are made.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-10">
        <section>
          <h2 className="font-serif text-2xl font-bold mb-6" style={{ color: "#FDFBF7" }}>
            Forge Pillars
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FORGE_PILLARS.map((p, i) => (
              <div
                key={i}
                className="rounded-2xl border p-6 flex flex-col gap-3"
                style={{ background: `${XRPL_CYAN}08`, borderColor: `${XRPL_CYAN}25` }}
              >
                <div className="flex items-center gap-2">
                  {i % 2 === 0
                    ? <Zap className="w-4 h-4 flex-shrink-0" style={{ color: XRPL_CYAN }} />
                    : <Wrench className="w-4 h-4 flex-shrink-0" style={{ color: XRPL_CYAN }} />
                  }
                  <h3 className="font-semibold text-sm" style={{ color: "#FDFBF7" }}>{p.title}</h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#9AADA0" }}>{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold mb-2" style={{ color: "#FDFBF7" }}>
            Forge Resources
          </h2>
          <p className="text-sm mb-6" style={{ color: "#7A9A80" }}>
            Tools and destinations for builders operating in and around the Forge.
          </p>
          <div className="flex flex-col gap-3">
            {FORGE_RESOURCES.map((r, i) => {
              const inner = (
                <>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "#FDFBF7" }}>{r.label}</p>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: "#8A9E8E" }}>{r.description}</p>
                  </div>
                  {r.external
                    ? <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: XRPL_CYAN }} />
                    : <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: XRPL_CYAN }} />
                  }
                </>
              );
              return r.external ? (
                <a
                  key={i}
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border p-5 flex items-center justify-between gap-4 transition-all hover:border-opacity-60 group"
                  style={{ background: `${XRPL_CYAN}06`, borderColor: `${XRPL_CYAN}22` }}
                >
                  {inner}
                </a>
              ) : (
                <Link
                  key={i}
                  href={r.href}
                  className="rounded-2xl border p-5 flex items-center justify-between gap-4 transition-all hover:border-opacity-60 group"
                  style={{ background: `${XRPL_CYAN}06`, borderColor: `${XRPL_CYAN}22` }}
                >
                  {inner}
                </Link>
              );
            })}
          </div>
        </section>

        <div
          className="rounded-2xl border p-6 text-center"
          style={{ background: `${XRPL_CYAN}06`, borderColor: `${XRPL_CYAN}22` }}
        >
          <p className="text-sm leading-relaxed mb-5" style={{ color: "#7A9A80" }}>
            XRPL tooling, Hook templates, and tokenization case studies are being built out for the Forge.
            Builders can get a head start at Codetry while the dedicated wing content is assembled.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/crypto-castle"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: `${XRPL_CYAN}18`, border: `1px solid ${XRPL_CYAN}44`, color: XRPL_CYAN }}
            >
              <ArrowLeft className="w-4 h-4" />
              Return to the Castle
            </Link>
            <Link
              href="/codetry"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "#1A3A1C", border: "1px solid #2C5F2E88", color: "#8BAD78" }}
            >
              Visit Codetry
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
