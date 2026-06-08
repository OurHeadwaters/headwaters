import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Check, X, Plus, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface CategoryDescription {
  id: number;
  category: string;
  description: string;
  updatedAt: string;
}

interface LiveCategory {
  name: string;
  count: number;
  description?: string;
}

async function fetchAdminCategories(): Promise<CategoryDescription[]> {
  const res = await fetch(apiUrl("/admin/categories"));
  if (!res.ok) throw new Error("Failed to load managed descriptions");
  return res.json();
}

async function fetchLiveCategories(): Promise<LiveCategory[]> {
  const res = await fetch(apiUrl("/categories"));
  if (!res.ok) throw new Error("Failed to load live categories");
  return res.json();
}

async function upsertDescription(category: string, description: string): Promise<CategoryDescription> {
  const res = await fetch(apiUrl(`/admin/categories/${encodeURIComponent(category)}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  if (!res.ok) throw new Error("Failed to save description");
  return res.json();
}

async function deleteDescription(category: string): Promise<void> {
  const res = await fetch(apiUrl(`/admin/categories/${encodeURIComponent(category)}`), {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete description");
}

async function seedDescriptions(): Promise<{ seeded: number }> {
  const res = await fetch(apiUrl("/admin/categories/seed"), { method: "POST" });
  if (!res.ok) throw new Error("Failed to seed descriptions");
  return res.json();
}

function EditRow({
  category,
  initialValue,
  onSave,
  onCancel,
}: {
  category: string;
  initialValue: string;
  onSave: (val: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <div className="flex flex-col gap-2">
      <textarea
        className="w-full rounded border border-border bg-background text-sm p-2 resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => onSave(value.trim())}
          disabled={!value.trim()}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" /> Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </div>
  );
}

export function AdminCategories() {
  const qc = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showUnmanaged, setShowUnmanaged] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  const { data: managed = [], isLoading: loadingManaged } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: fetchAdminCategories,
  });

  const { data: live = [] } = useQuery({
    queryKey: ["live-categories"],
    queryFn: fetchLiveCategories,
  });

  const managedSet = new Set(managed.map((r) => r.category.toLowerCase()));
  const unmanaged = live.filter((c) => !managedSet.has(c.name.toLowerCase()));

  const upsert = useMutation({
    mutationFn: ({ category, description }: { category: string; description: string }) =>
      upsertDescription(category, description),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["live-categories"] });
      setEditingCategory(null);
      setAddingCategory(false);
      setNewCategory("");
      setNewDescription("");
    },
  });

  const remove = useMutation({
    mutationFn: deleteDescription,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["live-categories"] });
    },
  });

  const seed = useMutation({
    mutationFn: seedDescriptions,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["live-categories"] });
      setSeedMsg(`Seeded ${data.seeded} new descriptions from the built-in defaults.`);
      setTimeout(() => setSeedMsg(null), 5000);
    },
  });

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Category Descriptions</h1>
        <p className="text-muted-foreground">
          Add or edit the one-line descriptions shown under each topic on the Browse page.
          These are saved to the database and take effect immediately — no deploy needed.
        </p>
      </header>

      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => { setAddingCategory(true); setEditingCategory(null); }}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Add Description
        </button>
        <button
          onClick={() => seed.mutate()}
          disabled={seed.isPending}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${seed.isPending ? "animate-spin" : ""}`} />
          Seed from Defaults
        </button>
      </div>

      {seedMsg && (
        <div className="mb-6 p-3 rounded-lg bg-green-50 text-green-800 text-sm border border-green-200">
          {seedMsg}
        </div>
      )}

      {addingCategory && (
        <div className="mb-6 p-4 rounded-lg border border-primary bg-card">
          <h3 className="font-semibold text-sm mb-3">New Category Description</h3>
          <div className="flex flex-col gap-2 mb-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category name</label>
            <input
              type="text"
              className="rounded border border-border bg-background text-sm p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. beekeeping"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2 mb-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
            <textarea
              className="w-full rounded border border-border bg-background text-sm p-2 resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="One or two sentences describing what this category covers..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => upsert.mutate({ category: newCategory.trim().toLowerCase(), description: newDescription.trim() })}
              disabled={!newCategory.trim() || !newDescription.trim() || upsert.isPending}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" /> Save
            </button>
            <button
              onClick={() => { setAddingCategory(false); setNewCategory(""); setNewDescription(""); }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}

      {loadingManaged ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : managed.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground mb-4">No managed descriptions yet.</p>
          <p className="text-sm text-muted-foreground">
            Click <strong>Seed from Defaults</strong> to load the built-in descriptions, or <strong>Add Description</strong> to create one from scratch.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {managed.map((row) => (
            <div
              key={row.id}
              className="p-4 rounded-lg border border-border bg-card hover:border-muted-foreground/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm text-foreground capitalize">{row.category}</span>
                  {editingCategory === row.category ? (
                    <div className="mt-2">
                      <EditRow
                        category={row.category}
                        initialValue={row.description}
                        onSave={(val) => upsert.mutate({ category: row.category, description: val })}
                        onCancel={() => setEditingCategory(null)}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{row.description}</p>
                  )}
                </div>
                {editingCategory !== row.category && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => { setEditingCategory(row.category); setAddingCategory(false); }}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => remove.mutate(row.category)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove (falls back to auto-generated)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-1 text-xs text-muted-foreground/60">
                Updated {new Date(row.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {unmanaged.length > 0 && (
        <div className="mt-10">
          <button
            onClick={() => setShowUnmanaged((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-3"
          >
            {showUnmanaged ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {unmanaged.length} categories without a managed description
          </button>
          {showUnmanaged && (
            <div className="space-y-1">
              {unmanaged.map((cat) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-border bg-card/50 text-sm"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-foreground capitalize">{cat.name}</span>
                    {cat.description && (
                      <span className="text-xs text-muted-foreground truncate">{cat.description}</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setNewCategory(cat.name.toLowerCase());
                      setNewDescription(cat.description ?? "");
                      setAddingCategory(true);
                      setEditingCategory(null);
                    }}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 ml-3"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
