import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useGordContext } from "@/context/gord-context";
import { getTspPageDescription, buildGordContextDescription } from "@/lib/gord-context-utils";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Heart } from "lucide-react";
import { GordBird, type IdleAnim } from "./gord-bird";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

type Message = {
  role: "user" | "assistant";
  content: string;
};

const TSP_OPENING_LINES: Record<string, string> = {
  "/": "Gord's on board. You're on the homepage — good starting point. The featured stuff up here is worth your time. What are you trying to figure out today?",
  "/tracks": "Gord's on board. Tracks are how you actually learn something instead of just listening randomly. Pick one and follow it. What track are you curious about?",
  "/zones": "Gord's on board. Zones — as in permaculture zones, the ones that actually map to your life. Zone 0 is your head, Zone 1 is your kitchen. Where are you working right now?",
  "/transform": "Gord's on board. You're on the Transform page. This is where people decide to actually change something instead of just thinking about it. Which path is calling you?",
  "/kits": "Gord's on board. Kits are the gear-and-knowledge bundles — no fluff, just what you need for each path. Looking for something specific?",
  "/series": "Gord's on board. Deep dives. Multi-episode runs on one subject. If you've got a topic you want to go all the way into, this is the place. What are you after?",
  "/library": "Gord's on board. The full archive — every episode, searchable, filterable. It's a lot. What are you trying to find?",
  "/stomping-grounds": "Gord's on board. The Stomping Grounds — community, shared wisdom, conversations that don't go in circles. Got something on your mind worth sharing?",
  "/wisdom-dig": "Gord's on board. Wisdom Dig — the good stuff that floats up from the community. See anything here that lands for you?",
  "/wishing-well": "Gord's on board. Wishing Well — where listener ideas go so they don't disappear. Got something you want to see covered?",
  "/council": "Gord's on board. The Expert Council — the people behind the depth on this platform. Want to know more about any of them?",
  "/about": "Gord's on board. The About page. Origin story, mission, the whole deal. What brought you here today?",
  "/headwaters": "Gord's on board. The Headwaters — the deeper water. This is the paid membership side. Are you already a member or thinking about it?",
  "/brigade": "Gord's on board. Brigade — member country. You're in. What are you looking to dig into?",
  "/map": "Gord's on board. Your Map — a picture of where you've been and where you're headed across tracks, zones, and transformations. What does your progress look like so far?",
};

function getTspOpeningLine(path: string): Message {
  let content = TSP_OPENING_LINES[path];
  if (!content) {
    if (path.startsWith("/tracks/")) content = "Gord's on board. You're inside a track — a curated run of episodes on a single thread. Good move. What do you want to know about this one?";
    else if (path.startsWith("/zones/")) content = "Gord's on board. You're in a zone — specific episodes and resources for this slice of your life. Anything I can help you navigate here?";
    else if (path.startsWith("/transform/")) content = "Gord's on board. You're on a transformation path page. These are the ones that actually change how you live. What's on your mind?";
    else if (path.startsWith("/library/")) content = "Gord's on board. You're on an episode page — chapters, links, the whole thing. Want to talk through what's in this episode?";
    else content = "Gord's on board. You look like someone who's either got a great plan or no plan whatsoever. Either way, I'm here. What's on your mind?";
  }
  return { role: "assistant", content };
}

const TIP_THANK_YOU: Message = {
  role: "assistant",
  content: "Well. I don't have pockets, but I appreciate the gesture. Sunflower seeds incoming. Gord's on board — and now slightly better funded.",
};

const ACCENT = "#D9A066";
const BG = "#1a2e1a";
const BORDER = "#D9A06633";
const TEXT = "#FDFBF7";
const MUTED = "#C8D4C0";

const STORAGE_KEY = "gord-history-tsp";

const HEAD_ANIMS: IdleAnim[] = ["head-tilt", "head-bob"];
const ANIM_DURATION_MS = 1400;

type TipState = "idle" | "picking" | "loading" | "error";
type TipSubState = "buttons" | "custom";

interface RecentSupporter {
  name: string;
  amountCents: number;
  tippedAt: string;
}

function useIdleAnimation(paused: boolean): IdleAnim {
  const [anim, setAnim] = useState<IdleAnim>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    let cycleTimeout: ReturnType<typeof setTimeout>;
    let clearAnim: ReturnType<typeof setTimeout>;

    function runCycle() {
      const delay = 9000 + Math.random() * 8000;
      cycleTimeout = setTimeout(() => {
        if (pausedRef.current) { runCycle(); return; }
        const pick = HEAD_ANIMS[Math.floor(Math.random() * HEAD_ANIMS.length)];
        setAnim(pick);
        clearAnim = setTimeout(() => { setAnim(null); runCycle(); }, ANIM_DURATION_MS);
      }, delay);
    }

    runCycle();
    return () => { clearTimeout(cycleTimeout); clearTimeout(clearAnim); };
  }, []);

  return anim;
}

function useEyeTarget(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [eyeTarget, setEyeTarget] = useState({ dx: 0, dy: 0 });
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rawDx = e.clientX - cx;
      const rawDy = e.clientY - cy;
      const dist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
      if (dist < 1) return;
      const maxDist = 280;
      const factor = Math.min(dist, maxDist) / maxDist;
      setEyeTarget({ dx: (rawDx / dist) * factor, dy: (rawDy / dist) * factor });
    });
  }, [containerRef]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [handleMouseMove]);

  return eyeTarget;
}

