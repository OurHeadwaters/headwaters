import { useQuery } from "@tanstack/react-query";
import { Shield, TrendingUp, Users, RefreshCw, AlertTriangle, TrendingDown } from "lucide-react";
import { fetchAuthUser, type AuthUserResponse, AdminLoginWall } from "@/lib/admin-auth";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface BrigadeStats {
  activeMembers: number;
  mrr: number;
  renewalsNext30Days: number;
  pastDueMembers: number;
  churnLast30Days: number;
  breakdown: { plan: string; count: number }[];
}

async function fetchStats(): Promise<BrigadeStats> {
  const res = await fetch(apiUrl("/admin/brigade/stats"), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load Brigade stats");
  return res.json();
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? "bg-[#D9A066]/10 border-[#D9A066]/30" : "bg-white/5 border-white/10"}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${accent ? "text-[#D9A066]" : "text-white/50"}`} />
        <span className="text-white/50 text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${accent ? "text-[#D9A066]" : "text-white"}`}>{value}</div>
      {sub && <div className="text-white/40 text-xs mt-1">{sub}</div>}
    </div>
  );
}


export function AdminBrigade() {
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
    return <AdminLoginWall returnTo="/admin/brigade" />;
  }

  return <AdminBrigadeContent />;
}

function AdminBrigadeContent() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-brigade-stats"],
    queryFn: fetchStats,
    refetchInterval: 60_000,
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#D9A066]/15 p-2 rounded-xl">
              <Shield className="w-5 h-5 text-[#D9A066]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Headwaters Membership</h1>
              <p className="text-white/40 text-sm">Read-only overview · auto-refreshes every minute</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-5 h-5 text-white/30 animate-spin" />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 bg-red-900/30 border border-red-500/30 rounded-xl px-5 py-4 text-red-300">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Failed to load stats</div>
              <div className="text-sm text-red-400 mt-0.5">{(error as Error).message}</div>
            </div>
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <StatCard
                icon={Users}
                label="Active Members"
                value={data.activeMembers.toLocaleString()}
                accent
              />
              <StatCard
                icon={TrendingUp}
                label="MRR"
                value={`$${data.mrr.toFixed(0)}`}
                sub="Monthly recurring revenue"
              />
              <StatCard
                icon={RefreshCw}
                label="Renewing (30d)"
                value={data.renewalsNext30Days.toLocaleString()}
                sub="Renewals in next 30 days"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard
                icon={AlertTriangle}
                label="Past Due"
                value={data.pastDueMembers.toLocaleString()}
                sub="Stripe is retrying payments"
                accent={data.pastDueMembers > 0}
              />
              <StatCard
                icon={TrendingDown}
                label="Churn (30d)"
                value={data.churnLast30Days.toLocaleString()}
                sub="Cancellations in last 30 days"
                accent={data.churnLast30Days > 0}
              />
            </div>

            {data.breakdown.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-4">
                  Plan Breakdown
                </h2>
                <div className="flex flex-col gap-3">
                  {data.breakdown.map((row) => (
                    <div key={row.plan} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#D9A066]" />
                        <span className="text-white capitalize text-sm">{row.plan}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white/50 text-sm">
                          {row.plan === "monthly" ? "$9/mo" : "$97/yr"}
                        </span>
                        <span className="text-white font-semibold text-sm">
                          {row.count.toLocaleString()} {row.count === 1 ? "member" : "members"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.activeMembers === 0 && (
              <div className="mt-4 text-center text-white/30 text-sm py-8">
                No active Headwaters members yet. Share <code className="text-white/50">/brigade</code> to get started.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminBrigade;
