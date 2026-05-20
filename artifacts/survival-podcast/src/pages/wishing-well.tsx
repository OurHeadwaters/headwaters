import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Coins, Sparkles, Trophy, Heart, Clock, ChevronDown, ChevronUp } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface PotToday {
  date: string;
  tipCount: number;
  totalUnits: number;
  currency: string;
  drawn: boolean;
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

interface Board {
  todayWinner: Distribution | null;
  past: Distribution[];
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

async function submitTip(data: {
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

function CoinIcon({ size = 20 }: { size?: number }) {
  return (
    <span style={{ fontSize: size }} role="img" aria-label="coin">
      🪙
    </span>
  );
}

function WinnerCard({ dist, label }: { dist: Distribution; label: string }) {
  const [showImpact, setShowImpact] = useState(false);
  return (
    <div className="rounded-xl border border-[#D9A066]/40 bg-gradient-to-br from-[#D9A066]/10 to-[#2C4A36]/10 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-[#D9A066]" />
        <span className="text-xs font-bold uppercase tracking-widest text-[#D9A066]">
          {label}
        </span>
      </div>
      <p className="text-base font-serif italic text-foreground leading-relaxed mb-3">
        "{dist.winnerWishText}"
      </p>
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
        <span className="font-medium text-foreground">
          {dist.winnerListenerName ?? "Anonymous"}
        </span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <CoinIcon size={14} />
          {dist.winnerShareUnits} coins won
        </span>
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

function TipForm({ onSuccess }: { onSuccess: () => void }) {
  const [amountUnits, setAmountUnits] = useState(1);
  const [wishText, setWishText] = useState("");
  const [listenerName, setListenerName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: submitTip,
    onSuccess: () => {
      setSubmitted(true);
      onSuccess();
    },
  });

  if (submitted) {
    return (
      <div className="rounded-xl border border-[#2C4A36]/40 bg-[#2C4A36]/8 p-6 text-center">
        <div className="text-3xl mb-2">🪙</div>
        <p className="font-serif text-lg font-semibold text-foreground mb-1">
          Your coin is in the well!
        </p>
        <p className="text-sm text-muted-foreground">
          Your wish is in today's pot. The draw runs at midnight — good luck!
        </p>
        <button
          onClick={() => { setSubmitted(false); setWishText(""); setListenerName(""); setAmountUnits(1); }}
          className="mt-4 text-xs text-muted-foreground hover:text-foreground underline"
        >
          Toss another coin
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-[#D9A066]" />
        <h3 className="font-serif text-lg font-bold text-foreground">Toss a Coin</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Each coin you toss enters you into today's draw. Half the day's pot goes to
        the randomly selected winner — the other half supports The Survival Podcast.
      </p>

      {mutation.isError && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {mutation.error instanceof Error ? mutation.error.message : "Something went wrong"}
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
            mutation.mutate({ amountUnits, wishText, listenerName, currency: "XRP" })
          }
          disabled={!wishText.trim() || wishText.trim().length < 3 || mutation.isPending}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#2C4A36] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <CoinIcon size={16} />
          {mutation.isPending ? "Tossing…" : `Toss ${amountUnits} coin${amountUnits !== 1 ? "s" : ""} into the Well`}
        </button>
        <p className="text-xs text-muted-foreground text-center -mt-1">
          Crypto payouts pending legal review — currency to be announced.
        </p>
      </div>
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
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 max-w-4xl">
      <header className="mb-10 text-center">
        <div className="text-5xl mb-4">🪙</div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-3">
          The Wishing Well
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
          Toss a coin, make a wish. Every day one listener wins half the day's pot.
          The other half powers The Survival Podcast. Community. Intention. Impact.
        </p>
      </header>

      {/* Legal notice */}
      <div className="mb-8 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm">
        <strong>Note:</strong> This feature is in preview. Crypto payouts require legal
        review (Ontario gaming regulations). Currency and payout mechanism to be
        confirmed before launch.
      </div>

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
                {pot.totalUnits} <span className="text-xl text-muted-foreground font-sans font-normal">coins</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                from {pot.tipCount} {pot.tipCount === 1 ? "wish" : "wishes"} today
              </p>
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

      {/* Tip Form */}
      <div className="mb-14">
        <TipForm onSuccess={refresh} />
      </div>

      {/* Past Winners Feed */}
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
              <WinnerCard
                key={dist.id}
                dist={dist}
                label={formatDate(dist.drawDate)}
              />
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
