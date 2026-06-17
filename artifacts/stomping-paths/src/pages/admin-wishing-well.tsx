import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, Coins, RefreshCw, CheckCircle, Clock, CreditCard, Wallet, AlertTriangle, TrendingUp } from "lucide-react";
import { fetchAuthUser, type AuthUserResponse, AdminLoginWall } from "@/lib/admin-auth";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface Distribution {
  id: number;
  drawDate: string;
  totalUnits: number;
  totalUsdCents: number;
  creatorShareUnits: number;
  winnerShareUnits: number;
  winnerShareUsdCents: number;
  winnerWishText: string | null;
  winnerListenerName: string | null;
  winnerImpactNote: string | null;
  winnerPaymentMethod: string;
  payoutStatus: string;
  currency: string;
  createdAt: string;
}

interface DrawResult {
  distribution: Distribution;
  creditIssued: boolean;
  xrpUsdRate: number;
}

interface XrpRateHealth {
  rate: number;
  source: string;
  fetchedAt: string | null;
  ageMinutes: number | null;
  isStale: boolean;
}

interface AdminData {
  distributions: Distribution[];
  todayPot: {
    date: string;
    tipCount: number;
    totalUnits: number;
    totalUsdCents: number;
    currency: string;
    fiatCount: number;
    fiatUnits: number;
    cryptoCount: number;
    cryptoUnits: number;
    xrpUsdRate: number;
    xrpRateSource?: string;
    xrpRateFetchedAt?: string;
  };
}

