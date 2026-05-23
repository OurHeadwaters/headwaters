import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowRight,
  Users,
  Calendar,
  DollarSign,
  Loader2,
  GraduationCap,
  Filter,
} from "lucide-react";
import { useTransformations } from "@/hooks/use-transformations";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface CohortTransformation {
  slug: string;
  from: string;
  to: string;
  icon: string;
  color: string;
}

interface CohortExpert {
  id: number;
  name: string;
  slug: string;
  role: string;
}

interface Cohort {
  id: number;
  title: string;
  description: string;
  priceCents: number;
  seats: number;
  startDate: string;
  status: string;
  enrolled: number;
  seatsRemaining: number;
  expert: CohortExpert;
  transformation: CohortTransformation | null;
}

async function fetchCohorts(transformation?: string): Promise<Cohort[]> {
  const params = transformation ? `?transformation=${encodeURIComponent(transformation)}` : "";
  const res = await fetch(apiUrl(`/cohorts${params}`));
  if (!res.ok) throw new Error("Failed to load cohorts");
  return res.json();
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function PathBadge({ transformation }: { transformation: CohortTransformation }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border"
      style={{
        borderColor: transformation.color + "44",
        background: transformation.color + "15",
        color: transformation.color,
      }}
    >
      <span>{transformation.icon}</span>
      {transformation.from} → {transformation.to}
    </span>
  );
}

function CohortCard({ cohort }: { cohort: Cohort }) {
  const color = cohort.transformation?.color ?? "#6B7280";
  const isFull = cohort.seatsRemaining <= 0;

  return (
    <div
      className="flex flex-col rounded-xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg bg-card"
      style={{ borderColor: color + "33" }}
    >
      <div className="px-6 py-5 flex flex-col gap-3" style={{ borderBottom: `1px solid ${color}22` }}>
        {cohort.transformation && (
          <PathBadge transformation={cohort.transformation} />
        )}
        <h2 className="font-serif text-xl font-bold text-foreground leading-snug">
          {cohort.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          with{" "}
          <span className="font-semibold text-foreground">{cohort.expert.name}</span>
          {cohort.expert.role ? ` · ${cohort.expert.role}` : ""}
        </p>
        {cohort.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {cohort.description}
          </p>
        )}
      </div>

      <div className="px-6 py-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 shrink-0" style={{ color }} />
          Starts {formatDate(cohort.startDate)}
        </span>
        <span className="flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 shrink-0" style={{ color }} />
          {formatPrice(cohort.priceCents)}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="w-4 h-4 shrink-0" style={{ color }} />
          {isFull ? (
            <span className="text-destructive font-semibold">Full</span>
          ) : (
            `${cohort.seatsRemaining} of ${cohort.seats} seats left`
          )}
        </span>
      </div>

      <div className="px-6 pb-5 mt-auto">
        <Link href={`/cohorts/${cohort.id}`}>
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            style={{
              background: isFull ? "#6B728020" : color,
              color: isFull ? "#6B7280" : "#fff",
              cursor: isFull ? "not-allowed" : "pointer",
            }}
            disabled={isFull}
          >
            {isFull ? "Sold Out" : (
              <>
                View Cohort <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </Link>
      </div>
    </div>
  );
}

export function CohortsPage() {
  const [selectedPath, setSelectedPath] = useState<string>("");
  const { data: transformations } = useTransformations();

  const { data: cohorts, isLoading, error } = useQuery({
    queryKey: ["cohorts", selectedPath],
    queryFn: () => fetchCohorts(selectedPath || undefined),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <GraduationCap className="w-8 h-8 text-primary" />
          <h1 className="font-serif text-3xl font-bold">Transformation Path Cohorts</h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Guided cohort programs led by Expert Council members. Work through a transformation path
          alongside fellow students with structured weekly content and expert guidance.
        </p>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedPath("")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              !selectedPath
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            All Paths
          </button>
          {(transformations ?? []).map((t) => (
            <button
              key={t.slug}
              onClick={() => setSelectedPath(selectedPath === t.slug ? "" : t.slug)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
              style={
                selectedPath === t.slug
                  ? { background: t.color, color: "#fff", borderColor: t.color }
                  : { borderColor: t.color + "44", color: t.color }
              }
            >
              {t.icon} {t.from} → {t.to}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          Failed to load cohorts. Please try again.
        </div>
      )}

      {cohorts && cohorts.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No open cohorts right now</p>
          <p className="text-sm mt-1">Check back soon — new cohorts are added regularly.</p>
        </div>
      )}

      {cohorts && cohorts.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2">
          {cohorts.map((cohort) => (
            <CohortCard key={cohort.id} cohort={cohort} />
          ))}
        </div>
      )}
    </div>
  );
}
