/**
 * Headwaters Learning Tracks — static registry.
 * Each track maps to a permaculture zone and defines a curated
 * tag/category filter that populates it from content_items.
 */
export type TrackDef = {
  slug: string;
  zoneSlug: string;
  zoneNumber: number;
  title: string;
  subtitle: string;
  description: string;
  whatYouWillKnow: string;
  tags: string[];
  categories: string[];
  color: string;
  order: "asc" | "desc";
  icon: string;
};

export const TRACKS: TrackDef[] = [
  {
    slug: "mind-and-money",
    zoneSlug: "zone-0",
    zoneNumber: 0,
    title: "Mind & Money",
    subtitle: "Zone 0 — The foundation before the gear",
    description:
      "Resilience starts with your philosophy and your finances, not your storage room. This track covers the ideas Jack built TSP on — modern survivalism as a framework for living well, financial independence, entrepreneurship, and personal liberty.",
    whatYouWillKnow:
      "A working framework for thinking about self-reliance as a lifestyle, not a hobby. A clearer picture of your financial vulnerabilities and what to do about them. The mental models Jack returns to again and again.",
    tags: [
      "lifestyle design",
      "lifestyle planning",
      "economics",
      "economy",
      "investing",
      "business",
      "entrepreneurship",
      "politics",
      "freedom",
      "liberty",
      "silver",
      "gold",
      "bitcoin",
      "debt",
      "money",
      "real estate",
      "libertarian",
    ],
    categories: ["Blogs"],
    color: "#B5853A",
    order: "asc",
    icon: "🧭",
  },
  {
    slug: "prepared-at-home",
    zoneSlug: "zone-1",
    zoneNumber: 1,
    title: "Prepared at Home",
    subtitle: "Zone 1 — Daily resilience, no bunker required",
    description:
      "Your home should be the most resilient place you regularly occupy. This track walks through the fundamentals: food and water you can actually live on, security that makes sense for real people, health sovereignty, and emergency planning without the fear-mongering.",
    whatYouWillKnow:
      "A working 90-day food-and-water plan. A home security posture that fits your life. Basic first aid and medical preparedness. Emergency plans that your whole family knows.",
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
      "first aid",
      "getting started",
      "survival planning",
      "community",
      "kids",
    ],
    categories: [],
    color: "#C4A05A",
    order: "asc",
    icon: "🏠",
  },
  {
    slug: "growing-your-own",
    zoneSlug: "zone-2",
    zoneNumber: 2,
    title: "Growing Your Own",
    subtitle: "Zone 2 — From seed to surplus",
    description:
      "The most radical thing you can do is grow food. This track moves from kitchen garden basics through permaculture design, soil biology, aquaponics, and kept animals — building toward a productive system that feeds your family and builds community.",
    whatYouWillKnow:
      "How to design a productive garden around your space and climate. Soil principles that make everything else work. At least one preserved-food skill. The basics of permaculture design applied to any size property.",
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
      "fermentation",
      "nutrition",
    ],
    categories: [],
    color: "#6B8F47",
    order: "asc",
    icon: "🌱",
  },
  {
    slug: "working-homestead",
    zoneSlug: "zone-3",
    zoneNumber: 3,
    title: "The Working Homestead",
    subtitle: "Zone 3 — Land as operating system",
    description:
      "A homestead is infrastructure. This track covers larger livestock, energy independence, water systems, and the skills that turn a plot of land into a functioning farm. Less about daily attention, more about building systems that run.",
    whatYouWillKnow:
      "How to size and install a basic solar system. Livestock basics for pigs, goats, or cattle. Water systems for rural land. How to think about a homestead as an integrated system of inputs and outputs.",
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
      "animal husbandry",
      "woodworking",
      "tools",
      "wood heat",
    ],
    categories: [],
    color: "#4A7A3A",
    order: "asc",
    icon: "🌾",
  },
  {
    slug: "wild-harvest",
    zoneSlug: "zone-4",
    zoneNumber: 4,
    title: "Wild Harvest",
    subtitle: "Zone 4 — The oldest supply chain",
    description:
      "Hunting, fishing, foraging, and bushcraft connect you to the land in a way nothing else does. This track covers the skills for operating confidently in the field — from your first deer to primitive fire-making to reading a wild landscape for food.",
    whatYouWillKnow:
      "How to hunt, process, and preserve wild game. Basic foraging principles for your region. Core bushcraft skills: fire, shelter, navigation. The mindset for operating in unfamiliar backcountry.",
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
    ],
    categories: [],
    color: "#2C5F2E",
    order: "asc",
    icon: "🏹",
  },
  {
    slug: "when-things-get-hard",
    zoneSlug: "zone-5",
    zoneNumber: 5,
    title: "When Things Get Hard",
    subtitle: "Zone 5 — Contingencies for the unmanageable",
    description:
      "Zone 5 is where civilization ends and your raw capability begins. This track doesn't dwell on fear — it covers the scenarios you hope to never need: grid-down living, bug-out planning, communications independence, and wilderness survival.",
    whatYouWillKnow:
      "A realistic bug-out plan for your household. Basic ham radio and off-grid communications. How to think about extended grid-down scenarios. The difference between paranoia and genuine contingency planning.",
    tags: [
      "bug out",
      "BOL",
      "economic collapse",
      "wilderness",
      "survival",
      "grid-down",
      "EMP",
      "ham radio",
      "communications",
      "pandemic",
    ],
    categories: [],
    color: "#1A3A1C",
    order: "asc",
    icon: "⚡",
  },
  {
    slug: "vessel-sovereignty",
    zoneSlug: "zone-0",
    zoneNumber: 0,
    title: "Vessel Sovereignty",
    subtitle: "Zone 0 — Reclaim your mind from the machine",
    description:
      "You are not a broken person waiting to be fixed by the next system update. You are a biological vessel running programs — some chosen, most inherited. This track applies the science of neuroplasticity, behavioral conditioning, and media literacy to the oldest sovereignty problem: who controls what runs in your head?",
    whatYouWillKnow:
      "A clear model for how behavioral conditioning works — and how to interrupt it. Practical tools for auditing your information diet and eliminating algorithmic manipulation. The difference between conspiracy thinking and pattern recognition. How to evaluate claims with a calibrated, evidence-based framework.",
    tags: [
      "mindset",
      "psychology",
      "neuroplasticity",
      "mindfulness",
      "meditation",
      "journaling",
      "mental health",
      "media literacy",
      "critical thinking",
      "digital privacy",
      "social media",
      "propaganda",
      "cognitive bias",
      "behavior",
      "habit",
      "self improvement",
      "freedom",
      "liberty",
      "sovereignty",
    ],
    categories: [],
    color: "#7B5EA7",
    order: "asc",
    icon: "🧠",
  },
  {
    slug: "escape-the-grindstone",
    zoneSlug: "zone-0",
    zoneNumber: 0,
    title: "Escape the Grindstone",
    subtitle: "Zone 0 — From squeezed to sovereign",
    description:
      "You know the drill. New job, new system. Consultant arrives, new software. Update drops, new training. Your brain was the raw material and the grindstone never stopped turning. This track follows the arc Jack has mapped for years: from dependent and exhausted inside someone else's machine, to owning your tools, your skills, and your calendar. No MBA required. No permission needed.",
    whatYouWillKnow:
      "A framework for deciding which technologies to master versus which to escape. Clarity on the career and lifestyle moves that reduce systemic dependence. The mental models for building skills that no update cycle can take away. A realistic plan for the transition — whether you're still in the grind or already out.",
    tags: [
      "technology",
      "career",
      "social media",
      "digital privacy",
      "online privacy",
      "systemic dependence",
      "automation",
      "future technology",
      "consulting",
      "internet",
      "lifestyle design",
      "lifestyle planning",
      "freedom",
      "liberty",
      "business",
      "entrepreneurship",
      "education",
    ],
    categories: ["Blogs"],
    color: "#5C3D2E",
    order: "asc",
    icon: "⚙️",
  },
];

export function trackBySlug(slug: string): TrackDef | undefined {
  return TRACKS.find((t) => t.slug === slug);
}
