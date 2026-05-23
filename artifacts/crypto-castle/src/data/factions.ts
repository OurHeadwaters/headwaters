export type FactionId = "btc" | "xrp" | "eth" | "wild";

export interface Faction {
  id: FactionId;
  name: string;
  shortName: string;
  figurehead: string;
  figureheadTitle: string;
  tagline: string;
  badge: string;
  roasts: Record<FactionId, string>;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
    border: string;
    glow: string;
  };
  bragLines: string[];
  emoji: string;
}

export const FACTIONS: Record<FactionId, Faction> = {
  btc: {
    id: "btc",
    name: "BTC Maxi",
    shortName: "BTC",
    figurehead: "Michael Saylor",
    figureheadTitle: "The Orange Pill Evangelist",
    tagline: "Laser eyes. No mercy. All signal, no noise.",
    badge: "₿",
    emoji: "🟠",
    colors: {
      primary: "#f7931a",
      secondary: "#1a1a1a",
      accent: "#ffa940",
      bg: "#0d0d0d",
      text: "#f7931a",
      border: "#f7931a",
      glow: "rgba(247,147,26,0.4)",
    },
    roasts: {
      btc: "You are the chosen ones.",
      xrp: "XRP is a banker's toy controlled by a single company. Ripple Labs could turn it off tomorrow. Sleep well.",
      eth: "ETH is just BTC with gas fees so high you need a second mortgage to send a JPEG. Vitalik wears a Shiba costume to conferences.",
      wild: "Shitcoin holders are exit liquidity waiting to happen. Bless their hearts.",
    },
    bragLines: [
      "21 million. That's the cap. Forever.",
      "We don't compromise. We accumulate.",
      "While others speculate, we stack sats.",
    ],
  },
  xrp: {
    id: "xrp",
    name: "XRP Army",
    shortName: "XRP",
    figurehead: "Joel Katz",
    figureheadTitle: "The Architect — Ripple CTO",
    tagline: "The case. The moon. The army never sleeps.",
    badge: "✕",
    emoji: "🔵",
    colors: {
      primary: "#346aa9",
      secondary: "#0e1f35",
      accent: "#6ab0f5",
      bg: "#060f1c",
      text: "#6ab0f5",
      border: "#346aa9",
      glow: "rgba(52,106,169,0.5)",
    },
    roasts: {
      xrp: "The chosen path to institutional adoption.",
      btc: "BTC maxis are digital gold bugs who think the internet ends at SHA-256. Enjoy your 10-minute settlement times.",
      eth: "ETH can't decide if it's a computer, money, or a DAO experiment gone sideways. At least we have a roadmap.",
      wild: "Altcoin chasing is what tourists do. The Army has coordinates.",
    },
    bragLines: [
      "Banks are already using it. Read the news.",
      "The case is being won. One ruling at a time.",
      "Liquidity. Speed. Scale. You're welcome, SWIFT.",
    ],
  },
  eth: {
    id: "eth",
    name: "ETH Heads",
    shortName: "ETH",
    figurehead: "Vitalik Buterin",
    figureheadTitle: "The Jester — Accidentally Brilliant",
    tagline: "Bells on his hat. Gas fees are the punchlines. Nobody knows if he's joking.",
    badge: "Ξ",
    emoji: "💜",
    colors: {
      primary: "#7c3aed",
      secondary: "#1a0a2e",
      accent: "#c084fc",
      bg: "#0a0515",
      text: "#c084fc",
      border: "#7c3aed",
      glow: "rgba(124,58,237,0.5)",
    },
    roasts: {
      eth: "We are building the world computer. You're welcome, civilization.",
      btc: "BTC is a calculator that only does one thing. We built an operating system. Big difference.",
      xrp: "XRP is three Ripple employees and a Discord full of moon-callers. We have actual devs.",
      wild: "Shitcoins are ETH forks piloted by anonymous teenagers. Some are ours. We're not proud.",
    },
    bragLines: [
      "Smart contracts. DeFi. NFTs. You're welcome.",
      "Merge complete. ETH is now deflationary. Try to keep up.",
      "Vitalik read your whitepaper. He says it's cute.",
    ],
  },
  wild: {
    id: "wild",
    name: "Shitcoin Wildcard",
    shortName: "WILD",
    figurehead: "The Rotating Altcoin",
    figureheadTitle: "This Week's Flavor — Maximum Chaos",
    tagline: "300x or zero. No in-between. Wen moon? Right now.",
    badge: "🎲",
    emoji: "🌈",
    colors: {
      primary: "#ec4899",
      secondary: "#1a0020",
      accent: "#f0abfc",
      bg: "#0d0010",
      text: "#f0abfc",
      border: "#ec4899",
      glow: "rgba(236,72,153,0.5)",
    },
    roasts: {
      wild: "You are either a genius or the exit liquidity. Flip a coin.",
      btc: "BTC maxis are scared because they forgot how to have fun. Laser eyes? We have laser everything.",
      xrp: "XRP Army has been waiting for 'the moon' since 2017. The Wildcard already mooned and came back. Twice.",
      eth: "ETH took 5 years to do what we did in a weekend with a Telegram bot and a dog picture.",
    },
    bragLines: [
      "First in. First out. First to 300x.",
      "The narrative changes daily. So does the ticker.",
      "We didn't come here for Bitcoin. We came for chaos.",
    ],
  },
};

export const FACTION_LIST = Object.values(FACTIONS);

export const RIVALRY_TRASH_TALK: Array<{ from: FactionId; to: FactionId; line: string }> = [
  { from: "btc", to: "eth", line: "Why pay $200 in gas to do something BTC does for free?" },
  { from: "eth", to: "btc", line: "A calculator is not a computer, Saylor." },
  { from: "xrp", to: "btc", line: "10 minute settlement. In 2025. Remarkable." },
  { from: "btc", to: "xrp", line: "XRP: premined, centralized, held by banks. Love the branding though." },
  { from: "wild", to: "eth", line: "We shipped in 48 hours what ETH roadmapped for 2027." },
  { from: "eth", to: "wild", line: "Your 'project' is a Telegram bot and a dog meme. We'll wait." },
  { from: "xrp", to: "wild", line: "Put down the altcoin bag. The Army has a real briefing." },
  { from: "wild", to: "xrp", line: "Still waiting for the moon since 2017? Relax. We've been there." },
  { from: "btc", to: "wild", line: "DYOR. Oh wait, there's no whitepaper." },
  { from: "wild", to: "btc", line: "Congratulations on your slow, expensive digital gold." },
];
