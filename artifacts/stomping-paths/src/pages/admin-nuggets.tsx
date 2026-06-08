import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, X, Check, Loader2, Quote } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

const TRACKS = [
  { slug: "mind-and-money", title: "Mind & Money" },
  { slug: "prepared-at-home", title: "Prepared at Home" },
  { slug: "growing-your-own", title: "Growing Your Own" },
  { slug: "working-homestead", title: "The Working Homestead" },
  { slug: "wild-harvest", title: "Wild Harvest" },
  { slug: "when-things-get-hard", title: "When Things Get Hard" },
  { slug: "escape-the-grindstone", title: "Escape the Grindstone" },
];

const POSITIONS = [
  { value: "beginning", label: "Beginning" },
  { value: "middle", label: "Middle" },
  { value: "end", label: "End" },
];

interface Nugget {
  id: number;
  text: string;
  attribution: string;
  source: string;
  trackSlug: string | null;
  trackPosition: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NuggetFormState {
  text: string;
  attribution: string;
  trackSlug: string;
  trackPosition: string;
}

const EMPTY_FORM: NuggetFormState = {
  text: "",
  attribution: "Jack Spirko",
  trackSlug: "",
  trackPosition: "",
};

async function fetchNuggets(): Promise<Nugget[]> {
  const res = await fetch(apiUrl("/admin/nuggets"));
  if (!res.ok) throw new Error("Failed to load nuggets");
  return res.json();
}

async function createNugget(data: NuggetFormState): Promise<Nugget> {
  const body: Record<string, string | null> = {
    text: data.text,
    attribution: data.attribution || "Jack Spirko",
    trackSlug: data.trackSlug || null,
    trackPosition: data.trackPosition || null,
  };
  const res = await fetch(apiUrl("/admin/nuggets"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to create nugget");
  }
  return res.json();
}

async function updateNugget(id: number, data: NuggetFormState): Promise<Nugget> {
  const body: Record<string, string | null> = {
    text: data.text,
    attribution: data.attribution || "Jack Spirko",
    trackSlug: data.trackSlug || null,
    trackPosition: data.trackPosition || null,
  };
  const res = await fetch(apiUrl(`/admin/nuggets/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to update nugget");
  }
  return res.json();
}

async function deleteNugget(id: number): Promise<void> {
  const res = await fetch(apiUrl(`/admin/nuggets/${id}`), { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete nugget");
}

function trackLabel(slug: string | null): string {
  if (!slug) return "";
  return TRACKS.find((t) => t.slug === slug)?.title ?? slug;
}

function positionLabel(pos: string | null): string {
  if (!pos) return "";
  return POSITIONS.find((p) => p.value === pos)?.label ?? pos;
}

function NuggetForm({
  initial,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial: NuggetFormState;
  onSave: (data: NuggetFormState) => void;
  onCancel?: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<NuggetFormState>(initial);

  function set(field: keyof NuggetFormState, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "trackSlug" && !value) next.trackPosition = "";
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
          Wisdom text <span className="text-destructive">*</span>
        </label>
        <textarea
          value={form.text}
          onChange={(e) => set("text", e.target.value)}
          placeholder="Paste a short quote or insight from Jack…"
          rows={4}
          required
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-y"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
          Attribution
        </label>
        <input
          type="text"
          value={form.attribution}
          onChange={(e) => set("attribution", e.target.value)}
          placeholder="Jack Spirko"
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
            Pin to track (optional)
          </label>
          <select
            value={form.trackSlug}
            onChange={(e) => set("trackSlug", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
          >
            <option value="">— None —</option>
            {TRACKS.map((t) => (
              <option key={t.slug} value={t.slug}>{t.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
            Position in track
          </label>
          <select
            value={form.trackPosition}
            onChange={(e) => set("trackPosition", e.target.value)}
            disabled={!form.trackSlug}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:opacity-50"
          >
            <option value="">— None —</option>
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving || !form.text.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? "Saving…" : "Save nugget"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function NuggetRow({
  nugget,
  onEdit,
  onDelete,
  deleting,
}: {
  nugget: Nugget;
  onEdit: (nugget: Nugget) => void;
  onDelete: (id: number) => void;
  deleting: boolean;
}) {
  return (
    <div className="border border-border rounded-xl p-4 bg-card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-serif text-sm leading-relaxed text-foreground italic mb-1.5">
            "{nugget.text}"
          </p>
          <p className="text-xs font-semibold text-muted-foreground">
            — {nugget.attribution}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onEdit(nugget)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(nugget.id)}
            disabled={deleting}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            title="Delete"
          >
            {deleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D9A066]/15 text-[#B5853A] border border-[#D9A066]/30">
          Jack's Insight
        </span>
        {nugget.trackSlug && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {trackLabel(nugget.trackSlug)}
            {nugget.trackPosition && (
              <span className="opacity-60">· {positionLabel(nugget.trackPosition)}</span>
            )}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground ml-auto">
          {new Date(nugget.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

export function AdminNuggets() {
  const qc = useQueryClient();
  const [editingNugget, setEditingNugget] = useState<Nugget | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: nuggets = [], isLoading } = useQuery({
    queryKey: ["admin-nuggets"],
    queryFn: fetchNuggets,
  });

  const createMutation = useMutation({
    mutationFn: createNugget,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-nuggets"] });
      setShowAddForm(false);
      setFormError(null);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: NuggetFormState }) => updateNugget(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-nuggets"] });
      setEditingNugget(null);
      setFormError(null);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNugget,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-nuggets"] }),
  });

  function handleAdd(data: NuggetFormState) {
    setFormError(null);
    createMutation.mutate(data);
  }

  function handleUpdate(data: NuggetFormState) {
    if (!editingNugget) return;
    setFormError(null);
    updateMutation.mutate({ id: editingNugget.id, data });
  }

  function startEdit(nugget: Nugget) {
    setEditingNugget(nugget);
    setShowAddForm(false);
    setFormError(null);
  }

  function cancelEdit() {
    setEditingNugget(null);
    setFormError(null);
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#D9A066]/15 flex items-center justify-center">
          <Quote className="w-5 h-5 text-[#B5853A]" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Wisdom Nuggets</h1>
          <p className="text-sm text-muted-foreground">
            Admin-authored insights — appear in Wisdom Dig and optionally pin to a learning track.
          </p>
        </div>
      </div>

      {/* Add new nugget */}
      {!showAddForm && !editingNugget && (
        <button
          onClick={() => { setShowAddForm(true); setFormError(null); }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-[#D9A066]/40 text-[#B5853A] text-sm font-semibold hover:border-[#D9A066]/70 hover:bg-[#D9A066]/5 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add wisdom nugget
        </button>
      )}

      {showAddForm && (
        <div className="mb-8 border border-border rounded-xl p-5 bg-card">
          <h2 className="font-serif text-base font-bold text-foreground mb-4">New nugget</h2>
          <NuggetForm
            initial={EMPTY_FORM}
            onSave={handleAdd}
            onCancel={() => { setShowAddForm(false); setFormError(null); }}
            saving={createMutation.isPending}
            error={formError}
          />
        </div>
      )}

      {/* Nuggets list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading nuggets…</span>
        </div>
      ) : nuggets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-4xl mb-3">💎</div>
          <p className="text-sm font-medium">No nuggets yet.</p>
          <p className="text-xs mt-1">Use the button above to add your first wisdom nugget.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground mb-1">
            <span className="font-semibold text-foreground">{nuggets.length}</span> nugget{nuggets.length !== 1 ? "s" : ""}
          </p>
          {nuggets.map((nugget) =>
            editingNugget?.id === nugget.id ? (
              <div key={nugget.id} className="border border-primary/30 rounded-xl p-5 bg-card">
                <h2 className="font-serif text-base font-bold text-foreground mb-4">Edit nugget</h2>
                <NuggetForm
                  initial={{
                    text: nugget.text,
                    attribution: nugget.attribution,
                    trackSlug: nugget.trackSlug ?? "",
                    trackPosition: nugget.trackPosition ?? "",
                  }}
                  onSave={handleUpdate}
                  onCancel={cancelEdit}
                  saving={updateMutation.isPending}
                  error={formError}
                />
              </div>
            ) : (
              <NuggetRow
                key={nugget.id}
                nugget={nugget}
                onEdit={startEdit}
                onDelete={(id) => deleteMutation.mutate(id)}
                deleting={deleteMutation.isPending && deleteMutation.variables === nugget.id}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
