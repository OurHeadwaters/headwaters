import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

export default function WorkshopsResendLinkPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const canSubmit = email.trim().includes("@") && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(apiUrl("/ground-events/resend-confirmation"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((j as { error?: string }).error ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1.5px solid rgba(90,120,90,0.35)",
    color: "#E8E0C8",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "14px",
    outline: "none",
    width: "100%",
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #1C3020 0%, #1A2820 100%)" }}
    >
      <div className="container mx-auto px-4 md:px-6 py-14 max-w-md">
        <button
          onClick={() => navigate("/workshops/host")}
          className="flex items-center gap-1.5 text-xs mb-8 transition-colors"
          style={{ color: "#7AB8A0" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Host a Workshop
        </button>

        <div
          className="rounded-2xl p-8"
          style={{
            background: "linear-gradient(150deg, #1C3020 0%, #243028 100%)",
            border: "1.5px solid #3A5040",
            boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
          }}
        >
          {sent ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-12 h-12" style={{ color: "#6DBA8A" }} />
              </div>
              <h2
                className="text-xl font-bold mb-3"
                style={{ fontFamily: "Georgia, serif", color: "#F2CA8C" }}
              >
                Check your inbox
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#8AB8A0" }}>
                If that email is connected to a workshop listing, you'll receive your dashboard
                link shortly. Check your spam folder if it doesn't arrive within a few minutes.
              </p>
              <button
                onClick={() => navigate("/workshops")}
                className="text-xs font-semibold underline"
                style={{ color: "#7AB8A0" }}
              >
                View Workshop Board →
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-5">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(44,74,54,0.4)", border: "1px solid rgba(58,90,64,0.6)" }}
                >
                  <Mail className="w-6 h-6" style={{ color: "#7AB8A0" }} />
                </div>
              </div>
              <h2
                className="text-xl font-bold text-center mb-2"
                style={{ fontFamily: "Georgia, serif", color: "#F2CA8C" }}
              >
                Resend my dashboard link
              </h2>
              <p className="text-sm text-center leading-relaxed mb-7" style={{ color: "#8AB8A0" }}>
                Enter the contact email you used when you listed your workshop and we'll
                resend your private management link.
              </p>

              <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
                {error && (
                  <div
                    className="p-3 rounded-lg text-sm"
                    style={{
                      background: "rgba(166,75,54,0.15)",
                      color: "#E87060",
                      border: "1px solid rgba(166,75,54,0.3)",
                    }}
                  >
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="resend-email"
                    className="block text-xs font-bold uppercase tracking-widest mb-1.5"
                    style={{ color: "#7AB8A0" }}
                  >
                    Your contact email
                  </label>
                  <input
                    id="resend-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    maxLength={160}
                    required
                    style={inputStyle}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #2C4A36 0%, #1C3020 100%)",
                    color: "#A8D8A8",
                    border: "1.5px solid rgba(58,90,64,0.8)",
                  }}
                >
                  <Mail className="w-4 h-4" />
                  {submitting ? "Sending…" : "Send my dashboard link"}
                </button>
              </form>

              <p className="text-xs text-center mt-5" style={{ color: "#4A6850" }}>
                Resends are limited to once every 10 minutes per email address.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
