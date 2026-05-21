import { ExternalLink, Compass } from "lucide-react";

interface OdysseyBridgeProps {
  variant?: "full" | "compact";
}

export function OdysseyBridge({ variant = "full" }: OdysseyBridgeProps) {
  if (variant === "compact") {
    return (
      <a
        href="https://ourheadwaters.ca/odyssey"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-200 hover:shadow-md"
        style={{
          background: "linear-gradient(135deg, #1E3A1E 0%, #2C5020 100%)",
          borderColor: "#C4622D44",
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "#C4622D22", border: "1px solid #C4622D55" }}
        >
          <Compass className="w-5 h-5" style={{ color: "#C4622D" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
            style={{ color: "#C4622D" }}
          >
            Headwaters Odyssey
          </div>
          <p className="text-sm font-semibold leading-snug" style={{ color: "#FDFBF7" }}>
            Ready to bring this to your community?
          </p>
        </div>
        <ExternalLink
          className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: "#C4622D" }}
        />
      </a>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{
        background: "linear-gradient(160deg, #1A3218 0%, #0F2010 100%)",
        borderColor: "#C4622D33",
      }}
    >
      <div className="px-8 py-10 md:px-12 md:py-12">
        <div className="max-w-2xl">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-6 px-3 py-1.5 rounded-full"
            style={{
              color: "#C4622D",
              background: "#C4622D18",
              border: "1px solid #C4622D33",
            }}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Headwaters Odyssey</span>
          </div>

          <h2
            className="font-serif text-2xl md:text-3xl font-bold leading-snug mb-4"
            style={{ color: "#FDFBF7" }}
          >
            Ready to bring this to your community?
          </h2>

          <p className="text-base leading-relaxed mb-3" style={{ color: "#C8D4C0" }}>
            The Headwaters Odyssey is for people who've done the self-reliance work and are ready
            for the next step — building community-scale resilience with people in their watershed.
          </p>

          <p className="text-sm leading-relaxed mb-8" style={{ color: "#8FA883" }}>
            The Stomping Path gives you the theory and the skills. The Odyssey is where those skills meet other
            people doing the same work — structured as a year-long journey through land, water,
            food, and governance.
          </p>

          <a
            href="https://ourheadwaters.ca/odyssey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-lg font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              background: "#C4622D",
              color: "#FDFBF7",
              boxShadow: "0 4px 20px #C4622D44",
            }}
          >
            <Compass className="w-4 h-4" />
            Explore the Odyssey
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>
      </div>

      <div
        className="px-8 py-5 md:px-12 border-t flex items-center gap-3"
        style={{ borderColor: "#FDFBF710", background: "#FDFBF705" }}
      >
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#C4622D" }} />
        <p className="text-xs" style={{ color: "#8FA883" }}>
          <span className="font-semibold" style={{ color: "#C8D4C0" }}>ourheadwaters.ca</span>
          {" "}— community-scale resilience through the Codetry framework
        </p>
      </div>
    </div>
  );
}
