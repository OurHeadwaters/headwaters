import { Link } from "wouter";
import { Shield, Hammer, Users, Compass, ChevronRight, type LucideIcon } from "lucide-react";

const TORCH_ORANGE = "#D4621A";
const XRPL_CYAN = "#00BFDF";

function CastleOrnament() {
  return (
    <svg
      viewBox="0 0 400 130"
      className="w-full max-w-lg h-auto"
      aria-hidden="true"
      style={{ filter: "drop-shadow(0 0 14px rgba(212,98,26,0.28))" }}
    >
      <defs>
        <linearGradient id="cc-castle-body" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1a2c20" />
          <stop offset="100%" stopColor="#0c1611" />
        </linearGradient>
        <radialGradient id="cc-xrpl-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00BFDF" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#00BFDF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cc-torch-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D4621A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#D4621A" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="200" cy="110" rx="160" ry="30" fill="url(#cc-torch-glow)" opacity="0.45" />

      {/* Left tower */}
      <rect x="55" y="56" width="38" height="74" fill="url(#cc-castle-body)" />
      {[55, 68, 81].map((x, i) => <rect key={i} x={x} y={44} width={10} height={14} fill="url(#cc-castle-body)" />)}
      <rect x="67" y="74" width="12" height="16" rx="1.5" fill="#0c1611" />
      <ellipse cx="73" cy="74" rx="6" ry="2.5" fill="#0c1611" />

      {/* Right tower */}
      <rect x="307" y="56" width="38" height="74" fill="url(#cc-castle-body)" />
      {[307, 320, 333].map((x, i) => <rect key={i} x={x} y={44} width={10} height={14} fill="url(#cc-castle-body)" />)}
      <rect x="321" y="74" width="12" height="16" rx="1.5" fill="#0c1611" />
      <ellipse cx="327" cy="74" rx="6" ry="2.5" fill="#0c1611" />

      {/* Curtain walls */}
      <rect x="93" y="72" width="82" height="58" fill="url(#cc-castle-body)" />
      <rect x="225" y="72" width="82" height="58" fill="url(#cc-castle-body)" />
      {[93, 107, 121, 135, 149].map((x, i) => <rect key={i} x={x} y={60} width={10} height={14} fill="url(#cc-castle-body)" />)}
      {[225, 239, 253, 267, 281].map((x, i) => <rect key={i} x={x} y={60} width={10} height={14} fill="url(#cc-castle-body)" />)}

      {/* Central keep */}
      <rect x="135" y="24" width="130" height="106" fill="url(#cc-castle-body)" />
      {[135, 153, 171, 189, 207, 225, 243].map((x, i) => <rect key={i} x={x} y={10} width={14} height={16} fill="url(#cc-castle-body)" />)}

      {/* Gate arch */}
      <rect x="183" y="88" width="34" height="42" fill="#0c1611" />
      <ellipse cx="200" cy="88" rx="17" ry="9" fill="#0c1611" />

      {/* Side keep windows */}
      <rect x="148" y="52" width="14" height="20" rx="2" fill="#0c1611" />
      <ellipse cx="155" cy="52" rx="7" ry="3" fill="#0c1611" />
      <rect x="238" y="52" width="14" height="20" rx="2" fill="#0c1611" />
      <ellipse cx="245" cy="52" rx="7" ry="3" fill="#0c1611" />

      {/* Center XRPL window */}
      <rect x="188" y="30" width="24" height="34" rx="3" fill="#0a120e" />
      <ellipse cx="200" cy="30" rx="12" ry="5" fill="#0a120e" />
      <ellipse cx="200" cy="44" rx="9" ry="12" fill="url(#cc-xrpl-glow)" />

      {/* Torch flames */}
      <ellipse cx="100" cy="70" rx="5" ry="7" fill={TORCH_ORANGE} opacity="0.85"
        style={{ animation: "lantern-flicker 3.4s ease-in-out infinite" }} />
      <ellipse cx="300" cy="70" rx="5" ry="7" fill={TORCH_ORANGE} opacity="0.85"
        style={{ animation: "lantern-flicker 3.4s ease-in-out 1.2s infinite" }} />
    </svg>
  );
}

interface Wing {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  accentColor: string;
  href: string;
  buttonLabel: string;
}

