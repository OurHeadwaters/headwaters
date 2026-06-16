/**
 * Creator Registry — trusted content creators paired with transformation paths and kits.
 *
 * Creators represent the free, self-directed route to resilience.
 * Kits are the easy-button acceleration of the same transformation.
 * This registry draws from the Expert Council, the Fireside Freedom community,
 * and the broader TSP ecosystem. It is the data backbone all frontend creator/kit
 * placements draw from.
 *
 * Source of truth for "who belongs here": HANDOFF.md → Expert Council section.
 * Three creators were explicitly noted as "not yet seeded" there — they are here now:
 * Nicole Sauce, Doc Bones & Nurse Amy, Michael Pugliano.
 */

export type CuratedLink = {
  title: string;
  url: string;
  type: "podcast" | "video" | "article" | "book";
};

export type Creator = {
  slug: string;
  name: string;
  bio: string;
  avatarUrl: string;
  websiteUrl: string;
  podcastUrl?: string;
  status: "live" | "coming-soon";
  transformationSlugs: string[];
  kitSlugs: string[];
  curatedLinks: CuratedLink[];
};

export const CREATORS: Creator[] = [
  /* ─── Core TSP / Headwaters principals ─── */

  {
    slug: "jack-spirko",
    name: "Jack Spirko",
    bio: "Host of The Survival Podcast since 2008. Jack has produced 3,800+ episodes covering permaculture, preparedness, personal finance, entrepreneurship, and individual sovereignty — the full spectrum of self-reliant living. His archive is the backbone of every transformation path on this platform.",
    avatarUrl: "",
    websiteUrl: "https://www.thesurvivalpodcast.com",
    podcastUrl: "https://www.thesurvivalpodcast.com/feed/mp3",
    status: "live",
    transformationSlugs: [
      "employee-to-owner",
      "outsourced-health-to-health-sovereign",
      "tradfi-to-hard-assets",
      "grid-to-off-grid",
    ],
    kitSlugs: [
      "family-kit",
      "producer-kit",
      "care-kit",
      "budget-kit",
      "digital-kit",
      "physical-kit",
    ],
    curatedLinks: [
      {
        title: "TSP Episode 3000 — The Big Picture",
        url: "https://www.thesurvivalpodcast.com/episode-3000",
        type: "podcast",
      },
      {
        title: "The 13 Things That Make A Permaculture Design",
        url: "https://www.thesurvivalpodcast.com/13-things-permaculture-design",
        type: "podcast",
      },
      {
        title: "Modern Survival Philosophy",
        url: "https://www.thesurvivalpodcast.com/modern-survival-philosophy",
        type: "article",
      },
    ],
  },

  {
    slug: "bobbie-parr",
    name: "Bobbie Parr",
    bio: "Northern Ontario homesteader, food preservationist, and co-founder of the 807 Food Co-operative in Dryden. Bobbie has been canning, fermenting, and stocking a real northern pantry since 2020. Her Parr's Jars course is the definitive guide to food preservation for Canadian winters.",
    avatarUrl: "",
    websiteUrl: "https://parrsjars.ca",
    status: "live",
    transformationSlugs: [],
    kitSlugs: ["family-kit", "parrs-jars", "care-kit"],
    curatedLinks: [
      {
        title: "Parr's Jars — Food Preservation Course",
        url: "https://parrsjars.ca",
        type: "video",
      },
      {
        title: "807 Food Co-operative",
        url: "https://807foodcoop.ca",
        type: "article",
      },
      {
        title: "Northern Pantry Basics",
        url: "https://parrsjars.ca/northern-pantry",
        type: "article",
      },
    ],
  },

  /* ─── Expert Council — Energy & Physical ─── */

  {
    slug: "steven-harris",
    name: "Steven Harris",
    bio: "Energy expert, engineer, and the most frequent guest in TSP history. Steven specializes in practical off-grid energy systems — solar, battery banks, backup power, and fuel storage. His no-nonsense approach cuts through the noise to tell you exactly what works in a real emergency.",
    avatarUrl: "",
    websiteUrl: "https://www.1234energy.com",
    podcastUrl: "https://www.1234energy.com/podcasts",
    status: "live",
    transformationSlugs: ["grid-to-off-grid"],
    kitSlugs: ["physical-kit"],
    curatedLinks: [
      {
        title: "1234 Energy — Practical Off-Grid Power",
        url: "https://www.1234energy.com",
        type: "article",
      },
      {
        title: "TSP: Steven Harris on Solar Power for Everyone",
        url: "https://www.thesurvivalpodcast.com/steven-harris-solar",
        type: "podcast",
      },
      {
        title: "TSP: Emergency Fuel Storage with Steven Harris",
        url: "https://www.thesurvivalpodcast.com/emergency-fuel-steven-harris",
        type: "podcast",
      },
    ],
  },

  {
    slug: "john-lovell",
    name: "John Lovell",
    bio: "Founder of Warrior Poet Society and former Army Ranger. John teaches practical self-defense, firearms fundamentals, and the warrior mindset — all grounded in the belief that free people have a moral obligation to be capable of protecting themselves and those they love.",
    avatarUrl: "",
    websiteUrl: "https://www.warriorpoetsociety.us",
    status: "live",
    transformationSlugs: ["grid-to-off-grid"],
    kitSlugs: ["physical-kit"],
    curatedLinks: [
      {
        title: "Warrior Poet Society — YouTube Channel",
        url: "https://www.youtube.com/c/WarriorPoetSociety",
        type: "video",
      },
      {
        title: "The Warrior Poet Way (Book)",
        url: "https://www.warriorpoetsociety.us/warrior-poet-way",
        type: "book",
      },
      {
        title: "Warrior Poet Society Podcast",
        url: "https://www.warriorpoetsociety.us/podcast",
        type: "podcast",
      },
    ],
  },

  /* ─── Expert Council — Food & Homesteading ─── */

  {
    slug: "joel-salatin",
    name: "Joel Salatin",
    bio: "The 'most famous farmer in America' runs Polyface Farm in Virginia's Shenandoah Valley. Joel champions relationship-based farming, food sovereignty, and the radical act of producing your own food. His books and lectures have shaped the modern local-food and regenerative farming movements.",
    avatarUrl: "",
    websiteUrl: "https://www.polyfacefarms.com",
    status: "live",
    transformationSlugs: ["employee-to-owner"],
    kitSlugs: ["producer-kit", "family-kit"],
    curatedLinks: [
      {
        title: "Folks, This Ain't Normal (Book)",
        url: "https://www.polyfacefarms.com/books",
        type: "book",
      },
      {
        title: "Everything I Want to Do Is Illegal (Book)",
        url: "https://www.polyfacefarms.com/books",
        type: "book",
      },
      {
        title: "TSP: Joel Salatin on Producing Your Way to Sovereignty",
        url: "https://www.thesurvivalpodcast.com/joel-salatin-sovereignty",
        type: "podcast",
      },
    ],
  },

  {
    slug: "marjory-wildcraft",
    name: "Marjory Wildcraft",
    bio: "Founder of The Grow Network, Marjory teaches growing and preparing food for health and resilience. She has spent decades developing proven systems for home food production — from small apartment gardens to full homestead setups. Her courses bridge food growing and natural health in a way that few others do.",
    avatarUrl: "",
    websiteUrl: "https://thegrownetwork.com",
    podcastUrl: "https://thegrownetwork.com/podcast",
    status: "live",
    transformationSlugs: ["outsourced-health-to-health-sovereign"],
    kitSlugs: ["family-kit", "care-kit"],
    curatedLinks: [
      {
        title: "The Grow Network — Home Food Production",
        url: "https://thegrownetwork.com",
        type: "article",
      },
      {
        title: "Grow Your Own Groceries (Video Course)",
        url: "https://thegrownetwork.com/grow-your-own-groceries",
        type: "video",
      },
      {
        title: "TSP: Marjory Wildcraft on Home Food Production",
        url: "https://www.thesurvivalpodcast.com/marjory-wildcraft",
        type: "podcast",
      },
    ],
  },

  {
    slug: "paul-wheaton",
    name: "Paul Wheaton",
    bio: "Founder of Permies.com — the largest online permaculture community in the world — and operator of the Wheaton Labs homestead in Montana. Paul has spent decades teaching permaculture design, natural building, and the systems thinking that makes a working homestead actually work.",
    avatarUrl: "",
    websiteUrl: "https://www.permies.com",
    podcastUrl: "https://www.permies.com/wiki/podcast",
    status: "live",
    transformationSlugs: ["employee-to-owner"],
    kitSlugs: ["producer-kit", "council-kit", "family-kit"],
    curatedLinks: [
      {
        title: "Permies.com — The World's Largest Permaculture Community",
        url: "https://www.permies.com",
        type: "article",
      },
      {
        title: "Building a Better World in Your Backyard (Book)",
        url: "https://www.permies.com/wiki/book",
        type: "book",
      },
      {
        title: "Wheaton Labs — Real Homestead Life",
        url: "https://www.wheatonlabs.com",
        type: "video",
      },
    ],
  },

  {
    slug: "ben-falk",
    name: "Ben Falk",
    bio: "Designer, author of The Resilient Farm and Homestead, and operator of Whole Systems Design in Vermont. Ben integrates permaculture at the property scale — food forests, water systems, and multi-layered production landscapes that produce abundance from degraded land.",
    avatarUrl: "",
    websiteUrl: "https://www.wholesystemsdesign.com",
    status: "live",
    transformationSlugs: ["employee-to-owner"],
    kitSlugs: ["producer-kit", "family-kit"],
    curatedLinks: [
      {
        title: "The Resilient Farm and Homestead (Book)",
        url: "https://www.wholesystemsdesign.com/book",
        type: "book",
      },
      {
        title: "Whole Systems Design — Property Design Services",
        url: "https://www.wholesystemsdesign.com",
        type: "article",
      },
      {
        title: "TSP: Ben Falk on Designing a Resilient Property",
        url: "https://www.thesurvivalpodcast.com/ben-falk",
        type: "podcast",
      },
    ],
  },

  /* ─── Expert Council — Health ─── */

  {
    slug: "dr-ken-berry",
    name: "Dr. Ken Berry, MD",
    bio: "Physician, author of Lies My Doctor Told Me, and one of the clearest voices on metabolic self-reliance. Dr. Berry teaches how to reclaim your health through ancestral eating — carnivore, keto, and the nutritional principles that conventional medicine has ignored for decades. A recurring TSP guest.",
    avatarUrl: "",
    websiteUrl: "https://www.drberry.com",
    podcastUrl: "https://www.drberry.com/podcast",
    status: "live",
    transformationSlugs: ["outsourced-health-to-health-sovereign"],
    kitSlugs: ["care-kit", "practitioner-kit"],
    curatedLinks: [
      {
        title: "Lies My Doctor Told Me (Book)",
        url: "https://www.drberry.com/lies-my-doctor-told-me",
        type: "book",
      },
      {
        title: "Dr. Ken Berry — YouTube Channel",
        url: "https://www.youtube.com/c/KenDBerryMD",
        type: "video",
      },
      {
        title: "TSP: Dr. Ken Berry on Metabolic Health",
        url: "https://www.thesurvivalpodcast.com/dr-ken-berry",
        type: "podcast",
      },
    ],
  },

  {
    slug: "doc-bones-nurse-amy",
    name: "Doc Bones & Nurse Amy",
    bio: "Dr. Joe Alton (Doc Bones) and Amy Alton (Nurse Amy) wrote The Survival Medicine Handbook — the definitive guide to off-grid healthcare. They have been teaching wilderness medicine, emergency care, and when-doctors-aren't-available health skills to the preparedness community for over a decade.",
    avatarUrl: "",
    websiteUrl: "https://www.doomandbloom.net",
    podcastUrl: "https://www.doomandbloom.net/podcast",
    status: "live",
    transformationSlugs: ["outsourced-health-to-health-sovereign"],
    kitSlugs: ["care-kit", "physical-kit"],
    curatedLinks: [
      {
        title: "The Survival Medicine Handbook (Book)",
        url: "https://www.doomandbloom.net/book",
        type: "book",
      },
      {
        title: "Doom and Bloom — Survival Medicine",
        url: "https://www.doomandbloom.net",
        type: "article",
      },
      {
        title: "TSP: Doc Bones & Nurse Amy on Off-Grid Medicine",
        url: "https://www.thesurvivalpodcast.com/doc-bones-nurse-amy",
        type: "podcast",
      },
    ],
  },

  /* ─── Expert Council — Finance ─── */

  {
    slug: "dave-ramsey",
    name: "Dave Ramsey",
    bio: "Creator of the 7 Baby Steps and host of The Ramsey Show — the proven, step-by-step path to getting out of debt and building financial peace. Dave's zero-based budgeting and debt snowball methods have helped millions stop living paycheck to paycheck. His envelope-budgeting foundation underpins the Budget Kit.",
    avatarUrl: "",
    websiteUrl: "https://www.ramseysolutions.com",
    podcastUrl: "https://www.ramseysolutions.com/ramseyshow",
    status: "live",
    transformationSlugs: ["tradfi-to-hard-assets"],
    kitSlugs: ["budget-kit", "producer-kit"],
    curatedLinks: [
      {
        title: "The Total Money Makeover (Book)",
        url: "https://www.ramseysolutions.com/store/books/the-total-money-makeover",
        type: "book",
      },
      {
        title: "The Ramsey Show Podcast",
        url: "https://www.ramseysolutions.com/ramseyshow",
        type: "podcast",
      },
      {
        title: "Baby Steps — The Proven Debt Payoff Plan",
        url: "https://www.ramseysolutions.com/dave-ramsey-7-baby-steps",
        type: "article",
      },
    ],
  },

  {
    slug: "ron-paul",
    name: "Ron Paul",
    bio: "Former US Congressman, physician, and the father of the modern liberty movement. Ron has spent decades educating Americans on sound money, Austrian economics, civil liberties, and peaceful non-intervention. His Campaign for Liberty and the Liberty Report are essential for anyone on the financial sovereignty path.",
    avatarUrl: "",
    websiteUrl: "https://www.ronpaulinstitute.org",
    podcastUrl: "https://www.ronpaullibertyreport.com",
    status: "live",
    transformationSlugs: ["tradfi-to-hard-assets"],
    kitSlugs: ["budget-kit", "digital-kit"],
    curatedLinks: [
      {
        title: "The Liberty Report",
        url: "https://www.ronpaullibertyreport.com",
        type: "podcast",
      },
      {
        title: "End the Fed (Book)",
        url: "https://www.ronpaulinstitute.org/end-the-fed",
        type: "book",
      },
      {
        title: "The Case for Gold (Book)",
        url: "https://mises.org/library/case-gold",
        type: "book",
      },
    ],
  },

  {
    slug: "michael-pugliano",
    name: "Michael Pugliano",
    bio: "Host of Productive Bitcoin — a podcast and community for Bitcoiners who want their savings to be a foundation for a productive, sovereign life, not just a speculative trade. Michael bridges sound money philosophy with practical personal finance, business building, and long-term wealth preservation.",
    avatarUrl: "",
    websiteUrl: "https://www.productivebitcoin.com",
    podcastUrl: "https://www.productivebitcoin.com/podcast",
    status: "live",
    transformationSlugs: ["tradfi-to-hard-assets"],
    kitSlugs: ["budget-kit", "digital-kit"],
    curatedLinks: [
      {
        title: "Productive Bitcoin Podcast",
        url: "https://www.productivebitcoin.com/podcast",
        type: "podcast",
      },
      {
        title: "The Bitcoin Capitalist",
        url: "https://www.productivebitcoin.com/bitcoin-capitalist",
        type: "article",
      },
      {
        title: "TSP: Michael Pugliano on Bitcoin and Financial Sovereignty",
        url: "https://www.thesurvivalpodcast.com/michael-pugliano",
        type: "podcast",
      },
    ],
  },

  /* ─── Digital Sovereignty ─── */

  {
    slug: "naomi-brockwell",
    name: "Naomi Brockwell",
    bio: "Privacy advocate, journalist, and founder of NBTV. Naomi produces the clearest, most practical guides to digital privacy and self-custody available anywhere — encrypted communication, hardware wallets, surveillance capitalism, and the tools everyday people can use to reclaim their digital sovereignty.",
    avatarUrl: "",
    websiteUrl: "https://www.nbtv.media",
    podcastUrl: "https://www.nbtv.media/podcast",
    status: "live",
    transformationSlugs: ["tradfi-to-hard-assets"],
    kitSlugs: ["digital-kit"],
    curatedLinks: [
      {
        title: "NBTV — Protecting Your Privacy",
        url: "https://www.nbtv.media",
        type: "video",
      },
      {
        title: "How to Take Back Your Privacy",
        url: "https://www.nbtv.media/privacy-guide",
        type: "article",
      },
      {
        title: "Self-Custody Bitcoin: The Beginner's Guide",
        url: "https://www.nbtv.media/self-custody",
        type: "video",
      },
    ],
  },

  {
    slug: "james-corbett",
    name: "James Corbett",
    bio: "Independent journalist and host of The Corbett Report since 2007. James covers deep politics, media criticism, open-source intelligence, and the practical steps to opt out of surveilled systems. His meticulous sourcing and long-form documentary work make him essential for anyone pursuing digital and financial sovereignty.",
    avatarUrl: "",
    websiteUrl: "https://www.corbettreport.com",
    podcastUrl: "https://www.corbettreport.com/podcast",
    status: "live",
    transformationSlugs: ["tradfi-to-hard-assets"],
    kitSlugs: ["digital-kit", "budget-kit"],
    curatedLinks: [
      {
        title: "The Corbett Report",
        url: "https://www.corbettreport.com",
        type: "podcast",
      },
      {
        title: "How to Opt Out of the Technocracy",
        url: "https://www.corbettreport.com/opt-out",
        type: "video",
      },
      {
        title: "Solutions Watch — Practical Sovereignty Steps",
        url: "https://www.corbettreport.com/solutions-watch",
        type: "video",
      },
    ],
  },

  /* ─── Economics & Preparedness ─── */

  {
    slug: "chris-martenson",
    name: "Chris Martenson",
    bio: "Scientist, economic researcher, and co-founder of Peak Prosperity. Chris is best known for The Crash Course — a systematic explanation of the converging crises in energy, environment, and economy. His work bridges financial sovereignty and physical preparedness in a way that few others match.",
    avatarUrl: "",
    websiteUrl: "https://www.peakprosperity.com",
    podcastUrl: "https://www.peakprosperity.com/podcast",
    status: "live",
    transformationSlugs: ["tradfi-to-hard-assets", "grid-to-off-grid"],
    kitSlugs: ["physical-kit", "budget-kit"],
    curatedLinks: [
      {
        title: "The Crash Course (Video Series)",
        url: "https://www.peakprosperity.com/crashcourse",
        type: "video",
      },
      {
        title: "Prosper! How to Prepare for the Future (Book)",
        url: "https://www.peakprosperity.com/prosper-book",
        type: "book",
      },
      {
        title: "Peak Prosperity Podcast",
        url: "https://www.peakprosperity.com/podcast",
        type: "podcast",
      },
    ],
  },

  /* ─── Community & Homestead Living ─── */

  {
    slug: "nicole-sauce",
    name: "Nicole Sauce",
    bio: "Host of Living Free in Tennessee (LFTN) and one of the most practical voices in the TSP community. Nicole covers homesteading, food preservation, small-scale farming, family sovereignty, and building community — all from a working homestead in Tennessee. A recurring TSP guest and trusted voice in the Fireside Freedom ecosystem.",
    avatarUrl: "",
    websiteUrl: "https://livingfreeintennessee.com",
    podcastUrl: "https://livingfreeintennessee.com/podcast",
    status: "live",
    transformationSlugs: ["employee-to-owner"],
    kitSlugs: ["family-kit", "care-kit", "council-kit"],
    curatedLinks: [
      {
        title: "Living Free in Tennessee — LFTN Podcast",
        url: "https://livingfreeintennessee.com/podcast",
        type: "podcast",
      },
      {
        title: "TSP: Nicole Sauce on Homesteading and Community",
        url: "https://www.thesurvivalpodcast.com/nicole-sauce",
        type: "podcast",
      },
      {
        title: "LFTN Community — Home Sovereignty in Practice",
        url: "https://livingfreeintennessee.com/community",
        type: "article",
      },
    ],
  },
];

export function creatorBySlug(slug: string): Creator | undefined {
  return CREATORS.find((c) => c.slug === slug);
}
