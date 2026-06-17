import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import {
  Package,
  ArrowRight,
  Loader2,
  LogIn,
  ShoppingBag,
  Mail,
  Search,
  Send,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";

import { KIT_META } from "@/hooks/use-kits";

const TOKEN_TTL_DAYS = 90;

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return "just now";
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}

type AccessStatus = "active" | "expiring";

function getAccessStatus(purchasedAt: string): AccessStatus {
  const purchased = new Date(purchasedAt).getTime();
  const now = Date.now();
  const ageMs = now - purchased;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays < TOKEN_TTL_DAYS ? "active" : "expiring";
}

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface PurchasedKit {
  id: number;
  kitSlug: string;
  buyerEmail: string;
  token: string | null;
  purchasedAt: string;
  lastResendAt: string | null;
  kit: {
    slug: string;
    name: string;
    tagline: string;
    description: string;
    priceType: string;
    ctaLabel: string;
  } | null;
}

interface MyPurchasesData {
  purchases: PurchasedKit[];
}


function usePurchases(enabled: boolean) {
  return useQuery<MyPurchasesData>({
    queryKey: ["my-purchases"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/kits/my-purchases"), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load purchases");
      return res.json();
    },
    enabled,
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
}

const AMBER = "#F59E0B";

function ResendButton({
  kitSlug,
  buyerEmail,
  color,
  lastResendAt: initialLastResendAt,
  isExpiring = false,
}: {
  kitSlug: string;
  buyerEmail: string;
  color: string;
  lastResendAt: string | null;
  isExpiring?: boolean;
}) {
  const btnColor = isExpiring ? AMBER : color;
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastResendAt, setLastResendAt] = useState<string | null>(initialLastResendAt);

  async function handleResend(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (status === "loading" || status === "sent") return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(apiUrl(`/kits/${kitSlug}/resend-access`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: buyerEmail }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong — please try again.");
      }
      setLastResendAt(new Date().toISOString());
      setStatus("sent");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-end gap-1">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{
            color: "#8FA883",
            background: "#8FA88318",
            border: "1px solid #8FA88333",
          }}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Link sent to {buyerEmail}
        </span>
        <span className="text-[11px] text-muted-foreground/50 pr-1">
          Last sent: just now
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleResend}
        disabled={status === "loading"}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        style={{
          color: btnColor,
          background: btnColor + "15",
          border: `1px solid ${btnColor}33`,
        }}
      >
        {status === "loading" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Send className="w-3.5 h-3.5" />
        )}
        {status === "loading" ? "Sending…" : "Re-send access link"}
      </button>
      {lastResendAt && (
        <span className="text-[11px] text-muted-foreground/50 pr-1">
          Last sent: {formatRelativeTime(lastResendAt)}
        </span>
      )}
      {isExpiring && status === "idle" && (
        <span className="text-[11px] text-muted-foreground/60 pl-1 leading-snug">
          Your access link is older than 90 days — re-send to get a fresh one
        </span>
      )}
      {status === "error" && errorMsg && (
        <span className="text-xs text-destructive pl-1">{errorMsg}</span>
      )}
    </div>
  );
}

function CopyLinkButton({ href, color }: { href: string; color: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (copied) return;
    try {
      const url = window.location.origin + href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy access link"}
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:-translate-y-px"
      style={{
        color: copied ? "#8FA883" : color,
        background: copied ? "#8FA88318" : color + "15",
        border: `1px solid ${copied ? "#8FA88333" : color + "33"}`,
      }}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          Copy link
        </>
      )}
    </button>
  );
}

const ACCESS_BADGE = {
  active: {
    label: "Access active",
    color: "#4ADE80",
    bg: "#4ADE8018",
    border: "#4ADE8033",
    Icon: ShieldCheck,
  },
  expiring: {
    label: "Refresh your link",
    color: "#F59E0B",
    bg: "#F59E0B18",
    border: "#F59E0B33",
    Icon: RefreshCw,
  },
} as const;