const WINGS: Wing[] = [
  {
    id: "bitcoin-keep",
    name: "Bitcoin Keep",
    tagline: "Hold your ground.",
    description:
      "Conviction lives here. This wing is for those who have already chosen their path and carry it quietly — sharing strength with the shared hall without demanding anyone follow.",
    icon: Shield,
    accentColor: TORCH_ORANGE,
    href: "/zones/zone-0",
    buttonLabel: "Enter this wing",
  },
  {
    id: "xrpl-forge",
    name: "XRPL Forge",
    tagline: "Build on the rails.",
    description:
      "Builders, tokenizers, and Hook writers. XRPL rails run through every wing of the castle — this is where the infrastructure gets hammered out and the tools are made.",
    icon: Hammer,
    accentColor: XRPL_CYAN,
    href: "/zones/zone-0",
    buttonLabel: "Enter this wing",
  },
  {
    id: "community-hall",
    name: "Community Hall",
    tagline: "No conversion required.",
    description:
      "Where all factions meet, trade skills, and run Fireside Chats. The Hall belongs to everyone in the castle. You don't have to agree on money to share a meal.",
    icon: Users,
    accentColor: "#8BAD78",
    href: "/stomping-grounds",
    buttonLabel: "Enter this wing",
  },
  {
    id: "gyroscope-tower",
    name: "Gyroscope Tower",
    tagline: "Read the room.",
    description:
      "Balance intelligence. The Tower reads across all wings and flags where the system is drifting — keeping the castle oriented when the outside world loses its bearings.",
    icon: Compass,
    accentColor: "#C4A05A",
    href: "/map",
    buttonLabel: "Enter this wing",
  },
];

export default function CryptoCastlePage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(160deg, #0D1A10 0%, #09130B 40%, #080F09 70%, #060D07 100%)",
        color: "#FDFBF7",
      }}
    >
      {/* Masthead */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: `${TORCH_ORANGE}28` }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${TORCH_ORANGE}12 0%, transparent 70%)`,
          }}
        />
        <div className="relative max-w-3xl mx-auto px-6 pt-16 pb-12 flex flex-col items-center text-center gap-6">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest"
            style={{ borderColor: `${TORCH_ORANGE}44`, color: TORCH_ORANGE, background: `${TORCH_ORANGE}12` }}
          >
            Faction Hub
          </div>

          <CastleOrnament />

          <h1 className="font-serif text-4xl md:text-5xl font-bold" style={{ color: "#FDFBF7" }}>
            Crypto Castle
          </h1>
          <p className="text-base md:text-lg leading-relaxed max-w-xl" style={{ color: "#A8BCAA" }}>
            One castle, many wings. No conversion required.
          </p>
          <p className="text-sm leading-relaxed max-w-lg" style={{ color: "#7A9A80" }}>
            The Crypto Castle dissolves polarization through shared structure. Each faction holds its convictions — Bitcoin Keep, XRPL Forge, Community Hall, Gyroscope Tower — and all four wings meet in the shared hall where skills, not ideology, are the currency.
          </p>
        </div>
      </div>

      {/* Wing cards */}
      <div className="max-w-4xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {WINGS.map((wing) => {
            const Icon = wing.icon;
            return (
              <div
                key={wing.id}
                className="rounded-2xl border p-7 flex flex-col gap-5 transition-all duration-200 hover:border-opacity-60"
                style={{
                  background: `${wing.accentColor}08`,
                  borderColor: `${wing.accentColor}33`,
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${wing.accentColor}18`, border: `1px solid ${wing.accentColor}33` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: wing.accentColor }} />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold" style={{ color: "#FDFBF7" }}>
                      {wing.name}
                    </h2>
                    <p className="text-xs font-semibold uppercase tracking-wider mt-0.5" style={{ color: wing.accentColor }}>
                      {wing.tagline}
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-relaxed" style={{ color: "#B0C4B4" }}>
                  {wing.description}
                </p>

                <div className="mt-auto">
                  <Link
                    href={wing.href}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                    style={{
                      background: `${wing.accentColor}22`,
                      border: `1px solid ${wing.accentColor}44`,
                      color: wing.accentColor,
                    }}
                  >
                    {wing.buttonLabel}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lore footer */}
        <div
          className="mt-14 rounded-2xl border p-7 text-center"
          style={{ background: `${XRPL_CYAN}06`, borderColor: `${XRPL_CYAN}22` }}
        >
          <p className="text-sm leading-relaxed max-w-2xl mx-auto" style={{ color: "#7A9A80" }}>
            The castle sits at the outer edge of Zone 5 — The Wild. It is not a belief system. It is a structure that holds multiple belief systems without requiring them to merge. The Headwaters Ship docks at the same harbor.
          </p>
          <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "#1A3A1C", border: "1px solid #2C5F2E88", color: "#8BAD78" }}
            >
              <Compass className="w-4 h-4" />
              Back to the Zone Map
            </Link>
            <Link
              href="/headwaters"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: `${XRPL_CYAN}12`, border: `1px solid ${XRPL_CYAN}33`, color: XRPL_CYAN }}
            >
              Visit the Headwaters Ship
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
