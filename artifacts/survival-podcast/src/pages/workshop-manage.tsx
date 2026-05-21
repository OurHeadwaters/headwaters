import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Download, Users, Calendar, MapPin, Wifi, AlertCircle, Hammer, ArrowLeft } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface Rsvp {
  id: number;
  eventId: number;
  attendeeName: string | null;
  attendeeEmail: string;
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
}

interface ManageData {
  event: GroundEvent;
  rsvps: Rsvp[];
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

function formatDateTime(d: string): string {
  try {
    return new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}

function StatusBadge({ event }: { event: GroundEvent }) {
  if (event.isRejected) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
        style={{
          background: "rgba(166,75,54,0.2)",
          color: "#E87060",
          border: "1px solid rgba(166,75,54,0.4)",
        }}
      >
        Rejected
      </span>
    );
  }
  if (event.isApproved) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
        style={{
          background: "rgba(44,100,54,0.3)",
          color: "#6DCA8A",
          border: "1px solid rgba(44,100,54,0.6)",
        }}
      >
        ✓ Approved &amp; Live
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
      style={{
        background: "rgba(217,160,102,0.15)",
        color: "#D9A066",
        border: "1px solid rgba(217,160,102,0.4)",
      }}
    >
      Pending Review
    </span>
  );
}

