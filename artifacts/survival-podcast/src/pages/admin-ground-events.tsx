import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Hammer, Trash2, ChevronDown, ChevronUp, Star, CheckCircle, XCircle, Clock } from "lucide-react";

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
  seats: number | null;
  contactEmail: string | null;
  isApproved: boolean;
  isFeatured: boolean;
  rsvpCount: number;
  createdAt: string;
  updatedAt: string;
}

async function fetchEvents(): Promise<GroundEvent[]> {
  const res = await fetch(apiUrl("/admin/ground-events"), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load events");
  return res.json();
}

async function patchEvent(data: { id: number; action?: string; updates?: Partial<GroundEvent> }): Promise<GroundEvent> {
  const body = data.action ? { action: data.action } : data.updates;
  const res = await fetch(apiUrl(`/admin/ground-events/${data.id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
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

function StatusBadge({ event }: { event: GroundEvent }) {
  if (event.isFeatured) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
        <Star className="w-2.5 h-2.5" />Featured
      </span>
    );
  }
  if (event.isApproved) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle className="w-2.5 h-2.5" />Approved
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
      <Clock className="w-2.5 h-2.5" />Pending
    </span>
  );
}

function EventRow({ event }: { event: GroundEvent }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const mutation = useMutation({
    mutationFn: patchEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ground-events"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ground-events"] }),
  });

  const act = (action: string) => mutation.mutate({ id: event.id, action });
  const busy = mutation.isPending;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <StatusBadge event={event} />
            <span className="text-xs text-muted-foreground">{event.eventDate}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              {event.isOnline ? "Online" : event.location}
            </span>
            <span className="text-xs font-semibold text-[#2C4A36]">{event.priceDisplay}</span>
          </div>
          <h3 className="font-semibold text-foreground leading-snug">{event.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            By {event.hostName}
            {event.contactEmail && <> · <a href={`mailto:${event.contactEmail}`} className="text-[#2C4A36] hover:underline">{event.contactEmail}</a></>}
            {event.seats !== null && ` · ${event.seats} seats`}
            {` · ${event.rsvpCount} RSVPs`}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {!event.isApproved && (
            <button
              onClick={() => act("approve")}
              disabled={busy}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Approve
            </button>
          )}

          {event.isApproved && !event.isFeatured && (
            <button
              onClick={() => act("feature")}
              disabled={busy}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
            >
              <Star className="w-3.5 h-3.5" />
              Feature
            </button>
          )}

          {event.isFeatured && (
            <button
              onClick={() => act("unfeature")}
              disabled={busy}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
            >
              <Star className="w-3.5 h-3.5" />
              Unfeature
            </button>
          )}

          {event.isApproved && (
            <button
              onClick={() => act("reject")}
              disabled={busy}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </button>
          )}

          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
          <p className="text-xs text-muted-foreground">
            Submitted {formatDate(event.createdAt)}
          </p>
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
  const pending = events.filter((e) => !e.isApproved);
  const approved = events.filter((e) => e.isApproved);

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Hammer className="w-6 h-6 text-[#2C4A36]" />
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Ground Events Admin</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review and approve community workshop submissions.
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
          <p className="font-medium text-foreground mb-1">No workshop submissions yet</p>
          <p className="text-sm text-muted-foreground">
            When community members submit via the Workshop Board, they'll appear here for review.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Pending Review ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((e) => <EventRow key={e.id} event={e} />)}
              </div>
            </section>
          )}

          {approved.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5" />
                Approved ({approved.length})
              </h2>
              <div className="space-y-3">
                {approved.map((e) => <EventRow key={e.id} event={e} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
