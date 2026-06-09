import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Heart, ThumbsUp, ThumbsDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

type Message = {
  role: "user" | "assistant";
  content: string;
};

const ACCENT = "#D9A066";
const BG = "#1a2212";
const BORDER = "#D9A06633";
const TEXT = "#FDFBF7";
const MUTED = "#C8D4C0";
const STORAGE_KEY = "gord-history-tsp-v2";

const OPENING_LINES: Record<string, string> = {
  "/": "Gord's on board. You're on the homepage — good starting point. What are you trying to figure out today?",
  "/tracks": "Gord's on board. Tracks are how you actually learn something instead of just listening randomly. What track are you curious about?",
  "/zones": "Gord's on board. Zones — as in permaculture zones, the ones that actually map to your life. Where are you working right now?",
  "/transform": "Gord's on board. You're on the Transform page. These are the ones that actually change how you live. Which path is calling you?",
  "/kits": "Gord's on board. Kits are the gear-and-knowledge bundles. Looking for something specific?",
  "/library": "Gord's on board. The full archive — every episode, searchable. It's a lot. What are you trying to find?",
  "/stomping-grounds": "Gord's on board. The Stomping Grounds — community, shared wisdom. Got something on your mind?",
  "/council": "Gord's on board. The Expert Council — the people behind the depth here. Want to know more about any of them?",
  "/headwaters": "Gord's on board. The Headwaters — the deeper water. Are you already a member or thinking about it?",
  "/history": "Gord's on board. Every episode where Jack connects history to a present-day lesson. Looking for a specific era?",
};

function getOpeningLine(path: string): Message {
  let content = OPENING_LINES[path];
  if (!content) {
    if (path.startsWith("/tracks/")) content = "Gord's on board. You're inside a track — a curated run on a single thread. What do you want to know?";
    else if (path.startsWith("/zones/")) content = "Gord's on board. You're in a zone — episodes and resources for this slice of your life. Anything I can help you navigate?";
    else if (path.startsWith("/transform/")) content = "Gord's on board. You're on a transformation path. What's on your mind?";
    else if (path.startsWith("/episodes/")) content = "Gord's on board. You're on an episode page. Want to talk through what's here?";
    else content = "Gord's on board. You look like someone who either has a great plan or no plan. Either way, I'm here. What's on your mind?";
  }
  return { role: "assistant", content };
}

const TIP_THANK_YOU: Message = {
  role: "assistant",
  content: "Well. I don't have pockets, but I appreciate the gesture. Sunflower seeds incoming. Gord's on board — and now slightly better funded.",
};

async function submitFeedback(opts: {
  rating: "up" | "down";
  assistantMessage: string;
  userMessage?: string;
  path: string;
}): Promise<void> {
  try {
    await fetch("https://our-headwaters.replit.app/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "gord-chat",
        site: "thestompingpaths.com",
        ...opts,
      }),
    });
  } catch {
    // best-effort
  }
}

type TipState = "idle" | "picking" | "loading" | "error";
type TipSubState = "buttons" | "custom";

interface RecentSupporter {
  name: string;
  amountCents: number;
  tippedAt: string;
}

