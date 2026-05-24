import type { FactionId } from "./factions";

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface LessonCard {
  id: string;
  title: string;
  body: string;
  videoUrl?: string;
  xpReward?: number;
  quiz?: QuizQuestion[];
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
        xpReward: 25,
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
        xpReward: 25,
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
        xpReward: 25,
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
        xpReward: 25,
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
        xpReward: 25,
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
        xpReward: 25,
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
        xpReward: 25,
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
        xpReward: 30,
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
        xpReward: 30,
        body: "Strangers threaten you via email claiming they've hacked your computer via remote desktop protocol (RDP), accessed your webcam, and have embarrassing footage. They offer two options: send Bitcoin to suppress the material, or have it sent to all your contacts. In reality, they have nothing — they use stolen email lists and send this en masse to thousands of people.",
        factionNote: {
          btc: "Delete. Block. Move on. They have nothing. If you've never done anything embarrassing on camera... actually, never mind.",
        },
      },
      {
        id: "m2-fake-exchanges",
        title: "Scam: Fake Exchanges",
        xpReward: 30,
        body: "As crypto became popular, nefarious operators set up convincing fake exchanges. They offer extremely competitive market prices — better than real markets — to lure users. You deposit funds, maybe even see 'gains' in your dashboard, then try to withdraw and discover the exchange doesn't exist. Always use reputable, well-known exchanges and double-check the URL.",
        factionNote: {
          eth: "Always check the URL character by character. Fake exchanges add one invisible character to look identical.",
        },
      },
      {
        id: "m2-free-giveaways",
        title: "Scam: Free Giveaways",
        xpReward: 30,
        body: "Scammers offer free Bitcoin or other crypto, requiring only that you send a small amount first to 'verify your wallet' — and then you'll receive double back. This is the oldest trick in crypto. Elon Musk did not tweet that. Vitalik is not giving away 5 ETH. MicroStrategy is not doubling your Bitcoin. Nobody is.",
        factionNote: {
          wild: "If it sounds too good to be true in normal life, it's definitely a scam in crypto. Rule one. Only rule.",
          xrp: "The XRP giveaway scams impersonate Brad Garlinghouse constantly. The real Brad does not give away XRP.",
        },
      },
      {
        id: "m2-impersonation",
        title: "Scam: Impersonation",
        xpReward: 30,
        body: "Con-artists create social media accounts nearly identical to real crypto figures — one character off in the username, same profile photo, same bio. They reply to the real person's tweets with fake giveaways, or DM followers directly. Never verify someone's identity based on social media alone. Use multiple channels to confirm.",
        factionNote: {
          btc: "Fake Saylor accounts are everywhere. Real Saylor only tweets about Bitcoin. He does not DM you.",
          xrp: "Fake Joel Katz accounts impersonate the architect constantly. The real CTO is not sliding into your DMs.",
        },
      },
      {
        id: "m2-malware",
        title: "Scam: Malware",
        xpReward: 30,
        body: "Some malware programs, once installed, monitor your clipboard. When you copy a crypto wallet address to paste, the malware silently swaps it with the attacker's address. You paste what looks like your address, send funds, and they're gone forever. Always triple-check the address you're sending to, character by character, before confirming.",
        factionNote: {
          btc: "Double-check. Triple-check. Saylor would check a fourth time. Bitcoin transactions are irreversible.",
        },
      },
      {
        id: "m2-meeting-in-person",
        title: "Scam: Meeting in Person",
        xpReward: 30,
        body: "Local peer-to-peer trades sometimes involve requests to meet in person. This is dangerous — you could be robbed, physically harmed, or handed counterfeit cash. Even if the other party seems legitimate, the risk is not worth the savings on fees. Use peer-to-peer platforms that escrow funds digitally instead.",
        factionNote: {
          wild: "No local trades. No exceptions. Not even for a 10x opportunity. Especially not for a 10x opportunity.",
        },
      },
      {
        id: "m2-money-transfer",
        title: "Scam: Money Transfer Fraud",
        xpReward: 30,
        body: "Someone emails or messages you saying they need help moving money, and you'll receive a cut for your trouble. This is the Nigerian Prince scam, updated for crypto. They need your wallet address, then your private keys, then they're gone. Delete and block.",
        factionNote: {
          eth: "These target everyone. The writing is often urgent, emotional, and full of red flags. Trust those red flags.",
        },
      },
      {
        id: "m2-phishing-emails",
        title: "Scam: Phishing Emails",
        xpReward: 30,
        body: "Emails designed to look identical to legitimate services — Coinbase, Binance, your bank — asking you to click a link and reset your password or verify your account. The link leads to a fake site that steals your credentials. If you're unsure, go to the company's website directly by typing the URL yourself, never by clicking email links.",
        factionNote: {
          xrp: "Fake Ripple emails are epidemic during news cycles. Ripple will not email you about your XRP. Ever.",
        },
      },
      {
        id: "m2-phishing-websites",
        title: "Scam: Phishing Websites",
        xpReward: 30,
        body: "Replica websites designed to steal login credentials or install malware. They appear in sponsored search results, app stores, and via phishing emails. Before logging into any crypto platform, verify the URL is exactly correct — not coinbose.com, not coinbase.co, not c0inbase.com. Bookmark your real exchange URLs.",
        factionNote: {
          btc: "The word 'Bitcoin' in a URL means nothing. Scammers know you'll search for it. Bookmark everything.",
        },
      },
      {
        id: "m2-ponzi",
        title: "Scam: Ponzi & Pyramid Schemes",
        xpReward: 30,
        body: "Ponzi schemes promise guaranteed returns on your deposit — they pay earlier investors using later investors' principal, until they collapse. Pyramid schemes add a twist: your returns depend on recruiting others. Both inevitably collapse. If someone promises guaranteed returns in crypto, they are either naive or lying.",
        factionNote: {
          wild: "Some altcoin projects are structurally Ponzis. The only difference from a scam is how long they last before collapse.",
          eth: "DeFi yields can look like Ponzis. Understand the mechanism. If the yield source is 'other deposits,' run.",
        },
      },
      {
        id: "m2-prize-giveaways",
        title: "Scam: Prize Giveaways",
        xpReward: 30,
        body: "You've won crypto! Just provide your name, address, email, phone number, and wallet address to claim your prize. This is an information harvest — they're collecting data to impersonate you, access your accounts, or sell your details. You didn't win anything. Nobody randomly gives away crypto.",
        factionNote: {
          xrp: "Fake XRP prize giveaways targeted Army members specifically during the SEC case. Stay sharp.",
        },
      },
      {
        id: "m2-pump-dump",
        title: "Scam: Pump & Dump",
        xpReward: 30,
        body: "Coordinators buy a coin cheap, then aggressively promote it across social media and group chats — 'This is about to 100x!' Once the price pumps from their promotion, they dump their holdings on the buyers. The price crashes. You're left holding a worthless coin. Never buy based on hype in a Telegram group.",
        factionNote: {
          wild: "Every Shitcoin group has at least one pump & dump happening. Knowing which is which is the skill.",
          btc: "Bitcoin is too large to pump & dump. This is literally one of its security features. Add it to the list.",
        },
      },
      {
        id: "m2-ransomware",
        title: "Scam: Ransomware",
        xpReward: 30,
        body: "Malware that locks or encrypts your device files and demands Bitcoin to restore access. Don't pay — paying funds more ransomware development, and there's no guarantee you'll get your files back. Consult a trusted tech professional. Be extremely careful about what programs you install, especially those requesting administrator access.",
        factionNote: {
          btc: "Bitcoin's pseudonymity makes it the ransom currency of choice. This is the dark side we don't love. Don't feed it.",
        },
      },
      {
        id: "m2-scam-coins",
        title: "Scam: Scam Coins",
        xpReward: 30,
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
        xpReward: 35,
        body: "If you're not positive about putting your money there, don't. Don't risk anything you can't afford to lose. This isn't pessimism — it's discipline. Crypto is volatile. Projects fail. Exchanges collapse. Self-custody is the only real protection. Everything else is risk management.",
        factionNote: {
          btc: "Saylor doesn't gamble. He accumulates with conviction. Know your conviction before you deploy capital.",
          wild: "Even the Wildcard knows: only bet what you can watch go to zero and still sleep at night.",
        },
      },
      {
        id: "m3-exchanges",
        title: "How to get money onto the blockchain",
        xpReward: 35,
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
        xpReward: 35,
        body: "Know Your Customer (KYC) is the identity verification process exchanges require — government ID, selfie, sometimes proof of address. It's required by law in most countries. Your data is now with the exchange. This is the tradeoff for a regulated on-ramp. More regulations will follow as adoption grows. Account for it.",
        factionNote: {
          btc: "KYC is the entry fee for the on-ramp. Use it once, get your coins, then get to self-custody ASAP.",
          wild: "If KYC is a problem, peer-to-peer platforms like LocalCoinSwap or Bisq exist. But know the risk.",
        },
      },
      {
        id: "m3-software-wallets",
        title: "Software wallets",
        xpReward: 35,
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
        xpReward: 35,
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
        xpReward: 35,
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
        xpReward: 35,
        body: "Don't keep all your crypto in one place: not on one exchange, not in one wallet, not in one coin. Distribute: some on a hardware wallet, some in a software wallet for daily use, some across different assets if you hold multiple. If one wallet is compromised, you don't lose everything.",
        factionNote: {
          btc: "The Maxi caveat: don't diversify into scams. Diversify across wallets and storage types, not into ETH.",
          wild: "Multiple wallets. Multiple chains. Multiple narratives. One bad investment doesn't end the game.",
        },
      },
      {
        id: "m3-keys",
        title: "Not your keys — not your crypto",
        xpReward: 35,
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
  {
    id: "module-4",
    title: "Bitcoin Mechanics",
    description: "The halving, the UTXO model, mining, the Lightning Network, and why 21 million is sacred.",
    icon: "₿",
    lessons: [
      {
        id: "m4-halving",
        title: "The Bitcoin Halving",
        xpReward: 50,
        videoUrl: "https://www.investopedia.com/bitcoin-halving-4843769",
        body: "Every 210,000 blocks — roughly every four years — the reward miners receive for adding a new block to the Bitcoin blockchain is cut in half. This is called the halving. In 2009 the reward was 50 BTC per block. In 2024 it dropped to 3.125 BTC. When the last halving happens around the year 2140, no new Bitcoin will ever be issued again.\n\nThe halving creates predictable, programmatic scarcity. Nobody can change it — it is written into the protocol. Every halving in history has been followed by a major bull run as the new supply rate drops while demand grows. It is scheduled inflation-reduction, forever, on a public calendar.",
        factionNote: {
          btc: "The halving is Bitcoin's heartbeat. Saylor models it as the single most powerful supply-side event in financial history. Stack before it arrives.",
          eth: "ETH has no halving — but The Merge introduced fee burning that can make it deflationary anyway. Different mechanism, similar pressure.",
          xrp: "XRP's supply is managed differently: Ripple releases from escrow monthly. Predictable, but not the same as Bitcoin's enforced scarcity.",
          wild: "Your altcoin probably has an 'emission schedule' that reads great in the whitepaper. Check the actual vesting cliff. Most 300x dreams die on unlock day.",
        },
        quiz: [
          {
            question: "How often does the Bitcoin halving occur?",
            options: [
              "Every 100,000 blocks (~2 years)",
              "Every 210,000 blocks (~4 years)",
              "Every calendar year",
              "Every 500,000 blocks (~10 years)",
            ],
            correct: 1,
            explanation: "The halving fires every 210,000 blocks — approximately every four years given Bitcoin's ~10-minute average block time. It cannot be changed by anyone.",
          },
          {
            question: "What was the Bitcoin block reward after the April 2024 halving?",
            options: ["6.25 BTC", "3.125 BTC", "1.5625 BTC", "12.5 BTC"],
            correct: 1,
            explanation: "The 2024 halving cut the reward from 6.25 BTC to 3.125 BTC. The original reward in 2009 was 50 BTC. Each halving cuts it in half.",
          },
        ],
      },
      {
        id: "m4-utxo",
        title: "How Bitcoin Actually Tracks Ownership: UTXO",
        xpReward: 50,
        videoUrl: "https://www.investopedia.com/terms/u/utxo.asp",
        body: "Bitcoin doesn't store balances the way your bank does. It tracks Unspent Transaction Outputs (UTXOs). When you receive Bitcoin, the transaction creates a UTXO — an output that hasn't been spent yet. When you spend Bitcoin, you consume existing UTXOs as inputs and create new UTXOs as outputs. Your 'balance' is just the sum of all UTXOs associated with your addresses.\n\nThis model has profound privacy and security properties: every satoshi has a verifiable history all the way back to when it was mined. It makes double-spending mathematically impossible without controlling the majority of the network's hashrate. It also means Bitcoin transactions are nothing like credit card transactions — they're closer to handing someone a physical bearer bond.",
        factionNote: {
          btc: "UTXOs are why Bitcoin is the most auditable monetary system ever built. Every sat, traced to genesis. Nobody fakes the ledger.",
          eth: "Ethereum uses an account model (like a bank balance). Simpler for smart contracts, but UTXO's auditability is hard to beat.",
          xrp: "The XRP Ledger also uses an account model. Efficient for payment routing, especially across currencies.",
          wild: "Most alt chains copied Ethereum's account model. UTXO is harder to implement well. That's partially why so few did it.",
        },
        quiz: [
          {
            question: "What does UTXO stand for?",
            options: [
              "Universal Token eXchange Object",
              "Unspent Transaction Output",
              "Unified Transaction Verification Operation",
              "Unlocked Transfer eXchange Order",
            ],
            correct: 1,
            explanation: "UTXO stands for Unspent Transaction Output. Your Bitcoin 'balance' is the sum of all UTXOs controlled by your keys — there's no single account balance stored anywhere.",
          },
          {
            question: "What makes double-spending impossible in the UTXO model?",
            options: [
              "The government monitors all transactions",
              "Each UTXO can only be consumed once as a transaction input",
              "Exchanges verify every spend manually",
              "Miners approve each address individually",
            ],
            correct: 1,
            explanation: "Once a UTXO is used as an input, it is permanently consumed and new UTXOs are created. The entire network simultaneously rejects any attempt to spend the same UTXO twice.",
          },
        ],
      },
      {
        id: "m4-mining",
        title: "Proof of Work and Mining Difficulty",
        xpReward: 50,
        videoUrl: "https://www.investopedia.com/tech/how-does-bitcoin-mining-work/",
        body: "Bitcoin miners compete to solve a computationally expensive puzzle: find a number (the 'nonce') that, combined with the block data, produces a hash starting with a certain number of zeroes. This is called Proof of Work. The puzzle is hard to solve but trivial to verify — the whole network can confirm a valid solution in milliseconds.\n\nEvery 2,016 blocks (about two weeks), Bitcoin automatically adjusts how hard the puzzle is. If miners are finding blocks faster than one every ten minutes, difficulty goes up. If slower, it goes down. This self-correcting mechanism is why Bitcoin has maintained roughly 10-minute block times for 15 years, even as computing power grew by orders of magnitude. Nobody set the difficulty. The protocol set it.",
        factionNote: {
          btc: "The difficulty adjustment is one of Satoshi's greatest inventions. It is the immune system of the Bitcoin network. It cannot be gamed from the outside.",
          eth: "Ethereum abandoned Proof of Work in 2022 with The Merge. ETH heads argue PoS is more energy-efficient. Maxis argue PoW is battle-tested security. Both have a point.",
          xrp: "The XRP Ledger doesn't use mining at all — it uses a federated consensus mechanism. Faster, but the trust assumptions are different.",
          wild: "Most chains use Proof of Stake now. Proof of Work is 'the old way' to new money. To maxis, it's the only way.",
        },
        quiz: [
          {
            question: "What does Bitcoin's difficulty adjustment target?",
            options: [
              "One block every minute",
              "One block every 10 minutes",
              "One block every hour",
              "One block per day",
            ],
            correct: 1,
            explanation: "Bitcoin adjusts its mining difficulty every 2,016 blocks to maintain a ~10-minute average block time. This self-correction has kept the target consistent for over 15 years regardless of how much mining power exists.",
          },
          {
            question: "What is a 'nonce' in Bitcoin mining?",
            options: [
              "A type of cryptocurrency wallet",
              "A number miners iterate through to find a valid block hash",
              "The block reward paid to miners",
              "The transaction fee priority setting",
            ],
            correct: 1,
            explanation: "A nonce (Number Used Once) is a value miners change repeatedly until the resulting block hash meets the current difficulty target — starting with enough leading zeroes. Finding a valid nonce is computational work; verifying it takes milliseconds.",
          },
        ],
      },
      {
        id: "m4-lightning",
        title: "The Lightning Network",
        xpReward: 50,
        videoUrl: "https://lightning.network/",
        body: "Bitcoin's main chain processes about 7 transactions per second globally. Visa processes thousands. The Lightning Network is a Layer 2 solution that fixes this without changing Bitcoin itself.\n\nTwo parties open a payment channel by locking some Bitcoin in a multi-signature address on-chain. From that point, they can exchange unlimited instant, near-zero-fee transactions between themselves — none of which touch the main chain. When they close the channel, only the final balances settle on-chain. Lightning nodes route payments across channels, meaning you don't need a direct channel with everyone you want to pay. El Salvador's entire national Bitcoin payment system runs on Lightning. It works today.",
        factionNote: {
          btc: "Lightning is proof that Bitcoin scales without changing the base layer. El Salvador proved it at a national level. The trolls were wrong.",
          eth: "ETH's scaling happened at the Layer 2 level too — Arbitrum, Optimism, Base. Different architecture, same principle: keep the base layer secure, scale above it.",
          xrp: "XRP's base layer settles in 3-5 seconds for fractions of a cent. It doesn't need Lightning — it's already fast at L1.",
          wild: "Solana and others claim to make Lightning unnecessary by going faster at L1. The debate over trade-offs is very much alive.",
        },
        quiz: [
          {
            question: "How does the Lightning Network improve Bitcoin's throughput?",
            options: [
              "By increasing the block size limit",
              "By adding more coins to the supply",
              "By enabling instant off-chain payments through payment channels that settle on Bitcoin only on open/close",
              "By replacing the Bitcoin blockchain with a faster system",
            ],
            correct: 2,
            explanation: "Lightning creates bidirectional payment channels between parties. Unlimited payments happen instantly off-chain. Only the opening and final closing transactions hit the Bitcoin blockchain, massively reducing on-chain load.",
          },
          {
            question: "Which country built its national Bitcoin payment system on the Lightning Network?",
            options: ["United States", "Japan", "El Salvador", "Switzerland"],
            correct: 2,
            explanation: "El Salvador adopted Bitcoin as legal tender in 2021 and built the Chivo wallet on the Lightning Network for national payments. It remains the highest-profile real-world Lightning deployment.",
          },
        ],
      },
      {
        id: "m4-supply",
        title: "Why 21 Million is the Most Important Number in Finance",
        xpReward: 50,
        videoUrl: "https://www.investopedia.com/tech/what-happens-bitcoin-after-21-million-mined/",
        body: "There will never be more than 21 million Bitcoin. This isn't a policy choice — it is a mathematical guarantee enforced by every node on the network simultaneously. Unlike every fiat currency in history, there is no committee that can vote to print more. No emergency exception. No wartime override.\n\nAs of 2024, about 19.7 million Bitcoin have been mined. The remaining ~1.3 million will trickle out over the next 100+ years through halvings. Roughly 3-4 million are estimated permanently lost — sent to dead wallets, forgotten seeds, destroyed drives. The real circulating supply may be closer to 15-16 million. Fixed supply plus growing demand has one mathematical outcome. The Maxi thesis starts and ends here.",
        factionNote: {
          btc: "21 million is not just a cap. It is the entire value proposition compressed into one number. Saylor has said it a thousand times. He'll say it a thousand more.",
          eth: "ETH has no hard cap, but since EIP-1559 and The Merge, it can be deflationary. The total supply has actually decreased in periods of high network activity.",
          xrp: "100 billion XRP were pre-minted at genesis. About 55 billion are in circulation; the rest in Ripple escrow. Very different distribution from Bitcoin.",
          wild: "Check total supply, circulating supply, and team vesting schedule before any buy. Tokenomics kill more projects than bad tech.",
        },
        quiz: [
          {
            question: "How many Bitcoin will ever exist?",
            options: [
              "100 billion",
              "21 million",
              "1 billion",
              "Unlimited — new ones are continuously mined",
            ],
            correct: 1,
            explanation: "There will only ever be 21 million Bitcoin. This hard cap is enforced by every node in the network simultaneously and cannot be changed by anyone — not miners, not governments, not developers.",
          },
          {
            question: "Approximately how many Bitcoin are estimated to be permanently lost?",
            options: [
              "Fewer than 100,000",
              "3–4 million",
              "10 million",
              "None — all Bitcoin are recoverable",
            ],
            correct: 1,
            explanation: "Researchers estimate 3–4 million Bitcoin are permanently lost — sent to dead wallets, forgotten seed phrases, or destroyed hardware. This makes Bitcoin's true circulating supply even scarcer than the 21M cap suggests.",
          },
        ],
      },
    ],
  },
  {
    id: "module-5",
    title: "Ethereum & The Merge",
    description: "Proof of Stake, smart contracts, gas mechanics, DeFi, and how ETH became deflationary.",
    icon: "Ξ",
    lessons: [
      {
        id: "m5-merge",
        title: "The Merge: How ETH Killed Its Own Mining Industry",
        xpReward: 50,
        videoUrl: "https://ethereum.org/en/roadmap/merge/",
        body: "On September 15, 2022, Ethereum completed 'The Merge' — switching from Proof of Work to Proof of Stake in a single coordinated event. No new chain. No hard fork users had to migrate to. The existing Ethereum blockchain simply switched its consensus mechanism mid-flight, like changing a plane's engine at 35,000 feet.\n\nOvernight, Ethereum's energy consumption dropped by ~99.95%. The entire GPU mining industry for ETH — billions of dollars in hardware — was instantly obsolete. Validators replaced miners: instead of computing puzzles, they stake 32 ETH as collateral and are chosen to propose blocks proportionally to their stake. Get it wrong or act maliciously, and your stake gets 'slashed' — partially destroyed. It's security through economic skin in the game.",
        factionNote: {
          eth: "The Merge was the most technically complex live upgrade in blockchain history. It went perfectly. No downtime. No lost funds. The doubters were wrong.",
          btc: "Proof of Stake replaces energy cost with financial stake. Maxis argue that energy-based security (PoW) is more objective and harder to corrupt. Ongoing debate.",
          xrp: "XRP has used federated consensus since day one — no mining, low energy. The XRP Army watched ETH spend 8 years getting to where XRP started.",
          wild: "Most new chains launched as Proof of Stake from the start. ETH showed it can be done. Now every chain pitches 'greener than ETH.'",
        },
        quiz: [
          {
            question: "What did 'The Merge' fundamentally change about Ethereum?",
            options: [
              "It switched from Proof of Stake to Proof of Work",
              "It switched from Proof of Work to Proof of Stake",
              "It raised Ethereum's total supply cap",
              "It merged the Ethereum and Bitcoin blockchains",
            ],
            correct: 1,
            explanation: "The Merge (Sept 15, 2022) transitioned Ethereum from energy-intensive Proof of Work mining to Proof of Stake validation, without creating a new chain or requiring user migration.",
          },
          {
            question: "By approximately how much did The Merge reduce Ethereum's energy consumption?",
            options: ["About 10%", "About 50%", "About 99.95%", "Energy use actually increased"],
            correct: 2,
            explanation: "By eliminating GPU mining, The Merge reduced Ethereum's energy consumption by approximately 99.95% — among the largest single-event energy reductions in the history of computing infrastructure.",
          },
        ],
      },
      {
        id: "m5-smart-contracts",
        title: "Smart Contracts: Code That Executes Itself",
        xpReward: 50,
        videoUrl: "https://ethereum.org/en/smart-contracts/",
        body: "A smart contract is a program stored on the Ethereum blockchain that runs automatically when predetermined conditions are met. Nobody controls it. Nobody can stop it. Once deployed, it executes exactly as written.\n\nExamples: a crowdfunding contract that releases funds to a project only if a target is hit by a deadline — otherwise refunds everyone automatically. A lending protocol that liquidates collateral when a price threshold is crossed. A decentralized exchange that swaps tokens without an intermediary taking a cut. Thousands of financial services that ran on trust and middlemen now run on transparent, unstoppable code. Ethereum was the first blockchain to make this practical at scale. Everything in DeFi, most of NFTs, and all of the 'web3' ecosystem is built on smart contracts.",
        factionNote: {
          eth: "Smart contracts are the reason Ethereum exists. Vitalik invented the concept of a general-purpose programmable blockchain. Everything after is a derivative.",
          btc: "Bitcoin has limited scripting. It's deliberate — simplicity is a security feature. Bitcoin Script does what it needs to. Turing-completeness is a liability.",
          xrp: "The XRP Ledger added smart contract functionality through Hooks (in development) and via sidechains like the EVM sidechain. The core ledger focuses on payments.",
          wild: "Every smart contract chain (Solana, Avalanche, BNB Chain, etc.) is competing to be the fastest/cheapest Ethereum. The 'EVM wars' are very much alive.",
        },
        quiz: [
          {
            question: "What is a smart contract?",
            options: [
              "A legal document filed with a government agency",
              "A bank account with special transaction rules",
              "Self-executing code deployed on a blockchain that runs automatically when conditions are met",
              "An agreement signed between two crypto exchanges",
            ],
            correct: 2,
            explanation: "Smart contracts are programs stored on the blockchain that execute automatically — no intermediary needed. They are the foundation of DeFi, NFTs, DAOs, and the broader web3 ecosystem.",
          },
          {
            question: "What makes a deployed smart contract 'unstoppable'?",
            options: [
              "Governments legally protect them once filed",
              "It runs across the decentralized network — no single party, including the creator, can halt it",
              "The original developer keeps it running on their server",
              "Ethereum validators manually approve each execution",
            ],
            correct: 1,
            explanation: "Once deployed to the Ethereum blockchain, a smart contract runs across thousands of nodes. No single party — including its creator — can prevent it from executing as written. This is what makes it trustless.",
          },
        ],
      },
      {
        id: "m5-gas",
        title: "Gas: The Fee System That Broke Everyone's Heart",
        xpReward: 50,
        videoUrl: "https://ethereum.org/en/developers/docs/gas/",
        body: "Every operation on Ethereum costs 'gas' — a unit measuring computational work. Simple transfers cost 21,000 gas units. Complex smart contract interactions cost hundreds of thousands. The price per unit (in gwei, a fraction of ETH) fluctuates with network demand: when everyone wants to transact simultaneously, fees spike. In 2021, a single NFT mint sometimes cost $200–500 in fees.\n\nEIP-1559, deployed in 2021, changed the fee market fundamentally. Instead of a pure auction, there's now a base fee — algorithmically set and burned (destroyed) rather than paid to miners. Users can add a 'tip' for priority. This burning mechanism made ETH deflationary during high-activity periods: more ETH burned in fees than issued as validator rewards. Gas is still ETH's main UX problem, which is why Layer 2 networks like Arbitrum and Base exist — they batch thousands of transactions and settle once on mainnet.",
        factionNote: {
          eth: "EIP-1559 and Layer 2s are fixing gas. Average L2 fees today are fractions of a cent. The mainnet remains expensive by design — it's not for everyday coffee.",
          btc: "Bitcoin fees spiked too during inscription mania in 2023. The difference: Bitcoin fees are voluntary tips. ETH gas is mandatory for any interaction.",
          xrp: "XRP fees are a fraction of a drop (the smallest unit). Sending $1,000,000 in XRP costs about $0.0003. The Army points this out constantly.",
          wild: "Gas fees killed several DeFi use cases on mainnet. Every cheap chain (Polygon, Avalanche, BSC) exists because ETH gas was too expensive. The disruption is real.",
        },
        quiz: [
          {
            question: "What did EIP-1559 change about Ethereum's fee mechanism?",
            options: [
              "It eliminated all fees permanently",
              "It introduced a base fee that is burned rather than paid to validators",
              "It fixed the gas price at exactly 21,000 per transaction",
              "It moved all fee calculations off-chain to Layer 2",
            ],
            correct: 1,
            explanation: "EIP-1559 introduced a base fee that the network burns (destroys) instead of paying to validators. During periods of high activity, more ETH is burned than created — making ETH potentially deflationary.",
          },
          {
            question: "Why do Layer 2 networks like Arbitrum and Base exist?",
            options: [
              "They replace Ethereum entirely with a faster blockchain",
              "They store Ethereum's data on centralized servers to reduce cost",
              "They provide faster, cheaper transactions while inheriting Ethereum's security through periodic L1 settlements",
              "They are test networks for experimental Ethereum features",
            ],
            correct: 2,
            explanation: "Layer 2 networks batch thousands of transactions and post compressed proofs to Ethereum mainnet. Users get sub-cent fees and fast confirmations while the security guarantee comes from the Ethereum base layer.",
          },
        ],
      },
      {
        id: "m5-defi",
        title: "DeFi: Traditional Finance, Without the Finance",
        xpReward: 50,
        videoUrl: "https://ethereum.org/en/defi/",
        body: "Decentralized Finance (DeFi) is the ecosystem of financial services built on smart contracts — primarily on Ethereum. Lending, borrowing, trading, earning yield, insurance — all operating through code, without banks, brokers, or custodians.\n\nKey protocols: Uniswap (decentralized exchange — swap any ERC-20 token without a company), Aave (lending and borrowing — deposit ETH as collateral, borrow stablecoins), MakerDAO (create the DAI stablecoin by locking ETH), Compound (earn interest on deposits automatically). At peak in 2021, over $100 billion was locked in DeFi protocols. The risks are real: smart contract bugs (the DAO hack, countless others), liquidations during volatility, and protocol exploits have cost billions. Understanding DeFi means understanding both the opportunity and the mechanism of loss.",
        factionNote: {
          eth: "DeFi is why ETH has value beyond being money. It is the financial layer of the internet, and ETH is the fuel it runs on.",
          btc: "DeFi on Bitcoin is emerging (via wrapped BTC, Lightning, Ordinals). Maxis argue native DeFi isn't Bitcoin's job — it's fine to let ETH do it.",
          xrp: "Ripple's DEX is built into the XRP Ledger itself — it's one of the oldest DEXes in crypto. The Army doesn't always talk about it, but it's there.",
          wild: "DeFi is the Wildcard's natural habitat. The best yields are usually in the newest protocols. So are the biggest rug pulls. Pick your farms carefully.",
        },
        quiz: [
          {
            question: "What does DeFi stand for?",
            options: [
              "Digital Financial Interface",
              "Decentralized Finance",
              "Distributed Fee Infrastructure",
              "Direct Funds Integration",
            ],
            correct: 1,
            explanation: "DeFi stands for Decentralized Finance — the ecosystem of financial services (lending, borrowing, trading, yield) built on smart contracts without traditional banks or intermediaries.",
          },
          {
            question: "In DeFi lending protocols like Aave, how do you borrow?",
            options: [
              "Provide a government ID and pass a credit check",
              "Deposit crypto collateral and borrow against it — with automatic smart contract liquidation if value drops too far",
              "Pay a monthly subscription fee for unlimited borrowing access",
              "Apply through a decentralized application committee review",
            ],
            correct: 1,
            explanation: "DeFi lending is over-collateralized and automated. You deposit crypto, borrow against it up to a threshold, and a smart contract automatically liquidates your collateral if it falls below the required ratio — no human approval needed.",
          },
        ],
      },
      {
        id: "m5-pos",
        title: "How Proof of Stake Security Actually Works",
        xpReward: 50,
        videoUrl: "https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/",
        body: "In Ethereum's Proof of Stake, validators must lock up (stake) 32 ETH to participate in block production. They are randomly selected to propose blocks and to vote (attest) on blocks proposed by others. The randomness prevents manipulation — you can't predict when you'll be chosen far in advance.\n\nIf a validator tries to cheat — for example, by signing two conflicting blocks (double voting) — the protocol detects it and slashes their stake: destroying a portion of their 32 ETH. This makes attacks economically irrational at scale. To attack the network, you'd need to control ~33% of all staked ETH (over $30 billion at current prices), and the attempt itself would slash your stake, destroying the capital you used to mount the attack. Security through mutually assured financial destruction.",
        factionNote: {
          eth: "Slashing is Ethereum's immune system. It turns economic self-interest into network protection. Vitalik designed this as a feature, not a feature request.",
          btc: "PoW security is physical: it costs real energy and hardware. PoS security is financial: it costs staked capital. Maxis argue energy-based security is more objective and harder to fake.",
          xrp: "XRP consensus doesn't use staking or mining. Trusted validators agree on transaction order — it's fast but the trust model is federated rather than purely adversarial.",
          wild: "Most PoS chains have much lower staking requirements. Lower barrier to validate = more validators = more decentralized. Or it means cheaper attacks. Depends on the tokenomics.",
        },
        quiz: [
          {
            question: "How much ETH must a validator stake to participate in Ethereum's Proof of Stake?",
            options: ["1 ETH", "10 ETH", "32 ETH", "100 ETH"],
            correct: 2,
            explanation: "Ethereum validators must stake exactly 32 ETH as collateral. This economic commitment creates the incentive to behave honestly — malicious behavior destroys part or all of your stake.",
          },
          {
            question: "What is 'slashing' in Ethereum Proof of Stake?",
            options: [
              "Reducing transaction fees for frequent users",
              "A validator having part of their staked ETH destroyed as punishment for provably malicious behavior",
              "Converting ETH to stablecoins automatically",
              "A type of phishing attack targeting validator nodes",
            ],
            correct: 1,
            explanation: "Slashing permanently destroys a portion of a validator's staked ETH if they demonstrably act maliciously — such as double-signing conflicting blocks. It makes large-scale attacks economically self-defeating.",
          },
        ],
      },
    ],
  },
  {
    id: "module-6",
    title: "XRP Ledger Mechanics",
    description: "Consensus without mining, escrow, payment channels, the SEC battle, and why banks actually care.",
    icon: "✕",
    lessons: [
      {
        id: "m6-consensus",
        title: "How the XRP Ledger Reaches Agreement (Without Mining)",
        xpReward: 50,
        videoUrl: "https://xrpl.org/consensus.html",
        body: "The XRP Ledger uses a federated Byzantine Agreement consensus mechanism — completely different from Bitcoin's Proof of Work or Ethereum's Proof of Stake. No miners. No validators staking tokens. Instead, a set of trusted validator nodes — operated by banks, universities, exchanges, and Ripple itself — vote on transaction sets every 3-5 seconds.\n\nEach node maintains a Unique Node List (UNL) — the validators it trusts to be honest. For a transaction to be confirmed, it needs agreement from an overlapping supermajority (80%) across UNLs. Because the validators are known and accountable institutions rather than anonymous miners, the system settles in seconds with finality — no 6-confirmation waits, no reorgs. The tradeoff: it requires trusting the validator set, which is more federated than Bitcoin's permissionless mining.",
        factionNote: {
          xrp: "The Army knows: federated consensus is not centralized. 130+ independent validators run the network. Ripple can't shut it down — they control about 6 of them.",
          btc: "Bitcoin maxis point to the UNL as a trust layer that doesn't exist in PoW. In Bitcoin, you trust math. In XRP, you trust a list of institutions. Both perspectives are valid.",
          eth: "Ethereum's validator set has over 900,000 validators as of 2024 — vastly more distributed than XRPL's validator set. Different points on the decentralization spectrum.",
          wild: "Many DeFi chains run with 21 validators or fewer (looking at you, BNB Chain). At least XRPL is transparent about its validator model.",
        },
        quiz: [
          {
            question: "What consensus mechanism does the XRP Ledger use?",
            options: [
              "Proof of Work (like Bitcoin)",
              "Proof of Stake (like Ethereum post-Merge)",
              "Federated Byzantine Agreement",
              "Delegated Proof of Authority",
            ],
            correct: 2,
            explanation: "The XRP Ledger uses Federated Byzantine Agreement. Trusted validators vote on transaction sets every 3-5 seconds, reaching finality without mining or token staking.",
          },
          {
            question: "What is a 'Unique Node List' (UNL) in the XRP Ledger?",
            options: [
              "A registry of large XRP whale addresses",
              "The set of validators each node trusts to be honest when reaching consensus",
              "A list of banned or suspicious addresses",
              "Ripple's internal list of enterprise partners",
            ],
            correct: 1,
            explanation: "Each XRP node maintains a UNL — a set of validators it trusts to behave honestly. For a transaction to confirm, an overlapping 80%+ supermajority across UNLs must agree.",
          },
        ],
      },
      {
        id: "m6-escrow",
        title: "The Ripple Escrow: 55 Billion XRP Under Lock and Key",
        xpReward: 50,
        videoUrl: "https://xrpl.org/escrow.html",
        body: "When XRP was created, 100 billion coins were minted at genesis — no mining required. Ripple Labs (the company) received a large allocation. In 2017, Ripple placed 55 billion XRP into cryptographic escrow: a series of smart contracts on the XRP Ledger that release a maximum of 1 billion XRP per month, on a 55-month schedule. Any XRP not sold during a given month gets locked into a new escrow at the back of the queue.\n\nThis was designed to create supply predictability. Critics argued it still gives Ripple enormous market power. Supporters argue the escrow mechanism itself is transparent and immutable — Ripple cannot accelerate the release even if they wanted to. As of 2024, roughly 45 billion XRP remain in escrow. The monthly releases and Ripple's treasury management are closely watched by the XRP Army for impact on price.",
        factionNote: {
          xrp: "The escrow is on-chain. It's public. Anyone can verify the release schedule in real time. This is more transparent than any central bank's balance sheet.",
          btc: "Maxis argue this is the difference between Bitcoin and XRP in one fact: Ripple controls 55 billion coins that can enter the market on a schedule they manage. That's not scarcity.",
          eth: "The Ethereum Foundation also holds significant ETH. The key difference is no lock-up mechanism — they can sell freely. Both communities debate foundation holdings.",
          wild: "Most altcoin teams hold vested allocations too. The XRP escrow is at least programmatic and public. Many projects use opacity instead. XRP wins on transparency here.",
        },
        quiz: [
          {
            question: "How much XRP did Ripple place into cryptographic escrow in 2017?",
            options: [
              "1 billion XRP",
              "10 billion XRP",
              "55 billion XRP",
              "All 100 billion XRP",
            ],
            correct: 2,
            explanation: "Ripple locked 55 billion XRP into on-chain escrow contracts that release a maximum of 1 billion XRP per month over a 55-month rolling schedule. The mechanism is public and immutable.",
          },
          {
            question: "What happens to escrow funds that are NOT sold in a given month?",
            options: [
              "They are permanently burned",
              "They are kept by Ripple executives as a bonus",
              "They are locked into a new escrow at the back of the 55-month queue",
              "They are distributed proportionally to all XRP holders",
            ],
            correct: 2,
            explanation: "Unsold monthly escrow releases are re-locked into new escrow contracts at the back of the queue, extending the schedule. This keeps the release mechanism transparent, predictable, and immutable.",
          },
        ],
      },
      {
        id: "m6-sec",
        title: "The SEC Lawsuit: What Happened and Why It Mattered",
        xpReward: 50,
        videoUrl: "https://ripple.com/insights/",
        body: "In December 2020, the U.S. Securities and Exchange Commission filed a lawsuit against Ripple Labs, CEO Brad Garlinghouse, and co-founder Chris Larsen, alleging that XRP was an unregistered security — meaning Ripple had been conducting an illegal securities offering since 2013.\n\nIn July 2023, Judge Analisa Torres issued a landmark ruling: XRP sold on public exchanges to retail buyers was NOT a security. XRP sold directly to institutional buyers under contracts with investment expectations WAS a security in those specific transactions. This split ruling was a major win for Ripple and the broader crypto industry — it established that a token can be sold in ways that constitute securities offerings without the token itself being a security. In 2024, an appellate decision further clarified the ruling. Ripple paid a $125 million settlement. The case reshaped how the U.S. government approaches crypto regulation.",
        factionNote: {
          xrp: "The Army held through 4 years of legal battle. The ruling was vindication. And it set legal precedent that protects the entire industry, not just XRP.",
          btc: "The SEC has not pursued Bitcoin as a security — its status as a commodity is widely accepted. The XRP ruling reinforces that not all crypto fits the same legal box.",
          eth: "ETH's status was also murky after The Merge. The SEC's XRP ruling helped clarify that secondary market sales of tokens aren't automatically securities transactions.",
          wild: "Many altcoin projects have real securities exposure under the Howey Test. The XRP ruling gave the space a framework. Your altcoin's legal team should understand this.",
        },
        quiz: [
          {
            question: "What was the key finding in the 2023 XRP court ruling?",
            options: [
              "XRP is a security in all circumstances",
              "XRP sold on public exchanges to retail was NOT a security; but direct institutional sales under investment contracts were",
              "Ripple was found not guilty on all counts",
              "XRP was formally declared a commodity by the SEC",
            ],
            correct: 1,
            explanation: "Judge Torres issued a split ruling: retail exchange sales of XRP were not securities transactions, but Ripple's direct institutional sales with investment expectations were. This distinction set crucial crypto legal precedent in the U.S.",
          },
          {
            question: "How much did Ripple pay to settle with the SEC?",
            options: [
              "$10 million",
              "$125 million",
              "$1 billion",
              "$0 — they won completely and paid nothing",
            ],
            correct: 1,
            explanation: "Ripple paid $125 million to settle the remaining institutional sales aspect of the case. The core ruling on retail XRP sales remained favorable to Ripple, and the settlement amount was far below the $2 billion the SEC originally sought.",
          },
        ],
      },
      {
        id: "m6-odl",
        title: "On-Demand Liquidity: How XRP Bridges Currencies",
        xpReward: 50,
        videoUrl: "https://ripple.com/solutions/crypto-liquidity/",
        body: "Traditional international wire transfers are slow and expensive because banks must pre-fund correspondent accounts in destination currencies — billions of dollars parked in accounts around the world, doing nothing, just to enable transfers. Ripple's On-Demand Liquidity (ODL) product uses XRP as a bridge currency to eliminate this.\n\nHere's the flow: a payment processor in the U.S. converts USD to XRP, sends the XRP across the XRP Ledger (settles in 3-5 seconds), a partner in Mexico converts the XRP to MXN, which arrives in the recipient's account. The entire journey takes under 30 seconds. Pre-funded accounts aren't needed. The capital sits in XRP for seconds rather than in foreign bank accounts for months. Partners using ODL include Azimo, TransferGo, and over 300 financial institutions globally. This is the 'utility' that the XRP Army references.",
        factionNote: {
          xrp: "ODL is proof of concept at scale. Hundreds of millions in real cross-border payments are flowing through XRP every month. This isn't vaporware.",
          btc: "Bitcoin's Lightning Network is being developed for cross-border payments too. It's newer and smaller in institutional adoption, but growing.",
          eth: "ETH-based stablecoins (USDC, USDT) also facilitate cross-border transfers cheaply on L2s. Multiple settlement layers are competing for this market.",
          wild: "Stellar (XLM) competes directly with XRP in the cross-border payment corridor. The Wildcard watches both — the race for SWIFT's replacement is real.",
        },
        quiz: [
          {
            question: "What problem does Ripple's On-Demand Liquidity (ODL) solve?",
            options: [
              "It replaces Bitcoin as a global store of value",
              "It eliminates the need for banks to pre-fund foreign correspondent accounts for international transfers",
              "It provides yield-bearing savings accounts denominated in XRP",
              "It replaces SWIFT's international messaging infrastructure entirely",
            ],
            correct: 1,
            explanation: "Traditional cross-border payments require banks to park billions in foreign 'nostro/vostro' accounts. ODL uses XRP as a real-time bridge — USD converts to XRP, travels the XRP Ledger in 3-5 seconds, then converts to the destination currency. No pre-funded accounts needed.",
          },
          {
            question: "How long does a typical XRP Ledger transaction take to reach finality?",
            options: [
              "10 minutes (same as Bitcoin)",
              "3-5 seconds",
              "1-2 hours",
              "24-48 hours (next business day)",
            ],
            correct: 1,
            explanation: "XRP Ledger transactions typically achieve final settlement in 3-5 seconds at a cost of fractions of a cent. This is the core property that makes it practical for real-time global payments.",
          },
        ],
      },
      {
        id: "m6-cbdc",
        title: "XRP, CBDCs, and the Future of Digital Money",
        xpReward: 50,
        videoUrl: "https://ripple.com/solutions/central-bank-digital-currency/",
        body: "Central Bank Digital Currencies (CBDCs) are digital versions of national currencies issued directly by central banks — not banks, not crypto protocols. Over 130 countries are exploring or piloting CBDCs as of 2024, including China (Digital Yuan, already live), the EU (Digital Euro in testing), and the U.S. (FedNow as a precursor).\n\nRipple has positioned itself as CBDC infrastructure: the XRP Ledger has a private ledger variant (CBDC Platform) that enables central banks to issue and manage their own digital currencies, with the option to bridge to the public XRP Ledger for interoperability. This puts XRP potentially at the center of the next layer of global settlement: a world where CBDCs from different countries settle against each other via XRP. The XRP Army calls this 'the flippening that matters.' Critics argue CBDCs are surveillance money and the opposite of what crypto was built for.",
        factionNote: {
          xrp: "If CBDCs become the backbone of global finance and XRP bridges them, the demand for XRP as bridge asset is staggering. This is the long game the Army is playing.",
          btc: "Bitcoin maxis view CBDCs as the bad ending: programmable state-controlled money. BTC exists to be the alternative. Helping CBDCs is not the mission.",
          eth: "Ethereum-based stablecoins (USDC on various chains) are already functioning CBDC-like instruments. The battle for digital dollar infrastructure is multi-front.",
          wild: "Algorand, Stellar, and Hedera are also chasing CBDC contracts. XRP has early advantages, but this is a decade-long race. The Wildcard watches the bids.",
        },
        quiz: [
          {
            question: "What is a CBDC?",
            options: [
              "Crypto-Based Decentralized Currency — a community-run stablecoin",
              "Central Bank Digital Currency — a digital form of national currency issued by a government's central bank",
              "A type of stablecoin deployed on the Ethereum network",
              "An XRP-based interbank payment network",
            ],
            correct: 1,
            explanation: "CBDCs are digital versions of national currencies issued directly by central banks. Over 130 countries are exploring or piloting them. They are programmable government money — not decentralized.",
          },
          {
            question: "How is Ripple positioning XRP in relation to CBDCs?",
            options: [
              "As a direct competitor that will replace all CBDCs",
              "As a bridge currency enabling interoperability between different countries' CBDCs",
              "By building its own competing government-backed digital currency",
              "By lobbying governments to ban CBDCs in favor of XRP",
            ],
            correct: 1,
            explanation: "Ripple's CBDC Platform allows central banks to issue digital currencies, with optional bridging to the public XRP Ledger. XRP could serve as a neutral settlement asset between CBDCs from different countries — the 'reserve currency of digital money.'",
          },
        ],
      },
    ],
  },
  {
    id: "module-7",
    title: "The Wildcard Arsenal",
    description: "Layer 2s, tokenomics, yield farming, NFTs, memecoin mechanics — the tools of the chaos trade.",
    icon: "🎲",
    lessons: [
      {
        id: "m7-tokenomics",
        title: "Tokenomics: The Math That Determines Every Altcoin's Fate",
        xpReward: 50,
        videoUrl: "https://www.coindesk.com/learn/what-is-tokenomics-and-why-does-it-matter/",
        body: "Tokenomics is the economic design of a cryptocurrency: how many tokens exist, how they are distributed, and how new supply enters circulation. It determines whether a project's price can realistically go up or will inevitably be crushed by inflation.\n\nKey terms you must know: Total Supply (all tokens that will ever exist), Circulating Supply (tokens actually in the market now), Market Cap (price × circulating supply), Fully Diluted Valuation (price × total supply — what the project is worth if all tokens are unlocked today). Red flags: massive team/VC allocations with short vesting periods (they dump on retail), inflationary rewards that exceed real demand, and circulating supply that is a tiny fraction of total supply (lots of locked tokens will unlock and create sell pressure). Before buying any altcoin, find the token unlock schedule. It tells you everything.",
        factionNote: {
          wild: "This is the Wildcard's first checklist item. Good tokenomics don't guarantee success. Bad tokenomics guarantee failure. Know the difference.",
          btc: "Bitcoin's tokenomics are the benchmark: fixed supply, transparent emission, no team allocation. Everything else is a deviation from this standard.",
          eth: "ETH's tokenomics changed at The Merge and with EIP-1559. Stake rewards issue new ETH; fee burning removes ETH. The net rate fluctuates. Track it at ultrasound.money.",
          xrp: "XRP tokenomics are unusual: all supply was pre-minted. The question is rate of release from escrow and Ripple's treasury management. Both are public information.",
        },
        quiz: [
          {
            question: "What does 'Fully Diluted Valuation' (FDV) represent?",
            options: [
              "The current market capitalization using only circulating supply",
              "The market cap if all tokens — including locked and unvested — were in circulation at today's price",
              "The total revenue generated by the project's protocol",
              "The total amount raised in the initial coin offering",
            ],
            correct: 1,
            explanation: "FDV = current price × total supply. It shows what the project would be worth if every token were unlocked today — often many times higher than the circulating market cap. A huge gap between market cap and FDV signals heavy future sell pressure.",
          },
          {
            question: "What is the most dangerous tokenomics red flag for an altcoin investment?",
            options: [
              "A fixed total supply that cannot be increased",
              "Large team and VC allocations with short vesting periods that unlock near-term",
              "The token being listed on major exchanges like Coinbase",
              "High daily trading volume relative to market cap",
            ],
            correct: 1,
            explanation: "Large insider allocations with near-term unlock dates mean insiders can dump massive supply on retail buyers as soon as lockups expire. Always check the token vesting and unlock schedule before buying — it's the single best predictor of near-term price pressure.",
          },
        ],
      },
      {
        id: "m7-layer2",
        title: "Layer 2 Networks: Scaling Without Breaking the Base",
        xpReward: 50,
        videoUrl: "https://ethereum.org/en/layer-2/",
        body: "A Layer 2 (L2) is a separate blockchain that runs on top of a Layer 1 (like Ethereum) and inherits its security while offering higher speed and lower fees. Transactions happen on the L2 — fast and cheap — and the L2 periodically settles a compressed summary to the L1, proving the transactions were valid.\n\nTwo major architectures: Optimistic Rollups (Arbitrum, Optimism, Base) assume transactions are valid and only run fraud proofs if challenged — 7-day withdrawal delay to mainnet. ZK Rollups (zkSync, Starknet, Polygon zkEVM) use zero-knowledge proofs to cryptographically prove transaction validity instantly — no challenge period needed, faster finality. The Base chain (built by Coinbase on Optimism's stack) brought millions of users to L2 for the first time. L2 fees today are often below $0.01. The future of Ethereum activity is on L2s — the L1 is the settlement layer.",
        factionNote: {
          eth: "L2s are Ethereum's scaling answer. Mainnet = security layer. L2s = execution layer. The roadmap is working. Base alone has more daily transactions than Ethereum mainnet.",
          btc: "Lightning is Bitcoin's L2. It's more limited than ETH's rollup ecosystem but simpler and more focused. Different philosophy: do one thing extremely well.",
          xrp: "XRP's L1 is already fast enough that L2 scaling isn't a current need. The XRPL EVM sidechain adds smart contract capability without touching the payment ledger.",
          wild: "Every fast chain (Solana, Avalanche, Fantom) marketed itself as an 'ETH killer.' Most ended up becoming L2-adjacent or irrelevant. ETH L2s ate their lunch.",
        },
        quiz: [
          {
            question: "What is the key difference between Optimistic Rollups and ZK Rollups?",
            options: [
              "Optimistic Rollups are much faster; ZK Rollups are slower and more experimental",
              "ZK Rollups use cryptographic proofs for near-instant finality; Optimistic Rollups assume validity with a 7-day challenge window",
              "Optimistic Rollups are more secure; ZK Rollups sacrifice security for speed",
              "They use identical technology with only branding differences",
            ],
            correct: 1,
            explanation: "ZK Rollups generate cryptographic zero-knowledge proofs that validate transactions mathematically — fast finality, no challenge period. Optimistic Rollups assume transactions are valid and allow 7 days for fraud challenges, creating a withdrawal delay to mainnet.",
          },
          {
            question: "What does a Layer 2 network settle onto its Layer 1?",
            options: [
              "Every individual transaction in full detail",
              "A compressed summary or cryptographic proof covering many batched transactions",
              "A daily balance snapshot of all accounts",
              "Nothing — Layer 2s are fully independent from Layer 1",
            ],
            correct: 1,
            explanation: "Layer 2 networks batch thousands of transactions and post a compressed proof or summary to the L1 blockchain. This inherits L1 security while dramatically reducing the per-transaction cost for users.",
          },
        ],
      },
      {
        id: "m7-yield",
        title: "Yield Farming and Liquidity Mining: Free Money Until It Isn't",
        xpReward: 50,
        videoUrl: "https://www.coindesk.com/learn/what-is-yield-farming/",
        body: "Yield farming is the practice of providing liquidity or capital to DeFi protocols in exchange for token rewards. When a protocol needs liquidity (for example, a DEX needs token pairs to enable trading), it pays users in its own native token to supply that liquidity. This creates high APYs — sometimes 100%+ — that attract capital rapidly.\n\nThe mechanics of the trap: protocol tokens used as rewards have value only while new capital is entering. When rewards are high, they attract farmers who immediately sell the reward tokens, creating sell pressure. When the APY drops, farmers move capital to the next protocol, leaving the first one with low liquidity and a collapsed token price. This is called a 'farm and dump' cycle. Genuine yield farming — where rewards come from real protocol fees (not printed tokens) — is sustainable. Reward-token-funded APYs are almost always temporary. The skill is telling which is which before the dump.",
        factionNote: {
          wild: "Yield farming is the Wildcard's day job. The entry window matters more than the APY number. Get in early, identify the exit, then exit. Most people skip step three.",
          eth: "The best sustainable yields in DeFi come from ETH staking (~4% APY) and fee revenue from established protocols like Uniswap. Boring and real beats exciting and temporary.",
          btc: "Wrapped Bitcoin (wBTC) in DeFi lets you farm with BTC exposure. Maxis debate whether the smart contract risk is worth it. Most prefer cold storage.",
          xrp: "The XRP Ledger DEX offers native liquidity provision. XRPL AMM (automated market maker) was added in 2024. Low fees make it practical even for small positions.",
        },
        quiz: [
          {
            question: "What makes DeFi yield 'sustainable' vs. unsustainable?",
            options: [
              "Any APY above 100% is automatically sustainable",
              "Sustainable yield comes from real protocol revenue (fees, interest) not from newly printed reward tokens",
              "Government-backed guarantee programs make yields sustainable",
              "Locking tokens for 4+ years makes any yield sustainable",
            ],
            correct: 1,
            explanation: "Sustainable yields come from actual protocol activity — trading fees, loan interest, real usage. Token-emission yields pay early farmers but create sell pressure that eventually collapses both the APY and the reward token's price.",
          },
          {
            question: "What is a 'farm and dump' cycle?",
            options: [
              "A farming investment strategy involving physical agricultural commodities",
              "When high APYs attract capital, farmers sell reward tokens creating downward pressure, APY falls, capital leaves — repeating on the next protocol",
              "A type of smart contract exploit targeting yield farming protocols",
              "When farmers buy farm-themed NFTs hoping they appreciate in value",
            ],
            correct: 1,
            explanation: "High printed-token APYs attract capital → farmers sell reward tokens → sell pressure collapses reward token price → APY drops → capital migrates to the next high-APY protocol. The cycle repeats, leaving only late arrivals holding deflated assets.",
          },
        ],
      },
      {
        id: "m7-nfts",
        title: "NFTs: What They Are, Why They Mattered, What Survived",
        xpReward: 50,
        videoUrl: "https://ethereum.org/en/nft/",
        body: "A Non-Fungible Token (NFT) is a token on a blockchain that represents ownership of a unique item — not interchangeable the way Bitcoin or ETH are. An NFT can represent a digital artwork, a game item, a music license, a domain name, an event ticket, or real-world property documentation.\n\nThe 2021 NFT boom peaked with Bored Ape Yacht Club apes trading for $400,000+ and Beeple selling a JPG for $69 million. By 2023, the speculative floor had collapsed: most NFT collections lost 90-99% of their peak value. What survived: the underlying use case (provable digital ownership on-chain), gaming items with real utility, tokenized real-world assets, and music/IP royalty structures. The speculative art market was mostly a mania. The technology — provable, programmable ownership — remains genuinely useful. Separate the mechanism from the mania.",
        factionNote: {
          eth: "NFTs live primarily on Ethereum. ERC-721 and ERC-1155 are the standards. The infrastructure is real. The speculative art market was the bubble, not the tech.",
          btc: "Bitcoin Ordinals (2023) inscribed NFT-like data directly onto satoshis. Maxis were divided: some called it innovation, some called it spam. The debate continues.",
          xrp: "The XRP Ledger added native NFT support (XLS-20 standard) in 2022. Low fees make it viable for real-world asset tokenization even when ETH gas is prohibitive.",
          wild: "The Wildcard bought NFTs at peak. The Wildcard sold NFTs at peak. The Wildcard watched the Wildcard bag others buy NFTs at peak. Timing is everything. The tech is interesting.",
        },
        quiz: [
          {
            question: "What does 'Non-Fungible' mean in the context of NFTs?",
            options: [
              "The token cannot be traded on exchanges",
              "Each token is unique and not interchangeable with other tokens of the same type",
              "The token has no monetary value",
              "The token cannot be transferred between wallets",
            ],
            correct: 1,
            explanation: "Non-fungible means unique and not interchangeable. Unlike Bitcoin (where one BTC equals any other BTC), each NFT represents a specific unique item. Two NFTs in the same collection are distinct tokens with their own provable identity.",
          },
          {
            question: "What survived the 2021-2023 NFT market collapse?",
            options: [
              "All NFT collections maintained most of their value",
              "Nothing — NFTs were entirely worthless technology all along",
              "The technology of provable on-chain ownership, with genuine use cases in gaming, music royalties, and real-world assets",
              "Only Bored Ape Yacht Club NFTs retained significant value",
            ],
            correct: 2,
            explanation: "The speculative art market bubble burst. But the underlying technology — verifiable, programmable ownership recorded on-chain — remains genuinely useful for gaming items, music royalties, event tickets, real estate records, and supply chain documentation.",
          },
        ],
      },
      {
        id: "m7-memecoins",
        title: "Memecoins: The Chaos Engine Explained",
        xpReward: 50,
        videoUrl: "https://www.coindesk.com/learn/what-are-meme-coins/",
        body: "A memecoin is a cryptocurrency with no fundamental utility, launched around a joke, meme, cultural moment, or celebrity endorsement. Dogecoin was the original (2013, started as a literal joke). Then Shiba Inu, Pepe, Bonk, and thousands of others. In 2024, Solana became the primary memecoin launch platform with pump.fun enabling anyone to launch a token in seconds for about $2.\n\nMemecoin mechanics: they rely entirely on attention and narrative. No product, no team, no roadmap needed. The price chart IS the product — early buyers win, late buyers lose, most tokens go to zero within weeks. Why people participate anyway: the transparency of the game (everyone knows it's a gamble), the culture (communities form fast), and the genuine 100-1000x possibilities in the first hours. The risk is total and immediate: most go to zero. The Wildcard doesn't pretend otherwise. The skill is position sizing — size it like a lottery ticket, not like a retirement fund.",
        factionNote: {
          wild: "The Wildcard invented this game. Dogecoin was our origin story. The meta changes monthly. Right now it's Solana pump.fun. Next month it's something else. Stay nimble.",
          btc: "Maxis view memecoins as the logical endpoint of speculation without fundamentals. Occasionally one of them quietly holds Dogecoin since 2015. They do not admit this.",
          eth: "Most memecoins launch on Ethereum or EVM chains. Every bull market cycle produces memecoin millionaires and memecoin disasters in roughly equal measure.",
          xrp: "The XRP Army occasionally launches XRP-adjacent memes. The base community is more fundamentals-focused than most, which makes memecoin launches awkward.",
        },
        quiz: [
          {
            question: "What is the primary driver of memecoin price movements?",
            options: [
              "Corporate earnings reports and institutional analyst upgrades",
              "Attention and narrative — how many people are talking about it and buying in",
              "Government monetary policy announcements",
              "Technological superiority over established protocols like Bitcoin",
            ],
            correct: 1,
            explanation: "Memecoins have no underlying utility or fundamentals. Their price is driven entirely by attention, cultural momentum, and speculative buying. They operate on the greater fool theory — someone will pay more than you did, until no one does.",
          },
          {
            question: "What is the correct way to size a memecoin position?",
            options: [
              "All-in with high conviction — big risk, big reward",
              "Like a lottery ticket — only what you can afford to watch go to zero completely",
              "At least 10% of your total crypto portfolio for meaningful upside",
              "The same as your Bitcoin or Ethereum position, since the upside is similar",
            ],
            correct: 1,
            explanation: "Memecoins have genuine 100x–1000x potential in the first hours AND near-certain eventual zero outcomes. The only rational approach is position-sizing them like lottery tickets — money you're fully prepared to lose. Never let memecoin positions become a meaningful portion of your wealth.",
          },
        ],
      },
    ],
  },
];
