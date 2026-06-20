import { Link } from "wouter";
import { Users, ArrowLeft, ChevronRight, Coffee, Mic, Calendar } from "lucide-react";

const HALL_GREEN = "#8BAD78";

const HALL_VALUES = [
  {
    title: "No conversion required",
    body: "You don't have to hold Bitcoin or build on XRPL to belong here. The Hall is for anyone in the castle — shared skills are the currency.",
    icon: Coffee,
  },
  {
    title: "Fireside Chats",
    body: "Regular conversations across factions. The goal is not agreement — it is the quality of the exchange. Come prepared to listen as much as you talk.",
    icon: Mic,
  },
  {
    title: "Skill trading",
    body: "What can you teach? What do you need to learn? The Hall runs on reciprocal competence — not ideology, not credentials.",
    icon: Users,
  },
  {
    title: "Events & gatherings",
    body: "Both digital and physical. The Hall coordinates across time zones and walks — because some conversations require a fire, not a feed.",
    icon: Calendar,
  },
];

const HALL_DESTINATIONS = [
  {
    label: "Stomping Grounds",
    description: "The wider community hub. Wishing Well, Wisdom Dig, events, and open conversations.",
    href: "/stomping-grounds",
  },
  {
    label: "Workshops",
    description: "Live and recorded skill sessions hosted by community members and Expert Council practitioners.",
    href: "/workshops",
  },
  {
    label: "Expert Council",
    description: "Practitioners across preparedness, finance, and self-reliance. Cross-faction by design.",
    href: "/council",
  },
];

export default function CommunityHallPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(160deg, #0A1209 0%, #080F07 40%, #060D05 70%, #050C04 100%)",
        color: "#FDFBF7",
      }}
    >
      <div className="relative overflow-hidden border-b" style={{ borderColor: `${HALL_GREEN}28` }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${HALL_GREEN}10 0%, transparent 70%)`,
          }}
        />
        <div className="relative max-w-3xl mx-auto px-6 pt-10 pb-12">
          <Link
            href="/crypto-castle"
            className="inline-flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-80"
            style={{ color: `${HALL_GREEN}BB` }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Crypto Castle
          </Link>

          <div className="flex flex-col items-start gap-5">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest"
              style={{ borderColor: `${HALL_GREEN}44`, color: HALL_GREEN, background: `${HALL_GREEN}12` }}
            >
              Shared Wing
            </div>

            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${HALL_GREEN}18`, border: `1px solid ${HALL_GREEN}44` }}
              >
                <Users className="w-7 h-7" style={{ color: HALL_GREEN }} />
              </div>
              <div>
                <h1 className="font-serif text-4xl md:text-5xl font-bold" style={{ color: "#FDFBF7" }}>
                  Community Hall
                </h1>
                <p className="text-sm font-semibold uppercase tracking-wider mt-1" style={{ color: HALL_GREEN }}>
                  No conversion required.
                </p>
              </div>
            </div>

            <p className="text-base leading-relaxed max-w-2xl" style={{ color: "#A8BCAA" }}>
              Where all factions meet, trade skills, and run Fireside Chats. The Hall belongs to everyone in the
              castle. You don't have to agree on money to share a meal.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-10">
        <section>
          <h2 className="font-serif text-2xl font-bold mb-6" style={{ color: "#FDFBF7" }}>
            Hall Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HALL_VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl border p-6 flex flex-col gap-3"
                  style={{ background: `${HALL_GREEN}08`, borderColor: `${HALL_GREEN}25` }}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: HALL_GREEN }} />
                    <h3 className="font-semibold text-sm" style={{ color: "#FDFBF7" }}>{v.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#9AADA0" }}>{v.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold mb-2" style={{ color: "#FDFBF7" }}>
            Enter the Hall
          </h2>
          <p className="text-sm mb-6" style={{ color: "#7A9A80" }}>
            The Hall connects to the broader community. Start with Stomping Grounds — the open common of the castle.
          </p>
          <div className="flex flex-col gap-3">
            {HALL_DESTINATIONS.map((d, i) => (
              <Link
                key={i}
                href={d.href}
                className="rounded-2xl border p-5 flex items-center justify-between gap-4 transition-all hover:border-opacity-60 group"
                style={{ background: `${HALL_GREEN}06`, borderColor: `${HALL_GREEN}22` }}
              >
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#FDFBF7" }}>{d.label}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "#8A9E8E" }}>{d.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: HALL_GREEN }} />
              </Link>
            ))}
          </div>
        </section>

        <div
          className="rounded-2xl border p-6 text-center"
          style={{ background: `${HALL_GREEN}06`, borderColor: `${HALL_GREEN}22` }}
        >
          <p className="text-sm leading-relaxed mb-5" style={{ color: "#7A9A80" }}>
            Dedicated Fireside Chat scheduling and Hall-specific events are coming. For now, the Stomping Grounds
            is home base for cross-faction conversation and community activity.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/crypto-castle"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: `${HALL_GREEN}18`, border: `1px solid ${HALL_GREEN}44`, color: HALL_GREEN }}
            >
              <ArrowLeft className="w-4 h-4" />
              Return to the Castle
            </Link>
            <Link
              href="/stomping-grounds"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "#1A3A1C", border: "1px solid #2C5F2E88", color: "#8BAD78" }}
            >
              Go to Stomping Grounds
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
