import { useState, useEffect, useCallback, useRef } from "react";
import { useGetHeadwatersBusinessSection, usePatchHeadwatersBusinessSection } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Plus, Trash2, Clock, Zap, Users, Settings, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type BottleneckType = "client-facing" | "admin" | "one-time" | "none";

interface FinancialRow {
  id: string;
  name: string;
  monthlyLow: number;
  monthlyHigh: number;
  timeline: string;
  requiresTime: boolean;
  bottleneckType: BottleneckType;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function fmt(n: number) {
  if (!n) return "—";
  return "$" + Math.round(n).toLocaleString();
}

const BOTTLENECK_FILL: Record<BottleneckType, string> = {
  "client-facing": "#7c3aed",
  "admin": "#0284c7",
  "one-time": "#ea580c",
  "none": "#94a3b8",
};

function DonutChart({ segments }: { segments: { type: BottleneckType; value: number; label: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  const R = 42;
  const r = 26;
  const cx = 52;
  const cy = 52;
  const gap = 0.03;

  let startAngle = -Math.PI / 2;
  const paths: { d: string; fill: string; type: BottleneckType }[] = [];

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
      fill: BOTTLENECK_FILL[seg.type],
      type: seg.type,
    });

    startAngle = endAngle + gap;
  }

  return (
    <svg viewBox="0 0 104 104" className="w-20 h-20 shrink-0">
      {paths.map((p) => (
        <path key={p.type} d={p.d} fill={p.fill} opacity="0.85" />
      ))}
    </svg>
  );
}

const BOTTLENECK_OPTIONS: { value: BottleneckType; label: string; icon: React.ReactNode; color: string }[] = [
  {
    value: "client-facing",
    label: "Client-facing",
    icon: <Users size={11} />,
    color: "text-violet-600 dark:text-violet-400",
  },
  {
    value: "admin",
    label: "Admin / Ops",
    icon: <Settings size={11} />,
    color: "text-sky-600 dark:text-sky-400",
  },
  {
    value: "one-time",
    label: "One-time setup",
    icon: <Wrench size={11} />,
    color: "text-orange-600 dark:text-orange-400",
  },
  {
    value: "none",
    label: "None",
    icon: null,
    color: "text-muted-foreground",
  },
];

function bottleneckMeta(type: BottleneckType) {
  return BOTTLENECK_OPTIONS.find((o) => o.value === type) ?? BOTTLENECK_OPTIONS[3];
}

