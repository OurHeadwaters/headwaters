import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { FACTION_LIST, FACTIONS, type FactionId } from "@/data/factions";
import { useFaction } from "@/context/FactionContext";
import { getSessionId } from "@/lib/sessionId";

export default function FactionPicker() {
  const { faction: currentFaction, setFaction } = useFaction();
  const [hoveredFaction, setHoveredFaction] = useState<FactionId | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<FactionId | null>(null);
  const [, navigate] = useLocation();

  const previewFaction = selectedPreview ?? hoveredFaction ?? currentFaction;
  const previewData = previewFaction ? FACTIONS[previewFaction] : null;

  const handleJoin = async (id: FactionId) => {
    const isNewFaction = id !== currentFaction;
    setFaction(id);

    if (isNewFaction) {
      try {
        const sid = await getSessionId();
        await fetch("/api/castle/faction-join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ faction: id, sessionId: sid }),
        });
      } catch {
      }
    }

    setTimeout(() => navigate("/great-hall"), 600);
  };

  return (
    <div
      className={`min-h-screen transition-all duration-700 ${currentFaction ? `faction-${currentFaction}` : ""}`}
      style={{
        background: previewData
          ? `radial-gradient(ellipse at 50% 30%, ${previewData.colors.primary}15 0%, #080810 60%)`
          : "#080810",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="text-6xl mb-4 animate-float" style={{ display: "inline-block" }}>⚔️</div>
          <h1 className="text-5xl font-black mb-4 tracking-tight" style={{ color: previewData?.colors.primary ?? "#e2e8f0" }}>
            Choose Your Faction
          </h1>
          <p className="text-lg opacity-60 max-w-xl mx-auto">
            The tribes fight. The blacksmith sharpens everyone's weapons.
            Pick your side — then learn the fundamentals from the same neutral forge.
          </p>
          {currentFaction && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 inline-block px-4 py-2 rounded-full text-sm font-bold"
              style={{
                background: FACTIONS[currentFaction].colors.primary + "20",
                color: FACTIONS[currentFaction].colors.primary,
                border: `1px solid ${FACTIONS[currentFaction].colors.primary}40`,
              }}
            >
              Currently: {FACTIONS[currentFaction].name} — click another to switch
            </motion.div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
          {FACTION_LIST.map((faction, i) => (
            <motion.div
              key={faction.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onMouseEnter={() => setHoveredFaction(faction.id)}
              onMouseLeave={() => setHoveredFaction(null)}
              onClick={() => setSelectedPreview(selectedPreview === faction.id ? null : faction.id)}
              className="faction-card rounded-2xl p-6 flex flex-col gap-4"
              style={{
                background: selectedPreview === faction.id
                  ? `linear-gradient(135deg, ${faction.colors.primary}20, ${faction.colors.primary}05)`
                  : "rgba(255,255,255,0.03)",
                borderColor: selectedPreview === faction.id || hoveredFaction === faction.id
                  ? faction.colors.primary
                  : "rgba(255,255,255,0.08)",
                boxShadow: selectedPreview === faction.id
                  ? `0 0 40px ${faction.colors.glow}`
                  : "none",
              }}
            >
              <div className="text-center">
                <div
                  className="text-5xl mb-3"
                  style={{ filter: `drop-shadow(0 0 12px ${faction.colors.glow})` }}
                >
                  {faction.badge}
                </div>
                <h2 className="text-xl font-black" style={{ color: faction.colors.primary }}>
                  {faction.name}
                </h2>
                <p className="text-xs opacity-50 mt-0.5">{faction.emoji}</p>
              </div>

              <div className="border-t border-white/5 pt-4">
                <p className="text-xs font-bold opacity-50 uppercase tracking-wider mb-1">Figurehead</p>
                <p className="text-sm font-semibold" style={{ color: faction.colors.accent }}>
                  {faction.figurehead}
                </p>
                <p className="text-xs opacity-40">{faction.figureheadTitle}</p>
              </div>

              <p className="text-sm italic opacity-70 leading-relaxed">
                "{faction.tagline}"
              </p>

              <button
                onClick={(e) => { e.stopPropagation(); handleJoin(faction.id); }}
                className="mt-auto w-full py-3 rounded-xl font-bold text-sm transition-all duration-200"
                style={{
                  background: currentFaction === faction.id
                    ? faction.colors.primary
                    : `${faction.colors.primary}15`,
                  color: currentFaction === faction.id
                    ? faction.colors.secondary
                    : faction.colors.primary,
                  border: `1px solid ${faction.colors.primary}`,
                  boxShadow: currentFaction === faction.id ? `0 0 20px ${faction.colors.glow}` : "none",
                }}
              >
                {currentFaction === faction.id ? "✓ Your Faction" : "Join Faction"}
              </button>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {selectedPreview && (
            <motion.div
              key={selectedPreview}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="rounded-2xl p-8 border"
              style={{
                background: `linear-gradient(135deg, ${FACTIONS[selectedPreview].colors.primary}10, rgba(8,8,16,0.8))`,
                borderColor: `${FACTIONS[selectedPreview].colors.primary}30`,
              }}
            >
              <h3
                className="text-2xl font-black mb-6"
                style={{ color: FACTIONS[selectedPreview].colors.primary }}
              >
                What {FACTIONS[selectedPreview].name} thinks of everyone else
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FACTION_LIST.filter(f => f.id !== selectedPreview).map(rival => (
                  <div
                    key={rival.id}
                    className="rounded-xl p-4 border border-white/5"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ color: rival.colors.primary }}>{rival.badge}</span>
                      <span className="font-bold text-sm" style={{ color: rival.colors.primary }}>
                        On {rival.name}:
                      </span>
                    </div>
                    <p className="text-sm opacity-70 italic">
                      "{FACTIONS[selectedPreview].roasts[rival.id]}"
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-xs opacity-40 uppercase tracking-wider mb-3">Bragging rights</p>
                <div className="flex flex-col gap-2">
                  {FACTIONS[selectedPreview].bragLines.map((line, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span style={{ color: FACTIONS[selectedPreview].colors.primary }}>▸</span>
                      <span className="opacity-70">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
