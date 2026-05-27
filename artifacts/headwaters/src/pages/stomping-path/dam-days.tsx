import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "sp_dam_days_entries";

interface DamEntry {
  id: string;
  text: string;
  timestamp: string;
}

function formatDate(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DamDays() {
  const [entries, setEntries] = useState<DamEntry[]>([]);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  function saveEntry() {
    const text = draft.trim();
    if (!text) return;

    const entry: DamEntry = {
      id: crypto.randomUUID(),
      text,
      timestamp: new Date().toISOString(),
    };

    const updated = [entry, ...entries];
    setEntries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setDraft("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      saveEntry();
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(160deg, #1a1a14 0%, #0f1209 50%, #141610 100%)",
        color: "#d4c9a8",
        fontFamily: "'Georgia', serif",
      }}
    >
      {/* Nav */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <Link href="/stomping-path">
          <span
            className="text-xs tracking-widest cursor-pointer"
            style={{ color: "#7a7055", letterSpacing: "0.15em" }}
          >
            ← THE STOMPING PATH
          </span>
        </Link>
        <span
          className="text-xs tracking-widest"
          style={{ color: "#4a4830", letterSpacing: "0.15em" }}
        >
          DAM DAYS
        </span>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1
            className="text-3xl font-normal mb-3"
            style={{ color: "#e8dfc0" }}
          >
            Dam Days
          </h1>
          <p
            className="text-sm mb-10"
            style={{ color: "#7a7055", lineHeight: 1.7 }}
          >
            Drop it here. A fragment, a take, a half-thought not ready for
            anywhere else. No audience. No publish button. Just the groove.
          </p>

          {/* Input area */}
          <div
            className="mb-10 rounded-sm"
            style={{
              border: "1px solid #3a3828",
              background: "#1a1a12",
            }}
          >
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What's running through?"
              rows={5}
              className="w-full resize-none bg-transparent px-5 py-4 text-base outline-none placeholder:opacity-40"
              style={{
                color: "#d4c9a8",
                fontFamily: "'Georgia', serif",
                fontSize: "1rem",
                lineHeight: 1.7,
              }}
            />
            <div
              className="px-5 pb-4 flex items-center justify-between"
            >
              <span
                className="text-xs"
                style={{ color: "#4a4830" }}
              >
                {draft.trim().length > 0
                  ? "⌘ + Enter to keep it"
                  : ""}
              </span>
              {draft.trim().length > 0 && (
                <button
                  onClick={saveEntry}
                  className="text-xs tracking-widest px-4 py-2 rounded-sm"
                  style={{
                    background: "#2e2c1e",
                    color: "#a89e7e",
                    border: "1px solid #4a4830",
                    letterSpacing: "0.12em",
                    cursor: "pointer",
                  }}
                >
                  KEEP IT
                </button>
              )}
            </div>
          </div>

          {/* Entries */}
          {entries.length === 0 ? (
            <p
              className="text-sm text-center py-10"
              style={{ color: "#4a4830", lineHeight: 1.7 }}
            >
              Nothing here yet. The groove starts with one mark.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              <AnimatePresence initial={false}>
                {entries.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="py-5 border-b"
                    style={{ borderColor: "#2a2a1c" }}
                  >
                    <p
                      className="text-sm mb-3"
                      style={{ color: "#a89e7e", lineHeight: 1.75, whiteSpace: "pre-wrap" }}
                    >
                      {entry.text}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "#4a4830" }}
                    >
                      {formatDate(entry.timestamp)}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
