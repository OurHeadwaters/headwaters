/**
 * Wisdom extraction — heuristic sentence mining from episode show notes.
 *
 * No ML required. We score each sentence by the presence of principle-language
 * patterns (always/never, "the key", "remember", actionable imperatives, etc.)
 * and return the highest-scoring sentences as "gems of wisdom".
 */

const STOP_SENTENCES = [
  /^https?:\/\//i,
  /^www\./i,
  /^\s*\d+\s*$/,
  /episode\s+\d+/i,
  /subscribe|unsubscribe/i,
  /click here|read more|learn more/i,
  /copyright|all rights reserved/i,
  /\bpodcast\b.*\bepisode\b/i,
  /^(tags?|categories|show notes?|resources?):/i,
  /^\[.*\]$/,
];

const SCORE_BOOSTS: Array<[RegExp, number]> = [
  [/\balways\b/i, 3],
  [/\bnever\b/i, 3],
  [/\bthe key\b/i, 4],
  [/\bremember\b/i, 3],
  [/\bmost important\b/i, 4],
  [/\bprinciple\b/i, 4],
  [/\bfreedom\b/i, 2],
  [/\bself.?relian/i, 4],
  [/\bsurviv/i, 2],
  [/\bprepar/i, 2],
  [/\blearn(ed|ing)?\b/i, 2],
  [/\btruth\b/i, 3],
  [/\bwisdom\b/i, 4],
  [/\bsimple\b/i, 2],
  [/\breal(ity|ize|ly)?\b/i, 2],
  [/\bchange\b/i, 2],
  [/\bcommunity\b/i, 2],
  [/\bresponsib/i, 3],
  [/\bsecret\b/i, 3],
  [/\btrue\b/i, 2],
  [/\bif you\b/i, 1],
  [/\byou (must|should|need to|have to|can)\b/i, 2],
  [/\bdon't\b.*\bwhen\b/i, 2],
  [/\bone (thing|way|step)\b/i, 3],
  [/\bpowerful\b/i, 2],
  [/\bpractical\b/i, 2],
];

function scoreSentence(s: string): number {
  let score = 0;
  for (const [pattern, boost] of SCORE_BOOSTS) {
    if (pattern.test(s)) score += boost;
  }
  const wordCount = s.split(/\s+/).length;
  if (wordCount >= 8 && wordCount <= 30) score += 2;
  if (wordCount > 30 && wordCount <= 50) score += 1;
  return score;
}

export function extractGems(
  bodyText: string,
  maxGems = 5,
): string[] {
  if (!bodyText) return [];

  const raw = bodyText
    .replace(/\r\n/g, "\n")
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => {
      if (s.length < 40 || s.length > 300) return false;
      for (const pattern of STOP_SENTENCES) {
        if (pattern.test(s)) return false;
      }
      return true;
    });

  const scored = raw
    .map((s) => ({ text: s, score: scoreSentence(s) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const gems: string[] = [];
  for (const { text } of scored) {
    const norm = text.toLowerCase().slice(0, 60);
    if (seen.has(norm)) continue;
    seen.add(norm);
    gems.push(text);
    if (gems.length >= maxGems) break;
  }
  return gems;
}
