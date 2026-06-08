import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Check, X, Plus, RefreshCw, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

const ALL_ZONES = ["zone-0", "zone-1", "zone-2", "zone-3", "zone-4", "zone-5"];
const ZONE_LABELS: Record<string, string> = {
  "zone-0": "Z0 — Mind",
  "zone-1": "Z1 — Home",
  "zone-2": "Z2 — Garden",
  "zone-3": "Z3 — Farm",
  "zone-4": "Z4 — Wild",
  "zone-5": "Z5 — Community",
};

interface Expert {
  id: number;
  slug: string;
  name: string;
  role: string;
  description: string;
  url: string;
  zones: string[];
  crew?: string | null;
  sortOrder: number;
  updatedAt: string;
  podcastFeedUrl?: string | null;
  rssSlug?: string | null;
}

interface Business {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  zones: string[];
  sortOrder: number;
  updatedAt: string;
}

async function fetchExperts(): Promise<Expert[]> {
  const res = await fetch(apiUrl("/admin/council/experts"));
  if (!res.ok) throw new Error("Failed to load experts");
  return res.json();
}

async function fetchBusinesses(): Promise<Business[]> {
  const res = await fetch(apiUrl("/admin/council/businesses"));
  if (!res.ok) throw new Error("Failed to load businesses");
  return res.json();
}