export default function BusinessFinancials() {
  const { toast } = useToast();

  const { data, isLoading, error } = useGetHeadwatersBusinessSection("financials");
  const patch = usePatchHeadwatersBusinessSection();

  const [rows, setRows] = useState<FinancialRow[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (data && !initialized.current) {
      const loaded = Array.isArray(data.value) ? (data.value as FinancialRow[]) : [];
      setRows(loaded.map((r) => ({ requiresTime: true, bottleneckType: "none" as BottleneckType, ...r })));
      initialized.current = true;
    }
  }, [data]);

  const persist = useCallback(
    (next: FinancialRow[]) => {
      patch.mutate(
        { section: "financials", data: { value: next } },
        { onError: () => toast({ title: "Save failed", variant: "destructive" }) }
      );
    },
    [patch]
  );

  const updateAndSave = (next: FinancialRow[]) => {
    setRows(next);
    persist(next);
  };

  const addRow = () =>
    updateAndSave([...rows, { id: genId(), name: "", monthlyLow: 0, monthlyHigh: 0, timeline: "", requiresTime: true, bottleneckType: "none" }]);

  const removeRow = (id: string) =>
    updateAndSave(rows.filter((r) => r.id !== id));

  const updateTextField = (id: string, field: "name" | "timeline", value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const updateNumField = (id: string, field: "monthlyLow" | "monthlyHigh", raw: string) => {
    const value = parseFloat(raw) || 0;
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const toggleRequiresTime = (id: string) => {
    const next = rows.map((r) => (r.id === id ? { ...r, requiresTime: !r.requiresTime } : r));
    updateAndSave(next);
  };

  const updateBottleneckType = (id: string, value: BottleneckType) => {
    const next = rows.map((r) => (r.id === id ? { ...r, bottleneckType: value } : r));
    updateAndSave(next);
  };

  const saveOnBlur = () => {
    persist(rows);
  };

  const totalLow = rows.reduce((s, r) => s + (r.monthlyLow || 0), 0);
  const totalHigh = rows.reduce((s, r) => s + (r.monthlyHigh || 0), 0);

  const activeLow = rows.filter((r) => r.requiresTime).reduce((s, r) => s + (r.monthlyLow || 0), 0);
  const activeHigh = rows.filter((r) => r.requiresTime).reduce((s, r) => s + (r.monthlyHigh || 0), 0);
  const passiveLow = rows.filter((r) => !r.requiresTime).reduce((s, r) => s + (r.monthlyLow || 0), 0);
  const passiveHigh = rows.filter((r) => !r.requiresTime).reduce((s, r) => s + (r.monthlyHigh || 0), 0);

  const [bottleneckFilter, setBottleneckFilter] = useState<BottleneckType | null>(null);

  const visibleRows = bottleneckFilter === null ? rows : rows.filter((r) => r.bottleneckType === bottleneckFilter);

  const filterTotalLow = visibleRows.reduce((s, r) => s + (r.monthlyLow || 0), 0);
  const filterTotalHigh = visibleRows.reduce((s, r) => s + (r.monthlyHigh || 0), 0);

  const presentBottleneckTypes = Array.from(new Set(rows.map((r) => r.bottleneckType))).filter(
    (t) => t !== "none"
  ) as BottleneckType[];

  const hasRows = rows.length > 0;
  const passivePct = totalHigh > 0 ? Math.round((passiveHigh / totalHigh) * 100) : 0;

  const timeRows = rows.filter((r) => r.requiresTime);
  const bottleneckBreakdown = (["client-facing", "admin", "one-time"] as BottleneckType[]).map((type) => {
    const matched = timeRows.filter((r) => r.bottleneckType === type);
    const low = matched.reduce((s, r) => s + (r.monthlyLow || 0), 0);
    const high = matched.reduce((s, r) => s + (r.monthlyHigh || 0), 0);
    return { type, low, high, count: matched.length };
  }).filter((b) => b.count > 0);

  if (isLoading)
    return <div className="p-8 text-center text-muted-foreground">Loading financials...</div>;
  if (error)
    return <div className="p-8 text-center text-destructive">Failed to load financials.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold text-foreground flex items-center gap-3">
            <DollarSign className="text-primary" size={32} />
            Financial Model
          </h1>
          <p className="text-muted-foreground mt-2">
            Monthly revenue estimates per stream. Track whether each stream requires your time and what kind of bottleneck it is.
          </p>
        </div>
        <Button onClick={addRow} className="gap-2 shrink-0">
          <Plus size={16} />
          Add Row
        </Button>
      </div>

      {/* Time Leverage Summary */}
      {hasRows && (
        <div className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="border-amber-200/60 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/40">
              <CardContent className="p-5 flex items-start gap-3">
                <Clock size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">Requires your time</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    {fmt(activeLow)}{activeHigh !== activeLow && <> – {fmt(activeHigh)}</>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">per month</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200/60 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800/40">
              <CardContent className="p-5 flex items-start gap-3">
                <Zap size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">Passive / runs itself</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    {fmt(passiveLow)}{passiveHigh !== passiveLow && <> – {fmt(passiveHigh)}</>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">per month</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-5 flex items-start gap-3">
                <DollarSign size={20} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Passive share</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">{passivePct}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">of total high estimate</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottleneck breakdown */}
          {bottleneckBreakdown.length > 0 && (
            <Card className="border-amber-200/40 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-800/30">
              <CardContent className="p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                  <Clock size={12} />
                  Time-dependent breakdown by bottleneck type
                </p>
                <div className="flex items-center gap-5 flex-wrap sm:flex-nowrap">
                  <DonutChart
                    segments={bottleneckBreakdown.map(({ type, high }) => ({
                      type,
                      value: high,
                      label: bottleneckMeta(type).label,
                    }))}
                  />
                  <div className="flex flex-col gap-2 min-w-0">
                    {bottleneckBreakdown.map(({ type, low, high }) => {
                      const meta = bottleneckMeta(type);
                      const totalHigh = bottleneckBreakdown.reduce((s, b) => s + b.high, 0);
                      const pct = totalHigh > 0 ? Math.round((high / totalHigh) * 100) : 0;
                      return (
                        <div key={type} className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: BOTTLENECK_FILL[type] }}
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

      {hasRows && presentBottleneckTypes.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filter:</span>
          {presentBottleneckTypes.map((type) => {
            const meta = bottleneckMeta(type);
            const isActive = bottleneckFilter === type;
            return (
              <button
                key={type}
                onClick={() => setBottleneckFilter(isActive ? null : type)}
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
          {bottleneckFilter !== null && (
            <button
              onClick={() => setBottleneckFilter(null)}
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Revenue Stream</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Monthly Low</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Monthly High</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Target Timeline</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  <span className="flex items-center justify-center gap-1.5">
                    <Clock size={13} />
                    My time?
                  </span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Bottleneck type</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground italic">
                    No revenue streams yet. Hit "Add Row" to start.
                  </td>
                </tr>
              )}
              {rows.length > 0 && visibleRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground italic">
                    No rows match this filter.
                  </td>
                </tr>
              )}
              {visibleRows.map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-3 py-2">
                    <Input
                      value={r.name}
                      onChange={(e) => updateTextField(r.id, "name", e.target.value)}
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
                    <Input
                      value={r.timeline}
                      onChange={(e) => updateTextField(r.id, "timeline", e.target.value)}
                      onBlur={saveOnBlur}
                      placeholder="e.g. Q3 2025..."
                      className="bg-transparent border-0 shadow-none px-1 h-9 focus-visible:ring-0 focus-visible:bg-card"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => toggleRequiresTime(r.id)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                        r.requiresTime
                          ? "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300"
                          : "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300"
                      }`}
                      title={r.requiresTime ? "Click to mark as passive" : "Click to mark as time-dependent"}
                    >
                      {r.requiresTime ? (
                        <><Clock size={11} /> Yes</>
                      ) : (
                        <><Zap size={11} /> Passive</>
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    {r.requiresTime ? (
                      <Select
                        value={r.bottleneckType ?? "none"}
                        onValueChange={(v) => updateBottleneckType(r.id, v as BottleneckType)}
                      >
                        <SelectTrigger className="h-8 text-xs border-border/60 bg-transparent w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BOTTLENECK_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              <span className={`flex items-center gap-1.5 ${opt.color}`}>
                                {opt.icon}
                                {opt.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground/50 px-1">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => removeRow(r.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remove row"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-primary/20 bg-primary/5 font-semibold">
                  <td className="px-4 py-3 text-foreground">
                    Monthly Total
                    {bottleneckFilter !== null && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({bottleneckMeta(bottleneckFilter).label} only)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground tabular-nums">{fmt(filterTotalLow)}</td>
                  <td className="px-4 py-3 text-right text-foreground tabular-nums">{fmt(filterTotalHigh)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">per month</td>
                  <td />
                  <td />
                  <td />
                </tr>
                <tr className="bg-secondary/20 font-semibold text-muted-foreground">
                  <td className="px-4 py-3">Annual Total</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmt(filterTotalLow * 12)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmt(filterTotalHigh * 12)}</td>
                  <td className="px-4 py-3 text-sm">per year</td>
                  <td />
                  <td />
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </CardContent>
      </Card>

      {patch.isPending && (
        <p className="text-xs text-muted-foreground text-right">Saving...</p>
      )}
    </div>
  );
}
