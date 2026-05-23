import type { FactionId } from "./factions";

export interface LessonCard {
  id: string;
  title: string;
  body: string;
  factionNote?: Partial<Record<FactionId, string>>;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  icon: string;
  lessons: LessonCard[];
}

export const MODULES: Module[] = [
  {
    id: "module-1",
    title: "The 5 W's of Crypto",
    description: "What it is, who made it, where it lives, why it matters, and how to start.",
    icon: "🏗️",
    lessons: [
      {
        id: "m1-intro",
        title: "What today is NOT about",
        body: "Getting rich overnight. Becoming a trading expert. This is about the fundamentals — understanding peer-to-peer value exchange, what crypto actually is, and how to get started without losing your shirt. Think of it as building your weapons before you enter the market.",
        factionNote: {
          btc: "Saylor says: accumulate first, understand second. We say: understand first, then accumulate forever.",
          eth: "Vitalik would remind you: even he started by reading, not trading.",
          xrp: "The Army doesn't rush. The Architect spent years designing XRP. Take ten minutes to learn the basics.",
          wild: "Even degens need to know what they're degenning into. Probably.",
        },
      },
      {
        id: "m1-what",
        title: "WHAT is cryptocurrency?",
        body: "Cryptocurrency is a string of letters and numbers that cannot be counterfeited — like a serial number on cash, but digital. These codes can be exchanged with another person through a decentralized ledger. Miners compete to verify this ledger and create new coins, cutting out governments and banks from centralizing our value exchange. Some coins are limited in supply; some are limitless.",
        factionNote: {
          btc: "Bitcoin has exactly 21,000,000 coins. Ever. That's it. That's the point. That's why Saylor keeps buying.",
          eth: "ETH has no hard cap — but since The Merge, it burns more than it mints. Deflationary by design.",
          xrp: "XRP has 100 billion coins total, most held in escrow by Ripple and released over time. The Architect planned it.",
          wild: "Your altcoin has... how many? Let me check the tokenomics PDF. Oh, it doesn't have one.",
        },
      },
      {
        id: "m1-exchanges",
        title: "WHAT are exchanges and privacy coins?",
        body: "Exchanges (like Coinbase, Kraken, Shakepay) are platforms where you can buy and sell crypto using regular money. They require KYC (Know Your Customer) verification — your ID, your face, your data. Privacy coins like Monero or ARRR are designed to hide transaction details. Important: you don't actually 'own' crypto — you hold keys that access it on the blockchain.",
        factionNote: {
          btc: "Not your keys, not your Bitcoin. Get off Coinbase and into cold storage. Saylor would agree.",
          eth: "MetaMask is your key. Learn to use it. Self-custody is the whole point.",
          xrp: "XRP on Coinbase is fine for starters. But the Army knows: exchanges can freeze your bag.",
          wild: "DEX only. No KYC. No questions. Maximum chaos.",
        },
      },
      {
        id: "m1-who",
        title: "WHO came up with it?",
        body: "Thirteen years ago, a person or group using the name Satoshi Nakamoto released a paper describing a new software system called Bitcoin. Nobody knows who this entity was. This anonymous gift of technology has fundamentally challenged the way we think about money, trust, and value. The bigger hurdle isn't the tech — it's convincing people they don't need the old shackles.",
        factionNote: {
          btc: "Satoshi is the ultimate ghost. Gone, but the network lives forever. 21 million reasons it works.",
          eth: "Vitalik is the opposite of Satoshi: very much known, very much present, very much 'actually I have thoughts on this.'",
          xrp: "Joel Katz (David Schwartz) designed XRP's consensus mechanism. Known, accountable, building.",
          wild: "Most altcoin founders are also anonymous. Some because they're geniuses. Some because they're about to rug.",
        },
      },
      {
        id: "m1-why",
        title: "WHY should I start using it?",
        body: "Understanding decentralized currency opens options during this digital transformation. It can hedge against inflation — a devaluing dollar supports new demand for Central Bank Digital Currencies (CBDCs), but mass adoption of decentralized currency combats this. Understanding how it works now means you have options later, when the system changes around you.",
        factionNote: {
          btc: "Bitcoin is the exit ramp from a broken system. Saylor: 'Inflation is theft. Bitcoin is the remedy.'",
          eth: "ETH isn't just money — it's programmable money. DeFi, smart contracts, DAOs. The financial system rebuilt.",
          xrp: "XRP is the bridge between fiat and crypto. The Army sees it as the on-ramp the banks will actually use.",
          wild: "We're here because 300x is better than 2%. Also, CBDC is the bad ending. Decentralize everything.",
        },
      },
      {
        id: "m1-where",
        title: "WHERE does it exist?",
        body: "Cryptocurrency exists on the blockchain — a distributed ledger maintained by thousands of computers (nodes) around the world simultaneously. No single server, no single country, no single point of failure. The blockchain is the permanent record that nobody owns and nobody can erase.",
        factionNote: {
          btc: "The Bitcoin blockchain has never been successfully hacked. 15+ years. Zero downtime. Zero censorship.",
          eth: "Ethereum's blockchain runs the world's largest decentralized computing network. Tens of thousands of nodes.",
          xrp: "The XRP Ledger is fast — 3-5 second settlement. It uses a unique consensus, not mining.",
          wild: "Your coin is on a blockchain with 12 validators, 7 of whom are the founder's cousins. Probably fine.",
        },
      },
      {
        id: "m1-how",
        title: "HOW do I get started safely?",
        body: "Start by avoiding exchanges until you've done your research. Use a simple onboard into a private wallet — hardware or software. Keep your eggs in many baskets. The goal is self-custody: being your own bank, holding your own keys, owning your own future.",
        factionNote: {
          btc: "Hardware wallet. Cold storage. Never leave coins on an exchange. This is not negotiable for the Maxi.",
          eth: "MetaMask for daily use. Ledger for serious storage. Never share your seed phrase. Never.",
          xrp: "XUMM wallet is the Army's standard kit. Easy to use, proper self-custody.",
          wild: "Trust wallet. MetaMask. Whatever the latest chain requires. Keep multiple wallets. Stay nimble.",
        },
      },
    ],
  },
  {
    id: "module-2",
    title: "Scam Encyclopedia",
    description: "Every trick they use. One per card. Know them cold.",
    icon: "🛡️",
    lessons: [
      {
        id: "m2-intro",
        title: "How do I know if it's a scam?",
        body: "The crypto space attracts scammers at scale. They're sophisticated, patient, and constantly evolving. Your best defense is pattern recognition — knowing exactly what each scam looks like before it targets you. The next cards cover every major scam type. Learn them. They will come for you eventually.",
        factionNote: {
          btc: "Maxis have seen every scam. We've been here since 2009. They tried everything. We're still here.",
          eth: "The ETH ecosystem is the most targeted. DeFi scams, NFT rugs, fake airdrops. Know your enemies.",
          xrp: "The XRP Army has been scammed by fake Ripple giveaways more than any other faction. Learn this module twice.",
          wild: "In Shitcoin land, some 'projects' ARE the scam. The line is blurry. This module is survival gear.",
        },
      },
      {
        id: "m2-blackmail",
        title: "Scam: Blackmail",
        body: "Strangers threaten you via email claiming they've hacked your computer via remote desktop protocol (RDP), accessed your webcam, and have embarrassing footage. They offer two options: send Bitcoin to suppress the material, or have it sent to all your contacts. In reality, they have nothing — they use stolen email lists and send this en masse to thousands of people.",
        factionNote: {
          btc: "Delete. Block. Move on. They have nothing. If you've never done anything embarrassing on camera... actually, never mind.",
        },
      },
      {
        id: "m2-fake-exchanges",
        title: "Scam: Fake Exchanges",
        body: "As crypto became popular, nefarious operators set up convincing fake exchanges. They offer extremely competitive market prices — better than real markets — to lure users. You deposit funds, maybe even see 'gains' in your dashboard, then try to withdraw and discover the exchange doesn't exist. Always use reputable, well-known exchanges and double-check the URL.",
        factionNote: {
          eth: "Always check the URL character by character. Fake exchanges add one invisible character to look identical.",
        },
      },
      {
        id: "m2-free-giveaways",
        title: "Scam: Free Giveaways",
        body: "Scammers offer free Bitcoin or other crypto, requiring only that you send a small amount first to 'verify your wallet' — and then you'll receive double back. This is the oldest trick in crypto. Elon Musk did not tweet that. Vitalik is not giving away 5 ETH. MicroStrategy is not doubling your Bitcoin. Nobody is.",
        factionNote: {
          wild: "If it sounds too good to be true in normal life, it's definitely a scam in crypto. Rule one. Only rule.",
          xrp: "The XRP giveaway scams impersonate Brad Garlinghouse constantly. The real Brad does not give away XRP.",
        },
      },
      {
        id: "m2-impersonation",
        title: "Scam: Impersonation",
        body: "Con-artists create social media accounts nearly identical to real crypto figures — one character off in the username, same profile photo, same bio. They reply to the real person's tweets with fake giveaways, or DM followers directly. Never verify someone's identity based on social media alone. Use multiple channels to confirm.",
        factionNote: {
          btc: "Fake Saylor accounts are everywhere. Real Saylor only tweets about Bitcoin. He does not DM you.",
          xrp: "Fake Joel Katz accounts impersonate the architect constantly. The real CTO is not sliding into your DMs.",
        },
      },
      {
        id: "m2-malware",
        title: "Scam: Malware",
        body: "Some malware programs, once installed, monitor your clipboard. When you copy a crypto wallet address to paste, the malware silently swaps it with the attacker's address. You paste what looks like your address, send funds, and they're gone forever. Always triple-check the address you're sending to, character by character, before confirming.",
        factionNote: {
          btc: "Double-check. Triple-check. Saylor would check a fourth time. Bitcoin transactions are irreversible.",
        },
      },
      {
        id: "m2-meeting-in-person",
        title: "Scam: Meeting in Person",
        body: "Local peer-to-peer trades sometimes involve requests to meet in person. This is dangerous — you could be robbed, physically harmed, or handed counterfeit cash. Even if the other party seems legitimate, the risk is not worth the savings on fees. Use peer-to-peer platforms that escrow funds digitally instead.",
        factionNote: {
          wild: "No local trades. No exceptions. Not even for a 10x opportunity. Especially not for a 10x opportunity.",
        },
      },
      {
        id: "m2-money-transfer",
        title: "Scam: Money Transfer Fraud",
        body: "Someone emails or messages you saying they need help moving money, and you'll receive a cut for your trouble. This is the Nigerian Prince scam, updated for crypto. They need your wallet address, then your private keys, then they're gone. Delete and block.",
        factionNote: {
          eth: "These target everyone. The writing is often urgent, emotional, and full of red flags. Trust those red flags.",
        },
      },
      {
        id: "m2-phishing-emails",
        title: "Scam: Phishing Emails",
        body: "Emails designed to look identical to legitimate services — Coinbase, Binance, your bank — asking you to click a link and reset your password or verify your account. The link leads to a fake site that steals your credentials. If you're unsure, go to the company's website directly by typing the URL yourself, never by clicking email links.",
        factionNote: {
          xrp: "Fake Ripple emails are epidemic during news cycles. Ripple will not email you about your XRP. Ever.",
        },
      },
      {
        id: "m2-phishing-websites",
        title: "Scam: Phishing Websites",
        body: "Replica websites designed to steal login credentials or install malware. They appear in sponsored search results, app stores, and via phishing emails. Before logging into any crypto platform, verify the URL is exactly correct — not coinbose.com, not coinbase.co, not c0inbase.com. Bookmark your real exchange URLs.",
        factionNote: {
          btc: "The word 'Bitcoin' in a URL means nothing. Scammers know you'll search for it. Bookmark everything.",
        },
      },
      {
        id: "m2-ponzi",
        title: "Scam: Ponzi & Pyramid Schemes",
        body: "Ponzi schemes promise guaranteed returns on your deposit — they pay earlier investors using later investors' principal, until they collapse. Pyramid schemes add a twist: your returns depend on recruiting others. Both inevitably collapse. If someone promises guaranteed returns in crypto, they are either naive or lying.",
        factionNote: {
          wild: "Some altcoin projects are structurally Ponzis. The only difference from a scam is how long they last before collapse.",
          eth: "DeFi yields can look like Ponzis. Understand the mechanism. If the yield source is 'other deposits,' run.",
        },
      },
      {
        id: "m2-prize-giveaways",
        title: "Scam: Prize Giveaways",
        body: "You've won crypto! Just provide your name, address, email, phone number, and wallet address to claim your prize. This is an information harvest — they're collecting data to impersonate you, access your accounts, or sell your details. You didn't win anything. Nobody randomly gives away crypto.",
        factionNote: {
          xrp: "Fake XRP prize giveaways targeted Army members specifically during the SEC case. Stay sharp.",
        },
      },
      {
        id: "m2-pump-dump",
        title: "Scam: Pump & Dump",
        body: "Coordinators buy a coin cheap, then aggressively promote it across social media and group chats — 'This is about to 100x!' Once the price pumps from their promotion, they dump their holdings on the buyers. The price crashes. You're left holding a worthless coin. Never buy based on hype in a Telegram group.",
        factionNote: {
          wild: "Every Shitcoin group has at least one pump & dump happening. Knowing which is which is the skill.",
          btc: "Bitcoin is too large to pump & dump. This is literally one of its security features. Add it to the list.",
        },
      },
      {
        id: "m2-ransomware",
        title: "Scam: Ransomware",
        body: "Malware that locks or encrypts your device files and demands Bitcoin to restore access. Don't pay — paying funds more ransomware development, and there's no guarantee you'll get your files back. Consult a trusted tech professional. Be extremely careful about what programs you install, especially those requesting administrator access.",
        factionNote: {
          btc: "Bitcoin's pseudonymity makes it the ransom currency of choice. This is the dark side we don't love. Don't feed it.",
        },
      },
      {
        id: "m2-scam-coins",
        title: "Scam: Scam Coins",
        body: "Among thousands of altcoins, many are designed to deceive: flashy websites, inflated community numbers, fake partnerships, presale discounts. Some do airdrops — free tokens to inflate their user metrics. Some use the word 'Bitcoin' in their name to mislead beginners. Vet every project. Look for real audits, real team members, real utility.",
        factionNote: {
          btc: "There is Bitcoin. Everything else requires skepticism. Not nihilism — skepticism.",
          wild: "Welcome to our territory. Here there be dragons. Also sometimes 300x. Know the difference.",
          eth: "Most scam coins copy ETH's codebase. Familiarity is not legitimacy. Always DYOR.",
        },
      },
    ],
  },
  {
    id: "module-3",
    title: "Getting Started Safely",
    description: "Wallets, exchanges, self-custody, and your first steps onto the blockchain.",
    icon: "🔑",
    lessons: [
      {
        id: "m3-mindset",
        title: "The foundational mindset",
        body: "If you're not positive about putting your money there, don't. Don't risk anything you can't afford to lose. This isn't pessimism — it's discipline. Crypto is volatile. Projects fail. Exchanges collapse. Self-custody is the only real protection. Everything else is risk management.",
        factionNote: {
          btc: "Saylor doesn't gamble. He accumulates with conviction. Know your conviction before you deploy capital.",
          wild: "Even the Wildcard knows: only bet what you can watch go to zero and still sleep at night.",
        },
      },
      {
        id: "m3-exchanges",
        title: "How to get money onto the blockchain",
        body: "An exchange is your entry point from regular money (fiat) to crypto. Options like Shakepay (Canada) or Coinbase allow you to deposit via bank transfer or e-transfer, then purchase crypto. Once you buy, move it to a private wallet — don't leave it on the exchange. Exchanges can freeze accounts, get hacked, or shut down.",
        factionNote: {
          btc: "Buy Bitcoin on exchange. Withdraw immediately to cold storage. Repeat. Never leave coins on Coinbase.",
          xrp: "XUMM wallet + Bitstamp or Coinbase. Get XRP, move it, hold your own keys. Army standard.",
          eth: "Coinbase or Kraken to buy ETH, then straight to MetaMask. Set up MetaMask first so you're ready.",
          wild: "Any CEX to buy. Then bridge to whatever chain your altcoin lives on. Usually Ethereum or BSC.",
        },
      },
      {
        id: "m3-kyc",
        title: "KYC and what it means",
        body: "Know Your Customer (KYC) is the identity verification process exchanges require — government ID, selfie, sometimes proof of address. It's required by law in most countries. Your data is now with the exchange. This is the tradeoff for a regulated on-ramp. More regulations will follow as adoption grows. Account for it.",
        factionNote: {
          btc: "KYC is the entry fee for the on-ramp. Use it once, get your coins, then get to self-custody ASAP.",
          wild: "If KYC is a problem, peer-to-peer platforms like LocalCoinSwap or Bisq exist. But know the risk.",
        },
      },
      {
        id: "m3-software-wallets",
        title: "Software wallets",
        body: "A software wallet is an app on your phone or computer that stores your private keys. Examples: MetaMask (ETH), XUMM (XRP), Trust Wallet (multi-chain), Exodus (multi-chain). Convenient for daily use and small amounts. Vulnerable to device compromise, malware, and loss if you don't back up your seed phrase.",
        factionNote: {
          eth: "MetaMask is the Ethereum standard. Install it. Back up your 12-word seed phrase. Write it on paper.",
          xrp: "XUMM (now Xaman) is the XRP standard. Clean interface, real self-custody. Install it first.",
          wild: "Trust Wallet handles most chains. It's the Wildcard's Swiss Army knife.",
        },
      },
      {
        id: "m3-hardware-wallets",
        title: "Hardware wallets",
        body: "A hardware wallet is a physical device (Ledger, Trezor, Coldcard) that stores your private keys offline. To sign a transaction, it must be physically connected. Extremely resistant to online attacks. The gold standard for holding significant crypto. More difficult to set up, but far more secure.",
        factionNote: {
          btc: "Coldcard is the Maxi standard. Air-gapped, open-source, paranoid by design. Exactly right.",
          eth: "Ledger Nano is the common choice. MetaMask connects to it directly. Store your ETH this way.",
          wild: "Even the Wildcard uses a Ledger for coins they actually believe in. Which might be none of them. TBD.",
        },
      },
      {
        id: "m3-seed-phrase",
        title: "Your seed phrase — guard it with your life",
        body: "Your seed phrase is 12 or 24 words generated when you create a wallet. It is the master key to all funds in that wallet. Write it on paper. Store multiple copies in separate physical locations. Never photograph it. Never type it into any website or app. Anyone who has your seed phrase owns your crypto. Period.",
        factionNote: {
          btc: "Not your keys, not your Bitcoin. The seed phrase IS the keys. Treat it like your private key to existence.",
          eth: "Never enter your seed phrase on MetaMask's website, any browser popup, or any app you didn't deliberately open.",
          xrp: "Family secret wallets exist: stamp the seed phrase into metal. Fire-proof, flood-proof, scammer-proof.",
        },
      },
      {
        id: "m3-diversify",
        title: "Keep your eggs in many baskets",
        body: "Don't keep all your crypto in one place: not on one exchange, not in one wallet, not in one coin. Distribute: some on a hardware wallet, some in a software wallet for daily use, some across different assets if you hold multiple. If one wallet is compromised, you don't lose everything.",
        factionNote: {
          btc: "The Maxi caveat: don't diversify into scams. Diversify across wallets and storage types, not into ETH.",
          wild: "Multiple wallets. Multiple chains. Multiple narratives. One bad investment doesn't end the game.",
        },
      },
      {
        id: "m3-keys",
        title: "Not your keys — not your crypto",
        body: "This is the most important sentence in all of crypto. If your coins sit on Coinbase, Kraken, FTX, or any exchange, you don't own them — you own an IOU. FTX customers learned this in 2022 when $8 billion in customer funds disappeared. The only crypto you truly own is what you control with your own private keys.",
        factionNote: {
          btc: "Saylor runs MicroStrategy's Bitcoin on institutional-grade cold storage. If it matters, hold your own keys.",
          eth: "The entire point of DeFi is self-custody. Use it. Your keys, your ETH, your rules.",
          xrp: "XUMM wallet. Your keys. The case is won on the ledger — make sure your XRP is in your wallet when it is.",
          wild: "You don't want to be the person who held 300x potential on a platform that went insolvent. Self-custody.",
        },
      },
    ],
  },
];
