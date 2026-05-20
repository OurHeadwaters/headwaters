/**
 * Codetry Transformation Paths — static registry.
 * Each transformation names a FROM state and a TO state that TSP content
 * covers on that journey, plus the tag/category filters that surface the
 * most relevant episodes from the archive.
 *
 * Extend this list without touching component code.
 */

export type TransformationDef = {
  slug: string;
  from: string;
  to: string;
  description: string;
  tags: string[];
  categories: string[];
  color: string;
  icon: string;
};

export const TRANSFORMATIONS: TransformationDef[] = [
  {
    slug: "conventional-to-regenerative",
    from: "Conventional",
    to: "Regenerative",
    description:
      "From commodity inputs and row-crop monocultures to closed-loop systems that build soil, produce surplus, and heal land. TSP covers the full arc — from first garden to whole-farm permaculture design.",
    tags: [
      "permaculture",
      "gardening",
      "composting",
      "soil science",
      "food systems",
      "regenerative",
      "agriculture",
      "farming",
      "edible landscaping",
      "cover crops",
    ],
    categories: ["permaculture", "gardening and horticulture"],
    color: "#4A7A3A",
    icon: "🌱",
  },
  {
    slug: "tradfi-to-hard-assets",
    from: "TradFi",
    to: "Hard Assets",
    description:
      "From paper wealth and 401(k) dependency to tangible stores of value — precious metals, productive land, paid-off property, and income streams you own outright. TSP covers the financial philosophy and the practical moves.",
    tags: [
      "investing",
      "silver",
      "gold",
      "bitcoin",
      "real estate",
      "money",
      "debt",
      "economics",
      "economy",
      "personal finance",
      "liberty",
      "freedom",
    ],
    categories: ["investing", "personal finance"],
    color: "#B5853A",
    icon: "⚖️",
  },
  {
    slug: "employee-to-owner",
    from: "Employee",
    to: "Owner",
    description:
      "From a single income source you don't control to multiple revenue streams you build and own. TSP covers everything from the mindset shift to the practical steps of building a business around your skills and values.",
    tags: [
      "entrepreneurship",
      "business",
      "lifestyle design",
      "lifestyle planning",
      "side hustle",
      "small business",
      "freedom",
    ],
    categories: [
      "small business and entrepreneurship",
      "small business",
      "entrepreneurship",
    ],
    color: "#C4622D",
    icon: "🔑",
  },
  {
    slug: "grid-to-off-grid",
    from: "Grid",
    to: "Off-Grid",
    description:
      "From complete dependency on municipal utilities to energy, water, and waste systems you own and operate. TSP covers solar sizing, water storage, off-grid heating, and the lifestyle decisions that make it real.",
    tags: [
      "solar",
      "alternative energy",
      "energy",
      "off grid",
      "off-grid",
      "water",
      "water storage",
      "wood heat",
      "homesteading",
      "ham radio",
      "communications",
    ],
    categories: [
      "off grid living",
      "solar energy",
      "peak oil and energy",
      "ham radio and communications",
    ],
    color: "#2C6E8A",
    icon: "⚡",
  },
  {
    slug: "outsourced-health-to-health-sovereign",
    from: "Outsourced Health",
    to: "Health Sovereign",
    description:
      "From delegating health decisions to the conventional system to building genuine understanding of your own body — nutrition, herbal medicine, functional medicine, and the skills to manage common conditions at home.",
    tags: [
      "natural health",
      "herbal medicine",
      "herbs",
      "nutrition",
      "fermentation",
      "foraging",
      "herbalism",
      "first aid",
      "functional medicine",
    ],
    categories: [
      "natural health",
      "herbs and medicinal plants",
      "aquaponics and aquaculture",
    ],
    color: "#7B5EA7",
    icon: "🌿",
  },
  {
    slug: "individual-to-community-scale",
    from: "Individual Resilience",
    to: "Community Scale",
    description:
      "From household preparedness to neighborhood and watershed resilience — the 'build' phase Codetry is designed for. TSP covers community food systems, communications networks, shared skills, and the human relationships that make self-reliance scale.",
    tags: [
      "community",
      "ham radio",
      "communications",
      "food systems",
      "intentional community",
      "preparedness",
      "emergency planning",
    ],
    categories: ["community", "ham radio and communications"],
    color: "#8A6A2C",
    icon: "🤝",
  },
];

export function transformationBySlug(
  slug: string,
): TransformationDef | undefined {
  return TRANSFORMATIONS.find((t) => t.slug === slug);
}
