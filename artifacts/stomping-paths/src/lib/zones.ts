export type ZoneMeta = {
  number: number;
  slug: string;
  name: string;
  color: string;
  tags: string[];
  categories: string[];
};

export const ZONES: ZoneMeta[] = [
  {
    number: 0,
    slug: "zone-0",
    name: "The Self",
    color: "#B5853A",
    tags: [
      "lifestyle design", "lifestyle planning", "economics", "economy",
      "investing", "business", "entrepreneurship", "politics", "education",
      "freedom", "liberty", "silver", "gold", "bitcoin", "cryptocurrency",
      "debt", "money", "federal reserve", "real estate", "anarchism",
      "lifestyle deisgn", "bitcoin breakout", "round table", "libertarian",
    ],
    categories: ["Blogs"],
  },
  {
    number: 1,
    slug: "zone-1",
    name: "The Home",
    color: "#C4A05A",
    tags: [
      "food storage", "cooking", "water", "basic preparedness",
      "emergency planning", "disaster planning", "home security",
      "self defense", "firearms", "guns", "first aid", "pandemic",
      "kids", "community", "getting started", "survival planning",
      "women of prepping",
    ],
    categories: [],
  },
  {
    number: 2,
    slug: "zone-2",
    name: "The Garden",
    color: "#6B8F47",
    tags: [
      "permaculture", "gardening", "aquaponics", "beekeeping", "chickens",
      "composting", "herbal medicine", "herbs", "hydroponics", "food systems",
      "small livestock", "duck chronicles", "permaculture az", "garden az",
      "food az", "hydroponics az", "nutrition", "paleo az", "cooking az",
      "bbq az", "fermentation",
    ],
    categories: [],
  },
  {
    number: 3,
    slug: "zone-3",
    name: "The Homestead",
    color: "#4A7A3A",
    tags: [
      "homesteading", "livestock", "farming", "agriculture", "solar",
      "alternative energy", "energy", "off grid", "homestead", "homestead az",
      "homesteading az", "animal husbandry", "woodworking", "tools", "wood heat",
    ],
    categories: [],
  },
  {
    number: 4,
    slug: "zone-4",
    name: "The Forest",
    color: "#2C5F2E",
    tags: [
      "hunting", "fishing", "foraging", "bushcraft", "wildcrafting",
      "knives", "primitive skills", "wildlife", "outdoor gear",
      "fishing az", "outdoor gear az",
    ],
    categories: [],
  },
  {
    number: 5,
    slug: "zone-5",
    name: "The Wild",
    color: "#1A3A1C",
    tags: [
      "bug out", "BOL", "economic collapse", "the insurgency", "the insurection",
      "wilderness", "survival", "grid-down", "EMP", "pandemic", "ham radio",
      "communications",
    ],
    categories: [],
  },
];

/**
 * Returns the zones that match any of the given episode tags or categories.
 */
export function matchZones(
  episodeTags: string[],
  episodeCategories: string[],
): ZoneMeta[] {
  const lowerTags = episodeTags.map((t) => t.toLowerCase());
  const lowerCats = episodeCategories.map((c) => c.toLowerCase());

  return ZONES.filter((zone) => {
    const zoneTags = zone.tags.map((t) => t.toLowerCase());
    const zoneCats = zone.categories.map((c) => c.toLowerCase());
    return (
      lowerTags.some((t) => zoneTags.includes(t)) ||
      lowerCats.some((c) => zoneCats.includes(c))
    );
  });
}