function KitCard({
  kitSlug,
  kitName,
  kitTagline,
  buyerEmail,
  purchasedAt,
  lastResendAt,
  href,
}: {
  kitSlug: string;
  kitName: string;
  kitTagline: string;
  buyerEmail: string;
  purchasedAt: string;
  lastResendAt: string | null;
  href: string;
}) {
  const meta = KIT_META[kitSlug] ?? { icon: "📦", color: "#6B7280" };
  const status = getAccessStatus(purchasedAt);
  const badge = ACCESS_BADGE[status];
  const BadgeIcon = badge.Icon;
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: meta.color + "33",
        background: meta.color + "08",
      }}
    >
      <Link
        href={href}
        className="flex items-center justify-between gap-5 p-6 hover:bg-white/5 transition-all duration-200 group"
      >
        <div className="flex items-center gap-5 min-w-0">
          <div
            className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{
              background: meta.color + "18",
              border: `1px solid ${meta.color}33`,
            }}
          >
            {meta.icon}
          </div>
          <div className="min-w-0">
            <p className="font-serif font-bold text-base text-foreground leading-snug">
              {kitName}
            </p>
            {kitTagline && (
              <p className="text-sm text-muted-foreground mt-0.5 leading-snug line-clamp-1">
                {kitTagline}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <p className="text-xs text-muted-foreground/60">
                Purchased{" "}
                {new Date(purchasedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <span
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  color: badge.color,
                  background: badge.bg,
                  border: `1px solid ${badge.border}`,
                }}
              >
                <BadgeIcon className="w-3 h-3" />
                {badge.label}
              </span>
            </div>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
            style={{
              color: meta.color,
              background: meta.color + "18",
              border: `1px solid ${meta.color}33`,
            }}
          >
            Open kit
          </span>
          <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
        </div>
      </Link>

      <div
        className="flex items-center gap-3 px-6 py-3 border-t"
        style={{ borderColor: meta.color + "22" }}
      >
        <Mail className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />
        <span className="text-xs text-muted-foreground/60 mr-auto truncate">
          {buyerEmail}
        </span>
        <CopyLinkButton href={href} color={meta.color} />
        <ResendButton
          kitSlug={kitSlug}
          buyerEmail={buyerEmail}
          color={meta.color}
          lastResendAt={lastResendAt}
          isExpiring={status === "expiring"}
        />
      </div>
    </div>
  );
}

