import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "tsp:stomp_v1";

export interface StompRecord {
  date: string;
  mode: "quick" | "deep";
  intentsChecked: [boolean, boolean, boolean];
}

export interface StompState {
  streak: number;
  points: number;
  lastStomped: string | null;
  stompedToday: boolean;
  stompDate: string | null;
  stompMode: "quick" | "deep" | null;
  intents: [string, string, string];
  intentsChecked: [boolean, boolean, boolean];
  intentsDate: string | null;
  stompLog: StompRecord[];
  reflectShown: boolean;
  reflectDate: string | null;
}

interface StompContextValue {
  state: StompState;
  setIntents: (labels: [string, string, string]) => void;
  toggleIntent: (idx: 0 | 1 | 2) => void;
  quickStomp: () => void;
  completeStomp: (mode: "quick" | "deep") => void;
  markReflectShown: () => void;
  resetForTesting: () => void;
}

const DEFAULT_INTENTS: [string, string, string] = [
  "Zone 0: Mind",
  "Zone 1: Home",
  "Zone 2+: Land",
];

const DEFAULT_STATE: StompState = {
  streak: 0,
  points: 0,
  lastStomped: null,
  stompedToday: false,
  stompDate: null,
  stompMode: null,
  intents: DEFAULT_INTENTS,
  intentsChecked: [false, false, false],
  intentsDate: null,
  stompLog: [],
  reflectShown: false,
  reflectDate: null,
};

export const DEFAULT_INTENT_LABELS = DEFAULT_INTENTS;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function computeStreak(
  prev: StompState,
  today: string,
): number {
  if (prev.stompedToday) return prev.streak;
  return prev.lastStomped === yesterdayISO() ? prev.streak + 1 : 1;
}

function rehydrate(raw: Partial<StompState>): StompState {
  const today = todayISO();
  const base: StompState = { ...DEFAULT_STATE, ...raw };

  if ((raw.intentsDate ?? null) !== today) {
    base.intentsChecked = [false, false, false];
    base.intentsDate = null;
  }
  if ((raw.stompDate ?? null) !== today) {
    base.stompedToday = false;
    base.stompDate = null;
    base.stompMode = null;
  }
  if ((raw.reflectDate ?? null) !== today) {
    base.reflectShown = false;
    base.reflectDate = null;
  }

  base.stompLog = (raw.stompLog ?? []).slice(-30);
  return base;
}

const StompContext = createContext<StompContextValue | null>(null);

export function StompProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StompState>(DEFAULT_STATE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        setState(rehydrate(JSON.parse(raw)));
      } catch {}
    });
  }, []);

  const persist = useCallback((next: StompState) => {
    setState(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setIntents = useCallback(
    (labels: [string, string, string]) => {
      persist({ ...state, intents: labels });
    },
    [state, persist],
  );

  const toggleIntent = useCallback(
    (idx: 0 | 1 | 2) => {
      const today = todayISO();
      const checked = [...state.intentsChecked] as [boolean, boolean, boolean];
      checked[idx] = !checked[idx];
      const next: StompState = {
        ...state,
        intentsChecked: checked,
        intentsDate: today,
      };
      if (checked.every(Boolean) && !state.stompedToday) {
        const streak = computeStreak(state, today);
        const log: StompRecord = { date: today, mode: "deep", intentsChecked: checked };
        next.streak = streak;
        next.points = state.points + 25;
        next.lastStomped = today;
        next.stompedToday = true;
        next.stompDate = today;
        next.stompMode = "deep";
        next.stompLog = [...state.stompLog.slice(-29), log];
      }
      persist(next);
    },
    [state, persist],
  );

  const quickStomp = useCallback(() => {
    if (state.stompedToday) return;
    const today = todayISO();
    const streak = computeStreak(state, today);
    const log: StompRecord = {
      date: today,
      mode: "quick",
      intentsChecked: [true, true, true],
    };
    const next: StompState = {
      ...state,
      streak,
      points: state.points + 10,
      lastStomped: today,
      stompedToday: true,
      stompDate: today,
      stompMode: "quick",
      intentsChecked: [true, true, true],
      intentsDate: today,
      stompLog: [...state.stompLog.slice(-29), log],
    };
    persist(next);
  }, [state, persist]);

  const completeStomp = useCallback(
    (mode: "quick" | "deep") => {
      if (mode === "quick") { quickStomp(); return; }
    },
    [quickStomp],
  );

  const markReflectShown = useCallback(() => {
    persist({ ...state, reflectShown: true, reflectDate: todayISO() });
  }, [state, persist]);

  const resetForTesting = useCallback(() => {
    persist({ ...DEFAULT_STATE, intents: state.intents });
  }, [state, persist]);

  return (
    <StompContext.Provider
      value={{
        state,
        setIntents,
        toggleIntent,
        quickStomp,
        completeStomp,
        markReflectShown,
        resetForTesting,
      }}
    >
      {children}
    </StompContext.Provider>
  );
}

export function useStomp() {
  const ctx = useContext(StompContext);
  if (!ctx) throw new Error("useStomp must be used within StompProvider");
  return ctx;
}
