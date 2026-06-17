import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Users,
  DollarSign,
  Calendar,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  GraduationCap,
} from "lucide-react";
import { fetchAuthUser, type AuthUserResponse, AdminLoginWall } from "@/lib/admin-auth";
import { useToast } from "@/hooks/use-toast";
import { useTransformations } from "@/hooks/use-transformations";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface Expert {
  id: number;
  name: string;
  slug: string;
  role: string;
}

interface CohortRow {
  id: number;
  title: string;
  description: string;
  priceCents: number;
  seats: number;
  startDate: string;
  status: string;
  enrollmentCount: number;
  revenueCents: number;
  expert: { id: number; name: string; slug: string };
  transformation: { slug: string; from: string; to: string; icon: string; color: string } | null;
}

interface Enrollment {
  id: number;
  userId: string;
  stripeCheckoutSessionId: string;
  amountPaidCents: number;
  enrolledAt: string;
}

async function fetchCohorts(): Promise<CohortRow[]> {
  const res = await fetch(apiUrl("/admin/cohorts"), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load cohorts");
  return res.json();
}

async function fetchExperts(): Promise<Expert[]> {
  const res = await fetch(apiUrl("/admin/experts-list"), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load experts");
  return res.json();
}

async function fetchEnrollments(cohortId: number): Promise<Enrollment[]> {
  const res = await fetch(apiUrl(`/admin/cohorts/${cohortId}/enrollments`), {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load enrollments");
  return res.json();
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

type StatusKey = "draft" | "approved" | "active" | "closed";

const STATUS_LABELS: Record<StatusKey, string> = {
  draft: "Draft",
  approved: "Approved",
  active: "Active",
  closed: "Closed",
};

function StatusBadge({ status }: { status: string }) {
  const s = status as StatusKey;
  const configs: Record<StatusKey, { icon: React.ReactNode; cls: string }> = {
    draft: {
      icon: <Clock className="w-3 h-3" />,
      cls: "bg-muted text-muted-foreground border-border",
    },
    approved: {
      icon: <CheckCircle className="w-3 h-3" />,
      cls: "bg-blue-50 text-blue-600 border-blue-200",
    },
    active: {
      icon: <CheckCircle className="w-3 h-3" />,
      cls: "bg-green-50 text-green-600 border-green-200",
    },
    closed: {
      icon: <XCircle className="w-3 h-3" />,
      cls: "bg-red-50 text-red-500 border-red-200",
    },
  };
  const cfg = configs[s] ?? configs.draft;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${cfg.cls}`}
    >
      {cfg.icon}
      {STATUS_LABELS[s] ?? status}
    </span>
  );
}

const BLANK_FORM = {
  expertId: "",
  transformationSlug: "",
  title: "",
  description: "",
  priceDollars: "",
  seats: "",
  startDate: "",
  status: "draft",
};

function CohortForm({
  experts,
  transformations,
  onSubmit,
  isPending,
  onCancel,
}: {
  experts: Expert[];
  transformations: { slug: string; from: string; to: string; icon: string }[];
  onSubmit: (data: Record<string, unknown>) => void;
  isPending: boolean;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(BLANK_FORM);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(form.priceDollars) * 100);
    const seats = parseInt(form.seats, 10);
    if (!Number.isFinite(priceCents) || priceCents <= 0) return;
    if (!Number.isFinite(seats) || seats <= 0) return;
    onSubmit({
      expertId: parseInt(form.expertId, 10),
      transformationSlug: form.transformationSlug,
      title: form.title.trim(),
      description: form.description.trim(),
      priceCents,
      seats,
      startDate: form.startDate,
      status: form.status,
    });
  }

  const inputCls =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const labelCls = "block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Expert *</label>
          <select
            className={inputCls}
            value={form.expertId}
            onChange={(e) => set("expertId", e.target.value)}
            required
          >
            <option value="">Select an expert…</option>
            {experts.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} · {e.role}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Transformation Path *</label>
          <select
            className={inputCls}
            value={form.transformationSlug}
            onChange={(e) => set("transformationSlug", e.target.value)}
            required
          >
            <option value="">Select a path…</option>
            {transformations.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.icon} {t.from} → {t.to}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>Cohort Title *</label>
          <input
            className={inputCls}
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Spring 2026 — Employee to Owner Cohort"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>Description</label>
          <textarea
            className={`${inputCls} min-h-[80px] resize-y`}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What will students get out of this cohort?"
          />
        </div>

        <div>
          <label className={labelCls}>Price (USD) *</label>
          <input
            className={inputCls}
            type="number"
            min="1"
            step="0.01"
            value={form.priceDollars}
            onChange={(e) => set("priceDollars", e.target.value)}
            placeholder="297.00"
            required
          />
        </div>

        <div>
          <label className={labelCls}>Seats *</label>
          <input
            className={inputCls}
            type="number"
            min="1"
            value={form.seats}
            onChange={(e) => set("seats", e.target.value)}
            placeholder="20"
            required
          />
        </div>

        <div>
          <label className={labelCls}>Start Date *</label>
          <input
            className={inputCls}
            type="date"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            required
          />
        </div>

        <div>
          <label className={labelCls}>Status</label>
          <select
            className={inputCls}
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="approved">Approved (public)</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Cohort
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function EnrollmentsPanel({ cohortId }: { cohortId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-enrollments", cohortId],
    queryFn: () => fetchEnrollments(cohortId),
  });

  if (isLoading) {
    return (
      <div className="py-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading enrollments…
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">No enrollments yet.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs font-semibold text-muted-foreground border-b border-border">
          <th className="pb-2 pr-4">User ID</th>
          <th className="pb-2 pr-4">Enrolled</th>
          <th className="pb-2 pr-4">Amount Paid</th>
          <th className="pb-2">Session ID</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id} className="border-b border-border/50 last:border-0">
            <td className="py-2 pr-4 font-mono text-xs text-muted-foreground truncate max-w-[120px]">
              {row.userId}
            </td>
            <td className="py-2 pr-4 text-muted-foreground">{formatDate(row.enrolledAt)}</td>
            <td className="py-2 pr-4 font-semibold">{formatPrice(row.amountPaidCents)}</td>
            <td className="py-2 font-mono text-xs text-muted-foreground truncate max-w-[160px]">
              {row.stripeCheckoutSessionId}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CohortCard({
  cohort,
  onDelete,
  onStatusChange,
}: {
  cohort: CohortRow;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = cohort.transformation?.color ?? "#6B7280";

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {cohort.transformation && (
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                style={{ borderColor: color + "44", background: color + "12", color }}
              >
                {cohort.transformation.icon} {cohort.transformation.from} →{" "}
                {cohort.transformation.to}
              </span>
            )}
            <StatusBadge status={cohort.status} />
          </div>
          <h3 className="font-semibold text-foreground">{cohort.title}</h3>
          <p className="text-sm text-muted-foreground">
            {cohort.expert.name} · Starts {formatDate(cohort.startDate)}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {cohort.enrollmentCount}/{cohort.seats}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            {formatPrice(cohort.revenueCents)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatPrice(cohort.priceCents)}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <select
            className="text-xs border border-input rounded px-2 py-1 bg-background"
            value={cohort.status}
            onChange={(e) => onStatusChange(cohort.id, e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
          {cohort.status === "draft" && (
            <button
              onClick={() => onDelete(cohort.id)}
              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Delete draft cohort"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-5 py-4">
          {cohort.description && (
            <p className="text-sm text-muted-foreground mb-4">{cohort.description}</p>
          )}
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Enrollments
          </h4>
          <EnrollmentsPanel cohortId={cohort.id} />
        </div>
      )}
    </div>
  );
}


export function AdminCohorts() {
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
    return <AdminLoginWall returnTo="/admin/cohorts" />;
  }

  return <AdminCohortsContent />;
}

function AdminCohortsContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: cohorts, isLoading } = useQuery({
    queryKey: ["admin-cohorts"],
    queryFn: fetchCohorts,
  });

  const { data: experts } = useQuery({
    queryKey: ["admin-experts-list"],
    queryFn: fetchExperts,
  });

  const { data: transformations } = useTransformations();

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(apiUrl("/admin/cohorts"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error ?? "Failed to create");
      return j;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cohorts"] });
      setShowForm(false);
      toast({ title: "Cohort created" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create cohort", description: err.message, variant: "destructive" });
    },
  });

  const patchMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(apiUrl(`/admin/cohorts/${id}`), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-cohorts"] }),
    onError: (err: Error) =>
      toast({ title: "Update failed", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(apiUrl(`/admin/cohorts/${id}`), {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-cohorts"] }),
    onError: (err: Error) =>
      toast({ title: "Delete failed", description: err.message, variant: "destructive" }),
  });

  const totalRevenue = cohorts?.reduce((sum, c) => sum + c.revenueCents, 0) ?? 0;
  const totalEnrolled = cohorts?.reduce((sum, c) => sum + c.enrollmentCount, 0) ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-7 h-7 text-primary" />
          <h1 className="font-serif text-2xl font-bold">Cohort Admin</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          New Cohort
        </button>
      </div>

      {showForm && experts && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-6 py-6 mb-6">
          <h2 className="font-semibold text-foreground mb-4">Create New Cohort</h2>
          <CohortForm
            experts={experts}
            transformations={transformations ?? []}
            onSubmit={(data) => createMutation.mutate(data)}
            isPending={createMutation.isPending}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Total Cohorts
          </p>
          <p className="font-serif text-2xl font-bold">{cohorts?.length ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Enrollments
          </p>
          <p className="font-serif text-2xl font-bold">{totalEnrolled}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Revenue
          </p>
          <p className="font-serif text-2xl font-bold">{formatPrice(totalRevenue)}</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {cohorts && cohorts.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No cohorts yet</p>
          <p className="text-sm mt-1">Create your first cohort to get started.</p>
        </div>
      )}

      <div className="space-y-3">
        {cohorts?.map((cohort) => (
          <CohortCard
            key={cohort.id}
            cohort={cohort}
            onDelete={(id) => deleteMutation.mutate(id)}
            onStatusChange={(id, status) => patchMutation.mutate({ id, status })}
          />
        ))}
      </div>
    </div>
  );
}
