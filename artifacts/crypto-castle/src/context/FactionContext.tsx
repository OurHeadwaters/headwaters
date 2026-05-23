import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { FactionId } from "@/data/factions";

const STORAGE_KEY = "castle:faction";

function readStored(): FactionId | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "btc" || v === "xrp" || v === "eth" || v === "wild") return v;
  } catch {}
  return null;
}

interface FactionContextValue {
  faction: FactionId | null;
  setFaction: (id: FactionId) => void;
  clearFaction: () => void;
}

const FactionContext = createContext<FactionContextValue | null>(null);

export function FactionProvider({ children }: { children: ReactNode }) {
  const [faction, setFactionState] = useState<FactionId | null>(readStored);

  const setFaction = useCallback((id: FactionId) => {
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
    setFactionState(id);
  }, []);

  const clearFaction = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setFactionState(null);
  }, []);

  return (
    <FactionContext.Provider value={{ faction, setFaction, clearFaction }}>
      {children}
    </FactionContext.Provider>
  );
}

export function useFaction(): FactionContextValue {
  const ctx = useContext(FactionContext);
  if (!ctx) throw new Error("useFaction must be used inside FactionProvider");
  return ctx;
}
