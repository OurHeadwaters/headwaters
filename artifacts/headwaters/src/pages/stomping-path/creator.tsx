import { useState, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useStompingPathCreatorOverlap } from "@workspace/api-client-react";
import type { TeacherOverlapCount } from "@workspace/api-client-react";

type Phase = "input" | "result";

export default function StompingPathCreator() {
  const [phase, setPhase] = useState<Phase>("input");
  const [creatorName, setCreatorName] = useState("");
  const [teachers, setTeachers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<{
    shareId: string;
    overlap: TeacherOverlapCount[];
    poolSize: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const creatorOverlapMutation = useStompingPathCreatorOverlap();

  function addTeacher() {
    const name = inputValue.trim();
    if (!name || teachers.includes(name)) return;
    setTeachers([...teachers, name]);
    setInputValue("");
    inputRef.current?.focus();
  }

  function removeTeacher(name: string) {
    setTeachers(teachers.filter((t) => t !== name));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTeacher();
    }
  }

  function submitMap() {
    if (!creatorName.trim() || teachers.length < 2) return;
    creatorOverlapMutation.mutate(
      { data: { creatorName: creatorName.trim(), teachers } },
      {
        onSuccess: (data) => {
          setResult({
            shareId: data.shareId,
            overlap: data.overlap,
            poolSize: data.poolSize,
          });
          setPhase("result");
        },
      },
    );
  }

  function copyShareLink() {
    if (!result) return;
    const base = window.location.origin;
    const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    const link = `${base}${basePath}/stomping-path/share/${result.shareId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function getShareUrl(): string {
    if (!result) return "";
    const base = window.location.origin;
    const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    return `${base}${basePath}/stomping-path/share/${result.shareId}`;
  }

  const pageStyle: React.CSSProperties = {
    background: "linear-gradient(160deg, #1a1a14 0%, #0f1209 50%, #141610 100%)",
    color: "#d4c9a8",
    fontFamily: "'Georgia', serif",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div style={pageStyle}>
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
          TEACHERS & CREATORS
        </span>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <AnimatePresence mode="wait">
          {phase === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1
                className="text-3xl font-normal mb-3"
                style={{ color: "#e8dfc0" }}
              >
                Creator Terrain Map
              </h1>
              <p
                className="text-sm mb-8"
                style={{ color: "#7a7055", lineHeight: 1.7 }}
              >
                If you create — a podcast, a newsletter, a course, a body of
                work — your audience was shaped by teachers before they found
                you. Enter your own influences. See where your people already
                are. Share the map with them.
              </p>

              {/* Creator name */}
              <div className="mb-6">
                <p
                  className="text-xs tracking-widest mb-3"
                  style={{ color: "#4a4830", letterSpacing: "0.15em" }}
                >
                  YOUR NAME OR BRAND
                </p>
                <input
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="The Survival Podcast, Jack Spirko..."
                  className="w-full bg-transparent text-base outline-none placeholder:opacity-30 py-3"
                  style={{
                    color: "#d4c9a8",
                    fontFamily: "'Georgia', serif",
                    borderBottom: "1px solid #3a3828",
                  }}
                />
              </div>

              {/* Teacher input */}
              <div className="mb-4">
                <p
                  className="text-xs tracking-widest mb-3"
                  style={{ color: "#4a4830", letterSpacing: "0.15em" }}
                >
                  YOUR TEACHER INFLUENCES
                </p>
                <div
                  className="flex gap-2"
                  style={{ borderBottom: "1px solid #3a3828", paddingBottom: "0.75rem" }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Joel Salatin, Ron Paul, C.S. Lewis..."
                    className="flex-1 bg-transparent text-base outline-none placeholder:opacity-30"
                    style={{ color: "#d4c9a8", fontFamily: "'Georgia', serif" }}
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
              </div>

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

              {creatorName.trim() && teachers.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <button
                    onClick={submitMap}
                    disabled={creatorOverlapMutation.isPending}
                    className="text-sm tracking-widest py-4 px-6 rounded-sm w-full"
                    style={{
                      background: creatorOverlapMutation.isPending ? "#1e1e16" : "#2a2820",
                      color: creatorOverlapMutation.isPending ? "#4a4830" : "#d4c9a8",
                      border: "1px solid #4a4830",
                      letterSpacing: "0.18em",
                      cursor: creatorOverlapMutation.isPending ? "default" : "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {creatorOverlapMutation.isPending
                      ? "reading the terrain..."
                      : "— see where your people are —"}
                  </button>
                </motion.div>
              )}

              {(!creatorName.trim() || teachers.length < 2) && (
                <p
                  className="text-xs text-center"
                  style={{ color: "#4a4830" }}
                >
                  {!creatorName.trim()
                    ? "Add your name or brand, then at least two teachers."
                    : "Add at least two teachers to map the terrain."}
                </p>
              )}
            </motion.div>
          )}

          {phase === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-baseline justify-between mb-8">
                <div>
                  <p
                    className="text-xs tracking-widest mb-1"
                    style={{ color: "#4a4830", letterSpacing: "0.15em" }}
                  >
                    TERRAIN MAP FOR
                  </p>
                  <h2
                    className="text-2xl font-normal"
                    style={{ color: "#e8dfc0" }}
                  >
                    {creatorName}
                  </h2>
                </div>
                <button
                  onClick={() => setPhase("input")}
                  className="text-xs"
                  style={{ color: "#4a4830", cursor: "pointer", background: "none", border: "none" }}
                >
                  start over
                </button>
              </div>

              {/* Share link */}
              <div
                className="mb-8 p-5 rounded-sm"
                style={{ background: "#1a1a12", border: "1px solid #3a3828" }}
              >
                <p
                  className="text-xs tracking-widest mb-3"
                  style={{ color: "#4a4830", letterSpacing: "0.15em" }}
                >
                  SHAREABLE LINK
                </p>
                <p
                  className="text-sm break-all mb-4"
                  style={{ color: "#7a7055", lineHeight: 1.6 }}
                >
                  {getShareUrl()}
                </p>
                <button
                  onClick={copyShareLink}
                  className="text-xs tracking-widest px-4 py-2 rounded-sm"
                  style={{
                    background: copied ? "#1e2a1e" : "#2e2c1e",
                    color: copied ? "#7aaa7a" : "#a89e7e",
                    border: "1px solid #4a4830",
                    letterSpacing: "0.12em",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                >
                  {copied ? "COPIED" : "COPY LINK"}
                </button>
                <p
                  className="text-xs mt-3"
                  style={{ color: "#4a4830", lineHeight: 1.6 }}
                >
                  Send this to your audience. They'll see where your influences
                  overlap with the watershed they're already walking.
                </p>
              </div>

              {/* Overlap results */}
              <div>
                <p
                  className="text-xs tracking-widest mb-4"
                  style={{ color: "#4a4830", letterSpacing: "0.15em" }}
                >
                  WHERE YOUR PEOPLE ALREADY ARE
                </p>

                {result.overlap.filter((o) => o.count > 0).length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {result.overlap
                      .filter((o) => o.count > 0)
                      .map((o, i) => (
                        <motion.div
                          key={o.teacher}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
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
                              {o.count === 1
                                ? "person in this pond was also shaped here"
                                : "people in this pond were also shaped here"}
                              .
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
                  <div
                    className="py-8 text-center rounded-sm"
                    style={{ background: "#161610", border: "1px solid #2a2a1c" }}
                  >
                    <p
                      className="text-sm mb-2"
                      style={{ color: "#7a7055", lineHeight: 1.7 }}
                    >
                      The pond is still filling.
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "#4a4830", lineHeight: 1.7 }}
                    >
                      Your teachers have entered the water first. Share your
                      map — as your audience wades in, the overlap will reveal
                      itself.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-10">
                <p
                  className="text-xs text-center"
                  style={{ color: "#4a4830" }}
                >
                  Pool size: {result.poolSize}{" "}
                  {result.poolSize === 1 ? "person" : "people"} have waded in.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
