import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw, Eye, EyeOff, Pencil, Check, X, ShoppingBag, ExternalLink, Lock,
} from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

const ALL_ZONES = ["zone-0", "zone-1", "zone-2", "zone-3", "zone-4", "zone-5"];
const ZONE_LABELS: Record<string, string> = {
  "zone-0": "Z0 Mind",
  "zone-1": "Z1 Home",
  "zone-2": "Z2 Garden",
  "zone-3": "Z3 Farm",
  "zone-4": "Z4 Wild",
  "zone-5": "Z5 Contingency",
};

interface GearProduct {
  id: number;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  externalUrl: string;
  zoneTags: string[];
  categoryTags: string[];
  isVisible: boolean;
  importedAt: string;
}

interface AdminGearListResponse {
  products: GearProduct[];
  total: number;
  limit: number;
  offset: number;
  lastImportedAt: string | null;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function fetchAdminGear(offset: number): Promise<AdminGearListResponse> {
  const res = await fetch(apiUrl(`/admin/gear?limit=50&offset=${offset}`));
  if (!res.ok) throw new ApiError("Failed to load products", res.status);
  return res.json();
}

class ImportInProgressError extends Error {
  constructor() {
    super("An import is already running — check back in a moment.");
  }
}

async function triggerImport(): Promise<{ ok: boolean; seen: number; upserted: number }> {
  const res = await fetch(apiUrl("/admin/gear/import"), { method: "POST" });
  const body = await res.json();
  if (res.status === 409) throw new ImportInProgressError();
  if (!res.ok) throw new Error(body.error ?? "Import failed");
  return body;
}

async function updateProduct(
  id: number,
  data: Partial<GearProduct>,
): Promise<GearProduct> {
  const res = await fetch(apiUrl(`/admin/gear/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to update product");
  }
  return res.json();
}

function ZonePicker({ value, onChange }: { value: string[]; onChange: (z: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL_ZONES.map((z) => (
        <button
          key={z}
          type="button"
          onClick={() =>
            onChange(value.includes(z) ? value.filter((x) => x !== z) : [...value, z])
          }
          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
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

function ProductRow({ product }: { product: GearProduct }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [form, setForm] = useState({
    title: product.title,
    description: product.description,
    zoneTags: product.zoneTags,
    categoryTags: product.categoryTags,
  });
  const [catInput, setCatInput] = useState(product.categoryTags.join(", "));

  const update = useMutation({
    mutationFn: (data: Partial<GearProduct>) => updateProduct(product.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gear"] });
    },
  });

  const handleSave = () => {
    const parsed = catInput
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    update.mutate(
      { ...form, categoryTags: parsed },
      { onSuccess: () => setEditing(false) },
    );
  };

  const handleToggleVisible = () => {
    update.mutate({ isVisible: !product.isVisible });
  };

  return (
    <div className={`rounded-lg border bg-card transition-all ${product.isVisible ? "border-border" : "border-dashed border-border/50 opacity-60"}`}>
      {/* Compact header row */}
      <div className="flex items-start gap-3 p-3">
        <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
          {product.imageUrl && !imgFailed ? (
            <img
              src={product.imageUrl}
              alt=""
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <ShoppingBag className="w-6 h-6 text-muted-foreground/40" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-1 flex-1">
              {product.title}
            </h3>
            {!product.isVisible && (
              <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50 shrink-0">
                Hidden
              </span>
            )}
          </div>
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{product.description}</p>
          )}
          <div className="flex flex-wrap gap-1 mb-1">
            {product.zoneTags.map((z) => (
              <span key={z} className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-medium">
                {ZONE_LABELS[z] ?? z}
              </span>
            ))}
            {product.categoryTags.slice(0, 4).map((c) => (
              <span key={c} className="text-[10px] bg-muted text-muted-foreground border border-border/50 px-1.5 py-0.5 rounded">
                {c}
              </span>
            ))}
            {product.categoryTags.length > 4 && (
              <span className="text-[10px] text-muted-foreground">+{product.categoryTags.length - 4} more</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <a
            href={product.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
            title="Open on TSP"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={handleToggleVisible}
            disabled={update.isPending}
            className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
            title={product.isVisible ? "Hide product" : "Show product"}
          >
            {product.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setEditing((v) => !v)}
            className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
            title="Edit tags"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="border-t border-border p-3 space-y-3 bg-muted/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Title</label>
              <input
                className="rounded border border-border bg-background text-sm p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</label>
              <textarea
                className="rounded border border-border bg-background text-sm p-2 resize-y min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Zone Tags</label>
              <ZonePicker
                value={form.zoneTags}
                onChange={(z) => setForm((f) => ({ ...f, zoneTags: z }))}
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Category Tags <span className="font-normal normal-case text-muted-foreground/70">(comma-separated, lowercase)</span>
              </label>
              <input
                className="rounded border border-border bg-background text-sm p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={catInput}
                onChange={(e) => setCatInput(e.target.value)}
                placeholder="gardening, water, food storage…"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleSave}
              disabled={update.isPending}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              {update.isPending ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type VisibilityFilter = "all" | "visible" | "hidden";

/* ─────────────── Auth gate ─────────────── */
interface AuthUserResponse {
  user: { id: string; email: string | null; firstName: string | null; lastName: string | null } | null;
}

async function fetchAuthUser(): Promise<AuthUserResponse> {
  const res = await fetch(apiUrl("/auth/user"));
  if (!res.ok) return { user: null };
  return res.json();
}

function AdminLoginWall({ returnTo }: { returnTo: string }) {
  const loginUrl = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/login?returnTo=${encodeURIComponent(returnTo)}`;
  return (
    <div className="container mx-auto px-4 md:px-6 py-24 max-w-md text-center">
      <div className="flex justify-center mb-6">
        <div className="p-4 rounded-full bg-muted">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
      </div>
      <h1 className="font-serif text-2xl font-bold text-foreground mb-3">Admin access required</h1>
      <p className="text-muted-foreground mb-8">
        Sign in to access this admin page.
      </p>
      <a
        href={loginUrl}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Sign in to continue
      </a>
    </div>
  );
}

export function AdminGear() {
  const { data: auth, isLoading: authLoading } = useQuery({
    queryKey: ["auth-user"],
    queryFn: fetchAuthUser,
    staleTime: 60_000,
  });

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
        <div className="h-10 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!auth?.user) {
    return <AdminLoginWall returnTo="/admin/gear" />;
  }

  return <AdminGearContent />;
}

function AdminGearContent() {
  const qc = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [visFilter, setVisFilter] = useState<VisibilityFilter>("all");
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string; info?: boolean } | null>(null);

  const LIMIT = 50;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-gear", offset],
    queryFn: () => fetchAdminGear(offset),
    staleTime: 60_000,
    retry: (count, err) => {
      if (err instanceof ApiError && err.status === 401) return false;
      return count < 2;
    },
  });

  const runImport = useMutation({
    mutationFn: triggerImport,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["admin-gear"] });
      setImportMsg({
        ok: true,
        text: `Import complete — ${result.seen} posts seen, ${result.upserted} products saved.`,
      });
      setTimeout(() => setImportMsg(null), 8000);
    },
    onError: (err: Error) => {
      if (err instanceof ImportInProgressError) {
        setImportMsg({ ok: true, text: err.message, info: true });
      } else {
        setImportMsg({ ok: false, text: `Import failed: ${err.message}` });
      }
      setTimeout(() => setImportMsg(null), 8000);
    },
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const currentPage = Math.floor(offset / LIMIT) + 1;

  const allProducts = data?.products ?? [];
  const filteredProducts =
    visFilter === "visible"
      ? allProducts.filter((p) => p.isVisible)
      : visFilter === "hidden"
        ? allProducts.filter((p) => !p.isVisible)
        : allProducts;

  const hiddenCount = allProducts.filter((p) => !p.isVisible).length;

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-4xl">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Gear Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Jack's reviewed products — sourced from TSP WordPress. Links always go to Jack's site.
          </p>
          {data?.lastImportedAt && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              Last imported{" "}
              {new Date(data.lastImportedAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
        <button
          onClick={() => runImport.mutate()}
          disabled={runImport.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <RefreshCw className={`w-4 h-4 ${runImport.isPending ? "animate-spin" : ""}`} />
          {runImport.isPending ? "Importing…" : "Refresh Gear"}
        </button>
      </div>

      {importMsg && (
        <div
          className={`mb-6 p-4 rounded-lg border text-sm font-medium ${
            importMsg.info
              ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40"
              : importMsg.ok
              ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/40"
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}
        >
          {importMsg.text}
        </div>
      )}

      {runImport.isPending && (
        <div className="mb-6 p-4 rounded-lg bg-muted border border-border text-sm text-muted-foreground">
          Importing product posts from TSP WordPress — this may take a minute or two depending on how many posts there are. Hang tight…
        </div>
      )}

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {total > 0 ? `${total.toLocaleString()} products` : isLoading ? "Loading…" : isError ? "" : "No products imported yet"}
        </p>

        {/* Visibility filter */}
        {total > 0 && (
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 bg-muted/40">
            {(["all", "visible", "hidden"] as VisibilityFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => { setVisFilter(f); setOffset(0); }}
                className={`text-xs px-3 py-1 rounded-md capitalize transition-colors ${
                  visFilter === f
                    ? "bg-background text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
                {f === "hidden" && hiddenCount > 0 && (
                  <span className="ml-1 bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                    {hiddenCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {isError ? (
        <div className="py-20 text-center border border-dashed border-border rounded-xl flex flex-col items-center gap-4">
          <ShoppingBag className="w-10 h-10 text-muted-foreground/40" />
          <div>
            {(error instanceof ApiError && error.status === 401) ? (
              <>
                <p className="font-semibold text-foreground">Sign in required</p>
                <p className="text-sm text-muted-foreground mt-1">You need to be logged in as an editor to manage the gear catalog.</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-foreground">Failed to load products</p>
                <p className="text-sm text-muted-foreground mt-1">{error instanceof Error ? error.message : "Unknown error"}</p>
              </>
            )}
          </div>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-border rounded-xl flex flex-col items-center gap-4">
          <ShoppingBag className="w-10 h-10 text-muted-foreground/40" />
          <div>
            {total === 0 ? (
              <>
                <p className="font-semibold text-foreground">No products imported yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click <strong>Re-import from TSP</strong> to pull Jack's product review posts.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-foreground">No {visFilter} products on this page</p>
                <p className="text-sm text-muted-foreground mt-1">Try switching the filter or paging through results.</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {filteredProducts.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                disabled={currentPage <= 1}
                className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setOffset(offset + LIMIT)}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
