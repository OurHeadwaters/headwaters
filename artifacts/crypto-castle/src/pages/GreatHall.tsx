import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FACTION_LIST, FACTIONS, RIVALRY_TRASH_TALK, type FactionId } from "@/data/factions";
import { useFaction } from "@/context/FactionContext";
import { useProgress } from "@/hooks/useProgress";
import { FactionBadge } from "@/components/FactionBadge";
import { MODULES } from "@/data/courses";

interface FactionCounts {
  btc: number;
  xrp: number;
  eth: number;
  wild: number;
}

const POLL_INTERVAL = 30_000;

function useFactionCounts() {
  const [counts, setCounts] = useState<FactionCounts>({
    btc: 1247,
    xrp: 892,
    eth: 1103,
    wild: 634,
  });

  const fetchCounts = () => {
    fetch("/api/castle/faction-counts")
      .then((r) => r.json())
      .then((data: FactionCounts) => setCounts(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, POLL_INTERVAL);
    const onFocus = () => fetchCounts();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return counts;
}

const TRASH_TALK_INTERVAL = 6000;

export default function GreatHall() {
  const { faction } = useFaction();
  const { getTotalProgress, getModuleProgress } = useProgress();
  const counts = useFactionCounts();
  const [talkIndex, setTalkIndex] = useState(0);

  const totalProgress = getTotalProgress();

  useEffect(() => {
    const timer = setInterval(() => {
      setTalkIndex((i) => (i + 1) % RIVALRY_TRASH_TALK.length);
    }, TRASH_TALK_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const totalMembers = Object.values(counts).reduce((a, b) => a + b, 0);
  const sorted = [...FACTION_LIST].sort((a, b) => (counts[b.id as FactionId] ?? 0) - (counts[a.id as FactionId] ?? 0));

  const currentTalk = RIVALRY_TRASH_TALK[talkIndex];
  const fromFaction = FACTIONS[currentTalk.from];
  const toFaction = FACTIONS[currentTalk.to];

  const factionData = faction ? FACTIONS[faction] : null;

  return (
    <div
      className={`min-h-screen ${faction ? `faction-${faction}` : ""}`}
      style={{
        background: factionData
          ? `radial-gradient(ellipse at 50% 0%, ${factionData.colors.primary}10 0%, #080810 50%)`
          : "#080810",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1
            className="text-5xl font-black mb-3 glow-text"
            style={{ color: factionData?.colors.primary ?? "#e2e8f0" }}
          >
            The Great Hall
          </h1>
          <p className="text-lg opacity-50">
            {totalMembers.toLocaleString()} warriors across all factions.
            Bragging rights updated live.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-12">
          {sorted.map((f, rank) => {
            const count = counts[f.id as FactionId] ?? 0;
            const pct = totalMembers > 0 ? (count / totalMembers) * 100 : 25;
            const isMyFaction = faction === f.id;

            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rank * 0.1 }}
                className="rounded-2xl p-5 border relative overflow-hidden"
                style={{
                  background: isMyFaction
                    ? `linear-gradient(135deg, ${f.colors.primary}20, ${f.colors.primary}05)`
                    : "rgba(255,255,255,0.03)",
                  borderColor: isMyFaction ? f.colors.primary : "rgba(255,255,255,0.08)",
                  boxShadow: isMyFaction ? `0 0 30px ${f.colors.glow}` : "none",
                }}
              >
                {rank === 0 && (
                  <div className="absolute top-2 right-2 text-xs font-black px-2 py-0.5 rounded-full"
                    style={{ background: f.colors.primary, color: f.colors.secondary }}>
                    #1
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl" style={{ filter: `drop-shadow(0 0 8px ${f.colors.glow})` }}>
                    {f.badge}
                  </span>
                  <div>
                    <h3 className="font-black" style={{ color: f.colors.primary }}>{f.name}</h3>
                    <p className="text-xs opacity-40">{f.figurehead}</p>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-xs opacity-50 mb-1">
                    <span>{count.toLocaleString()} members</span>
                    <span>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full progress-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${f.colors.primary}, ${f.colors.accent})`,
                        boxShadow: `0 0 8px ${f.colors.glow}`,
                      }}
                    />
                  </div>
                </div>

                {isMyFaction && (
                  <div
                    className="mt-3 text-xs font-bold py-1 px-2 rounded-full text-center"
                    style={{ background: f.colors.primary + "20", color: f.colors.primary }}
                  >
                    Your Faction
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            key={talkIndex}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl p-6 border border-white/5"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-40 mb-4">
              Today's Trash Talk
            </h3>
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{fromFaction.badge}</span>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold" style={{ color: fromFaction.colors.primary }}>
                    {fromFaction.name}
                  </span>
                  <span className="text-xs opacity-30">on</span>
                  <span className="text-sm font-bold" style={{ color: toFaction.colors.primary }}>
                    {toFaction.name}
                  </span>
                </div>
                <p className="text-base italic opacity-80">"{currentTalk.line}"</p>
              </div>
            </div>
            <div className="flex gap-1 mt-4">
              {RIVALRY_TRASH_TALK.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTalkIndex(i)}
                  className="h-1.5 rounded-full flex-1 transition-all"
                  style={{
                    background: i === talkIndex
                      ? (factionData?.colors.primary ?? "#e2e8f0")
                      : "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>
          </motion.div>

          {faction && factionData && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl p-6 border"
              style={{
                background: `linear-gradient(135deg, ${factionData.colors.primary}10, rgba(8,8,16,0.8))`,
                borderColor: `${factionData.colors.primary}30`,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider opacity-40">
                  Your Forge Progress
                </h3>
                <FactionBadge factionId={faction} size="sm" />
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="opacity-60">Total progress</span>
                  <span className="font-bold" style={{ color: factionData.colors.primary }}>
                    {totalProgress.completed}/{totalProgress.total} lessons
                  </span>
                </div>
                <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${totalProgress.percent}%`,
                      background: `linear-gradient(90deg, ${factionData.colors.primary}, ${factionData.colors.accent})`,
                      boxShadow: `0 0 10px ${factionData.colors.glow}`,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {MODULES.map((mod) => {
                  const mp = getModuleProgress(mod.id);
                  return (
                    <div key={mod.id} className="flex items-center gap-3">
                      <span className="text-lg">{mod.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="opacity-60">{mod.title}</span>
                          <span style={{ color: factionData.colors.primary }}>
                            {mp.completed}/{mp.total}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${mp.percent}%`,
                              background: factionData.colors.primary,
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {!faction && (
            <div className="rounded-2xl p-6 border border-white/5 flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              <p className="text-sm opacity-40 text-center">
                Pick a faction on the home page<br />to see your forge progress here.
              </p>
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl p-6 border border-white/5"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <h3 className="text-sm font-bold uppercase tracking-wider opacity-40 mb-4">
            Bragging Rights Board
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {FACTION_LIST.map((f) => (
              <div key={f.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: f.colors.primary }}>{f.badge}</span>
                  <span className="text-sm font-bold" style={{ color: f.colors.primary }}>
                    {f.name}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {f.bragLines.map((line, i) => (
                    <div key={i} className="text-xs opacity-50 flex items-start gap-1.5">
                      <span className="mt-0.5" style={{ color: f.colors.primary }}>▸</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
