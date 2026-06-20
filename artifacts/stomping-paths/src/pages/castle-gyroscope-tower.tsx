import { Link } from "wouter";
import { Compass, ArrowLeft, ChevronRight, Activity, BarChart2, Eye } from "lucide-react";

const TOWER_GOLD = "#C4A05A";

const TOWER_FUNCTIONS = [
  {
    title: "Cross-wing drift detection",
    body: "The Tower monitors all four wings for ideological lock-in, groupthink, and signal-to-noise collapse. When a wing drifts, the Tower flags it.",
    icon: Activity,
  },
  {
    title: "Balance intelligence",
    body: "No single wing dominates. The Tower tracks how much air time each faction gets and surfaces imbalances — not to correct them, but to name them.",
    icon: BarChart2,
  },
  {
    title: "Outside-world calibration",
    body: "The Tower reads external signals — macro events, monetary system shifts, community mood — and maps them back to what they mean for castle residents.",
    icon: Eye,
  },
  {
    title: "Orientation without prescription",
    body: "The Tower doesn't tell you what to believe. It tells you where the floor is. Orientation, not ideology. Bearing, not belief.",
    icon: Compass,
  },
];

const TOWER_RESOURCES = [
  {
    label: "Zone Map",
    description: "The full preparedness zone map. The Tower is calibrated against this — each zone tells you where you are, not where you should be.",
    href: "/map",
  },
  {
    label: "Transformation Paths",
    description: "Tracked listener outcomes across the TSP archive. The Tower uses transformation data as one of its drift signals.",
    href: "/transform",
  },
  {
    label: "Zone 5 — The Wild",
    description: "The castle sits at the edge. Zone 5 is where conventional systems thin out and independent orientation becomes critical.",
    href: "/zones/zone-5",
  },
];

export default function GyroscopeTowerPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(160deg, #141006 0%, #0F0C04 40%, #0B0903 70%, #090703 100%)",
        color: "#FDFBF7",
      }}
    >
      <div className="relative overflow-hidden border-b" style={{ borderColor: `${TOWER_GOLD}28` }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${TOWER_GOLD}10 0%, transparent 70%)`,
          }}
        />
        <div className="relative max-w-3xl mx-auto px-6 pt-10 pb-12">
          <Link
            href="/crypto-castle"
            className="inline-flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-80"
            style={{ color: `${TOWER_GOLD}BB` }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Crypto Castle
          </Link>

          <div className="flex flex-col items-start gap-5">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest"
              style={{ borderColor: `${TOWER_GOLD}44`, color: TOWER_GOLD, background: `${TOWER_GOLD}12` }}
            >
              Observation Wing
            </div>

            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${TOWER_GOLD}18`, border: `1px solid ${TOWER_GOLD}44` }}
              >
                <Compass className="w-7 h-7" style={{ color: TOWER_GOLD }} />
              </div>
              <div>
                <h1 className="font-serif text-4xl md:text-5xl font-bold" style={{ color: "#FDFBF7" }}>
                  Gyroscope Tower
                </h1>
                <p className="text-sm font-semibold uppercase tracking-wider mt-1" style={{ color: TOWER_GOLD }}>
                  Read the room.
                </p>
              </div>
            </div>

            <p className="text-base leading-relaxed max-w-2xl" style={{ color: "#A8BCAA" }}>
              Balance intelligence. The Tower reads across all wings and flags where the system is drifting —
              keeping the castle oriented when the outside world loses its bearings.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-10">
        <section>
          <h2 className="font-serif text-2xl font-bold mb-6" style={{ color: "#FDFBF7" }}>
            Tower Functions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TOWER_FUNCTIONS.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl border p-6 flex flex-col gap-3"
                  style={{ background: `${TOWER_GOLD}08`, borderColor: `${TOWER_GOLD}25` }}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: TOWER_GOLD }} />
                    <h3 className="font-semibold text-sm" style={{ color: "#FDFBF7" }}>{f.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#9AADA0" }}>{f.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold mb-2" style={{ color: "#FDFBF7" }}>
            Orientation Resources
          </h2>
          <p className="text-sm mb-6" style={{ color: "#7A9A80" }}>
            The Tower reads from these sources. Start here to calibrate your own bearing.
          </p>
          <div className="flex flex-col gap-3">
            {TOWER_RESOURCES.map((r, i) => (
              <Link
                key={i}
                href={r.href}
                className="rounded-2xl border p-5 flex items-center justify-between gap-4 transition-all hover:border-opacity-60 group"
                style={{ background: `${TOWER_GOLD}06`, borderColor: `${TOWER_GOLD}22` }}
              >
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#FDFBF7" }}>{r.label}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "#8A9E8E" }}>{r.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: TOWER_GOLD }} />
              </Link>
            ))}
          </div>
        </section>

        <div
          className="rounded-2xl border p-6 text-center"
          style={{ background: `${TOWER_GOLD}06`, borderColor: `${TOWER_GOLD}22` }}
        >
          <p className="text-sm leading-relaxed mb-5" style={{ color: "#7A9A80" }}>
            Live drift metrics and cross-wing balance dashboards are being built for the Tower.
            The Zone Map is the best current orientation tool while the Tower's instrumentation is assembled.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/crypto-castle"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: `${TOWER_GOLD}18`, border: `1px solid ${TOWER_GOLD}44`, color: TOWER_GOLD }}
            >
              <ArrowLeft className="w-4 h-4" />
              Return to the Castle
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "#1A3A1C", border: "1px solid #2C5F2E88", color: "#8BAD78" }}
            >
              View the Zone Map
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
