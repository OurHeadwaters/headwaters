/**
 * Auto-classifier for curated items (field notes).
 *
 * Given raw text, returns an array of tag slugs derived from the zone and
 * transformation taxonomies. Used immediately after each insert so every item
 * arrives pre-tagged without any manual curation step.
 */

import { ZONES } from "./zones";
import { TRANSFORMATIONS } from "./transformations";

/**
 * Match text against a keyword list (case-insensitive substring search).
 * Returns true if any keyword appears in the text.
 */
function matchesKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * Classify a piece of text and return an array of slug strings.
 * The slugs are a mix of zone-N slugs and transformation slugs.
 */
export function classifyText(text: string): string[] {
  const matched: string[] = [];

  for (const zone of ZONES) {
    if (matchesKeywords(text, zone.tags)) {
      if (!matched.includes(zone.slug)) matched.push(zone.slug);
    }
  }

  for (const t of TRANSFORMATIONS) {
    if (matchesKeywords(text, t.tags)) {
      if (!matched.includes(t.slug)) matched.push(t.slug);
    }
  }

  return matched;
}