async function fetchXrpRateHealth(): Promise<XrpRateHealth> {
  const res = await fetch(apiUrl("/admin/xrp-rate/health"), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load XRP rate health");
  return res.json();
}

async function fetchAdminData(): Promise<AdminData> {
  const res = await fetch(apiUrl("/admin/wishing-well"), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load admin data");
  return res.json();
}

async function runDraw(date?: string): Promise<DrawResult> {
  const res = await fetch(apiUrl("/admin/wishing-well/draw"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ date }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error((j as { error?: string }).error ?? "Draw failed");
  return j;
}

async function markPayoutSent(date: string): Promise<Distribution> {
  const res = await fetch(apiUrl(`/admin/wishing-well/distributions/${date}/payout`), {
    method: "PATCH",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to update payout");
  return res.json();
}

function formatDate(d: string): string {
  try {
    return new Date(d + "T12:00:00Z").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function PaymentMethodBadge({ method }: { method: string }) {
  if (method === "stripe") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
        <CreditCard className="w-3 h-3" />
        Card
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 font-medium">
      <Wallet className="w-3 h-3" />
      Crypto
    </span>
  );
}

function PayoutStatusBadge({ status, method }: { status: string; method: string }) {
  if (status === "sent") {
    return (
      <span className="flex items-center gap-1 text-green-600 font-medium">
        <CheckCircle className="w-3.5 h-3.5" />
        Sent
      </span>
    );
  }
  if (status === "credit_issued") {
    return (
      <span className="flex items-center gap-1 text-blue-600 font-medium">
        <CreditCard className="w-3.5 h-3.5" />
        Credit issued
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-amber-600 font-medium">
      <Clock className="w-3.5 h-3.5" />
      {method === "stripe" ? "Credit pending" : "XRP pending"}
    </span>
  );
}

function formatFetchedAt(fetchedAt: string | undefined): string {
  if (!fetchedAt) return "unknown";
  try {
    const d = new Date(fetchedAt);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return fetchedAt;
  }
}

function isStale(fetchedAt: string | undefined): boolean {
  if (!fetchedAt) return true;
  try {
    const age = Date.now() - new Date(fetchedAt).getTime();
    return age > 60 * 60 * 1000;
  } catch {
    return true;
  }
}

function XrpRateInfo({
  rate,
  source,
  fetchedAt,
}: {
  rate: number;
  source?: string;
  fetchedAt?: string;
}) {
  const isFallback = source === "fallback" || source === "env";
  const stale = isStale(fetchedAt);
  const warn = isFallback || stale;

  return (
    <div
      className={`mt-3 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${
        warn
          ? "bg-amber-50 border-amber-200 text-amber-800"
          : "bg-emerald-50 border-emerald-200 text-emerald-800"
      }`}
    >
      {warn ? (
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
      ) : (
        <TrendingUp className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
      )}
      <span>
        <span className="font-semibold">1 XRP = ${rate.toFixed(4)}</span>
        {source && (
          <span className="ml-1.5 opacity-75">
            ·{" "}
            <span className={isFallback ? "font-medium text-amber-700" : ""}>
              {isFallback ? "fallback rate" : "live"}
            </span>
          </span>
        )}
        <span className="ml-1.5 opacity-75">
          · updated {formatFetchedAt(fetchedAt)}
          {stale && <span className="ml-1 font-medium text-amber-700">(stale)</span>}
        </span>
      </span>
    </div>
  );
}


export function AdminWishingWell() {
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
    return <AdminLoginWall returnTo="/admin/wishing-well" />;
  }

  return <AdminWishingWellContent />;
}

function AdminWishingWellContent() {
  const qc = useQueryClient();
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-wishing-well"],
    queryFn: fetchAdminData,
    refetchInterval: 60_000,
  });

  const { data: rateHealth } = useQuery({
    queryKey: ["xrp-rate-health"],
    queryFn: fetchXrpRateHealth,
    refetchInterval: 60_000,
  });

  const todayDrawn = data
    ? data.distributions.some((d) => d.drawDate === data.todayPot.date)
    : false;

  const draw = useMutation({
    mutationFn: () => runDraw(),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["admin-wishing-well"] });
      setDrawResult(result);
      setTimeout(() => setDrawResult(null), 12000);
    },
  });

  const payout = useMutation({
    mutationFn: markPayoutSent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-wishing-well"] });
    },
  });

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 max-w-5xl">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <span className="text-3xl">🪙</span> Wishing Well — Admin
        </h1>
        <p className="text-muted-foreground">
          Monitor daily pot totals, run draws, and track payout status.
        </p>
      </header>

      {/* XRP Rate Staleness Warning */}
      {rateHealth?.isStale && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-800">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
          <div className="text-sm">
            <p className="font-semibold mb-0.5">XRP price feed may be stale</p>
            <p>
              {rateHealth.fetchedAt === null
                ? "No live rate has been fetched yet — using the fallback default. CoinGecko may be unreachable."
                : `Last successful fetch was ${rateHealth.ageMinutes} min${rateHealth.ageMinutes === 1 ? "" : "s"} ago (expected every 15 min). CoinGecko may be down.`}
              {" "}Pot USD values are based on a rate of <strong>${rateHealth.rate.toFixed(4)}</strong> and may not reflect the current market price.
            </p>
          </div>
        </div>
      )}

      {/* Today's Pot + Draw Action */}
      {data && (
        <div className="mb-8 p-5 rounded-xl border border-[#2C4A36]/30 bg-[#2C4A36]/5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-4 h-4 text-[#2C4A36]" />
                <span className="font-semibold text-foreground">
                  Today's Pending Pot ({data.todayPot.date})
                </span>
                {todayDrawn && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Draw complete
                  </span>
                )}
              </div>

              {/* Combined pot */}
              <p className="text-2xl font-bold text-foreground mb-3">
                {formatUsd(data.todayPot.totalUsdCents)}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  combined pot · {data.todayPot.tipCount} tips
                </span>
              </p>

              {/* Fiat / Crypto breakdown */}
              {data.todayPot.tipCount > 0 && (
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-blue-700 font-medium">
                      {data.todayPot.fiatCount} card{" "}
                      <span className="font-normal text-blue-600">
                        (${data.todayPot.fiatUnits})
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200">
                    <Wallet className="w-3.5 h-3.5 text-violet-600" />
                    <span className="text-violet-700 font-medium">
                      {data.todayPot.cryptoCount} crypto{" "}
                      <span className="font-normal text-violet-600">
                        ({data.todayPot.cryptoUnits} XRP ≈{" "}
                        {formatUsd(
                          Math.round(data.todayPot.cryptoUnits * data.todayPot.xrpUsdRate * 100),
                        )}
                        )
                      </span>
                    </span>
                  </div>
                </div>
              )}

              {/* XRP Rate Info */}
              <XrpRateInfo
                rate={data.todayPot.xrpUsdRate}
                source={data.todayPot.xrpRateSource}
                fetchedAt={data.todayPot.xrpRateFetchedAt}
              />
            </div>

            <button
              onClick={() => draw.mutate()}
              disabled={draw.isPending || todayDrawn || data.todayPot.tipCount === 0}
              title={
                todayDrawn
                  ? "Draw already run for today"
                  : data.todayPot.tipCount === 0
                    ? "No tips in the pot yet"
                    : "Run today's draw"
              }
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2C4A36] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${draw.isPending ? "animate-spin" : ""}`} />
              {todayDrawn ? "Draw Done" : draw.isPending ? "Running…" : "Run Today's Draw"}
            </button>
          </div>

          {/* Draw error */}
          {draw.isError && (
            <p className="mt-3 text-sm text-destructive">
              {draw.error instanceof Error ? draw.error.message : "Draw failed"}
            </p>
          )}

          {/* Draw success result */}
          {drawResult && (
            <div className="mt-4 p-4 rounded-lg bg-[#2C4A36]/10 border border-[#2C4A36]/20">
              <p className="text-sm font-semibold text-[#2C4A36] mb-1">
                ✓ Draw complete!
              </p>
              <div className="text-sm text-foreground space-y-0.5">
                <p>
                  <span className="font-medium">Winner:</span>{" "}
                  {drawResult.distribution.winnerListenerName ?? "Anonymous"}{" "}
                  <PaymentMethodBadge method={drawResult.distribution.winnerPaymentMethod} />
                </p>
                {drawResult.distribution.winnerWishText && (
                  <p className="text-muted-foreground italic">
                    "{drawResult.distribution.winnerWishText}"
                  </p>
                )}
                <p>
                  <span className="font-medium">Reward:</span>{" "}
                  {formatUsd(drawResult.distribution.winnerShareUsdCents)}{" "}
                  {drawResult.creditIssued ? (
                    <span className="text-blue-600 font-medium">— platform credit issued</span>
                  ) : (
                    <span className="text-violet-600 font-medium">
                      ({drawResult.distribution.winnerShareUnits}{" "}
                      {drawResult.distribution.currency}) — XRP payout pending
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Distributions Table */}
      <h2 className="font-serif text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-[#D9A066]" />
        Distribution History
      </h2>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !data || data.distributions.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground">No draws have been run yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 pr-4 font-semibold text-muted-foreground">Date</th>
                <th className="pb-3 pr-4 font-semibold text-muted-foreground">Pot (USD)</th>
                <th className="pb-3 pr-4 font-semibold text-muted-foreground">Creator (50%)</th>
                <th className="pb-3 pr-4 font-semibold text-muted-foreground">Winner (50%)</th>
                <th className="pb-3 pr-4 font-semibold text-muted-foreground">Winner</th>
                <th className="pb-3 pr-4 font-semibold text-muted-foreground">Method</th>
                <th className="pb-3 pr-4 font-semibold text-muted-foreground">Payout</th>
                <th className="pb-3 font-semibold text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.distributions.map((dist) => (
                <tr
                  key={dist.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 pr-4 font-medium text-foreground whitespace-nowrap">
                    {formatDate(dist.drawDate)}
                  </td>
                  <td className="py-3 pr-4 text-foreground whitespace-nowrap">
                    {formatUsd(dist.totalUsdCents)}
                  </td>
                  <td className="py-3 pr-4 text-foreground whitespace-nowrap">
                    {formatUsd(Math.floor(dist.totalUsdCents / 2))}
                  </td>
                  <td className="py-3 pr-4 text-foreground whitespace-nowrap">
                    {formatUsd(dist.winnerShareUsdCents)}
                  </td>
                  <td className="py-3 pr-4 max-w-[160px]">
                    <p className="font-medium text-foreground truncate">
                      {dist.winnerListenerName ?? "Anonymous"}
                    </p>
                    {dist.winnerWishText && (
                      <p className="text-xs text-muted-foreground italic truncate">
                        "{dist.winnerWishText}"
                      </p>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <PaymentMethodBadge method={dist.winnerPaymentMethod} />
                  </td>
                  <td className="py-3 pr-4">
                    <PayoutStatusBadge
                      status={dist.payoutStatus}
                      method={dist.winnerPaymentMethod}
                    />
                  </td>
                  <td className="py-3">
                    {dist.payoutStatus === "pending" && dist.winnerPaymentMethod !== "stripe" && (
                      <button
                        onClick={() => payout.mutate(dist.drawDate)}
                        disabled={payout.isPending}
                        className="text-xs px-3 py-1.5 rounded border border-border text-foreground hover:bg-muted disabled:opacity-50 whitespace-nowrap"
                      >
                        Mark Sent
                      </button>
                    )}
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
