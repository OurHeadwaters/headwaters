import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { CheckCircle, ArrowRight, Settings, Loader2 } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

export function CouncilListingSuccessPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const slug = params.get("slug") ?? "";
  const sessionId = params.get("session_id") ?? "";

  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState("");

  async function handleManageBilling() {
    if (!sessionId || !slug) return;
    setPortalLoading(true);
    setPortalError("");
    try {
      const res = await fetch(
        apiUrl(
          `/expert-listings/portal?session_id=${encodeURIComponent(sessionId)}&slug=${encodeURIComponent(slug)}`,
        ),
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPortalError((data as { error?: string }).error ?? "Failed to open billing portal");
        return;
      }
      const data = (await res.json()) as { url: string };
      window.location.assign(data.url);
    } catch {
      setPortalError("Network error — please try again");
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-20 max-w-2xl text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-6">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h1 className="font-serif text-3xl font-bold text-foreground mb-4">
        You're Listed!
      </h1>
      <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
        Your Expert Council featured listing is now active. It will appear on the directory and
        on every zone resource page matching your specialties.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {slug && (
          <button
            onClick={() => navigate(`/council/${slug}`)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-semibold"
          >
            View your profile <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {slug && sessionId && (
          <button
            onClick={handleManageBilling}
            disabled={portalLoading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground hover:bg-muted font-semibold disabled:opacity-60"
          >
            {portalLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Settings className="w-4 h-4" />
            )}
            Manage billing
          </button>
        )}
        {!slug && (
          <button
            onClick={() => navigate("/council")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-semibold"
          >
            Browse the directory <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {portalError && (
        <p className="mt-4 text-sm text-destructive">{portalError}</p>
      )}
    </div>
  );
}
