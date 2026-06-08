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

export const gordTips: Record<GordRouteKey, GordTip[]> = {
  home: [
    {
      heading: "Welcome to the Stomping Path!",
      body: "This is base camp. Everything worth knowing about self-reliance starts right here. Poke around — I'll keep a wing on you.",
    },
    {
      heading: "Good to see you back.",
      body: "The most useful place to start is wherever you left off. Check your tracks or pick a zone that's been nagging at you.",
    },
    {
      heading: "You're becoming a regular.",
      body: "Third visit and counting. That's how it works — small steps, consistent effort. The woods don't reward sprinters.",
    },
  ],
  tracks: [
    {
      heading: "Pick a track, any track.",
      body: "Each track is a curated learning path through the wilderness of episodes. Start one and stick to it. Birds don't build nests by hopping randomly.",
    },
    {
      heading: "Back for more trail time?",
      body: "A track in progress beats a dozen tracks started. Pick up where you left off and keep moving. Momentum is everything out here.",
    },
    {
      heading: "The trail rewards the consistent.",
      body: "You've been here a few times now. If you haven't finished a track yet, today's a good day to close one out.",
    },
  ],
  zones: [
    {
      heading: "Zones are your skill camps.",
      body: "Each zone covers a core area of self-reliance. Pick the one that makes you sweat a little — that's where the growth is.",
    },
    {
      heading: "Back at the skill camps.",
      body: "Tried a zone yet? Each one surfaces episodes around a specific skill — food, water, security, mindset. Drill down and you'll come out sharper.",
    },
    {
      heading: "You know your way around.",
      body: "If you've poked through a zone already, see what's adjacent. Skills have a way of stacking. I learned that the hard way with nest-building.",
    },
  ],
  transform: [
    {
      heading: "What kind of life are you building?",
      body: "Choose a transformation path and I'll help surface the episodes most useful for your situation. Even a bird knows which branch holds the most worms.",
    },
    {
      heading: "Your path, your pace.",
      body: "If you've already picked a transformation, try filtering the archive by it. You'll find episodes you didn't know existed.",
    },
    {
      heading: "Progress doesn't shout.",
      body: "Transformation is quiet work. The right episodes, listened to enough times, change how you think. That's the whole idea.",
    },
  ],
  episodes: [
    {
      heading: "The full archive awaits.",
      body: "Over a thousand episodes in here. Use the filters — don't just wing it. (Unlike me. I always wing it.)",
    },
    {
      heading: "Anything catch your eye last time?",
      body: "The search bar and filters are your best tools in here. Topic, zone, transformation — narrow it down and you'll find exactly what you need.",
    },
    {
      heading: "Still exploring the archive?",
      body: "Try sorting by most-listened or filtering by a zone you haven't touched yet. There are gems in every corner of this place.",
    },
  ],
  history: [
    {
      heading: "This Day in Preparedness History.",
      body: "History repeats itself, mostly because people don't pay attention the first time. Let's fix that. Scroll through and see what happened on days like today.",
    },
    {
      heading: "History's always adding new pages.",
      body: "Come back here on different days and you'll see different events. The calendar shapes what surfaces. Worth making it a habit.",
    },
    {
      heading: "Patterns emerge over time.",
      body: "The more of these you read, the more you notice how predictable crises are. That's actually good news if you're prepared.",
    },
  ],
  "stomping-grounds": [
    {
      heading: "Welcome to the Grounds.",
      body: "This is where the community lives. Share what you're working on, see what others are building. Good neighbors make better survivalists.",
    },
    {
      heading: "Community is a skill too.",
      body: "Knowing your neighbors — even virtual ones — is part of preparedness. Don't just lurk. Say something. The flock notices.",
    },
    {
      heading: "Back in the community.",
      body: "The people here have tried things, failed at things, and figured things out. That knowledge doesn't show up in any episode. Ask questions.",
    },
  ],
  "wisdom-dig": [
    {
      heading: "Buried treasure ahead.",
      body: "These are the gems — the most insightful moments pulled from years of episodes. Dig in. Even I found a few earthworms worth keeping.",
    },
    {
      heading: "Not everything glitters at first.",
      body: "Some of the best pieces here are the quiet ones. The insight that rewires how you think about something. Give them time.",
    },
    {
      heading: "The dig goes deeper than it looks.",
      body: "If you haven't gone past the first page, there are years of accumulated wisdom further in. Worth the scroll.",
    },
  ],
  "wishing-well": [
    {
      heading: "Drop a wish in the well.",
      body: "Got an idea for a topic or a guest? Toss it in. The team actually reads these. I've seen it happen.",
    },
    {
      heading: "The well never fills up.",
      body: "If something new has been on your mind since you last visited, drop it in. Ideas compound when more people share them.",
    },
    {
      heading: "Your idea might already be a topic.",
      body: "Before you add a wish, search the archive first — there's a decent chance Jack already covered it. If not, definitely toss it in.",
    },
  ],
  council: [
    {
      heading: "Meet the Creators Council.",
      body: "These are the subject-matter experts and contributors who help build this community. Smart flock. I'd fly with any of them.",
    },
    {
      heading: "Know who's behind what.",
      body: "Each council member brings a different angle. When you see their name on content, you'll know what lens to bring.",
    },
    {
      heading: "Expertise has context.",
      body: "The more you know about who's talking, the more you get out of what they say. These bios are worth reading carefully.",
    },
  ],
  series: [
    {
      heading: "Series: deeper dives, longer trails.",
      body: "When a topic needs more than one episode, it becomes a series. Pick one and go deep. Shallow water is for ducks.",
    },
    {
      heading: "A series is a commitment worth making.",
      body: "You don't dip in and out of a good series. You start at episode one and you finish. That's how the knowledge stacks.",
    },
    {
      heading: "Finished a series yet?",
      body: "If you've started one, go finish it before you start another. The payoff is at the end, not the beginning.",
    },
  ],
  library: [
    {
      heading: "The Resource Library.",
      body: "Books, guides, and tools vetted by people who actually use them. Not affiliate-link junk. Real kit. I checked every shelf.",
    },
    {
      heading: "Resources age differently.",
      body: "Check back here now and then — new items get added as the community vets them. A tool that wasn't here last month might be exactly what you need.",
    },
    {
      heading: "The shelf is only useful if you use it.",
      body: "If something from the library has been on your list, today's a good day to pull it off the shelf and actually dig in.",
    },
  ],
  start: [
    {
      heading: "New here? Perfect.",
      body: "This page was made for you. It'll point you at the best starting places so you don't wander in circles. Unlike me — I love circles.",
    },
    {
      heading: "Starting again is fine.",
      body: "Sometimes the best move is to revisit the beginning. If something here looked useful before, give it another look with fresh eyes.",
    },
    {
      heading: "Foundations bear weight.",
      body: "Every time you come back to the basics, you pick up something you missed. That's not a weakness — that's how learning actually works.",
    },
  ],
  about: [
    {
      heading: "The story behind the Stomping Path.",
      body: "Knowing why this place exists makes it easier to use. Jack started this to help people build real lives. That's still the mission.",
    },
    {
      heading: "Mission hasn't changed.",
      body: "The 'about' page is easy to skip, but it's worth coming back to. Context shapes how you use everything else here.",
    },
    {
      heading: "Still here after all this time.",
      body: "That's rare. Most projects drift. This one hasn't. Knowing that is worth something when you're deciding how much to invest in it.",
    },
  ],
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

const GORD_IDX_PREFIX = "tsp:gord-idx:";

function getGordVariantIndex(routeKey: GordRouteKey): number {
  try {
    const raw = localStorage.getItem(GORD_IDX_PREFIX + routeKey);
    const parsed = raw !== null ? parseInt(raw, 10) : 0;
    return isNaN(parsed) ? 0 : parsed;
  } catch {
    return 0;
  }
}

export function advanceGordVariant(routeKey: GordRouteKey): void {
  try {
    const next = getGordVariantIndex(routeKey) + 1;
    localStorage.setItem(GORD_IDX_PREFIX + routeKey, String(next));
  } catch {}
}

export function getCurrentGordTip(routeKey: GordRouteKey): GordTip | null {
  const idx = getGordVariantIndex(routeKey);
  const variants = gordTips[routeKey];
  return idx < variants.length ? variants[idx] : null;
}

export function hasSeenAllVariants(routeKey: GordRouteKey): boolean {
  return getGordVariantIndex(routeKey) >= gordTips[routeKey].length;
}
