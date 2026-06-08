import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Heart } from "lucide-react";
import { GordBird } from "@workspace/gord-bird";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

type Message = {
  role: "user" | "assistant";
  content: string;
};

const CODETRY_OPENING_LINES: Record<string, string> = {
  "/": "Gord's on board. You're on the Codetry homepage — a digital sovereignty agency. Owning your stack starts here. What are you trying to figure out?",
  "/services": "Gord's on board. Services page — web presence, self-hosted tools, community platforms, digital education. What kind of help are you looking for?",
  "/work": "Gord's on board. The portfolio — real projects, real clients, real outcomes. See anything that looks like your situation?",
  "/discover": "Gord's on board. Discover page — pathways and resources for getting started with digital self-reliance. Where are you starting from?",
};

function getCodetryOpeningLine(path: string): Message {
  const content = CODETRY_OPENING_LINES[path]
    ?? "Gord's on board. You're on a digital sovereignty site, which means you're already thinking better than most. What do you want to know?";
  return { role: "assistant", content };
}

const TIP_THANK_YOU: Message = {
  role: "assistant",
  content: "Well. I don't have pockets, but I appreciate the gesture. Sunflower seeds incoming. Gord's on board — and now slightly better funded.",
};

const CODETRY_PAGE_DESCRIPTIONS: Record<string, string> = {
  "/": "Home page — introducing Codetry, a digital sovereignty and self-reliance agency helping people and communities own their digital stack",
  "/services": "Services page — Codetry's offerings: web presence, self-hosted tools, community platforms, and digital education",
  "/work": "Work page — portfolio of Codetry projects and past client work",
  "/discover": "Discover page — resources and pathways for getting started with digital self-reliance",
};

function getCodetryPageDescription(path: string): string {
  return CODETRY_PAGE_DESCRIPTIONS[path] ?? "Codetry — a digital sovereignty and self-reliance agency";
}

const ACCENT = "#E07B39";
const BG = "#0D1510";
const BORDER = "#E07B3933";
const TEXT = "#F5F0E8";
const MUTED = "#A8B8A0";

type TipState = "idle" | "picking" | "loading" | "error";
type TipSubState = "buttons" | "custom";
const STORAGE_KEY = "gord-history-codetry";

