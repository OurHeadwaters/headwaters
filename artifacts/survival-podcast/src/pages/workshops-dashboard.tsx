import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import {
  ArrowLeft, Users, Calendar, MapPin, Wifi, Download, ExternalLink,
  Hammer, PenLine, Check, X, ChevronRight, Plus,
} from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface Rsvp {
  id: number;
  eventId: number;
  attendeeName: string | null;
  attendeeEmail: string | null;
  paymentStatus: string;
  amountPaidCents: number | null;
  createdAt: string;
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
  seats: number | null;
  contactEmail: string | null;
  isApproved: boolean;
  isFeatured: boolean;
  isRejected: boolean;
  rsvpCount: number;
  createdAt: string;
  ticketPriceCents: number | null;
  breakEvenTickets: number;
  platformSharePct: number | null;
  stripeChargesEnabled: boolean;
  transformationSlug: string | null;
}

interface ManageData {
  event: GroundEvent;
  rsvps: Rsvp[];
}

const TRANSFORMATIONS: Record<string, { label: string; icon: string }> = {
  "conventional-to-regenerative": { label: "Conventional → Regenerative", icon: "🌱" },
  "tradfi-to-hard-assets": { label: "TradFi → Hard Assets", icon: "⚖️" },
  "employee-to-owner": { label: "Employee → Owner", icon: "🔑" },
  "grid-to-off-grid": { label: "Grid → Off-Grid", icon: "⚡" },
  "outsourced-health-to-health-sovereign": { label: "Outsourced Health → Health Sovereign", icon: "🌿" },
  "individual-to-community-scale": { label: "Individual → Community Scale", icon: "🤝" },
};

function formatDate(d: string): string {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
  } catch { return d; }
}

function formatDateTime(d: string): string {
  try {
    return new Date(d).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    });
  } catch { return d; }
}

function StatusBadge({ event }: { event: GroundEvent }) {
  if (event.isRejected) return (
    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(166,75,54,0.2)", color: "#E87060", border: "1px solid rgba(166,75,54,0.4)" }}>Rejected</span>
  );
  if (event.isFeatured) return (
    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(217,160,102,0.2)", color: "#D9A066", border: "1px solid rgba(217,160,102,0.4)" }}>⭐ Featured</span>
  );
  if (event.ticketPriceCents && !event.stripeChargesEnabled) return (
    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(217,160,102,0.1)", color: "#C8883A", border: "1px solid rgba(217,160,102,0.35)" }}>Stripe pending</span>
  );
  if (event.isApproved) return (
    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(44,100,54,0.2)", color: "#6DCA8A", border: "1px solid rgba(44,100,54,0.4)" }}>✓ Live</span>
  );
  return (
    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(90,120,90,0.15)", color: "#8AB8A0", border: "1px solid rgba(58,80,64,0.35)" }}>Pending</span>
  );
}

function NoTokenScreen({ navigate }: { navigate: (to: string) => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg, #1C3020 0%, #1A2820 100%)" }}>
      <div className="text-center px-6">
        <div className="text-4xl mb-4">🔨</div>
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "Georgia, serif", color: "#F2CA8C" }}>No management link provided</h2>
        <p className="text-sm mb-5" style={{ color: "#7A9880" }}>
          Use the private management link you received when you submitted your workshop.
        </p>
        <button onClick={() => navigate("/workshops/host")} className="text-xs font-semibold underline" style={{ color: "#7AB8A0" }}>
          Host a new workshop →
        </button>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #1C3020 0%, #1A2820 100%)" }}>
      <div className="container mx-auto px-4 py-12 max-w-3xl space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: "rgba(44,74,54,0.15)" }} />)}
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg, #1C3020 0%, #1A2820 100%)" }}>
      <div className="text-center px-6">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "Georgia, serif", color: "#F2CA8C" }}>Could not load</h2>
        <p className="text-sm" style={{ color: "#A87060" }}>{message}</p>
      </div>
    </div>
  );
}

