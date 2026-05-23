import { useState, useEffect, useCallback, useRef } from "react";
import { useGetHeadwatersBusinessSection, usePatchHeadwatersBusinessSection } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rss, Plus, Trash2, Leaf, TrendingUp, Zap, BookOpen, ShoppingBag, Link2, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type StreamType = "content" | "course" | "product" | "affiliate" | "other";

interface OnlineEngineRow {
  id: string;
  name: string;
  monthlyLow: number;
  monthlyHigh: number;
  streamType: StreamType;
  lifestyleOverlap: boolean;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function fmt(n: number) {
  if (!n) return "—";
  return "$" + Math.round(n).toLocaleString();
}

const STREAM_FILL: Record<StreamType, string> = {
  content:   "#0891b2",
  course:    "#7c3aed",
  product:   "#ea580c",
  affiliate: "#16a34a",
  other:     "#94a3b8",
};

interface DonutSegment {
  type: StreamType;
  value: number;
  label: string;
  low: number;
  high: number;
  pct: number;
}

interface TooltipState {
  segment: DonutSegment;
  x: number;
  y: number;
}

function DonutChart({ segments }: { segments: DonutSegment[] }) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  const R = 42;
  const r = 26;
  const cx = 52;
  const cy = 52;
  const gap = 0.03;

  let startAngle = -Math.PI / 2;
  const paths: { d: string; fill: string; segment: DonutSegment }[] = [];

  for (const seg of segments) {
    const fraction = seg.value / total;
    const angle = fraction * 2 * Math.PI - gap;
    const endAngle = startAngle + angle;
    const largeArc = angle > Math.PI ? 1 : 0;

    const x1 = cx + R * Math.cos(startAngle + gap / 2);
    const y1 = cy + R * Math.sin(startAngle + gap / 2);
    const x2 = cx + R * Math.cos(endAngle);
    const y2 = cy + R * Math.sin(endAngle);
    const x3 = cx + r * Math.cos(endAngle);
    const y3 = cy + r * Math.sin(endAngle);
    const x4 = cx + r * Math.cos(startAngle + gap / 2);
    const y4 = cy + r * Math.sin(startAngle + gap / 2);

    paths.push({
      d: `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${largeArc} 0 ${x4} ${y4} Z`,
      fill: STREAM_FILL[seg.type],
      segment: seg,
    });

    startAngle = endAngle + gap;
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>, seg: DonutSegment) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip({ segment: seg, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <svg
        viewBox="0 0 104 104"
        className="w-20 h-20"
        onMouseLeave={() => setTooltip(null)}
      >
        {paths.map((p) => (
          <path
            key={p.segment.type}
            d={p.d}
            fill={p.fill}
            opacity={tooltip?.segment.type === p.segment.type ? "1" : "0.85"}
            className="cursor-pointer transition-opacity"
            onMouseEnter={(e) => handleMouseMove(e, p.segment)}
            onMouseMove={(e) => handleMouseMove(e, p.segment)}
          />
        ))}
      </svg>
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 rounded-md border border-border bg-popover px-3 py-2 shadow-md text-xs"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 8,
            transform: tooltip.x > 60 ? "translateX(-110%)" : undefined,
          }}
        >
          <p className="font-semibold text-foreground mb-0.5" style={{ color: STREAM_FILL[tooltip.segment.type] }}>
            {tooltip.segment.label}
          </p>
          <p className="text-muted-foreground tabular-nums">
            {fmt(tooltip.segment.low)}
            {tooltip.segment.high !== tooltip.segment.low && <> – {fmt(tooltip.segment.high)}</>}
            <span className="ml-1">/ mo</span>
          </p>
          <p className="text-muted-foreground tabular-nums">{tooltip.segment.pct}% of total</p>
        </div>
      )}
    </div>
  );
}

const STREAM_OPTIONS: { value: StreamType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "content",   label: "Content",   icon: <Rss size={11} />,          color: "text-cyan-600 dark:text-cyan-400" },
  { value: "course",    label: "Course",    icon: <BookOpen size={11} />,      color: "text-violet-600 dark:text-violet-400" },
  { value: "product",   label: "Product",   icon: <ShoppingBag size={11} />,   color: "text-orange-600 dark:text-orange-400" },
  { value: "affiliate", label: "Affiliate", icon: <Link2 size={11} />,         color: "text-green-600 dark:text-green-400" },
  { value: "other",     label: "Other",     icon: <MoreHorizontal size={11} />, color: "text-muted-foreground" },
];

function streamMeta(type: StreamType) {
  return STREAM_OPTIONS.find((o) => o.value === type) ?? STREAM_OPTIONS[4];
}

