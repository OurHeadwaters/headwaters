import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Calendar, Users, DollarSign, ExternalLink, ChevronDown, ChevronUp, Hammer } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem("ge_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("ge_session_id", id);
  }
  return id;
}

interface GroundEvent {
  id: number;
  title: string;
  description: string;
  hostName: string;
  location: string;
  eventDate: string;
  priceCents: number;
  currency: string;
  capacity: number | null;
  rsvpCount: number;
  status: string;
  tags: string | null;
  externalUrl: string | null;
  createdAt: string;
}

interface EventsResponse {
  events: GroundEvent[];
  total: number;
  limit: number;
  offset: number;
}

async function fetchEvents(): Promise<EventsResponse> {
  const res = await fetch(apiUrl("/ground-events?status=upcoming&limit=50"));
  if (!res.ok) throw new Error("Failed to load events");
  return res.json();
}

async function submitRsvp(data: {
  eventId: number;
  sessionId: string;
  attendeeName?: string;
  attendeeEmail?: string;
}): Promise<{ eventId: number; rsvpCount: number }> {
  const { eventId, ...body } = data;
  const res = await fetch(apiUrl(`/ground-events/${eventId}/rsvp`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    if ((j as { alreadyRsvped?: boolean }).alreadyRsvped) {
      return { eventId, rsvpCount: -1 };
    }
    throw new Error((j as { error?: string }).error ?? "Failed to RSVP");
  }
  return j as { eventId: number; rsvpCount: number };
}

async function submitEvent(data: {
  title: string;
  description: string;
  hostName: string;
  location: string;
  eventDate: string;
  priceCents: number;
  tags?: string;
  externalUrl?: string;
}): Promise<GroundEvent> {
  const res = await fetch(apiUrl("/ground-events"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((j as { error?: string }).error ?? "Failed to submit event");
  return j as GroundEvent;
}

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function formatPrice(cents: number, currency: string): string {
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function ChalkboardEmpty({ onHostClick }: { onHostClick: () => void }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-center py-20 px-8 text-center"
      style={{
        background: "linear-gradient(160deg, #1C2A1E 0%, #243028 60%, #1A2820 100%)",
        border: "3px solid #3A5040",
        boxShadow: "inset 0 2px 20px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.3)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(255,255,255,0.4) 27px, rgba(255,255,255,0.4) 28px)`,
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-6"
        style={{ background: "linear-gradient(180deg, #4A6850 0%, transparent 100%)" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-8"
        style={{ background: "linear-gradient(0deg, #3A2A1A 0%, transparent 100%)", borderTop: "4px solid #5A3818" }}
      />

      <div className="relative z-10">
        <div className="text-5xl mb-5" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))" }}>🔨</div>
        <h2
          className="text-2xl font-bold mb-3 leading-snug"
          style={{
            fontFamily: "Georgia, serif",
            color: "#E8E0C8",
            textShadow: "0 1px 3px rgba(0,0,0,0.6)",
            letterSpacing: "0.03em",
          }}
        >
          No workshops posted yet
        </h2>
        <p
          className="text-sm leading-relaxed max-w-md mx-auto mb-8"
          style={{ color: "#A8B8A0", textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
        >
          Got a skill worth sharing? Host a workshop — fermentation, foraging, off-grid
          power, food preservation, animal husbandry. The community is listening.
        </p>
        <button
          onClick={onHostClick}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #7A5030 0%, #5A3818 100%)",
            color: "#F2CA8C",
            border: "1.5px solid #9A6840",
            boxShadow: "0 3px 12px rgba(0,0,0,0.4)",
          }}
        >
          <Hammer className="w-4 h-4" />
          Host a Workshop
        </button>
      </div>
    </div>
  );
}

function EventCard({
  event,
  rsvped,
  onRsvp,
}: {
  event: GroundEvent;
  rsvped: boolean;
  onRsvp: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const capacityPct =
    event.capacity && event.capacity > 0
      ? Math.min(100, (event.rsvpCount / event.capacity) * 100)
      : null;
  const isFull = event.capacity !== null && event.rsvpCount >= event.capacity;
  const tags = event.tags
    ? event.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: "linear-gradient(150deg, #2C3E30 0%, #243028 100%)",
        border: "1.5px solid #3A5040",
        boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
      }}
    >
      <div
        className="px-5 py-3 flex items-center gap-2"
        style={{
          background: "linear-gradient(90deg, #3A2A14 0%, #4A3420 100%)",
          borderBottom: "1px solid #5A3818",
        }}
      >
        <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: "#D9A066" }} />
        <span className="text-xs font-semibold" style={{ color: "#D9A066" }}>
          {formatDate(event.eventDate)}
        </span>
        <span className="ml-auto">
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{
              background: event.priceCents === 0 ? "rgba(44,74,54,0.7)" : "rgba(217,160,102,0.2)",
              color: event.priceCents === 0 ? "#6DBA8A" : "#D9A066",
              border: `1px solid ${event.priceCents === 0 ? "#3A7A50" : "#D9A066"}`,
            }}
          >
            {formatPrice(event.priceCents, event.currency)}
          </span>
        </span>
      </div>

      <div className="p-5">
        <h3
          className="font-bold text-lg leading-snug mb-1"
          style={{ fontFamily: "Georgia, serif", color: "#F2E8D0" }}
        >
          {event.title}
        </h3>

        <div className="flex items-center gap-1.5 mb-3">
          <MapPin className="w-3 h-3 shrink-0" style={{ color: "#8AB88A" }} />
          <span className="text-xs" style={{ color: "#8AB88A" }}>
            {event.location}
          </span>
          <span className="text-xs" style={{ color: "#5A7860" }}>·</span>
          <span className="text-xs font-medium" style={{ color: "#A8B8A0" }}>
            Hosted by {event.hostName}
          </span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(44,74,54,0.5)",
                  color: "#7AB88A",
                  border: "1px solid rgba(58,90,64,0.6)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <p
          className="text-sm leading-relaxed mb-3"
          style={{ color: "#A8B8A0" }}
        >
          {expanded || event.description.length <= 160
            ? event.description
            : `${event.description.slice(0, 160)}…`}
        </p>
        {event.description.length > 160 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs mb-3 transition-colors"
            style={{ color: "#7AB88A" }}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" /> Read more
              </>
            )}
          </button>
        )}

        <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: "1px solid rgba(58,90,64,0.4)" }}>
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "#7A9880" }}>
              <Users className="w-3 h-3 shrink-0" />
              <span>
                {event.rsvpCount} {event.rsvpCount === 1 ? "person" : "people"} going
                {event.capacity !== null && ` · ${event.capacity} cap`}
              </span>
            </div>
            {capacityPct !== null && (
              <div className="h-1.5 w-28 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
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
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {event.externalUrl && (
              <a
                href={event.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{
                  color: "#D9A066",
                  border: "1px solid rgba(217,160,102,0.35)",
                  background: "rgba(217,160,102,0.08)",
                }}
              >
                <ExternalLink className="w-3 h-3" />
                Details
              </a>
            )}
            <button
              onClick={() => !rsvped && !isFull && onRsvp(event.id)}
              disabled={rsvped || isFull}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all"
              style={
                rsvped
                  ? {
                      background: "rgba(44,74,54,0.6)",
                      color: "#6DBA8A",
                      border: "1px solid rgba(44,74,54,0.8)",
                      cursor: "default",
                    }
                  : isFull
                  ? {
                      background: "rgba(100,50,30,0.3)",
                      color: "#A87060",
                      border: "1px solid rgba(166,75,54,0.3)",
                      cursor: "not-allowed",
                    }
                  : {
                      background: "linear-gradient(135deg, #2C4A36 0%, #1C3020 100%)",
                      color: "#A8D8A8",
                      border: "1px solid rgba(44,74,54,0.8)",
                    }
              }
            >
              {rsvped ? "✓ Going" : isFull ? "Full" : "I'm Going"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HostForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hostName, setHostName] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [priceStr, setPriceStr] = useState("");
  const [tags, setTags] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: submitEvent,
    onSuccess: () => {
      setSubmitted(true);
      onSuccess();
    },
  });

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1.5px solid rgba(90,120,90,0.4)",
    color: "#E8E0C8",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.07em",
    color: "#8AB8A0",
    marginBottom: "6px",
  };

  if (submitted) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{
          background: "linear-gradient(150deg, #1C3020 0%, #243028 100%)",
          border: "1.5px solid #3A5040",
        }}
      >
        <div className="text-4xl mb-4">🔨</div>
        <h3
          className="text-xl font-bold mb-2"
          style={{ fontFamily: "Georgia, serif", color: "#F2CA8C" }}
        >
          Workshop submitted!
        </h3>
        <p className="text-sm mb-6" style={{ color: "#8AB8A0" }}>
          We'll review your workshop and post it to the board. Thanks for contributing to the community.
        </p>
        <button
          onClick={onCancel}
          className="text-xs underline transition-colors"
          style={{ color: "#7A9880" }}
        >
          Back to events
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(150deg, #1E2E22 0%, #1A2820 100%)",
        border: "1.5px solid #3A5040",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      <div
        className="px-6 py-4 flex items-center gap-2"
        style={{
          background: "linear-gradient(90deg, #3A2A14 0%, #4A3420 100%)",
          borderBottom: "1px solid #5A3818",
        }}
      >
        <Hammer className="w-4 h-4" style={{ color: "#D9A066" }} />
        <h3
          className="font-bold text-base"
          style={{ fontFamily: "Georgia, serif", color: "#F2CA8C" }}
        >
          Host a Workshop
        </h3>
        <button
          onClick={onCancel}
          className="ml-auto text-xs transition-colors"
          style={{ color: "#8A7860" }}
        >
          Cancel
        </button>
      </div>

      <div className="p-6 flex flex-col gap-4">
        {mutation.isError && (
          <div
            className="p-3 rounded-lg text-sm"
            style={{ background: "rgba(166,75,54,0.15)", color: "#E87060", border: "1px solid rgba(166,75,54,0.3)" }}
          >
            {mutation.error instanceof Error ? mutation.error.message : "Something went wrong"}
          </div>
        )}

        <div>
          <label style={labelStyle}>Workshop title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Introduction to Fermentation"
            maxLength={120}
            style={inputStyle}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Your name *</label>
            <input
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="e.g. Sarah from Montana"
              maxLength={80}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Location *</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Austin, TX or Online"
              maxLength={120}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Date *</label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            style={{
              ...inputStyle,
              colorScheme: "dark",
            }}
          />
        </div>

        <div>
          <label style={labelStyle}>Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will people learn? What should they bring? What level of experience is expected?"
            maxLength={2000}
            rows={4}
            style={{ ...inputStyle, resize: "vertical" as const }}
          />
          <div className="text-right text-xs mt-0.5" style={{ color: "#5A7860" }}>
            {description.length}/2000
          </div>
        </div>

        <div>
          <label style={labelStyle}>Topics / tags</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="fermentation, foraging, off-grid (comma separated)"
            maxLength={200}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Price</label>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setIsFree(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={
                isFree
                  ? { background: "rgba(44,74,54,0.7)", color: "#6DBA8A", border: "1px solid rgba(44,74,54,0.9)" }
                  : { background: "transparent", color: "#5A7860", border: "1px solid rgba(58,90,64,0.4)" }
              }
            >
              Free
            </button>
            <button
              onClick={() => setIsFree(false)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={
                !isFree
                  ? { background: "rgba(217,160,102,0.2)", color: "#D9A066", border: "1px solid rgba(217,160,102,0.5)" }
                  : { background: "transparent", color: "#5A7860", border: "1px solid rgba(58,90,64,0.4)" }
              }
            >
              Paid
            </button>
          </div>
          {!isFree && (
            <div className="relative">
              <DollarSign
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "#8AB8A0" }}
              />
              <input
                type="number"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                placeholder="25"
                min="0"
                step="1"
                style={{ ...inputStyle, paddingLeft: "36px" }}
              />
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>External link (optional)</label>
          <input
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://eventbrite.com/your-event"
            maxLength={500}
            style={inputStyle}
          />
        </div>

        <button
          onClick={() => {
            const priceCents = isFree ? 0 : Math.max(0, Math.floor(parseFloat(priceStr || "0") * 100));
            mutation.mutate({
              title: title.trim(),
              description: description.trim(),
              hostName: hostName.trim(),
              location: location.trim(),
              eventDate,
              priceCents,
              tags: tags.trim() || undefined,
              externalUrl: externalUrl.trim() || undefined,
            });
          }}
          disabled={
            !title.trim() ||
            !description.trim() ||
            !hostName.trim() ||
            !location.trim() ||
            !eventDate ||
            description.trim().length < 10 ||
            mutation.isPending
          }
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #7A5030 0%, #5A3818 100%)",
            color: "#F2CA8C",
            border: "1.5px solid #9A6840",
          }}
        >
          <Hammer className="w-4 h-4" />
          {mutation.isPending ? "Submitting…" : "Submit Workshop"}
        </button>
        <p className="text-xs text-center" style={{ color: "#5A7860" }}>
          Submissions are reviewed before going live on the board.
        </p>
      </div>
    </div>
  );
}

