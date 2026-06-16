export type FinderAnswer = {
  situation: "individual" | "family" | "others";
  household: "expecting" | "new-parent" | "kids-under-10" | "kids-older" | "adult" | "solo";
  goal: "income" | "health" | "privacy" | "physical" | "community";
  companions: "solo" | "partner" | "family" | "community";
  entry: "philosophy" | "action" | "curriculum";
  readiness: "starting" | "underway" | "advanced";
};

export type FinderQuestion = {
  id: keyof FinderAnswer;
  text: string;
  subtext?: string;
  options: { value: string; label: string; description: string }[];
};

export const FINDER_QUESTIONS: FinderQuestion[] = [
  {
    id: "situation",
    text: "Who are you building resilience for?",
    subtext: "This shapes which kit fits your situation best.",
    options: [
      {
        value: "individual",
        label: "Just myself",
        description: "I'm working on my own independence and preparedness.",
      },
      {
        value: "family",
        label: "My household or family",
        description: "I want resilience for the people I live with and care for.",
      },
      {
        value: "others",
        label: "Clients, community, or an organization",
        description: "I work with others — guiding, advising, or coordinating at scale.",
      },
    ],
  },
  {
    id: "household",
    text: "What's your household situation right now?",
    subtext: "This helps us surface the most relevant kit for your specific moment.",
    options: [
      {
        value: "expecting",
        label: "Expecting a child",
        description: "We're preparing for a baby and want to build a health-sovereign home before they arrive.",
      },
      {
        value: "new-parent",
        label: "New parent (child under 2)",
        description: "We have a young infant and are building resilient health practices from the start.",
      },
      {
        value: "kids-under-10",
        label: "Kids at home (under 10)",
        description: "We have young children and want skills that work alongside our family — including homeschool.",
      },
      {
        value: "kids-older",
        label: "Kids at home (10+)",
        description: "Our kids are older and can participate directly in building household resilience.",
      },
      {
        value: "adult",
        label: "Adult household",
        description: "No kids at home — just adults making these changes together.",
      },
      {
        value: "solo",
        label: "Solo",
        description: "I'm doing this work on my own right now.",
      },
    ],
  },
  {
    id: "goal",
    text: "What's your most urgent focus right now?",
    subtext: "Pick the area where you most want to make progress.",
    options: [
      {
        value: "income",
        label: "Income & financial independence",
        description: "Moving from employee income to owner income, debt freedom, real assets.",
      },
      {
        value: "health",
        label: "Health sovereignty",
        description: "Reclaiming your health from the conventional system — food, herbs, home care.",
      },
      {
        value: "privacy",
        label: "Digital privacy & security",
        description: "Protecting your data, securing your finances, reducing your digital footprint.",
      },
      {
        value: "physical",
        label: "Physical preparedness",
        description: "Hard assets, energy independence, food storage, contingency planning.",
      },
      {
        value: "community",
        label: "Community & watershed resilience",
        description: "Building resilience with neighbors, a local network, or a regional council.",
      },
    ],
  },
  {
    id: "companions",
    text: "Who's on this journey with you?",
    subtext: "This helps us understand the scale of what you're building.",
    options: [
      {
        value: "solo",
        label: "Just me — going it alone for now",
        description: "I'm making these changes independently.",
      },
      {
        value: "partner",
        label: "My partner or spouse",
        description: "We're working toward resilience together as a couple.",
      },
      {
        value: "family",
        label: "My whole household or family",
        description: "This is a family effort — everyone's involved.",
      },
      {
        value: "community",
        label: "A wider group, network, or community",
        description: "I'm thinking beyond my household — a neighborhood, watershed, or organization.",
      },
    ],
  },
  {
    id: "entry",
    text: "How do you best take action?",
    subtext: "Different kits are structured for different learning styles.",
    options: [
      {
        value: "philosophy",
        label: "Understand the 'why' first",
        description: "I want the mental model before I touch anything practical.",
      },
      {
        value: "action",
        label: "Give me a concrete first step",
        description: "I want to do something useful this week — I'll build the theory as I go.",
      },
      {
        value: "curriculum",
        label: "A complete path from start to finish",
        description: "I want the full curriculum laid out so I can work through it systematically.",
      },
    ],
  },
  {
    id: "readiness",
    text: "Where are you starting from?",
    subtext: "Be honest — the right kit meets you where you are.",
    options: [
      {
        value: "starting",
        label: "Early days — just getting oriented",
        description: "I know I need to make changes but haven't gone deep yet.",
      },
      {
        value: "underway",
        label: "Some steps taken — looking to go further",
        description: "I've made progress and want a structured path to build on it.",
      },
      {
        value: "advanced",
        label: "Well along — refining or helping others",
        description: "I'm fairly prepared and want to level up or guide others.",
      },
    ],
  },
];

export type FinderResult = {
  primary: string;
  secondary?: string;
  reason: string;
};

export const GOAL_LABELS: Record<string, string> = {
  income: "income independence",
  health: "health sovereignty",
  privacy: "digital privacy & security",
  physical: "physical preparedness",
  community: "community resilience",
};

export const SITUATION_LABELS: Record<string, string> = {
  individual: "building personal resilience",
  family: "building household resilience",
  others: "guiding others toward resilience",
};

export const COMPANIONS_LABELS: Record<string, string> = {
  solo: "going it alone",
  partner: "with a partner",
  family: "as a family",
  community: "with a wider community or group",
};

export const READINESS_LABELS: Record<string, string> = {
  starting: "just getting started",
  underway: "already underway",
  advanced: "well along",
};

