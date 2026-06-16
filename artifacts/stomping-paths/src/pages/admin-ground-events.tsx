import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Hammer, Trash2, ChevronDown, ChevronUp, Star, CheckCircle, XCircle, Clock, Download, Users, Mail, MailX } from "lucide-react";

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
  isRejected: boolean;
  rsvpCount: number;
  createdAt: string;
  ticketPriceCents: number | null;
  breakEvenTickets: number;
  platformSharePct: number | null;
  isStripeReady: boolean;
  transformationSlug: string | null;
  familyFriendly: boolean;
  confirmationEmailSent: boolean;
}

interface HostSummary {
  hostName: string;
  contactEmail: string | null;
  eventCount: number;
  stripeConnected: boolean;
  firstEvent: string;
  latestEvent: string;
  totalRsvps: number;
}

async function fetchHosts(): Promise<HostSummary[]> {
  const res = await fetch(apiUrl("/admin/ground-events/hosts"), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load hosts");
  return res.json();
}

function HostDirectory() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-hosts"], queryFn: fetchHosts });
  const hosts = data ?? [];
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Read-only directory of all hosts. No approval needed — Stripe identity verification handles trust.
      </p>
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : hosts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl text-muted-foreground text-sm">
          No hosts yet.
        </div>
      ) : (
        <div className="space-y-2">
          {hosts.map((host) => (
            <div key={`${host.hostName}-${host.contactEmail}`} className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{host.hostName}</span>
                  {host.stripeConnected ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Stripe connected</span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Stripe pending</span>
                  )}
                </div>
                {host.contactEmail && (
                  <a href={`mailto:${host.contactEmail}`} className="text-xs text-[#2C4A36] hover:underline">{host.contactEmail}</a>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                <span><strong className="text-foreground">{host.eventCount}</strong> event{host.eventCount !== 1 ? "s" : ""}</span>
                <span><strong className="text-foreground">{host.totalRsvps}</strong> RSVPs</span>
                <span>Last: {host.latestEvent}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function fetchEvents(): Promise<GroundEvent[]> {
  const res = await fetch(apiUrl("/admin/ground-events"), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load events");
  return res.json();
}

async function patchEvent(data: { id: number; action: string }): Promise<GroundEvent> {
  const res = await fetch(apiUrl(`/admin/ground-events/${data.id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action: data.action }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((j as { error?: string }).error ?? "Failed to update");
  return j as GroundEvent;
}

async function resendConfirmation(id: number): Promise<GroundEvent> {
  const res = await fetch(apiUrl(`/admin/ground-events/${id}/resend-confirmation`), {
    method: "POST",
    credentials: "include",
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((j as { error?: string }).error ?? "Failed to resend confirmation");
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
  if (event.isRejected) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
        <XCircle className="w-2.5 h-2.5" />Rejected
      </span>
    );
  }
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
  const [resendSuccess, setResendSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: patchEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ground-events"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ground-events"] }),
  });

  const resendMutation = useMutation({
    mutationFn: () => resendConfirmation(event.id),
    onSuccess: () => {
      setResendSuccess(true);
      qc.invalidateQueries({ queryKey: ["admin-ground-events"] });
    },
  });

  const act = (action: string) => mutation.mutate({ id: event.id, action });
  const busy = mutation.isPending;

  const downloadRsvpsCsv = () => {
    const url = apiUrl(`/admin/ground-events/${event.id}/rsvps.csv`);
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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
            {event.contactEmail && (
              <>
                {" · "}
                <a
                  href={`mailto:${event.contactEmail}`}
                  className="text-[#2C4A36] hover:underline"
                >
                  {event.contactEmail}
                </a>
              </>
            )}
            {event.seats !== null && ` · ${event.seats} seats`}
            {` · ${event.rsvpCount} RSVPs`}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {event.contactEmail ? (
              event.confirmationEmailSent ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Mail className="w-2.5 h-2.5" />Confirmation sent
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                  <MailX className="w-2.5 h-2.5" />Confirmation not sent
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                <MailX className="w-2.5 h-2.5" />No contact email
              </span>
            )}
          </div>

          {/* Stripe Connect payment summary */}
          {event.ticketPriceCents && (
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                Stripe Tickets · ${(event.ticketPriceCents / 100).toFixed(2)}
              </span>
              {event.breakEvenTickets > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  BE: {event.breakEvenTickets} tickets
                </span>
              )}
              {event.platformSharePct && (
                <span className="text-[10px] text-muted-foreground">
                  {event.platformSharePct}% surplus share
                  {event.rsvpCount > event.breakEvenTickets && (
                    <> · <strong className="text-[#2C4A36]">
                      ${((event.rsvpCount - event.breakEvenTickets) * event.ticketPriceCents * event.platformSharePct / 10000).toFixed(2)} earned
                    </strong></>
                  )}
                </span>
              )}
              {event.isStripeReady ? (
                <span className="text-[10px] font-semibold text-emerald-700">✓ Stripe connected</span>
              ) : (
                <span className="text-[10px] text-amber-600">⚠ Awaiting Stripe Connect</span>
              )}
              {/* Gross revenue = all paid tickets × price */}
              {event.rsvpCount > 0 && (
                <span className="text-[10px] font-semibold text-violet-700">
                  Gross: ${((event.rsvpCount * event.ticketPriceCents) / 100).toFixed(2)}
                </span>
              )}
            </div>
          )}

          {event.externalUrl && (
            <p className="text-xs mt-0.5">
              <a
                href={event.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2C4A36] hover:underline"
              >
                Ticket link →
              </a>
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {event.rsvpCount > 0 && (
            <button
              onClick={downloadRsvpsCsv}
              title="Download RSVP list as CSV"
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            >
              <Download className="w-3.5 h-3.5" />
              RSVPs
            </button>
          )}

          {event.contactEmail && (
            resendSuccess || (resendMutation.isSuccess && event.confirmationEmailSent) ? (
              <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200">
                <Mail className="w-3.5 h-3.5" />
                Sent
              </span>
            ) : (
              <button
                onClick={() => resendMutation.mutate()}
                disabled={resendMutation.isPending}
                title={event.confirmationEmailSent ? "Resend confirmation email" : "Send confirmation email"}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100"
              >
                <Mail className="w-3.5 h-3.5" />
                {resendMutation.isPending
                  ? "Sending…"
                  : event.confirmationEmailSent
                  ? "Resend confirmation"
                  : "Send confirmation"}
              </button>
            )
          )}

          {!event.isApproved && !event.isRejected && (
            <button
              onClick={() => act("approve")}
              disabled={busy}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Approve
            </button>
          )}

          <button
            onClick={() => act(event.familyFriendly ? "unfamily" : "family")}
            disabled={busy}
            className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
              event.familyFriendly
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
            }`}
            title={event.familyFriendly ? "Remove family-friendly tag" : "Mark as family-friendly / good with kids"}
          >
            👨‍👩‍👧 {event.familyFriendly ? "Family ✓" : "Family?"}
          </button>

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

          {!event.isRejected && (
            <button
              onClick={() => act("reject")}
              disabled={busy}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </button>
          )}

          {event.isRejected && (
            <button
              onClick={() => act("approve")}
              disabled={busy}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Restore
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
          <p className="text-sm text-foreground leading-relaxed mb-2">{event.description}</p>
          <p className="text-xs text-muted-foreground">
            Submitted {formatDate(event.createdAt)}
          </p>
        </div>
      )}
    </div>
  );
}

export function AdminGroundEvents() {
  const [activeTab, setActiveTab] = useState<"events" | "hosts">("events");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-ground-events"],
    queryFn: fetchEvents,
  });

  const events = data ?? [];
  const pending = events.filter((e) => !e.isApproved && !e.isRejected);
  const approved = events.filter((e) => e.isApproved);
  const rejected = events.filter((e) => e.isRejected);

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Hammer className="w-6 h-6 text-[#2C4A36]" />
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Workshop Board Admin</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Events go live immediately. No approval needed — Stripe handles identity.
          </p>
        </div>
        <a
          href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/workshops`}
          className="ml-auto text-xs text-[#2C4A36] hover:underline font-medium"
        >
          View public board →
        </a>
      </div>

      <div className="flex items-center gap-1 mb-6 border-b border-border">
        {([
          { id: "events" as const, label: "Events", icon: <Hammer className="w-3.5 h-3.5" /> },
          { id: "hosts" as const, label: "Host Directory", icon: <Users className="w-3.5 h-3.5" /> },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-[#2C4A36] text-[#2C4A36]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "hosts" ? (
        <HostDirectory />
      ) : isLoading ? (
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
            When community members list a workshop, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Pending ({pending.length})
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
                Live ({approved.length})
              </h2>
              <div className="space-y-3">
                {approved.map((e) => <EventRow key={e.id} event={e} />)}
              </div>
            </section>
          )}

          {rejected.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <XCircle className="w-3.5 h-3.5" />
                Rejected ({rejected.length})
              </h2>
              <div className="space-y-3">
                {rejected.map((e) => <EventRow key={e.id} event={e} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
