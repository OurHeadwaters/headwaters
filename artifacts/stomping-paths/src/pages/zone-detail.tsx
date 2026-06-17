import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { useListSuiteCreators, useListSuiteKits } from "@workspace/api-client-react";
import type { SuiteCreator, SuiteKit } from "@workspace/api-client-react";
import { KIT_META, LINK_OUT_KITS } from "@/hooks/use-kits";
import { Package, ArrowRight, ExternalLink as ExternalLinkIcon } from "lucide-react";

const ZONE_ACCENT_COLORS = [
  "#E8853D",
  "#5C9E5C",
  "#C89B3C",
  "#8B6BB1",
  "#7FAF7F",
  "#5BA3C9",
];
import { useZoneResources, type ZoneExpert, type ZoneBusiness, type ZoneResourceEpisode } from "@/hooks/use-zone-resources";
import { OdysseyBridge } from "@/components/odyssey-bridge";
import { ProductShelfSection, type ReviewedProduct } from "@/components/product-shelf";
import { DebtFreedomCoachPanel } from "@/components/debt-freedom-coach";
import {
  Loader2, Headphones, Users, Building2, ExternalLink,
  ArrowLeft, ChevronRight, Play, Mic, FileText, PlaySquare, Bot, Radio, LogIn,
} from "lucide-react";

type SourceFilter = "all" | "tsp" | "ulg" | "fireside-freedom";

const ZONE_RING_COLORS = [
  "border-amber-600",
  "border-yellow-600",
  "border-lime-600",
  "border-green-700",
  "border-emerald-800",
  "border-stone-800",
];

const ZONE_BG_COLORS = [
  "bg-amber-50",
  "bg-yellow-50",
  "bg-lime-50",
  "bg-green-50",
  "bg-emerald-50",
  "bg-stone-100",
];

const ZONE_TEXT_COLORS = [
  "text-amber-700",
  "text-yellow-700",
  "text-lime-700",
  "text-green-800",
  "text-emerald-900",
  "text-stone-800",
];

const ZONE_BADGE_BG = [
  "bg-amber-100 border-amber-300 text-amber-800",
  "bg-yellow-100 border-yellow-300 text-yellow-800",
  "bg-lime-100 border-lime-300 text-lime-800",
  "bg-green-100 border-green-300 text-green-800",
  "bg-emerald-100 border-emerald-300 text-emerald-900",
  "bg-stone-200 border-stone-400 text-stone-800",
];

// Zone-to-kit mapping: which kit best anchors each zone
const ZONE_KIT_MAP: Record<string, string> = {
  "zone-0": "care-kit",
  "zone-1": "budget-kit",
  "zone-2": "family-kit",
  "zone-3": "council-kit",
  "zone-4": "producer-kit",
  "zone-5": "physical-kit",
};

