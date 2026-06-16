import { useState, useEffect } from "react";

/**
 * Fetches share counts for multiple slugs of the same surface in a single request.
 * Returns a map of slug → count (only slugs with at least 1 share are present).
 */
export function useShareCounts(
  surface: "kit" | "track" | "transform",
  slugs: string[],
): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});

  const key = slugs.slice().sort().join(",");

  useEffect(() => {
    if (slugs.length === 0) return;
    const base = (import.meta as any).env?.BASE_URL?.replace(/\/$/, "") ?? "";
    const params = new URLSearchParams({
      surface,
      slugs: slugs.join(","),
    });
    fetch(`${base}/api/shares/bulk?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.counts === "object") {
          setCounts(data.counts as Record<string, number>);
        }
      })
      .catch(() => {});
  }, [surface, key]);

  return counts;
}
