/**
 * Static registry of Expert Council members and ULG-affiliated businesses.
 * Each entry is tagged with one or more zone slugs.
 * Update this file to add/edit entries — no component code changes needed.
 */

export type ExpertCouncilMember = {
  id: string;
  name: string;
  role: string;
  description: string;
  url: string;
  xHandle?: string;
  zones: string[];
  comingSoon?: boolean;
};

export type UlgBusiness = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  zones: string[];
  comingSoon?: boolean;
};

export const EXPERT_COUNCIL: ExpertCouncilMember[] = [
  {
    id: "steven-harris",
    name: "Steven Harris",
    role: "Energy & Power Systems",
    description:
      "The go-to expert on backup power, fuel systems, and energy independence at the home and homestead scale. Steven has appeared on TSP more than any other guest.",
    url: "https://www.1234energy.com",
    xHandle: "1234energy",
    zones: ["zone-1", "zone-3"],
  },
  {
    id: "marjory-wildcraft",
    name: "Marjory Wildcraft",
    role: "Home Food Production",
    description:
      "Founder of The Grow Network. Marjory teaches growing and preparing food for health and resilience — practical, proven systems for gardens big and small.",
    url: "https://www.thegrownetwork.com",
    xHandle: "MarjoryWildcraft",
    zones: ["zone-2", "zone-3"],
  },
  {
    id: "paul-wheaton",
    name: "Paul Wheaton",
    role: "Permaculture & Homesteading",
    description:
      "Founder of Permies.com and the richsoil homestead. Paul is a leading voice on permaculture design, natural building, and building a working homestead from the ground up.",
    url: "https://www.permies.com",
    xHandle: "paulwheaton",
    zones: ["zone-2", "zone-3"],
  },
  {
    id: "dr-joseph-mercola",
    name: "Dr. Joseph Mercola",
    role: "Natural Health & Nutrition",
    description:
      "Physician and natural health advocate. Dr. Mercola focuses on taking ownership of your health through nutrition, supplementation, and avoiding the pitfalls of conventional medicine.",
    url: "https://www.mercola.com",
    xHandle: "mercola",
    zones: ["zone-0", "zone-1"],
  },
  {
    id: "joel-salatin",
    name: "Joel Salatin",
    role: "Regenerative Farming",
    description:
      "The 'most famous farmer in America.' Joel runs Polyface Farm and has been teaching ecological, beyond-organic farming to the world for decades.",
    url: "https://www.polyfacefarms.com",
    xHandle: "JoelSalatin",
    zones: ["zone-3"],
  },
  {
    id: "karen-m-black",
    name: "Karen M. Black",
    role: "Community & Intentional Resilience",
    description:
      "Author and community resilience strategist. Karen works at the intersection of personal preparedness and neighborhood-scale resilience — building the human network that makes everything else work.",
    url: "https://www.ithunderbird.com",
    zones: ["zone-0", "zone-5"],
  },
  {
    id: "john-lovell",
    name: "John Lovell",
    role: "Firearms & Self Defense",
    description:
      "Founder of Warrior Poet Society. John is a former Army Ranger and firearms instructor who teaches practical self-defense and the warrior mindset.",
    url: "https://www.warriorpoetsociety.us",
    xHandle: "JohnBLovell",
    zones: ["zone-1", "zone-5"],
  },
  {
    id: "chris-martenson",
    name: "Chris Martenson",
    role: "Economics & Resilient Investing",
    description:
      "Founder of Peak Prosperity. Chris covers the intersection of economics, energy, and environment — helping people build financial resilience outside the conventional system.",
    url: "https://www.peakprosperity.com",
    xHandle: "ChrisMartenson",
    zones: ["zone-0"],
  },
  {
    id: "sam-nowak",
    name: "Sam Nowak",
    role: "Aquaponics & Food Systems",
    description:
      "Commercial aquaponics operator and educator. Sam builds and teaches closed-loop food production systems that combine fish and vegetables for maximum yield with minimal inputs.",
    url: "https://www.backyardaquaponics.com",
    zones: ["zone-2"],
  },
  {
    id: "jack-spirko",
    name: "Jack Spirko",
    role: "Host — The Survival Podcast",
    description:
      "Jack Spirko has been teaching modern survivalism since 2008 — practical self-reliance, permaculture, financial independence, and building a life so good it's worth protecting.",
    url: "https://www.thesurvivalpodcast.com",
    xHandle: "JackSpirok",
    zones: ["zone-0", "zone-1", "zone-2", "zone-3", "zone-4", "zone-5"],
  },
  {
    id: "dr-scott-graves",
    name: "Dr. Scott Graves",
    role: "Functional Medicine & Nutrition",
    description:
      "Functional medicine practitioner focused on root-cause health — gut health, nutrition, and the kind of care that builds genuine long-term resilience rather than managing symptoms.",
    url: "https://www.integrativenutritiontherapies.com",
    zones: ["zone-0", "zone-1"],
  },
  {
    id: "nicholas-de-hart",
    name: "Nicholas de Hart",
    role: "Hunting, Foraging & Wild Harvest",
    description:
      "Wilderness skills instructor and hunter. Nicholas teaches practical field craft — tracking, wild edibles, and integrating wild harvest into a complete self-reliant lifestyle.",
    url: "",
    comingSoon: true,
    zones: ["zone-4", "zone-5"],
  },
  {
    id: "chuck-taylor",
    name: "Chuck Taylor",
    role: "Small Business & Entrepreneurship",
    description:
      "Business coach and TSP community member. Chuck helps people build income streams they own — from side hustles to full-time businesses that replace a job and build real freedom.",
    url: "",
    comingSoon: true,
    zones: ["zone-0"],
  },
  {
    id: "ben-falk",
    name: "Ben Falk",
    role: "Permaculture Land Design",
    description:
      "Designer and author of The Resilient Farm and Homestead. Ben integrates permaculture design at the property scale — food forests, water systems, and multi-layered production landscapes.",
    url: "https://www.wholesystemsdesign.com",
    xHandle: "WholeSystemsD",
    zones: ["zone-2", "zone-3", "zone-4"],
  },
  {
    id: "steven-fowkes",
    name: "Steven Fowkes",
    role: "Brain Chemistry & Cognitive Health",
    description:
      "Biochemist and author specializing in the chemistry of peak cognition and brain health. Steven's work on nootropics, nutrition, and neurological resilience is unlike anything else in the TSP archive.",
    url: "https://www.projectwellbeing.com",
    zones: ["zone-0"],
  },
  {
    id: "prof-cj-kilmer",
    name: "Prof CJ Kilmer",
    role: "Historian & History Professor",
    description:
      "History professor and recurring TSP guest who brings rigorous academic context to topics like societal collapse, personal liberty, and the long arc of civilization. CJ makes history immediately relevant to modern self-reliance.",
    url: "",
    comingSoon: true,
    zones: ["zone-0", "zone-5"],
  },
  {
    id: "dr-ken-berry",
    name: "Dr. Ken Berry, MD",
    role: "Carnivore Medicine & Nutritional Sovereignty",
    description:
      "Physician, author of Lies My Doctor Told Me, and one of the clearest voices on metabolic self-reliance. Dr. Berry teaches how to reclaim your health through proper human diet — carnivore, keto, and the ancestral eating principles that conventional medicine ignores.",
    url: "https://www.drberry.com",
    xHandle: "KenDBerryMD",
    zones: ["zone-0"],
  },
  {
    id: "dave-ramsey",
    name: "Dave Ramsey",
    role: "Debt Elimination & Financial Peace",
    description:
      "Creator of the 7 Baby Steps — the proven, step-by-step path to getting out of debt, building a $1,000 starter emergency fund, and achieving financial peace. Dave's zero-based budgeting and debt snowball methods have helped millions stop living paycheck to paycheck.",
    url: "https://www.ramseysolutions.com",
    zones: ["zone-0"],
  },
  {
    id: "brian-aleksivich",
    name: "Brian Aleksivich",
    role: "Community Building & Preparedness Outreach",
    description:
      "Co-host of the Fireside Freedom Podcast and founder of The Lots Project — a liberty-minded community initiative focused on land, connection, and self-reliance. Brian brings grassroots community-building experience to the intersection of freedom philosophy and practical preparedness.",
    url: "https://www.thelotsproject.com",
    zones: ["zone-0", "zone-2"],
  },
  {
    id: "lettie-loo",
    name: "Lettie Loo",
    role: "Liberty Lifestyle & Personal Freedom",
    description:
      "Co-host of the Fireside Freedom Podcast and creator of Liberty All Day — a platform exploring the everyday practice of living free. Lettie covers the mindset shifts, habits, and choices that build a genuinely self-directed life.",
    url: "https://libertyallday.home.blog",
    zones: ["zone-0", "zone-1"],
  },
  {
    id: "tim-toolman-cook",
    name: "Tim 'Toolman' Cook",
    role: "Home Systems & Workshop Preparedness",
    description:
      "Alberta-based handyman, homesteader, and host of the Workshop Podcast. Tim is the anchor of the future Tool Shed concept — covering practical home repair, workshop skills, and the kind of hands-on preparedness that keeps a property running no matter what. If it involves tools, Tim has it covered.",
    url: "https://www.toolmantim.co",
    zones: ["zone-3"],
  },
  {
    id: "ken-eash",
    name: "Ken Eash",
    role: "Constructive Liberty & Homestead Building",
    description:
      "Co-host of the Fireside Freedom Podcast and host of the Constructive Liberty Podcast. Ken blends the principles of personal freedom with the practical craft of building — from structures to systems — on the homestead.",
    url: "https://www.kennetheash.com",
    zones: ["zone-3"],
  },
  {
    id: "nate-erin-lamaster",
    name: "Nate & Erin Lamaster",
    role: "Homesteading & Small Farm Living",
    description:
      "Co-hosts of the Fireside Freedom Podcast and operators of Two Chicks Homestead. Nate and Erin document real homestead life — the animals, the gardens, the setbacks, and the wins — and inspire others to build productive, freedom-centered lives on the land.",
    url: "https://www.twochickshomestead.com",
    zones: ["zone-2", "zone-3"],
  },
  {
    id: "amy-fireside",
    name: "Amy",
    role: "Farmstead Life & Home Food Production",
    description:
      "Co-host of the Fireside Freedom Podcast and creator of A Farmish Kind of Life — a practical, grounded resource for anyone building a homestead or farm-based lifestyle. Amy covers everything from raising animals to preserving the harvest with honesty and humor.",
    url: "https://www.afarmishkindoflife.com",
    zones: ["zone-2"],
  },
  {
    id: "hawkins-j",
    name: "Hawkins J",
    role: "Liberty Media & Podcast Production",
    description:
      "Co-host of the Fireside Freedom Podcast and a key voice in the liberty-media space. Hawkins brings a sharp perspective on freedom philosophy, independent media, and the culture of self-reliance.",
    url: "",
    comingSoon: true,
    zones: ["zone-0"],
  },
];

