import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle, XCircle, Clock, TrendingUp, Users, RefreshCw,
  Copy, ExternalLink, AlertCircle, CalendarDays, DollarSign,
} from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

const ZONE_LABELS: Record<string, string> = {
  "zone-0": "Z0 — Mind",
  "zone-1": "Z1 — Home",
  "zone-2": "Z2 — Garden",
  "zone-3": "Z3 — Farm",
  "zone-4": "Z4 — Wild",
  "zone-5": "Z5 — Community",
};

interface Application {
  id: number;
  name: string;
  email: string;
  role: string;
  bio: string;
  website: string;
  podcastFeedUrl: string | null;
  consultUrl: string | null;
  photoUrl: string | null;
  zones: string[];
  status: "pending" | "approved" | "rejected";
  expertSlug: string | null;
  checkoutUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  active: number;
  lapsed: number;
  pending: number;
  mrr: number;
  upcomingRenewals: { slug: string; name: string; currentPeriodEnd: string }[];
  activeMembers: { slug: string; name: string; role: string; currentPeriodEnd: string | null; approvedAt: string | null }[];
  lapsedMembers: { slug: string; name: string; role: string; currentPeriodEnd: string | null }[];
}

function StatusBadge({ status }: { status: string }) {
  if (status === "pending") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
  if (status === "approved") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
      <CheckCircle className="w-3 h-3" /> Approved
    </span>
  );
  if (status === "active") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
      <CheckCircle className="w-3 h-3" /> Active
    </span>
  );
  if (status === "lapsed") return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
      <XCircle className="w-3 h-3" /> Lapsed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
      {status}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
      title="Copy to clipboard"
    >
      <Copy className="w-3 h-3" />
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}

/* ─────────────────────────── Applications Tab ─────────────────────────── */
function ApplicationsTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const { data: apps = [], isLoading } = useQuery<Application[]>({
    queryKey: ["admin-listing-apps"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/admin/expert-listings/all"));
      if (!res.ok) throw new Error("Failed to load applications");
      return res.json();
    },
  });

  const approve = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(apiUrl(`/admin/expert-listings/${id}/approve`), { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Failed to approve");
      }
      return res.json() as Promise<{ ok: boolean; expertSlug: string; checkoutUrl: string }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-listing-apps"] }),
  });

  const reject = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(apiUrl(`/admin/expert-listings/${id}/reject`), { method: "POST" });
      if (!res.ok) throw new Error("Failed to reject");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-listing-apps"] }),
  });

  const filtered = apps.filter((a) => filter === "all" || a.status === filter);
  const pendingCount = apps.filter((a) => a.status === "pending").length;

  return (
    <div>
      <div className="flex gap-1 mb-6 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-xl">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground">No {filter === "all" ? "" : filter} applications.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <div key={app.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-foreground">{app.name}</h3>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{app.role}</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">{app.email}</p>
                </div>
                <span className="text-xs text-muted-foreground/60 shrink-0">
                  {new Date(app.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{app.bio}</p>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {app.zones.map((z) => (
                  <span key={z} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                    {ZONE_LABELS[z] ?? z}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
                {app.website && (
                  <a href={app.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                    <ExternalLink className="w-3 h-3" /> Website
                  </a>
                )}
                {app.podcastFeedUrl && (
                  <a href={app.podcastFeedUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                    <ExternalLink className="w-3 h-3" /> Podcast feed
                  </a>
                )}
                {app.consultUrl && (
                  <a href={app.consultUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                    <ExternalLink className="w-3 h-3" /> Consult link
                  </a>
                )}
              </div>

              {/* Checkout URL for approved apps */}
              {app.checkoutUrl && (
                <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-800 mb-2">Checkout link to send to expert:</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs text-blue-700 break-all flex-1">{app.checkoutUrl}</code>
                    <CopyButton text={app.checkoutUrl} />
                  </div>
                </div>
              )}

              {app.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => approve.mutate(app.id)}
                    disabled={approve.isPending}
                    className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {approve.isPending ? "Approving…" : "Approve & Send Checkout Link"}
                  </button>
                  <button
                    onClick={() => { if (confirm(`Reject application from ${app.name}?`)) reject.mutate(app.id); }}
                    disabled={reject.isPending}
                    className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Dashboard Tab ─────────────────────────── */
function DashboardTab() {
  const { data: stats, isLoading, refetch, isFetching } = useQuery<Stats>({
    queryKey: ["admin-listing-stats"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/admin/expert-listings/stats"));
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
            <CheckCircle className="w-3.5 h-3.5 text-green-600" /> Active
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
            <DollarSign className="w-3.5 h-3.5 text-primary" /> Est. MRR
          </div>
          <p className="text-3xl font-bold text-foreground">${stats.mrr.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
            <XCircle className="w-3.5 h-3.5 text-red-500" /> Lapsed
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.lapsed}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.pending}</p>
        </div>
      </div>

      {/* Upcoming renewals */}
      {stats.upcomingRenewals.length > 0 && (
        <div>
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-amber-500" />
            Renewing in next 7 days
          </h2>
          <div className="space-y-2">
            {stats.upcomingRenewals.map((r) => (
              <div key={r.slug} className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50">
                <span className="font-medium text-sm text-foreground">{r.name}</span>
                <span className="text-xs text-amber-700">
                  {r.currentPeriodEnd ? new Date(r.currentPeriodEnd).toLocaleDateString() : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active members */}
      {stats.activeMembers.length > 0 && (
        <div>
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-green-600" />
            Active Listings
          </h2>
          <div className="space-y-2">
            {stats.activeMembers.map((m) => (
              <div key={m.slug} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <div>
                  <p className="font-medium text-sm text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {m.currentPeriodEnd && (
                    <p>Renews {new Date(m.currentPeriodEnd).toLocaleDateString()}</p>
                  )}
                  {m.approvedAt && (
                    <p className="text-muted-foreground/60">Since {new Date(m.approvedAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lapsed members */}
      {stats.lapsedMembers.length > 0 && (
        <div>
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            Lapsed Listings
          </h2>
          <div className="space-y-2">
            {stats.lapsedMembers.map((m) => (
              <div key={m.slug} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50">
                <div>
                  <p className="font-medium text-sm text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
                {m.currentPeriodEnd && (
                  <p className="text-xs text-muted-foreground">
                    Lapsed {new Date(m.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── Main Page ─────────────────────────── */
type Tab = "applications" | "dashboard";

export function AdminExpertListings() {
  const [tab, setTab] = useState<Tab>("applications");

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Expert Council Listings</h1>
        <p className="text-muted-foreground">
          Review pending applications, issue checkout links, and track active paid listings.
        </p>
      </header>

      <div className="flex gap-1 mb-8 border-b border-border">
        {(["applications", "dashboard"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "applications" ? <ApplicationsTab /> : <DashboardTab />}
    </div>
  );
}