interface GordGuideProps {
  path?: string;
}

export function GordGuide(_props: GordGuideProps) {
  const [location] = useLocation();
  const { pageTitle } = useGordContext();
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [tipState, setTipState] = useState<TipState>("idle");
  const [tipSubState, setTipSubState] = useState<TipSubState>("buttons");
  const [customAmount, setCustomAmount] = useState("")
  const [tipError, setTipError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

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

  const idleAnim = useIdleAnimation(open || hovered);
  const eyeTarget = useEyeTarget(buttonRef);

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
      setMessages([getTspOpeningLine(location), TIP_THANK_YOU]);
      setHasOpened(true);
      setOpen(true);
    }
  }, []);

  function handleOpen() {
    if (!hasOpened) {
      setMessages([getTspOpeningLine(location)]);
      setHasOpened(true);
    }
    setOpen(true);
  }

  function handleStartFresh() {
    abortRef.current?.abort();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setMessages([getTspOpeningLine(location)]);
    setHasOpened(true);
    setInput("");
    setError(null);
  }

  function handleClose() {
    abortRef.current?.abort();
    setOpen(false);
    setTipState("idle");
    setTipSubState("buttons");
    setCustomAmount("");
    setTipError(null);
  }

  function handleTip() {
    if (!hasOpened) {
      setMessages([getTspOpeningLine(location)]);
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
          context: {
            path: location,
            description: buildGordContextDescription(location, pageTitle),
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

  const contextDescription = buildGordContextDescription(location, pageTitle);

  return (
    <>
      {/* Hidden element exposing the current Gord context description for testing */}
      <span
        data-testid="gord-context-description"
        aria-hidden="true"
        style={{ display: "none" }}
      >
        {contextDescription}
      </span>
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
              boxShadow: "0 8px 36px rgba(0,0,0,0.55)",
            }}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{ borderBottom: `1px solid ${BORDER}` }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-lg leading-none"
                style={{ background: ACCENT + "22", border: `1px solid ${ACCENT}55` }}
              >
                🐦
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
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
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
                style={{ borderTop: `1px solid ${BORDER}`, background: "#1e341e" }}
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
                          style={{ background: "#253525", border: `1px solid ${ACCENT}55`, color: ACCENT }}
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

            {tipState === "idle" && recentSupporters.length > 0 && (
              <div
                className="flex-shrink-0 px-4 pt-2.5 pb-2"
                style={{ borderTop: `1px solid ${BORDER}` }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Heart className="w-3 h-3 flex-shrink-0" style={{ color: ACCENT }} />
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: ACCENT }}
                  >
                    Recent Supporters
                  </span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
                  {recentSupporters.map((s, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{
                        background: ACCENT + "18",
                        border: `1px solid ${ACCENT}33`,
                        color: TEXT,
                      }}
                    >
                      <span>{s.name}</span>
                      <span style={{ color: ACCENT }}>
                        · ${(s.amountCents / 100 % 1 === 0
                          ? s.amountCents / 100
                          : (s.amountCents / 100).toFixed(2))}
                      </span>
                    </div>
                  ))}
                </div>
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
                    background: "#253525",
                    border: `1px solid #4A7A3A44`,
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
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#1a2e1a" }} />
                  ) : (
                    <Send className="w-4 h-4" style={{ color: "#1a2e1a" }} />
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
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={handleOpen}
            aria-label="Chat with Gord"
            className="fixed bottom-16 right-0 z-[60] cursor-pointer group"
          >
            <motion.div
              whileHover={{ x: -6 }}
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
              className="relative flex items-end"
            >
              {/* Tooltip label that slides in on hover */}
              <div className="absolute right-full mr-2 bottom-5 bg-[#FDF6EC] border border-[#D9A066]/60 rounded-lg px-2.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-md">
                <span className="text-[10px] font-bold text-[#D9A066]">Gord&rsquo;s on Board</span>
              </div>

              {/* Branch + bird stack */}
              <div className="relative w-28 h-16 flex items-end justify-center">
                {/* Birch branch */}
                <div
                  className="absolute bottom-3 left-0 w-28 h-4 rounded-full shadow-lg"
                  style={{
                    background: "linear-gradient(90deg, #7B4A1E 0%, #F5F0E8 30%, #E8DCC8 55%, #A0692A 80%, #7B4A1E 100%)",
                    border: "1px solid #5C3410",
                    transform: "rotate(-8deg)",
                    boxShadow: "0 3px 8px rgba(0,0,0,0.35)",
                  }}
                >
                  {/* Birch bark marks */}
                  <div className="absolute top-1 left-8 w-3 h-0.5 rounded-full bg-[#8B5E2A]/40" />
                  <div className="absolute top-2.5 left-14 w-2 h-0.5 rounded-full bg-[#7B4A1E]/30" />
                  <div className="absolute top-1 left-20 w-2 h-0.5 rounded-full bg-[#8B5E2A]/35" />
                </div>

                {/* Gord perched on the branch */}
                <motion.div
                  ref={buttonRef}
                  className="absolute bottom-5 left-8"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3.0, repeat: Infinity, ease: "easeInOut" }}
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                  style={{ filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.5))" }}
                >
                  <GordBird
                    size={44}
                    variant="head"
                    eyeTarget={eyeTarget}
                    idleAnim={idleAnim}
                    hovered={hovered}
                  />
                </motion.div>
              </div>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
