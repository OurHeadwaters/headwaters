import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { MapPin, Calendar, Users, Wifi, Star, Ticket, X, Filter } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface GroundEvent {
  id: number;
  title: string;
  description: string;
  hostName: string;
  eventDate: string;
  location: string;
  isOnline: boolean;
  priceDisplay: string;
  externalUrl: string | null;
  seats: number | null;
  contactEmail: string | null;
  isApproved: boolean;
  isFeatured: boolean;
  rsvpCount: number;
  createdAt: string;
  ticketPriceCents: number | null;
  breakEvenTickets: number;
  platformSharePct: number | null;
  isStripeReady: boolean;
  transformationSlug: string | null;
  hasRsvped?: boolean;
}

const TRANSFORMATIONS = [
  { slug: "conventional-to-regenerative", label: "Regenerative", icon: "🌱", color: "#4A7A3A" },
  { slug: "tradfi-to-hard-assets", label: "Hard Assets", icon: "⚖️", color: "#B5853A" },
  { slug: "employee-to-owner", label: "Owner Mindset", icon: "🔑", color: "#C4622D" },
  { slug: "grid-to-off-grid", label: "Off-Grid", icon: "⚡", color: "#2C6E8A" },
  { slug: "outsourced-health-to-health-sovereign", label: "Health Sovereign", icon: "🌿", color: "#7B5EA7" },
  { slug: "individual-to-community-scale", label: "Community Scale", icon: "🤝", color: "#8A6A2C" },
];

