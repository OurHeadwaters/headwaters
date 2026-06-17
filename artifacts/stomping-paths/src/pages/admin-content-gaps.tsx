import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Circle, RefreshCw, TrendingUp, MessageSquarePlus, Lock } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface GapRow {
  queryText: string;
  count: number;
  lastSubmittedAt: string;
  resolved: boolean;
}

interface GapsResponse {
  gaps: GapRow[];
}

async function fetchGaps(): Promise<GapsResponse> {
  const res = await fetch(apiUrl("/admin/gaps"), { credentials: "include" });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Authentication required — please log in.");
    throw new Error("Failed to load content gaps");
  }
  return res.json();
}

async function resolveGap(queryText: string, resolved: boolean): Promise<void> {
  const res = await fetch(
    apiUrl(`/admin/gaps/${encodeURIComponent(queryText)}/resolve`),
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved }),
    },
  );
  if (!res.ok) throw new Error("Failed to update gap status");
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

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

export function AdminContentGaps() {
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
    return <AdminLoginWall returnTo="/admin/content-gaps" />;
  }

  return <AdminContentGapsContent />;
}

function AdminContentGapsContent() {
  const queryClient = useQueryClient();
  const [showResolved, setShowResolved] = useState(false);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<GapsResponse>({
    queryKey: ["admin-content-gaps"],
    queryFn: fetchGaps,
    retry: false,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ queryText, resolved }: { queryText: string; resolved: boolean }) =>
      resolveGap(queryText, resolved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-content-gaps"] });
    },
  });

  const gaps = data?.gaps ?? [];
  const filtered = showResolved ? gaps : gaps.filter((g) => !g.resolved);
  const totalUnresolved = gaps.filter((g) => !g.resolved).length;
  const totalResolved = gaps.filter((g) => g.resolved).length;

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
            <MessageSquarePlus className="w-6 h-6 text-primary" />
            Content Gaps
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Topics listeners searched for but couldn't find — real demand data for future episodes.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <div className="text-2xl font-bold font-serif text-foreground">{totalUnresolved}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">Open Gaps</div>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <div className="text-2xl font-bold font-serif text-foreground">{totalResolved}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">Covered</div>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-3">
          <div className="text-2xl font-bold font-serif text-foreground">{gaps.reduce((s, g) => s + g.count, 0)}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">Total Submissions</div>
        </div>
      </div>

      {/* Filter toggle */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-medium text-muted-foreground">Show:</span>
        <button
          onClick={() => setShowResolved(false)}
          className={`text-sm px-3 py-1 rounded-full font-medium transition-colors ${
            !showResolved
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Open only
        </button>
        <button
          onClick={() => setShowResolved(true)}
          className={`text-sm px-3 py-1 rounded-full font-medium transition-colors ${
            showResolved
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <p className="text-destructive font-medium">
            {error instanceof Error ? error.message : "Failed to load content gaps"}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">
            {showResolved ? "No gap submissions yet." : "No open gaps — all topics have been covered!"}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-wider">
                  Topic
                </th>
                <th className="text-center px-3 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-wider w-20">
                  Requests
                </th>
                <th className="text-left px-3 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-wider w-36 hidden sm:table-cell">
                  Last seen
                </th>
                <th className="text-center px-3 py-3 font-semibold text-muted-foreground uppercase text-xs tracking-wider w-28">
                  Covered?
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((gap) => (
                <tr
                  key={gap.queryText}
                  className={`group transition-colors hover:bg-muted/30 ${gap.resolved ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">{gap.queryText}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex items-center justify-center gap-1 font-bold text-foreground">
                      <TrendingUp className="w-3 h-3 text-primary shrink-0" />
                      {gap.count}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground hidden sm:table-cell">
                    {formatDate(gap.lastSubmittedAt)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() =>
                        resolveMutation.mutate({
                          queryText: gap.queryText,
                          resolved: !gap.resolved,
                        })
                      }
                      disabled={resolveMutation.isPending}
                      title={gap.resolved ? "Mark as uncovered" : "Mark as covered"}
                      className="inline-flex items-center gap-1.5 mx-auto text-xs font-semibold transition-colors rounded-full px-2.5 py-1 border"
                      style={
                        gap.resolved
                          ? { color: "var(--primary)", borderColor: "var(--primary)", background: "transparent" }
                          : { color: "var(--muted-foreground)", borderColor: "currentColor", background: "transparent" }
                      }
                    >
                      {gap.resolved ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          Covered
                        </>
                      ) : (
                        <>
                          <Circle className="w-3.5 h-3.5" />
                          Mark covered
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
