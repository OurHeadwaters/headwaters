import { Link, useRoute } from "wouter";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Compass, Loader2, PlayCircle, ExternalLink, Package, Share2 } from "lucide-react";
import { ShareModal, SharedNoteBanner } from "@/components/share-modal";
import { useShareCount } from "@/hooks/use-share-count";

import { format, parseISO } from "date-fns";
import { useTransformations } from "@/hooks/use-transformations";
import { useListEpisodes, getListEpisodesQueryKey, useListSuiteCreators, useListSuiteKits } from "@workspace/api-client-react";
import type { SuiteCreator, SuiteKit } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import { KIT_META } from "@/hooks/use-kits";

// ─── Creator card ───────────────────────────────────────────────────────────────

function CreatorCard({ creator, accentColor }: { creator: SuiteCreator; accentColor: string }) {
  const isComingSoon = creator.status === "coming-soon";
  const linkTypes: Record<string, string> = {
    podcast: "🎙",
    video: "▶",
    article: "📄",
    book: "📚",
  };

  const cardContent = (
    <div
      className="flex flex-col gap-3 p-5 rounded-xl border transition-all h-full"
      style={{
        borderColor: `${accentColor}25`,
        background: `${accentColor}07`,
      }}
    >
      <div className="flex items-start gap-3">
        {creator.avatarUrl ? (
          <img
            src={creator.avatarUrl}
            alt={creator.name}
            className={`w-11 h-11 rounded-full object-cover shrink-0 border-2 ${isComingSoon ? "opacity-50 grayscale" : ""}`}
            style={{ borderColor: `${accentColor}40` }}
          />
        ) : (
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-lg font-bold border-2"
            style={{ background: `${accentColor}20`, borderColor: `${accentColor}40`, color: accentColor }}
          >
            {creator.name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground leading-tight">{creator.name}</span>
            {isComingSoon && (
              <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                coming soon
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">{creator.bio}</p>
        </div>
      </div>

      {creator.curatedLinks.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {creator.curatedLinks.slice(0, 3).map((link) => (
            <a
              key={link.url}
              href={isComingSoon ? undefined : link.url}
              target={isComingSoon ? undefined : "_blank"}
              rel="noopener noreferrer"
              onClick={(e) => isComingSoon && e.preventDefault()}
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border transition-colors ${
                isComingSoon
                  ? "opacity-40 cursor-default border-border bg-muted text-muted-foreground"
                  : "border-border bg-background text-foreground hover:border-primary/50 hover:text-primary"
              }`}
            >
              <span>{linkTypes[link.type] ?? "🔗"}</span>
              {link.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );

  if (!isComingSoon && creator.websiteUrl) {
    return (
      <a href={creator.websiteUrl} target="_blank" rel="noopener noreferrer" className="block h-full hover:no-underline group">
        <div className="h-full hover:shadow-md transition-shadow rounded-xl">{cardContent}</div>
      </a>
    );
  }

  return <div className="h-full">{cardContent}</div>;
}

// ─── Kit easy-button card ───────────────────────────────────────────────────────

function KitEasyButton({ kit }: { kit: SuiteKit }) {
  const meta = KIT_META[kit.slug] ?? { icon: "📦", color: "#6B7280" };
  const formatPrice = (cents?: number | null) =>
    cents ? `$${(cents / 100).toFixed(0)}` : null;
  const price = kit.priceType === "direct" ? formatPrice(kit.priceCents) : "Inquiry";

  return (
    <div
      className="rounded-2xl border p-6 flex flex-col gap-4 h-full"
      style={{
        borderColor: `${meta.color}44`,
        background: `linear-gradient(135deg, ${meta.color}12 0%, ${meta.color}06 100%)`,
      }}
    >
      <div>
        <div
          className="text-[10px] font-bold uppercase tracking-widest mb-2"
          style={{ color: meta.color }}
        >
          The easy button
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl leading-none">{meta.icon}</span>
          <h3 className="font-serif text-lg font-bold text-foreground leading-tight">
            {kit.name}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {kit.tagline}
        </p>
      </div>

      {price && (
        <div className="text-xs font-semibold text-muted-foreground">
          {kit.priceType === "direct" ? (
            <span>
              <span className="text-foreground font-bold text-base">{price}</span>
              <span className="ml-1">one-time</span>
            </span>
          ) : (
            <span className="italic">Consultative — inquiry to start</span>
          )}
        </div>
      )}

      <Link
        href={`/kits/${kit.slug}`}
        className="mt-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all hover:-translate-y-px"
        style={{
          color: "#fff",
          background: meta.color,
          boxShadow: `0 4px 20px ${meta.color}40`,
        }}
      >
        <Package className="w-4 h-4" />
        Get {kit.name}
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>

      <p className="text-[10px] text-muted-foreground text-center -mt-2">
        Skip the deep dive — this is the packaged path
      </p>
    </div>
  );
}

// ─── Main content ───────────────────────────────────────────────────────────────

function TransformDetailContent({ slug }: { slug: string }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [noteBannerDismissed, setNoteBannerDismissed] = useState(false);
  const transformShareCount = useShareCount("transform", slug);
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );
  const sharedNote = searchParams.get("note");
  const sharedFrom = searchParams.get("from");

  const { data: transformations, isLoading, isError } = useTransformations();
  const t = transformations?.find((x) => x.slug === slug) ?? null;

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

  const { data: allCreators = [] } = useListSuiteCreators();
  const { data: allKits = [] } = useListSuiteKits();

  const matchedCreators = allCreators.filter((c) => c.transformationSlugs.includes(slug));
  const matchedKit = allKits.find((k) => k.transformationSlugs.includes(slug)) ?? null;

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
      {/* Shared-with-you banner */}
      {sharedNote && !noteBannerDismissed && (
        <SharedNoteBanner
          note={sharedNote}
          from={sharedFrom}
          accentColor={t.color}
          onDismiss={() => setNoteBannerDismissed(true)}
        />
      )}

      {/* Hero */}
      <div
        className="border-b border-border relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0F1A28 0%, #14222E 60%, #1A2C30 100%)",
          borderTop: `4px solid ${t.color}`,
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

          {/* Share button */}
          <div className="mt-6 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all hover:-translate-y-px"
              style={{
                color: t.color,
                borderColor: t.color + "44",
                background: t.color + "18",
              }}
            >
              <Share2 className="w-4 h-4" />
              Share this path
            </button>
            {transformShareCount !== null && transformShareCount > 3 && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  color: t.color,
                  background: t.color + "18",
                  border: `1px solid ${t.color}33`,
                }}
              >
                {transformShareCount.toLocaleString()} {transformShareCount === 1 ? "share" : "shares"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main content — episodes, voices, and kit */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div>

          {/* Episodes */}
          <div>
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
              {episodes.map((ep) => {
                const epParams = new URLSearchParams();
                if (sharedNote) epParams.set("note", sharedNote);
                if (sharedFrom) epParams.set("from", sharedFrom);
                const epHref = epParams.toString()
                  ? `/episodes/${ep.slug}?${epParams.toString()}`
                  : `/episodes/${ep.slug}`;
                return (
                <Link
                  key={ep.slug}
                  href={epHref}
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
              ); })}
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

            {/* Trusted Voices — creators for this path */}
            {matchedCreators.length > 0 && (
              <div className="mt-14">
                <div className="mb-6">
                  <div
                    className="text-[11px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: t.color }}
                  >
                    Free self-directed route
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-1">
                    Trusted Voices on This Path
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Independent creators who've walked this ground. Follow their work at your own pace.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {matchedCreators.map((creator) => (
                    <CreatorCard key={creator.slug} creator={creator} accentColor={t.color} />
                  ))}
                </div>
              </div>
            )}

            {/* Kit easy button — directly below voices, only when a kit is paired to this path */}
            {matchedKit && (
              <div className="mt-10 max-w-sm">
                <KitEasyButton kit={matchedKit} />
                <div className="mt-3 text-center">
                  <Link
                    href="/kits"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    Browse all kits <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        surface="transform"
        slug={slug}
        name={`${t.from} → ${t.to}`}
        accentColor={t.color}
      />
    </div>
  );
}

export default function TransformDetailPage() {
  const [, params] = useRoute("/transform/:slug");
  const slug = params?.slug ?? "";
  return <TransformDetailContent slug={slug} />;
}
