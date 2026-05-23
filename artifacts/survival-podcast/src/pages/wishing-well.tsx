import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Coins,
  Sparkles,
  Trophy,
  Heart,
  Clock,
  ChevronDown,
  ChevronUp,
  Layers,
  Flame,
  Zap,
  CreditCard,
  Gift,
} from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem("ww_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("ww_session_id", id);
  }
  return id;
}

const FOUNDER_MATCH_THRESHOLD = 10;

const FIAT_AMOUNTS = [
  { units: 1, label: "$1" },
  { units: 2, label: "$2" },
  { units: 5, label: "$5" },
];

interface WishingWellTip {
  id: number;
  amountUnits: number;
  currency: string;
  paymentMethod: string;
  wishText: string;
  listenerName: string | null;
  drawDate: string;
  episodeSlug: string | null;
  status: string;
  stackCount: number;
  founderMatchTriggered: boolean;
  createdAt: string;
}

interface PotToday {
  date: string;
  tipCount: number;
  totalUnits: number;
  currency: string;
  totalUsdCents: number;
  fiatCount: number;
  cryptoCount: number;
  xrpUsdRate: number;
  drawn: boolean;
}

interface Distribution {
  id: number;
  drawDate: string;
  totalUnits: number;
  totalUsdCents?: number;
  creatorShareUnits: number;
  winnerShareUnits: number;
  winnerShareUsdCents?: number;
  winnerWishText: string | null;
  winnerListenerName: string | null;
  winnerImpactNote: string | null;
  winnerPaymentMethod?: string;
  payoutStatus: string;
  currency: string;
  createdAt: string;
}

interface Board {
  todayWinner: Distribution | null;
  past: Distribution[];
}

interface WishesResponse {
  date: string;
  wishes: WishingWellTip[];
}

async function fetchPotToday(): Promise<PotToday> {
  const res = await fetch(apiUrl("/wishing-well/pot/today"));
  if (!res.ok) throw new Error("Failed to load today's pot");
  return res.json();
}

async function fetchBoard(): Promise<Board> {
  const res = await fetch(apiUrl("/wishing-well/board"));
  if (!res.ok) throw new Error("Failed to load board");
  return res.json();
}

async function fetchWishes(): Promise<WishesResponse> {
  const res = await fetch(apiUrl("/wishing-well/wishes"));
  if (!res.ok) throw new Error("Failed to load wishes");
  return res.json();
}

async function submitCryptoTip(data: {
  amountUnits: number;
  wishText: string;
  listenerName: string;
  currency: string;
}): Promise<unknown> {
  const res = await fetch(apiUrl("/wishing-well/tip"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "Failed to submit tip");
  }
  return res.json();
}

async function createStripeCheckout(data: {
  amountUnits: number;
  wishText: string;
  listenerName: string;
}): Promise<{ checkoutUrl: string; sessionId: string }> {
  const res = await fetch(apiUrl("/wishing-well/tip/stripe"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? "Failed to create checkout");
  }
  return res.json();
}