export function GordWidget() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [tipState, setTipState] = useState<TipState>("idle");
  const [tipSubState, setTipSubState] = useState<TipSubState>("buttons");
  const [customAmount, setCustomAmount] = useState("");
  const [tipError, setTipError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setHasOpened(true);
        }
      }
    } catch {
      /* ignore parse errors */
    }
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    const toSave = messages.filter((m) => m.content !== "");
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      /* ignore storage errors */
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tip") === "success") {
      const url = new URL(window.location.href);
      url.searchParams.delete("tip");
      window.history.replaceState({}, "", url.toString());
      setMessages([getCodetryOpeningLine(location), TIP_THANK_YOU]);
      setHasOpened(true);
      setOpen(true);
    }
  }, []);

  function handleOpen() {
    if (!hasOpened) {
      setMessages([getCodetryOpeningLine(location)]);
      setHasOpened(true);
    }
    setOpen(true);
  }

  function handleClose() {
    abortRef.current?.abort();
    setOpen(false);
    setTipState("idle");
    setTipSubState("buttons");
    setCustomAmount("");
    setTipError(null);
  }

  function handleStartFresh() {
    abortRef.current?.abort();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setMessages([getCodetryOpeningLine(location)]);
    setHasOpened(true);
    setInput("");
    setError(null);
  }

  function handleTip() {
    if (!hasOpened) {
      setMessages([getCodetryOpeningLine(location)]);
      setHasOpened(true);
    }
    setOpen(true);
    setTipState("picking");
    setTipSubState("buttons");
    setCustomAmount("");
    setTipError(null);
  }

  async function handleTipAmount(amountCents: number) {
    setTipState("loading");
    setTipError(null);
    try {
      const successUrl = `${window.location.origin}${window.location.pathname}?tip=success`;
      const cancelUrl = `${window.location.origin}${window.location.pathname}?tip=cancelled`;
      const res = await fetch(apiUrl("/gord/tip"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents, successUrl, cancelUrl }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Failed to start tip session");
      }
      window.location.href = data.url;
    } catch (err) {
      setTipError(err instanceof Error ? err.message : "Something went wrong");
      setTipState("error");
    }
  }

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setError(null);

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(apiUrl("/gord/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          context: { path: location, description: getCodetryPageDescription(location) },
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6)) as {
              content?: string;
              done?: boolean;
              error?: string;
            };
            if (json.done) break;
            if (json.error) throw new Error(json.error);
            if (json.content) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") {
                  updated[updated.length - 1] = { ...last, content: last.content + json.content };
                }
                return updated;
              });
            }
          } catch {
            /* skip malformed chunks */
          }
        }
      }
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, messages, streaming, location]);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="gord-chat"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="fixed bottom-24 right-4 z-[70] flex flex-col"
            style={{
              width: 340,
              maxWidth: "calc(100vw - 32px)",
              height: 460,
              background: BG,
              border: `1px solid ${BORDER}`,
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 8px 36px rgba(0,0,0,0.65)",
            }}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{ borderBottom: `1px solid ${BORDER}` }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: ACCENT + "22", border: `1px solid ${ACCENT}55` }}
              >
                <GordBird size={28} variant="head" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-none mb-0.5" style={{ color: TEXT }}>Gord</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>
                  Gord&rsquo;s on Board
                </p>
              </div>
              <button
                onClick={handleTip}
                disabled={tipState === "loading"}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-opacity hover:opacity-80 mr-1 disabled:opacity-50"
                style={{ background: ACCENT + "22", color: ACCENT, border: `1px solid ${ACCENT}44` }}
              >
                <Heart className="w-3 h-3" />
                Tip Gord
              </button>
              <button
                onClick={handleStartFresh}
                title="Start fresh"
                className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{ background: "#ffffff11", color: MUTED, border: `1px solid #ffffff22` }}
              >
                Fresh
              </button>
              <button
                onClick={handleClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
                style={{ color: MUTED }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                    style={
                      msg.role === "user"
                        ? { background: ACCENT, color: TEXT, borderRadius: "16px 16px 4px 16px" }
                        : { background: "#1A2A1A", color: MUTED, border: `1px solid #3A6A2A33`, borderRadius: "4px 16px 16px 16px" }
                    }
                  >
                    {msg.content || (streaming && i === messages.length - 1 ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full animate-bounce" style={{ background: MUTED, animationDelay: "0ms" }} />
                        <span className="w-1 h-1 rounded-full animate-bounce" style={{ background: MUTED, animationDelay: "150ms" }} />
                        <span className="w-1 h-1 rounded-full animate-bounce" style={{ background: MUTED, animationDelay: "300ms" }} />
                      </span>
                    ) : "")}
                  </div>
                </div>
              ))}

              {error && (
                <div
                  className="text-xs px-3 py-2 rounded-lg"
                  style={{ background: "#3A0A0A", color: "#F5A0A0", border: "1px solid #F5A0A033" }}
                >
                  {error}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {tipState !== "idle" && (
              <div
                className="flex-shrink-0 px-4 py-3 flex flex-col gap-2"
                style={{ borderTop: `1px solid ${BORDER}`, background: "#111A14" }}
              >
                {tipState === "picking" && tipSubState === "buttons" && (
                  <>
                    <p className="text-[11px] font-semibold" style={{ color: ACCENT }}>
                      Buy Gord a seed. Pick an amount:
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTipAmount(200)}
                        className="flex-1 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                        style={{ background: ACCENT + "22", color: ACCENT, border: `1px solid ${ACCENT}55` }}
                      >
                        $2 Tip
                      </button>
                      <button
                        onClick={() => handleTipAmount(500)}
                        className="flex-1 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                        style={{ background: ACCENT + "22", color: ACCENT, border: `1px solid ${ACCENT}55` }}
                      >
                        $5 Tip
                      </button>
                      <button
                        onClick={() => { setTipSubState("custom"); setCustomAmount(""); }}
                        className="flex-1 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                        style={{ background: ACCENT + "22", color: ACCENT, border: `1px solid ${ACCENT}55` }}
                      >
                        Other
                      </button>
                      <button
                        onClick={() => setTipState("idle")}
                        className="px-3 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-70"
                        style={{ color: MUTED }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
                {tipState === "picking" && tipSubState === "custom" && (
                  <>
                    <p className="text-[11px] font-semibold" style={{ color: ACCENT }}>
                      Enter a custom amount (min $1):
                    </p>
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <span
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold pointer-events-none"
                          style={{ color: MUTED }}
                        >$</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const cents = Math.round(parseFloat(customAmount) * 100);
                              if (!isNaN(cents) && cents >= 100) handleTipAmount(cents);
                            }
                          }}
                          placeholder="10"
                          className="w-full pl-6 pr-3 py-2 rounded-xl text-sm font-bold outline-none"
                          style={{ background: "#1A2A1A", border: `1px solid ${ACCENT}55`, color: ACCENT }}
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => {
                          const cents = Math.round(parseFloat(customAmount) * 100);
                          if (!isNaN(cents) && cents >= 100) handleTipAmount(cents);
                        }}
                        disabled={(() => { const c = Math.round(parseFloat(customAmount) * 100); return isNaN(c) || c < 100; })()}
                        className="px-3 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-30"
                        style={{ background: ACCENT, color: BG }}
                      >
                        Tip
                      </button>
                      <button
                        onClick={() => setTipSubState("buttons")}
                        className="px-3 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-70"
                        style={{ color: MUTED }}
                      >
                        Back
                      </button>
                    </div>
                  </>
                )}
                {tipState === "loading" && (
                  <div className="flex items-center gap-2 py-1">
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: ACCENT }} />
                    <p className="text-[11px]" style={{ color: MUTED }}>Opening Stripe Checkout…</p>
                  </div>
                )}
                {tipState === "error" && (
                  <>
                    <p className="text-[11px]" style={{ color: "#F5A0A0" }}>{tipError ?? "Something went wrong."}</p>
                    <button
                      onClick={() => setTipState("picking")}
                      className="text-[11px] font-bold underline self-start"
                      style={{ color: ACCENT }}
                    >
                      Try again
                    </button>
                  </>
                )}
              </div>
            )}

            {tipState === "idle" && (
              <div
                className="flex-shrink-0 px-4 py-3 flex items-end gap-2"
                style={{ borderTop: `1px solid ${BORDER}` }}
              >
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask Gord anything..."
                  disabled={streaming}
                  className="flex-1 rounded-xl px-3 py-2 text-sm resize-none outline-none"
                  style={{
                    background: "#1A2A1A",
                    border: `1px solid #3A6A2A44`,
                    color: TEXT,
                    maxHeight: 100,
                    lineHeight: "1.5",
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || streaming}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:opacity-90 disabled:opacity-30"
                  style={{ background: ACCENT }}
                >
                  {streaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: BG }} />
                  ) : (
                    <Send className="w-4 h-4" style={{ color: BG }} />
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!open && (
          <motion.button
            key="gord-button"
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            onClick={handleOpen}
            aria-label="Chat with Gord"
            className="fixed bottom-8 right-4 z-[60] cursor-pointer group"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
              className="relative"
            >
              <div
                className="w-14 h-14 rounded-3xl shadow-2xl flex items-center justify-center text-3xl border-2"
                style={{
                  background: "linear-gradient(135deg, #5A3A1A, #0D2B14)",
                  borderColor: ACCENT + "88",
                }}
              >
                🌿
              </div>
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}
              >
                <GordBird size={32} variant="head" hovered={hovered} />
              </motion.div>
              <div
                className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-lg px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none"
                style={{ background: "#1A2A1A", border: `1px solid ${ACCENT}55` }}
              >
                <span className="text-[10px] font-bold" style={{ color: ACCENT }}>
                  Gord&rsquo;s on Board
                </span>
              </div>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