export function WorkshopBoard() {
  const qc = useQueryClient();
  const [rsvped, setRsvped] = useState<Set<number>>(new Set());
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ground-events"],
    queryFn: fetchEvents,
  });

  const rsvpMutation = useMutation({
    mutationFn: submitRsvp,
    onSuccess: (result) => {
      if (result.rsvpCount === -1) {
        setRsvped((prev) => new Set(prev).add(result.eventId));
        return;
      }
      setRsvped((prev) => new Set(prev).add(result.eventId));
      qc.invalidateQueries({ queryKey: ["ground-events"] });
    },
  });

  const handleRsvp = useCallback(
    (eventId: number) => {
      const sessionId = getOrCreateSessionId();
      rsvpMutation.mutate({ eventId, sessionId });
    },
    [rsvpMutation],
  );

  const events = data?.events ?? [];
  const hasEvents = events.length > 0;

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 max-w-5xl">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-4xl mb-3">🔨</div>
          <h1
            className="text-4xl font-bold mb-3"
            style={{ fontFamily: "Georgia, serif", color: "#F2E8D0" }}
          >
            Workshop Board
          </h1>
          <p className="text-base leading-relaxed max-w-xl" style={{ color: "#8AB8A0" }}>
            Community-run workshops on homesteading, self-reliance, and sovereignty skills.
            Free and paid — hosted by members of The Stomping Path.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm shrink-0 transition-all hover:opacity-90 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #7A5030 0%, #5A3818 100%)",
              color: "#F2CA8C",
              border: "1.5px solid #9A6840",
              boxShadow: "0 3px 12px rgba(0,0,0,0.3)",
            }}
          >
            <Hammer className="w-4 h-4" />
            Host a Workshop
          </button>
        )}
      </header>

      {showForm && (
        <div className="mb-10">
          <HostForm
            onSuccess={() => {
              qc.invalidateQueries({ queryKey: ["ground-events"] });
              setTimeout(() => setShowForm(false), 3200);
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: "rgba(44,74,54,0.15)" }} />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16" style={{ color: "#7A9880" }}>
          Failed to load workshops. Try refreshing.
        </div>
      ) : !hasEvents ? (
        <ChalkboardEmpty onHostClick={() => setShowForm(true)} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                rsvped={rsvped.has(event.id)}
                onRsvp={handleRsvp}
              />
            ))}
          </div>

          <div
            className="mt-10 p-5 rounded-xl text-center"
            style={{
              border: "1px dashed rgba(217,160,102,0.35)",
              background: "rgba(217,160,102,0.05)",
            }}
          >
            <p className="text-sm" style={{ color: "#8AB8A0" }}>
              <span style={{ color: "#D9A066", fontWeight: 600 }}>Know something worth teaching?</span>{" "}
              Workshops are community-led — anyone can host.{" "}
              <button
                onClick={() => setShowForm(true)}
                className="underline transition-colors"
                style={{ color: "#D9A066" }}
              >
                Submit yours →
              </button>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
