import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, Coins, RefreshCw, CheckCircle, Clock } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface Distribution {
  id: number;
  drawDate: string;
  totalUnits: number;
  creatorShareUnits: number;
  winnerShareUnits: number;
  winnerWishText: string | null;
  winnerListenerName: string | null;
  winnerImpactNote: string | null;
  payoutStatus: string;
  currency: string;
  createdAt: string;
}

interface AdminData {
  distributions: Distribution[];
  todayPot: {
    date: string;
    tipCount: number;
    totalUnits: number;
    currency: string;
  };
}

async function fetchAdminData(): Promise<AdminData> {
  const res = await fetch(apiUrl("/admin/wishing-well"), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load admin data");
  return res.json();
}

async function runDraw(date?: string): Promise<{ distribution: Distribution }> {
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
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export function AdminWishingWell() {
  const qc = useQueryClient();
  const [drawMsg, setDrawMsg] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-wishing-well"],
    queryFn: fetchAdminData,
    refetchInterval: 60_000,
  });

  const draw = useMutation({
    mutationFn: () => runDraw(),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["admin-wishing-well"] });
      setDrawMsg(
        `Draw complete! Winner: ${result.distribution.winnerListenerName ?? "Anonymous"} — won ${result.distribution.winnerShareUnits} coins`,
      );
      setTimeout(() => setDrawMsg(null), 8000);
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

      {/* Today's Pot + Draw Action */}
      {data && (
        <div className="mb-8 p-5 rounded-xl border border-[#2C4A36]/30 bg-[#2C4A36]/5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-4 h-4 text-[#2C4A36]" />
                <span className="font-semibold text-foreground">
                  Today's Pending Pot ({data.todayPot.date})
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {data.todayPot.totalUnits} coins{" "}
                <span className="text-base font-normal text-muted-foreground">
                  from {data.todayPot.tipCount} tips
                </span>
              </p>
            </div>
            <button
              onClick={() => draw.mutate()}
              disabled={draw.isPending || data.todayPot.tipCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2C4A36] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${draw.isPending ? "animate-spin" : ""}`} />
              Run Today's Draw
            </button>
          </div>
          {draw.isError && (
            <p className="mt-3 text-sm text-destructive">
              {draw.error instanceof Error ? draw.error.message : "Draw failed"}
            </p>
          )}
          {drawMsg && (
            <p className="mt-3 text-sm text-[#2C4A36] font-medium">✓ {drawMsg}</p>
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
                <th className="pb-3 pr-4 font-semibold text-muted-foreground">Total</th>
                <th className="pb-3 pr-4 font-semibold text-muted-foreground">Creator (50%)</th>
                <th className="pb-3 pr-4 font-semibold text-muted-foreground">Winner (50%)</th>
                <th className="pb-3 pr-4 font-semibold text-muted-foreground">Winner</th>
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
                  <td className="py-3 pr-4 font-medium text-foreground">
                    {formatDate(dist.drawDate)}
                  </td>
                  <td className="py-3 pr-4 text-foreground">
                    {dist.totalUnits} {dist.currency}
                  </td>
                  <td className="py-3 pr-4 text-foreground">{dist.creatorShareUnits}</td>
                  <td className="py-3 pr-4 text-foreground">{dist.winnerShareUnits}</td>
                  <td className="py-3 pr-4 max-w-[180px]">
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
                    {dist.payoutStatus === "sent" ? (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Sent
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    {dist.payoutStatus !== "sent" && (
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
