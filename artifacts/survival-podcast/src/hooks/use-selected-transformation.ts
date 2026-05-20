import { useState, useCallback } from "react";

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

export function useSelectedTransformation() {
  const [selectedSlug, setSelectedSlugState] = useState<string | null>(readStored);

  const select = useCallback((slug: string) => {
    writeStored(slug);
    setSelectedSlugState(slug);
  }, []);

  const clear = useCallback(() => {
    writeStored(null);
    setSelectedSlugState(null);
  }, []);

  return { selectedSlug, select, clear };
}