function ZoneCreatorsAndKit({ zoneSlug, accentColor }: { zoneSlug: string; accentColor: string }) {
  const { data: allCreators = [] } = useListSuiteCreators();
  const { data: allKits = [] } = useListSuiteKits();

  const preferredKitSlug = ZONE_KIT_MAP[zoneSlug];
  const featuredKit: SuiteKit | null =
    allKits.find((k) => k.slug === preferredKitSlug)
    ?? allKits.find((k) => k.priceType === "direct")
    ?? allKits[0]
    ?? null;

  const kitMeta = featuredKit ? (KIT_META[featuredKit.slug] ?? { icon: "📦", color: accentColor }) : null;
  const isInquiry = featuredKit ? LINK_OUT_KITS.has(featuredKit.slug) : false;

  const zoneCreators = preferredKitSlug
    ? allCreators.filter((c) => c.kitSlugs.includes(preferredKitSlug))
    : [];
  const liveZoneCreators = zoneCreators.filter((c) => c.status === "live");
  const displayCreators: SuiteCreator[] = (liveZoneCreators.length > 0 ? liveZoneCreators : zoneCreators).slice(0, 2);

  if (!featuredKit && displayCreators.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-5">
        <div
          className="flex-1 h-px"
          style={{ background: `${accentColor}30` }}
        />
        <div
          className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border"
          style={{ color: accentColor, borderColor: `${accentColor}40`, background: `${accentColor}08` }}
        >
          Voices &amp; Easy Button
        </div>
        <div
          className="flex-1 h-px"
          style={{ background: `${accentColor}30` }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6 items-start">
        {/* Left: trusted voices */}
        {displayCreators.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Trusted voices — free &amp; self-directed
            </div>
            <div className="flex flex-col gap-3">
              {displayCreators.map((creator) => {
                const isComingSoon = creator.status === "coming-soon";
                const linkTypes: Record<string, string> = { podcast: "🎙", video: "▶", article: "📄", book: "📚" };
                const card = (
                  <div className="group flex items-start gap-3 p-3.5 rounded-xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-sm transition-all">
                    {creator.avatarUrl ? (
                      <img
                        src={creator.avatarUrl}
                        alt={creator.name}
                        className={`w-10 h-10 rounded-full object-cover shrink-0 border border-border ${isComingSoon ? "opacity-50 grayscale" : ""}`}
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-border font-bold"
                        style={{ background: `${accentColor}18`, color: accentColor }}
                      >
                        {creator.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-foreground text-sm">{creator.name}</span>
                        {isComingSoon && (
                          <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                            coming soon
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1 mb-1.5">{creator.bio}</p>
                      {creator.curatedLinks.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {creator.curatedLinks.slice(0, 2).map((link) => (
                            <span
                              key={link.url}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground"
                            >
                              {linkTypes[link.type] ?? "🔗"} {link.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {!isComingSoon && <ExternalLinkIcon className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-1" />}
                  </div>
                );

                if (!isComingSoon && creator.websiteUrl) {
                  return (
                    <a key={creator.slug} href={creator.websiteUrl} target="_blank" rel="noopener noreferrer">
                      {card}
                    </a>
                  );
                }
                return <div key={creator.slug}>{card}</div>;
              })}
            </div>
          </div>
        )}

        {/* Right: Kit easy button — always visible */}
        {featuredKit && kitMeta && (
          <div
            className="rounded-xl border p-5 flex flex-col gap-4 md:sticky md:top-8"
            style={{
              borderColor: `${kitMeta.color}44`,
              background: `linear-gradient(145deg, ${kitMeta.color}12 0%, ${kitMeta.color}05 100%)`,
            }}
          >
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: kitMeta.color }}>
                The easy button
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl leading-none">{kitMeta.icon}</span>
                <h3 className="font-serif font-bold text-base text-foreground leading-tight">{featuredKit.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{featuredKit.tagline}</p>
            </div>

            {featuredKit.priceCents && featuredKit.priceType === "direct" && (
              <div className="text-xs text-muted-foreground">
                <span className="text-foreground font-bold text-base">${(featuredKit.priceCents / 100).toFixed(0)}</span>
                <span className="ml-1">one-time</span>
              </div>
            )}
            {featuredKit.priceType !== "direct" && (
              <div className="text-xs italic text-muted-foreground">Consultative — inquiry to start</div>
            )}

            <Link
              href={`/kits/${featuredKit.slug}`}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-xs text-white transition-all hover:-translate-y-px"
              style={{ background: kitMeta.color, boxShadow: `0 4px 16px ${kitMeta.color}35` }}
            >
              <Package className="w-3.5 h-3.5" />
              {isInquiry ? "Inquire about this kit" : `Get ${featuredKit.name}`}
              <ArrowRight className="w-3 h-3" />
            </Link>

            <p className="text-[10px] text-muted-foreground text-center -mt-2">
              Ready to move faster? This kit packages the path.
            </p>

            <div className="text-center border-t border-border pt-3">
              <Link
                href="/kits"
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Browse all kits →
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function kindIcon(kind: string) {
  if (kind === "audio") return <Mic className="w-3.5 h-3.5" />;
  if (kind === "video") return <PlaySquare className="w-3.5 h-3.5" />;
  return <FileText className="w-3.5 h-3.5" />;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function EpisodeRow({ ep }: { ep: ZoneResourceEpisode }) {
  const isUlg = ep.source === "ulg";
  const isFireside = ep.source === "fireside-freedom";
  const isCouncil = ep.source.startsWith("council-");
  const isExternal = isUlg || isFireside || isCouncil;
  const href = isExternal ? ep.link : `/episodes/${ep.slug}`;

  const inner = (
    <div className="group flex items-start gap-3 py-3 px-3 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer">
      {ep.artworkUrl ? (
        <img
          src={ep.artworkUrl}
          alt=""
          className="w-12 h-12 rounded object-cover shrink-0 mt-0.5"
        />
      ) : (
        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0 mt-0.5">
          <Play className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-0.5">
          {isUlg && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-300 shrink-0 leading-none">
              ULG
            </span>
          )}
          {isFireside && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-300 shrink-0 leading-none">
              Fireside
            </span>
          )}
          {isCouncil && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-300 shrink-0 leading-none">
              Council
            </span>
          )}
          <p className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {ep.title}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span>{new Date(ep.publishedAt).getFullYear()}</span>
          {ep.durationSeconds && <span>{formatDuration(ep.durationSeconds)}</span>}
          {kindIcon(ep.kind)}
          {isExternal && <ExternalLink className="w-3 h-3" />}
        </div>
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return <Link href={href}>{inner}</Link>;
}

function scrollToDebtCoach() {
  const el = document.getElementById("debt-coach-panel");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      const btn = el.querySelector("button") as HTMLButtonElement | null;
      if (btn && !el.querySelector("[data-open='true']")) btn.click();
    }, 400);
  }
}

function ExpertCard({ expert, isZone0 }: { expert: ZoneExpert; isZone0?: boolean }) {
  const hasUrl = !!expert.url;
  const isRamsey = expert.id === "dave-ramsey";

  const cardInner = (
    <div className={`flex flex-col gap-2 p-5 rounded-xl border border-border bg-card transition-all ${hasUrl && !isRamsey ? "hover:shadow-md hover:border-primary/30 group" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`font-semibold text-foreground ${hasUrl && !isRamsey ? "group-hover:text-primary transition-colors" : ""}`}>
            {expert.name}
          </p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">{expert.role}</p>
        </div>
        {hasUrl ? (
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-primary/60 transition-colors" />
        ) : (
          <span className="text-[10px] font-semibold text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full shrink-0">
            site coming soon
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
        {expert.description}
      </p>
      {isRamsey && isZone0 && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollToDebtCoach(); }}
          className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors"
        >
          <Bot className="w-3.5 h-3.5" />
          Chat with the Debt Coach →
        </button>
      )}
    </div>
  );

  if (hasUrl && !isRamsey) {
    return (
      <a href={expert.url} target="_blank" rel="noopener noreferrer">
        {cardInner}
      </a>
    );
  }

  return <div>{cardInner}</div>;
}

function BusinessCard({ biz }: { biz: ZoneBusiness }) {
  const hasUrl = !!biz.url;

  const cardInner = (
    <div className={`flex flex-col gap-2 p-5 rounded-xl border border-border bg-card transition-all ${hasUrl ? "hover:shadow-md hover:border-primary/30 group" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`font-semibold text-foreground ${hasUrl ? "group-hover:text-primary transition-colors" : ""}`}>
            {biz.name}
          </p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5 italic">{biz.tagline}</p>
        </div>
        {hasUrl ? (
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-primary/60 transition-colors" />
        ) : (
          <span className="text-[10px] font-semibold text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full shrink-0">
            site coming soon
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
        {biz.description}
      </p>
    </div>
  );

  if (hasUrl) {
    return (
      <a href={biz.url} target="_blank" rel="noopener noreferrer">
        {cardInner}
      </a>
    );
  }

  return <div>{cardInner}</div>;
}

function ShelfHeader({
  icon,
  title,
  count,
  zoneColor,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  zoneColor: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
        style={{ background: `${zoneColor}20`, color: zoneColor }}
      >
        {icon}
      </div>
      <h2 className="font-serif text-xl font-bold text-foreground">{title}</h2>
      {count > 0 && (
        <span className="ml-auto text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          {count.toLocaleString()}
        </span>
      )}
    </div>
  );
}

/* ── Field Notes shelf ───────────────────────────────────────────────────── */

type FieldNote = {
  id: number;
  sourceType: string;
  rawContent: string;
  metaTitle?: string | null;
  tags: string[];
  createdAt: string;
  metaUrl?: string | null;
  metaImageUrl?: string | null;
};

function FieldNoteCard({ note }: { note: FieldNote }) {
  const [expanded, setExpanded] = useState(false);
  const isYouTube = note.sourceType === "youtube";
  const isLong = note.rawContent.length > 280;
  const preview =
    isLong && !expanded ? note.rawContent.slice(0, 280) + "…" : note.rawContent;

  const dateStr = (() => {
    try {
      return new Date(note.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  })();

  const badge = isYouTube ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300/50">
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5V8.5l6.25 3.5-6.25 3.5z" />
      </svg>
      YouTube
    </span>
  ) : note.sourceType === "nostr" ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300/50">
      <Radio className="w-2.5 h-2.5" />
      Nostr
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300/50">
      <Mic className="w-2.5 h-2.5" />
      Audio Memo
    </span>
  );

  const cardContent = (
    <div className={`p-5 rounded-xl border border-border bg-card flex flex-col gap-2 ${isYouTube && note.metaUrl ? "hover:shadow-md transition-shadow" : ""}`}>
      {isYouTube && note.metaImageUrl && (
        <img
          src={note.metaImageUrl}
          alt=""
          className="w-full aspect-video object-cover rounded-lg border border-border/50"
        />
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {badge}
        {dateStr && (
          <span className="text-xs text-muted-foreground">{dateStr}</span>
        )}
        {isYouTube && note.metaUrl && (
          <span className="ml-auto text-xs font-semibold text-red-600 dark:text-red-400">
            Watch on YouTube →
          </span>
        )}
      </div>
      {isYouTube && note.metaTitle && (
        <p className="text-sm font-semibold text-foreground leading-snug">
          {note.metaTitle}
        </p>
      )}
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {preview}
      </p>
      {isLong && !isYouTube && (
        <button
          onClick={(e) => { e.preventDefault(); setExpanded((v) => !v); }}
          className="self-start text-xs font-semibold text-primary hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );

  if (isYouTube && note.metaUrl) {
    return (
      <a href={note.metaUrl} target="_blank" rel="noopener noreferrer">
        {cardContent}
      </a>
    );
  }

  return <div>{cardContent}</div>;
}

type FieldNoteSource = "all" | "nostr" | "audio" | "youtube";

function FieldNotesShelf({
  zoneSlug,
  zoneName,
  zoneColor,
}: {
  zoneSlug: string;
  zoneName: string;
  zoneColor: string;
}) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [sourceFilter, setSourceFilter] = useState<FieldNoteSource>("all");

  const { data: allNotes = [] } = useQuery<FieldNote[]>({
    queryKey: ["field-notes-zone", zoneSlug],
    queryFn: async () => {
      const res = await fetch(
        `${base}/api/field-notes?zone=${encodeURIComponent(zoneSlug)}`,
      );
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!zoneSlug,
  });

  const { data: filteredNotes = [] } = useQuery<FieldNote[]>({
    queryKey: ["field-notes-zone", zoneSlug, sourceFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ zone: zoneSlug });
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      const res = await fetch(`${base}/api/field-notes?${params}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!zoneSlug && sourceFilter !== "all",
  });

  const notes = sourceFilter === "all" ? allNotes : filteredNotes;

  if (allNotes.length === 0) return null;

  const SOURCE_FILTERS: { value: FieldNoteSource; label: string }[] = [
    { value: "all", label: "All" },
    { value: "nostr", label: "Nostr" },
    { value: "audio", label: "Audio" },
    { value: "youtube", label: "YouTube" },
  ];

  return (
    <section>
      <ShelfHeader
        icon={<Radio className="w-4 h-4" />}
        title="Field Notes"
        count={allNotes.length}
        zoneColor={zoneColor}
      />
      <p className="text-sm text-muted-foreground mb-4 ml-11">
        Nostr notes and audio memos from the field, tagged for{" "}
        {zoneName.toLowerCase()}.
      </p>
      <div className="flex items-center gap-1.5 ml-11 mb-5">
        {SOURCE_FILTERS.map((f) => {
          const active = sourceFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setSourceFilter(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                active
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No {sourceFilter} notes found for this zone yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {notes.map((note) => (
            <FieldNoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </section>
  );
}

function TeaserEpisodeRow({ ep, onLogin }: { ep: ZoneResourceEpisode; onLogin: () => void }) {
  return (
    <button
      onClick={onLogin}
      className="group w-full flex items-start gap-3 py-3 px-3 rounded-lg hover:bg-muted/60 transition-colors text-left"
    >
      {ep.artworkUrl ? (
        <img
          src={ep.artworkUrl}
          alt=""
          className="w-12 h-12 rounded object-cover shrink-0 mt-0.5"
        />
      ) : (
        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0 mt-0.5">
          <Play className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {ep.title}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span>{new Date(ep.publishedAt).getFullYear()}</span>
          {ep.durationSeconds && <span>{formatDuration(ep.durationSeconds)}</span>}
          {kindIcon(ep.kind)}
        </div>
      </div>
    </button>
  );
}

function ZoneTeaserPage({
  data,
  onLogin,
}: {
  data: import("@/hooks/use-zone-resources").ZoneResources;
  onLogin: () => void;
}) {
  const { zone, episodes, episodeTotal, experts } = data;
  const idx = zone.number;
  const ringColor = ZONE_RING_COLORS[idx] ?? "border-primary";
  const bgColor = ZONE_BG_COLORS[idx] ?? "bg-muted";
  const textColor = ZONE_TEXT_COLORS[idx] ?? "text-foreground";
  const badgeColor = ZONE_BADGE_BG[idx] ?? "bg-muted border-border text-foreground";
  const accentColor = ZONE_ACCENT_COLORS[idx] ?? "#D9A066";

  const sampleEpisodes = (episodes.filter((ep) => ep.source === "tsp").length >= 3
    ? episodes.filter((ep) => ep.source === "tsp")
    : episodes
  ).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className={`border-b border-border ${bgColor}`} style={{ borderTop: `4px solid ${accentColor}` }}>
        <div className="max-w-5xl mx-auto px-6 py-12">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <Link href="/zones" className="hover:text-foreground transition-colors">Zones</Link>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span className="text-foreground font-semibold truncate max-w-[160px]">{zone.name}</span>
          </nav>

          <div className="flex items-start gap-5">
            <div
              className={`shrink-0 w-16 h-16 rounded-2xl border-2 ${ringColor} ${bgColor} flex flex-col items-center justify-center`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-widest ${textColor} opacity-60`}>
                Zone
              </span>
              <span className={`text-2xl font-serif font-bold ${textColor}`}>{zone.number}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badgeColor}`}>
                  Zone {zone.number}
                </span>
                {episodeTotal > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {episodeTotal.toLocaleString()} episodes
                  </span>
                )}
                {experts.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    · {experts.length} expert{experts.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <h1 className={`font-serif text-3xl md:text-4xl font-bold ${textColor} mb-2`}>
                {zone.name}
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
                {zone.description}
              </p>
              <blockquote className="mt-3 border-l-2 border-primary/30 pl-3 text-sm italic text-muted-foreground max-w-xl">
                {zone.philosophy}
              </blockquote>
            </div>
          </div>
        </div>
      </div>

      {/* Login CTA banner */}
      <div className="border-b border-border bg-amber-50 dark:bg-amber-950/20">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm">
              Log in to track your progress and explore all {episodeTotal.toLocaleString()} episodes
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Free account — save where you are, build your personal path through the archive.
            </p>
          </div>
          <button
            onClick={onLogin}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            Log in
          </button>
        </div>
      </div>

      {/* Teaser content */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-14">

        {/* Sample episodes */}
        {sampleEpisodes.length > 0 && (
          <section>
            <ShelfHeader
              icon={<Headphones className="w-4 h-4" />}
              title="Sample Episodes"
              count={episodeTotal}
              zoneColor={zone.color}
            />
            <p className="text-sm text-muted-foreground mb-4 ml-11">
              A taste of what's in this zone.{" "}
              <button onClick={onLogin} className="font-semibold text-primary hover:underline">
                Log in to browse all {episodeTotal.toLocaleString()} episodes →
              </button>
            </p>
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
              {sampleEpisodes.map((ep) => (
                <TeaserEpisodeRow key={ep.id} ep={ep} onLogin={onLogin} />
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              <button onClick={onLogin} className="font-semibold text-primary hover:underline">
                Log in to see all {episodeTotal.toLocaleString()} episodes in this zone
              </button>
            </p>
          </section>
        )}

        {/* Expert teasers */}
        {experts.length > 0 && (
          <section>
            <ShelfHeader
              icon={<Users className="w-4 h-4" />}
              title="Learn From"
              count={experts.length}
              zoneColor={zone.color}
            />
            <p className="text-sm text-muted-foreground mb-5 ml-11">
              Expert Council members whose work lives in {zone.name.toLowerCase()}.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {experts.slice(0, 4).map((expert) => (
                <ExpertCard key={expert.id} expert={expert} />
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <div className="rounded-2xl border border-border bg-card p-8 flex flex-col items-center text-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl border-2 ${ringColor} ${bgColor} flex flex-col items-center justify-center`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-widest ${textColor} opacity-60`}>
              Zone
            </span>
            <span className={`text-xl font-serif font-bold ${textColor}`}>{zone.number}</span>
          </div>
          <div>
            <p className="font-serif font-bold text-xl text-foreground mb-1">
              Ready to explore {zone.name}?
            </p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Log in to track your progress, browse all episodes, and build your personal path through the archive.
            </p>
          </div>
          <button
            onClick={onLogin}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Log in to track your progress
          </button>
        </div>

      </div>
    </div>
  );
}

export default function ZoneDetailPage() {
  const [, params] = useRoute("/zones/:slug");
  const slug = params?.slug ?? "";
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>(() => {
    try {
      const stored = localStorage.getItem("tsp_zone_source_filter");
      if (stored === "tsp" || stored === "ulg" || stored === "fireside-freedom") return stored;
    } catch {
    }
    return "all";
  });
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();

  useEffect(() => {
    try {
      localStorage.setItem("tsp_zone_source_filter", sourceFilter);
    } catch {
    }
  }, [sourceFilter]);

  const apiSource = sourceFilter === "all" ? undefined : sourceFilter;
  const { data, isLoading, isError } = useZoneResources(slug, apiSource);

  const zoneName = data?.zone ? `Zone ${data.zone.number}: ${data.zone.name}` : null;

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const { data: gearProducts = [] } = useQuery<ReviewedProduct[]>({
    queryKey: ["gear-zone", slug],
    queryFn: async () => {
      const res = await fetch(`${base}/api/gear?zone=${encodeURIComponent(slug)}&limit=6`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!slug,
  });

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading zone resources…</span>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Could not load this zone. Try refreshing.</p>
        <Link href="/zones" className="text-sm font-semibold text-primary hover:underline">
          ← Back to all zones
        </Link>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <ZoneTeaserPage data={data} onLogin={login} />;
  }

  const { zone, episodes, episodeTotal, experts, businesses, councilEpisodes = [] } = data;

  const idx = zone.number;
  const ringColor = ZONE_RING_COLORS[idx] ?? "border-primary";
  const bgColor = ZONE_BG_COLORS[idx] ?? "bg-muted";
  const textColor = ZONE_TEXT_COLORS[idx] ?? "text-foreground";
  const badgeColor = ZONE_BADGE_BG[idx] ?? "bg-muted border-border text-foreground";
  const accentColor = ZONE_ACCENT_COLORS[idx] ?? "#D9A066";

  const isZone0 = zone.slug === "zone-0";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className={`border-b border-border ${bgColor}`} style={{ borderTop: `4px solid ${accentColor}` }}>
        <div className="max-w-5xl mx-auto px-6 py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <Link href="/zones" className="hover:text-foreground transition-colors">Zones</Link>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span className="text-foreground font-semibold truncate max-w-[160px]">{zone.name}</span>
          </nav>

          <div className="flex items-start gap-5">
            {/* Zone number badge */}
            <div
              className={`shrink-0 w-16 h-16 rounded-2xl border-2 ${ringColor} ${bgColor} flex flex-col items-center justify-center`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-widest ${textColor} opacity-60`}>
                Zone
              </span>
              <span className={`text-2xl font-serif font-bold ${textColor}`}>{zone.number}</span>
            </div>

            <div className="flex-1 min-w-0">
              {/* Resource count pills */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badgeColor}`}>
                  Zone {zone.number}
                </span>
                {episodeTotal > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {episodeTotal.toLocaleString()} episodes
                  </span>
                )}
                {experts.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    · {experts.length} expert{experts.length !== 1 ? "s" : ""}
                  </span>
                )}
                {businesses.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    · {businesses.length} business{businesses.length !== 1 ? "es" : ""}
                  </span>
                )}
              </div>

              <h1 className={`font-serif text-3xl md:text-4xl font-bold ${textColor} mb-2`}>
                {zone.name}
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
                {zone.description}
              </p>
              <blockquote className="mt-3 border-l-2 border-primary/30 pl-3 text-sm italic text-muted-foreground max-w-xl">
                {zone.philosophy}
              </blockquote>
            </div>
          </div>
        </div>
      </div>

      {/* Three shelves */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-14">

        {/* Shelf 1: Listen */}
        <section>
          <ShelfHeader
            icon={<Headphones className="w-4 h-4" />}
            title="Listen"
            count={episodeTotal}
            zoneColor={zone.color}
          />
          <p className="text-sm text-muted-foreground mb-4 ml-11">
            TSP, Unloose the Goose, and Fireside Freedom episodes relevant to {zone.name.toLowerCase()}.
          </p>

          {/* Source filter tabs */}
          <div className="flex items-center gap-1.5 ml-11 mb-5 flex-wrap">
            {(["all", "tsp", "ulg", "fireside-freedom"] as SourceFilter[]).map((f) => {
              const label =
                f === "all" ? "All" :
                f === "tsp" ? "TSP Only" :
                f === "ulg" ? "ULG Only" :
                "Fireside Freedom";
              const active = sourceFilter === f;
              return (
                <button
                  key={f}
                  onClick={() => setSourceFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {episodes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No {sourceFilter === "tsp" ? "TSP" : sourceFilter === "ulg" ? "ULG" : sourceFilter === "fireside-freedom" ? "Fireside Freedom" : ""} episodes found for this zone yet.
            </p>
          ) : (
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
              {episodes.map((ep) => (
                <EpisodeRow key={ep.id} ep={ep} />
              ))}
            </div>
          )}

          {episodeTotal > episodes.length && (
            <div className="mt-4 text-center">
              <Link
                href={`/zones/${zone.slug}/episodes${sourceFilter !== "all" ? `?source=${sourceFilter}` : ""}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Browse all {episodeTotal.toLocaleString()} episodes for this zone
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>

        {/* Shelf 2: Learn from (Expert Council) */}
        <section>
          <ShelfHeader
            icon={<Users className="w-4 h-4" />}
            title="Learn From"
            count={experts.length}
            zoneColor={zone.color}
          />
          <p className="text-sm text-muted-foreground mb-5 ml-11">
            Expert Council members whose work lives in {zone.name.toLowerCase()}.
          </p>

          {experts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No Expert Council members tagged for this zone yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {experts.map((expert) => (
                <ExpertCard key={expert.id} expert={expert} isZone0={isZone0} />
              ))}
            </div>
          )}
        </section>

        {/* Member Episodes (Council feed) */}
        {councilEpisodes.length > 0 && (
          <section>
            <ShelfHeader
              icon={<Radio className="w-4 h-4" />}
              title="Member Episodes"
              count={councilEpisodes.length}
              zoneColor={zone.color}
            />
            <p className="text-sm text-muted-foreground mb-5 ml-11">
              Episodes from Expert Council members covering {zone.name.toLowerCase()} topics.
            </p>
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
              {councilEpisodes.map((ep) => (
                <EpisodeRow key={ep.id} ep={ep} />
              ))}
            </div>
          </section>
        )}

        {/* Debt Freedom Coach — Zone 0 only */}
        {isZone0 && (
          <section>
            <ShelfHeader
              icon={<Bot className="w-4 h-4" />}
              title="Debt Freedom Coach"
              count={0}
              zoneColor={zone.color}
            />
            <p className="text-sm text-muted-foreground mb-5 ml-11">
              An AI coach powered by Dave Ramsey's 7 Baby Steps — debt payoff, zero-based budgeting, and financial peace.
            </p>
            <DebtFreedomCoachPanel id="debt-coach-panel" />
          </section>
        )}

        {/* Shelf 3: Businesses */}
        {businesses.length > 0 && (
          <section>
            <ShelfHeader
              icon={<Building2 className="w-4 h-4" />}
              title="Businesses in This Zone"
              count={businesses.length}
              zoneColor={zone.color}
            />
            <p className="text-sm text-muted-foreground mb-5 ml-11">
              ULG-affiliated companies operating in {zone.name.toLowerCase()}.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {businesses.map((biz) => (
                <BusinessCard key={biz.id} biz={biz} />
              ))}
            </div>
          </section>
        )}

        {/* Shelf 4: Field Notes */}
        <FieldNotesShelf zoneSlug={zone.slug} zoneName={zone.name} zoneColor={zone.color} />

        {/* Gear shelf */}
        {gearProducts.length > 0 && (
          <ProductShelfSection
            products={gearProducts}
            heading="Tools you may need"
            subheading={`Products Jack has reviewed for ${zone.name.toLowerCase()} — links go directly to his site.`}
            zoneColor={zone.color}
          />
        )}

        {/* Parr's Jars featured callout — Zone 2 only */}
        {zone.slug === "zone-2" && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <div className="flex-1 h-px" style={{ background: `${accentColor}30` }} />
              <div
                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border"
                style={{ color: accentColor, borderColor: `${accentColor}40`, background: `${accentColor}08` }}
              >
                Featured Course
              </div>
              <div className="flex-1 h-px" style={{ background: `${accentColor}30` }} />
            </div>
            <div
              className="rounded-xl border p-6 flex flex-col sm:flex-row gap-5 items-start"
              style={{
                borderColor: `${accentColor}44`,
                background: `linear-gradient(135deg, ${accentColor}10 0%, ${accentColor}04 100%)`,
              }}
            >
              <div className="text-4xl leading-none shrink-0">🫙</div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[10px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: accentColor }}
                >
                  Highest-conviction buy for Zone 2
                </div>
                <h3 className="font-serif text-xl font-bold text-foreground mb-2 leading-snug">
                  Parr's Jars — Food Preservation Course
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Ten sessions on canning, fermenting, and stocking a real northern pantry — taught from Bobbie Parr's kitchen in Dryden, Ontario. Practitioner-grade food preservation skills, no fluff. This is the first course to buy if your Zone 2 work is serious.
                </p>
                <Link
                  href="/kits/parrs-jars"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm text-white transition-all hover:-translate-y-px"
                  style={{ background: accentColor, boxShadow: `0 4px 16px ${accentColor}35` }}
                >
                  <Package className="w-4 h-4" />
                  View the Course
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Voices + Kit — creators and easy button for this zone */}
        <ZoneCreatorsAndKit zoneSlug={zone.slug} accentColor={accentColor} />

        {/* Headwaters Odyssey CTA */}
        <OdysseyBridge variant="full" />
      </div>
    </div>
  );
}
