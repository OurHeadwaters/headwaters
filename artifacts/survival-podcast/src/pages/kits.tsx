import { Link } from "wouter";
import { Package, Loader2 } from "lucide-react";
import { useListKits } from "@/hooks/use-kits";
import { KitCard } from "@/components/kit-card";
import { OdysseyBridge } from "@/components/odyssey-bridge";

export default function KitsPage() {
  const { data: kits, isLoading, isError } = useListKits();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div
        className="border-b border-border relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0F1F1A 0%, #1A2E24 60%, #1E3A2E 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 70% 50%, #D9A066 0%, transparent 55%)",
          }}
        />
        <div className="max-w-5xl mx-auto px-6 py-16 relative">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full"
            style={{
              color: "#D9A066",
              background: "#D9A06618",
              border: "1px solid #D9A06633",
            }}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Headwaters Kits</span>
          </div>

          <h1
            className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-5"
            style={{ color: "#FDFBF7" }}
          >
            Everything you need.
            <br />
            <span style={{ color: "#8FA883" }}>Bundled for your path.</span>
          </h1>

          <p className="text-lg leading-relaxed max-w-2xl mb-6" style={{ color: "#C8D4C0" }}>
            Each kit bundles the episodes, gear, and resources for a specific transformation.
            Whether you're building income sovereignty, reclaiming your health, or hardening
            your household — there's a kit for where you are right now.
          </p>

          <p className="text-sm leading-relaxed max-w-xl" style={{ color: "#8FA883" }}>
            Some kits are fully self-contained here on The Stomping Path. Others connect you
            to purpose-built tools — the privacy guide, the practitioner platform, or the
            community coordination network.
          </p>

          <div className="mt-8 flex gap-3 flex-wrap items-center">
            <Link
              href="/tracks"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors border"
              style={{
                color: "#FDFBF7",
                borderColor: "#FDFBF730",
                background: "#FDFBF710",
              }}
            >
              Browse Learning Tracks
            </Link>
            <Link
              href="/transform"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors border"
              style={{
                color: "#8FA883",
                borderColor: "#8FA88330",
                background: "#8FA88310",
              }}
            >
              Transformation Paths
            </Link>
          </div>
        </div>
      </div>

      {/* Kit grid */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-1">
              The kits
            </h2>
            <p className="text-sm text-muted-foreground">
              Find the bundle that matches your transformation.
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading kits…</span>
          </div>
        )}

        {isError && (
          <div className="py-24 text-center text-muted-foreground">
            Could not load kits. Try refreshing.
          </div>
        )}

        {kits && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {kits.map((kit) => (
              <KitCard key={kit.slug} kit={kit} />
            ))}
          </div>
        )}

        <div className="mt-14">
          <OdysseyBridge variant="full" />
        </div>
      </div>
    </div>
  );
}
