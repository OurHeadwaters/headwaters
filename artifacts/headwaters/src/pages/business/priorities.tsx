import { useState, useEffect, useCallback, useRef } from "react";
import { useGetHeadwatersBusinessSection, usePatchHeadwatersBusinessSection } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Briefcase, Plus, Trash2, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PriorityStatus = "active" | "building" | "paused";

interface Priority {
  id: string;
  name: string;
  status: PriorityStatus;
  note: string;
}

const STATUS_STYLES: Record<PriorityStatus, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  building: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  paused: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const STATUS_CYCLE: PriorityStatus[] = ["active", "building", "paused"];

function nextStatus(s: PriorityStatus): PriorityStatus {
  const i = STATUS_CYCLE.indexOf(s);
  return STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length];
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function BusinessPriorities() {
  const { toast } = useToast();

  const { data, isLoading, error } = useGetHeadwatersBusinessSection("priorities");
  const patch = usePatchHeadwatersBusinessSection();

  const [priorities, setPriorities] = useState<Priority[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (data && !initialized.current) {
      setPriorities(Array.isArray(data.value) ? (data.value as Priority[]) : []);
      initialized.current = true;
    }
  }, [data]);

  const persist = useCallback(
    (next: Priority[]) => {
      patch.mutate(
        { section: "priorities", data: { value: next } },
        { onError: () => toast({ title: "Save failed", variant: "destructive" }) }
      );
    },
    [patch]
  );

  const updateAndSave = (next: Priority[]) => {
    setPriorities(next);
    persist(next);
  };

  const addRow = () =>
    updateAndSave([...priorities, { id: genId(), name: "", status: "active", note: "" }]);

  const removeRow = (id: string) =>
    updateAndSave(priorities.filter((p) => p.id !== id));

  const updateField = (id: string, field: "name" | "note", value: string) => {
    setPriorities((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const saveField = (id: string) => {
    persist(priorities);
  };

  const cycleStatus = (id: string) =>
    updateAndSave(priorities.map((p) => (p.id === id ? { ...p, status: nextStatus(p.status) } : p)));

  const moveRow = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= priorities.length) return;
    const next = [...priorities];
    const [removed] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, removed);
    updateAndSave(next);
  };

  if (isLoading)
    return <div className="p-8 text-center text-muted-foreground">Loading priorities...</div>;
  if (error)
    return <div className="p-8 text-center text-destructive">Failed to load priorities.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold text-foreground flex items-center gap-3">
            <Briefcase className="text-primary" size={32} />
            Priorities
          </h1>
          <p className="text-muted-foreground mt-2">
            Revenue streams and focus areas, ranked by what comes first.
          </p>
        </div>
        <Button onClick={addRow} className="gap-2 shrink-0">
          <Plus size={16} />
          Add Row
        </Button>
      </div>

      <div className="space-y-3">
        {priorities.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground italic">
              No priorities yet. Hit "Add Row" to start.
            </CardContent>
          </Card>
        )}

        {priorities.map((p, idx) => (
          <Card key={p.id} className="hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 pt-1 shrink-0">
                  <button
                    onClick={() => moveRow(idx, idx - 1)}
                    disabled={idx === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                    aria-label="Move up"
                  >
                    <GripVertical size={16} />
                  </button>
                  <span className="text-xs text-muted-foreground font-mono text-center">
                    {idx + 1}
                  </span>
                  <button
                    onClick={() => moveRow(idx, idx + 1)}
                    disabled={idx === priorities.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                    aria-label="Move down"
                  >
                    <GripVertical size={16} className="rotate-180" />
                  </button>
                </div>

                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-start">
                  <Input
                    value={p.name}
                    onChange={(e) => updateField(p.id, "name", e.target.value)}
                    onBlur={() => saveField(p.id)}
                    placeholder="Revenue stream or focus area..."
                    className="font-medium bg-card"
                  />

                  <button
                    onClick={() => cycleStatus(p.id)}
                    className={`px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider shrink-0 transition-colors ${STATUS_STYLES[p.status]}`}
                    title="Click to cycle status"
                  >
                    {p.status}
                  </button>

                  <Input
                    value={p.note}
                    onChange={(e) => updateField(p.id, "note", e.target.value)}
                    onBlur={() => saveField(p.id)}
                    placeholder="One-line note..."
                    className="bg-card text-muted-foreground"
                  />
                </div>

                <button
                  onClick={() => removeRow(p.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors pt-2"
                  aria-label="Remove row"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {patch.isPending && (
        <p className="text-xs text-muted-foreground text-right">Saving...</p>
      )}
    </div>
  );
}