export function GordChat() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [fluttering, setFluttering] = useState(false);
  const [tipState, setTipState] = useState<TipState>("idle");
  const [tipSubState, setTipSubState] = useState<TipSubState>("buttons");
  const [customAmount, setCustomAmount] = useState("");
  const [tipError, setTipError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<number, "up" | "down">>({});

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { data: recentSupporters = [] } = useQuery<RecentSupporter[]>({
    queryKey: ["gord-tips-recent"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/gord/tips/recent"));
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    function cycle() {
      const delay = 12000 + Math.random() * 10000;
      t = setTimeout(() => {
        if (!open && !hovered) {
          setFluttering(true);
          setTimeout(() => setFluttering(false), 700);
        }
        cycle();
      }, delay);
    }
    cycle();
    return () => clearTimeout(t);
  }, [open, hovered]);

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
    } catch { }
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.filter((m) => m.content !== "")));
    } catch { }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tip") === "success") {
      const url = new URL(window.location.href);
      url.searchParams.delete("tip");
      window.history.replaceState({}, "", url.toString());
      setMessages([getOpeningLine(location), TIP_THANK_YOU]);
      setHasOpened(true);
      setOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleOpen() {
    if (!hasOpened) {
      setMessages([getOpeningLine(location)]);
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
    try { localStorage.removeItem(STORAGE_KEY); } catch { }
    setMessages([getOpeningLine(location)]);
    setHasOpened(true);
    setInput("");
    setError(null);
  }

  function handleTip() {
    if (!hasOpened) {
      setMessages([getOpeningLine(location)]);
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
      if (!res.ok || !data.url) throw new Error(data.error ?? "Failed to start tip session");
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
      const res = await fetch("https://our-headwaters.replit.app/api/guardian/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          context: {
            path: location,
            site: "thestompingpaths.com",
          },
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
          } catch { }
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

  const gordImgSrc = `${import.meta.env.BASE_URL}gord.png`;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="gord-chat-panel"
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
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ background: ACCENT + "22", border: `1px solid ${ACCENT}55` }}
              >
                <img src={gordImgSrc} alt="Gord" className="w-full h-full object-cover" />
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
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-opacity hover:opacity-80 disabled:opacity-50"
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
              {messages.map((msg, i) => {
                const prevUserMsg = msg.role === "assistant" && i > 0 ? messages[i - 1] : null;
                return (
                  <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                      style={
                        msg.role === "user"
                          ? { background: ACCENT, color: TEXT, borderRadius: "16px 16px 4px 16px" }
                          : { background: "#253525", color: MUTED, border: `1px solid #4A7A3A33`, borderRadius: "4px 16px 16px 16px" }
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
                    {msg.role === "assistant" && msg.content && !streaming && (
                      <div className="flex items-center gap-1 mt-1 ml-1">
                        {(["up", "down"] as const).map((dir) => (
                          <button
                            key={dir}
                            onClick={() => {
                              if (ratings[i]) return;
                              setRatings((prev) => ({ ...prev, [i]: dir }));
                              submitFeedback({
                                rating: dir,
                                assistantMessage: msg.content,
                                userMessage: prevUserMsg?.content,
                                path: location,
                              });
                            }}
                            title={dir === "up" ? "Helpful" : "Not helpful"}
                            className="w-5 h-5 flex items-center justify-center rounded transition-opacity hover:opacity-80 disabled:opacity-30"
                            style={{
                              color: ratings[i] === dir ? ACCENT : MUTED + "55",
                              opacity: ratings[i] && ratings[i] !== dir ? 0.2 : undefined,
                            }}
                          >
                            {dir === "up" ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

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
                style={{ borderTop: `1px solid ${BORDER}`, background: "#1e341e" }}
              >
                {tipState === "picking" && tipSubState === "buttons" && (
                  <>
                    <p className="text-[11px] font-semibold" style={{ color: ACCENT }}>
                      Buy Gord a seed. Pick an amount:
                    </p>
                    <div className="flex gap-2">
                      {[200, 500, 1000].map((cents) => (
                        <button
                          key={cents}
                          onClick={() => handleTipAmount(cents)}
                          className="flex-1 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                          style={{ background: ACCENT + "22", color: ACCENT, border: `1px solid ${ACCENT}55` }}
                        >
                          ${cents / 100}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setTipSubState("custom")}
                      className="text-[11px] font-semibold text-center transition-opacity hover:opacity-70"
                      style={{ color: MUTED }}
                    >
                      Custom amount
                    </button>
                    {recentSupporters.length > 0 && (
                      <p className="text-[10px] mt-1" style={{ color: MUTED + "99" }}>
                        Recent: {recentSupporters.slice(0, 2).map((s) => s.name).join(", ")}
                      </p>
                    )}
                  </>
                )}
                {tipState === "picking" && tipSubState === "custom" && (
                  <>
                    <p className="text-[11px] font-semibold" style={{ color: ACCENT }}>Custom amount (USD):</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="e.g. 10"
                        className="flex-1 bg-transparent border rounded-lg px-3 py-1.5 text-sm outline-none"
                        style={{ borderColor: ACCENT + "44", color: TEXT }}
                      />
                      <button
                        onClick={() => {
                          const cents = Math.round(parseFloat(customAmount) * 100);
                          if (isNaN(cents) || cents < 100) { setTipError("Minimum is $1"); return; }
                          handleTipAmount(cents);
                        }}
                        className="px-3 py-1.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-80"
                        style={{ background: ACCENT, color: "#1a2212" }}
                      >
                        Tip
                      </button>
                    </div>
                    <button
                      onClick={() => setTipSubState("buttons")}
                      className="text-[10px] transition-opacity hover:opacity-70 text-left"
                      style={{ color: MUTED }}
                    >
                      ← Back to amounts
                    </button>
                  </>
                )}
                {tipState === "loading" && (
                  <div className="flex items-center gap-2 py-1" style={{ color: MUTED }}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Opening checkout…</span>
                  </div>
                )}
                {tipState === "error" && (
                  <div className="flex flex-col gap-1">
                    <p className="text-xs" style={{ color: "#F5A0A0" }}>{tipError}</p>
                    <button
                      onClick={() => setTipState("picking")}
                      className="text-[11px] font-semibold"
                      style={{ color: ACCENT }}
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            )}

            <div
              className="flex-shrink-0 px-3 py-3"
              style={{ borderTop: `1px solid ${BORDER}` }}
            >
              <div
                className="flex items-end gap-2 rounded-xl px-3 py-2"
                style={{ background: "#ffffff08", border: `1px solid ${BORDER}` }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask Gord anything…"
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-white/30 leading-relaxed max-h-28"
                  style={{ color: TEXT }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || streaming}
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-30"
                  style={{ background: ACCENT, color: "#1a2212" }}
                >
                  {streaming ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="fixed bottom-6 right-6 z-[69] cursor-pointer select-none"
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onClick={handleOpen}
        animate={
          fluttering
            ? { rotate: [0, -8, 6, -4, 0], scale: [1, 1.08, 1.04, 1.06, 1] }
            : hovered
              ? { scale: 1.08 }
              : { scale: 1, rotate: 0 }
        }
        transition={{ type: "spring", stiffness: 280, damping: 20 }}
        whileTap={{ scale: 0.93 }}
        title="Chat with Gord"
        style={{ transformOrigin: "bottom right" }}
      >
        <div className="relative">
          {!open && (
            <motion.div
              className="absolute -top-1 -left-1 -right-1 -bottom-1 rounded-full"
              animate={{ opacity: [0.4, 0.15, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ background: `radial-gradient(circle, ${ACCENT}40 0%, transparent 70%)` }}
            />
          )}
          <img
            src={gordImgSrc}
            alt="Gord the owl"
            className="w-16 h-16 object-contain drop-shadow-[0_4px_16px_rgba(217,160,102,0.45)]"
            style={{ transform: "scaleX(-1)" }}
            draggable={false}
          />
        </div>
      </motion.div>
    </>
  );
}
