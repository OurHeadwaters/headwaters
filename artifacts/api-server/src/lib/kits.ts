/**
 * Kit Registry — static definitions for all 7 Headwaters kits.
 * Each kit maps to a slug, name, tagline, description, and its content
 * bundle: transformation slugs, track slugs, gear category tags, and
 * any external resource URLs.
 *
 * This is the single source of truth all kit surfaces pull from.
 */

export type KitDef = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  transformationSlugs: string[];
  trackSlugs: string[];
  gearCategoryTags: string[];
  externalLinks: { label: string; url: string }[];
};

export const KITS: KitDef[] = [
  {
    slug: "family-kit",
    name: "Family Kit",
    tagline: "Daily resilience for the whole household",
    description:
      "Everything a family needs to become the most resilient household on the block. Covers home preparedness fundamentals — 90-day food and water, home security, emergency planning — and links to the privacy guide for families who want to go further.",
    transformationSlugs: [],
    trackSlugs: ["prepared-at-home"],
    gearCategoryTags: ["home", "water", "food-storage"],
    externalLinks: [
      { label: "Family Privacy Guide", url: "/privacy-guide/" },
    ],
  },
  {
    slug: "producer-kit",
    name: "Producer Kit",
    tagline: "From employee to owner — the sovereign income path",
    description:
      "For anyone building income streams they own outright. Pairs the Employee → Owner transformation with the Mind & Money track — the philosophical and practical foundation for leaving the grindstone behind.",
    transformationSlugs: ["employee-to-owner"],
    trackSlugs: ["mind-and-money"],
    gearCategoryTags: [],
    externalLinks: [],
  },
  {
    slug: "practitioner-kit",
    name: "Practitioner Kit",
    tagline: "Tools for practitioners working inside the movement",
    description:
      "Designed for coaches, educators, and practitioners who guide others through resilience transitions. Links to the Headwaters practitioner intake tool for onboarding clients and tracking their progress.",
    transformationSlugs: [],
    trackSlugs: [],
    gearCategoryTags: [],
    externalLinks: [
      { label: "Headwaters Practitioner App", url: "/headwaters/" },
    ],
  },
  {
    slug: "council-kit",
    name: "Council Kit",
    tagline: "Community-scale resilience through 4-phase engagement",
    description:
      "For communities, watershed groups, and regional councils building resilience at scale. Describes the 4-phase engagement model and connects to ourheadwaters.ca for community coordination.",
    transformationSlugs: [],
    trackSlugs: [],
    gearCategoryTags: [],
    externalLinks: [
      { label: "Our Headwaters", url: "https://ourheadwaters.ca" },
    ],
  },
  {
    slug: "care-kit",
    name: "Care Kit",
    tagline: "From delegated health to health sovereignty",
    description:
      "For those reclaiming their health from the conventional system. Maps to the Outsourced Health → Health Sovereign transformation — covering nutrition, herbal medicine, functional medicine, and the skills to manage common conditions at home.",
    transformationSlugs: ["outsourced-health-to-health-sovereign"],
    trackSlugs: [],
    gearCategoryTags: [],
    externalLinks: [],
  },
  {
    slug: "digital-kit",
    name: "Digital Kit",
    tagline: "Financial and digital sovereignty — the crypto side",
    description:
      "For those moving from TradFi into hard digital assets. Covers the crypto and digital privacy side of the TradFi → Hard Assets transformation, with gear recommendations for privacy and digital security.",
    transformationSlugs: ["tradfi-to-hard-assets"],
    trackSlugs: [],
    gearCategoryTags: ["privacy", "digital-security"],
    externalLinks: [],
  },
  {
    slug: "physical-kit",
    name: "Physical Kit",
    tagline: "Hard assets, energy independence, and contingency planning",
    description:
      "For those building tangible resilience in the physical world. Combines the hard-assets side of TradFi → Hard Assets with the Grid → Off-Grid transformation and the When Things Get Hard track. Covers energy, precious metals, and grid-down contingencies.",
    transformationSlugs: ["tradfi-to-hard-assets", "grid-to-off-grid"],
    trackSlugs: ["when-things-get-hard"],
    gearCategoryTags: ["energy", "hard-assets"],
    externalLinks: [],
  },
];

export function kitBySlug(slug: string): KitDef | undefined {
  return KITS.find((k) => k.slug === slug);
}
