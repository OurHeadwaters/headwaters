import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Loader2, DollarSign, Mail, MessageSquare } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface KitPurchase {
  id: number;
  kitSlug: string;
  buyerEmail: string;
  buyerName: string | null;
  amountPaidCents: number;
  purchasedAt: string;
  stripeCheckoutSessionId: string | null;
}

interface KitInquiry {
  id: number;
  kitSlug: string;
  name: string;
  email: string;
  notes: string | null;
  submittedAt: string;
}

interface KitStats {
  kitSlug: string;
  purchaseCount: number;
  totalRevenueCents: number;
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

function KitSlugBadge({ slug }: { slug: string }) {
  const label = slug.replace(/-kit$/, "").replace(/-/g, " ");
  return (
    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20">
      {label}
    </span>
  );
}

export function AdminKitPurchases() {
  const [tab, setTab] = useState<"purchases" | "inquiries">("purchases");

  const { data: purchases, isLoading: loadingPurchases } = useQuery<KitPurchase[]>({
    queryKey: ["admin-kit-purchases"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/admin/kit-purchases"), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load kit purchases");
      return res.json();
    },
  });

  const { data: inquiries, isLoading: loadingInquiries } = useQuery<KitInquiry[]>({
    queryKey: ["admin-kit-inquiries"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/admin/kit-inquiries"), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load kit inquiries");
      return res.json();
    },
  });

  const { data: stats } = useQuery<KitStats[]>({
    queryKey: ["admin-kit-stats"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/admin/kit-purchases/stats"), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load kit stats");
      return res.json();
    },
  });

  const totalRevenue = purchases?.reduce((sum, p) => sum + p.amountPaidCents, 0) ?? 0;
  const totalPurchases = purchases?.length ?? 0;
  const totalInquiries = inquiries?.length ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-7 h-7 text-primary" />
        <h1 className="font-serif text-2xl font-bold">Kit Commerce</h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Total Purchases
          </p>
          <p className="font-serif text-2xl font-bold">{totalPurchases}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Revenue
          </p>
          <p className="font-serif text-2xl font-bold flex items-center gap-1">
            <DollarSign className="w-5 h-5 text-muted-foreground" />
            {formatPrice(totalRevenue).replace("$", "")}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Inquiries
          </p>
          <p className="font-serif text-2xl font-bold flex items-center gap-1">
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
            {totalInquiries}
          </p>
        </div>
      </div>

      {stats && stats.length > 0 && (
        <div className="rounded-xl border border-border bg-card px-5 py-4 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Per-Kit Breakdown
          </p>
          <div className="flex flex-wrap gap-3">
            {stats.map((s) => (
              <div key={s.kitSlug} className="flex items-center gap-2 text-sm">
                <KitSlugBadge slug={s.kitSlug} />
                <span className="font-semibold">{s.purchaseCount}×</span>
                <span className="text-muted-foreground">{formatPrice(s.totalRevenueCents)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-4 border-b border-border">
        <button
          onClick={() => setTab("purchases")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            tab === "purchases"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Purchases
        </button>
        <button
          onClick={() => setTab("inquiries")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            tab === "inquiries"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Inquiries
        </button>
      </div>

      {tab === "purchases" && (
        <>
          {loadingPurchases && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {purchases && purchases.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No kit purchases yet</p>
              <p className="text-sm mt-1">Purchases will appear here after the first Stripe checkout completes.</p>
            </div>
          )}
          {purchases && purchases.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-muted-foreground border-b border-border bg-muted/30">
                    <th className="px-4 py-3">Kit</th>
                    <th className="px-4 py-3">Buyer</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Session</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <KitSlugBadge slug={p.kitSlug} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{p.buyerName ?? "—"}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {p.buyerEmail}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums">
                        {formatPrice(p.amountPaidCents)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(p.purchasedAt)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground truncate max-w-[160px] hidden lg:table-cell">
                        {p.stripeCheckoutSessionId ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "inquiries" && (
        <>
          {loadingInquiries && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {inquiries && inquiries.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No inquiries yet</p>
              <p className="text-sm mt-1">Practitioner and Council kit inquiries appear here.</p>
            </div>
          )}
          {inquiries && inquiries.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-muted-foreground border-b border-border bg-muted/30">
                    <th className="px-4 py-3">Kit</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((q) => (
                    <tr key={q.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <KitSlugBadge slug={q.kitSlug} />
                      </td>
                      <td className="px-4 py-3 font-medium">{q.name}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs flex items-center gap-1 text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {q.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                        {q.notes ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(q.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