export default function OnlineEngine() {
  const { toast } = useToast();

  const { data, isLoading, error } = useGetHeadwatersBusinessSection("online-engine");
  const patch = usePatchHeadwatersBusinessSection();

  const [rows, setRows] = useState<OnlineEngineRow[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (data && !initialized.current) {
      const loaded = Array.isArray(data.value) ? (data.value as OnlineEngineRow[]) : [];
      setRows(loaded.map((r) => ({
        streamType: "content" as StreamType,
        lifestyleOverlap: false,
        ...r,
      })));
      initialized.current = true;
    }
  }, [data]);

  const persist = useCallback(
    (next: OnlineEngineRow[]) => {
      patch.mutate(
        { section: "online-engine", data: { value: next } },
        { onError: () => toast({ title: "Save failed", variant: "destructive" }) }
      );
    },
    [patch]
  );

  const updateAndSave = (next: OnlineEngineRow[]) => {
    setRows(next);
    persist(next);
  };

  const addRow = () =>
    updateAndSave([
      ...rows,
      { id: genId(), name: "", monthlyLow: 0, monthlyHigh: 0, streamType: "content", lifestyleOverlap: false },
    ]);

  const removeRow = (id: string) => updateAndSave(rows.filter((r) => r.id !== id));

  const updateTextField = (id: string, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, name: value } : r)));
  };

  const updateNumField = (id: string, field: "monthlyLow" | "monthlyHigh", raw: string) => {
    const value = parseFloat(raw) || 0;
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const updateStreamType = (id: string, value: StreamType) => {
    const next = rows.map((r) => (r.id === id ? { ...r, streamType: value } : r));
    updateAndSave(next);
  };

  const toggleLifestyle = (id: string) => {
    const next = rows.map((r) => (r.id === id ? { ...r, lifestyleOverlap: !r.lifestyleOverlap } : r));
    updateAndSave(next);
  };

  const saveOnBlur = () => persist(rows);

  const totalLow = rows.reduce((s, r) => s + (r.monthlyLow || 0), 0);
  const totalHigh = rows.reduce((s, r) => s + (r.monthlyHigh || 0), 0);

  const lifestyleLow = rows.filter((r) => r.lifestyleOverlap).reduce((s, r) => s + (r.monthlyLow || 0), 0);
  const lifestyleHigh = rows.filter((r) => r.lifestyleOverlap).reduce((s, r) => s + (r.monthlyHigh || 0), 0);
  const lifestylePct = totalHigh > 0 ? Math.round((lifestyleHigh / totalHigh) * 100) : 0;

  const [streamFilter, setStreamFilter] = useState<StreamType | null>(null);
  const visibleRows = streamFilter === null ? rows : rows.filter((r) => r.streamType === streamFilter);

  const presentStreamTypes = Array.from(new Set(rows.map((r) => r.streamType))) as StreamType[];

  const streamBreakdown = (["content", "course", "product", "affiliate", "other"] as StreamType[])
    .map((type) => {
      const matched = rows.filter((r) => r.streamType === type);
      const low = matched.reduce((s, r) => s + (r.monthlyLow || 0), 0);
      const high = matched.reduce((s, r) => s + (r.monthlyHigh || 0), 0);
      return { type, low, high, count: matched.length };
    })
    .filter((b) => b.count > 0);

  const hasRows = rows.length > 0;

  if (isLoading)
    return <div className="p-8 text-center text-muted-foreground">Loading online engine...</div>;
  if (error)
    return <div className="p-8 text-center text-destructive">Failed to load online engine data.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold text-foreground flex items-center gap-3">
            <Rss className="text-cyan-600 dark:text-cyan-400" size={32} />
            Online Engine Capacity
          </h1>
          <p className="text-muted-foreground mt-2">
            Zone 1 &amp; 5 income — streams built around lifestyle activities you'd pursue regardless: podcast, preparedness content, courses, digital products. Income that compounds while you live.
          </p>
        </div>
        <Button onClick={addRow} className="gap-2 shrink-0">
          <Plus size={16} />
          Add Stream
        </Button>
      </div>

      {/* Summary cards */}
      {hasRows && (
        <div className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="border-cyan-200/60 bg-cyan-50/50 dark:bg-cyan-950/20 dark:border-cyan-800/40">
              <CardContent className="p-5 flex items-start gap-3">
                <TrendingUp size={20} className="text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 mb-1">Total capacity</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    {fmt(totalLow)}{totalHigh !== totalLow && <> – {fmt(totalHigh)}</>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">per month</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200/60 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800/40">
              <CardContent className="p-5 flex items-start gap-3">
                <Leaf size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">Lifestyle-aligned</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    {fmt(lifestyleLow)}{lifestyleHigh !== lifestyleLow && <> – {fmt(lifestyleHigh)}</>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">per month</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-5 flex items-start gap-3">
                <Zap size={20} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Lifestyle share</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">{lifestylePct}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">of total high estimate</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stream type breakdown */}
          {streamBreakdown.length > 0 && (
            <Card className="border-cyan-200/40 bg-cyan-50/30 dark:bg-cyan-950/10 dark:border-cyan-800/30">
              <CardContent className="p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 mb-3 flex items-center gap-1.5">
                  <Rss size={12} />
                  Breakdown by stream type
                </p>
                <div className="flex items-center gap-5 flex-wrap sm:flex-nowrap">
                  <DonutChart
                    segments={streamBreakdown.map(({ type, low, high }) => {
                      const donutTotal = streamBreakdown.reduce((s, b) => s + b.high, 0);
                      const pct = donutTotal > 0 ? Math.round((high / donutTotal) * 100) : 0;
                      return { type, value: high, label: streamMeta(type).label, low, high, pct };
                    })}
                  />
                  <div className="flex flex-col gap-2 min-w-0">
                    {streamBreakdown.map(({ type, low, high }) => {
                      const meta = streamMeta(type);
                      const donutTotal = streamBreakdown.reduce((s, b) => s + b.high, 0);
                      const pct = donutTotal > 0 ? Math.round((high / donutTotal) * 100) : 0;
                      return (
                        <div key={type} className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: STREAM_FILL[type] }}
                          />
                          <span className={`text-xs font-semibold ${meta.color} flex items-center gap-1`}>
                            {meta.icon}
                            {meta.label}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-sm font-bold text-foreground tabular-nums">
                            {fmt(low)}{high !== low && <> – {fmt(high)}</>}
                          </span>
                          <span className="text-xs text-muted-foreground">/ mo</span>
                          <span className="text-xs text-muted-foreground ml-auto pl-2 tabular-nums">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stream type filter chips */}
      {hasRows && presentStreamTypes.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filter:</span>
          {presentStreamTypes.map((type) => {
            const meta = streamMeta(type);
            const isActive = streamFilter === type;
            return (
              <button
                key={type}
                onClick={() => setStreamFilter(isActive ? null : type)}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  isActive
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                {meta.icon}
                {meta.label}
              </button>
            );
          })}
          {streamFilter !== null && (
            <button
              onClick={() => setStreamFilter(null)}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stream Name</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Monthly Low</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Monthly High</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Stream Type</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  <span className="flex items-center justify-center gap-1.5">
                    <Leaf size={13} />
                    Lifestyle?
                  </span>
                </th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground italic">
                    No streams yet. Hit "Add Stream" to start building your online engine.
                  </td>
                </tr>
              )}
              {rows.length > 0 && visibleRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground italic">
                    No rows match this filter.
                  </td>
                </tr>
              )}
              {visibleRows.map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-3 py-2">
                    <Input
                      value={r.name}
                      onChange={(e) => updateTextField(r.id, e.target.value)}
                      onBlur={saveOnBlur}
                      placeholder="Stream name..."
                      className="bg-transparent border-0 shadow-none px-1 font-medium h-9 focus-visible:ring-0 focus-visible:bg-card"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      value={r.monthlyLow || ""}
                      onChange={(e) => updateNumField(r.id, "monthlyLow", e.target.value)}
                      onBlur={saveOnBlur}
                      placeholder="0"
                      className="bg-transparent border-0 shadow-none px-1 text-right h-9 focus-visible:ring-0 focus-visible:bg-card w-28 ml-auto"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      value={r.monthlyHigh || ""}
                      onChange={(e) => updateNumField(r.id, "monthlyHigh", e.target.value)}
                      onBlur={saveOnBlur}
                      placeholder="0"
                      className="bg-transparent border-0 shadow-none px-1 text-right h-9 focus-visible:ring-0 focus-visible:bg-card w-28 ml-auto"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Select value={r.streamType} onValueChange={(v) => updateStreamType(r.id, v as StreamType)}>
                      <SelectTrigger className="h-9 border-0 bg-transparent shadow-none focus:ring-0 w-36 px-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STREAM_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className={`flex items-center gap-1.5 ${opt.color}`}>
                              {opt.icon}
                              {opt.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => toggleLifestyle(r.id)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                        r.lifestyleOverlap
                          ? "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300"
                          : "bg-secondary border-border text-muted-foreground hover:border-foreground/30"
                      }`}
                      title={r.lifestyleOverlap ? "Lifestyle-aligned — click to toggle" : "Not lifestyle-aligned — click to toggle"}
                    >
                      <Leaf size={11} />
                      {r.lifestyleOverlap ? "Yes" : "No"}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => removeRow(r.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      title="Remove stream"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {hasRows && (
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <span className="text-sm text-muted-foreground">
            {rows.length} stream{rows.length !== 1 ? "s" : ""}
            {rows.filter((r) => r.lifestyleOverlap).length > 0 && (
              <> · {rows.filter((r) => r.lifestyleOverlap).length} lifestyle-aligned</>
            )}
          </span>
          <span className="text-sm font-bold text-foreground tabular-nums">
            Total: {fmt(totalLow)}{totalHigh !== totalLow && <> – {fmt(totalHigh)}</>} / mo
          </span>
        </div>
      )}
    </div>
  );
}
