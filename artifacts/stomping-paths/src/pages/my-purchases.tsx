import { useState } from "react";
import { Link } from "wouter";
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
} from "lucide-react";
import { KIT_META } from "@/hooks/use-kits";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface PurchasedKit {
  id: number;
  kitSlug: string;
  createdAt: string;
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

interface EmailPurchase {
  id: number;
  kitSlug: string;
  purchasedAt: string;
  token: string | null;
  kit: {
    slug: string;
    name: string;
    tagline: string;
    description: string;
    priceType: string;
    ctaLabel: string;
  } | null;
}

interface EmailPurchasesData {
  purchases: EmailPurchase[];
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

function KitCard({
  kitSlug,
  kitName,
  kitTagline,
  purchasedAt,
  href,
}: {
  kitSlug: string;
  kitName: string;
  kitTagline: string;
  purchasedAt: string;
  href: string;
}) {
  const meta = KIT_META[kitSlug] ?? { icon: "📦", color: "#6B7280" };
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-5 p-6 rounded-xl border bg-card hover:shadow-md transition-all duration-200 group"
      style={{
        borderColor: meta.color + "33",
        background: meta.color + "08",
      }}
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
          <p className="text-xs text-muted-foreground/60 mt-1.5">
            Purchased{" "}
            {new Date(purchasedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
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
  );
}

function EmailLookupSection() {
  const [emailInput, setEmailInput] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<EmailPurchasesData | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const email = emailInput.trim();
    if (!email) return;

    setIsLoading(true);
    setError(null);
    setResults(null);
    setSubmittedEmail(null);

    try {
      const res = await fetch(
        apiUrl(`/kits/purchases-by-email?email=${encodeURIComponent(email)}`),
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Lookup failed — please try again.");
      }
      const data: EmailPurchasesData = await res.json();
      setResults(data);
      setSubmittedEmail(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
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
        Enter the email address you used at checkout and we'll show your kits
        directly — no account needed.
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
          {isLoading ? "Looking…" : "Find my kits"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      )}

      {results && submittedEmail && (
        <div className="mt-6">
          {results.purchases.length === 0 ? (
            <div className="py-8 text-center rounded-xl border border-dashed border-border">
              <Package className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No kits found for <strong>{submittedEmail}</strong>.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Try the email you used at checkout, or{" "}
                <a
                  href="mailto:jack@thesurvivalpodcast.com"
                  className="underline underline-offset-2"
                >
                  contact support
                </a>
                .
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-4">
                Showing kits purchased with{" "}
                <span className="font-semibold text-foreground">
                  {submittedEmail}
                </span>
              </p>
              <div className="flex flex-col gap-4">
                {results.purchases.map((purchase) => {
                  const kitName =
                    purchase.kit?.name ??
                    purchase.kitSlug
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase());
                  const kitTagline = purchase.kit?.tagline ?? "";
                  const params = new URLSearchParams({
                    email: submittedEmail,
                    ...(purchase.token ? { token: purchase.token } : {}),
                  });
                  const href = `/kits/${purchase.kitSlug}/welcome?${params.toString()}`;
                  return (
                    <KitCard
                      key={purchase.id}
                      kitSlug={purchase.kitSlug}
                      kitName={kitName}
                      kitTagline={kitTagline}
                      purchasedAt={purchase.purchasedAt}
                      href={href}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyPurchasesPage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const { data, isLoading, isError } = usePurchases(isAuthenticated);

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
          <EmailLookupSection />
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
            Every kit you've bought lives here. Click any kit to go straight to your welcome page and content.
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
              return (
                <KitCard
                  key={purchase.id}
                  kitSlug={purchase.kitSlug}
                  kitName={kitName}
                  kitTagline={kitTagline}
                  purchasedAt={purchase.createdAt}
                  href={`/kits/${purchase.kitSlug}/welcome`}
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
