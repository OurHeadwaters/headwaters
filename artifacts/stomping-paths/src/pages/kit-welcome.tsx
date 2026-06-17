import { Link, useRoute, useLocation } from "wouter";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Package,
  Loader2,
  ExternalLink,
  Mail,
  Bitcoin,
  XCircle,
  Clock,
  WifiOff,
  X,
} from "lucide-react";
import { useKitDetail, KIT_META } from "@/hooks/use-kits";
import { KIT_SESSION_TTL_MS, kitStorageKey } from "@workspace/tsp-constants";

const DEFAULT_STEPS = {
  what: "Work through the curated episodes in this kit in order. Each one builds on the previous.",
  first: "Start with the earliest episodes in your kit's transformation or track — the foundation matters more than the advanced material.",
  next: "Return to this kit as your situation changes. The content compounds over time.",
};

function loadStoredAccess(kitSlug: string): { email: string; emailLinkVerified: boolean; token: string | null } | null {
  try {
    const raw = localStorage.getItem(kitStorageKey(kitSlug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email: string; emailLinkVerified: boolean; token?: string | null; savedAt: number };
    if (Date.now() - parsed.savedAt > KIT_SESSION_TTL_MS) {
      localStorage.removeItem(kitStorageKey(kitSlug));
      return null;
    }
    return { email: parsed.email, emailLinkVerified: parsed.emailLinkVerified, token: parsed.token ?? null };
  } catch {
    return null;
  }
}

function saveStoredAccess(kitSlug: string, email: string, elv: boolean, token?: string | null) {
  try {
    localStorage.setItem(
      kitStorageKey(kitSlug),
      JSON.stringify({ email, emailLinkVerified: elv, token: token ?? null, savedAt: Date.now() }),
    );
  } catch {
  }
}

function getSessionDaysRemaining(kitSlug: string): number | null {
  try {
    const raw = localStorage.getItem(kitStorageKey(kitSlug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: number };
    if (!parsed.savedAt) return null;
    const msRemaining = KIT_SESSION_TTL_MS - (Date.now() - parsed.savedAt);
    if (msRemaining <= 0) return null;
    return Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
  } catch {
    return null;
  }
}

function clearStoredAccess(kitSlug: string) {
  try {
    localStorage.removeItem(kitStorageKey(kitSlug));
  } catch {
  }
}

function getEmailDeliveryHint(email: string): string {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (domain === "gmail.com" || domain === "googlemail.com") {
    return "check Promotions or Spam";
  }
  if (["outlook.com", "hotmail.com", "hotmail.co.uk", "live.com", "msn.com"].includes(domain)) {
    return "check your Junk folder";
  }
  if (["yahoo.com", "yahoo.co.uk", "ymail.com"].includes(domain)) {
    return "check your Spam folder";
  }
  if (["icloud.com", "me.com", "mac.com"].includes(domain)) {
    return "check your Junk folder";
  }
  return "check Spam or Junk";
}

export default function KitWelcomePage() {
  const [, params] = useRoute("/kits/:slug/welcome");
  const [location] = useLocation();
  const slug = params?.slug ?? "";

  const { data: kit, isLoading } = useKitDetail(slug);
  const meta = KIT_META[slug] ?? { icon: "📦", color: "#6B7280" };

  const [sessionVerified, setSessionVerified] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [emailLinkVerified, setEmailLinkVerified] = useState(() => {
    if (!slug) return false;
    return loadStoredAccess(slug)?.emailLinkVerified ?? false;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    if (!slug) return null;
    return loadStoredAccess(slug)?.token ?? null;
  });

  const [accessEmail, setAccessEmail] = useState(() => {
    if (!slug) return "";
    return loadStoredAccess(slug)?.email ?? "";
  });
  const [accessStatus, setAccessStatus] = useState<"idle" | "loading" | "found" | "notFound" | "error">(() => {
    if (!slug) return "idle";
    const stored = loadStoredAccess(slug);
    return stored ? "found" : "idle";
  });
  const [sessionDaysRemaining, setSessionDaysRemaining] = useState<number | null>(() => {
    if (!slug) return null;
    return getSessionDaysRemaining(slug);
  });
  const [sessionExpired, setSessionExpired] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [backgroundCheckWarning, setBackgroundCheckWarning] = useState(false);
  const [backgroundCheckSuccess, setBackgroundCheckSuccess] = useState(false);
  const [backgroundRecheckInFlight, setBackgroundRecheckInFlight] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendRateLimited, setResendRateLimited] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const retryCountRef = useRef(0);
  const retryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backgroundRecheckDoneRef = useRef(false);
  const sessionCheckDoneRef = useRef(false);

  const MAX_RETRIES = 10;
  const RETRY_INTERVAL = 30;

  function clearRetryInterval() {
    if (retryIntervalRef.current !== null) {
      clearInterval(retryIntervalRef.current);
      retryIntervalRef.current = null;
    }
    setRetryCountdown(null);
  }

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] ?? "");
    if (params.get("session_id")) {
      setSessionVerified(true);
    }
    if (params.get("payment")) {
      setPaymentMethod(params.get("payment"));
    }
    const emailParam = params.get("email");
    const tokenParam = params.get("token");
    if (emailParam && tokenParam) {
      setAccessEmail(emailParam);
      setAccessToken(tokenParam);
      runAccessCheck(emailParam, tokenParam);
    }
  }, [location]);

  useEffect(() => {
    if (accessStatus === "notFound" && retryCountRef.current < MAX_RETRIES) {
      setRetryCountdown(RETRY_INTERVAL);
      let seconds = RETRY_INTERVAL;
      retryIntervalRef.current = setInterval(() => {
        seconds -= 1;
        if (seconds <= 0) {
          clearInterval(retryIntervalRef.current!);
          retryIntervalRef.current = null;
          setRetryCountdown(null);
          retryCountRef.current += 1;
          runAccessCheck(accessEmail.trim());
        } else {
          setRetryCountdown(seconds);
        }
      }, 1000);
    } else if (accessStatus !== "notFound") {
      clearRetryInterval();
    }
    return () => {
      clearRetryInterval();
    };
  }, [accessStatus]);

  useEffect(() => {
    if (accessStatus === "found" && slug && accessEmail) {
      saveStoredAccess(slug, accessEmail, emailLinkVerified, accessToken);
      setSessionDaysRemaining(getSessionDaysRemaining(slug));
    }
  }, [accessStatus, slug, accessEmail, emailLinkVerified, accessToken]);

  useEffect(() => {
    if (!slug || sessionCheckDoneRef.current) return;
    const urlParams = new URLSearchParams(location.split("?")[1] ?? "");
    const hasUrlAuth = urlParams.get("email") && urlParams.get("token");
    const hasCache = !!loadStoredAccess(slug);
    if (hasUrlAuth || hasCache) return;
    sessionCheckDoneRef.current = true;
    (async () => {
      try {
        const base = import.meta.env.BASE_URL.replace(/\/$/, "");
        const url = `${base}/api/kits/${encodeURIComponent(slug)}/access`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.hasAccess && data.isAuthenticated) {
          setAccessStatus("found");
        }
      } catch {
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    function handleKitSessionChange(e: Event) {
      const detail = (e as CustomEvent<{ slug: string }>).detail;
      if (detail?.slug !== slug) return;
      if (!loadStoredAccess(slug)) {
        setAccessStatus("idle");
        setAccessEmail("");
        setEmailLinkVerified(false);
        setAccessToken(null);
      }
    }
    window.addEventListener("kit-session-change", handleKitSessionChange);
    return () => window.removeEventListener("kit-session-change", handleKitSessionChange);
  }, [slug]);

  useEffect(() => {
    if (!slug || !accessEmail || backgroundRecheckDoneRef.current) return;
    const restoredFromCache = !!loadStoredAccess(slug);
    if (!restoredFromCache) return;
    backgroundRecheckDoneRef.current = true;
    const email = accessEmail;
    (async () => {
      try {
        const base = import.meta.env.BASE_URL.replace(/\/$/, "");
        const url = `${base}/api/kits/${encodeURIComponent(slug)}/access?email=${encodeURIComponent(email)}`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) {
          setBackgroundCheckWarning(true);
          return;
        }
        const data = await res.json();
        if (data.hasAccess) {
          saveStoredAccess(slug, email, data.tokenVerified ? true : emailLinkVerified);
        } else {
          clearStoredAccess(slug);
          setSessionExpired(true);
          setAccessStatus("idle");
          setAccessEmail("");
        }
      } catch {
        setBackgroundCheckWarning(true);
      }
    })();
  }, [slug]);

  const retryBackgroundCheck = useCallback(async () => {
    if (!slug || !accessEmail) return;
    const email = accessEmail;
    setBackgroundRecheckInFlight(true);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const url = `${base}/api/kits/${encodeURIComponent(slug)}/access?email=${encodeURIComponent(email)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        setBackgroundRecheckInFlight(false);
        return;
      }
      const data = await res.json();
      if (data.hasAccess) {
        saveStoredAccess(slug, email, data.tokenVerified ? true : emailLinkVerified);
        setSessionDaysRemaining(getSessionDaysRemaining(slug));
        setBackgroundCheckSuccess(true);
      }
    } catch {
    } finally {
      setBackgroundRecheckInFlight(false);
    }
  }, [slug, accessEmail, emailLinkVerified]);

  useEffect(() => {
    if (!backgroundCheckWarning || !slug || !accessEmail) return;
    window.addEventListener("online", retryBackgroundCheck);
    return () => window.removeEventListener("online", retryBackgroundCheck);
  }, [backgroundCheckWarning, slug, accessEmail, retryBackgroundCheck]);

  useEffect(() => {
    if (!backgroundCheckSuccess) return;
    const t = setTimeout(() => {
      setBackgroundCheckSuccess(false);
      setBackgroundCheckWarning(false);
    }, 1500);
    return () => clearTimeout(t);
  }, [backgroundCheckSuccess]);

  async function runAccessCheck(email: string, token?: string) {
    if (!email) return;
    setAccessStatus("loading");
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      let url = `${base}/api/kits/${encodeURIComponent(slug)}/access?email=${encodeURIComponent(email)}`;
      if (token) url += `&token=${encodeURIComponent(token)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      if (data.hasAccess) {
        setAccessStatus("found");
        if (data.tokenVerified) setEmailLinkVerified(true);
      } else {
        setAccessStatus("notFound");
      }
    } catch {
      setAccessStatus("error");
    }
  }

  async function checkAccess(e: React.FormEvent) {
    e.preventDefault();
    if (!accessEmail.trim()) return;
    clearRetryInterval();
    retryCountRef.current = 0;
    setResendStatus("idle");
    setResendRateLimited(false);
    await runAccessCheck(accessEmail.trim());
  }

  async function handleResend() {
    if (!accessEmail.trim() || resendStatus === "sending" || resendStatus === "sent") return;
    setResendStatus("sending");
    setResendRateLimited(false);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/kits/${encodeURIComponent(slug)}/resend-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: accessEmail.trim() }),
      });
      if (res.status === 429) {
        setResendRateLimited(true);
        setResendStatus("idle");
        return;
      }
      if (!res.ok) throw new Error("Server error");
      setResendStatus("sent");
    } catch {
      setResendStatus("error");
    }
  }

  function retryNow() {
    clearRetryInterval();
    retryCountRef.current += 1;
    runAccessCheck(accessEmail.trim());
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading your kit…</span>
      </div>
    );
  }

  const kitName = kit?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="min-h-screen bg-background">
      <div
        className="border-b border-border relative overflow-hidden"
        style={{
          background: `linear-gradient(160deg, #0F1F1A 0%, #1A2A20 60%, #1E3028 100%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `radial-gradient(ellipse at 65% 50%, ${meta.color} 0%, transparent 55%)`,
          }}
        />
        <div className="max-w-3xl mx-auto px-6 py-14 relative">
          <Link
            href={`/kits/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 transition-colors"
            style={{ color: "#8FA883" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Kit
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {accessStatus === "found" && (
              <div
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
                style={{
                  color: meta.color,
                  background: meta.color + "18",
                  border: `1px solid ${meta.color}33`,
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Access Confirmed</span>
              </div>
            )}
            {accessStatus === "found" && emailLinkVerified && (
              <div
                className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
                style={{
                  color: "#6b9e6b",
                  background: "#2d4a2d18",
                  border: "1px solid #2d4a2d33",
                }}
              >
                <Mail className="w-3 h-3" />
                <span>Verified via email</span>
              </div>
            )}
            {accessStatus === "found" && (
              <button
                type="button"
                onClick={() => {
                  clearStoredAccess(slug);
                  setAccessStatus("idle");
                  setAccessEmail("");
                  setEmailLinkVerified(false);
                  setAccessToken(null);
                  setSessionDaysRemaining(null);
                  window.dispatchEvent(new CustomEvent("kit-session-change", { detail: { slug } }));
                }}
                className="text-[11px] font-semibold underline underline-offset-2 opacity-50 hover:opacity-80 transition-opacity"
                style={{ color: "#C8D4C0" }}
              >
                Not you? Sign out
              </button>
            )}
          </div>
          {accessStatus === "found" && accessEmail && (
            <p className="text-xs mb-1 -mt-1" style={{ color: "#8FA883" }}>
              Signed in as {accessEmail}
            </p>
          )}
          {accessStatus === "found" && sessionDaysRemaining !== null && sessionDaysRemaining <= 2 && (
            <p className="text-xs mb-4 opacity-60" style={{ color: "#C8A96E" }}>
              {sessionDaysRemaining <= 1
                ? "Access expires tomorrow — visit again to auto-renew."
                : `Access expires in ${sessionDaysRemaining} days — visit again to auto-renew.`}
            </p>
          )}
          {accessStatus === "found" && (sessionDaysRemaining === null || sessionDaysRemaining > 2) && (
            <div className="mb-4" />
          )}

          <div className="flex items-start gap-4 mb-4">
            <span className="text-4xl leading-none mt-1">{meta.icon}</span>
            <div>
              <h1
                className="font-serif text-4xl md:text-5xl font-bold leading-tight"
                style={{ color: "#FDFBF7" }}
              >
                Welcome to the {kitName}
              </h1>
              {sessionVerified ? (
                <p
                  className="text-base font-semibold mt-2"
                  style={{ color: meta.color }}
                >
                  Purchase confirmed — check your inbox for your welcome email.
                </p>
              ) : paymentMethod === "bitcoin" ? (
                <p
                  className="text-base font-semibold mt-2"
                  style={{ color: "#F7931A" }}
                >
                  Bitcoin payment received — check your inbox for your confirmation email.
                </p>
              ) : (
                <p
                  className="text-base font-semibold mt-2"
                  style={{ color: meta.color + "bb" }}
                >
                  Paid with Bitcoin or Lightning? Your access may take a moment to confirm — sit tight.
                </p>
              )}
            </div>
          </div>

          <p className="text-base leading-relaxed max-w-2xl mt-4" style={{ color: "#C8D4C0" }}>
            Here's exactly what to do first. The kit content is organized to build in layers —
            start at the foundation and work forward.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        {sessionVerified && (
          <section
            className="rounded-xl border p-5 flex items-start gap-4"
            style={{
              borderColor: meta.color + "44",
              background: meta.color + "0A",
            }}
          >
            <Mail className="w-5 h-5 shrink-0 mt-0.5" style={{ color: meta.color }} />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">
                Check your inbox
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A welcome email with your kit details and access link is on its way. Check your
                inbox (and spam folder) — it should arrive within a few minutes.
              </p>
            </div>
          </section>
        )}

        {sessionExpired && (accessStatus === "idle" || accessStatus === "notFound" || accessStatus === "loading") && (
          <div
            className="rounded-xl border px-5 py-4 text-sm space-y-3"
            style={{
              borderColor: "#F59E0B44",
              background: "#F59E0B0A",
            }}
          >
            <div className="flex items-start gap-3" style={{ color: "#92400E" }}>
              <Clock className="w-4 h-4 shrink-0 mt-0.5 opacity-70" style={{ color: "#F59E0B" }} />
              <p>
                <span className="font-semibold">Your session expired</span> — re-enter your email to restore access.
              </p>
            </div>
            <form onSubmit={checkAccess} className="flex gap-2">
              <input
                ref={emailInputRef}
                type="email"
                value={accessEmail}
                onChange={(e) => {
                  setAccessEmail(e.target.value);
                  if (accessStatus === "notFound") setAccessStatus("idle");
                  if (resendStatus !== "idle") setResendStatus("idle");
                  setResendRateLimited(false);
                }}
                placeholder="you@example.com"
                required
                className="flex-1 min-w-0 rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2"
                style={{ borderColor: "#F59E0B66" } as React.CSSProperties}
              />
              <button
                type="submit"
                disabled={!accessEmail.trim() || accessStatus === "loading"}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#F59E0B", color: "#fff" }}
              >
                {accessStatus === "loading" ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" />Checking…</>
                ) : (
                  "Restore access"
                )}
              </button>
            </form>

            {accessStatus === "notFound" && resendStatus !== "sent" && (
              <div className="flex flex-col gap-1">
                <p className="text-xs" style={{ color: "#92400E" }}>
                  No purchase found for that email — double-check the address you used at checkout.
                </p>
                {resendRateLimited ? (
                  <p className="text-xs text-muted-foreground">
                    Too many requests — please wait 15 minutes and try again.
                  </p>
                ) : resendStatus === "error" ? (
                  <p className="text-xs" style={{ color: "#B91C1C" }}>
                    Could not send — please try again in a moment.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Lost your welcome email?{" "}
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendStatus === "sending"}
                      className="underline underline-offset-2 font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ color: "#F59E0B" }}
                    >
                      {resendStatus === "sending" ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Sending…
                        </span>
                      ) : (
                        "Re-send my access link"
                      )}
                    </button>
                  </p>
                )}
              </div>
            )}

            {resendStatus === "sent" && (
              <div
                className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
                style={{ background: "#16A34A10", border: "1px solid #16A34A33", color: "#15803D" }}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  If that email matches a purchase, you'll receive a new access link shortly.
                  {accessEmail.includes("@") && (
                    <> We sent it to <strong>{accessEmail.split("@")[1]}</strong> — {getEmailDeliveryHint(accessEmail)}.</>
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        {backgroundCheckWarning && (
          <div
            className="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-colors"
            style={
              backgroundCheckSuccess
                ? { background: "#0F2A1A0D", borderColor: "#16A34A55", color: "#166534" }
                : backgroundRecheckInFlight
                ? { background: "#0F1F1A0A", borderColor: "#8FA88344", color: "#4B6B55" }
                : { background: "#78350F0A", borderColor: "#92400E33", color: "#92400E" }
            }
          >
            {backgroundCheckSuccess ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#16A34A" }} />
            ) : backgroundRecheckInFlight ? (
              <Loader2 className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />
            ) : (
              <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span className="flex-1 leading-snug">
              {backgroundCheckSuccess
                ? "Connected — access verified"
                : backgroundRecheckInFlight
                ? "Reconnected — verifying your access…"
                : "Couldn't verify your access — check your connection. Your cached access is still active."}
            </span>
            {!backgroundCheckSuccess && (
              <button
                type="button"
                onClick={retryBackgroundCheck}
                disabled={backgroundRecheckInFlight}
                className="shrink-0 text-xs font-semibold underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-1"
              >
                {backgroundRecheckInFlight ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Checking…
                  </>
                ) : (
                  "Try again"
                )}
              </button>
            )}
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => { setBackgroundCheckSuccess(false); setBackgroundCheckWarning(false); }}
              className="shrink-0 opacity-50 hover:opacity-80 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {accessStatus === "found" && accessEmail && (
          <div
            className="rounded-xl border px-5 py-4"
            style={{ borderColor: "#2d4a2d22", background: "#0F1F1A06" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground mb-0.5">
                  Need your access link again?
                </p>
                <p className="text-xs text-muted-foreground">
                  {resendStatus === "sent" ? (
                    <>
                      A new link has been sent to {accessEmail}
                      {accessEmail.includes("@") && (
                        <> — {getEmailDeliveryHint(accessEmail)}</>
                      )}.
                    </>
                  ) : (
                    `We'll re-send your welcome email to ${accessEmail}.`
                  )}
                </p>
              </div>
              <div className="shrink-0">
                {resendStatus === "sent" ? (
                  <div
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                    style={{ background: "#16A34A12", color: "#15803D", border: "1px solid #16A34A2a" }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Sent — check your inbox
                  </div>
                ) : resendRateLimited ? (
                  <p className="text-xs text-muted-foreground">
                    Too many requests — wait 15 minutes and try again.
                  </p>
                ) : resendStatus === "error" ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-xs font-semibold underline underline-offset-2 transition-opacity hover:opacity-80"
                    style={{ color: "#B91C1C" }}
                  >
                    Failed — try again
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendStatus === "sending"}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    style={{ background: "#2d4a2d", color: "#fff" }}
                  >
                    {resendStatus === "sending" ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Mail className="w-3 h-3" />
                        Re-send my access link
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {paymentMethod === "bitcoin" && (
          <section
            className="rounded-xl border p-6"
            style={{
              borderColor: "#F7931A44",
              background: "#F7931A0A",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5"
                style={{ background: "#F7931A18" }}
              >
                <Mail className="w-5 h-5" style={{ color: "#F7931A" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Bitcoin className="w-4 h-4" style={{ color: "#F7931A" }} />
                  <h3 className="font-serif text-base font-bold text-foreground">
                    Confirmation email on its way
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your Bitcoin / Lightning payment has been received. A confirmation email with your
                  kit access details has been sent to the address you provided at checkout. Check
                  your inbox (and spam folder if needed) — it should arrive within a few minutes.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t" style={{ borderColor: "#F7931A22" }}>
              <p className="text-sm font-semibold text-foreground mb-3">
                Check your access
              </p>
              {accessStatus === "found" ? (
                <div
                  className="flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-semibold"
                  style={{ background: "#16A34A18", color: "#16A34A", border: "1px solid #16A34A33" }}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Access confirmed — you're all set. Your kit is ready.
                </div>
              ) : accessStatus === "notFound" ? (
                <div className="space-y-3">
                  {retryCountdown !== null && retryCountRef.current < MAX_RETRIES ? (
                    <div
                      className="flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm font-semibold"
                      style={{ background: "#6B728018", color: "#4B5563", border: "1px solid #6B728033" }}
                    >
                      <Clock className="w-4 h-4 shrink-0 mt-0.5 animate-clock-spin" />
                      <div>
                        <span>Not recorded yet — Bitcoin payments can take a minute.</span>
                        <span className="flex items-center gap-1.5 text-xs font-normal mt-1 opacity-70 animate-pulse">
                          Checking again in {retryCountdown}s…
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm font-semibold"
                      style={{ background: "#F7931A18", color: "#C96A00", border: "1px solid #F7931A33" }}
                    >
                      <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span>Not recorded yet — Bitcoin payments can take a minute.</span>
                        {retryCountRef.current >= MAX_RETRIES && (
                          <span className="block text-xs font-normal mt-1 opacity-80">
                            Auto-retry stopped after 5 minutes. Try again manually below.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={retryNow}
                      className="text-xs font-semibold underline underline-offset-2"
                      style={{ color: "#F7931A" }}
                    >
                      Try again now
                    </button>
                    <button
                      type="button"
                      onClick={() => { clearRetryInterval(); retryCountRef.current = 0; setAccessStatus("idle"); setAccessEmail(""); clearStoredAccess(slug); }}
                      className="text-xs font-semibold underline underline-offset-2 opacity-60"
                      style={{ color: "#C96A00" }}
                    >
                      Try a different email
                    </button>
                  </div>
                </div>
              ) : accessStatus === "error" ? (
                <div className="space-y-3">
                  <div
                    className="flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-semibold"
                    style={{ background: "#EF444418", color: "#B91C1C", border: "1px solid #EF444433" }}
                  >
                    <XCircle className="w-4 h-4 shrink-0" />
                    Something went wrong. Please try again.
                  </div>
                  <button
                    type="button"
                    onClick={() => setAccessStatus("idle")}
                    className="text-xs font-semibold underline underline-offset-2"
                    style={{ color: "#F7931A" }}
                  >
                    Try again
                  </button>
                </div>
              ) : sessionExpired ? null : (
                <form onSubmit={checkAccess} className="flex gap-2">
                  <input
                    ref={emailInputRef}
                    type="email"
                    value={accessEmail}
                    onChange={(e) => setAccessEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={accessStatus === "loading"}
                    className="flex-1 min-w-0 rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 disabled:opacity-50"
                    style={{ borderColor: "#F7931A44", focusRingColor: "#F7931A" } as React.CSSProperties}
                  />
                  <button
                    type="submit"
                    disabled={accessStatus === "loading" || !accessEmail.trim()}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "#F7931A", color: "#fff" }}
                  >
                    {accessStatus === "loading" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Checking…
                      </>
                    ) : (
                      "Check access"
                    )}
                  </button>
                </form>
              )}
            </div>
          </section>
        )}

        <section>
          <div
            className="rounded-xl border p-6 md:p-8 space-y-6"
            style={{
              borderColor: meta.color + "33",
              background: meta.color + "08",
            }}
          >
            <div
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: meta.color }}
            >
              <span>📖</span>
              <span>Your User Manual</span>
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                <span style={{ color: meta.color }}>◆</span>
                What this kit is for
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed pl-5">
                {kit?.userManual?.what ?? kit?.description ?? DEFAULT_STEPS.what}
              </p>
            </div>

            <div>
              <h3 className="font-serif text-base font-bold text-foreground mb-2 flex items-center gap-2">
                <span style={{ color: meta.color }}>→</span>
                What to do first
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed pl-5">
                {kit?.userManual?.first ?? DEFAULT_STEPS.first}
              </p>
            </div>

            <div>
              <h3 className="font-serif text-base font-bold text-foreground mb-2 flex items-center gap-2">
                <span style={{ color: meta.color }}>→→</span>
                What to do next
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed pl-5">
                {kit?.userManual?.next ?? DEFAULT_STEPS.next}
              </p>
            </div>
          </div>
        </section>

        {kit && kit.transformations && kit.transformations.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Your Transformation Path
            </h2>
            <div className="flex flex-col gap-3">
              {kit.transformations.map((t: any) => (
                <Link
                  key={t.slug}
                  href={`/episodes?transformation=${encodeURIComponent(t.slug)}`}
                  className="flex items-center justify-between gap-4 p-5 rounded-xl border bg-card hover:shadow-md transition-all duration-200 group"
                  style={{ borderColor: t.color + "33", background: t.color + "06" }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{t.icon}</span>
                    <div>
                      <p className="font-serif font-bold text-sm text-foreground">
                        {t.from} → {t.to}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-1">
                        {t.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {kit && kit.tracks && kit.tracks.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Start Your First Track
            </h2>
            <div className="flex flex-col gap-3">
              {kit.tracks.map((track: any) => (
                <Link
                  key={track.slug}
                  href={`/tracks/${track.slug}`}
                  className="flex items-center justify-between gap-4 p-5 rounded-xl border bg-card hover:shadow-md transition-all duration-200 group"
                  style={{
                    borderColor: (track.color ?? meta.color) + "33",
                    background: (track.color ?? meta.color) + "06",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{track.icon ?? "📚"}</span>
                    <div>
                      <p className="font-serif font-bold text-sm text-foreground">
                        {track.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {track.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {kit && kit.externalLinks && kit.externalLinks.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-bold text-foreground mb-4">
              Kit Resources
            </h2>
            <div className="flex flex-col gap-3">
              {kit.externalLinks.map((link: any) => (
                <a
                  key={link.url}
                  href={link.url}
                  target={link.url.startsWith("http") ? "_blank" : undefined}
                  rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex items-center justify-between gap-4 p-5 rounded-xl border bg-card hover:shadow-md transition-all duration-200 group"
                  style={{ borderColor: meta.color + "33", background: meta.color + "06" }}
                >
                  <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                    {link.label}
                  </span>
                  <ExternalLink className="w-4 h-4 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </section>
        )}

        <section
          className="rounded-2xl border p-8"
          style={{
            borderColor: meta.color + "33",
            background: `linear-gradient(135deg, ${meta.color}10 0%, ${meta.color}06 100%)`,
          }}
        >
          <div className="flex items-start gap-4">
            <Package className="w-6 h-6 shrink-0 mt-0.5" style={{ color: meta.color }} />
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground mb-2">
                Everything is ready
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {(kit as any)?.accessUrl
                  ? "Your course access is confirmed. Click below to go directly to your course platform."
                  : "Your kit content — episodes, gear recommendations, and resources — is organized for your transformation. Return to the kit page at any time."}
              </p>
              {(kit as any)?.accessUrl ? (
                <a
                  href={(kit as any).accessUrl as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:-translate-y-px"
                  style={{
                    color: "#fff",
                    background: meta.color,
                    boxShadow: `0 4px 20px ${meta.color}40`,
                  }}
                >
                  Go to Course
                  <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <Link
                  href={`/kits/${slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:-translate-y-px"
                  style={{
                    color: "#fff",
                    background: meta.color,
                    boxShadow: `0 4px 20px ${meta.color}40`,
                  }}
                >
                  View Kit Content
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </section>

        <div className="pb-4">
          <Link
            href="/kits"
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
            style={{ color: meta.color + "99" }}
          >
            <ArrowLeft className="w-4 h-4" />
            All Kits
          </Link>
        </div>
      </div>
    </div>
  );
}
