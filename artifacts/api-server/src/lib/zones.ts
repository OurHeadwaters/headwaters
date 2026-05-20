export type ZoneDef = {
  number: number;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  philosophy: string;
  tags: string[];
  categories: string[];
  seriesSlugs: string[];
  color: string;
};

export const ZONES: ZoneDef[] = [
  {
    number: 0,
    slug: "zone-0",
    name: "The Self",
    subtitle: "Zone 0 — Sovereignty begins here",
    description:
      "Your mind, money, and philosophy. Jack has always insisted that true resilience starts with who you are and what you believe — not with gear. Zone 0 covers mindset, financial independence, economics, and personal liberty.",
    philosophy:
      "You can't defend what you haven't thought through. Zone 0 is the foundation everything else rests on.",
    tags: [
      "lifestyle design",
      "lifestyle planning",
      "economics",
      "economy",
      "investing",
      "business",
      "entrepreneurship",
      "politics",
      "education",
      "freedom",
      "liberty",
      "silver",
      "gold",
      "bitcoin",
      "cryptocurrency",
      "debt",
      "money",
      "federal reserve",
      "real estate",
      "anarchism",
      "lifestyle deisgn",
      "bitcoin breakout",
      "round table",
      "libertarian",
    ],
    categories: ["Blogs"],
    seriesSlugs: ["history", "tuesday-chats"],
    color: "#B5853A",
  },
  {
    number: 1,
    slug: "zone-1",
    name: "The Home",
    subtitle: "Zone 1 — Daily life, resilient by design",
    description:
      "Security, health, and daily resilience at home. Food storage you actually eat, water you can actually trust, skills you can use before the grid goes down. Zone 1 is the ring you protect first.",
    philosophy:
      "Preparedness that doesn't change your daily life isn't preparedness — it's theater. Zone 1 makes resilience normal.",
    tags: [
      "food storage",
      "cooking",
      "water",
      "basic preparedness",
      "emergency planning",
      "disaster planning",
      "home security",
      "self defense",
      "firearms",
      "guns",
      "first aid",
      "pandemic",
      "kids",
      "community",
      "getting started",
      "survival planning",
      "women of prepping",
    ],
    categories: [],
    seriesSlugs: [],
    color: "#C4A05A",
  },
  {
    number: 2,
    slug: "zone-2",
    name: "The Garden",
    subtitle: "Zone 2 — Growing food, building soil",
    description:
      "Permaculture, kitchen gardens, aquaponics, beekeeping, and everything that produces food close to the house. Jack's been teaching this since long before it was fashionable — this zone is the heart of his archive.",
    philosophy:
      "The most radical thing you can do is grow your own food. Zone 2 is where philosophy becomes dinner.",
    tags: [
      "permaculture",
      "gardening",
      "aquaponics",
      "beekeeping",
      "chickens",
      "composting",
      "herbal medicine",
      "herbs",
      "hydroponics",
      "food systems",
      "small livestock",
      "duck chronicles",
      "permaculture az",
      "garden az",
      "food az",
      "hydroponics az",
      "nutrition",
      "paleo az",
      "cooking az",
      "bbq az",
      "fermentation",
    ],
    categories: [],
    seriesSlugs: ["unloose-the-goose"],
    color: "#6B8F47",
  },
  {
    number: 3,
    slug: "zone-3",
    name: "The Homestead",
    subtitle: "Zone 3 — Working land, real systems",
    description:
      "Livestock, energy systems, water management, and the infrastructure of a working homestead. Less frequent attention, higher yields. This is where a plot of land becomes a functioning farm.",
    philosophy:
      "A homestead isn't a lifestyle choice — it's an operating system. Zone 3 is the machinery.",
    tags: [
      "homesteading",
      "livestock",
      "farming",
      "agriculture",
      "solar",
      "alternative energy",
      "energy",
      "off grid",
      "homestead",
      "homestead az",
      "homesteading az",
      "animal husbandry",
      "woodworking",
      "tools",
      "wood heat",
    ],
    categories: [],
    seriesSlugs: [],
    color: "#4A7A3A",
  },
  {
    number: 4,
    slug: "zone-4",
    name: "The Forest",
    subtitle: "Zone 4 — Wild harvest, managed wilderness",
    description:
      "Hunting, fishing, foraging, trapping, and bushcraft. The outer managed zone provides food and material while requiring you to be fully competent in the field. Skills, tools, and the patience to use them.",
    philosophy:
      "Wild harvest is the oldest supply chain in human history. Zone 4 keeps you connected to it.",
    tags: [
      "hunting",
      "fishing",
      "foraging",
      "bushcraft",
      "wildcrafting",
      "knives",
      "primitive skills",
      "wildlife",
      "outdoor gear",
      "fishing az",
      "outdoor gear az",
    ],
    categories: [],
    seriesSlugs: ["13-stomps"],
    color: "#2C5F2E",
  },
  {
    number: 5,
    slug: "zone-5",
    name: "The Wild",
    subtitle: "Zone 5 — Unmanaged, unpredictable, essential",
    description:
      "Bug-out scenarios, grid-down planning, wilderness survival, and the deep contingencies you hope you never need. Zone 5 is where civilization ends and your raw capability begins. Jack doesn't dwell here, but he never ignores it.",
    philosophy:
      "Zone 5 isn't about fear — it's about knowing your edge. The prepared person has already walked this ground in their mind.",
    tags: [
      "bug out",
      "BOL",
      "economic collapse",
      "the insurgency",
      "the insurection",
      "wilderness",
      "survival",
      "grid-down",
      "EMP",
      "pandemic",
      "ham radio",
      "communications",
    ],
    categories: [],
    seriesSlugs: [],
    color: "#1A3A1C",
  },
];

export function zoneBySlug(slug: string): ZoneDef | undefined {
  return ZONES.find((z) => z.slug === slug);
}

/** SQL-safe list of all tags for a zone (used in JSONB queries). */
export function zoneTags(zone: ZoneDef): string[] {
  return zone.tags;
}

/** Series slugs that indicate an episode belongs to a known series (for exclusion). */
export const ALL_SERIES_TAGS = ["unloose-the-goose"];

/** Title patterns used to exclude series episodes from standalone results. */
export const SERIES_TITLE_PATTERNS = [
  "unloose the goose",
  "13 stomps",
  "tuesday chat",
  "history with jack",
];
