import { useQuery } from "@tanstack/react-query";
import { Heart, DollarSign, RefreshCw, AlertTriangle, Users, Lock } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface GordTipStats {
  tipCount: number;
  totalRevenueCents: number;
}

interface GordTipRow {
  id: number;
  stripeCheckoutSessionId: string | null;
  amountPaidCents: number;
  tipperEmail: string | null;
  tipperName: string | null;
  tippedAt: string;
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
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

export function AdminGordTips() {
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
    return <AdminLoginWall returnTo="/admin/gord-tips" />;
  }

  return <AdminGordTipsContent />;
}

function AdminGordTipsContent() {
  const stats = useQuery<GordTipStats>({
    queryKey: ["admin-gord-tips-stats"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/admin/gord-tips/stats"), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load Gord tip stats");
      return res.json();
    },
    refetchInterval: 60_000,
  });

  const tips = useQuery<GordTipRow[]>({
    queryKey: ["admin-gord-tips"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/admin/gord-tips"), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load Gord tips");
      return res.json();
    },
    refetchInterval: 60_000,
  });

  const isLoading = stats.isLoading || tips.isLoading;
  const error = stats.error || tips.error;

  function handleRefresh() {
    stats.refetch();
    tips.refetch();
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#D9A066]/15 p-2 rounded-xl">
              <Heart className="w-5 h-5 text-[#D9A066]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Gord Tips</h1>
              <p className="text-white/40 text-sm">Supporter tips · auto-refreshes every minute</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
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
              <div className="font-semibold">Failed to load tips</div>
              <div className="text-sm text-red-400 mt-0.5">{(error as Error).message}</div>
            </div>
          </div>
        )}

        {stats.data && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard
              icon={Users}
              label="Total Tips"
              value={stats.data.tipCount.toLocaleString()}
              sub="All-time tip count"
              accent
            />
            <StatCard
              icon={DollarSign}
              label="Total Revenue"
              value={formatCents(stats.data.totalRevenueCents)}
              sub="All-time tip revenue"
            />
          </div>
        )}

        {tips.data && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10">
              <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wider">
                Recent Tips
              </h2>
            </div>

            {tips.data.length === 0 ? (
              <div className="text-center text-white/30 text-sm py-12">
                No tips recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {tips.data.map((tip) => (
                  <div key={tip.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {tip.tipperName || <span className="text-white/30 italic">Anonymous</span>}
                      </div>
                      {tip.tipperEmail && (
                        <div className="text-xs text-white/40 mt-0.5 truncate">{tip.tipperEmail}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                      <span className="text-[#D9A066] font-semibold text-sm">
                        {formatCents(tip.amountPaidCents)}
                      </span>
                      <span className="text-white/30 text-xs tabular-nums">
                        {formatDate(tip.tippedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminGordTips;
