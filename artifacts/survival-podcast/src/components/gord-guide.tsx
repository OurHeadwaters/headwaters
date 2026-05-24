import { useState, useEffect, useRef, useCallback } from "react";
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

const OPENING_LINE: Message = {
  role: "assistant",
  content: "Gord's on board. You look like someone who's either got a great plan or no plan whatsoever. Either way, I'm here. What's on your mind?",
};

const TIP_RESPONSE: Message = {
  role: "assistant",
  content: "Ha. Tip Gord. I appreciate the thought, but I'm a bird — what am I going to do with your money? Buy sunflower seeds? Put it toward your own self-reliance stack instead. That's the tip.",
};

const ACCENT = "#D9A066";
const BG = "#1a2e1a";
const BORDER = "#D9A06633";
const TEXT = "#FDFBF7";
const MUTED = "#C8D4C0";

const HEAD_ANIMS: IdleAnim[] = ["head-tilt", "head-bob"];
const ANIM_DURATION_MS = 1400;

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
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const idleAnim = useIdleAnimation(open || hovered);
  const eyeTarget = useEyeTarget(buttonRef);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  function handleOpen() {
    if (!hasOpened) {
      setMessages([OPENING_LINE]);
      setHasOpened(true);
    }
    setOpen(true);
  }

  function handleClose() {
    abortRef.current?.abort();
    setOpen(false);
  }

  function handleTip() {
    setMessages((prev) => [...prev, TIP_RESPONSE]);
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
        body: JSON.stringify({ messages: newMessages }),
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
  }, [input, messages, streaming]);

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
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-opacity hover:opacity-80 mr-1"
                style={{ background: ACCENT + "22", color: ACCENT, border: `1px solid ${ACCENT}44` }}
              >
                <Heart className="w-3 h-3" />
                Tip Gord
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
