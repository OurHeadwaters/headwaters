import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, X, ChevronDown, Loader2 } from "lucide-react";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

type Message = {
  role: "user" | "assistant";
  content: string;
};

const STARTER_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hey there! I'm your Debt Freedom Coach, powered by Dave Ramsey's 7 Baby Steps. Tell me about your situation — what debts are you carrying? I'll help you build your debt snowball and find your next concrete step.",
};

export function DebtFreedomCoach({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([STARTER_MESSAGE]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(apiUrl("/debt-coach/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error("Request failed");

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
            const json = JSON.parse(line.slice(6));
            if (json.done) break;
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
            // ignore parse errors
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant" && last.content === "") {
            updated[updated.length - 1] = {
              ...last,
              content: "Sorry, something went wrong. Please try again.",
            };
          }
          return updated;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }, [input, messages, streaming]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-amber-50/60">
        <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-900 leading-tight">Debt Freedom Coach</p>
          <p className="text-[11px] text-amber-700">Powered by Dave Ramsey's Baby Steps</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-amber-700" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-amber-600 text-white rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}
            >
              {msg.content}
              {msg.role === "assistant" && streaming && i === messages.length - 1 && msg.content === "" && (
                <Loader2 className="w-3.5 h-3.5 animate-spin inline-block ml-1 text-muted-foreground" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-3 py-3 flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tell me about your debts, budget, or situation…"
          rows={1}
          disabled={streaming}
          className="flex-1 resize-none bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-400 disabled:opacity-50 min-h-[38px] max-h-[120px]"
          style={{ fieldSizing: "content" } as React.CSSProperties}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || streaming}
          className="shrink-0 w-9 h-9 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          aria-label="Send"
        >
          {streaming ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}

export function DebtFreedomCoachPanel({ id }: { id?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div id={id} className="rounded-xl border border-amber-300/60 bg-amber-50/40 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-amber-50/80 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
          <Bot className="w-4.5 h-4.5 text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-amber-900 text-sm">Debt Freedom Coach</p>
          <p className="text-xs text-amber-700">Powered by Dave Ramsey's 7 Baby Steps · Click to open</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-amber-600 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-amber-200/60" style={{ height: "420px" }}>
          <DebtFreedomCoach />
        </div>
      )}
    </div>
  );
}
