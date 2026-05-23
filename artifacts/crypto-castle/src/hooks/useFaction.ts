import { useState, useEffect } from "react";
import type { FactionId } from "@/data/factions";

const STORAGE_KEY = "castle:faction";

export function useFaction() {
  const [faction, setFactionState] = useState<FactionId | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "btc" || stored === "xrp" || stored === "eth" || stored === "wild") {
        return stored;
      }
    } catch {}
    return null;
  });

  const setFaction = (id: FactionId) => {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
    setFactionState(id);
  };

  const clearFaction = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setFactionState(null);
  };

  return { faction, setFaction, clearFaction };
}