function EmailLookupSection({ initialEmail = "" }: { initialEmail?: string }) {
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  useEffect(() => {
    if (initialEmail) {
      setEmailInput(initialEmail);
      doLookup(initialEmail);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEmail]);

  async function doLookup(email: string) {
    setIsLoading(true);
    setError(null);
    setSentEmail(null);
    try {
      const res = await fetch(apiUrl("/kits/send-access-email"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong — please try again.");
      }
      setSentEmail(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const email = emailInput.trim();
    if (!email) return;
    await doLookup(email);
  }

  if (sentEmail) {
    return (
      <div className="mt-10 pt-10 border-t border-border/40">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4" style={{ color: "#8FA883" }} />
          <p className="text-sm font-semibold text-foreground">
            Bought without logging in?
          </p>
        </div>
        <div
          className="rounded-xl border px-6 py-8 text-center max-w-md"
          style={{ borderColor: "#8FA88333", background: "#8FA88308" }}
        >
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
            style={{ background: "#8FA88318", border: "1px solid #8FA88333" }}
          >
            <Mail className="w-5 h-5" style={{ color: "#8FA883" }} />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            Check your inbox
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We emailed one-click access links to{" "}
            <span className="font-semibold text-foreground">{sentEmail}</span>.
            Click any link in that email to open your kit directly.
          </p>
          <button
            onClick={() => {
              setSentEmail(null);
              setEmailInput("");
            }}
            className="mt-5 text-xs text-muted-foreground/60 underline underline-offset-2 hover:text-muted-foreground transition-colors"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 pt-10 border-t border-border/40">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-4 h-4" style={{ color: "#8FA883" }} />
        <p className="text-sm font-semibold text-foreground">
          Bought without logging in?
        </p>
      </div>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        Enter the email address you used at checkout and we'll send one-click
        access links straight to your inbox — no account needed.
      </p>

      <form onSubmit={handleLookup} className="flex gap-3 max-w-md">
        <input
          type="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 min-w-0 px-4 py-2.5 rounded-lg text-sm border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#8FA883]/40"
        />
        <button
          type="submit"
          disabled={isLoading || !emailInput.trim()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 shrink-0"
          style={{
            background: "#8FA883",
            color: "#fff",
            boxShadow: "0 4px 12px #8FA88330",
          }}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {isLoading ? "Sending…" : "Send my links"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

export default function MyPurchasesPage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const { data, isLoading, isError } = usePurchases(isAuthenticated);
  const search = useSearch();
  const emailParam = new URLSearchParams(search).get("email") ?? "";

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div
          className="border-b border-border relative overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #0F1F1A 0%, #1A2A20 60%, #1E3028 100%)",
          }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(ellipse at 65% 50%, #8FA883 0%, transparent 55%)",
            }}
          />
          <div className="max-w-2xl mx-auto px-6 py-16 relative text-center">
            <div
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-6 px-3 py-1.5 rounded-full"
              style={{
                color: "#8FA883",
                background: "#8FA88318",
                border: "1px solid #8FA88333",
              }}
            >
              <Package className="w-3.5 h-3.5" />
              <span>My Kits</span>
            </div>
            <h1
              className="font-serif text-4xl font-bold leading-tight mb-4"
              style={{ color: "#FDFBF7" }}
            >
              Access your kits
            </h1>
            <p className="text-base leading-relaxed mb-8" style={{ color: "#C8D4C0" }}>
              Log in to see all kits saved to your account, or look them up by
              email below.
            </p>
            <button
              onClick={login}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:-translate-y-px"
              style={{
                background: "#8FA883",
                color: "#fff",
                boxShadow: "0 4px 16px #8FA88340",
              }}
            >
              <LogIn className="w-4 h-4" />
              Log in to continue
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-12">
          <EmailLookupSection initialEmail={emailParam} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div
        className="border-b border-border relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0F1F1A 0%, #1A2A20 60%, #1E3028 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(ellipse at 65% 50%, #8FA883 0%, transparent 55%)",
          }}
        />
        <div className="max-w-3xl mx-auto px-6 py-14 relative">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full"
            style={{
              color: "#8FA883",
              background: "#8FA88318",
              border: "1px solid #8FA88333",
            }}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>My Kits</span>
          </div>
          <h1
            className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-3"
            style={{ color: "#FDFBF7" }}
          >
            Your Purchases
          </h1>
          <p className="text-base leading-relaxed max-w-xl" style={{ color: "#C8D4C0" }}>
            Every kit you've bought lives here. Click any kit to open it, or re-send
            the access link to your email with one click.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {isLoading && (
          <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading your kits…</span>
          </div>
        )}

        {isError && (
          <div className="py-24 text-center text-muted-foreground">
            Could not load your purchases. Try refreshing.
          </div>
        )}

        {data && data.purchases.length === 0 && (
          <div className="py-16 text-center">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
              style={{ background: "#8FA88318", border: "1px solid #8FA88333" }}
            >
              <Package className="w-7 h-7" style={{ color: "#8FA883" }} />
            </div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-3">
              No kits yet
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-sm mx-auto">
              You haven't purchased a kit yet. Browse the full kit catalog to find the right bundle for your path.
            </p>
            <Link
              href="/kits"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px"
              style={{
                background: "#8FA883",
                color: "#fff",
                boxShadow: "0 4px 12px #8FA88340",
              }}
            >
              Browse Kits
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {data && data.purchases.length > 0 && (
          <div className="flex flex-col gap-4">
            {data.purchases.map((purchase) => {
              const kitName =
                purchase.kit?.name ??
                purchase.kitSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              const kitTagline = purchase.kit?.tagline ?? "";
              const params = new URLSearchParams({
                email: purchase.buyerEmail,
                ...(purchase.token ? { token: purchase.token } : {}),
              });
              const href = `/kits/${purchase.kitSlug}/welcome?${params.toString()}`;
              return (
                <KitCard
                  key={purchase.id}
                  kitSlug={purchase.kitSlug}
                  kitName={kitName}
                  kitTagline={kitTagline}
                  buyerEmail={purchase.buyerEmail}
                  purchasedAt={purchase.purchasedAt}
                  lastResendAt={purchase.lastResendAt}
                  href={href}
                />
              );
            })}

            <div className="mt-8 pt-8 border-t border-border text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Looking for more?
              </p>
              <Link
                href="/kits"
                className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
                style={{ color: "#8FA883" }}
              >
                Browse all kits
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
