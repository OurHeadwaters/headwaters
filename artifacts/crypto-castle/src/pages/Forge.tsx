import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MODULES, type LessonCard, type Module } from "@/data/courses";
import { FACTIONS } from "@/data/factions";
import { useFaction } from "@/context/FactionContext";
import { useProgress } from "@/hooks/useProgress";
import { FactionBadge } from "@/components/FactionBadge";

interface DynamicLesson {
  id: string;
  moduleId: string;
  moduleName: string;
  moduleDescription: string;
  moduleIcon: string;
  title: string;
  body: string;
}

function useDynamicModules(): Module[] {
  const [dynamic, setDynamic] = useState<Module[]>([]);

  useEffect(() => {
    fetch("/api/castle/dynamic-lessons")
      .then((r) => r.json())
      .then(({ lessons }: { lessons: DynamicLesson[] }) => {
        if (!lessons?.length) return;

        const moduleMap = new Map<string, Module>();
        for (const lesson of lessons) {
          if (!moduleMap.has(lesson.moduleId)) {
            moduleMap.set(lesson.moduleId, {
              id: lesson.moduleId,
              title: lesson.moduleName,
              description: lesson.moduleDescription,
              icon: lesson.moduleIcon,
              lessons: [],
            });
          }
          moduleMap.get(lesson.moduleId)!.lessons.push({
            id: lesson.id,
            title: lesson.title,
            body: lesson.body,
          } as LessonCard);
        }
        setDynamic(Array.from(moduleMap.values()));
      })
      .catch(() => {});
  }, []);

  return dynamic;
}