export const ULG_BUSINESSES: UlgBusiness[] = [
  {
    id: "ames-farm",
    name: "Ames Farm",
    tagline: "Single-source raw honey",
    description:
      "A Minnesota-based artisan honey producer offering single-source raw honey from carefully managed hives. Featured on ULG for their commitment to real beekeeping.",
    url: "https://www.amesfarm.com",
    zones: ["zone-2", "zone-3"],
  },
  {
    id: "ready-made-resources",
    name: "Ready Made Resources",
    tagline: "Preparedness gear and supplies",
    description:
      "Long-time TSP sponsor offering freeze-dried food, solar generators, water filtration, and core preparedness supplies. The real deal — not just marketing.",
    url: "https://www.readymaderesources.com",
    zones: ["zone-1", "zone-5"],
  },
  {
    id: "flood-and-fire-organics",
    name: "Flood & Fire Organics",
    tagline: "Biodynamic seeds and soil",
    description:
      "Small-scale seed company offering biodynamic and open-pollinated seed varieties suited for home gardeners and small farmers building seed independence.",
    url: "https://www.floodandfireorganics.com",
    zones: ["zone-2"],
  },
  {
    id: "mountain-rose-herbs",
    name: "Mountain Rose Herbs",
    tagline: "Organic herbs and botanicals",
    description:
      "Oregon-based supplier of certified organic herbs, teas, and botanical ingredients for home herbalism, natural health, and DIY preparations.",
    url: "https://www.mountainroseherbs.com",
    zones: ["zone-1", "zone-2"],
  },
  {
    id: "practical-self-reliance",
    name: "Practical Self Reliance",
    tagline: "Home food preservation resources",
    description:
      "A trusted resource hub for canning, dehydrating, fermenting, and all forms of home food preservation — run by a community member who walks the talk.",
    url: "https://www.practicalselfreliance.com",
    zones: ["zone-1", "zone-2"],
  },
  {
    id: "apogee-agriculture",
    name: "Apogee Agriculture",
    tagline: "Regenerative farming consultation",
    description:
      "Consulting practice helping farmers transition to regenerative and beyond-organic systems. Covers soil health, grazing management, and whole-farm design.",
    url: "",
    comingSoon: true,
    zones: ["zone-3"],
  },
  {
    id: "moss-creek-woollens",
    name: "Moss Creek Woollens",
    tagline: "Naturally dyed, handspun fiber",
    description:
      "Small-batch fiber arts from ethically raised sheep. Raw fleece, roving, and finished goods from a working homestead — fiber arts as self-reliance.",
    url: "",
    comingSoon: true,
    zones: ["zone-3"],
  },
  {
    id: "forge-survival-supply",
    name: "Forge Survival Supply",
    tagline: "Real preparedness tools and kits",
    description:
      "Curated survival and preparedness supplies chosen for real-world use, not catalog appeal. Knives, fire-starting tools, water gear, and practical field kits.",
    url: "https://www.forgesurvivalsupply.com",
    zones: ["zone-4", "zone-5"],
  },
  {
    id: "audacious-brewing",
    name: "Audacious Brewing",
    tagline: "Craft fermentation from first principles",
    description:
      "A craft brewery and fermentation school that teaches home brewing, wild fermentation, and the broader culture of making your own beverages.",
    url: "",
    comingSoon: true,
    zones: ["zone-2"],
  },
  {
    id: "agrisafe-network",
    name: "AgriSafe Network",
    tagline: "Health and safety for farm families",
    description:
      "Nonprofit focused on the occupational health of farmers and rural families — injury prevention, mental health resources, and rural healthcare navigation.",
    url: "https://www.agrisafe.org",
    zones: ["zone-1", "zone-3"],
  },
  {
    id: "elk-ridge-farm",
    name: "Elk Ridge Farm",
    tagline: "Pastured meats and farm education",
    description:
      "A multi-species pasture operation offering direct-to-consumer meats and on-farm education about sustainable animal husbandry.",
    url: "",
    comingSoon: true,
    zones: ["zone-3", "zone-4"],
  },
  {
    id: "off-grid-world",
    name: "Off Grid World",
    tagline: "Off-grid living resources",
    description:
      "A media and community platform covering off-grid energy systems, water independence, and rural living — practical guides from people actually living it.",
    url: "https://www.offgridworld.com",
    zones: ["zone-3", "zone-5"],
  },
];

/** Filter Expert Council members to those tagged for a specific zone slug */
export function expertsForZone(zoneSlug: string): ExpertCouncilMember[] {
  return EXPERT_COUNCIL.filter((m) => m.zones.includes(zoneSlug));
}

/** Filter ULG businesses to those tagged for a specific zone slug */
export function businessesForZone(zoneSlug: string): UlgBusiness[] {
  return ULG_BUSINESSES.filter((b) => b.zones.includes(zoneSlug));
}

/** Count EC members per zone slug */
export function expertCountByZone(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const member of EXPERT_COUNCIL) {
    for (const zone of member.zones) {
      counts[zone] = (counts[zone] ?? 0) + 1;
    }
  }
  return counts;
}

/** Count ULG businesses per zone slug */
export function businessCountByZone(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const biz of ULG_BUSINESSES) {
    for (const zone of biz.zones) {
      counts[zone] = (counts[zone] ?? 0) + 1;
    }
  }
  return counts;
}
