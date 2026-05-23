import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getHwHeaders } from "@/lib/api-utils";
import { ClipboardList, ChevronDown, ChevronUp, User, Mail, Home, MapPin, Target, ShieldCheck, MessageSquare, Calendar } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

type Submission = {
  submissionId: string;
  name: string;
  email: string;
  householdSize: number | null;
  landSituation: string | null;
  landYears: string | null;
  keySkills: string | null;
  primaryGoals: string | null;
  riskTolerance: string | null;
  additionalNotes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  new: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  reviewed: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30" },
  scheduled: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  completed: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30" },
  declined: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
};

const STATUS_OPTIONS = ["new", "reviewed", "scheduled", "completed", "declined"];

const RISK_LABELS: Record<string, string> = {
  conservative: "Conservative — one step at a time",
  moderate: "Moderate — structured but handles a few things at once",
  open: "Open — motivated, likes options",
  "self-directed": "Self-directed — experienced, wants the full map",
};

function FieldRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex gap-3 py-2 border-b border-border last:border-0">
      <div className="flex-shrink-0 pt-0.5">
        <Icon size={14} className="text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm text-foreground whitespace-pre-wrap break-words">{String(value)}</p>
      </div>
    </div>
  );
}

function SubmissionCard({ submission }: { submission: Submission }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(apiUrl(`/headwaters/intake/${submission.submissionId}`), {
        method: "PATCH",
        ...getHwHeaders(),
        headers: {
          ...getHwHeaders().headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hw-submissions"] });
    },
  });

  const colors = STATUS_COLORS[submission.status] ?? STATUS_COLORS.new;
  const date = new Date(submission.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm text-foreground truncate">{submission.name}</p>
            <p className="text-xs text-muted-foreground truncate">{submission.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar size={11} />
            {date}
          </div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
          >
            {submission.status}
          </span>
          {expanded ? (
            <ChevronUp size={15} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={15} className="text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-4">
          <div className="rounded-lg border border-border bg-background divide-y divide-border">
            <FieldRow icon={Mail} label="Email" value={submission.email} />
            <FieldRow icon={Home} label="Household size" value={submission.householdSize ? `${submission.householdSize} people` : null} />
            <FieldRow icon={MapPin} label="Land situation" value={submission.landSituation} />
            <FieldRow icon={Calendar} label="How long they've been at it" value={submission.landYears} />
            <FieldRow icon={ShieldCheck} label="Key skills" value={submission.keySkills} />
            <FieldRow icon={Target} label="Primary goals" value={submission.primaryGoals} />
            <FieldRow
              icon={ShieldCheck}
              label="Risk tolerance"
              value={submission.riskTolerance ? RISK_LABELS[submission.riskTolerance] ?? submission.riskTolerance : null}
            />
            <FieldRow icon={MessageSquare} label="Additional notes" value={submission.additionalNotes} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Status:</span>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                disabled={isPending || submission.status === s}
                onClick={() => updateStatus(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all disabled:opacity-50 ${
                  submission.status === s
                    ? `${STATUS_COLORS[s]?.bg} ${STATUS_COLORS[s]?.text} ${STATUS_COLORS[s]?.border}`
                    : "bg-secondary text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: submissions = [], isLoading, error } = useQuery<Submission[]>({
    queryKey: ["hw-submissions"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/headwaters/intake"), getHwHeaders());
      if (!res.ok) throw new Error("Failed to load submissions");
      return res.json();
    },
  });

  const filtered = statusFilter === "all"
    ? submissions
    : submissions.filter((s) => s.status === statusFilter);

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = submissions.filter((sub) => sub.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList size={20} className="text-primary" />
            <h1 className="font-serif text-2xl font-bold">Intake Submissions</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {submissions.length} total — visitor-submitted intake forms
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === "all"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          All ({submissions.length})
        </button>
        {STATUS_OPTIONS.map((s) => {
          const colors = STATUS_COLORS[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                statusFilter === s
                  ? `${colors?.bg} ${colors?.text}`
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {s} ({counts[s] ?? 0})
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground py-8 text-center">Loading submissions…</div>
      )}
      {error && (
        <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-4">
          Failed to load submissions
        </div>
      )}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {statusFilter === "all" ? "No submissions yet." : `No ${statusFilter} submissions.`}
          </p>
        </div>
      )}
      <div className="space-y-3">
        {filtered.map((s) => (
          <SubmissionCard key={s.submissionId} submission={s} />
        ))}
      </div>
    </div>
  );
}
