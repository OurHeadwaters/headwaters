import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute, Link } from "wouter";
import {
  ArrowRight,
  ArrowLeft,
  Users,
  Calendar,
  DollarSign,
  Loader2,
  Lock,
  CheckCircle2,
  Circle,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  description?: string;
  tags?: string[];
}

interface CohortExpert {
  id: number;
  name: string;
  slug: string;
  role: string;
}

interface CohortDetail {
  id: number;
  title: string;
  description: string;
  priceCents: number;
  seats: number;
  startDate: string;
  status: string;
  enrolled: number;
  seatsRemaining: number;
  isEnrolled: boolean;
  expert: CohortExpert;
  transformation: CohortTransformation | null;
}

interface TransformationEpisode {
  id: string;
  title: string;
  slug: string;
  publishedAt: string | null;
  summary: string | null;
}

interface TransformationEpisodesResponse {
  total: number;
  items: TransformationEpisode[];
}

async function fetchCohort(id: string): Promise<CohortDetail> {
  const res = await fetch(apiUrl(`/cohorts/${id}`), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load cohort");
  return res.json();
}

async function fetchTransformationEpisodes(
  slug: string,
): Promise<TransformationEpisodesResponse> {
  const res = await fetch(
    apiUrl(`/transformations/${encodeURIComponent(slug)}/episodes?limit=200`),
  );
  if (!res.ok) throw new Error("Failed to load transformation episodes");
  return res.json();
}

async function createCheckout(cohortId: number): Promise<{ url: string }> {
  const res = await fetch(apiUrl(`/cohorts/${cohortId}/enroll`), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to start checkout");
  return data as { url: string };
}

async function toggleProgress(episodeSlug: string, completed: boolean): Promise<void> {
  const res = await fetch(apiUrl("/track-progress"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ episodeSlug, completed }),
  });
  if (!res.ok) throw new Error("Failed to update progress");
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

function groupByWeek(
  episodes: TransformationEpisode[],
): { week: number; items: TransformationEpisode[] }[] {
  const WEEK_SIZE = 5;
  const groups: { week: number; items: TransformationEpisode[] }[] = [];
  for (let i = 0; i < episodes.length; i += WEEK_SIZE) {
    groups.push({ week: Math.floor(i / WEEK_SIZE) + 1, items: episodes.slice(i, i + WEEK_SIZE) });
  }
  return groups;
}

function EpisodeRow({
  episode,
  completed,
  onToggle,
}: {
  episode: TransformationEpisode;
  completed: boolean;
  onToggle: (slug: string, val: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <button
        onClick={() => onToggle(episode.slug, !completed)}
        className="mt-0.5 shrink-0 transition-colors"
        aria-label={completed ? "Mark incomplete" : "Mark complete"}
      >
        {completed ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <Link href={`/episodes/${episode.slug}`}>
          <span
            className={`text-sm font-medium hover:underline cursor-pointer ${
              completed ? "line-through text-muted-foreground" : "text-foreground"
            }`}
          >
            {episode.title}
          </span>
        </Link>
        {episode.publishedAt && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(episode.publishedAt).getFullYear()}
          </p>
        )}
      </div>
      <Link href={`/episodes/${episode.slug}`}>
        <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary shrink-0 mt-0.5" />
      </Link>
    </div>
  );
}

export function CohortDetailPage() {
  const [, routeParams] = useRoute("/cohorts/:id");
  const cohortId = routeParams?.id ?? "";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [progressMap, setProgressMap] = useState<Set<string>>(new Set());

  const { data: cohort, isLoading, error } = useQuery({
    queryKey: ["cohort", cohortId],
    queryFn: () => fetchCohort(cohortId),
    enabled: !!cohortId,
  });

  const { data: episodesData } = useQuery({
    queryKey: ["transformation-episodes", cohort?.transformation?.slug],
    queryFn: () => fetchTransformationEpisodes(cohort!.transformation!.slug),
    enabled: !!cohort?.isEnrolled && !!cohort.transformation,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("checkout") === "success") {
        toast({ title: "Enrollment confirmed!", description: "Welcome to the cohort." });
        queryClient.invalidateQueries({ queryKey: ["cohort", cohortId] });
        navigate(`/cohorts/${cohortId}`, { replace: true });
      }
    }
  }, []);

  const enrollMutation = useMutation({
    mutationFn: () => createCheckout(cohort!.id),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (err: Error) => {
      toast({ title: "Enrollment failed", description: err.message, variant: "destructive" });
    },
  });

  const progressMutation = useMutation({
    mutationFn: ({ slug, completed }: { slug: string; completed: boolean }) =>
      toggleProgress(slug, completed),
    onMutate: ({ slug, completed }) => {
      setProgressMap((prev) => {
        const next = new Set(prev);
        if (completed) next.add(slug);
        else next.delete(slug);
        return next;
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !cohort) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          Failed to load cohort.
        </div>
      </div>
    );
  }

  const color = cohort.transformation?.color ?? "#6B7280";
  const isFull = cohort.seatsRemaining <= 0;
  const weeks = groupByWeek(episodesData?.items ?? []);
  const totalEpisodes = episodesData?.items.length ?? 0;
  const completedCount = episodesData
    ? episodesData.items.filter((ep) => progressMap.has(ep.slug)).length
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link href="/cohorts">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to cohorts
        </button>
      </Link>

      <div className="rounded-xl border overflow-hidden mb-6" style={{ borderColor: color + "33" }}>
        <div className="px-8 py-7" style={{ background: color + "08" }}>
          {cohort.transformation && (
            <div
              className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5"
              style={{ color }}
            >
              <span>{cohort.transformation.icon}</span>
              {cohort.transformation.from}
              <ArrowRight className="w-3 h-3" />
              {cohort.transformation.to}
            </div>
          )}
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">{cohort.title}</h1>
          <p className="text-muted-foreground">
            Led by{" "}
            <Link href={`/council/${cohort.expert.slug}`}>
              <span className="font-semibold text-foreground hover:underline cursor-pointer">
                {cohort.expert.name}
              </span>
            </Link>
            {cohort.expert.role ? ` · ${cohort.expert.role}` : ""}
          </p>
          {cohort.description && (
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-2xl">
              {cohort.description}
            </p>
          )}
        </div>

        <div
          className="px-8 py-4 flex flex-wrap gap-6 text-sm text-muted-foreground border-t"
          style={{ borderColor: color + "22" }}
        >
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
              `${cohort.seatsRemaining} of ${cohort.seats} seats remaining`
            )}
          </span>
        </div>
      </div>

      {!cohort.isEnrolled && (
        <div className="rounded-xl border border-border bg-card px-8 py-8 text-center mb-8">
          <Lock className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
          <h2 className="font-serif text-xl font-bold mb-2">Enroll to access the dashboard</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Once enrolled you'll get the full week-by-week episode curriculum with progress tracking.
          </p>
          <button
            onClick={() => enrollMutation.mutate()}
            disabled={enrollMutation.isPending || isFull}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: isFull ? "#6B7280" : color }}
          >
            {enrollMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            {isFull ? "Sold Out" : `Enroll for ${formatPrice(cohort.priceCents)}`}
          </button>
        </div>
      )}

      {cohort.isEnrolled && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-bold">Your Curriculum</h2>
            {totalEpisodes > 0 && (
              <span className="text-sm text-muted-foreground">
                {completedCount} / {totalEpisodes} episodes complete
              </span>
            )}
          </div>

          {!episodesData && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {episodesData && weeks.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Episode curriculum loading — check back soon.
            </div>
          )}

          {weeks.map(({ week, items }) => (
            <div key={week} className="mb-6 rounded-xl border border-border overflow-hidden">
              <div
                className="px-5 py-3 text-xs font-bold uppercase tracking-widest"
                style={{ background: color + "12", color }}
              >
                Week {week}
              </div>
              <div className="px-5 divide-y divide-border/50">
                {items.map((ep) => (
                  <EpisodeRow
                    key={ep.id}
                    episode={ep}
                    completed={progressMap.has(ep.slug)}
                    onToggle={(slug, completed) =>
                      progressMutation.mutate({ slug, completed })
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
