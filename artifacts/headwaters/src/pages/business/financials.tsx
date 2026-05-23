import { useState, useEffect, useCallback, useRef } from "react";
import { useGetHeadwatersBusinessSection, usePatchHeadwatersBusinessSection } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Plus, Trash2, Clock, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FinancialRow {
  id: string;
  name: string;
  monthlyLow: number;
  monthlyHigh: number;
  timeline: string;
  requiresTime: boolean;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function fmt(n: number) {
  if (!n) return "—";
  return "$" + Math.round(n).toLocaleString();
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
      setRows(loaded.map((r) => ({ requiresTime: true, ...r })));
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
    updateAndSave([...rows, { id: genId(), name: "", monthlyLow: 0, monthlyHigh: 0, timeline: "", requiresTime: true }]);

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

  const saveOnBlur = () => {
    persist(rows);
  };

  const totalLow = rows.reduce((s, r) => s + (r.monthlyLow || 0), 0);
  const totalHigh = rows.reduce((s, r) => s + (r.monthlyHigh || 0), 0);

  const activeLow = rows.filter((r) => r.requiresTime).reduce((s, r) => s + (r.monthlyLow || 0), 0);
  const activeHigh = rows.filter((r) => r.requiresTime).reduce((s, r) => s + (r.monthlyHigh || 0), 0);
  const passiveLow = rows.filter((r) => !r.requiresTime).reduce((s, r) => s + (r.monthlyLow || 0), 0);
  const passiveHigh = rows.filter((r) => !r.requiresTime).reduce((s, r) => s + (r.monthlyHigh || 0), 0);

  const hasRows = rows.length > 0;
  const passivePct = totalHigh > 0 ? Math.round((passiveHigh / totalHigh) * 100) : 0;

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
            Monthly revenue estimates per stream. Toggle whether each stream requires your active time.
          </p>
        </div>
        <Button onClick={addRow} className="gap-2 shrink-0">
          <Plus size={16} />
          Add Row
        </Button>
      </div>

      {/* Time Leverage Summary */}
      {hasRows && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="border-amber-200/60 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/40">
            <CardContent className="p-5 flex items-start gap-3">
              <Clock size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
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
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground italic">
                    No revenue streams yet. Hit "Add Row" to start.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
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
                  <td className="px-4 py-3 text-foreground">Monthly Total</td>
                  <td className="px-4 py-3 text-right text-foreground tabular-nums">{fmt(totalLow)}</td>
                  <td className="px-4 py-3 text-right text-foreground tabular-nums">{fmt(totalHigh)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">per month</td>
                  <td />
                  <td />
                </tr>
                <tr className="bg-secondary/20 font-semibold text-muted-foreground">
                  <td className="px-4 py-3">Annual Total</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmt(totalLow * 12)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmt(totalHigh * 12)}</td>
                  <td className="px-4 py-3 text-sm">per year</td>
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
