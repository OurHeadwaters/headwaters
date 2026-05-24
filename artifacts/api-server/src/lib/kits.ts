/**
 * Kit Registry — static definitions for all 8 Headwaters kits.
 * Each kit maps to a slug, name, tagline, description, and its content
 * bundle: transformation slugs, track slugs, gear category tags, and
 * any external resource URLs.
 *
 * Commerce fields:
 *   priceType   — "direct" kits go to Stripe checkout; "consultative" kits
 *                 show an inquiry form instead.
 *   priceCents  — one-time purchase price in USD cents (direct kits only).
 *   ctaLabel    — primary button label shown on the kit detail page.
 *   stripePriceId — set at runtime by ensureKitProducts(); populated from
 *                   the KIT_STRIPE_PRICE_IDS env var or auto-created.
 *
 * This is the single source of truth all kit surfaces pull from.
 *
 * NOTE: Prices below are defaults. Confirm final pricing with Bobbie before
 * going live — update priceCents here and re-run ensureKitProducts().
 */

export type KitUserManual = {
  what: string;
  first: string;
  next: string;
};

export type KitDef = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  transformationSlugs: string[];
  trackSlugs: string[];
  gearCategoryTags: string[];
  externalLinks: { label: string; url: string }[];
  priceType: "direct" | "consultative";
  priceCents?: number;
  ctaLabel: string;
  stripePriceId?: string;
  /** Zaprite-hosted payment page URL for Bitcoin / Lightning / XRP / RLUSD checkout */
  zapriteUrl?: string;
  userManual?: KitUserManual;
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
    priceType: "direct",
    priceCents: 9700,
    ctaLabel: "Get the Family Kit",
    userManual: {
      what: "Build 30-day food and water baseline this month. Then move to the 90-day pantry rotation and home security audit.",
      first: "Start the Prepared at Home track. The earliest episodes lay the foundation — start there before buying any gear.",
      next: "After you've completed the core preparedness episodes, check the gear shelf for Jack's reviewed supplies that match this kit.",
    },
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
    priceType: "direct",
    priceCents: 9700,
    ctaLabel: "Get the Producer Kit",
    userManual: {
      what: "Start the Mind & Money track — specifically the early episodes on financial philosophy and the debt payoff framework.",
      first: "Get your money working for you before you try to build income from scratch. The debt-reduction framework comes first.",
      next: "Once you have a debt-reduction plan in motion, move to the Employee → Owner transformation episodes. Identify one income stream you can build alongside your current work.",
    },
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
    priceType: "consultative",
    ctaLabel: "Apply for Practitioner Access",
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
    priceType: "consultative",
    ctaLabel: "Inquire About the Council Kit",
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
    priceType: "direct",
    priceCents: 9700,
    ctaLabel: "Get the Care Kit",
    userManual: {
      what: "Filter the Outsourced Health → Health Sovereign episodes by earliest publish date. The philosophical foundation matters most.",
      first: "Build one concrete home-health practice at a time. Most people start with food quality and sleep before adding herbalism or supplements.",
      next: "Master the basics before advanced skills. Return to this kit as your situation changes and your knowledge grows.",
    },
  },
  {
    slug: "budget-kit",
    name: "Budget Kit",
    tagline: "Envelope budgeting with crypto buckets — personal and business",
    description:
      "The operational money layer for sovereign households and small businesses. Covers envelope budgeting principles, splitting Grindstone and Online Engine income into buckets, allocating for overhead and admin, and holding reserves in hard assets. Links to the X-Buckets tool for non-custodial stablecoin envelope budgeting.",
    transformationSlugs: ["tradfi-to-hard-assets"],
    trackSlugs: ["mind-and-money"],
    gearCategoryTags: ["finance", "bitcoin", "hard-assets"],
    externalLinks: [
      { label: "X-Buckets — Envelope Budgeting", url: "https://x-buckets-vision.replit.app/" },
    ],
    priceType: "direct",
    priceCents: 9700,
    ctaLabel: "Get the Budget Kit",
    userManual: {
      what: "The envelope budgeting framework applies immediately to your current income. Start splitting your income into buckets this month.",
      first: "Listen to the Mind & Money track's early episodes on financial philosophy, then set up your first budget buckets.",
      next: "Once you have your budget structure, explore the X-Buckets tool for non-custodial stablecoin budgeting.",
    },
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
    priceType: "direct",
    priceCents: 9700,
    ctaLabel: "Get the Digital Kit",
    userManual: {
      what: "Start with the TradFi → Hard Assets transformation episodes. Understand the 'why' before touching a hardware wallet.",
      first: "Set up a hardware wallet with a small amount before you hold anything significant. The gear shelf has Jack's reviewed hardware wallets.",
      next: "Layer in the privacy tools after you've secured your digital assets. Digital security compounds over time.",
    },
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
    priceType: "direct",
    priceCents: 9700,
    ctaLabel: "Get the Physical Kit",
    userManual: {
      what: "Start the When Things Get Hard track. It's short and covers the high-probability scenarios most families should prepare for.",
      first: "Work through the Grid → Off-Grid transformation for energy independence concepts, then use the gear shelf to identify the right hardware.",
      next: "Physical resilience is built in layers — grid independence first, then energy production, then energy storage.",
    },
  },
];

export function kitBySlug(slug: string): KitDef | undefined {
  return KITS.find((k) => k.slug === slug);
}
