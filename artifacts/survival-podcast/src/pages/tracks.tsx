import { Link } from "wouter";
import { useListTracks, TrackSummary } from "@/hooks/use-tracks";
import { OdysseyBridge } from "@/components/odyssey-bridge";
import { BookOpen, ChevronRight, Loader2 } from "lucide-react";

const ZONE_LABELS = ["Zone 0", "Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5"];

function TrackCard({ track }: { track: TrackSummary }) {
  return (
    <Link
      href={`/tracks/${track.slug}`}
      className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30 transition-all duration-200"
    >
      {/* Top bar */}
      <div
        className="px-6 py-5 flex items-start justify-between gap-4"
        style={{ backgroundColor: track.color + "18", borderBottom: `1px solid ${track.color}22` }}
      >
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
            style={{ color: track.color }}
          >
            {ZONE_LABELS[track.zoneNumber]} · Learning Track
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none">{track.icon}</span>
            <h2 className="font-serif text-xl font-bold text-foreground group-hover:text-primary transition-colors">
              {track.title}
            </h2>
          </div>
        </div>
        {track.episodeCount > 0 && (
          <span
            className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border"
            style={{
              color: track.color,
              borderColor: track.color + "44",
              background: track.color + "15",
            }}
          >
            {track.episodeCount.toLocaleString()} episodes
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-5 flex flex-col flex-1">
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
          {track.description}
        </p>

        {track.sampleArtwork.length > 0 && (
          <div className="flex gap-1.5 mb-4">
            {track.sampleArtwork.slice(0, 4).map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="w-11 h-11 rounded-md object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-sm font-semibold text-primary/70 group-hover:text-primary transition-colors mt-auto">
          Start this track
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

export default function TracksPage() {
  const { data: tracks, isLoading, isError } = useListTracks();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div
        className="border-b border-border relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0F1F0F 0%, #1A2E1A 60%, #1E3A1E 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 70% 50%, #C4622D 0%, transparent 55%)",
          }}
        />
        <div className="max-w-5xl mx-auto px-6 py-16 relative">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full"
            style={{
              color: "#C4622D",
              background: "#C4622D18",
              border: "1px solid #C4622D33",
            }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Headwaters Learning Tracks</span>
          </div>

          <h1
            className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-5"
            style={{ color: "#FDFBF7" }}
          >
            From theory to practice.
          </h1>

          <p className="text-lg leading-relaxed max-w-2xl mb-6" style={{ color: "#C8D4C0" }}>
            Sixteen years of episodes, organized as structured learning paths. Each track follows
            the permaculture zone framework — starting from the self and working outward — so you
            build knowledge the same way you build resilience.
          </p>

          <p className="text-sm leading-relaxed max-w-xl" style={{ color: "#8FA883" }}>
            Work through a track start to finish, or jump to the zone that matches where you are.
            When you're ready to take what you've learned into community, there's a path waiting.
          </p>

          <div className="mt-8 flex gap-3">
            <Link
              href="/start"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors border"
              style={{
                color: "#FDFBF7",
                borderColor: "#FDFBF730",
                background: "#FDFBF710",
              }}
            >
              New here? Start here
            </Link>
          </div>
        </div>
      </div>

      {/* Track grid */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-1">The six tracks</h2>
            <p className="text-sm text-muted-foreground">
              One for each zone — from self-sovereignty to wilderness contingency.
            </p>
          </div>
          <Link
            href="/zones"
            className="hidden sm:flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Browse by zone <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading tracks…</span>
          </div>
        )}
        {isError && (
          <div className="py-24 text-center text-muted-foreground">
            Could not load tracks. Try refreshing.
          </div>
        )}
        {tracks && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {tracks.map((track) => (
              <TrackCard key={track.slug} track={track} />
            ))}
          </div>
        )}

        {/* Odyssey bridge */}
        <div className="mt-14">
          <OdysseyBridge variant="full" />
        </div>
      </div>
    </div>
  );
}