export default function WorkshopManagePage() {
  const [location] = useLocation();

  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );
  const id = params.get("id") ?? "";
  const token = params.get("token") ?? "";

  const { data, isLoading, error } = useQuery<ManageData>({
    queryKey: ["workshop-manage", id, token],
    queryFn: async () => {
      if (!id || !token) throw new Error("Missing event id or token");
      const res = await fetch(apiUrl(`/ground-events/${id}/manage?token=${encodeURIComponent(token)}`));
      if (res.status === 403 || res.status === 401) {
        throw new Error("Invalid or expired management link.");
      }
      if (res.status === 404) {
        throw new Error("Event not found.");
      }
      if (!res.ok) throw new Error("Failed to load management data.");
      return res.json() as Promise<ManageData>;
    },
    enabled: Boolean(id && token),
    retry: false,
  });

  const csvUrl =
    id && token
      ? apiUrl(`/ground-events/${id}/manage/rsvps.csv?token=${encodeURIComponent(token)}`)
      : "#";

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #121A14 0%, #1A2418 60%, #111910 100%)",
    color: "#C8D8C8",
    fontFamily: "system-ui, sans-serif",
  };

  const panelStyle: React.CSSProperties = {
    background: "linear-gradient(150deg, #1E2E22 0%, #1A2820 100%)",
    border: "1.5px solid #2E4432",
    borderRadius: "16px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
  };

  if (!id || !token) {
    return (
      <div style={containerStyle} className="flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-10 h-10 mx-auto mb-4" style={{ color: "#D9A066" }} />
          <h2
            className="text-xl font-bold mb-2"
            style={{ fontFamily: "Georgia, serif", color: "#F2CA8C" }}
          >
            Link not valid
          </h2>
          <p className="text-sm" style={{ color: "#7A9880" }}>
            This management link is incomplete. Check that you used the full URL from your
            confirmation email.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={containerStyle} className="flex items-center justify-center p-8">
        <div className="text-center">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: "#3A5040", borderTopColor: "#7AB88A" }}
          />
          <p className="text-sm" style={{ color: "#6A8870" }}>
            Loading your workshop…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle} className="flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-10 h-10 mx-auto mb-4" style={{ color: "#E87060" }} />
          <h2
            className="text-xl font-bold mb-2"
            style={{ fontFamily: "Georgia, serif", color: "#F2CA8C" }}
          >
            Access denied
          </h2>
          <p className="text-sm" style={{ color: "#7A9880" }}>
            {error instanceof Error ? error.message : "Could not load your workshop."}
          </p>
          <a
            href="/workshops"
            className="inline-flex items-center gap-1.5 mt-5 text-sm"
            style={{ color: "#7AB88A" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to workshops
          </a>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { event, rsvps } = data;
  const seatsLeft = event.seats !== null ? event.seats - event.rsvpCount : null;
  const capacityPct =
    event.seats && event.seats > 0
      ? Math.min(100, (event.rsvpCount / event.seats) * 100)
      : null;

  return (
    <div style={containerStyle}>
      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">

        <div className="flex items-center gap-3">
          <a
            href="/workshops"
            className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
            style={{ color: "#6A8870" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Workshops
          </a>
          <span style={{ color: "#2E4432" }}>/</span>
          <span className="text-xs" style={{ color: "#4A6850" }}>
            Host Management
          </span>
        </div>

        <div style={panelStyle} className="overflow-hidden">
          <div
            className="px-6 py-4 flex items-start gap-3"
            style={{
              background: "linear-gradient(90deg, #3A2A14 0%, #4A3420 100%)",
              borderBottom: "1px solid #5A3818",
            }}
          >
            <Hammer className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#D9A066" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#8A7060" }}>
                Host Dashboard
              </p>
              <h1
                className="text-lg font-bold leading-snug"
                style={{ fontFamily: "Georgia, serif", color: "#F2CA8C" }}
              >
                {event.title}
              </h1>
            </div>
            <StatusBadge event={event} />
          </div>

          <div className="p-6 flex flex-col gap-4">
            <div className="flex flex-wrap gap-4 text-sm" style={{ color: "#8AB09A" }}>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" style={{ color: "#D9A066" }} />
                {formatDate(event.eventDate)}
              </span>
              {event.isOnline ? (
                <span className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" style={{ color: "#7AB0D0" }} />
                  Online
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" style={{ color: "#8AB88A" }} />
                  {event.location}
                </span>
              )}
            </div>

            <div
              className="grid grid-cols-3 gap-3"
              style={{ borderTop: "1px solid rgba(58,80,64,0.4)", paddingTop: "16px" }}
            >
              <div
                className="rounded-xl p-4 text-center"
                style={{
                  background: "rgba(44,74,36,0.2)",
                  border: "1px solid rgba(44,74,36,0.4)",
                }}
              >
                <p className="text-2xl font-bold" style={{ color: "#6DCA8A" }}>
                  {event.rsvpCount}
                </p>
                <p className="text-[11px] mt-1 uppercase tracking-wider" style={{ color: "#4A6850" }}>
                  RSVPs
                </p>
              </div>
              <div
                className="rounded-xl p-4 text-center"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(58,80,64,0.25)",
                }}
              >
                <p className="text-2xl font-bold" style={{ color: "#C8D8C8" }}>
                  {event.seats ?? "∞"}
                </p>
                <p className="text-[11px] mt-1 uppercase tracking-wider" style={{ color: "#4A6850" }}>
                  Capacity
                </p>
              </div>
              <div
                className="rounded-xl p-4 text-center"
                style={{
                  background: seatsLeft !== null && seatsLeft <= 5
                    ? "rgba(166,75,54,0.15)"
                    : "rgba(255,255,255,0.03)",
                  border: seatsLeft !== null && seatsLeft <= 5
                    ? "1px solid rgba(166,75,54,0.35)"
                    : "1px solid rgba(58,80,64,0.25)",
                }}
              >
                <p
                  className="text-2xl font-bold"
                  style={{
                    color: seatsLeft !== null && seatsLeft <= 5 ? "#E87060" : "#C8D8C8",
                  }}
                >
                  {seatsLeft !== null ? seatsLeft : "∞"}
                </p>
                <p className="text-[11px] mt-1 uppercase tracking-wider" style={{ color: "#4A6850" }}>
                  Seats Left
                </p>
              </div>
            </div>

            {capacityPct !== null && (
              <div>
                <div className="flex justify-between text-[11px] mb-1.5" style={{ color: "#4A6850" }}>
                  <span>Capacity</span>
                  <span>{Math.round(capacityPct)}% filled</span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${capacityPct}%`,
                      background:
                        capacityPct >= 90
                          ? "linear-gradient(90deg, #A64B36, #C8503A)"
                          : "linear-gradient(90deg, #2C4A36, #4A8A5A)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={panelStyle} className="overflow-hidden">
          <div
            className="px-6 py-4 flex items-center gap-2"
            style={{ borderBottom: "1px solid #2E4432" }}
          >
            <Users className="w-4 h-4" style={{ color: "#7AB88A" }} />
            <h2
              className="font-bold text-base flex-1"
              style={{ fontFamily: "Georgia, serif", color: "#E8E0C8" }}
            >
              RSVP List
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(44,74,36,0.3)", color: "#6DCA8A", border: "1px solid rgba(44,74,36,0.5)" }}>
              {rsvps.length} {rsvps.length === 1 ? "person" : "people"}
            </span>
            {rsvps.length > 0 && (
              <a
                href={csvUrl}
                download
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ml-2"
                style={{
                  background: "linear-gradient(135deg, #2C4A36 0%, #1C3020 100%)",
                  color: "#A8D8A8",
                  border: "1px solid rgba(58,90,64,0.8)",
                  textDecoration: "none",
                }}
              >
                <Download className="w-3 h-3" />
                Download CSV
              </a>
            )}
          </div>

          {rsvps.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Users className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: "#6A8870" }} />
              <p className="text-sm" style={{ color: "#4A6850" }}>
                No RSVPs yet.
                {!event.isApproved && !event.isRejected && (
                  <> Your event is pending approval — RSVPs will appear here once it's live.</>
                )}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(46,68,50,0.4)" }}>
              {rsvps.map((rsvp, i) => (
                <div key={rsvp.id} className="px-6 py-3.5 flex items-center gap-4">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: "rgba(44,74,36,0.3)",
                      color: "#6DCA8A",
                      border: "1px solid rgba(44,74,36,0.5)",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#E8E0C8" }}>
                      {rsvp.attendeeName ?? (
                        <span style={{ color: "#4A6850", fontStyle: "italic" }}>No name provided</span>
                      )}
                    </p>
                    <p className="text-xs truncate" style={{ color: "#6A8870" }}>
                      {rsvp.attendeeEmail}
                    </p>
                  </div>
                  <p className="text-[11px] shrink-0" style={{ color: "#3A5040" }}>
                    {formatDateTime(rsvp.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ ...panelStyle, padding: "20px 24px" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#4A6850" }}>
            Your private link
          </p>
          <p className="text-xs leading-relaxed mb-3" style={{ color: "#5A7860" }}>
            Bookmark this page — it's your private management link. Anyone with this URL can view your RSVP list, so keep it safe.
          </p>
          <div
            className="rounded-lg px-3 py-2 text-xs font-mono break-all select-all"
            style={{
              background: "rgba(0,0,0,0.3)",
              color: "#6A8870",
              border: "1px solid rgba(46,68,50,0.4)",
            }}
          >
            {typeof window !== "undefined" ? window.location.href : ""}
          </div>
        </div>

      </div>
    </div>
  );
}