function EventListView({
  events, token, navigate,
}: { events: GroundEvent[]; token: string; navigate: (to: string) => void }) {
  const hostName = events[0]?.hostName ?? "Host";
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #1C3020 0%, #1A2820 100%)" }}>
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-3xl">
        <button onClick={() => navigate("/workshops")} className="flex items-center gap-1.5 text-xs mb-6 transition-colors" style={{ color: "#7AB8A0" }}>
          <ArrowLeft className="w-3.5 h-3.5" />
          Workshop Board
        </button>

        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#5A8070" }}>Host Dashboard</p>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Georgia, serif", color: "#F2CA8C" }}>{hostName}</h1>
          </div>
          <a
            href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/workshops/host`}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg shrink-0"
            style={{ background: "rgba(217,160,102,0.15)", color: "#D9A066", border: "1px solid rgba(217,160,102,0.35)" }}
          >
            <Plus className="w-3.5 h-3.5" />
            New workshop
          </a>
        </div>

        <div className="space-y-3">
          {events.map(event => (
            <button
              key={event.id}
              onClick={() => navigate(`/workshops/dashboard?id=${event.id}&token=${encodeURIComponent(token)}`)}
              className="w-full text-left rounded-2xl p-5 transition-all hover:opacity-90 active:scale-[0.99]"
              style={{ background: "linear-gradient(150deg, #1E2E22 0%, #1A2820 100%)", border: "1.5px solid #3A5040" }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <StatusBadge event={event} />
                    {event.isFeatured && null}
                  </div>
                  <p className="font-bold leading-snug mb-2" style={{ fontFamily: "Georgia, serif", color: "#F2CA8C" }}>{event.title}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: "#6A9870" }}>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" style={{ color: "#D9A066" }} />
                      {formatDate(event.eventDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      {event.isOnline ? <Wifi className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                      {event.isOnline ? "Online" : event.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {event.rsvpCount} RSVP{event.rsvpCount !== 1 ? "s" : ""}
                      {event.seats ? ` / ${event.seats}` : ""}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 mt-1" style={{ color: "#4A6850" }} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditForm({
  event, token, onClose, onSaved,
}: { event: GroundEvent; token: string; onClose: () => void; onSaved: (updated: GroundEvent) => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: event.title,
    description: event.description,
    eventDate: event.eventDate,
    location: event.location,
    seats: event.seats?.toString() ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl(`/ground-events/${event.id}/manage`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token,
          title: form.title,
          description: form.description,
          eventDate: form.eventDate,
          location: form.location,
          seats: form.seats ? parseInt(form.seats, 10) : null,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error ?? "Update failed");
      return j as GroundEvent;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["workshop-manage"] });
      qc.invalidateQueries({ queryKey: ["host-events"] });
      onSaved(updated);
    },
    onError: (err: Error) => setError(err.message),
  });

  const field = "w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors";
  const fieldStyle = { background: "rgba(0,0,0,0.25)", border: "1px solid rgba(58,80,64,0.5)", color: "#D8E8D8" };

  return (
    <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "linear-gradient(150deg, #1E2E22 0%, #1A2820 100%)", border: "1.5px solid #5A7040" }}>
      <div className="px-5 py-3 flex items-center justify-between" style={{ background: "rgba(58,80,40,0.3)", borderBottom: "1px solid rgba(58,80,40,0.5)" }}>
        <div className="flex items-center gap-2">
          <PenLine className="w-3.5 h-3.5" style={{ color: "#A8D870" }} />
          <span className="text-sm font-bold" style={{ color: "#C8E890" }}>Edit Event Details</span>
        </div>
        <button onClick={onClose} className="rounded-full p-1 hover:bg-white/10 transition-colors">
          <X className="w-3.5 h-3.5" style={{ color: "#7A9870" }} />
        </button>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#8AB8A0" }}>Title</label>
          <input className={field} style={fieldStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={120} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#8AB8A0" }}>Description</label>
          <textarea rows={4} className={field} style={{ ...fieldStyle, resize: "vertical" }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={2000} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#8AB8A0" }}>Date</label>
            <input type="date" className={field} style={fieldStyle} value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#8AB8A0" }}>Seats (blank = unlimited)</label>
            <input type="number" min="1" className={field} style={fieldStyle} placeholder="∞" value={form.seats} onChange={e => setForm(f => ({ ...f, seats: e.target.value }))} />
          </div>
        </div>
        {!event.isOnline && (
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#8AB8A0" }}>Location</label>
            <input className={field} style={fieldStyle} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-xs px-4 py-2 rounded-lg font-medium" style={{ background: "rgba(255,255,255,0.06)", color: "#8AB8A0", border: "1px solid rgba(58,80,64,0.4)" }}>
            Cancel
          </button>
          <button
            onClick={() => { setError(null); save.mutate(); }}
            disabled={save.isPending}
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg font-semibold"
            style={{ background: "linear-gradient(135deg, #3A6030 0%, #2A4820 100%)", color: "#A8E890", border: "1.5px solid #4A8040", opacity: save.isPending ? 0.6 : 1 }}
          >
            <Check className="w-3.5 h-3.5" />
            {save.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EventDetailView({
  eventId, token, navigate,
}: { eventId: string; token: string; navigate: (to: string) => void }) {
  const [editing, setEditing] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["workshop-manage", eventId, token],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/ground-events/${eventId}/manage?token=${encodeURIComponent(token)}`), {
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error ?? "Failed to load");
      return j as ManageData;
    },
    enabled: !!(eventId && token),
    retry: false,
  });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const connectResult = p.get("stripe_connect");
    if ((connectResult === "success" || connectResult === "refresh") && eventId && token) {
      fetch(apiUrl(`/ground-events/${eventId}/connect/status`), { credentials: "include" })
        .then(() => void refetch())
        .catch(() => void 0);
      const clean = new URL(window.location.href);
      clean.searchParams.delete("stripe_connect");
      window.history.replaceState({}, "", clean.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, token]);

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorScreen message={error instanceof Error ? error.message : "Invalid or expired management link."} />;

  const { event, rsvps } = data!;
  const capacityPct = event.seats && event.seats > 0 ? Math.min(100, (event.rsvpCount / event.seats) * 100) : null;
  const isPaid = !!event.ticketPriceCents;
  const paidRsvps = rsvps.filter(r => r.paymentStatus === "paid");
  const grossRevenue = isPaid && event.ticketPriceCents ? (paidRsvps.length * event.ticketPriceCents) / 100 : 0;
  const surplusTickets = Math.max(0, paidRsvps.length - event.breakEvenTickets);
  const platformEarned = isPaid && event.ticketPriceCents && event.platformSharePct
    ? (surplusTickets * event.ticketPriceCents * event.platformSharePct) / 10000 : 0;
  const transformation = event.transformationSlug ? TRANSFORMATIONS[event.transformationSlug] : null;

  const downloadCsv = () => {
    const url = apiUrl(`/ground-events/${eventId}/manage/rsvps.csv?token=${encodeURIComponent(token)}`);
    const a = document.createElement("a");
    a.href = url; a.download = "";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const startStripeConnect = async () => {
    const res = await fetch(apiUrl(`/ground-events/${eventId}/connect/start`), {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ token }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((j as { error?: string }).error ?? "Failed");
    window.location.href = (j as { url: string }).url;
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #1C3020 0%, #1A2820 100%)" }}>
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-3xl">
        <button
          onClick={() => navigate(`/workshops/dashboard?token=${encodeURIComponent(token)}`)}
          className="flex items-center gap-1.5 text-xs mb-6 transition-colors"
          style={{ color: "#7AB8A0" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All my workshops
        </button>

        {editing ? (
          <EditForm
            event={event}
            token={token}
            onClose={() => setEditing(false)}
            onSaved={() => { setEditing(false); void refetch(); }}
          />
        ) : (
          <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "linear-gradient(150deg, #1E2E22 0%, #1A2820 100%)", border: "1.5px solid #3A5040" }}>
            <div className="px-6 py-4 flex items-center gap-3" style={{ background: "linear-gradient(90deg, #3A2A14 0%, #4A3420 100%)", borderBottom: "1px solid #5A3818" }}>
              <Hammer className="w-4 h-4 shrink-0" style={{ color: "#D9A066" }} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#8A7050" }}>Event Dashboard</p>
                <p className="font-bold leading-snug truncate" style={{ fontFamily: "Georgia, serif", color: "#F2CA8C" }}>{event.title}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge event={event} />
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                  style={{ background: "rgba(58,80,40,0.4)", color: "#A8D870", border: "1px solid rgba(58,80,40,0.6)" }}
                >
                  <PenLine className="w-3 h-3" />
                  Edit
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mb-4" style={{ color: "#8AB8A0" }}>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" style={{ color: "#D9A066" }} />
                  {formatDate(event.eventDate)}
                </span>
                {event.isOnline ? (
                  <span className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5" />Online</span>
                ) : (
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{event.location}</span>
                )}
                <span className="font-semibold" style={{ color: "#D9A066" }}>{event.priceDisplay}</span>
                {transformation && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(217,160,102,0.15)", color: "#D9A066", border: "1px solid rgba(217,160,102,0.3)" }}>
                    {transformation.icon} {transformation.label}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: "RSVPs", value: event.rsvpCount },
                  { label: "Capacity", value: event.seats ? `${event.seats - event.rsvpCount} left` : "∞" },
                  ...(isPaid ? [
                    { label: "Gross Revenue", value: `$${grossRevenue.toFixed(2)}` },
                    { label: "Platform Earned", value: `$${platformEarned.toFixed(2)}` },
                  ] : []),
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl p-3 text-center" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(58,80,64,0.3)" }}>
                    <div className="text-xl font-bold mb-0.5" style={{ color: "#F2CA8C" }}>{stat.value}</div>
                    <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#5A8070" }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {capacityPct !== null && (
                <div className="mb-5">
                  <div className="flex items-center justify-between text-xs mb-1" style={{ color: "#6A8870" }}>
                    <span>Capacity</span>
                    <span>{event.rsvpCount} / {event.seats}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{
                      width: `${capacityPct}%`,
                      background: capacityPct >= 90 ? "linear-gradient(90deg, #A64B36, #C8503A)" : "linear-gradient(90deg, #2C4A36, #4A8A5A)",
                    }} />
                  </div>
                </div>
              )}

              {isPaid && (
                <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(217,160,102,0.06)", border: "1px solid rgba(217,160,102,0.2)" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#8A7050" }}>Stripe Connect</p>
                  {event.stripeChargesEnabled ? (
                    <div className="flex items-center gap-2 text-sm" style={{ color: "#6DCA8A" }}>
                      <span>✓ Connected — payouts active</span>
                      <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs ml-auto" style={{ color: "#D9A066" }}>
                        Stripe Dashboard <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-xs" style={{ color: "#A87060" }}>
                        Complete Stripe onboarding to make this event visible and accept ticket sales.
                      </p>
                      <button
                        onClick={() => void startStripeConnect()}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ background: "linear-gradient(135deg, #7A5030 0%, #5A3818 100%)", color: "#F2CA8C", border: "1.5px solid #9A6840" }}
                      >
                        Connect Stripe →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(150deg, #1E2E22 0%, #1A2820 100%)", border: "1.5px solid #3A5040" }}>
          <div className="px-6 py-3 flex items-center justify-between" style={{ background: "linear-gradient(90deg, #1A2A1C 0%, #202820 100%)", borderBottom: "1px solid rgba(58,80,64,0.5)" }}>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: "#7AB8A0" }} />
              <span className="text-sm font-bold" style={{ color: "#A8D8C8" }}>Attendees ({rsvps.length})</span>
            </div>
            {rsvps.length > 0 && (
              <button onClick={downloadCsv} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all" style={{ background: "rgba(44,74,54,0.4)", color: "#7AB8A0", border: "1px solid rgba(44,74,54,0.6)" }}>
                <Download className="w-3 h-3" />
                Export CSV
              </button>
            )}
          </div>

          {rsvps.length === 0 ? (
            <div className="text-center py-12" style={{ color: "#4A6850" }}>No RSVPs yet. Share your workshop to get the word out.</div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(44,74,54,0.2)" }}>
              {rsvps.map(rsvp => (
                <div key={rsvp.id} className="px-6 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#D8E8D8" }}>{rsvp.attendeeName ?? "Anonymous"}</p>
                    {rsvp.attendeeEmail && (
                      <a href={`mailto:${rsvp.attendeeEmail}`} className="text-xs truncate hover:underline" style={{ color: "#6A9870" }}>{rsvp.attendeeEmail}</a>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {rsvp.paymentStatus === "paid" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(44,100,54,0.2)", color: "#6DCA8A", border: "1px solid rgba(44,100,54,0.4)" }}>
                        Paid {rsvp.amountPaidCents ? `$${(rsvp.amountPaidCents / 100).toFixed(2)}` : ""}
                      </span>
                    )}
                    <span className="text-[11px]" style={{ color: "#4A6850" }}>{formatDateTime(rsvp.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorkshopsDashboardPage() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const id = params.get("id");
  const token = params.get("token");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["host-events", token],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/ground-events/by-host?token=${encodeURIComponent(token!)}`), {
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error ?? "Failed to load events");
      return (j as { events: GroundEvent[] }).events;
    },
    enabled: !!token,
    retry: false,
  });

  if (!token) return <NoTokenScreen navigate={navigate} />;

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorScreen message={error instanceof Error ? error.message : "Invalid or expired management link."} />;

  const events = data ?? [];

  if (id) {
    return <EventDetailView eventId={id} token={token} navigate={navigate} />;
  }

  if (events.length === 1) {
    return <EventDetailView eventId={String(events[0].id)} token={token} navigate={navigate} />;
  }

  return <EventListView events={events} token={token} navigate={navigate} />;
}
