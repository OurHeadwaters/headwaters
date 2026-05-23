import { useState } from "react";
import { useLocation } from "wouter";
import { Hammer, ArrowLeft, CheckCircle, Zap, DollarSign, Shield } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

interface GroundEvent {
  id: number;
  title: string;
  hostToken?: string;
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

async function submitEvent(data: Record<string, unknown>): Promise<GroundEvent> {
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

async function startStripeConnect(eventId: number, hostToken: string): Promise<void> {
  const res = await fetch(apiUrl(`/ground-events/${eventId}/connect/start`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token: hostToken }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((j as { error?: string }).error ?? "Failed to start Stripe Connect");
  window.location.href = (j as { url: string }).url;
}

const TRANSFORMATIONS = [
  { slug: "conventional-to-regenerative", label: "Conventional → Regenerative", icon: "🌱" },
  { slug: "tradfi-to-hard-assets", label: "TradFi → Hard Assets", icon: "⚖️" },
  { slug: "employee-to-owner", label: "Employee → Owner", icon: "🔑" },
  { slug: "grid-to-off-grid", label: "Grid → Off-Grid", icon: "⚡" },
  { slug: "outsourced-health-to-health-sovereign", label: "Outsourced Health → Health Sovereign", icon: "🌿" },
  { slug: "individual-to-community-scale", label: "Individual → Community Scale", icon: "🤝" },
];

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1.5px solid rgba(90,120,90,0.35)",
  color: "#E8E0C8",
  borderRadius: "10px",
  padding: "10px 14px",
  fontSize: "14px",
  outline: "none",
  width: "100%",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "#7AB8A0",
  marginBottom: "6px",
};

type Step = "landing" | "form" | "success";

export default function WorkshopsHostPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("landing");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdEvent, setCreatedEvent] = useState<GroundEvent | null>(null);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hostName, setHostName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [seatsStr, setSeatsStr] = useState("");
  const [transformationSlug, setTransformationSlug] = useState("");
  const [zoneSlug, setZoneSlug] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [paidAmount, setPaidAmount] = useState("");
  const [breakEvenStr, setBreakEvenStr] = useState("");
  const [platformShare, setPlatformShare] = useState<5 | 10 | 15>(10);

  const canSubmit =
    title.trim().length >= 3 &&
    description.trim().length >= 10 &&
    hostName.trim().length >= 2 &&
    eventDate.trim() &&
    location.trim().length >= 2 &&
    contactEmail.trim().includes("@") &&
    (isFree || paidAmount.trim()) &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const ticketPriceCents = !isFree && paidAmount.trim()
        ? Math.round(parseFloat(paidAmount.trim()) * 100)
        : null;
      const priceDisplay = isFree ? "Free" : `$${paidAmount.trim()}`;
      const event = await submitEvent({
        title: title.trim(),
        description: description.trim(),
        hostName: hostName.trim(),
        contactEmail: contactEmail.trim(),
        eventDate: eventDate.trim(),
        location: location.trim(),
        isOnline,
        priceDisplay,
        seats: seatsStr.trim() ? parseInt(seatsStr, 10) : null,
        transformationSlug: transformationSlug || null,
        zoneSlug: zoneSlug || null,
        ticketPriceCents,
        breakEvenTickets: breakEvenStr.trim() ? Math.max(0, parseInt(breakEvenStr, 10)) : 0,
        platformSharePct: !isFree ? platformShare : null,
      });
      setCreatedEvent(event);
      setStep("success");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const manageUrl = createdEvent?.hostToken
    ? `${window.location.origin}${import.meta.env.BASE_URL}workshops/dashboard?token=${createdEvent.hostToken}`
    : null;

  const isPaidStripe = !isFree && !!paidAmount.trim();

