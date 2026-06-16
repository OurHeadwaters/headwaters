import { Link } from "wouter";
import { ChevronRight, ExternalLink } from "lucide-react";
import type { KitSummary } from "@/hooks/use-kits";
import { KIT_META, LINK_OUT_KITS } from "@/hooks/use-kits";

interface KitCardProps {
  kit: KitSummary;
  shareCount?: number;
}

export function KitCard({ kit, shareCount = 0 }: KitCardProps) {
  const meta = KIT_META[kit.slug] ?? { icon: "📦", color: "#6B7280" };
  const isLinkOut = LINK_OUT_KITS.has(kit.slug);
  const isPopular = shareCount > 3;

  return (
    <Link
      href={`/kits/${kit.slug}`}
      className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30 transition-all duration-200"
    >
      <div
        className="px-6 py-5 flex items-start justify-between gap-4"
        style={{
          backgroundColor: meta.color + "18",
          borderBottom: `1px solid ${meta.color}22`,
        }}
      >
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
            style={{ color: meta.color }}
          >
            {isLinkOut ? "Preview + External Link" : "TSP Content Kit"}
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none">{meta.icon}</span>
            <h2 className="font-serif text-xl font-bold text-foreground group-hover:text-primary transition-colors">
              {kit.name}
            </h2>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {isPopular && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "#D9A06618", color: "#D9A066", border: "1px solid #D9A06633" }}
            >
              🔥 {shareCount} shares
            </span>
          )}
          {isLinkOut && (
            <ExternalLink
              className="w-4 h-4 opacity-40 group-hover:opacity-70 transition-opacity"
              style={{ color: meta.color }}
            />
          )}
        </div>
      </div>

      <div className="px-6 py-5 flex flex-col flex-1">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: meta.color }}
        >
          {kit.tagline}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
          {kit.description}
        </p>

        {kit.externalLinks.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {kit.externalLinks.map((link) => (
              <span
                key={link.url}
                className="text-[11px] font-medium px-2 py-0.5 rounded-full border"
                style={{
                  color: meta.color + "cc",
                  borderColor: meta.color + "44",
                  background: meta.color + "10",
                }}
              >
                {link.label}
              </span>
            ))}
          </div>
        )}

        <div
          className="flex items-center gap-1.5 text-sm font-semibold transition-colors mt-auto"
          style={{ color: meta.color + "aa" }}
        >
          <span className="group-hover:text-primary transition-colors">
            Enter Kit
          </span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform group-hover:text-primary" />
        </div>
      </div>
    </Link>
  );
}