export function resolveKit(answers: FinderAnswer): FinderResult {
  const { situation, household, goal, companions, readiness } = answers;

  // ── Household lifecycle routing (highest priority) ───────────────────────────
  if (household === "expecting") {
    return {
      primary: "pregnancy-kit",
      secondary: "care-kit",
      reason: "You're expecting — the Pregnancy Kit covers natural birth prep, building a health-sovereign home before baby arrives, and the early infant decisions that shape the first year. The Care Kit is the natural companion for the family's ongoing health practice.",
    };
  }

  if (household === "new-parent") {
    return {
      primary: "baby-health-kit",
      secondary: "pregnancy-kit",
      reason: "With a new baby at home, the Baby Health Kit gives you the infant care protocols, first-foods philosophy, and home treatment skills for the early years. The Pregnancy Kit fills in anything you missed before the birth.",
    };
  }

  if (household === "kids-under-10") {
    if (goal === "health") {
      return {
        primary: "care-kit",
        secondary: "family-kit",
        reason: "With young kids at home, the Care Kit gives you home treatment protocols, herbalism, and root-cause health practices the whole family can build together — including homeschool-ready content. The Family Kit anchors your physical household preparedness.",
      };
    }
    return {
      primary: "family-kit",
      secondary: "care-kit",
      reason: "The Family Kit is built for households with young children — 90-day food and water security, homeschool-edition content, and whole-home preparedness that fits around life with kids under 10. The Care Kit pairs naturally for the health side.",
    };
  }

  // ── Professional / community routing ────────────────────────────────────────
  const communitySignal = companions === "community" || goal === "community";

  if (situation === "others") {
    if (communitySignal || readiness === "advanced") {
      return {
        primary: "council-kit",
        secondary: "practitioner-kit",
        reason: `You're focused on ${GOAL_LABELS[goal]} while ${SITUATION_LABELS[situation]} — ${COMPANIONS_LABELS[companions]}. The Council Kit is built for people organizing at the watershed or community scale. The Practitioner Kit pairs well for one-on-one work.`,
      };
    }
    return {
      primary: "practitioner-kit",
      secondary: "council-kit",
      reason: `You're ${SITUATION_LABELS[situation]} with a focus on ${GOAL_LABELS[goal]}. The Practitioner Kit gives you the structured framework and tools to guide clients through resilience transitions.`,
    };
  }

  if (situation === "family" || companions === "family") {
    if (goal === "income") {
      return {
        primary: "producer-kit",
        secondary: "family-kit",
        reason: `You're building ${GOAL_LABELS[goal]} for your household. The Producer Kit provides the financial and entrepreneurial foundation. Pair it with the Family Kit for whole-home preparedness.`,
      };
    }
    if (goal === "health") {
      return {
        primary: "care-kit",
        secondary: "family-kit",
        reason: `You want ${GOAL_LABELS[goal]} for your household. The Care Kit covers home health, herbalism, and functional medicine for the whole family.`,
      };
    }
    if (goal === "privacy") {
      return {
        primary: "digital-kit",
        secondary: "family-kit",
        reason: `You're focused on ${GOAL_LABELS[goal]} for your household. The Digital Kit covers crypto-asset security, privacy tools, and financial sovereignty — all critical for families.`,
      };
    }
    if (communitySignal) {
      return {
        primary: "family-kit",
        secondary: "council-kit",
        reason: `A prepared, self-reliant household is the building block of any strong community network. The Family Kit is your foundation — with the Council Kit as the natural next step when you're ready to build outward.`,
      };
    }
    return {
      primary: "family-kit",
      secondary: "physical-kit",
      reason: `For a household focused on ${GOAL_LABELS[goal]}, the Family Kit is your foundation — 90-day food and water, home security, emergency planning. The Physical Kit adds energy independence and hard-asset strategy.`,
    };
  }

  if (communitySignal) {
    return {
      primary: "council-kit",
      secondary: "practitioner-kit",
      reason: `You're building ${GOAL_LABELS[goal]} ${COMPANIONS_LABELS[companions]}. The Council Kit covers the 4-phase community engagement model and coordination infrastructure for watershed-scale work.`,
    };
  }

  if (goal === "income") {
    return {
      primary: "producer-kit",
      reason: `You're building ${GOAL_LABELS[goal]} for yourself. The Producer Kit covers the full arc from employee income to owner income — financial philosophy, debt freedom, and assets that work while you sleep.`,
    };
  }
  if (goal === "health") {
    return {
      primary: "care-kit",
      reason: `You're reclaiming ${GOAL_LABELS[goal]}. The Care Kit takes you from the conventional system toward root-cause health — nutrition, herbal medicine, and home treatment skills.`,
    };
  }
  if (goal === "privacy") {
    return {
      primary: "digital-kit",
      reason: `You're focused on ${GOAL_LABELS[goal]}. The Digital Kit covers hardware wallets, cold storage, VPNs, encrypted communications, and reducing your footprint — starting with the mental model.`,
    };
  }
  return {
    primary: "physical-kit",
    reason: `You're building ${GOAL_LABELS[goal]} for yourself. The Physical Kit covers hard assets (silver, gold), energy independence (solar, battery backup), water, heat, and the contingency planning most people skip.`,
  };
}

export function situationLabel(s: FinderAnswer["situation"]): string {
  return SITUATION_LABELS[s] ?? s;
}
export function goalLabel(g: FinderAnswer["goal"]): string {
  return GOAL_LABELS[g] ?? g;
}
export function companionsLabel(c: FinderAnswer["companions"]): string {
  return COMPANIONS_LABELS[c] ?? c;
}
export function readinessLabel(r: FinderAnswer["readiness"]): string {
  return READINESS_LABELS[r] ?? r;
}
