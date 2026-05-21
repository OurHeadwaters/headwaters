import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Hammer, Trash2, ChevronDown, ChevronUp, Users } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
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
  updatedAt: string;
}

interface Rsvp {
  id: number;
  attendeeName: string | null;
  attendeeEmail: string | null;
  createdAt: string;
}

const STATUSES = ["upcoming", "past", "cancelled"];

async function fetchEvents(): Promise<GroundEvent[]> {
  const res = await fetch(apiUrl("/admin/ground-events"), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load events");
  return res.json();
}

async function patchEvent(data: { id: number; updates: Partial<GroundEvent> }): Promise<GroundEvent> {
  const res = await fetch(apiUrl(`/admin/ground-events/${data.id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data.updates),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((j as { error?: string }).error ?? "Failed to update");
  return j as GroundEvent;
}

async function deleteEvent(id: number): Promise<void> {
  const res = await fetch(apiUrl(`/admin/ground-events/${id}`), {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete event");
}

async function fetchRsvps(id: number): Promise<{ rsvps: Rsvp[]; total: number }> {
  const res = await fetch(apiUrl(`/admin/ground-events/${id}/rsvps`), {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load RSVPs");
  return res.json();
}

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    upcoming: "bg-emerald-100 text-emerald-700 border-emerald-200",
    past: "bg-slate-100 text-slate-600 border-slate-200",
    cancelled: "bg-red-100 text-red-600 border-red-200",
  };
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${styles[status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
    >
      {status}
    </span>
  );
}

function RsvpDrawer({ eventId }: { eventId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-event-rsvps", eventId],
    queryFn: () => fetchRsvps(eventId),
  });

  if (isLoading) {
    return <p className="text-xs text-muted-foreground py-2">Loading RSVPs…</p>;
  }

  const rsvps = data?.rsvps ?? [];
  if (rsvps.length === 0) {
    return <p className="text-xs text-muted-foreground py-2">No RSVPs yet.</p>;
  }

  return (
    <div className="mt-3 space-y-1.5">
      {rsvps.map((r) => (
        <div
          key={r.id}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-muted/60"
        >
          <span className="font-medium text-foreground">
            {r.attendeeName ?? "Anonymous"}
          </span>
          {r.attendeeEmail && (
            <span className="text-muted-foreground">· {r.attendeeEmail}</span>
          )}
          <span className="ml-auto text-muted-foreground">
            {formatDate(r.createdAt)}
          </span>
        </div>
      ))}
    </div>
  );
}

function EventRow({ event }: { event: GroundEvent }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [showRsvps, setShowRsvps] = useState(false);
  const [editStatus, setEditStatus] = useState(event.status);

  const patchMutation = useMutation({
    mutationFn: patchEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ground-events"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ground-events"] }),
  });

  const handleStatusChange = (newStatus: string) => {
    setEditStatus(newStatus);
    patchMutation.mutate({ id: event.id, updates: { status: newStatus } });
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <StatusBadge status={editStatus} />
            <span className="text-xs text-muted-foreground">{event.eventDate}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{event.location}</span>
          </div>
          <h3 className="font-semibold text-foreground leading-snug">{event.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            By {event.hostName}
            {event.priceCents > 0
              ? ` · $${(event.priceCents / 100).toFixed(0)}`
              : " · Free"}
            {event.capacity !== null && ` · Cap: ${event.capacity}`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{event.rsvpCount}</span>
          </div>

          <select
            value={editStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={patchMutation.isPending}
            className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#2C4A36] disabled:opacity-50"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => {
              if (confirm(`Delete "${event.title}"? This cannot be undone.`)) {
                deleteMutation.mutate(event.id);
              }
            }}
            disabled={deleteMutation.isPending}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            aria-label="Delete event"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3">
          <p className="text-sm text-foreground leading-relaxed mb-3">{event.description}</p>
          {event.tags && (
            <p className="text-xs text-muted-foreground mb-2">
              <span className="font-medium">Tags:</span> {event.tags}
            </p>
          )}
          {event.externalUrl && (
            <p className="text-xs text-muted-foreground mb-3">
              <span className="font-medium">Link:</span>{" "}
              <a
                href={event.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2C4A36] underline"
              >
                {event.externalUrl}
              </a>
            </p>
          )}

          <button
            onClick={() => setShowRsvps((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#2C4A36] hover:underline"
          >
            <Users className="w-3.5 h-3.5" />
            {showRsvps ? "Hide" : "Show"} RSVPs ({event.rsvpCount})
          </button>

          {showRsvps && <RsvpDrawer eventId={event.id} />}
        </div>
      )}
    </div>
  );
}

export function AdminGroundEvents() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-ground-events"],
    queryFn: fetchEvents,
  });

  const events = data ?? [];
  const upcoming = events.filter((e) => e.status === "upcoming");
  const other = events.filter((e) => e.status !== "upcoming");

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Hammer className="w-6 h-6 text-[#2C4A36]" />
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Ground Events Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review and manage community workshop submissions.
          </p>
        </div>
        <a
          href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/stomping-grounds?tab=workshop`}
          className="ml-auto text-xs text-[#2C4A36] hover:underline font-medium"
        >
          View public board →
        </a>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-muted-foreground">
          Failed to load events. Try refreshing.
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-xl">
          <div className="text-4xl mb-3">🔨</div>
          <p className="font-medium text-foreground mb-1">No workshops yet</p>
          <p className="text-sm text-muted-foreground">
            Submissions from the Workshop Board will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Upcoming ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </div>
            </section>
          )}

          {other.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Past / Cancelled ({other.length})
              </h2>
              <div className="space-y-3">
                {other.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
