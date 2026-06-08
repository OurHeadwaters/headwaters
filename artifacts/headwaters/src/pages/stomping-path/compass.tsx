import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useStompingPathCluster, useStompingPathWadeIn } from "@workspace/api-client-react";
import type { TerrainCluster, TeacherOverlapCount } from "@workspace/api-client-react";

const SESSION_TOKEN_KEY = "sp_session_token";
const TEACHERS_KEY = "sp_compass_teachers";
const CLUSTERS_KEY = "sp_compass_clusters";
const HANDLE_KEY = "sp_compass_handle";
const OVERLAP_KEY = "sp_compass_overlap";

function getOrCreateSessionToken(): string {
  let token = localStorage.getItem(SESSION_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  }
  return token;
}

type Phase = "input" | "terrain" | "crossing" | "pool";

export default function Compass() {
  const [phase, setPhase] = useState<Phase>("input");
  const [teachers, setTeachers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [clusters, setClusters] = useState<TerrainCluster[]>([]);
  const [handle, setHandle] = useState<string | null>(null);
  const [overlap, setOverlap] = useState<TeacherOverlapCount[]>([]);
  const [poolSize, setPoolSize] = useState(0);
  const [crossingVisible, setCrossingVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const clusterMutation = useStompingPathCluster();
  const wadeInMutation = useStompingPathWadeIn();

  // Restore state from localStorage
  useEffect(() => {
    try {
      const savedTeachers = localStorage.getItem(TEACHERS_KEY);
      const savedClusters = localStorage.getItem(CLUSTERS_KEY);
      const savedHandle = localStorage.getItem(HANDLE_KEY);
      const savedOverlap = localStorage.getItem(OVERLAP_KEY);

      if (savedTeachers) setTeachers(JSON.parse(savedTeachers));
      if (savedClusters) {
        setClusters(JSON.parse(savedClusters));
        setPhase("terrain");
      }
      if (savedHandle) {
        setHandle(savedHandle);
        if (savedOverlap) setOverlap(JSON.parse(savedOverlap));
        setPhase("pool");
      }
    } catch {
      // ignore
    }
  }, []);

  // Show crossing invitation after terrain is visible
  useEffect(() => {
    if (phase !== "terrain") {
      setCrossingVisible(false);
      return;
    }
    const timer = setTimeout(() => setCrossingVisible(true), 1800);
    return () => clearTimeout(timer);
  }, [phase]);

  function addTeacher() {
    const name = inputValue.trim();
    if (!name || teachers.includes(name)) return;
    const updated = [...teachers, name];
    setTeachers(updated);
    localStorage.setItem(TEACHERS_KEY, JSON.stringify(updated));
    setInputValue("");
    inputRef.current?.focus();
  }

  function removeTeacher(name: string) {
    const updated = teachers.filter((t) => t !== name);
    setTeachers(updated);
    localStorage.setItem(TEACHERS_KEY, JSON.stringify(updated));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTeacher();
    }
  }

  function readTerrain() {
    if (teachers.length === 0) return;
    clusterMutation.mutate(
      { data: { teachers } },
      {
        onSuccess: (result) => {
          setClusters(result.clusters);
          localStorage.setItem(CLUSTERS_KEY, JSON.stringify(result.clusters));
          setPhase("terrain");
        },
      },
    );
  }

  function beginCrossing() {
    setPhase("crossing");
    const sessionToken = getOrCreateSessionToken();

    wadeInMutation.mutate(
      { data: { teachers, sessionToken } },
      {
        onSuccess: (result) => {
          setHandle(result.handle);
          setOverlap(result.overlap);
          setPoolSize(result.poolSize ?? 0);
          localStorage.setItem(HANDLE_KEY, result.handle);
          localStorage.setItem(OVERLAP_KEY, JSON.stringify(result.overlap));
          setTimeout(() => setPhase("pool"), 2200);
        },
        onError: () => {
          setPhase("terrain");
        },
      },
    );
  }

  function resetCompass() {
    setPhase("input");
    setTeachers([]);
    setClusters([]);
    setHandle(null);
    setOverlap([]);
    setCrossingVisible(false);
    localStorage.removeItem(TEACHERS_KEY);
    localStorage.removeItem(CLUSTERS_KEY);
    localStorage.removeItem(HANDLE_KEY);
    localStorage.removeItem(OVERLAP_KEY);
  }

  const overlayStyle: React.CSSProperties = {
    background: "linear-gradient(160deg, #1a1a14 0%, #0f1209 50%, #141610 100%)",
    color: "#d4c9a8",
    fontFamily: "'Georgia', serif",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div style={overlayStyle}>
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
          THE COMPASS
        </span>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <AnimatePresence mode="wait">
          {/* ─── PHASE: INPUT ─── */}
          {phase === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6 }}
            >
              <h1
                className="text-3xl font-normal mb-3"
                style={{ color: "#e8dfc0" }}
              >
                The Compass
              </h1>
              <p
                className="text-sm mb-8"
                style={{ color: "#7a7055", lineHeight: 1.7 }}
              >
                Name the teachers that shaped you. Books, people, thinkers,
                experiences. One at a time. No categories yet — the terrain
                will name itself.
              </p>

              {/* Input */}
              <div
                className="flex gap-2 mb-4"
                style={{ borderBottom: "1px solid #3a3828", paddingBottom: "1rem" }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ron Paul, Joel Salatin, Marcus Aurelius..."
                  className="flex-1 bg-transparent text-base outline-none placeholder:opacity-30"
                  style={{ color: "#d4c9a8", fontFamily: "'Georgia', serif" }}
                  autoFocus
                />
                <button
                  onClick={addTeacher}
                  className="text-xs tracking-widest px-3 py-2 rounded-sm"
                  style={{
                    background: "#2e2c1e",
                    color: "#a89e7e",
                    border: "1px solid #4a4830",
                    letterSpacing: "0.12em",
                    cursor: "pointer",
                  }}
                >
                  ADD
                </button>
              </div>

              {/* Teacher tags */}
              {teachers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {teachers.map((t) => (
                    <motion.span
                      key={t}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-sm px-3 py-1 rounded-sm flex items-center gap-2 cursor-pointer group"
                      style={{
                        background: "#1e1e16",
                        border: "1px solid #3a3828",
                        color: "#a89e7e",
                      }}
                      onClick={() => removeTeacher(t)}
                      title="Click to remove"
                    >
                      {t}
                      <span
                        className="opacity-0 group-hover:opacity-60 transition-opacity text-xs"
                        style={{ color: "#7a7055" }}
                      >
                        ✕
                      </span>
                    </motion.span>
                  ))}
                </div>
              )}

              {teachers.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <button
                    onClick={readTerrain}
                    disabled={clusterMutation.isPending}
                    className="text-sm tracking-widest py-4 px-6 rounded-sm w-full"
                    style={{
                      background: clusterMutation.isPending ? "#1e1e16" : "#2a2820",
                      color: clusterMutation.isPending ? "#4a4830" : "#d4c9a8",
                      border: "1px solid #4a4830",
                      letterSpacing: "0.18em",
                      cursor: clusterMutation.isPending ? "default" : "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {clusterMutation.isPending
                      ? "reading the terrain..."
                      : "— read the terrain —"}
                  </button>
                </motion.div>
              )}

              {teachers.length === 1 && (
                <p
                  className="text-xs text-center"
                  style={{ color: "#4a4830" }}
                >
                  Add at least one more to read the terrain.
                </p>
              )}
            </motion.div>
          )}

          {/* ─── PHASE: TERRAIN MAP ─── */}
          {phase === "terrain" && (
            <motion.div
              key="terrain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9 }}
            >
              <div className="flex items-baseline justify-between mb-8">
                <div>
                  <h2
                    className="text-2xl font-normal mb-1"
                    style={{ color: "#e8dfc0" }}
                  >
                    Your terrain
                  </h2>
                  <p
                    className="text-xs"
                    style={{ color: "#4a4830" }}
                  >
                    {teachers.length} teachers mapped
                  </p>
                </div>
                <button
                  onClick={resetCompass}
                  className="text-xs"
                  style={{ color: "#4a4830", cursor: "pointer", background: "none", border: "none" }}
                >
                  start over
                </button>
              </div>

              <div className="flex flex-col gap-5 mb-10">
                {clusters.map((cluster, i) => (
                  <motion.div
                    key={cluster.label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.12, duration: 0.5 }}
                    className="py-4 px-5 rounded-sm"
                    style={{
                      background: "#181812",
                      borderLeft: "2px solid #4a4830",
                    }}
                  >
                    <p
                      className="text-xs tracking-widest mb-3"
                      style={{ color: "#7a7055", letterSpacing: "0.15em" }}
                    >
                      {cluster.label.toUpperCase()}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cluster.teachers.map((t) => (
                        <span
                          key={t}
                          className="text-sm"
                          style={{ color: "#c4b99a" }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Crossing invitation */}
              <AnimatePresence>
                {crossingVisible && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2 }}
                    className="mt-6 pt-8 border-t"
                    style={{ borderColor: "#2a2a1c" }}
                  >
                    <p
                      className="text-base mb-3 text-center"
                      style={{ color: "#a89e7e", lineHeight: 1.8 }}
                    >
                      These waters run deeper.
                    </p>
                    <p
                      className="text-sm mb-6 text-center"
                      style={{ color: "#7a7055", lineHeight: 1.7 }}
                    >
                      Others have walked this ridge. Some of your teachers have
                      been named before — by people you've never met, on paths
                      that paralleled yours.
                    </p>
                    <div className="text-center">
                      <button
                        onClick={beginCrossing}
                        className="text-xs tracking-widest py-4 px-8 rounded-sm"
                        style={{
                          background: "transparent",
                          color: "#a89e7e",
                          border: "1px solid #4a4830",
                          letterSpacing: "0.2em",
                          cursor: "pointer",
                          fontFamily: "'Georgia', serif",
                        }}
                      >
                        wade in
                      </button>
                    </div>
                    <p
                      className="text-xs text-center mt-4"
                      style={{ color: "#4a4830" }}
                    >
                      Your identity stays on the trail. Only teachers enter the water.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ─── PHASE: CROSSING ─── */}
          {phase === "crossing" && (
            <motion.div
              key="crossing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4 }}
              className="flex flex-col items-center justify-center min-h-96 text-center"
            >
              <motion.div
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <p
                  className="text-lg mb-3"
                  style={{ color: "#a89e7e", letterSpacing: "0.05em" }}
                >
                  stepping off the path
                </p>
                <p
                  className="text-sm"
                  style={{ color: "#4a4830" }}
                >
                  onto the bank...
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* ─── PHASE: POOL ─── */}
          {phase === "pool" && handle && (
            <motion.div
              key="pool"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              {/* Handle assignment */}
              <div
                className="text-center mb-10 py-8 rounded-sm"
                style={{ background: "#161610", border: "1px solid #2e2c1e" }}
              >
                <p
                  className="text-xs tracking-widest mb-4"
                  style={{ color: "#4a4830", letterSpacing: "0.2em" }}
                >
                  IN THIS WATER, YOU ARE
                </p>
                <p
                  className="text-4xl font-normal mb-3"
                  style={{ color: "#e8dfc0", letterSpacing: "0.04em" }}
                >
                  {handle}
                </p>
                {poolSize > 0 && (
                  <p
                    className="text-xs"
                    style={{ color: "#4a4830" }}
                  >
                    {poolSize} {poolSize === 1 ? "person" : "people"} in this pond
                  </p>
                )}
              </div>

              {/* Overlap map */}
              <div>
                <p
                  className="text-xs tracking-widest mb-6"
                  style={{ color: "#4a4830", letterSpacing: "0.15em" }}
                >
                  THE SAME WATERSHED, DIFFERENT TRIBUTARIES
                </p>

                {overlap.filter((o) => o.count > 0).length > 0 ? (
                  <div className="flex flex-col gap-5">
                    {overlap
                      .filter((o) => o.count > 0)
                      .map((o, i) => (
                        <motion.div
                          key={o.teacher}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.15, duration: 0.5 }}
                          className="flex items-baseline gap-4 pb-4 border-b"
                          style={{ borderColor: "#2a2a1c" }}
                        >
                          <div className="flex-1">
                            <p
                              className="text-base mb-1"
                              style={{ color: "#d4c9a8" }}
                            >
                              {o.teacher}
                            </p>
                            <p
                              className="text-xs"
                              style={{ color: "#7a7055", lineHeight: 1.6 }}
                            >
                              {o.count}{" "}
                              {o.count === 1 ? "other" : "others"} in this
                              pond {o.count === 1 ? "was" : "were"} also
                              shaped by this teacher.
                            </p>
                          </div>
                          <div
                            className="text-2xl font-light"
                            style={{ color: "#6b6245", minWidth: "2rem", textAlign: "right" }}
                          >
                            {o.count}
                          </div>
                        </motion.div>
                      ))}
                  </div>
                ) : (
                  <p
                    className="text-sm py-6 text-center"
                    style={{ color: "#4a4830", lineHeight: 1.7 }}
                  >
                    Your teachers have entered the water first. The pond is
                    filling. Come back as more people wade in.
                  </p>
                )}
              </div>

              {/* Threshold to Zone 5 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1.2 }}
                className="mt-16 pt-8 border-t text-center"
                style={{ borderColor: "#2a2a1c" }}
              >
                <p
                  className="text-sm mb-2"
                  style={{ color: "#4a4830", lineHeight: 1.7 }}
                >
                  The path continues downstream.
                </p>
                <p
                  className="text-sm mb-6"
                  style={{ color: "#3a3820", lineHeight: 1.7 }}
                >
                  Zone 5 is still water. Leave your name at the water's edge.
                </p>
                <Link href="/headwaters/shallows">
                  <span
                    className="text-xs tracking-widest cursor-pointer"
                    style={{ color: "#3a3820", letterSpacing: "0.18em" }}
                  >
                    ZONE 5 · THE SHALLOWS →
                  </span>
                </Link>

                <div className="mt-8">
                  <button
                    onClick={resetCompass}
                    className="text-xs"
                    style={{ color: "#4a4830", cursor: "pointer", background: "none", border: "none" }}
                  >
                    walk this path again
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
