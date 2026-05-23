import { useState, useCallback } from "react";
import { MODULES, type Module } from "@/data/courses";

const STORAGE_KEY = "castle:progress";

export interface Progress {
  completedLessons: Record<string, boolean>;
}

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { completedLessons: {} };
}

function saveProgress(p: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {}
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(loadProgress);

  const markComplete = useCallback((lessonId: string) => {
    setProgress((prev) => {
      const next = {
        ...prev,
        completedLessons: { ...prev.completedLessons, [lessonId]: true },
      };
      saveProgress(next);
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    const fresh: Progress = { completedLessons: {} };
    saveProgress(fresh);
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

  return { progress, markComplete, resetProgress, getModuleProgress, getTotalProgress, isLessonComplete };
}
