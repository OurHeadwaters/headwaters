/*
 * playback-progress — localStorage persistence for episode playback (web)
 *
 * Happy path:
 *   saveProgress(slug, pos, dur) → stored under "tsp:progress:<slug>"
 *   getProgress(slug) → parsed entry with position, duration, savedAt
 *   markCompleted(slug) → sets "tsp:completed:<slug>" = "1"
 *   isCompleted(slug) → returns true if key exists
 *   clearCompleted(slug) → removes completed key (for replay)
 *
 * Edge cases verified:
 *   - All functions wrapped in try/catch to handle localStorage quota exceeded
 *     or private-mode restrictions without crashing
 *   - saveProgress skips position <= 0 to avoid overwriting with stale data
 *   - getAllInProgress filters out position < 5 s (accidental taps) and >= 95 %
 *     (de-facto completed)
 *   - getMostRecentSlugAmong skips completed episodes
 *   - markCompleted is idempotent — calling twice has no ill effect
 *   - Completed threshold (95 %) matches NEAR_END_THRESHOLD in player-context
 */

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

export interface InProgressEntry {
  slug: string;
  entry: ProgressEntry;
  pct: number;
}

export function getAllInProgress(): InProgressEntry[] {
  try {
    const results: InProgressEntry[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(PREFIX)) continue;
      const slug = key.slice(PREFIX.length);
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const entry = JSON.parse(raw) as ProgressEntry;
        const pct = entry.duration > 0 ? entry.position / entry.duration : 0;
        if (entry.position > 5 && pct < 0.95) {
          results.push({ slug, entry, pct });
        }
      } catch {}
    }
    return results.sort((a, b) => b.entry.savedAt - a.entry.savedAt);
  } catch {
    return [];
  }
}
