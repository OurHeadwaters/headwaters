import { useState } from "react";
import { useLocation } from "wouter";
import { Lightbulb, CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

export function SuggestCreatorPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    creatorName: "",
    websiteUrl: "",
    rssFeedUrl: "",
    socialLinks: "",
    whyItFits: "",
    additionalNotes: "",
  });

  function field(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const valid =
    form.creatorName.trim() !== "" &&
    form.websiteUrl.trim() !== "" &&
    form.whyItFits.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(apiUrl("/suggestions/creator"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Submission failed");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Your form data is safe — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-20 max-w-2xl text-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    login();
    return null;
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-20 max-w-2xl text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-foreground mb-4">Suggestion Received</h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Thank you for the suggestion! <strong>{form.creatorName}</strong> has been forwarded to
          the Kitchen Table for ethos review and deliberation. You'll hear about it through the
          community if it gets picked up.
        </p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-semibold"
        >
          Back to Home <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 max-w-3xl">
      <div className="mb-10">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          <Lightbulb className="w-4 h-4" />
          <span>Kitchen Table</span>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
          Suggest a Creator
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Know a podcast, show, or creator that fits The Stomping Paths ethos? Nominate them for
          Kitchen Table review — our vets will check for alignment before any featured placement.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-foreground">
              Creator / Show Name <span className="text-destructive">*</span>
            </label>
            <input
              className="rounded-lg border border-border bg-background text-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Resilient Farming Podcast"
              value={form.creatorName}
              onChange={(e) => field("creatorName", e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Website or Podcast URL <span className="text-destructive">*</span>
            </label>
            <input
              type="url"
              className="rounded-lg border border-border bg-background text-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://example.com"
              value={form.websiteUrl}
              onChange={(e) => field("websiteUrl", e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              RSS Feed URL{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="url"
              className="rounded-lg border border-border bg-background text-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://example.com/feed.xml"
              value={form.rssFeedUrl}
              onChange={(e) => field("rssFeedUrl", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-foreground">
              Social Links{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              className="rounded-lg border border-border bg-background text-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. @handle on X, YouTube channel URL, Instagram..."
              value={form.socialLinks}
              onChange={(e) => field("socialLinks", e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Why does this fit The Stomping Paths?{" "}
            <span className="text-destructive">*</span>
          </label>
          <textarea
            className="w-full rounded-lg border border-border bg-background text-sm p-3 resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="What makes this creator a good fit? What topics do they cover? Why would TSP listeners value their work?"
            value={form.whyItFits}
            onChange={(e) => field("whyItFits", e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Anything else the team should know?{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            className="w-full rounded-lg border border-border bg-background text-sm p-3 resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Red flags to be aware of, caveats, episodes to check first, etc."
            value={form.additionalNotes}
            onChange={(e) => field("additionalNotes", e.target.value)}
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center pt-2">
          <button
            type="submit"
            disabled={!valid || submitting}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 font-semibold text-sm"
          >
            {submitting ? "Submitting…" : "Submit Suggestion"}
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>
          <p className="text-xs text-muted-foreground">
            Suggestions are reviewed by Kitchen Table vets before any placement.
          </p>
        </div>
      </form>
    </div>
  );
}
