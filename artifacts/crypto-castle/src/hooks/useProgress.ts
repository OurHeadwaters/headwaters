import { useState, useCallback, useEffect } from "react";
import { MODULES, type Module } from "@/data/courses";
import { getSessionId, restoreSession } from "@/lib/sessionId";

const STORAGE_KEY = "castle:progress";

export interface Progress {
  completedLessons: Record<string, boolean>;
}

function loadLocalProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { completedLessons: {} };
}

function saveLocalProgress(p: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {}
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(loadLocalProgress);
  const [synced, setSynced] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    getSessionId().then((id) => {
      setSessionId(id);
      return fetch(`/api/castle/progress/${encodeURIComponent(id)}`);
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { completedLessons: Record<string, boolean> } | null) => {
        if (!data) return;
        setProgress((prev) => {
          const merged: Progress = {
            completedLessons: { ...prev.completedLessons, ...data.completedLessons },
          };
          saveLocalProgress(merged);
          return merged;
        });
        setSynced(true);
      })
      .catch(() => setSynced(true));
  }, []);

  const markComplete = useCallback((lessonId: string) => {
    setProgress((prev) => {
      const next = {
        ...prev,
        completedLessons: { ...prev.completedLessons, [lessonId]: true },
      };
      saveLocalProgress(next);
      return next;
    });
    getSessionId().then((id) =>
      fetch(`/api/castle/progress/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, done: true }),
      })
    ).catch(() => {});
  }, []);

  const resetProgress = useCallback(() => {
    const fresh: Progress = { completedLessons: {} };
    saveLocalProgress(fresh);
    setProgress(fresh);
    getSessionId().then((id) =>
      fetch(`/api/castle/progress/${encodeURIComponent(id)}/reset`, {
        method: "POST",
      })
    ).catch(() => {});
  }, []);

  const restoreFromCode = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    restoreSession(trimmed);
    setSessionId(trimmed);
    const r = await fetch(`/api/castle/progress/${encodeURIComponent(trimmed)}`);
    if (!r.ok) return;
    const data = await r.json() as { completedLessons: Record<string, boolean> };
    const fresh: Progress = { completedLessons: data.completedLessons ?? {} };
    saveLocalProgress(fresh);
    setProgress(fresh);
  }, []);

  const getModuleProgress = useCallback(
    (moduleId: string, modules: Module[] = MODULES) => {
      const mod = modules.find((m) => m.id === moduleId);
      if (!mod) return { completed: 0, total: 0, percent: 0 };
      const total = mod.lessons.length;
      const completed = mod.lessons.filter(
        (l) => progress.completedLessons[l.id]
      ).length;
      return { completed, total, percent: total > 0 ? (completed / total) * 100 : 0 };
    },
    [progress]
  );

  const getTotalProgress = useCallback(
    (modules: Module[] = MODULES) => {
      const allLessons = modules.flatMap((m) => m.lessons);
      const total = allLessons.length;
      const completed = allLessons.filter((l) => progress.completedLessons[l.id]).length;
      return { completed, total, percent: total > 0 ? (completed / total) * 100 : 0 };
    },
    [progress]
  );

  const isLessonComplete = useCallback(
    (lessonId: string) => !!progress.completedLessons[lessonId],
    [progress]
  );

  return {
    progress,
    synced,
    sessionId,
    markComplete,
    resetProgress,
    restoreFromCode,
    getModuleProgress,
    getTotalProgress,
    isLessonComplete,
  };
}
