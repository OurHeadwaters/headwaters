import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

const NAME_KEY = "shallows_name";

type Phase = "arrive" | "name" | "resting";

export default function Shallows() {
  const [phase, setPhase] = useState<Phase>("arrive");
  const [inputValue, setInputValue] = useState("");
  const [savedName, setSavedName] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(NAME_KEY);
    if (stored) {
      setSavedName(stored);
      setPhase("resting");
    } else {
      const timer = setTimeout(() => setShowInput(true), 2400);
      return () => clearTimeout(timer);
    }
  }, []);

  function leaveName() {
    const name = inputValue.trim();
    if (!name) return;
    localStorage.setItem(NAME_KEY, name);
    setSavedName(name);
    setPhase("resting");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      leaveName();
    }
  }

  function clearName() {
    localStorage.removeItem(NAME_KEY);
    setSavedName(null);
    setInputValue("");
    setPhase("arrive");
    setTimeout(() => setShowInput(true), 2400);
  }

  const pageStyle: React.CSSProperties = {
    background: "linear-gradient(180deg, #101418 0%, #0d1217 40%, #0a0f14 100%)",
    color: "#c8d4d0",
    fontFamily: "'Georgia', serif",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div style={pageStyle}>
      {/* Trail marker back to Zone 2 */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <Link href="/stomping-path/compass">
          <span
            className="text-xs tracking-widest cursor-pointer"
            style={{ color: "#4a5e58", letterSpacing: "0.15em" }}
          >
            ← ZONE 2 · THE COMPASS
          </span>
        </Link>
        <span
          className="text-xs tracking-widest"
          style={{ color: "#2a3a36", letterSpacing: "0.15em" }}
        >
          ZONE 5
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* ─── ARRIVE ─── */}
          {phase === "arrive" && (
            <motion.div
              key="arrive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8 }}
              className="text-center w-full"
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 1.4 }}
                className="text-xs tracking-widest mb-12"
                style={{ color: "#3a5050", letterSpacing: "0.25em" }}
              >
                ZONE 5 · THE SHALLOWS
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 1.4 }}
                className="text-4xl font-normal mb-8"
                style={{ color: "#dce8e4", lineHeight: 1.3 }}
              >
                The Shallows
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 1.2 }}
                className="text-base mb-4"
                style={{ color: "#7a9e96", lineHeight: 1.9 }}
              >
                Still water, finally.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1.2 }}
                className="text-sm"
                style={{ color: "#4a6660", lineHeight: 1.9 }}
              >
                The path brought you here. You don't need to do anything with
                it — only be present at the edge.
              </motion.p>

              <AnimatePresence>
                {showInput && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2 }}
                    className="mt-16"
                  >
                    <p
                      className="text-sm mb-6 text-center"
                      style={{ color: "#4a6660", lineHeight: 1.8 }}
                    >
                      Leave your name at the water's edge.
                    </p>

                    <div
                      className="flex gap-3"
                      style={{
                        borderBottom: "1px solid #1e3030",
                        paddingBottom: "0.75rem",
                      }}
                    >
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="your name"
                        autoFocus
                        className="flex-1 bg-transparent text-base outline-none text-center placeholder:opacity-25"
                        style={{
                          color: "#c8d4d0",
                          fontFamily: "'Georgia', serif",
                          letterSpacing: "0.06em",
                        }}
                      />
                      <button
                        onClick={leaveName}
                        className="text-xs tracking-widest px-4 py-2 rounded-sm"
                        style={{
                          background: "transparent",
                          color: "#4a6660",
                          border: "1px solid #1e3030",
                          letterSpacing: "0.15em",
                          cursor: "pointer",
                          fontFamily: "'Georgia', serif",
                        }}
                      >
                        leave
                      </button>
                    </div>

                    <p
                      className="text-xs text-center mt-4"
                      style={{ color: "#2a3a38", lineHeight: 1.7 }}
                    >
                      Only the name. Nothing else crosses.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ─── RESTING ─── */}
          {phase === "resting" && savedName && (
            <motion.div
              key="resting"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6 }}
              className="text-center w-full"
            >
              <p
                className="text-xs tracking-widest mb-16"
                style={{ color: "#3a5050", letterSpacing: "0.25em" }}
              >
                ZONE 5 · THE SHALLOWS
              </p>

              {/* The name at the water's edge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 1.8 }}
                className="mb-16"
                style={{
                  borderBottom: "1px solid #1a2e2a",
                  paddingBottom: "2.5rem",
                }}
              >
                <p
                  className="text-xs tracking-widest mb-6"
                  style={{ color: "#2e4844", letterSpacing: "0.2em" }}
                >
                  AT THE WATER'S EDGE
                </p>
                <p
                  className="text-5xl font-normal"
                  style={{
                    color: "#dce8e4",
                    letterSpacing: "0.04em",
                    lineHeight: 1.2,
                  }}
                >
                  {savedName}
                </p>
              </motion.div>

              {/* Still-water note */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 1.4 }}
                className="mb-16"
              >
                <p
                  className="text-base mb-4"
                  style={{ color: "#6a9090", lineHeight: 1.9 }}
                >
                  The journey doesn't end here — it quiets here.
                </p>
                <p
                  className="text-sm"
                  style={{ color: "#3a5858", lineHeight: 1.9 }}
                >
                  Still water reflects. It doesn't rush forward or carry
                  weight. This is where the path becomes a place to stand.
                </p>
              </motion.div>

              {/* Trail markers */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1.2 }}
                className="pt-8"
                style={{ borderTop: "1px solid #141e1c" }}
              >
                <div className="flex flex-col gap-4 items-center">
                  <Link href="/stomping-path/compass">
                    <span
                      className="text-xs tracking-widest cursor-pointer"
                      style={{ color: "#3a5050", letterSpacing: "0.15em" }}
                    >
                      ← RETURN TO THE COMPASS
                    </span>
                  </Link>
                  <Link href="/stomping-path">
                    <span
                      className="text-xs tracking-widest cursor-pointer"
                      style={{ color: "#2a3a38", letterSpacing: "0.15em" }}
                    >
                      ← ZONE 2 · THE STOMPING PATH
                    </span>
                  </Link>
                </div>

                <button
                  onClick={clearName}
                  className="text-xs mt-8 block mx-auto"
                  style={{
                    color: "#1e2e2c",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    fontFamily: "'Georgia', serif",
                  }}
                >
                  leave a different name
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
