import { useState, useEffect, useRef, ReactNode } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetHeadwatersDashboard } from "@workspace/api-client-react";
import { setExtraHeadersGetter } from "@workspace/api-client-react";

type Mode = "fork" | "passphrase";

const fade = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25, ease: "easeIn" } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export function PassphraseGuard({ children }: { children: ReactNode }) {
  const [passphrase, setPassphrase] = useState(localStorage.getItem("hw-auth") || "");
  const [inputVal, setInputVal] = useState("");
  const [mode, setMode] = useState<Mode>("fork");
  const [wrongPass, setWrongPass] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setExtraHeadersGetter(() => ({
      "x-hw-passphrase": localStorage.getItem("hw-auth") ?? "",
    }));
    return () => setExtraHeadersGetter(null);
  }, []);

  const { error, isLoading, refetch } = useGetHeadwatersDashboard({
    query: { enabled: !!passphrase, retry: false } as any,
  });

  const isLocked = !passphrase || (error && (error as any)?.status === 401);

  useEffect(() => {
    if (passphrase) {
      localStorage.setItem("hw-auth", passphrase);
    } else {
      localStorage.removeItem("hw-auth");
    }
  }, [passphrase]);

  useEffect(() => {
    if (mode === "passphrase") {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWrongPass(false);
    setPassphrase(inputVal);
    localStorage.setItem("hw-auth", inputVal);
    setTimeout(() => refetch(), 10);
  };

  useEffect(() => {
    if (error && (error as any)?.status === 401 && passphrase) {
      setWrongPass(true);
      setPassphrase("");
      localStorage.removeItem("hw-auth");
    }
  }, [error, passphrase]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0c1108", color: "#8a7a60", fontFamily: "Georgia, serif" }}
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm tracking-widest"
        >
          Unlocking journal…
        </motion.p>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{
          background: "linear-gradient(160deg, #0e1209 0%, #0a0f06 60%, #0c1009 100%)",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(180,140,80,0.05) 0%, transparent 70%)",
          }}
        />

        <motion.div
          className="relative z-10 w-full max-w-lg text-center"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* Zone marker */}
          <motion.p
            variants={fade}
            className="text-[10px] font-bold tracking-[0.25em] uppercase mb-6"
            style={{ color: "#6a5e40" }}
          >
            Headwaters · 807 Food Co-operative · Dryden, Ontario
          </motion.p>

          {/* Title */}
          <motion.h1
            variants={fade}
            className="text-5xl font-bold mb-3"
            style={{ color: "#e8dcc8", letterSpacing: "-0.01em" }}
          >
            Headwaters
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={fade}
            className="text-sm leading-relaxed mb-10 mx-auto max-w-sm"
            style={{ color: "#7a6e54" }}
          >
            The practitioner field journal. And the trail that runs through it.
          </motion.p>

          {/* Fork */}
          <AnimatePresence mode="wait">
            {mode === "fork" && (
              <motion.div
                key="fork"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={stagger}
                className="grid sm:grid-cols-2 gap-4 text-left"
              >
                {/* Field Journal door */}
                <motion.button
                  variants={fade}
                  onClick={() => setMode("passphrase")}
                  className="group rounded-xl border px-5 py-5 text-left transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                  style={{
                    borderColor: "rgba(180,140,80,0.25)",
                    background: "rgba(180,140,80,0.05)",
                  }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: "#b48c50" }}
                  >
                    Field Journal
                  </p>
                  <p className="text-sm leading-snug mb-4" style={{ color: "#8a7a60" }}>
                    Practitioner intake, client records, business financials, and the stomping path tools.
                  </p>
                  <p
                    className="text-xs font-semibold transition-colors group-hover:opacity-100"
                    style={{ color: "#b48c50", opacity: 0.7 }}
                  >
                    I have a passphrase →
                  </p>
                </motion.button>

                {/* The Trail door */}
                <motion.div variants={fade}>
                  <Link href="/stomping-path">
                    <div
                      className="group rounded-xl border px-5 py-5 text-left cursor-pointer transition-all duration-200 hover:opacity-90 active:scale-[0.98] h-full"
                      style={{
                        borderColor: "rgba(90,140,80,0.25)",
                        background: "rgba(90,140,80,0.05)",
                      }}
                    >
                      <p
                        className="text-[10px] font-bold uppercase tracking-widest mb-2"
                        style={{ color: "#6a9c5a" }}
                      >
                        The Trail
                      </p>
                      <p className="text-sm leading-snug mb-4" style={{ color: "#8a7a60" }}>
                        The Stomping Path — Zone 2. The Compass, Dam Days, the Creator, and the way to the Shallows.
                      </p>
                      <p
                        className="text-xs font-semibold transition-colors group-hover:opacity-100"
                        style={{ color: "#6a9c5a", opacity: 0.7 }}
                      >
                        I'm on the trail →
                      </p>
                    </div>
                  </Link>
                </motion.div>
              </motion.div>
            )}

            {mode === "passphrase" && (
              <motion.div
                key="passphrase"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={stagger}
                className="space-y-4"
              >
                <motion.form
                  variants={fade}
                  onSubmit={handleSubmit}
                  className="rounded-xl border px-6 py-6 space-y-4"
                  style={{
                    borderColor: "rgba(180,140,80,0.2)",
                    background: "rgba(180,140,80,0.04)",
                  }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "#b48c50" }}
                  >
                    Field Journal
                  </p>
                  <input
                    ref={inputRef}
                    type="password"
                    placeholder="Passphrase"
                    value={inputVal}
                    onChange={(e) => {
                      setInputVal(e.target.value);
                      setWrongPass(false);
                    }}
                    className="w-full rounded-lg px-4 py-3 text-sm font-mono text-center outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: wrongPass
                        ? "1px solid rgba(200,80,60,0.5)"
                        : "1px solid rgba(180,140,80,0.25)",
                      color: "#e8dcc8",
                      caretColor: "#b48c50",
                    }}
                  />
                  {wrongPass && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-center"
                      style={{ color: "#c85040" }}
                    >
                      Incorrect passphrase.
                    </motion.p>
                  )}
                  <button
                    type="submit"
                    disabled={!inputVal}
                    className="w-full rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-30"
                    style={{
                      background: inputVal ? "rgba(180,140,80,0.2)" : "transparent",
                      border: "1px solid rgba(180,140,80,0.3)",
                      color: "#b48c50",
                    }}
                  >
                    Unlock
                  </button>
                </motion.form>

                <motion.button
                  variants={fade}
                  onClick={() => {
                    setMode("fork");
                    setInputVal("");
                    setWrongPass(false);
                  }}
                  className="text-xs transition-colors"
                  style={{ color: "#5a5040" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#8a7a60")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#5a5040")}
                >
                  ← Back
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "#0c1108", color: "#8a7a60", fontFamily: "Georgia, serif" }}
      >
        <p className="text-sm">Error connecting to server.</p>
        <button
          onClick={() => refetch()}
          className="text-xs px-4 py-2 rounded border transition-colors"
          style={{ borderColor: "rgba(180,140,80,0.3)", color: "#b48c50" }}
        >
          Retry
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
