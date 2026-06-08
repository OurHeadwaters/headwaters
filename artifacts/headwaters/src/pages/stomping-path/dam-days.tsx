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

function exportEntries(entries: DamEntry[]) {
  const lines = entries
    .slice()
    .reverse()
    .map((e) => `[${formatDate(e.timestamp)}]\n${e.text}`)
    .join("\n\n---\n\n");

  const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dam-days.txt";
  a.click();
  URL.revokeObjectURL(url);
}

function importEntries(
  file: File,
  existing: DamEntry[],
  onDone: (merged: DamEntry[], added: number) => void
) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const raw = (e.target?.result as string) ?? "";
    const blocks = raw.split(/\n\n---\n\n/);
    const existingTexts = new Set(existing.map((en) => en.text.trim()));
    const newEntries: DamEntry[] = [];

    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;
      const firstNewline = trimmed.indexOf("\n");
      if (firstNewline === -1) continue;

      const headerLine = trimmed.slice(0, firstNewline).trim();
      const bodyText = trimmed.slice(firstNewline + 1).trim();
      if (!bodyText) continue;

      // headerLine is like "[Nov 15, 2024, 3:45 PM]"
      const dateMatch = headerLine.match(/^\[(.+)\]$/);
      let ts = new Date().toISOString();
      if (dateMatch) {
        const parsed = new Date(dateMatch[1]);
        if (!isNaN(parsed.getTime())) ts = parsed.toISOString();
      }

      if (existingTexts.has(bodyText.trim())) continue;

      existingTexts.add(bodyText.trim());
      newEntries.push({
        id: crypto.randomUUID(),
        text: bodyText,
        timestamp: ts,
      });
    }

    // Merge: new entries first (they'll appear newest-first after sort)
    // but preserve the original order by timestamp
    const merged = [...existing, ...newEntries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    onDone(merged, newEntries.length);
  };
  reader.readAsText(file);
}

export default function DamDays() {
  const [entries, setEntries] = useState<DamEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

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

  function clearEntries() {
    localStorage.removeItem(STORAGE_KEY);
    setEntries([]);
    setConfirmClear(false);
  }

  function handleImportClick() {
    importInputRef.current?.click();
  }

  function handleImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    importEntries(file, entries, (merged, added) => {
      setEntries(merged);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      if (added === 0) {
        setImportFeedback("no new entries found");
      } else {
        setImportFeedback(`${added} ${added === 1 ? "entry" : "entries"} restored`);
      }
      setTimeout(() => setImportFeedback(null), 3500);
    });
    e.target.value = "";
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
      <input
        ref={importInputRef}
        type="file"
        accept=".txt"
        style={{ display: "none" }}
        onChange={handleImportChange}
      />
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
            <div className="flex flex-col items-center gap-4 py-10">
              <p
                className="text-sm text-center"
                style={{ color: "#4a4830", lineHeight: 1.7 }}
              >
                Nothing here yet. The groove starts with one mark.
              </p>
              <button
                onClick={handleImportClick}
                className="text-xs tracking-widest"
                style={{
                  color: "#3a3828",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  letterSpacing: "0.12em",
                  padding: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#7a7055")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#3a3828")}
              >
                RESTORE FROM FILE
              </button>
            </div>
          ) : (
            <>
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

              {/* Footer actions */}
              <div className="mt-12 pt-6 flex items-center justify-between" style={{ borderTop: "1px solid #1e1e14" }}>
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => exportEntries(entries)}
                    className="text-xs tracking-widest"
                    style={{
                      color: "#5a5640",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      letterSpacing: "0.12em",
                      padding: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#a89e7e")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#5a5640")}
                  >
                    EXPORT
                  </button>
                  <AnimatePresence mode="wait">
                    {importFeedback ? (
                      <motion.span
                        key="feedback"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-xs"
                        style={{ color: "#7a7055", letterSpacing: "0.08em" }}
                      >
                        {importFeedback}
                      </motion.span>
                    ) : (
                      <motion.button
                        key="import-btn"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={handleImportClick}
                        className="text-xs tracking-widest"
                        style={{
                          color: "#3a3828",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          letterSpacing: "0.12em",
                          padding: 0,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#7a7055")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#3a3828")}
                      >
                        IMPORT
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence mode="wait">
                  {confirmClear ? (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-4"
                    >
                      <span className="text-xs" style={{ color: "#5a5640" }}>
                        clear everything?
                      </span>
                      <button
                        onClick={clearEntries}
                        className="text-xs tracking-widest"
                        style={{
                          color: "#8a5a4a",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          letterSpacing: "0.12em",
                          padding: 0,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#c47a5a")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#8a5a4a")}
                      >
                        YES, CLEAR
                      </button>
                      <button
                        onClick={() => setConfirmClear(false)}
                        className="text-xs tracking-widest"
                        style={{
                          color: "#4a4830",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          letterSpacing: "0.12em",
                          padding: 0,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#7a7055")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#4a4830")}
                      >
                        KEEP IT
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="trigger"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setConfirmClear(true)}
                      className="text-xs tracking-widest"
                      style={{
                        color: "#3a3828",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        letterSpacing: "0.12em",
                        padding: 0,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#6a5a4a")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#3a3828")}
                    >
                      CLEAR THE GROOVE
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
