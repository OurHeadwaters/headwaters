import { Link, useRoute } from "wouter";
import { ArrowLeft, ArrowRight, Compass, Loader2, PlayCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useGordPageTitle } from "@/context/gord-context";
import { useTransformations } from "@/hooks/use-transformations";
import { useListEpisodes, getListEpisodesQueryKey } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";

function TransformDetailContent({ slug }: { slug: string }) {
  const { data: transformations, isLoading, isError } = useTransformations();
  const t = transformations?.find((x) => x.slug === slug) ?? null;

  const gordTitle = t ? `${t.from} → ${t.to}` : null;
  useGordPageTitle(gordTitle);

  const queryTags = t ? [...new Set([...t.tags, ...t.categories].map((s) => s.toLowerCase()))] : [];
  const params = { limit: 20, offset: 0, tags: queryTags, sort: "popular" as const };
  const { data: episodePage } = useListEpisodes(params, {
    query: {
      queryKey: getListEpisodesQueryKey(params),
      enabled: !!t,
    },
  });
  const episodes = episodePage?.items ?? [];
  const total = episodePage?.total ?? null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground gap-3">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading transformation…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-32 text-center text-muted-foreground">
        Could not load transformation. Try refreshing.
      </div>
    );
  }

  if (!t) {
    return <NotFound />;
  }

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
            backgroundImage: `radial-gradient(ellipse at 70% 40%, ${t.color} 0%, transparent 50%)`,
          }}
        />
        <div className="max-w-4xl mx-auto px-6 py-14 relative">
          <Link
            href="/transform"
            className="inline-flex items-center gap-1.5 text-xs font-semibold mb-8 transition-colors"
            style={{ color: t.color + "cc" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All transformation paths
          </Link>

          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full"
            style={{
              color: t.color,
              background: t.color + "18",
              border: `1px solid ${t.color}33`,
            }}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Transformation Path</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap mb-4">
            <span className="text-5xl leading-none">{t.icon}</span>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight" style={{ color: "#FDFBF7" }}>
                  {t.from}
                </h1>
                <ArrowRight className="w-6 h-6 shrink-0" style={{ color: t.color }} />
                <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight" style={{ color: t.color }}>
                  {t.to}
                </h1>
              </div>
            </div>
          </div>

          <p className="text-lg leading-relaxed max-w-2xl" style={{ color: "#C8D4C0" }}>
            {t.description}
          </p>

          {total !== null && (
            <p className="mt-4 text-sm font-semibold" style={{ color: t.color }}>
              {total.toLocaleString()} episode{total !== 1 ? "s" : ""} on this path
            </p>
          )}
        </div>
      </div>

      {/* Episodes */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-1">
              Episodes for this path
            </h2>
            <p className="text-sm text-muted-foreground">
              The most relevant episodes for the {t.from} → {t.to} journey.
            </p>
          </div>
          <Link
            href={`/episodes?transformation=${encodeURIComponent(t.slug)}`}
            className="hidden sm:flex items-center gap-1 text-sm font-semibold transition-colors"
            style={{ color: t.color }}
          >
            Browse all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {episodes.length === 0 && total === null && (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading episodes…</span>
          </div>
        )}

        {episodes.length === 0 && total === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            No episodes found for this path yet.
          </div>
        )}

        <div className="flex flex-col gap-3">
          {episodes.map((ep) => (
            <Link
              key={ep.slug}
              href={`/episodes/${ep.slug}`}
              className="group flex items-start gap-3 rounded-xl px-4 py-3.5 transition-colors hover:bg-black/5"
              style={{ border: `1px solid ${t.color}20`, background: t.color + "06" }}
            >
              <PlayCircle
                className="w-4 h-4 mt-0.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                style={{ color: t.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors">
                  {ep.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(parseISO(ep.pubDate), "MMM d, yyyy")}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 mt-0.5 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: t.color }} />
            </Link>
          ))}
        </div>

        {total !== null && total > episodes.length && (
          <div className="mt-8 text-center">
            <Link
              href={`/episodes?transformation=${encodeURIComponent(t.slug)}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px"
              style={{
                color: t.color,
                background: t.color + "15",
                border: `1px solid ${t.color}33`,
              }}
            >
              See all {total.toLocaleString()} episodes
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TransformDetailPage() {
  const [, params] = useRoute("/transform/:slug");
  const slug = params?.slug ?? "";
  return <TransformDetailContent slug={slug} />;
}