function ProgressBar({
  percent,
  color,
  accent,
  glow,
}: {
  percent: number;
  color: string;
  accent: string;
  glow: string;
}) {
  return (
    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${percent}%`,
          background: `linear-gradient(90deg, ${color}, ${accent})`,
          boxShadow: `0 0 8px ${glow}`,
        }}
      />
    </div>
  );
}

function LessonView({
  lesson,
  module: mod,
  total,
  index,
  faction,
  isComplete,
  onComplete,
  onNext,
  onPrev,
}: {
  lesson: LessonCard;
  module: Module;
  total: number;
  index: number;
  faction: ReturnType<typeof useFaction>["faction"];
  isComplete: boolean;
  onComplete: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const factionData = faction ? FACTIONS[faction] : null;
  const factionNote = faction && lesson.factionNote?.[faction];

  return (
    <motion.div
      key={lesson.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center justify-between text-sm opacity-40">
        <span>
          {mod.icon} {mod.title}
        </span>
        <span>
          {index + 1} / {total}
        </span>
      </div>

      <div
        className="rounded-2xl p-8 border card-lesson"
        style={{
          borderLeftColor: factionData?.colors.primary ?? "#e2e8f0",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <h2 className="text-2xl font-black mb-4" style={{ color: factionData?.colors.primary ?? "#e2e8f0" }}>
          {lesson.title}
        </h2>
        <p className="text-base leading-relaxed opacity-80 whitespace-pre-line">
          {lesson.body}
        </p>
      </div>

      {factionNote && factionData && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl p-4 border"
          style={{
            background: `${factionData.colors.primary}0a`,
            borderColor: `${factionData.colors.primary}30`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <FactionBadge factionId={faction!} size="sm" />
            <span className="text-xs opacity-50 uppercase tracking-wider">Faction Intel</span>
          </div>
          <p className="text-sm opacity-80 italic">{factionNote}</p>
        </motion.div>
      )}

      {!faction && lesson.factionNote && (
        <div className="rounded-xl p-4 border border-white/5 text-sm opacity-40 text-center"
          style={{ background: "rgba(255,255,255,0.02)" }}>
          Pick a faction on the home page for personalized intel on this card.
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onPrev}
          disabled={index === 0}
          className="px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-20 transition-all border border-white/10 hover:border-white/20"
        >
          ← Back
        </button>

        {!isComplete ? (
          <button
            onClick={onComplete}
            className="flex-1 max-w-xs py-3 rounded-xl font-black text-sm transition-all animate-pulse-glow"
            style={{
              background: factionData?.colors.primary ?? "#e2e8f0",
              color: factionData?.colors.secondary ?? "#080810",
              boxShadow: `0 0 20px ${factionData?.colors.glow ?? "rgba(255,255,255,0.2)"}`,
            }}
          >
            Got it ✓
          </button>
        ) : (
          <button
            onClick={onNext}
            className="flex-1 max-w-xs py-3 rounded-xl font-black text-sm transition-all"
            style={{
              background: `${factionData?.colors.primary ?? "#e2e8f0"}20`,
              color: factionData?.colors.primary ?? "#e2e8f0",
              border: `1px solid ${factionData?.colors.primary ?? "#e2e8f0"}`,
            }}
          >
            {index < total - 1 ? "Next →" : "Module Complete ✓"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function Forge() {
  const { faction } = useFaction();
  const {
    markComplete,
    isLessonComplete,
    getModuleProgress,
    getTotalProgress,
    resetProgress,
    restoreFromCode,
    sessionId,
  } = useProgress();
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [restoreInput, setRestoreInput] = useState("");
  const [copied, setCopied] = useState(false);
  const dynamicModules = useDynamicModules();

  const allModules = [...MODULES, ...dynamicModules];

  const factionData = faction ? FACTIONS[faction] : null;
  const totalProgress = getTotalProgress(allModules);

  const currentModule = allModules.find((m) => m.id === activeModule) ?? null;
  const currentLesson = currentModule?.lessons[lessonIndex] ?? null;

  const handleGotIt = () => {
    if (!currentLesson) return;
    markComplete(currentLesson.id);
  };

  const handleNext = () => {
    if (!currentModule) return;
    if (lessonIndex < currentModule.lessons.length - 1) {
      setLessonIndex(lessonIndex + 1);
    } else {
      setActiveModule(null);
      setLessonIndex(0);
    }
  };

  const handlePrev = () => {
    if (lessonIndex > 0) setLessonIndex(lessonIndex - 1);
  };

  const startModule = (moduleId: string) => {
    const mod = allModules.find((m) => m.id === moduleId);
    if (!mod) return;
    const firstIncomplete = mod.lessons.findIndex((l) => !isLessonComplete(l.id));
    setActiveModule(moduleId);
    setLessonIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
  };

  return (
    <div
      className={`min-h-screen ${faction ? `faction-${faction}` : ""}`}
      style={{
        background: factionData
          ? `radial-gradient(ellipse at 50% 0%, ${factionData.colors.primary}08 0%, #080810 50%)`
          : "#080810",
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-12">
        {!activeModule ? (
          <>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="text-5xl mb-4">🔨</div>
              <h1
                className="text-5xl font-black mb-3 glow-text"
                style={{ color: factionData?.colors.primary ?? "#e2e8f0" }}
              >
                Blacksmith's Forge
              </h1>
              <p className="text-base opacity-50 max-w-md mx-auto">
                The tribes fight. The blacksmith sharpens everyone's weapons.
                One lesson at a time. Same forge. Same fundamentals.
              </p>
              {faction && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <FactionBadge factionId={faction} size="sm" />
                  <span className="text-sm opacity-40">even maxis need to know this</span>
                </div>
              )}
            </motion.div>

            <div className="mb-6 rounded-2xl p-5 border border-white/5"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm opacity-50">Total forge progress</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold" style={{ color: factionData?.colors.primary }}>
                    {totalProgress.completed}/{totalProgress.total} lessons
                  </span>
                  {totalProgress.completed > 0 && (
                    <button
                      onClick={resetProgress}
                      className="text-xs opacity-30 hover:opacity-60 transition-opacity"
                    >
                      reset
                    </button>
                  )}
                  <button
                    onClick={() => setShowSyncPanel((v) => !v)}
                    className="text-xs opacity-30 hover:opacity-60 transition-opacity"
                    title="Sync progress across devices"
                  >
                    sync
                  </button>
                </div>
              </div>
              <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalProgress.percent}%`,
                    background: `linear-gradient(90deg, ${factionData?.colors.primary ?? "#e2e8f0"}, ${factionData?.colors.accent ?? "#94a3b8"})`,
                    boxShadow: `0 0 12px ${factionData?.colors.glow ?? "rgba(255,255,255,0.2)"}`,
                  }}
                />
              </div>

              <AnimatePresence>
                {showSyncPanel && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-3">
                      {sessionId && (
                        <div>
                          <p className="text-xs opacity-40 mb-1 uppercase tracking-wider">Your progress code</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs bg-white/5 rounded-lg px-3 py-2 font-mono truncate"
                              style={{ color: factionData?.colors.primary ?? "#e2e8f0" }}>
                              {sessionId}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(sessionId).catch(() => {});
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              }}
                              className="text-xs px-3 py-2 rounded-lg border border-white/10 hover:border-white/20 transition-all shrink-0"
                            >
                              {copied ? "✓" : "Copy"}
                            </button>
                          </div>
                          <p className="text-xs opacity-30 mt-1">Save this code to restore your progress on another device.</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs opacity-40 mb-1 uppercase tracking-wider">Restore from code</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={restoreInput}
                            onChange={(e) => setRestoreInput(e.target.value)}
                            placeholder="Paste your progress code…"
                            className="flex-1 text-xs bg-white/5 rounded-lg px-3 py-2 font-mono border border-white/10 focus:border-white/20 outline-none"
                          />
                          <button
                            onClick={async () => {
                              await restoreFromCode(restoreInput);
                              setRestoreInput("");
                              setShowSyncPanel(false);
                            }}
                            className="text-xs px-3 py-2 rounded-lg border border-white/10 hover:border-white/20 transition-all shrink-0"
                          >
                            Restore
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-4">
              {allModules.map((mod, i) => {
                const mp = getModuleProgress(mod.id, allModules);
                const isUnlocked = i === 0 || getModuleProgress(allModules[i - 1].id, allModules).percent === 100;
                const isComplete = mp.percent === 100;

                return (
                  <motion.div
                    key={mod.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-2xl p-6 border cursor-pointer transition-all"
                    onClick={() => isUnlocked && startModule(mod.id)}
                    style={{
                      background: isComplete
                        ? `${factionData?.colors.primary ?? "#e2e8f0"}08`
                        : "rgba(255,255,255,0.02)",
                      borderColor: isComplete
                        ? `${factionData?.colors.primary ?? "#e2e8f0"}40`
                        : "rgba(255,255,255,0.08)",
                      opacity: isUnlocked ? 1 : 0.4,
                      cursor: isUnlocked ? "pointer" : "not-allowed",
                      boxShadow: isComplete ? `0 0 20px ${factionData?.colors.glow ?? "rgba(255,255,255,0.1)"}` : "none",
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl mt-0.5">{mod.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3
                            className="font-black text-lg"
                            style={{ color: factionData?.colors.primary ?? "#e2e8f0" }}
                          >
                            {mod.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            {isComplete && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  background: factionData?.colors.primary ?? "#e2e8f0",
                                  color: factionData?.colors.secondary ?? "#080810",
                                }}>
                                ✓ Complete
                              </span>
                            )}
                            <span className="text-sm opacity-40">{mp.completed}/{mp.total}</span>
                          </div>
                        </div>
                        <p className="text-sm opacity-50 mb-3">{mod.description}</p>
                        <ProgressBar
                          percent={mp.percent}
                          color={factionData?.colors.primary ?? "#e2e8f0"}
                          accent={factionData?.colors.accent ?? "#94a3b8"}
                          glow={factionData?.colors.glow ?? "rgba(255,255,255,0.2)"}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        ) : (
          currentModule && currentLesson && (
            <div>
              <div className="flex items-center gap-4 mb-8">
                <button
                  onClick={() => { setActiveModule(null); setLessonIndex(0); }}
                  className="text-sm opacity-40 hover:opacity-70 transition-opacity flex items-center gap-1"
                >
                  ← All modules
                </button>
                <div className="flex-1">
                  <ProgressBar
                    percent={getModuleProgress(currentModule.id, allModules).percent}
                    color={factionData?.colors.primary ?? "#e2e8f0"}
                    accent={factionData?.colors.accent ?? "#94a3b8"}
                    glow={factionData?.colors.glow ?? "rgba(255,255,255,0.2)"}
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                <LessonView
                  key={`${currentModule.id}-${lessonIndex}`}
                  lesson={currentLesson}
                  module={currentModule}
                  total={currentModule.lessons.length}
                  index={lessonIndex}
                  faction={faction}
                  isComplete={isLessonComplete(currentLesson.id)}
                  onComplete={handleGotIt}
                  onNext={handleNext}
                  onPrev={handlePrev}
                />
              </AnimatePresence>

              <div className="mt-8 flex gap-2 flex-wrap justify-center">
                {currentModule.lessons.map((l, i) => (
                  <button
                    key={l.id}
                    onClick={() => setLessonIndex(i)}
                    className="w-7 h-7 rounded-full text-xs font-bold transition-all"
                    style={{
                      background: isLessonComplete(l.id)
                        ? factionData?.colors.primary ?? "#e2e8f0"
                        : i === lessonIndex
                        ? `${factionData?.colors.primary ?? "#e2e8f0"}30`
                        : "rgba(255,255,255,0.05)",
                      color: isLessonComplete(l.id)
                        ? factionData?.colors.secondary ?? "#080810"
                        : i === lessonIndex
                        ? factionData?.colors.primary ?? "#e2e8f0"
                        : "rgba(255,255,255,0.3)",
                      border: i === lessonIndex
                        ? `1px solid ${factionData?.colors.primary ?? "#e2e8f0"}`
                        : "1px solid transparent",
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
