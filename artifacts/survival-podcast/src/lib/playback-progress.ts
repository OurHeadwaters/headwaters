const PREFIX = "tsp:progress:";
const COMPLETED_PREFIX = "tsp:completed:";

export interface ProgressEntry {
  position: number;
  duration: number;
  savedAt: number;
}

export function markCompleted(slug: string): void {
  try {
    if (!slug) return;
    localStorage.setItem(COMPLETED_PREFIX + slug, "1");
  } catch {}
}

export function isCompleted(slug: string): boolean {
  try {
    return localStorage.getItem(COMPLETED_PREFIX + slug) === "1";
  } catch {
    return false;
  }
}

export function clearCompleted(slug: string): void {
  try {
    localStorage.removeItem(COMPLETED_PREFIX + slug);
  } catch {}
}

export function saveProgress(slug: string, position: number, duration: number): void {
  try {
    if (!slug || position <= 0) return;
    const entry: ProgressEntry = { position, duration, savedAt: Date.now() };
    localStorage.setItem(PREFIX + slug, JSON.stringify(entry));
  } catch {}
}

export function getProgress(slug: string): ProgressEntry | null {
  try {
    const raw = localStorage.getItem(PREFIX + slug);
    if (!raw) return null;
    return JSON.parse(raw) as ProgressEntry;
  } catch {
    return null;
  }
}

export function clearProgress(slug: string): void {
  try {
    localStorage.removeItem(PREFIX + slug);
  } catch {}
}

export function getMostRecentSlugAmong(slugs: string[]): string | null {
  let best: { slug: string; savedAt: number } | null = null;
  for (const slug of slugs) {
    if (isCompleted(slug)) continue;
    const entry = getProgress(slug);
    if (entry && entry.position > 0) {
      if (!best || entry.savedAt > best.savedAt) {
        best = { slug, savedAt: entry.savedAt };
      }
    }
  }
  return best ? best.slug : null;
}
