import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X, Loader2, Footprints } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

type Message = {
  role: "user" | "assistant";
  content: string;
};

const STARTER: Message = {
  role: "assistant",
  content:
    "Trailblazer here. Where are you trying to get? Tell me your situation — what you're working on, where you're stuck — and I'll point you at the right path.",
};

const ACCENT = "#C4622D";
const BG = "#0F1A0F";
const BORDER = "#C4622D33";
const TEXT = "#FDFBF7";
const MUTED = "#C8D4C0";

export function TrailblazerChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([STARTER]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
      const res = await fetch(apiUrl("/trailblazer/chat"), {
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
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + json.content,
                  };
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
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex flex-col"
      style={{
        width: 340,
        maxWidth: "calc(100vw - 32px)",
        height: 480,
        background: BG,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: ACCENT + "22", border: `1px solid ${ACCENT}55` }}
        >
          <Footprints className="w-4 h-4" style={{ color: ACCENT }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-none mb-0.5" style={{ color: TEXT }}>
            Trailblazer
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>
            Stomping Path Guide
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ color: MUTED }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
              style={
                msg.role === "user"
                  ? { background: ACCENT, color: TEXT, borderRadius: "16px 16px 4px 16px" }
                  : { background: "#1A2A1A", color: MUTED, border: `1px solid #4A7A3A33`, borderRadius: "4px 16px 16px 16px" }
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

      {/* Input */}
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
          placeholder="What are you working on?"
          disabled={streaming}
          className="flex-1 rounded-xl px-3 py-2 text-sm resize-none outline-none"
          style={{
            background: "#1A2A1A",
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
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: TEXT }} />
          ) : (
            <Send className="w-4 h-4" style={{ color: TEXT }} />
          )}
        </button>
      </div>
    </motion.div>
  );
}
