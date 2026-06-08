export const TSP_PAGE_DESCRIPTIONS: Record<string, string> = {
  "/": "Home page — featured content, highlighted episodes, and the hero intro for The Stomping Path",
  "/tracks": "Tracks page — structured multi-episode learning paths through TSP's best content; listeners follow a curriculum",
  "/zones": "Zones page — browse episodes by permaculture zone (Zone 0–5+) and life-skills topic area",
  "/transform": "Transform page — guided transformation paths for real personal change (e.g. Food Freedom, Financial Independence, Skills & Community)",
  "/kits": "Kits page — bundled episodes, gear, and resources tied to each transformation path",
  "/series": "Series page — multi-episode deep dives on a single subject",
  "/library": "Library page — full episode archive with search and filter by source, zone, and transformation",
  "/stomping-grounds": "Stomping Grounds — community discussion hub with shared wisdom and listener conversations",
  "/wisdom-dig": "Wisdom Dig — community-sourced quotes and listener insights",
  "/wishing-well": "Wishing Well — listener wishes and community requests for future content",
  "/council": "Expert Council page — the subject-matter experts and creators behind The Stomping Path",
  "/about": "About page — the mission and origin story of The Stomping Path",
  "/headwaters": "The Headwaters — paid membership community with premium content and deeper resources",
  "/brigade": "Brigade page — Headwaters member dashboard with member-only content",
  "/map": "My Map — personal progress map showing tracks, zones, and transformations the user has engaged with",
};

export function getTspPageDescription(path: string): string {
  if (TSP_PAGE_DESCRIPTIONS[path]) return TSP_PAGE_DESCRIPTIONS[path];
  if (path.startsWith("/tracks/")) return "Track detail page — individual learning track with a curated episode list and listener progress";
  if (path.startsWith("/zones/")) return "Zone detail page — episodes and resources for a specific permaculture zone";
  if (path.startsWith("/transform/")) return "Transformation detail page — episodes and resources for a specific personal transformation path";
  if (path.startsWith("/library/")) return "Episode detail page in the Library — full episode info, chapters, and related content";
  if (path.startsWith("/admin/")) return "Admin page — site management tools for content, categories, and community data";
  return "The Stomping Path — a self-reliance and preparedness podcast community";
}

export function buildGordContextDescription(path: string, pageTitle: string | null): string {
  const base = getTspPageDescription(path);
  if (pageTitle) return `${base} Currently viewing: "${pageTitle}".`;
  return base;
}
