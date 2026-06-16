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
  /**
   * Direct access URL sent in the welcome email button.
   * When set, overrides the generic /kits/:slug/welcome fallback.
   * Populated from env vars for kits whose content lives outside this repo.
   */
  accessUrl?: string;
  /**
   * Additional keyword overrides for episode curation.
   * When set, these tags are used INSTEAD of (not in addition to) the
   * transformation/track tags to build the kit's curated episode list.
   * Use this when a kit needs distinct episode curation from its parent
   * transformation (e.g. two kits sharing a transformation but targeting
   * different topics).
   */
  contentKeywords?: string[];
};

export const KITS: KitDef[] = [
  {
    slug: "family-kit",
    name: "Family Kit",
    tagline: "Daily resilience for the whole household",
    description:
      "For families who want to build real resilience together. This kit weaves daily practices, privacy tools, preparedness, and relationship rhythms into one clear path. Includes the Family Privacy Guide, Hearth connections, and step-by-step sequences so you're not starting from scratch.",
    transformationSlugs: [],
    trackSlugs: ["prepared-at-home"],
    gearCategoryTags: ["home", "water", "food-storage"],
    externalLinks: [
      { label: "Family Privacy Guide", url: "/privacy-guide/" },
    ],
    priceType: "direct",
    priceCents: 9700,
    ctaLabel: "Get the Family Kit",
    zapriteUrl: "https://pay.zaprite.com/pl_SIz91erI6c?kit_slug=family-kit",
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
      "The path from employee to sovereign owner. This kit gives you the mindset, systems, and practical steps to build income that belongs to you — not to a boss or platform. Strong focus on mind-and-money transformation and local value creation.",
    transformationSlugs: ["employee-to-owner"],
    trackSlugs: ["mind-and-money"],
    gearCategoryTags: [],
    externalLinks: [],
    priceType: "direct",
    priceCents: 9700,
    ctaLabel: "Get the Producer Kit",
    zapriteUrl: "https://pay.zaprite.com/pl_SIz91erI6c?kit_slug=producer-kit",
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
      "Built for coaches, facilitators, permaculture designers, and movement builders. Contains the tools, frameworks, and professional systems you need to serve others while staying sovereign yourself.",
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
      "For communities ready to build real resilience at scale. A 4-phase engagement system for councils, co-ops, and leadership groups that want to move beyond talk into coordinated, self-reliant action.",
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
      "Move from outsourced health to true health sovereignty. Designed for individuals and families who want to take back responsibility for their well-being — food, movement, prevention, and natural tools — without shame or overwhelm.",
    transformationSlugs: ["outsourced-health-to-health-sovereign"],
    trackSlugs: [],
    gearCategoryTags: [],
    externalLinks: [],
    priceType: "direct",
    priceCents: 9700,
    ctaLabel: "Get the Care Kit",
    zapriteUrl: "https://pay.zaprite.com/pl_SIz91erI6c?kit_slug=care-kit",
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
      "Simple, powerful envelope budgeting that works with both fiat and crypto (XRP, RLUSD, Bitcoin). Perfect for personal finances or small business. Includes X-Buckets integration and clear systems that actually stick.",
    transformationSlugs: ["tradfi-to-hard-assets"],
    trackSlugs: ["mind-and-money"],
    gearCategoryTags: ["finance", "bitcoin", "hard-assets"],
    externalLinks: [
      { label: "X-Buckets — Envelope Budgeting", url: "https://x-buckets-vision.replit.app/" },
    ],
    priceType: "direct",
    priceCents: 9700,
    ctaLabel: "Get the Budget Kit",
    zapriteUrl: "https://pay.zaprite.com/pl_SIz91erI6c?kit_slug=budget-kit",
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
      "Your complete guide to financial and digital sovereignty. Privacy, self-custody, on-chain tools, secure communication, and the practical steps to reduce dependence on big tech and traditional banks.",
    transformationSlugs: ["tradfi-to-hard-assets"],
    trackSlugs: [],
    gearCategoryTags: ["privacy", "digital-security"],
    externalLinks: [],
    priceType: "direct",
    priceCents: 9700,
    ctaLabel: "Get the Digital Kit",
    zapriteUrl: "https://pay.zaprite.com/pl_SIz91erI6c?kit_slug=digital-kit",
    userManual: {
      what: "Start with the TradFi → Hard Assets transformation episodes. Understand the 'why' before touching a hardware wallet.",
      first: "Set up a hardware wallet with a small amount before you hold anything significant. The gear shelf has Jack's reviewed hardware wallets.",
      next: "Layer in the privacy tools after you've secured your digital assets. Digital security compounds over time.",
    },
  },
  {
    slug: "parrs-jars",
    name: "Parr's Jars — Food Preservation Course",
    tagline: "Ten sessions on canning, preserving, and stocking your pantry from the North",
    description:
      "Bobbie Parr's ten-session food preservation course from Dryden, Ontario. Canning, fermenting, and stocking a real northern pantry — taught from a kitchen that has been doing this since 2020. Practitioner-grade skills, no fluff.",
    transformationSlugs: [],
    trackSlugs: ["prepared-at-home"],
    gearCategoryTags: ["food-storage", "home"],
    externalLinks: [
      { label: "Parr's Jars", url: "https://parrsjars.ca" },
      { label: "807 Food Co-operative", url: "https://807foodcoop.ca" },
    ],
    priceType: "direct",
    priceCents: 9700,
    ctaLabel: "Get the Course",
    accessUrl: process.env.COURSE1_ACCESS_URL,
    userManual: {
      what: "Ten recorded sessions on food preservation from Bobbie Parr's kitchen in Dryden, Ontario. Canning, fermenting, and pantry stocking for real northern winters.",
      first: "Watch Session 1 before you buy anything. The philosophy of stocking a real pantry matters more than which lids you use.",
      next: "Work through the sessions in order. Each one builds on the last. By Session 5 you will have more preserved food than most families buy in a month.",
    },
  },
  {
    slug: "pregnancy-kit",
    name: "Expecting Different",
    tagline: "Natural birth prep and building a health-sovereign home before baby arrives",
    description:
      "For expecting parents who want to build a health-sovereign environment before their baby arrives. Covers natural birth preparation, what goes in your body during pregnancy, early infant decisions (cord blood, delayed clamping, first foods), herbalism safety in pregnancy, and the foundational steps to a resilient family health practice.",
    transformationSlugs: ["outsourced-health-to-health-sovereign"],
    trackSlugs: [],
    gearCategoryTags: ["herbalism", "pregnancy", "baby", "home"],
    externalLinks: [],
    priceType: "direct",
    priceCents: 9700,
    ctaLabel: "Get the Pregnancy Kit",
    zapriteUrl: "https://pay.zaprite.com/pl_SIz91erI6c?kit_slug=pregnancy-kit",
    contentKeywords: [
      "pregnancy",
      "birth",
      "prenatal",
      "midwife",
      "midwifery",
      "infant",
      "newborn",
      "cord blood",
      "breastfeeding",
      "natural birth",
      "herbalism",
      "herbal medicine",
      "nutrition",
      "natural health",
    ],
    userManual: {
      what: "Filter the health sovereignty episodes by earliest publish date — the philosophical foundation matters most before you dive into protocols.",
      first: "Start with Jack's foundational health episodes on food quality, the limits of conventional medicine, and what it means to take back ownership of your family's health.",
      next: "Layer in the specific pregnancy and infant decision content — herbalism safety, birth prep, cord blood, first foods. Each decision is easier once the philosophical frame is solid.",
    },
  },
  {
    slug: "baby-health-kit",
    name: "Raising Health-Sovereign Kids",
    tagline: "Infant nutrition, home herbalism, and breaking the pharmacy cycle for your family",
    description:
      "For new parents who want to raise kids outside the sick-care cycle. Covers real-food weaning and infant nutrition, home treatment of common childhood illnesses, fever and illness decision frameworks, herbalism for children, building a Zone 1 home for a growing family, and the first-decade health philosophy that sets your kids up for lifelong resilience.",
    transformationSlugs: ["outsourced-health-to-health-sovereign"],
    trackSlugs: [],
    gearCategoryTags: ["herbalism", "baby", "kids-health", "home"],
    externalLinks: [],
    priceType: "direct",
    priceCents: 9700,
    ctaLabel: "Get the Baby Health Kit",
    zapriteUrl: "https://pay.zaprite.com/pl_SIz91erI6c?kit_slug=baby-health-kit",
    contentKeywords: [
      "children",
      "child",
      "kids",
      "infant",
      "baby",
      "fever",
      "pediatric",
      "childhood",
      "toddler",
      "weaning",
      "herbalism",
      "herbal medicine",
      "natural health",
      "nutrition",
      "first aid",
    ],
    userManual: {
      what: "Start with Jack's foundational child health and real-food episodes before adding herbalism protocols or supplement frameworks.",
      first: "Begin with the earliest health sovereignty episodes and map them to your child's current age and situation. The framework applies at every stage.",
      next: "Build one home-health practice at a time — real food first, then basic herbalism, then illness decision frameworks. Mastery compounds. Add the gear shelf items as you need them.",
    },
  },
  {
    slug: "physical-kit",
    name: "Physical Kit",
    tagline: "Hard assets, energy independence, and contingency planning",
    description:
      "Hard assets, energy independence, and real preparedness. From off-grid systems to gear lists, contingency planning, and the Standby protocols that matter in Northern Ontario winters.",
    transformationSlugs: ["tradfi-to-hard-assets", "grid-to-off-grid"],
    trackSlugs: ["when-things-get-hard"],
    gearCategoryTags: ["energy", "hard-assets"],
    externalLinks: [],
    priceType: "direct",
    priceCents: 9700,
    ctaLabel: "Get the Physical Kit",
    zapriteUrl: "https://pay.zaprite.com/pl_SIz91erI6c?kit_slug=physical-kit",
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
