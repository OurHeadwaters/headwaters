import { useState } from "react";
import { useLocation } from "wouter";
import { Users, CheckCircle, ArrowRight, Radio, Globe, Calendar, Star } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

const ALL_ZONES = ["zone-0", "zone-1", "zone-2", "zone-3", "zone-4", "zone-5"];
const ZONE_LABELS: Record<string, string> = {
  "zone-0": "Zone 0 — Mind & Money",
  "zone-1": "Zone 1 — Home & Prepared",
  "zone-2": "Zone 2 — Garden",
  "zone-3": "Zone 3 — Homestead",
  "zone-4": "Zone 4 — Wild Harvest",
  "zone-5": "Zone 5 — Community",
};

function ZonePicker({ value, onChange }: { value: string[]; onChange: (z: string[]) => void }) {
  function toggle(zone: string) {
    onChange(value.includes(zone) ? value.filter((z) => z !== zone) : [...value, zone]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {ALL_ZONES.map((z) => (
        <button
          key={z}
          type="button"
          onClick={() => toggle(z)}
          className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
            value.includes(z)
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
          }`}
        >
          {ZONE_LABELS[z]}
        </button>
      ))}
    </div>
  );
}

export function CouncilJoinPage() {
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    bio: "",
    website: "",
    podcastFeedUrl: "",
    consultUrl: "",
    photoUrl: "",
    zones: [] as string[],
  });

  function field(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const valid =
    form.name.trim() &&
    form.email.trim() &&
    form.role.trim() &&
    form.bio.trim() &&
    form.website.trim() &&
    form.zones.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(apiUrl("/expert-listings/apply"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Submission failed");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-20 max-w-2xl text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-foreground mb-4">Application Submitted</h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Thank you for applying to the Expert Council. We'll review your application and reach
          out to you at <strong>{form.email}</strong> with next steps — including a link to
          activate your featured listing.
        </p>
        <button
          onClick={() => navigate("/council")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-semibold"
        >
          Browse the Expert Council <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 max-w-3xl">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          <Users className="w-4 h-4" />
          <span>Expert Council</span>
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
          Join the Expert Council
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Get a featured listing in front of thousands of self-reliant listeners. Your profile
          appears on the Expert Council directory and on relevant zone resource pages — where people
          are already looking for practitioners like you.
        </p>
      </div>

      {/* What you get */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 p-6 rounded-xl bg-muted/50 border border-border">
        <div className="flex gap-3">
          <Star className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-foreground">Featured profile card</p>
            <p className="text-sm text-muted-foreground">Photo, bio, zones, and links on the public directory</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Globe className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-foreground">Zone resource pages</p>
            <p className="text-sm text-muted-foreground">Automatically listed on every zone page you cover</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Radio className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-foreground">Podcast feed (optional)</p>
            <p className="text-sm text-muted-foreground">Your episodes appear alongside TSP content</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-foreground">"Book a Consult" link</p>
            <p className="text-sm text-muted-foreground">Drive traffic directly to your scheduling page</p>
          </div>
        </div>
      </div>

      <div className="mb-6 p-4 rounded-lg border border-border bg-card">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">$149/month</strong> · Cancel anytime via Stripe's customer portal.
          No long-term contract. Listings lapse automatically if payment stops — no manual removal needed.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Full Name <span className="text-destructive">*</span></label>
            <input
              className="rounded-lg border border-border bg-background text-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Jane Smith"
              value={form.name}
              onChange={(e) => field("name", e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Email <span className="text-destructive">*</span></label>
            <input
              type="email"
              className="rounded-lg border border-border bg-background text-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="jane@example.com"
              value={form.email}
              onChange={(e) => field("email", e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Role / Expertise <span className="text-destructive">*</span></label>
            <input
              className="rounded-lg border border-border bg-background text-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Permaculture Designer & Herbalist"
              value={form.role}
              onChange={(e) => field("role", e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Website <span className="text-destructive">*</span></label>
            <input
              type="url"
              className="rounded-lg border border-border bg-background text-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://yoursite.com"
              value={form.website}
              onChange={(e) => field("website", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Bio <span className="text-destructive">*</span></label>
          <textarea
            className="w-full rounded-lg border border-border bg-background text-sm p-3 resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Tell listeners who you are, what you teach, and why your work matters to the self-reliant community (2–4 sentences)..."
            value={form.bio}
            onChange={(e) => field("bio", e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Lifestyle Zones <span className="text-destructive">*</span></label>
          <p className="text-xs text-muted-foreground">Select all zones your expertise covers — you'll be listed on each zone's resource page.</p>
          <ZonePicker value={form.zones} onChange={(z) => setForm((f) => ({ ...f, zones: z }))} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Podcast RSS Feed URL <span className="text-muted-foreground font-normal">(optional)</span></label>
            <input
              type="url"
              className="rounded-lg border border-border bg-background text-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://example.com/feed"
              value={form.podcastFeedUrl}
              onChange={(e) => field("podcastFeedUrl", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">"Book a Consult" Link <span className="text-muted-foreground font-normal">(optional)</span></label>
            <input
              type="url"
              className="rounded-lg border border-border bg-background text-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://calendly.com/yourname"
              value={form.consultUrl}
              onChange={(e) => field("consultUrl", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-foreground">Profile Photo URL <span className="text-muted-foreground font-normal">(optional)</span></label>
            <input
              type="url"
              className="rounded-lg border border-border bg-background text-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://example.com/photo.jpg"
              value={form.photoUrl}
              onChange={(e) => field("photoUrl", e.target.value)}
            />
          </div>
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
            {submitting ? "Submitting…" : "Submit Application"}
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>
          <p className="text-xs text-muted-foreground">
            After review, you'll receive a Stripe checkout link to activate your listing.
          </p>
        </div>
      </form>
    </div>
  );
}