function formatDate(d: string): string {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function RsvpModal({
  event,
  onConfirm,
  onClose,
  isPending,
  error,
}: {
  event: GroundEvent;
  onConfirm: (name: string, email: string) => void;
  onClose: () => void;
  isPending: boolean;
  error: string | null;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const canSubmit = email.trim().includes("@") && !isPending;

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1.5px solid rgba(90,120,90,0.35)",
    color: "#E8E0C8",
    borderRadius: "10px",
    padding: "9px 13px",
    fontSize: "14px",
    outline: "none",
    width: "100%",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(150deg, #1E2E22 0%, #1A2820 100%)",
          border: "1.5px solid #3A5040",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
        }}
      >
        <div
          className="px-5 py-4 flex items-center gap-2"
          style={{ background: "linear-gradient(90deg, #3A2A14 0%, #4A3420 100%)", borderBottom: "1px solid #5A3818" }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold" style={{ color: "#D9A066" }}>Reserve a spot</p>
            <p className="text-xs truncate" style={{ color: "#9A7850" }}>{event.title}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg transition-colors hover:bg-white/10">
            <X className="w-4 h-4" style={{ color: "#8A7860" }} />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(166,75,54,0.15)", color: "#E87060", border: "1px solid rgba(166,75,54,0.3)" }}>
              {error}
            </div>
          )}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#7AB8A0" }}>Your name (optional)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane from Colorado" maxLength={120} style={inputStyle} />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#7AB8A0" }}>Your email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" maxLength={160} style={inputStyle} />
            <p className="text-xs mt-1.5" style={{ color: "#4A6850" }}>Shared with the host so they can send details.</p>
          </div>
          <button
            onClick={() => canSubmit && onConfirm(name.trim(), email.trim())}
            disabled={!canSubmit}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #2C4A36 0%, #1C3020 100%)", color: "#A8D8A8", border: "1px solid rgba(58,90,64,0.8)" }}
          >
            {isPending ? "Saving…" : "Confirm RSVP"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EventCard({
  event,
  onRsvp,
  rsvping,
  rsvpError,
}: {
  event: GroundEvent;
  onRsvp: (id: number, name: string, email: string) => void;
  rsvping: boolean;
  rsvpError: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const isFull = event.seats !== null && event.rsvpCount >= event.seats;
  const seatsLeft = event.seats !== null ? event.seats - event.rsvpCount : null;
  const transformation = event.transformationSlug
    ? TRANSFORMATIONS.find((t) => t.slug === event.transformationSlug)
    : null;

  async function initiateCheckout() {
    const res = await fetch(apiUrl(`/ground-events/${event.id}/checkout`), {
      method: "POST",
      credentials: "include",
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((j as { error?: string }).error ?? "Checkout failed");
    window.location.href = (j as { url: string }).url;
  }

  return (
    <>
      {showModal && (
        <RsvpModal
          event={event}
          onConfirm={(name, email) => {
            onRsvp(event.id, name, email);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
          isPending={rsvping}
          error={rsvpError}
        />
      )}

      <div
        className="rounded-2xl overflow-hidden transition-all duration-200"
        style={{
          background: event.isFeatured
            ? "linear-gradient(150deg, #2C3E24 0%, #1E3018 100%)"
            : "linear-gradient(150deg, #242E26 0%, #1A2820 100%)",
          border: event.isFeatured ? "1.5px solid #5A8040" : "1.5px solid #2E4432",
          boxShadow: event.isFeatured ? "0 3px 18px rgba(44,74,36,0.3)" : "0 2px 10px rgba(0,0,0,0.2)",
        }}
      >
        <div
          className="px-5 py-3 flex items-center gap-2 flex-wrap"
          style={{ background: "linear-gradient(90deg, #3A2A14 0%, #4A3420 100%)", borderBottom: "1px solid #5A3818" }}
        >
          {event.isFeatured && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: "rgba(217,160,102,0.25)", color: "#D9A066", border: "1px solid rgba(217,160,102,0.5)" }}>
              <Star className="w-2.5 h-2.5" />Featured
            </span>
          )}
          {transformation && (
            <span
              className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${transformation.color}20`, color: transformation.color, border: `1px solid ${transformation.color}50` }}
            >
              {transformation.icon} {transformation.label}
            </span>
          )}
          <Calendar className="w-3.5 h-3.5 shrink-0 ml-auto" style={{ color: "#D9A066" }} />
          <span className="text-xs font-semibold" style={{ color: "#D9A066" }}>{formatDate(event.eventDate)}</span>
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ml-2"
            style={{
              background: event.priceDisplay.toLowerCase() === "free" ? "rgba(44,100,54,0.6)" : "rgba(217,160,102,0.2)",
              color: event.priceDisplay.toLowerCase() === "free" ? "#6DCA8A" : "#D9A066",
              border: `1px solid ${event.priceDisplay.toLowerCase() === "free" ? "rgba(44,100,54,0.8)" : "rgba(217,160,102,0.5)"}`,
            }}
          >
            {event.priceDisplay}
          </span>
        </div>

        <div className="p-5">
          <h3 className="font-bold text-lg leading-snug mb-1.5" style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#F2E8D0" }}>
            {event.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mb-3">
            {event.isOnline ? (
              <span className="flex items-center gap-1 text-xs" style={{ color: "#7AB0D0" }}><Wifi className="w-3 h-3" />Online</span>
            ) : (
              <span className="flex items-center gap-1 text-xs" style={{ color: "#8AB88A" }}><MapPin className="w-3 h-3" />{event.location}</span>
            )}
            <span className="text-xs" style={{ color: "#3A5A40" }}>·</span>
            <span className="text-xs" style={{ color: "#9AB09A" }}>
              Hosted by <span style={{ color: "#C4D8C4" }}>{event.hostName}</span>
            </span>
          </div>

          <p className="text-sm leading-relaxed mb-3" style={{ color: "#9AB09A" }}>
            {expanded || event.description.length <= 160 ? event.description : `${event.description.slice(0, 160)}…`}
          </p>
          {event.description.length > 160 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs mb-3 transition-colors"
              style={{ color: "#7AB88A" }}
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}

          <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: "1px solid rgba(58,80,64,0.4)" }}>
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "#6A8870" }}>
                <Users className="w-3 h-3 shrink-0" />
                <span>
                  {event.rsvpCount} going
                  {seatsLeft !== null && (
                    <> · <span style={{ color: seatsLeft <= 5 ? "#D9A066" : "#6A8870" }}>
                      {seatsLeft > 0 ? `${seatsLeft} left` : "Full"}
                    </span></>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {event.externalUrl && !event.ticketPriceCents && (
                <a
                  href={event.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{ color: "#D9A066", border: "1px solid rgba(217,160,102,0.3)", background: "rgba(217,160,102,0.07)" }}
                >
                  <Ticket className="w-3 h-3" />Get Tickets
                </a>
              )}

              {event.ticketPriceCents && event.isStripeReady && !isFull && !event.hasRsvped ? (
                <button
                  onClick={() => void initiateCheckout()}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg transition-all"
                  style={{ background: "linear-gradient(135deg, #7A5030 0%, #5A3818 100%)", color: "#F2CA8C", border: "1.5px solid #9A6840" }}
                >
                  <Ticket className="w-3 h-3" />Get Tickets — {event.priceDisplay}
                </button>
              ) : event.ticketPriceCents && event.hasRsvped ? (
                <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ background: "rgba(44,74,54,0.55)", color: "#6DBA8A", border: "1px solid rgba(44,74,54,0.75)" }}>
                  ✓ Ticket Purchased
                </span>
              ) : event.ticketPriceCents && !event.isStripeReady ? (
                <span className="text-xs px-3 py-1.5 rounded-lg" style={{ color: "#A87060", border: "1px solid rgba(166,75,54,0.3)", background: "rgba(100,50,30,0.15)" }}>
                  Tickets coming soon
                </span>
              ) : !event.ticketPriceCents ? (
                <button
                  onClick={() => !event.hasRsvped && !isFull && setShowModal(true)}
                  disabled={!!event.hasRsvped || isFull}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg transition-all"
                  style={
                    event.hasRsvped
                      ? { background: "rgba(44,74,54,0.55)", color: "#6DBA8A", border: "1px solid rgba(44,74,54,0.75)", cursor: "default" }
                      : isFull
                      ? { background: "rgba(100,50,30,0.25)", color: "#A87060", border: "1px solid rgba(166,75,54,0.25)", cursor: "not-allowed" }
                      : { background: "linear-gradient(135deg, #2C4A36 0%, #1C3020 100%)", color: "#A8D8A8", border: "1px solid rgba(58,90,64,0.8)" }
                  }
                >
                  {event.hasRsvped ? "✓ I'm Going" : isFull ? "Full" : "I'm Going"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function WorkshopsBrowsePage() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const params = new URLSearchParams(search);
  const [filterTransformation, setFilterTransformation] = useState(params.get("path") ?? "");
  const [filterFormat, setFilterFormat] = useState<"all" | "online" | "local">("all");
  const [filterZone, setFilterZone] = useState(params.get("zone") ?? "");
  const [rsvpModal, setRsvpModal] = useState<{ eventId: number } | null>(null);
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(search);
    const connectResult = p.get("stripe_connect");
    const eventId = p.get("eventId");
    if (connectResult === "success" && eventId) {
      fetch(apiUrl(`/ground-events/${eventId}/connect/status`), { credentials: "include" })
        .then(() => qc.invalidateQueries({ queryKey: ["workshops-browse"] }))
        .catch(() => void 0);
      const clean = new URL(window.location.href);
      clean.searchParams.delete("stripe_connect");
      clean.searchParams.delete("eventId");
      window.history.replaceState({}, "", clean.toString());
    }
  }, [search, qc]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["workshops-browse", filterTransformation, filterZone],
    queryFn: async () => {
      const qs = new URLSearchParams({ status: "upcoming", limit: "50" });
      if (filterTransformation) qs.set("transformation", filterTransformation);
      if (filterZone) qs.set("zone", filterZone);
      const res = await fetch(apiUrl(`/ground-events?${qs}`));
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{ events: GroundEvent[]; total: number }>;
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: async (d: { eventId: number; attendeeName: string; attendeeEmail: string }) => {
      const res = await fetch(apiUrl(`/ground-events/${d.eventId}/rsvp`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ attendeeEmail: d.attendeeEmail, attendeeName: d.attendeeName }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error ?? "RSVP failed");
      return j as { eventId: number; rsvpCount: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workshops-browse"] });
      setRsvpModal(null);
    },
    onError: (err) => {
      setRsvpError(err instanceof Error ? err.message : "RSVP failed");
    },
  });

  let events = data?.events ?? [];
  if (filterFormat === "online") events = events.filter((e) => e.isOnline);
  if (filterFormat === "local") events = events.filter((e) => !e.isOnline);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #1C3020 0%, #1A2820 100%)" }}>
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-5xl">
        <header className="mb-10">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-3 px-3 py-1.5 rounded-full" style={{ color: "#D9A066", background: "rgba(217,160,102,0.15)", border: "1px solid rgba(217,160,102,0.3)" }}>
                🔨 Community Workshops
              </div>
              <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#F2CA8C" }}>
                Workshop Board
              </h1>
              <p className="text-base leading-relaxed max-w-xl" style={{ color: "#8AB8A0" }}>
                Community-run workshops on homesteading, self-reliance, and sovereignty skills.
              </p>
            </div>
            <div className="shrink-0 hidden sm:flex flex-col gap-2 items-end">
              <button
                onClick={() => navigate("/workshops/host")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(135deg, #7A5030 0%, #5A3818 100%)", color: "#F2CA8C", border: "1.5px solid #9A6840", boxShadow: "0 3px 12px rgba(0,0,0,0.3)" }}
              >
                🔨 Host a Workshop
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="w-3.5 h-3.5 shrink-0" style={{ color: "#6A8870" }} />
              <button
                onClick={() => setFilterTransformation("")}
                className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                style={!filterTransformation ? { background: "rgba(217,160,102,0.25)", color: "#D9A066", border: "1px solid rgba(217,160,102,0.5)" } : { background: "transparent", color: "#6A8870", border: "1px solid rgba(58,80,64,0.4)" }}
              >
                All paths
              </button>
              {TRANSFORMATIONS.map((t) => (
                <button
                  key={t.slug}
                  onClick={() => setFilterTransformation(filterTransformation === t.slug ? "" : t.slug)}
                  className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                  style={
                    filterTransformation === t.slug
                      ? { background: `${t.color}30`, color: t.color, border: `1px solid ${t.color}60` }
                      : { background: "transparent", color: "#6A8870", border: "1px solid rgba(58,80,64,0.4)" }
                  }
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="w-3.5 h-3.5 shrink-0" />
              <button
                onClick={() => setFilterZone("")}
                className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                style={!filterZone ? { background: "rgba(44,74,54,0.5)", color: "#7AB8A0", border: "1px solid rgba(44,74,54,0.8)" } : { background: "transparent", color: "#6A8870", border: "1px solid rgba(58,80,64,0.4)" }}
              >
                All zones
              </button>
              {([
                { slug: "zone-0", label: "Zone 0 — Self",       icon: "🧘" },
                { slug: "zone-1", label: "Zone 1 — Home",       icon: "🏠" },
                { slug: "zone-2", label: "Zone 2 — Garden",     icon: "🌱" },
                { slug: "zone-3", label: "Zone 3 — Homestead",  icon: "🏡" },
                { slug: "zone-4", label: "Zone 4 — Forest",     icon: "🌲" },
                { slug: "zone-5", label: "Zone 5 — Wild",       icon: "🏕️" },
              ]).map((z) => (
                <button
                  key={z.slug}
                  onClick={() => setFilterZone(filterZone === z.slug ? "" : z.slug)}
                  className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                  style={
                    filterZone === z.slug
                      ? { background: "rgba(44,74,54,0.5)", color: "#7AB8A0", border: "1px solid rgba(44,74,54,0.8)" }
                      : { background: "transparent", color: "#6A8870", border: "1px solid rgba(58,80,64,0.4)" }
                  }
                >
                  {z.icon} {z.label}
                </button>
              ))}
              <div className="w-px h-4 self-center mx-1" style={{ background: "rgba(58,80,64,0.4)" }} />
              {(["all", "online", "local"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFilterFormat(fmt)}
                  className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                  style={
                    filterFormat === fmt
                      ? { background: "rgba(44,74,54,0.5)", color: "#7AB8A0", border: "1px solid rgba(44,74,54,0.8)" }
                      : { background: "transparent", color: "#6A8870", border: "1px solid rgba(58,80,64,0.4)" }
                  }
                >
                  {fmt === "all" ? "All formats" : fmt === "online" ? "Online" : "In-person"}
                </button>
              ))}
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: "rgba(44,74,54,0.12)" }} />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16" style={{ color: "#7A9880" }}>Failed to load workshops. Try refreshing.</div>
        ) : events.length === 0 ? (
          <div
            className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-center py-24 px-8 text-center"
            style={{ background: "linear-gradient(160deg, #1C2A1E 0%, #243028 60%, #1A2820 100%)", border: "4px solid #3A5040", boxShadow: "inset 0 2px 24px rgba(0,0,0,0.55)" }}
          >
            <div className="text-5xl mb-5">🔨</div>
            <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "Georgia, serif", color: "#E8E0C8" }}>
              {filterTransformation ? "No workshops on this path yet" : "No upcoming workshops"}
            </h2>
            <p className="text-sm leading-relaxed max-w-md mb-8" style={{ color: "#9AB89A" }}>
              {filterTransformation
                ? "Be the first to host on this transformation path."
                : "Be the first to host. Share what you know — fermentation, off-grid power, foraging, food preservation."}
            </p>
            <button
              onClick={() => navigate("/workshops/host")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7A5030 0%, #5A3818 100%)", color: "#F2CA8C", border: "1.5px solid #9A6840" }}
            >
              🔨 Host a Workshop
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRsvp={(id, name, email) => rsvpMutation.mutate({ eventId: id, attendeeName: name, attendeeEmail: email })}
                  rsvping={rsvpMutation.isPending && rsvpModal?.eventId === event.id}
                  rsvpError={rsvpModal?.eventId === event.id ? rsvpError : null}
                />
              ))}
            </div>

            <div
              className="mt-10 p-5 rounded-xl text-center flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ border: "1px dashed rgba(217,160,102,0.3)", background: "rgba(217,160,102,0.04)" }}
            >
              <p className="text-sm" style={{ color: "#8AB8A0" }}>
                <span style={{ color: "#D9A066", fontWeight: 600 }}>Know something worth teaching?</span>{" "}
                Anyone in the community can host.
              </p>
              <button
                onClick={() => navigate("/workshops/host")}
                className="shrink-0 text-xs font-semibold px-4 py-2 rounded-lg transition-all"
                style={{ background: "rgba(217,160,102,0.15)", color: "#D9A066", border: "1px solid rgba(217,160,102,0.35)" }}
              >
                Host a Workshop →
              </button>
            </div>
          </>
        )}

        <div className="mt-6 sm:hidden">
          <button
            onClick={() => navigate("/workshops/host")}
            className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl font-semibold text-sm transition-all"
            style={{ background: "linear-gradient(135deg, #7A5030 0%, #5A3818 100%)", color: "#F2CA8C", border: "1.5px solid #9A6840" }}
          >
            🔨 Host a Workshop
          </button>
        </div>
      </div>
    </div>
  );
}