async function stackWish(tipId: number): Promise<{
  tipId: number;
  stackCount: number;
  founderMatchTriggered: boolean;
  threshold: number;
  alreadyStacked?: boolean;
}> {
  const sessionId = getOrCreateSessionId();
  const res = await fetch(apiUrl(`/wishing-well/stack/${tipId}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({})) as { error?: string; alreadyStacked?: boolean };
    if (j.alreadyStacked) return { tipId, stackCount: 0, founderMatchTriggered: false, threshold: FOUNDER_MATCH_THRESHOLD, alreadyStacked: true };
    throw new Error(j.error ?? "Failed to stack wish");
  }
  return res.json();
}

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
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

function CoinIcon({ size = 20 }: { size?: number }) {
  return (
    <span style={{ fontSize: size }} role="img" aria-label="coin">
      🪙
    </span>
  );
}

function MomentumBar({ count, threshold }: { count: number; threshold: number }) {
  const pct = Math.min(100, (count / threshold) * 100);
  const triggered = count >= threshold;
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
        <span className="flex items-center gap-1">
          <Layers className="w-3 h-3" />
          {count} {count === 1 ? "stack" : "stacks"}
        </span>
        {triggered ? (
          <span className="text-[#D9A066] font-bold flex items-center gap-0.5">
            <Zap className="w-3 h-3" /> Founder match unlocked!
          </span>
        ) : (
          <span>{threshold - count} more to unlock founder match</span>
        )}
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            triggered
              ? "bg-gradient-to-r from-[#D9A066] to-[#A64B36]"
              : "bg-[#2C4A36]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function WishCard({
  wish,
  stacked,
  onStack,
}: {
  wish: WishingWellTip;
  stacked: boolean;
  onStack: (id: number) => void;
}) {
  const triggered = wish.founderMatchTriggered;
  return (
    <div
      className={`relative rounded-xl border p-4 transition-all ${
        triggered
          ? "border-[#D9A066] bg-gradient-to-br from-[#D9A066]/10 to-[#2C4A36]/8 shadow-md"
          : "border-border bg-card hover:border-[#2C4A36]/40"
      }`}
    >
      {triggered && (
        <div className="absolute -top-3 left-4 flex items-center gap-1 bg-[#D9A066] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow">
          <Flame className="w-3 h-3" /> Founder Matching!
        </div>
      )}

      <p className="font-serif text-sm leading-relaxed text-foreground italic mb-2">
        "{wish.wishText}"
      </p>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          {wish.paymentMethod === "stripe" ? (
            <CreditCard className="w-3 h-3 text-blue-500" />
          ) : (
            <CoinIcon size={12} />
          )}
          <span>
            {wish.paymentMethod === "stripe"
              ? `$${wish.amountUnits} via card`
              : `${wish.amountUnits} coin${wish.amountUnits !== 1 ? "s" : ""}`}
          </span>
          {wish.listenerName && (
            <>
              <span>·</span>
              <span className="font-medium text-foreground/70">{wish.listenerName}</span>
            </>
          )}
        </div>

        <button
          onClick={() => !stacked && onStack(wish.id)}
          disabled={stacked}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
            stacked
              ? "bg-[#2C4A36] text-white border-[#2C4A36] cursor-default"
              : "border-[#2C4A36]/50 text-[#2C4A36] hover:bg-[#2C4A36] hover:text-white"
          }`}
        >
          <Layers className="w-3 h-3" />
          {stacked ? "Stacked" : "Stack"}
        </button>
      </div>

      <MomentumBar count={wish.stackCount} threshold={FOUNDER_MATCH_THRESHOLD} />
    </div>
  );
}

