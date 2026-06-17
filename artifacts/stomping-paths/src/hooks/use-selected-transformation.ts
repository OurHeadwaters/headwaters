import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { createElement } from "react";

const STORAGE_KEY = "tsp_selected_transformation";

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStored(slug: string | null): void {
  try {
    if (slug === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, slug);
    }
  } catch {
    // ignore
  }
}

interface SelectedTransformationContextValue {
  selectedSlug: string | null;
  select: (slug: string) => void;
  clear: () => void;
}

const SelectedTransformationContext = createContext<SelectedTransformationContextValue | null>(null);

export function SelectedTransformationProvider({ children }: { children: ReactNode }) {
  const [selectedSlug, setSelectedSlugState] = useState<string | null>(readStored);

  const select = useCallback((slug: string) => {
    writeStored(slug);
    setSelectedSlugState(slug);
  }, []);

  const clear = useCallback(() => {
    writeStored(null);
    setSelectedSlugState(null);
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setSelectedSlugState(e.newValue);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return createElement(
    SelectedTransformationContext.Provider,
    { value: { selectedSlug, select, clear } },
    children,
  );
}

export function useSelectedTransformation(): SelectedTransformationContextValue {
  const ctx = useContext(SelectedTransformationContext);
  if (!ctx) {
    throw new Error("useSelectedTransformation must be used inside SelectedTransformationProvider");
  }
  return ctx;
}
