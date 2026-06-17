import { useQuery } from "@tanstack/react-query";
import { Share2, Loader2, TrendingUp } from "lucide-react";
import { fetchAuthUser, type AuthUserResponse, AdminLoginWall } from "@/lib/admin-auth";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface ShareRow {
  surface: string;
  slug: string;
  share_count: number;
  last_shared_at: string;
}

interface SharesResponse {
  shares: ShareRow[];
  total: number;
}

function surfaceLabel(surface: string): string {
  if (surface === "kit") return "Kit";
  if (surface === "track") return "Track";
  if (surface === "transform") return "Path";
  return surface;
}

function surfaceColor(surface: string): string {
  if (surface === "kit") return "#E8853D";
  if (surface === "track") return "#5C9E5C";
  if (surface === "transform") return "#8B6BB1";
  return "#6B7280";
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


export function AdminShares() {
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
    return <AdminLoginWall returnTo="/admin/shares" />;
  }

  return <AdminSharesContent />;
}

function AdminSharesContent() {
  const { data, isLoading, isError } = useQuery<SharesResponse>({
    queryKey: ["admin-shares"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/admin/shares"), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load share stats");
      return res.json();
    },
    refetchInterval: 60_000,
  });

  const shares = data?.shares ?? [];
  const total = data?.total ?? 0;

  const byKits = shares.filter((r) => r.surface === "kit");
  const byTracks = shares.filter((r) => r.surface === "track");
  const byPaths = shares.filter((r) => r.surface === "transform");

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Share2 className="w-7 h-7 text-primary" />
        <h1 className="font-serif text-2xl font-bold">Share Analytics</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card px-5 py-4 col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Total Shares
          </p>
          <p className="font-serif text-3xl font-bold">{total.toLocaleString()}</p>
        </div>
        {[
          { label: "Kit Shares", data: byKits, color: surfaceColor("kit") },
          { label: "Track Shares", data: byTracks, color: surfaceColor("track") },
          { label: "Path Shares", data: byPaths, color: surfaceColor("transform") },
        ].map(({ label, data: rows, color }) => {
          const count = rows.reduce((s, r) => s + r.share_count, 0);
          return (
            <div key={label} className="rounded-xl border border-border bg-card px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color }}>
                {label}
              </p>
              <p className="font-serif text-3xl font-bold">{count.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 text-muted-foreground py-16 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading share data…</span>
        </div>
      )}

      {isError && (
        <div className="text-center py-16 text-muted-foreground">
          Failed to load share stats. Check your permissions.
        </div>
      )}

      {!isLoading && !isError && shares.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Share2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No shares recorded yet.</p>
          <p className="text-sm mt-1">Share events appear here when visitors use the share buttons.</p>
        </div>
      )}

      {shares.length > 0 && (
        <div className="space-y-8">
          {[
            { label: "Kits", rows: byKits, surface: "kit" },
            { label: "Tracks", rows: byTracks, surface: "track" },
            { label: "Transformation Paths", rows: byPaths, surface: "transform" },
          ].filter(({ rows }) => rows.length > 0).map(({ label, rows, surface }) => (
            <section key={surface}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4" style={{ color: surfaceColor(surface) }} />
                <h2 className="font-serif text-lg font-bold text-foreground">{label}</h2>
                <span className="text-xs text-muted-foreground">
                  — {rows.reduce((s, r) => s + r.share_count, 0).toLocaleString()} total shares
                </span>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        Slug
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        Shares
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                        Last Shared
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr
                        key={`${row.surface}-${row.slug}`}
                        className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          <span
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mr-2"
                            style={{
                              color: surfaceColor(surface),
                              background: surfaceColor(surface) + "18",
                              border: `1px solid ${surfaceColor(surface)}33`,
                            }}
                          >
                            {surfaceLabel(surface)}
                          </span>
                          {row.slug}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-foreground">
                          {row.share_count.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                          {formatDate(row.last_shared_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