function WinnerCard({ dist, label }: { dist: Distribution; label: string }) {
  const [showImpact, setShowImpact] = useState(false);
  const isFiat = dist.winnerPaymentMethod === "stripe";
  return (
    <div className="rounded-xl border border-[#D9A066]/40 bg-gradient-to-br from-[#D9A066]/10 to-[#2C4A36]/10 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-[#D9A066]" />
        <span className="text-xs font-bold uppercase tracking-widest text-[#D9A066]">
          {label}
        </span>
        {isFiat && (
          <span className="ml-auto flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            <Gift className="w-3 h-3" /> Platform credit issued
          </span>
        )}
      </div>
      <p className="text-base font-serif italic text-foreground leading-relaxed mb-3">
        "{dist.winnerWishText}"
      </p>
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
        <span className="font-medium text-foreground">
          {dist.winnerListenerName ?? "Anonymous"}
        </span>
        <span>·</span>
        {dist.winnerShareUsdCents != null ? (
          <span className="flex items-center gap-1">
            <Coins className="w-3.5 h-3.5" />
            {formatUsd(dist.winnerShareUsdCents)} won
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <CoinIcon size={14} />
            {dist.winnerShareUnits} coins won
          </span>
        )}
        <span>·</span>
        <span>{formatDate(dist.drawDate)}</span>
      </div>
      {dist.winnerImpactNote ? (
        <div className="mt-2 p-3 rounded-lg bg-muted/50 text-sm text-foreground leading-relaxed">
          <Heart className="w-3.5 h-3.5 inline text-rose-400 mr-1 -mt-0.5" />
          <span className="font-medium">Impact:</span> {dist.winnerImpactNote}
        </div>
      ) : (
        <button
          onClick={() => setShowImpact((v) => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
        >
          {showImpact ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Share what you did with your winnings
        </button>
      )}
    </div>
  );
}

type PaymentTab = "card" | "crypto";

function TipForm({ onSuccess }: { onSuccess: () => void }) {
  const [paymentTab, setPaymentTab] = useState<PaymentTab>("card");

  // Card (fiat) state
  const [fiatAmount, setFiatAmount] = useState(1);
  const [fiatWishText, setFiatWishText] = useState("");
  const [fiatListenerName, setFiatListenerName] = useState("");
  const [fiatRedirecting, setFiatRedirecting] = useState(false);

  // Crypto state
  const [amountUnits, setAmountUnits] = useState(1);
  const [wishText, setWishText] = useState("");
  const [listenerName, setListenerName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Check for Stripe return
  const [stripeResult, setStripeResult] = useState<"success" | "cancelled" | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripe = params.get("stripe");
    if (stripe === "success") setStripeResult("success");
    else if (stripe === "cancelled") setStripeResult("cancelled");
  }, []);

  const cryptoMutation = useMutation({
    mutationFn: submitCryptoTip,
    onSuccess: () => {
      setSubmitted(true);
      onSuccess();
    },
  });

  const stripeMutation = useMutation({
    mutationFn: createStripeCheckout,
    onSuccess: (data) => {
      setFiatRedirecting(true);
      window.location.href = data.checkoutUrl;
    },
  });

  if (stripeResult === "success") {
    return (
      <div className="rounded-xl border border-[#2C4A36]/40 bg-[#2C4A36]/8 p-6 text-center">
        <div className="text-3xl mb-2">🎉</div>
        <p className="font-serif text-lg font-semibold text-foreground mb-1">
          Payment confirmed — your coin is in the well!
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Your wish has been added to today's pot. If you win, you'll receive a platform credit redeemable on Brigade membership or cohort enrollment.
        </p>
        <button
          onClick={() => setStripeResult(null)}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Toss another coin
        </button>
      </div>
    );
  }

  if (stripeResult === "cancelled") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <div className="text-3xl mb-2">💸</div>
        <p className="font-serif text-lg font-semibold text-foreground mb-1">
          Payment cancelled
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          No charge was made. Try again whenever you're ready.
        </p>
        <button
          onClick={() => setStripeResult(null)}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-[#2C4A36]/40 bg-[#2C4A36]/8 p-6 text-center">
        <div className="text-3xl mb-2">🪙</div>
        <p className="font-serif text-lg font-semibold text-foreground mb-1">
          Your coin is in the well!
        </p>
        <p className="text-sm text-muted-foreground">
          Your wish is in today's pot. Now stack onto other wishes below to build community momentum!
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setWishText("");
            setListenerName("");
            setAmountUnits(1);
          }}
          className="mt-4 text-xs text-muted-foreground hover:text-foreground underline"
        >
          Toss another coin
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Tab switcher */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setPaymentTab("card")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
            paymentTab === "card"
              ? "bg-[#2C4A36] text-white"
              : "bg-muted/40 text-muted-foreground hover:text-foreground"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Pay by Card
        </button>
        <button
          onClick={() => setPaymentTab("crypto")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
            paymentTab === "crypto"
              ? "bg-[#2C4A36] text-white"
              : "bg-muted/40 text-muted-foreground hover:text-foreground"
          }`}
        >
          <CoinIcon size={14} />
          Crypto (XRP)
        </button>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#D9A066]" />
          <h3 className="font-serif text-lg font-bold text-foreground">Toss a Coin</h3>
        </div>

        {paymentTab === "card" ? (
          <>
            <p className="text-sm text-muted-foreground mb-2">
              Pay by card — no crypto wallet needed. Half the pot goes to today's lucky winner.
            </p>
            <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-blue-50 text-blue-700 text-xs">
              <Gift className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                <strong>Card winners receive a platform credit</strong> — redeemable against Brigade membership or cohort enrollment. No crypto required.
              </span>
            </div>

            {stripeMutation.isError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {stripeMutation.error instanceof Error ? stripeMutation.error.message : "Something went wrong"}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
                  Your name (optional)
                </label>
                <input
                  type="text"
                  value={fiatListenerName}
                  onChange={(e) => setFiatListenerName(e.target.value)}
                  placeholder="e.g. Jack from Texas"
                  maxLength={80}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4A36]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
                  Coin amount
                </label>
                <div className="flex gap-2">
                  {FIAT_AMOUNTS.map((a) => (
                    <button
                      key={a.units}
                      onClick={() => setFiatAmount(a.units)}
                      className={`flex-1 py-2.5 rounded-lg border text-sm font-bold transition-all ${
                        fiatAmount === a.units
                          ? "bg-[#2C4A36] text-white border-[#2C4A36]"
                          : "border-border text-foreground hover:border-[#2C4A36]/50"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">1 coin = $1 USD</p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
                  Your wish <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={fiatWishText}
                  onChange={(e) => setFiatWishText(e.target.value)}
                  placeholder="Make a wish… something meaningful to you or your community"
                  maxLength={280}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2C4A36]"
                />
                <div className="text-right text-xs text-muted-foreground mt-0.5">
                  {fiatWishText.length}/280
                </div>
              </div>

              <button
                onClick={() =>
                  stripeMutation.mutate({
                    amountUnits: fiatAmount,
                    wishText: fiatWishText,
                    listenerName: fiatListenerName,
                  })
                }
                disabled={
                  !fiatWishText.trim() ||
                  fiatWishText.trim().length < 3 ||
                  stripeMutation.isPending ||
                  fiatRedirecting
                }
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#2C4A36] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                {stripeMutation.isPending || fiatRedirecting
                  ? "Redirecting to checkout…"
                  : `Pay $${fiatAmount} & Toss ${fiatAmount} Coin${fiatAmount !== 1 ? "s" : ""}`}
              </button>
              <p className="text-xs text-muted-foreground text-center -mt-1">
                Secure checkout via Stripe. You'll be redirected to complete payment.
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-5">
              Each coin you toss enters you into today's draw. Half the day's pot goes to
              the randomly selected winner — the other half supports The Stomping Path.
            </p>

            {cryptoMutation.isError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {cryptoMutation.error instanceof Error ? cryptoMutation.error.message : "Something went wrong"}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
                  Your name (optional)
                </label>
                <input
                  type="text"
                  value={listenerName}
                  onChange={(e) => setListenerName(e.target.value)}
                  placeholder="e.g. Jack from Texas"
                  maxLength={80}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4A36]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
                  Coins to toss
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAmountUnits((v) => Math.max(1, v - 1))}
                    className="w-8 h-8 rounded-full border border-border text-lg font-bold flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-bold text-lg text-foreground">
                    {amountUnits}
                  </span>
                  <button
                    onClick={() => setAmountUnits((v) => Math.min(100, v + 1))}
                    className="w-8 h-8 rounded-full border border-border text-lg font-bold flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    +
                  </button>
                  <span className="text-sm text-muted-foreground ml-1">
                    {amountUnits === 1 ? "coin" : "coins"}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
                  Your wish <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={wishText}
                  onChange={(e) => setWishText(e.target.value)}
                  placeholder="Make a wish… something meaningful to you or your community"
                  maxLength={280}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2C4A36]"
                />
                <div className="text-right text-xs text-muted-foreground mt-0.5">
                  {wishText.length}/280
                </div>
              </div>

              <button
                onClick={() =>
                  cryptoMutation.mutate({ amountUnits, wishText, listenerName, currency: "XRP" })
                }
                disabled={!wishText.trim() || wishText.trim().length < 3 || cryptoMutation.isPending}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#2C4A36] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <CoinIcon size={16} />
                {cryptoMutation.isPending
                  ? "Tossing…"
                  : `Toss ${amountUnits} coin${amountUnits !== 1 ? "s" : ""} into the Well`}
              </button>
              <p className="text-xs text-muted-foreground text-center -mt-1">
                XRP. Crypto payouts pending legal review — currency and payout mechanism to be confirmed.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CommunityWishesWall() {
  const qc = useQueryClient();
  const [stacked, setStacked] = useState<Set<number>>(new Set());
  const [justTriggered, setJustTriggered] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["wishing-well-wishes"],
    queryFn: fetchWishes,
    refetchInterval: 30_000,
  });

  const stackMutation = useMutation({
    mutationFn: stackWish,
    onSuccess: (result) => {
      if (result.alreadyStacked) {
        setStacked((prev) => new Set(prev).add(result.tipId));
        return;
      }
      setStacked((prev) => new Set(prev).add(result.tipId));
      if (result.founderMatchTriggered) {
        setJustTriggered(result.tipId);
        setTimeout(() => setJustTriggered(null), 4000);
      }
      qc.invalidateQueries({ queryKey: ["wishing-well-wishes"] });
      qc.invalidateQueries({ queryKey: ["wishing-well-pot"] });
    },
  });

  const handleStack = useCallback(
    (id: number) => stackMutation.mutate(id),
    [stackMutation],
  );

  const wishes = data?.wishes ?? [];

  return (
    <div className="mb-14">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-[#2C4A36]" />
        <h2 className="font-serif text-2xl font-bold text-foreground">Today's Wishes</h2>
        <span className="ml-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          Stack a wish to build momentum
        </span>
      </div>

      <div className="mb-5 p-4 rounded-xl border border-[#2C4A36]/30 bg-[#2C4A36]/5 text-sm text-muted-foreground leading-relaxed">
        <span className="font-semibold text-foreground">How the flywheel works:</span>{" "}
        When a wish earns <strong>{FOUNDER_MATCH_THRESHOLD} stacks</strong> from the community, the founder
        commits to matching her 50% of the pot back to that cause — creating a giving flywheel for
        massive impact. Stack the wishes you believe in most.
      </div>

      {justTriggered !== null && (
        <div className="mb-4 p-4 rounded-xl border border-[#D9A066] bg-[#D9A066]/10 text-[#A64B36] font-semibold text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Zap className="w-5 h-5 text-[#D9A066]" />
          Founder match unlocked! This cause now has the community's full backing.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : wishes.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-xl">
          <Coins className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No wishes yet today — toss the first coin!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {wishes.map((wish) => (
            <WishCard
              key={wish.id}
              wish={wish}
              stacked={stacked.has(wish.id)}
              onStack={handleStack}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function WishingWell() {
  const qc = useQueryClient();

  const { data: pot, isLoading: potLoading } = useQuery({
    queryKey: ["wishing-well-pot"],
    queryFn: fetchPotToday,
    refetchInterval: 30_000,
  });

  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ["wishing-well-board"],
    queryFn: fetchBoard,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["wishing-well-pot"] });
    qc.invalidateQueries({ queryKey: ["wishing-well-board"] });
    qc.invalidateQueries({ queryKey: ["wishing-well-wishes"] });
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
      <header className="mb-10 text-center">
        <div className="text-5xl mb-4">🪙</div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-3">
          The Wishing Well
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
          Toss a coin, make a wish. Pay by card or crypto — both enter the same pot.
          Stack the wishes you believe in to build community momentum. When enough hearts align,
          the founder matches her share — a flywheel of giving for massive impact.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Today's Pot */}
        <div className="rounded-xl border border-[#2C4A36]/30 bg-gradient-to-br from-[#2C4A36]/8 to-transparent p-6">
          <div className="flex items-center gap-2 mb-4">
            <Coins className="w-5 h-5 text-[#2C4A36]" />
            <h2 className="font-serif text-xl font-bold text-foreground">Today's Pot</h2>
          </div>
          {potLoading ? (
            <div className="space-y-2">
              <div className="h-10 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
            </div>
          ) : pot ? (
            <>
              <div className="text-4xl font-bold text-foreground mb-1 font-serif">
                {pot.totalUsdCents != null ? (
                  <>
                    {formatUsd(pot.totalUsdCents)}{" "}
                    <span className="text-xl text-muted-foreground font-sans font-normal">USD equiv</span>
                  </>
                ) : (
                  <>
                    {pot.totalUnits}{" "}
                    <span className="text-xl text-muted-foreground font-sans font-normal">coins</span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                from {pot.tipCount} {pot.tipCount === 1 ? "wish" : "wishes"} today
              </p>
              {(pot.fiatCount > 0 || pot.cryptoCount > 0) && pot.tipCount > 0 && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  {pot.fiatCount > 0 && (
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-blue-500" />
                      {pot.fiatCount} card
                    </span>
                  )}
                  {pot.cryptoCount > 0 && (
                    <span className="flex items-center gap-1">
                      <CoinIcon size={10} />
                      {pot.cryptoCount} crypto
                    </span>
                  )}
                </div>
              )}
              {pot.drawn ? (
                <div className="flex items-center gap-2 text-sm font-medium text-[#D9A066]">
                  <Trophy className="w-4 h-4" />
                  Today's draw has been run!
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Draw runs at midnight UTC
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Unable to load pot</p>
          )}
        </div>

        {/* Today's Winner */}
        <div>
          {board?.todayWinner ? (
            <WinnerCard dist={board.todayWinner} label="🎉 Today's Winner" />
          ) : (
            <div className="rounded-xl border border-dashed border-border p-6 flex flex-col items-center justify-center text-center h-full min-h-[160px]">
              <Sparkles className="w-8 h-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                No winner yet today — toss a coin and enter the draw!
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-10">
        <TipForm onSuccess={refresh} />
      </div>

      <CommunityWishesWall />

      {boardLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : board && board.past.length > 0 ? (
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#D9A066]" />
            Past Winners
          </h2>
          <div className="space-y-4">
            {board.past.map((dist) => (
              <WinnerCard key={dist.id} dist={dist} label={formatDate(dist.drawDate)} />
            ))}
          </div>
        </div>
      ) : (
        !boardLoading && (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <div className="text-4xl mb-3">🪙</div>
            <p className="text-muted-foreground">
              No draws have run yet — be the first to toss a coin!
            </p>
          </div>
        )
      )}
    </div>
  );
}
