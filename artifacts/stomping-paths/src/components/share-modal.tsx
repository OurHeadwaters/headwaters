import { useState, useEffect, useRef } from "react";
import {
  X,
  Copy,
  Check,
  MessageSquare,
  Mail,
  Share2,
} from "lucide-react";

export type ShareSurface = "kit" | "track" | "transform";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  surface: ShareSurface;
  slug: string;
  name: string;
  accentColor: string;
}

function apiUrl(path: string): string {
  const base = (import.meta as any).env?.BASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/api${path}`;
}

function buildShareUrl(note: string, from: string): string {
  const base = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();
  if (note.trim()) params.set("note", note.trim());
  if (from.trim()) params.set("from", from.trim());
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

function surfaceLabel(surface: ShareSurface, name: string): string {
  if (surface === "kit") return `the ${name}`;
  if (surface === "track") return `the ${name} track`;
  return `the ${name} path`;
}

function prewrittenMessage(surface: ShareSurface, name: string): string {
  return `I've been using The Stomping Paths — specifically ${surfaceLabel(surface, name)}. Thought of you.`;
}

async function trackShare(surface: ShareSurface, slug: string): Promise<void> {
  try {
    await fetch(apiUrl("/shares"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surface, slug }),
    });
  } catch {
  }
}

export function ShareModal({
  isOpen,
  onClose,
  surface,
  slug,
  name,
  accentColor,
}: ShareModalProps) {
  const [note, setNote] = useState("");
  const [from, setFrom] = useState("");
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNote("");
      setFrom("");
      setCopied(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  if (!isOpen) return null;

  const url = buildShareUrl(note, from);
  const prewritten = prewrittenMessage(surface, name);
  const fullMessage = note.trim() ? `${prewritten}\n\n${note.trim()}` : prewritten;
  const subject = `I found something on The Stomping Paths — ${name}`;
  const emailBody = `${fullMessage}\n\n${url}`;
  const smsBody = `${fullMessage} ${url}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2500);
    void trackShare(surface, slug);
  }

  async function handleSms() {
    const shareData = { title: `The Stomping Paths — ${name}`, text: smsBody, url };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        void trackShare(surface, slug);
        onClose();
        return;
      } catch {
      }
    }
    window.location.href = `sms:?body=${encodeURIComponent(smsBody)}`;
    void trackShare(surface, slug);
    onClose();
  }

  function handleEmail() {
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    void trackShare(surface, slug);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl border bg-card shadow-2xl"
        style={{ borderColor: accentColor + "33" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: accentColor + "22" }}
        >
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4" style={{ color: accentColor }} />
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: accentColor }}
            >
              Share Your Path
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Pre-written message preview */}
          <div
            className="rounded-xl p-4 text-sm leading-relaxed text-foreground/80 italic"
            style={{
              background: accentColor + "0D",
              border: `1px solid ${accentColor}22`,
            }}
          >
            "{prewritten}"
          </div>

          {/* Personal note */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Add a personal note (optional)
            </label>
            <textarea
              ref={textareaRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tell them why it resonated with you…"
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-all resize-none"
              style={{ borderColor: accentColor + "44" }}
              onFocus={(e) => (e.target.style.borderColor = accentColor)}
              onBlur={(e) => (e.target.style.borderColor = accentColor + "44")}
            />
          </div>

          {/* From name */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Your name (optional — shown to recipient)
            </label>
            <input
              type="text"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Your first name"
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-all"
              style={{ borderColor: accentColor + "44" }}
              onFocus={(e) => (e.target.style.borderColor = accentColor)}
              onBlur={(e) => (e.target.style.borderColor = accentColor + "44")}
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={handleCopy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all hover:-translate-y-px"
              style={
                copied
                  ? { color: "#22c55e", background: "#22c55e15", border: "1px solid #22c55e44" }
                  : { color: "#fff", background: accentColor, boxShadow: `0 4px 20px ${accentColor}40` }
              }
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Link copied!" : "Copy link"}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSms}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all hover:-translate-y-px"
                style={{ color: accentColor, borderColor: accentColor + "44", background: accentColor + "0D" }}
              >
                <MessageSquare className="w-4 h-4" />
                Text / SMS
              </button>
              <button
                onClick={handleEmail}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all hover:-translate-y-px"
                style={{ color: accentColor, borderColor: accentColor + "44", background: accentColor + "0D" }}
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SharedNoteBanner({
  note,
  from,
  accentColor,
  onDismiss,
}: {
  note: string;
  from: string | null;
  accentColor: string;
  onDismiss: () => void;
}) {
  return (
    <div
      className="border-b"
      style={{ background: accentColor + "12", borderColor: accentColor + "33" }}
    >
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-start gap-3">
        <div
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 text-base"
          style={{ background: accentColor + "20", border: `1px solid ${accentColor}44` }}
        >
          💬
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-[10px] font-bold uppercase tracking-widest mb-1"
            style={{ color: accentColor }}
          >
            {from ? `Shared with you by ${from}` : "Shared with you"}
          </div>
          <p className="text-sm leading-relaxed text-foreground/90 italic">"{note}"</p>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
