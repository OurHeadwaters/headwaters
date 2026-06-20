export type EvidenceTier = 0 | 1 | 2 | 3 | 4;

const TIER_META: Record<
  EvidenceTier,
  { label: string; bg: string; color: string; border: string; desc: string }
> = {
  0: {
    label: "Foundational",
    bg: "#22c55e18",
    color: "#16a34a",
    border: "#22c55e40",
    desc: "Multiple high-quality RCTs or systematic reviews; broad scientific consensus",
  },
  1: {
    label: "Well Supported",
    bg: "#84cc1618",
    color: "#65a30d",
    border: "#84cc1640",
    desc: "Consistent evidence from quality observational studies or smaller RCTs",
  },
  2: {
    label: "Emerging",
    bg: "#f59e0b18",
    color: "#d97706",
    border: "#f59e0b40",
    desc: "Promising early research; not yet replicated widely; handle with care",
  },
  3: {
    label: "Weak / Contested",
    bg: "#f9731618",
    color: "#ea580c",
    border: "#f9731640",
    desc: "Conflicting results, small samples, or replication failures",
  },
  4: {
    label: "Not Yet Reliable",
    bg: "#ef444418",
    color: "#dc2626",
    border: "#ef444440",
    desc: "Preliminary, anecdotal, or unfalsifiable; use critical judgment",
  },
};

export function EvidenceTierBadge({
  tier,
  showDesc = false,
}: {
  tier: EvidenceTier;
  showDesc?: boolean;
}) {
  const meta = TIER_META[tier];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
      style={{
        background: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.border}`,
      }}
      title={showDesc ? undefined : meta.desc}
    >
      T{tier} · {meta.label}
    </span>
  );
}

export function EvidenceTierBlock({ tier }: { tier: EvidenceTier }) {
  const meta = TIER_META[tier];
  return (
    <div
      className="rounded-lg p-3 flex items-start gap-2.5"
      style={{
        background: meta.bg,
        border: `1px solid ${meta.border}`,
      }}
    >
      <EvidenceTierBadge tier={tier} />
      <p className="text-xs leading-relaxed" style={{ color: meta.color }}>
        {meta.desc}
      </p>
    </div>
  );
}