async function saveExpert(slug: string | null, data: Partial<Expert>): Promise<Expert> {
  const method = slug ? "PUT" : "POST";
  const path = slug ? `/admin/council/experts/${encodeURIComponent(slug)}` : "/admin/council/experts";
  const res = await fetch(apiUrl(path), {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to save expert");
  }
  return res.json();
}

async function deleteExpert(slug: string): Promise<void> {
  const res = await fetch(apiUrl(`/admin/council/experts/${encodeURIComponent(slug)}`), { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete expert");
}

async function saveBusiness(slug: string | null, data: Partial<Business>): Promise<Business> {
  const method = slug ? "PUT" : "POST";
  const path = slug ? `/admin/council/businesses/${encodeURIComponent(slug)}` : "/admin/council/businesses";
  const res = await fetch(apiUrl(path), {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to save business");
  }
  return res.json();
}

async function deleteBusiness(slug: string): Promise<void> {
  const res = await fetch(apiUrl(`/admin/council/businesses/${encodeURIComponent(slug)}`), { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete business");
}

async function seedExperts(): Promise<{ seeded: number }> {
  const res = await fetch(apiUrl("/admin/council/experts/seed"), { method: "POST" });
  if (!res.ok) throw new Error("Failed to seed experts");
  return res.json();
}

async function seedBusinesses(): Promise<{ seeded: number }> {
  const res = await fetch(apiUrl("/admin/council/businesses/seed"), { method: "POST" });
  if (!res.ok) throw new Error("Failed to seed businesses");
  return res.json();
}

/* ─────────────── Zone Picker ─────────────── */
function ZonePicker({ value, onChange }: { value: string[]; onChange: (z: string[]) => void }) {
  function toggle(zone: string) {
    onChange(value.includes(zone) ? value.filter((z) => z !== zone) : [...value, zone]);
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL_ZONES.map((z) => (
        <button
          key={z}
          type="button"
          onClick={() => toggle(z)}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
            value.includes(z)
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
          }`}
        >
          {ZONE_LABELS[z]}
        </button>
      ))}
    </div>
  );
}

/* ─────────────── Expert Form ─────────────── */
interface ExpertFormData {
  slug: string;
  name: string;
  role: string;
  description: string;
  url: string;
  zones: string[];
  crew: string;
  sortOrder: number;
  podcastFeedUrl: string;
  rssSlug: string;
}

const blankExpert = (): ExpertFormData => ({
  slug: "", name: "", role: "", description: "", url: "", zones: [], crew: "", sortOrder: 999, podcastFeedUrl: "", rssSlug: "",
});

function expertToForm(e: Expert): ExpertFormData {
  return { slug: e.slug, name: e.name, role: e.role, description: e.description, url: e.url, zones: e.zones, crew: e.crew ?? "", sortOrder: e.sortOrder, podcastFeedUrl: e.podcastFeedUrl ?? "", rssSlug: e.rssSlug ?? "" };
}

function ExpertForm({
  initial,
  isNew,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial: ExpertFormData;
  isNew: boolean;
  onSave: (data: ExpertFormData) => void;
  onCancel: () => void;
  saving: boolean;
  error?: string;
}) {
  const [form, setForm] = useState<ExpertFormData>(initial);
  function field(key: keyof ExpertFormData, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  const valid = form.name.trim() && form.role.trim() && form.description.trim() && form.url.trim() && (!isNew || form.slug.trim());
  return (
    <div className="space-y-3 p-4 rounded-lg border border-primary bg-card">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {isNew && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Slug (unique ID)</label>
            <input
              className="rounded border border-border bg-background text-sm p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. jane-smith"
              value={form.slug}
              onChange={(e) => field("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              autoFocus
            />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</label>
          <input
            className="rounded border border-border bg-background text-sm p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => field("name", e.target.value)}
            autoFocus={!isNew}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role / Expertise</label>
          <input
            className="rounded border border-border bg-background text-sm p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g. Energy & Power Systems"
            value={form.role}
            onChange={(e) => field("role", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Website URL</label>
          <input
            type="url"
            className="rounded border border-border bg-background text-sm p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="https://..."
            value={form.url}
            onChange={(e) => field("url", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
          <textarea
            className="w-full rounded border border-border bg-background text-sm p-2 resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="2–3 sentences describing this expert's contribution to TSP..."
            value={form.description}
            onChange={(e) => field("description", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Zones</label>
          <ZonePicker value={form.zones} onChange={(z) => setForm((f) => ({ ...f, zones: z }))} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sort order (lower = first)</label>
          <input
            type="number"
            className="rounded border border-border bg-background text-sm p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            value={form.sortOrder}
            onChange={(e) => field("sortOrder", parseInt(e.target.value, 10) || 999)}
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Podcast RSS Feed URL <span className="font-normal normal-case">(optional — enables council feed ingestion)</span></label>
          <input
            type="url"
            className="rounded border border-border bg-background text-sm p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="https://example.com/feed/podcast"
            value={form.podcastFeedUrl}
            onChange={(e) => field("podcastFeedUrl", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">RSS Slug override <span className="font-normal normal-case">(optional)</span></label>
          <input
            className="rounded border border-border bg-background text-sm p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g. steven-harris-podcast"
            value={form.rssSlug}
            onChange={(e) => field("rssSlug", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Crew <span className="font-normal normal-case">(optional — e.g. fireside-freedom)</span></label>
          <input
            className="rounded border border-border bg-background text-sm p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g. fireside-freedom"
            value={form.crew}
            onChange={(e) => field("crew", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
          />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => onSave(form)}
          disabled={!valid || saving}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save"}
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

/* ─────────────── Business Form ─────────────── */
interface BusinessFormData {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  zones: string[];
  sortOrder: number;
}

const blankBusiness = (): BusinessFormData => ({
  slug: "", name: "", tagline: "", description: "", url: "", zones: [], sortOrder: 999,
});

function bizToForm(b: Business): BusinessFormData {
  return { slug: b.slug, name: b.name, tagline: b.tagline, description: b.description, url: b.url, zones: b.zones, sortOrder: b.sortOrder };
}

function BusinessForm({
  initial,
  isNew,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial: BusinessFormData;
  isNew: boolean;
  onSave: (data: BusinessFormData) => void;
  onCancel: () => void;
  saving: boolean;
  error?: string;
}) {
  const [form, setForm] = useState<BusinessFormData>(initial);
  function field(key: keyof BusinessFormData, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  const valid = form.name.trim() && form.tagline.trim() && form.description.trim() && form.url.trim() && (!isNew || form.slug.trim());
  return (
    <div className="space-y-3 p-4 rounded-lg border border-primary bg-card">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {isNew && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Slug (unique ID)</label>
            <input
              className="rounded border border-border bg-background text-sm p-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. ames-farm"
              value={form.slug}
              onChange={(e) => field("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              autoFocus
            />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Business name</label>
          <input
            className="rounded border border-border bg-background text-sm p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Business name"
            value={form.name}
            onChange={(e) => field("name", e.target.value)}
            autoFocus={!isNew}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tagline</label>
          <input
            className="rounded border border-border bg-background text-sm p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g. Single-source raw honey"
            value={form.tagline}
            onChange={(e) => field("tagline", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Website URL</label>
          <input
            type="url"
            className="rounded border border-border bg-background text-sm p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="https://..."
            value={form.url}
            onChange={(e) => field("url", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
          <textarea
            className="w-full rounded border border-border bg-background text-sm p-2 resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="2–3 sentences describing this business..."
            value={form.description}
            onChange={(e) => field("description", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Zones</label>
          <ZonePicker value={form.zones} onChange={(z) => setForm((f) => ({ ...f, zones: z }))} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sort order (lower = first)</label>
          <input
            type="number"
            className="rounded border border-border bg-background text-sm p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            value={form.sortOrder}
            onChange={(e) => field("sortOrder", parseInt(e.target.value, 10) || 999)}
          />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => onSave(form)}
          disabled={!valid || saving}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save"}
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

/* ─────────────── Expert Council Tab ─────────────── */
function ExpertsTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  const { data: experts = [], isLoading } = useQuery({ queryKey: ["admin-experts"], queryFn: fetchExperts });

  const save = useMutation({
    mutationFn: ({ slug, data }: { slug: string | null; data: ExpertFormData }) =>
      saveExpert(slug, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-experts"] });
      setEditing(null);
      setAdding(false);
      setFormError(undefined);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const remove = useMutation({
    mutationFn: deleteExpert,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-experts"] }),
  });

  const seed = useMutation({
    mutationFn: seedExperts,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-experts"] });
      setSeedMsg(data.seeded > 0
        ? `Added ${data.seeded} missing experts from the built-in defaults.`
        : "All built-in experts are already in the database.");
      setTimeout(() => setSeedMsg(null), 5000);
    },
  });

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => { setAdding(true); setEditing(null); setFormError(undefined); }}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Add Expert
        </button>
        <button
          onClick={() => seed.mutate()}
          disabled={seed.isPending}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${seed.isPending ? "animate-spin" : ""}`} />
          Restore Defaults
        </button>
      </div>

      {seedMsg && (
        <div className="mb-5 p-3 rounded-lg bg-green-50 text-green-800 text-sm border border-green-200">{seedMsg}</div>
      )}

      {adding && (
        <div className="mb-5">
          <ExpertForm
            initial={blankExpert()}
            isNew
            onSave={(data) => save.mutate({ slug: null, data })}
            onCancel={() => { setAdding(false); setFormError(undefined); }}
            saving={save.isPending}
            error={formError}
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : experts.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground mb-2">No experts yet.</p>
          <p className="text-sm text-muted-foreground">Click <strong>Restore Defaults</strong> to load the built-in list, or <strong>Add Expert</strong> to start fresh.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {experts.map((expert) => (
            <div key={expert.id} className="rounded-lg border border-border bg-card">
              {editing === expert.slug ? (
                <div className="p-4">
                  <ExpertForm
                    initial={expertToForm(expert)}
                    isNew={false}
                    onSave={(data) => save.mutate({ slug: expert.slug, data })}
                    onCancel={() => { setEditing(null); setFormError(undefined); }}
                    saving={save.isPending}
                    error={formError}
                  />
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{expert.name}</span>
                      <span className="text-xs text-muted-foreground">— {expert.role}</span>
                      <a href={expert.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground" title={expert.url}>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{expert.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {expert.zones.map((z) => (
                        <span key={z} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{ZONE_LABELS[z] ?? z}</span>
                      ))}
                      {expert.crew && (
                        <span className="text-xs bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">crew: {expert.crew}</span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground/60">
                      Order: {expert.sortOrder} · Updated {new Date(expert.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => { setEditing(expert.slug); setAdding(false); setFormError(undefined); }}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Remove ${expert.name}?`)) remove.mutate(expert.slug); }}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── ULG Businesses Tab ─────────────── */
function BusinessesTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  const { data: businesses = [], isLoading } = useQuery({ queryKey: ["admin-businesses"], queryFn: fetchBusinesses });

  const save = useMutation({
    mutationFn: ({ slug, data }: { slug: string | null; data: BusinessFormData }) =>
      saveBusiness(slug, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      setEditing(null);
      setAdding(false);
      setFormError(undefined);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const remove = useMutation({
    mutationFn: deleteBusiness,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-businesses"] }),
  });

  const seed = useMutation({
    mutationFn: seedBusinesses,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      setSeedMsg(data.seeded > 0
        ? `Added ${data.seeded} missing businesses from the built-in defaults.`
        : "All built-in businesses are already in the database.");
      setTimeout(() => setSeedMsg(null), 5000);
    },
  });

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => { setAdding(true); setEditing(null); setFormError(undefined); }}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Add Business
        </button>
        <button
          onClick={() => seed.mutate()}
          disabled={seed.isPending}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${seed.isPending ? "animate-spin" : ""}`} />
          Restore Defaults
        </button>
      </div>

      {seedMsg && (
        <div className="mb-5 p-3 rounded-lg bg-green-50 text-green-800 text-sm border border-green-200">{seedMsg}</div>
      )}

      {adding && (
        <div className="mb-5">
          <BusinessForm
            initial={blankBusiness()}
            isNew
            onSave={(data) => save.mutate({ slug: null, data })}
            onCancel={() => { setAdding(false); setFormError(undefined); }}
            saving={save.isPending}
            error={formError}
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : businesses.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground mb-2">No businesses yet.</p>
          <p className="text-sm text-muted-foreground">Click <strong>Restore Defaults</strong> to load the built-in list, or <strong>Add Business</strong> to start fresh.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {businesses.map((biz) => (
            <div key={biz.id} className="rounded-lg border border-border bg-card">
              {editing === biz.slug ? (
                <div className="p-4">
                  <BusinessForm
                    initial={bizToForm(biz)}
                    isNew={false}
                    onSave={(data) => save.mutate({ slug: biz.slug, data })}
                    onCancel={() => { setEditing(null); setFormError(undefined); }}
                    saving={save.isPending}
                    error={formError}
                  />
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{biz.name}</span>
                      <span className="text-xs text-muted-foreground italic">{biz.tagline}</span>
                      <a href={biz.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground" title={biz.url}>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{biz.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {biz.zones.map((z) => (
                        <span key={z} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{ZONE_LABELS[z] ?? z}</span>
                      ))}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground/60">
                      Order: {biz.sortOrder} · Updated {new Date(biz.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => { setEditing(biz.slug); setAdding(false); setFormError(undefined); }}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Remove ${biz.name}?`)) remove.mutate(biz.slug); }}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Main Page ─────────────── */
type Tab = "experts" | "businesses";

export function AdminCouncil() {
  const [tab, setTab] = useState<Tab>("experts");

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Expert Council & Businesses</h1>
        <p className="text-muted-foreground">
          Add, edit, and reorder Expert Council members and ULG-affiliated businesses.
          Changes take effect immediately — no code deploy needed. Zone tags control which entries
          appear on each zone resource page.
        </p>
      </header>

      <div className="flex gap-1 mb-8 border-b border-border">
        {(["experts", "businesses"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "experts" ? "Expert Council" : "ULG Businesses"}
          </button>
        ))}
      </div>

      {tab === "experts" ? <ExpertsTab /> : <BusinessesTab />}
    </div>
  );
}