  if (step === "success" && createdEvent) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #1C3020 0%, #1A2820 100%)" }}>
        <div className="container mx-auto px-4 md:px-6 py-14 max-w-xl">
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: "linear-gradient(150deg, #1C3020 0%, #243028 100%)",
              border: "1.5px solid #3A5040",
              boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
            }}
          >
            <div className="text-5xl mb-5">🔨</div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "Georgia, serif", color: "#F2CA8C" }}>
              You're on the board!
            </h2>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: "#8AB8A0" }}>
              Your workshop is live immediately. The community can find it on the Workshop Board and sign up.
            </p>

            {manageUrl && (
              <div
                className="rounded-xl p-4 mb-5 text-left"
                style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(58,90,64,0.5)" }}
              >
                <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#6A8870" }}>
                  Your private management link
                </p>
                <p className="text-xs mb-3" style={{ color: "#5A7860" }}>
                  Save this — it lets you view your RSVP list, check payout status, and manage your event.
                </p>
                <div
                  className="rounded-lg px-3 py-2 text-xs font-mono break-all select-all mb-3"
                  style={{ background: "rgba(0,0,0,0.3)", color: "#7AB88A", border: "1px solid rgba(46,68,50,0.5)" }}
                >
                  {manageUrl}
                </div>
                <a
                  href={manageUrl}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{
                    background: "linear-gradient(135deg, #2C4A36 0%, #1C3020 100%)",
                    color: "#A8D8A8",
                    border: "1px solid rgba(58,90,64,0.8)",
                    textDecoration: "none",
                  }}
                >
                  Open dashboard →
                </a>
              </div>
            )}

            {isPaidStripe && createdEvent.id && (
              <div
                className="mb-5 p-4 rounded-xl text-left"
                style={{ background: "rgba(217,160,102,0.08)", border: "1px solid rgba(217,160,102,0.25)" }}
              >
                <p className="text-sm font-semibold mb-1" style={{ color: "#D9A066" }}>
                  Connect Stripe to collect ticket payments
                </p>
                <p className="text-xs mb-3" style={{ color: "#8A7850" }}>
                  Takes about 2 minutes. You'll be redirected to Stripe's secure onboarding flow.
                </p>
                {connectError && (
                  <p className="text-xs mb-2" style={{ color: "#E87060" }}>{connectError}</p>
                )}
                <button
                  onClick={async () => {
                    setConnectingStripe(true);
                    setConnectError(null);
                    try {
                      await startStripeConnect(createdEvent.id, createdEvent.hostToken ?? "");
                    } catch (err) {
                      setConnectError(err instanceof Error ? err.message : "Failed to connect");
                      setConnectingStripe(false);
                    }
                  }}
                  disabled={connectingStripe}
                  className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #7A5030 0%, #5A3818 100%)",
                    color: "#F2CA8C",
                    border: "1.5px solid #9A6840",
                  }}
                >
                  {connectingStripe ? "Redirecting to Stripe…" : "Connect Stripe →"}
                </button>
              </div>
            )}

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => navigate("/workshops")}
                className="text-xs font-semibold underline"
                style={{ color: "#7AB8A0" }}
              >
                View Workshop Board →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "form") {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #1C3020 0%, #1A2820 100%)" }}>
        <div className="container mx-auto px-4 md:px-6 py-10 max-w-2xl">
          <button
            onClick={() => setStep("landing")}
            className="flex items-center gap-1.5 text-xs mb-6 transition-colors"
            style={{ color: "#7AB8A0" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

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
              style={{ background: "linear-gradient(90deg, #3A2A14 0%, #4A3420 100%)", borderBottom: "1px solid #5A3818" }}
            >
              <Hammer className="w-4 h-4" style={{ color: "#D9A066" }} />
              <h3 className="font-bold text-base" style={{ fontFamily: "Georgia, serif", color: "#F2CA8C" }}>
                List Your Workshop
              </h3>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {submitError && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{ background: "rgba(166,75,54,0.15)", color: "#E87060", border: "1px solid rgba(166,75,54,0.3)" }}
                >
                  {submitError}
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
                  <label style={labelStyle}>Contact email *</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@example.com"
                    maxLength={160}
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
                  style={{ ...inputStyle, colorScheme: "dark" }}
                />
              </div>

              <div>
                <label style={labelStyle}>Format *</label>
                <div className="flex items-center gap-3 mb-3">
                  {[{ val: false, label: "In-person" }, { val: true, label: "Online" }].map(({ val, label }) => (
                    <button
                      key={String(val)}
                      onClick={() => setIsOnline(val)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                      style={
                        isOnline === val
                          ? { background: "rgba(44,74,54,0.6)", color: "#6DBA8A", border: "1px solid rgba(44,74,54,0.9)" }
                          : { background: "transparent", color: "#5A7860", border: "1px solid rgba(58,90,64,0.35)" }
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={isOnline ? "e.g. Zoom (link sent after RSVP)" : "e.g. Austin, TX"}
                  maxLength={120}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will attendees learn? What should they bring? What experience level is expected?"
                  maxLength={2000}
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
                <div className="text-right text-xs mt-0.5" style={{ color: "#4A6850" }}>
                  {description.length}/2000
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Transformation path <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#4A6850" }}>(optional)</span></label>
                  <select
                    value={transformationSlug}
                    onChange={(e) => setTransformationSlug(e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="">— Not tagged —</option>
                    {TRANSFORMATIONS.map((t) => (
                      <option key={t.slug} value={t.slug}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                  <p className="text-xs mt-1" style={{ color: "#4A6850" }}>
                    Tag for transformation path discovery.
                  </p>
                </div>
                <div>
                  <label style={labelStyle}>Zone <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#4A6850" }}>(optional)</span></label>
                  <select
                    value={zoneSlug}
                    onChange={(e) => setZoneSlug(e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="">— Any zone —</option>
                    <option value="zone-0">🧘 Zone 0 — The Self</option>
                    <option value="zone-1">🏠 Zone 1 — The Home</option>
                    <option value="zone-2">🌱 Zone 2 — The Garden</option>
                    <option value="zone-3">🏡 Zone 3 — The Homestead</option>
                    <option value="zone-4">🌲 Zone 4 — The Forest</option>
                    <option value="zone-5">🏕️ Zone 5 — The Wild</option>
                  </select>
                  <p className="text-xs mt-1" style={{ color: "#4A6850" }}>
                    Tag for zone-based discovery.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Seats available</label>
                  <input
                    type="number"
                    value={seatsStr}
                    onChange={(e) => setSeatsStr(e.target.value)}
                    placeholder="Leave blank for unlimited"
                    min="1"
                    step="1"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Price *</label>
                  <div className="flex items-center gap-2 mb-2">
                    {[true, false].map((free) => (
                      <button
                        key={String(free)}
                        onClick={() => setIsFree(free)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                        style={
                          isFree === free
                            ? { background: "rgba(44,74,54,0.6)", color: "#6DBA8A", border: "1px solid rgba(44,74,54,0.9)" }
                            : { background: "transparent", color: "#5A7860", border: "1px solid rgba(58,90,64,0.35)" }
                        }
                      >
                        {free ? "Free" : "Paid"}
                      </button>
                    ))}
                  </div>
                  {!isFree && (
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: "#8AB8A0" }}>$</span>
                        <input
                          type="number"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                          placeholder="25"
                          min="1"
                          step="1"
                          style={{ ...inputStyle, paddingLeft: "28px" }}
                        />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, marginBottom: "4px" }}>Break-even at (tickets)</label>
                        <input
                          type="number"
                          value={breakEvenStr}
                          onChange={(e) => setBreakEvenStr(e.target.value)}
                          placeholder="e.g. 10 — first 10 tickets cover your costs"
                          min="0"
                          step="1"
                          style={inputStyle}
                        />
                        <p className="text-xs mt-0.5" style={{ color: "#4A6850" }}>
                          Platform earns only on tickets above this number.
                        </p>
                      </div>
                      <div>
                        <label style={{ ...labelStyle, marginBottom: "4px" }}>Platform surplus share</label>
                        <div className="flex items-center gap-2">
                          {([5, 10, 15] as const).map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setPlatformShare(pct)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                              style={
                                platformShare === pct
                                  ? { background: "rgba(44,74,54,0.6)", color: "#6DBA8A", border: "1px solid rgba(44,74,54,0.9)" }
                                  : { background: "transparent", color: "#5A7860", border: "1px solid rgba(58,90,64,0.35)" }
                              }
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                        <p className="text-xs mt-1" style={{ color: "#4A6850" }}>
                          After break-even, The Stomping Path earns {platformShare}% of each ticket
                          {paidAmount.trim() ? ` (${formatCurrency(Math.round(parseFloat(paidAmount) * platformShare))})` : ""}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => void handleSubmit()}
                disabled={!canSubmit}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 mt-2"
                style={{
                  background: "linear-gradient(135deg, #7A5030 0%, #5A3818 100%)",
                  color: "#F2CA8C",
                  border: "1.5px solid #9A6840",
                }}
              >
                <Hammer className="w-4 h-4" />
                {submitting ? "Listing workshop…" : "List My Workshop"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #1C3020 0%, #1A2820 100%)" }}>
      <div className="container mx-auto px-4 md:px-6 py-14 max-w-3xl">
        <button
          onClick={() => navigate("/workshops")}
          className="flex items-center gap-1.5 text-xs mb-8 transition-colors"
          style={{ color: "#7AB8A0" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Workshop Board
        </button>

        <div className="text-center mb-12">
          <div className="text-5xl mb-5">🔨</div>
          <h1 className="text-4xl font-bold mb-4 leading-snug" style={{ fontFamily: "Georgia, serif", color: "#F2CA8C" }}>
            Host a Workshop on<br />The Stomping Path
          </h1>
          <p className="text-base leading-relaxed max-w-xl mx-auto" style={{ color: "#8AB8A0" }}>
            Share what you know with thousands of people working toward self-reliance. Free to list,
            self-serve onboarding, and you keep the profits until you're in surplus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            {
              icon: <Zap className="w-5 h-5" />,
              title: "0% until break-even",
              body: "The platform takes nothing until you've covered your costs. Every ticket up to your break-even number goes entirely to you.",
            },
            {
              icon: <DollarSign className="w-5 h-5" />,
              title: "Surplus-share after",
              body: "Once you've broken even, you choose: 5%, 10%, or 15% of surplus tickets goes to the platform. The rest is yours.",
            },
            {
              icon: <Shield className="w-5 h-5" />,
              title: "No owner approval",
              body: "Your listing goes live automatically once you've connected Stripe. No waiting, no gatekeeping. Stripe's identity check is the only hurdle.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-xl p-5"
              style={{
                background: "linear-gradient(150deg, #1E2E22 0%, #1A2820 100%)",
                border: "1.5px solid #2E4432",
              }}
            >
              <div className="mb-3" style={{ color: "#D9A066" }}>{card.icon}</div>
              <h3 className="font-bold text-sm mb-1.5" style={{ color: "#F2E8D0" }}>{card.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "#6A9070" }}>{card.body}</p>
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl p-7 mb-10"
          style={{
            background: "linear-gradient(150deg, #1E2E22 0%, #1A2820 100%)",
            border: "1.5px solid #3A5040",
          }}
        >
          <h2 className="font-bold text-lg mb-4" style={{ fontFamily: "Georgia, serif", color: "#F2CA8C" }}>
            How it works
          </h2>
          <ol className="space-y-3">
            {[
              "Fill in your workshop details — title, date, format, description, transformation path.",
              "Choose free or paid. For paid workshops, pick a ticket price and your break-even ticket count.",
              "Your listing goes live on the Workshop Board immediately after Stripe Connect setup.",
              "Attendees RSVP or buy tickets through the platform. You get a private dashboard link to track sign-ups and payout status.",
              "Payouts go directly to your bank via Stripe. The platform's surplus share is taken automatically — no invoices, no chasing.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                  style={{ background: "rgba(217,160,102,0.2)", color: "#D9A066", border: "1px solid rgba(217,160,102,0.4)" }}
                >
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed" style={{ color: "#8AB8A0" }}>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mb-8">
          <h2 className="font-bold text-lg mb-4 text-center" style={{ fontFamily: "Georgia, serif", color: "#F2CA8C" }}>
            Great topics for this community
          </h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "Fermentation", "Food preservation", "Off-grid solar", "Water storage", "Herbal medicine",
              "Foraging", "Backyard chickens", "Soil building", "HAM radio basics", "Small business launch",
              "Precious metals", "Homestead planning", "Seed saving", "Beekeeping", "Composting",
            ].map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full"
                style={{
                  background: "rgba(44,74,54,0.3)",
                  color: "#7AB8A0",
                  border: "1px solid rgba(44,74,54,0.5)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setStep("form")}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-base transition-all hover:opacity-90 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #7A5030 0%, #5A3818 100%)",
              color: "#F2CA8C",
              border: "1.5px solid #9A6840",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            }}
          >
            <Hammer className="w-5 h-5" />
            List My Workshop — It's Free
          </button>
          <p className="text-xs mt-3" style={{ color: "#4A6850" }}>
            No approval required. Live immediately after Stripe Connect setup.
          </p>
        </div>
      </div>
    </div>
  );
}
