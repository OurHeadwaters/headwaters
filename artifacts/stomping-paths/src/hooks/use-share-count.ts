import { useState, useEffect, useCallback } from "react";

export function useShareCount(
  surface: "kit" | "track" | "transform",
  slug: string
): [number | null, () => void] {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    const base = (import.meta as any).env?.BASE_URL?.replace(/\/$/, "") ?? "";
    fetch(`${base}/api/shares?surface=${encodeURIComponent(surface)}&slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.count === "number") setCount(data.count);
      })
      .catch(() => {});
  }, [surface, slug]);

  const increment = useCallback(() => {
    setCount((prev) => (prev === null ? 1 : prev + 1));
  }, []);

  return [count, increment];
}
