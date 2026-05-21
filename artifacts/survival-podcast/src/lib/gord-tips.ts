export type GordRouteKey =
  | "home"
  | "tracks"
  | "zones"
  | "transform"
  | "episodes"
  | "history"
  | "stomping-grounds"
  | "wisdom-dig"
  | "wishing-well"
  | "council"
  | "series"
  | "library"
  | "start"
  | "about";

export interface GordTip {
  heading: string;
  body: string;
}

export const gordTips: Record<GordRouteKey, GordTip> = {
  home: {
    heading: "Welcome to the Stomping Path!",
    body: "This is base camp. Everything worth knowing about self-reliance starts right here. Poke around — I'll keep a wing on you.",
  },
  tracks: {
    heading: "Pick a track, any track.",
    body: "Each track is a curated learning path through the wilderness of episodes. Start one and stick to it. Birds don't build nests by hopping randomly.",
  },
  zones: {
    heading: "Zones are your skill camps.",
    body: "Each zone covers a core area of self-reliance. Pick the one that makes you sweat a little — that's where the growth is.",
  },
  transform: {
    heading: "What kind of life are you building?",
    body: "Choose a transformation path and I'll help surface the episodes most useful for your situation. Even a bird knows which branch holds the most worms.",
  },
  episodes: {
    heading: "The full archive awaits.",
    body: "Over a thousand episodes in here. Use the filters — don't just wing it. (Unlike me. I always wing it.)",
  },
  history: {
    heading: "This Day in Preparedness History.",
    body: "History repeats itself, mostly because people don't pay attention the first time. Let's fix that. Scroll through and see what happened on days like today.",
  },
  "stomping-grounds": {
    heading: "Welcome to the Grounds.",
    body: "This is where the community lives. Share what you're working on, see what others are building. Good neighbors make better survivalists.",
  },
  "wisdom-dig": {
    heading: "Buried treasure ahead.",
    body: "These are the gems — the most insightful moments pulled from years of episodes. Dig in. Even I found a few earthworms worth keeping.",
  },
  "wishing-well": {
    heading: "Drop a wish in the well.",
    body: "Got an idea for a topic or a guest? Toss it in. The team actually reads these. I've seen it happen.",
  },
  council: {
    heading: "Meet the Creators Council.",
    body: "These are the subject-matter experts and contributors who help build this community. Smart flock. I'd fly with any of them.",
  },
  series: {
    heading: "Series: deeper dives, longer trails.",
    body: "When a topic needs more than one episode, it becomes a series. Pick one and go deep. Shallow water is for ducks.",
  },
  library: {
    heading: "The Resource Library.",
    body: "Books, guides, and tools vetted by people who actually use them. Not affiliate-link junk. Real kit. I checked every shelf.",
  },
  start: {
    heading: "New here? Perfect.",
    body: "This page was made for you. It'll point you at the best starting places so you don't wander in circles. Unlike me — I love circles.",
  },
  about: {
    heading: "The story behind the Stomping Path.",
    body: "Knowing why this place exists makes it easier to use. Jack started this to help people build real lives. That's still the mission.",
  },
};

export function routeKeyFromPath(path: string): GordRouteKey | null {
  if (path === "/" || path === "") return "home";
  if (path.startsWith("/tracks")) return "tracks";
  if (path.startsWith("/zones")) return "zones";
  if (path.startsWith("/transform")) return "transform";
  if (path.startsWith("/episodes")) return "episodes";
  if (path.startsWith("/history")) return "history";
  if (path.startsWith("/stomping-grounds")) return "stomping-grounds";
  if (path.startsWith("/wisdom-dig")) return "wisdom-dig";
  if (path.startsWith("/wishing-well")) return "wishing-well";
  if (path.startsWith("/council")) return "council";
  if (path.startsWith("/series")) return "series";
  if (path.startsWith("/library")) return "library";
  if (path.startsWith("/start")) return "start";
  if (path.startsWith("/about")) return "about";
  return null;
}

const GORD_SEEN_PREFIX = "tsp:gord-seen:";

export function hasSeenGord(routeKey: GordRouteKey): boolean {
  try {
    return localStorage.getItem(GORD_SEEN_PREFIX + routeKey) === "1";
  } catch {
    return false;
  }
}

export function markGordSeen(routeKey: GordRouteKey): void {
  try {
    localStorage.setItem(GORD_SEEN_PREFIX + routeKey, "1");
  } catch {}
}
