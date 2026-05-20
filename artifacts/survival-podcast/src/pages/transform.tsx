import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, Compass, Loader2 } from "lucide-react";
import { OdysseyBridge } from "@/components/odyssey-bridge";
import { useListEpisodes, getListEpisodesQueryKey } from "@workspace/api-client-react";

type Transformation = {
  slug: string;
  from: string;
  to: string;
  description: string;
  tags: string[];
  categories: string[];
  color: string;
  icon: string;
};

function useTransformations() {
  return useQuery<Transformation[]>({
    queryKey: ["transformations"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.BASE_URL}api/transformations`.replace(/\/+/g, "/").replace(":/", "://"),
      );
      if (!res.ok) throw new Error("Failed to load transformations");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

function buildEpisodesUrl(t: Transformation): string {
  return `/episodes?transformation=${encodeURIComponent(t.slug)}`;
}

function buildTagsFilter(t: Transformation): string[] {
  const allTerms = [...t.tags, ...t.categories];
  return [...new Set(allTerms.map((s) => s.toLowerCase()))];
}

function TransformationCard({ t }: { t: Transformation }) {
  const queryTags = buildTagsFilter(t);
  const params = { limit: 1, offset: 0, tags: queryTags };
  const { data: episodePage } = useListEpisodes(params, {
    query: { queryKey: getListEpisodesQueryKey(params) },
  });
  const count = episodePage?.total ?? null;

  return (
    <div
      className="flex flex-col rounded-xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{ borderColor: t.color + "33", background: t.color + "08" }}
    >
      <div
        className="px-6 py-5 flex items-start gap-4"
        style={{ borderBottom: `1px solid ${t.color}22` }}
      >
        <span className="text-3xl leading-none mt-0.5">{t.icon}</span>
        <div className="flex-1 min-w-0">
          <div
            className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: t.color }}
          >
            Transformation Path
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-serif text-lg font-bold text-foreground">
              {t.from}
            </span>
            <ArrowRight className="w-4 h-4 shrink-0" style={{ color: t.color }} />
            <span className="font-serif text-lg font-bold" style={{ color: t.color }}>
              {t.to}
            </span>
          </div>
        </div>
        {count !== null && (
          <div
            className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ color: t.color, background: t.color + "18", border: `1px solid ${t.color}30` }}
          >
            {count} ep{count !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className="px-6 py-5 flex flex-col flex-1">
        <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">
          {t.description}
        </p>
        <Link
          href={buildEpisodesUrl(t)}
          className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px"
          style={{
            color: t.color,
            background: t.color + "15",
            border: `1px solid ${t.color}33`,
          }}
        >
          Find Episodes
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function TransformPage() {
  const { data: transformations, isLoading, isError } = useTransformations();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div
        className="border-b border-border relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0F1A28 0%, #14222E 60%, #1A2C30 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 70% 40%, #4A7A3A 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, #C4622D 0%, transparent 45%)",
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
            <Compass className="w-3.5 h-3.5" />
            <span>Codetry · Transformation Paths</span>
          </div>

          <h1
            className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-5"
            style={{ color: "#FDFBF7" }}
          >
            You've started the shift.
            <br />
            <span style={{ color: "#8FA883" }}>Here's how to build it.</span>
          </h1>

          <p className="text-lg leading-relaxed max-w-2xl mb-4" style={{ color: "#C8D4C0" }}>
            TSP listeners are people mid-transformation — from conventional to regenerative, debt
            to freedom, employee to owner, grid to off-grid. These paths name the journey you're
            on and surface the episodes that matter most for where you are.
          </p>

          <p className="text-sm leading-relaxed max-w-xl" style={{ color: "#8FA883" }}>
            Each path is framed through the Codetry lens: the personal shift is just the
            beginning. Once you've made the change yourself, there's a way to build it at
            community scale.
          </p>
        </div>
      </div>

      {/* Transformation grid */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-1">
              The six transformations
            </h2>
            <p className="text-sm text-muted-foreground">
              Pick the path that matches where you are right now.
            </p>
          </div>
          <Link
            href="/episodes"
            className="hidden sm:flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Browse all episodes <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading transformation paths…</span>
          </div>
        )}

        {isError && (
          <div className="py-24 text-center text-muted-foreground">
            Could not load transformations. Try refreshing.
          </div>
        )}

        {transformations && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {transformations.map((t) => (
              <TransformationCard key={t.slug} t={t} />
            ))}
          </div>
        )}

        {/* What comes next */}
        <div className="mt-14 mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            <span className="w-6 h-px bg-border" />
            After the personal transformation
          </div>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-3">
            Built the skills. Ready to build the community?
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mb-8">
            Codetry is the discipline for the "build" phase that follows — turning personal
            transformation into community-scale systems using precise shared language. The
            Headwaters Odyssey is where TSP listeners go when they're ready to take that step.
          </p>
          <OdysseyBridge variant="full" />
        </div>
      </div>
    </div>
  );
}
