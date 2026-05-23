import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Shield,
  Check,
  RefreshCw,
  Star,
  Zap,
  BookOpen,
  Users,
  Map,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Gift,
  Clock,
} from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface BrigadeStatus {
  isMember: boolean;
  status: string | null;
  plan: string | null;
  currentPeriodEnd: string | null;
}

interface MemberCountData {
  count: number;
}

interface WishingWellCredit {
  id: number;
  amountCents: number;
  source: string;
  distributionId: number | null;
  redeemedAt: string | null;
  createdAt: string;
}

interface CreditsData {
  totalCents: number;
  credits: WishingWellCredit[];
}

async function fetchCredits(): Promise<CreditsData> {
  const res = await fetch(apiUrl("/wishing-well/credits"), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch credits");
  return res.json();
}

async function fetchBrigadeStatus(): Promise<BrigadeStatus> {
  const res = await fetch(apiUrl("/brigade/status"), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch Brigade status");
  return res.json();
}

async function fetchMemberCount(): Promise<MemberCountData> {
  const res = await fetch(apiUrl("/brigade/member-count"));
  if (!res.ok) throw new Error("Failed to fetch member count");
  return res.json();
}

async function createCheckout(plan: "monthly" | "annual"): Promise<{ url: string }> {
  const res = await fetch(apiUrl("/brigade/checkout"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ plan }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Checkout failed");
  return data;
}

async function fetchPortalUrl(): Promise<{ url: string }> {
  const res = await fetch(apiUrl("/brigade/portal"), { credentials: "include" });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Portal failed");
  return data;
}

const features = [
  {
    icon: RefreshCw,
    title: "Cross-Device Progress Sync",
    desc: "Your track progress follows you across every device. Start on your phone, pick up on your laptop.",
  },
  {
    icon: Users,
    title: "Stomping Grounds Access",
    desc: "Full access to community features — Wishing Well tips, Wisdom Dig, and workshop sign-ups.",
  },
  {
    icon: BookOpen,
    title: "Full Archive Search",
    desc: "Search every episode, topic, and series across the entire TSP archive — 3,000+ episodes deep.",
  },
  {
    icon: Map,
    title: "Transformation Path Bookmarking",
    desc: "Save your place on any transformation path and get personalised \"Your Path\" episode recommendations.",
  },
  {
    icon: Zap,
    title: "Early Access",
    desc: "Brigade members get early access to new tools, tracks, and features as they roll out.",
  },
  {
    icon: Star,
    title: "Direct Support for TSP",
    desc: "Your membership directly funds independent, sponsor-free preparedness content.",
  },
];

function PlanCard({
  plan,
  price,
  perMonth,
  savings,
  selected,
  onSelect,
}: {
  plan: "monthly" | "annual";
  price: string;
  perMonth: string;
  savings?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`relative w-full text-left rounded-2xl border-2 p-6 transition-all cursor-pointer ${
        selected
          ? "border-[#D9A066] bg-[#D9A066]/10 shadow-lg shadow-[#D9A066]/20"
          : "border-white/20 bg-white/5 hover:border-white/40"
      }`}
    >
      {plan === "annual" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D9A066] text-[#2C4A36] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Best Value
        </div>
      )}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-white font-bold text-lg capitalize">{plan}</div>
          {savings && (
            <div className="text-[#D9A066] text-xs font-semibold mt-0.5">{savings}</div>
          )}
        </div>
        <div className="text-right">
          <div className="text-white font-bold text-2xl">{price}</div>
          {plan === "annual" && (
            <div className="text-white/50 text-xs mt-0.5">{perMonth}/mo</div>
          )}
        </div>
      </div>
      {selected && (
        <div className="absolute top-4 right-4">
          <Check className="w-5 h-5 text-[#D9A066]" />
        </div>
      )}
    </button>
  );
}

export function BrigadePage() {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [location] = useLocation();
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();

  const checkoutSuccess = new URLSearchParams(location.split("?")[1] ?? "").get("checkout") === "success";
  const checkoutCancelled = new URLSearchParams(location.split("?")[1] ?? "").get("checkout") === "cancelled";

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ["brigade-status"],
    queryFn: fetchBrigadeStatus,
    retry: false,
  });

  const { data: memberCount } = useQuery({
    queryKey: ["brigade-member-count"],
    queryFn: fetchMemberCount,
  });

  const { data: creditsData } = useQuery({
    queryKey: ["wishing-well-credits"],
    queryFn: fetchCredits,
    enabled: isAuthenticated,
    retry: false,
  });

  const checkoutMutation = useMutation({
    mutationFn: createCheckout,
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const portalMutation = useMutation({
    mutationFn: fetchPortalUrl,
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const isMember = statusData?.isMember === true;
  const isLoading = authLoading || statusLoading;

  const handleJoin = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    checkoutMutation.mutate(selectedPlan);
  };

  return (
    <div className="min-h-screen bg-[#0e1f16]">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#1a3326] to-[#0e1f16] pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#D9A066]/15 text-[#D9A066] px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-[#D9A066]/30">
            <Shield className="w-4 h-4" />
            Brigade Membership
          </div>

          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Support the mission.<br />
            <span className="text-[#D9A066]">Unlock the full arsenal.</span>
          </h1>

          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            The Survival Podcast has been independent and sponsor-free for 15+ years.
            Brigade members keep it that way — and get the tools to go deeper.
          </p>

          {memberCount && memberCount.count > 0 && (
            <div className="inline-flex items-center gap-2 text-white/50 text-sm">
              <Users className="w-4 h-4 text-[#D9A066]" />
              <span>
                <strong className="text-white">{memberCount.count.toLocaleString()}</strong> Brigade members and counting
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-20">
        {/* Success / cancelled banners */}
        {checkoutSuccess && (
          <div className="mb-8 flex items-start gap-3 bg-emerald-900/40 border border-emerald-500/40 rounded-xl px-5 py-4 text-emerald-300">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Welcome to the Brigade!</div>
              <div className="text-sm text-emerald-400 mt-0.5">
                Your membership is active. All features are unlocked.
              </div>
            </div>
          </div>
        )}

        {checkoutCancelled && (
          <div className="mb-8 flex items-start gap-3 bg-amber-900/30 border border-amber-500/30 rounded-xl px-5 py-4 text-amber-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Checkout cancelled</div>
              <div className="text-sm text-amber-400 mt-0.5">
                No charge was made. Join whenever you're ready.
              </div>
            </div>
          </div>
        )}

        {/* Active member view */}
        {!isLoading && isMember && (
          <div className="mb-10 bg-[#1e3428] border border-[#D9A066]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#D9A066]/20 p-2 rounded-xl">
                <Shield className="w-5 h-5 text-[#D9A066]" />
              </div>
              <div>
                <div className="text-white font-bold">You're a Brigade Member</div>
                <div className="text-white/50 text-sm capitalize">
                  {statusData.plan} plan
                  {statusData.currentPeriodEnd &&
                    ` · Renews ${new Date(statusData.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
                </div>
              </div>
            </div>
            <button
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
              className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {portalMutation.isPending ? "Opening portal…" : "Manage billing & subscription"}
            </button>
            {portalMutation.isError && (
              <p className="text-red-400 text-sm mt-2">{(portalMutation.error as Error).message}</p>
            )}
          </div>
        )}

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex gap-4 bg-white/5 rounded-xl p-5 border border-white/8"
            >
              <div className="flex-shrink-0 bg-[#D9A066]/15 p-2.5 rounded-lg h-fit">
                <f.icon className="w-4 h-4 text-[#D9A066]" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{f.title}</div>
                <div className="text-white/50 text-sm mt-1 leading-snug">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing — hide if already a member */}
        {!isLoading && !isMember && (
          <div className="max-w-md mx-auto">
            <h2 className="font-serif text-2xl font-bold text-white text-center mb-6">
              Join the Brigade
            </h2>

            <div className="flex flex-col gap-4 mb-6">
              <PlanCard
                plan="monthly"
                price="$9/mo"
                perMonth="$9"
                selected={selectedPlan === "monthly"}
                onSelect={() => setSelectedPlan("monthly")}
              />
              <PlanCard
                plan="annual"
                price="$97/yr"
                perMonth="$8.08"
                savings="Save $11 vs monthly"
                selected={selectedPlan === "annual"}
                onSelect={() => setSelectedPlan("annual")}
              />
            </div>

            {/* Wishing Well credit balance banner */}
            {isAuthenticated && creditsData && creditsData.totalCents > 0 && (
              <div className="flex items-start gap-3 bg-[#D9A066]/10 border border-[#D9A066]/40 rounded-xl px-4 py-3.5 mb-4">
                <Gift className="w-4 h-4 text-[#D9A066] flex-shrink-0 mt-0.5" />
                <p className="text-[#D9A066] text-sm">
                  <span className="font-semibold">
                    You have ${(creditsData.totalCents / 100).toFixed(2)} in Wishing Well credits
                  </span>{" "}
                  — applied automatically at checkout.
                </p>
              </div>
            )}

            {checkoutMutation.isError && (
              <div className="flex items-start gap-2 bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {(checkoutMutation.error as Error).message}
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={checkoutMutation.isPending}
              className="w-full bg-[#D9A066] hover:bg-[#C8904E] text-[#1a2e20] font-bold text-base py-4 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              {checkoutMutation.isPending
                ? "Redirecting…"
                : !isAuthenticated
                ? "Log in to Join"
                : `Join Brigade · ${selectedPlan === "monthly" ? "$9/mo" : "$97/yr"}`}
            </button>

            <p className="text-white/30 text-xs text-center mt-4">
              Payments processed securely by Stripe. Cancel anytime from your account.
            </p>
          </div>
        )}

        {/* Wishing Well credits history — shown to authenticated users who have any credits */}
        {isAuthenticated && creditsData && creditsData.credits.length > 0 && (
          <div className="mt-12 max-w-md mx-auto">
            <h2 className="font-serif text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#D9A066]" />
              Wishing Well Credits
            </h2>

            {creditsData.totalCents > 0 && (
              <div className="bg-[#1e3428] border border-[#D9A066]/30 rounded-xl px-5 py-4 mb-4">
                <div className="text-white/60 text-sm">Available balance</div>
                <div className="text-[#D9A066] font-bold text-2xl mt-0.5">
                  ${(creditsData.totalCents / 100).toFixed(2)}
                </div>
                <div className="text-white/40 text-xs mt-1">
                  Applied automatically when you join the Brigade
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {creditsData.credits.map((credit) => (
                <div
                  key={credit.id}
                  className="flex items-center justify-between bg-white/5 border border-white/8 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${credit.redeemedAt ? "bg-white/10" : "bg-[#D9A066]/15"}`}>
                      {credit.redeemedAt ? (
                        <Check className="w-3.5 h-3.5 text-white/40" />
                      ) : (
                        <Gift className="w-3.5 h-3.5 text-[#D9A066]" />
                      )}
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">
                        {credit.redeemedAt ? "Credit redeemed" : "Wishing Well win"}
                      </div>
                      <div className="flex items-center gap-1 text-white/40 text-xs mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(credit.redeemedAt ?? credit.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className={`font-semibold text-sm ${credit.redeemedAt ? "text-white/40 line-through" : "text-[#D9A066]"}`}>
                    ${(credit.amountCents / 100).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BrigadePage;
