import { useEffect } from "react";

const S = {
  page: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    background: "#fff",
    color: "#111",
    maxWidth: "720px",
    margin: "0 auto",
    padding: "48px 40px 80px",
    fontSize: "13.5px",
    lineHeight: "1.7",
  } as React.CSSProperties,

  printBtn: {
    display: "inline-block",
    padding: "10px 24px",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "Georgia, serif",
  } as React.CSSProperties,

  coverTitle: {
    fontSize: "34px",
    fontWeight: "bold",
    marginBottom: "8px",
    lineHeight: "1.2",
  } as React.CSSProperties,

  coverSub: {
    fontSize: "14px",
    color: "#555",
    marginBottom: "4px",
  } as React.CSSProperties,

  hr: {
    border: "none",
    borderTop: "1px solid #ccc",
    margin: "28px 0",
  } as React.CSSProperties,

  sectionBlock: {
    marginBottom: "36px",
    borderLeft: "4px solid #111",
    paddingLeft: "20px",
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "4px",
    lineHeight: "1.3",
  } as React.CSSProperties,

  sectionTag: {
    fontSize: "11px",
    color: "#666",
    marginBottom: "12px",
    fontStyle: "italic",
    display: "block",
  } as React.CSSProperties,

  p: {
    marginBottom: "10px",
  } as React.CSSProperties,

  featureHead: {
    fontSize: "13px",
    fontWeight: "bold",
    marginTop: "18px",
    marginBottom: "4px",
  } as React.CSSProperties,

  featureList: {
    paddingLeft: "18px",
    marginBottom: "10px",
  } as React.CSSProperties,

  featureItem: {
    marginBottom: "5px",
  } as React.CSSProperties,

  callout: {
    background: "#f6f6f4",
    borderLeft: "3px solid #bbb",
    padding: "10px 14px",
    margin: "14px 0",
    fontStyle: "italic",
    fontSize: "13px",
    color: "#444",
  } as React.CSSProperties,

  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    marginBottom: "14px",
    fontSize: "12.5px",
  },

  th: {
    background: "#f0f0f0",
    textAlign: "left" as const,
    padding: "6px 10px",
    borderBottom: "2px solid #ccc",
    fontWeight: "bold",
  },

  td: {
    padding: "5px 10px",
    borderBottom: "1px solid #e8e8e8",
    verticalAlign: "top" as const,
  },

  h3: {
    fontSize: "15px",
    fontWeight: "bold",
    marginTop: "22px",
    marginBottom: "6px",
    borderBottom: "1px solid #e0e0e0",
    paddingBottom: "3px",
  } as React.CSSProperties,

  badge: {
    display: "inline-block",
    background: "#f0f0f0",
    border: "1px solid #ddd",
    borderRadius: "3px",
    padding: "1px 7px",
    fontSize: "10.5px",
    marginRight: "6px",
    verticalAlign: "middle",
    fontFamily: "sans-serif",
  } as React.CSSProperties,
};

export default function Guide() {
  useEffect(() => {
    document.title = "Headwaters Project — Plain-Language Guide";
  }, []);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          h2, h3, h4 { page-break-after: avoid; }
          .section-block { page-break-inside: avoid; }
          .pb { page-break-before: always; }
        }
        @media screen {
          body { background: #f2f2f0; }
        }
      `}</style>

      <div style={S.page}>

        {/* Print button */}
        <div className="no-print" style={{ marginBottom: "36px" }}>
          <button style={S.printBtn} onClick={() => window.print()}>
            Print / Save as PDF
          </button>
          <span style={{ marginLeft: "14px", fontSize: "12px", color: "#777" }}>
            Cmd+P → Save as PDF, or send to printer
          </span>
        </div>

        {/* Cover */}
        <div style={S.coverTitle}>The Headwaters Project</div>
        <p style={S.coverSub}>807 Food Co-operative Inc. · Dryden, Ontario</p>
        <p style={S.coverSub}>Plain-language guide — what everything does and who it's for</p>
        <hr style={S.hr} />

        {/* Intro */}
        <p style={S.p}>
          This document explains every part of the Headwaters project in plain language — no
          technical background required. It covers six tools built for the 807 Food Co-operative
          community, The Survival Podcast audience, and practitioners working in northern Ontario
          self-reliance.
        </p>
        <p style={S.p}>
          Think of the whole project as a <strong>watershed</strong>: a network of tools where
          knowledge, community, and local economy flow together. Each tool is a different part
          of that water cycle — from the kitchen table at home all the way out to the wider
          community and beyond.
        </p>

        <hr style={S.hr} />

        {/* ── 1. The Survival Podcast / Stomping Path ── */}
        <div className="section-block" style={S.sectionBlock}>
          <div style={S.sectionTitle}>1. The Survival Podcast — Stomping Path</div>
          <span style={S.sectionTag}>A redesigned home for 6,000+ episodes, learning, and community</span>

          <p style={S.p}>
            The Survival Podcast (TSP) has been running since 2008. Jack Spirko has recorded over
            6,000 episodes covering homesteading, food production, financial independence,
            preparedness, and community resilience. The Stomping Path is a completely rebuilt
            version of the TSP website — faster, easier to navigate, and organized around the way
            listeners actually use the content.
          </p>

          <div style={S.featureHead}>Finding content</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}><strong>Episode search</strong> — Search all 6,000+ episodes by keyword, topic, or date. Full-text search across titles, descriptions, and transcripts. Results appear instantly as you type.</li>
            <li style={S.featureItem}><strong>Library</strong> — Every article, resource, and episode organized in one place. Browse by topic or search by keyword.</li>
            <li style={S.featureItem}><strong>Series</strong> — Curated sets of episodes on specific topics (e.g. Unloose the Goose, a series about practical community action). Episodes in a series play in order.</li>
            <li style={S.featureItem}><strong>Zones</strong> — Content organized by where you are in your self-reliance journey: Self → Home → Garden → Homestead → Forest → Wild. Wherever you are, you see the content that's most relevant to you right now.</li>
            <li style={S.featureItem}><strong>Learning tracks</strong> — Step-by-step sequences of episodes on a single skill or subject. Like a course, but built from real podcast episodes.</li>
          </ul>

          <div style={S.featureHead}>Community and connection</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}><strong>Expert Council</strong> — A searchable directory of vetted TSP experts. Anyone can browse; practitioners can apply to join.</li>
            <li style={S.featureItem}><strong>Workshops</strong> — Community events and workshops. Attendees can register and pay online. Hosts can manage their events.</li>
            <li style={S.featureItem}><strong>Stomping Grounds</strong> — A map of community events and meetups, organized by location.</li>
            <li style={S.featureItem}><strong>Practitioners directory</strong> — A public list of community practitioners working in the self-reliance space.</li>
            <li style={S.featureItem}><strong>Cohorts</strong> — Small-group programs led by instructors. Students can browse and enrol; instructors manage their cohort.</li>
          </ul>

          <div style={S.featureHead}>Supporting the show</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}><strong>Wishing Well</strong> — Value-for-value listener tips. Send a tip in any amount, leave a wish, and be entered in the daily listener prize draw. The well redistributes a portion of tips back to random listeners.</li>
            <li style={S.featureItem}><strong>Brigade membership</strong> — Monthly subscription that unlocks the full library search and other member features.</li>
            <li style={S.featureItem}><strong>Kits</strong> — Eight starter packages covering different self-reliance topics (food preservation, homestead setup, financial independence, etc.). Each kit bundles the best episodes, gear recommendations, and learning tracks on that topic. Buy directly or use the kit finder to find the right one.</li>
          </ul>

          <div style={S.featureHead}>AI guides</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}><strong>Gord</strong> — An AI assistant modelled on a northern owl/partridge. Deadpan, grounded, and knowledgeable about the TSP back catalogue. Ask Gord anything about the show. Tip Gord if he helps.</li>
            <li style={S.featureItem}><strong>Trailblazer</strong> — An AI trail guide that helps listeners figure out where they are in their self-reliance journey and what to learn next.</li>
          </ul>

          <div style={S.featureHead}>Tools and tracking</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}><strong>Daily Stomp tracker</strong> — Track which episodes you've listened to today. Builds a habit of daily learning.</li>
            <li style={S.featureItem}><strong>Homestead Map</strong> — An interactive zone map showing your current homestead stage and what's available in each zone.</li>
            <li style={S.featureItem}><strong>Wisdom Dig</strong> — A searchable collection of extracted wisdom nuggets and key quotes from TSP episodes.</li>
            <li style={S.featureItem}><strong>History Timeline</strong> — A visual timeline of TSP episodes across 18 years.</li>
            <li style={S.featureItem}><strong>Gear reviews</strong> — Products and tools reviewed and recommended by Jack.</li>
          </ul>

          <div style={S.callout}>
            Who it's for: anyone who listens to The Survival Podcast and wants to get more from
            6,000+ episodes — find what matters, learn in order, support the show, and connect
            with the community.
          </div>
        </div>

        {/* ── 2. Codetry ── */}
        <div className="pb" />
        <div className="section-block" style={S.sectionBlock}>
          <div style={S.sectionTitle}>2. Codetry — Digital Sovereignty Workbench</div>
          <span style={S.sectionTag}>Tools for owning your digital life — keys, code, and community payment rails</span>

          <p style={S.p}>
            Codetry is for people who want to go further than just consuming content — they want
            to own their digital tools, hold their own keys, and understand the technology that
            underpins financial and digital independence. Think of it as the workshop behind the
            kitchen table.
          </p>

          <div style={S.featureHead}>Understanding where you stand</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}><strong>Digital Sovereignty Assessment</strong> — A 7-step guided questionnaire. At the end, you receive a Stage 1–6 result showing where you are on the digital independence journey, and what the next step looks like.</li>
            <li style={S.featureItem}><strong>Stack Map</strong> — A visual breakdown of the tools and technologies powering the Headwaters project itself. Transparent about what's running under the hood.</li>
          </ul>

          <div style={S.featureHead}>Key custody — holding your own Bitcoin</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}><strong>Bitcoin BIP39 Key Ceremony</strong> — A private, browser-only tool for generating a Bitcoin seed phrase and wallet address. Nothing leaves your device. Step-by-step ceremony with clear instructions on how to write it down safely and where to store it.</li>
            <li style={S.featureItem}>The comparison: an exchange account is like keeping your gold at a pawn shop. Holding your own keys is like having a safe in your house. Codetry walks you through building the safe.</li>
          </ul>

          <div style={S.featureHead}>Community payment tools (XRPL)</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}><strong>XRPL Wallet Ceremony</strong> — A tool for generating an XRP Ledger wallet for community payment use. Used for co-op and community economic tools — separate from personal Bitcoin holdings.</li>
            <li style={S.featureItem}><strong>The Machine</strong> — An interactive code workbench where you can write and run code in your browser. For learning the basics of programming in the context of self-reliance tools.</li>
          </ul>

          <div style={S.featureHead}>Services and portfolio</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}><strong>Council Kit</strong> — Three tiers of hands-on service: Zone Assessment (understanding your community's digital readiness), Hub Implementation (setting up community tools), and Regional Platform (building the full community infrastructure).</li>
            <li style={S.featureItem}><strong>Portfolio</strong> — Case studies of work done for 807 Food Co-op, Parr's Jars, and other community organizations.</li>
          </ul>

          <div style={S.callout}>
            Who it's for: TSP listeners and community members who are ready to go beyond
            listening — people who want to hold their own Bitcoin keys, understand how community
            payment systems work, and learn the code skills to run their own tools.
          </div>
        </div>

        {/* ── 3. Privacy Guide ── */}
        <div className="pb" />
        <div className="section-block" style={S.sectionBlock}>
          <div style={S.sectionTitle}>3. Clearing &amp; Lodge Family Privacy Guide</div>
          <span style={S.sectionTag}>A practical privacy guide for homestead and co-op families</span>

          <p style={S.p}>
            The Privacy Guide is a printable, checklist-based guide written for parents and
            community members in homestead and co-op settings. It explains the difference between
            your private family workspace (The Clearing) and your shared community space (The Lodge),
            and gives you practical tools to protect both.
          </p>

          <div style={S.featureHead}>Understanding your digital spaces</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}><strong>The Clearing</strong> — Your private family workspace. Notes, voice memos, and drafts that stay on your device and never leave without your say-so. Like a fenced garden with the gate closed by default.</li>
            <li style={S.featureItem}><strong>The Lodge</strong> — Your community's shared meeting hall. Announcements, discussions, and curriculum links — visible to all enrolled families. Post here like you would on a community noticeboard.</li>
            <li style={S.featureItem}><strong>Zone Identity</strong> — A simple rule: Zone 0 material (personal journals, health notes, finances) never goes into a Zone 2 space (the Lodge). If you wouldn't pin it on the co-op noticeboard, keep it in the Clearing.</li>
          </ul>

          <div style={S.featureHead}>Practical safety tools</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}><strong>Nightfall Checklist</strong> — Eight things to secure before the day ends: auto-lock on devices, VPN active, passphrase rotated, sensitive files in the Clearing only, and more. Tracks your progress with a simple checklist that saves to your browser.</li>
            <li style={S.featureItem}><strong>VPN Guide</strong> — Plain-language explanation of what a VPN does and doesn't do, with four vetted providers suitable for family use. Mullvad and ProtonVPN are highlighted as independently audited and outside the Five Eyes intelligence alliance.</li>
            <li style={S.featureItem}><strong>Hardware recommendations</strong> — Pre-configured phones (Above Phone with GrapheneOS) and DIY options for families who want a Google-free device.</li>
          </ul>

          <div style={S.featureHead}>The Satellite &amp; Drone Answer</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}>A direct, honest answer to a question many rural parents have: do my children need to be clothed outdoors on our own land to be safe from cameras above? The short answer: satellite imagery of rural Northern Ontario doesn't resolve body detail. The real aerial concern is drones — and Transport Canada rules already cover that. The guide explains exactly what the rules say and what to do if a drone appears.</li>
            <li style={S.featureItem}><strong>Practical protection:</strong> tree canopy over play areas is the single most effective physical countermeasure — it works against any technology and grows in value over time.</li>
          </ul>

          <div style={S.featureHead}>The Keeper's Kit</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}>A protective declaration framework for parents who want to place a standing record on behalf of their children's likeness, voice, and words — specifically against future AI-generated or deepfake misuse.</li>
            <li style={S.featureItem}><strong>Five instruments:</strong> Standing Declaration (no consent for exploitative use), Refused Shelf Entry (no adult mapping of play language), Contextual Fabric Stamp (dated witness log of public moments), Age Anchor (permanent record of minority), and Keeper Chain (two or more people holding the same record independently).</li>
            <li style={S.featureItem}>Includes a printable one-page declaration template with fields for signatures, witnesses, and an optional on-chain anchor. The declaration transfers to the child when they turn 18.</li>
          </ul>

          <div style={S.featureHead}>The Duck Song Signal</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}>A community action protocol for mothers in abusive or isolating situations who cannot safely ask for help directly. The signal is three words: <strong>"Got any grapes?"</strong> — from the Duck Song, widely known in schools.</li>
            <li style={S.featureItem}>A mother can say this to a teacher, shelter worker, clinic nurse, grocery clerk, or librarian — in front of her children, in front of her partner, in a crowd. It sounds like a child quoting a song. If said to someone who knows the signal, it triggers a quiet, immediate response.</li>
            <li style={S.featureItem}>The guide covers the three-tier network (educators, health workers, community anchors), the five-step response protocol, and what not to do. Includes a printable cut-out slip card that can be left in any resource folder without explanation.</li>
          </ul>

          <div style={S.featureHead}>Canadian legal framework</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}>A plain-language summary of PIPEDA (Canada's federal privacy law) and Quebec's Law 25. Your rights: know what data is held about you, request correction or deletion, file a complaint with the Office of the Privacy Commissioner at no cost.</li>
          </ul>

          <div style={S.callout}>
            Who it's for: parents and community members in homestead, co-op, or homeschool
            settings who want a practical, non-alarmist guide to protecting their family's
            digital perimeter — and tools to address real-world concerns about outdoor privacy,
            children's digital safety, and community safety signals.
          </div>
        </div>

        {/* ── 4. Headwaters ── */}
        <div className="pb" />
        <div className="section-block" style={S.sectionBlock}>
          <div style={S.sectionTitle}>4. Headwaters — Practitioner Intake Tool</div>
          <span style={S.sectionTag}>A private workspace for practitioners working with clients in the watershed</span>

          <p style={S.p}>
            Headwaters is a passphrase-protected workspace used by Bobbie Parr and authorized
            practitioners. It combines client relationship management, business planning tools,
            and the Stomping Path community tools — all in one place. Think of it as the practitioner's
            private desk, inside the watershed.
          </p>
          <p style={S.p}>
            The gate page offers two paths: Field Journal (passphrase required, for the
            practitioner workspace) and The Trail (free public tools for anyone).
          </p>

          <div style={S.featureHead}>Client management (passphrase required)</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}><strong>Client list</strong> — A searchable list of all clients with their status, contact details, and notes. Filter by name, zone, or status.</li>
            <li style={S.featureItem}><strong>New client intake</strong> — A structured form to capture a new client's situation from first contact. Zone placement, goals, priorities.</li>
            <li style={S.featureItem}><strong>Client profile</strong> — Full record for each client: contact information, status, linked intake notes, and a history of sessions.</li>
            <li style={S.featureItem}><strong>Intake notes</strong> — A free-form notes area for capturing raw session notes quickly. No formatting required.</li>
            <li style={S.featureItem}><strong>AI-assisted review</strong> — After capturing intake notes, the practitioner can run an AI review that reads the notes and suggests next steps, priorities, and patterns it notices. The AI is a thinking partner, not a decision-maker.</li>
          </ul>

          <div style={S.featureHead}>Business planning (passphrase required)</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}><strong>Strategic priorities</strong> — A planning grid for tracking the practitioner's own business priorities across time horizons.</li>
            <li style={S.featureItem}><strong>Financial modelling</strong> — Monthly income modelling with low and high projections. A simple tool for understanding what different client loads and service offerings actually mean in dollar terms.</li>
            <li style={S.featureItem}><strong>Archival notes</strong> — Long-form notes for business thinking, reflections, and records.</li>
            <li style={S.featureItem}><strong>Marketing and online engine</strong> — A channel tracker showing which marketing activities are active and which are paying off.</li>
          </ul>

          <div style={S.featureHead}>Stomping Path tools (free, no passphrase)</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}><strong>Compass</strong> — A decision-making tool that helps practitioners and clients figure out where they are on the self-reliance path. Interactive zone placement based on a series of questions.</li>
            <li style={S.featureItem}><strong>Dam Days</strong> — A project progress log. Capture what you did, what moved, and what's stuck — then export a clean summary.</li>
            <li style={S.featureItem}><strong>Creator</strong> — A personal journey builder for mapping your own self-reliance path in a sharable format.</li>
            <li style={S.featureItem}><strong>Trail card sharing</strong> — Generate a sharable practitioner trail card showing your zone placement and progress. Send to clients or community members.</li>
          </ul>

          <div style={S.featureHead}>Navigation tools</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}><strong>The Full Map</strong> — An unguarded overview of every feature across all six tools in the watershed, with status badges and direct links. A practitioner's bird's-eye view of the whole project.</li>
            <li style={S.featureItem}><strong>The Shallows</strong> — A quiet page to leave your name in the watershed. Zone 5 — still water, long view.</li>
          </ul>

          <div style={S.callout}>
            Who it's for: Bobbie Parr and authorized practitioners working with clients in the
            807 Food Co-operative watershed. The public Stomping Path tools are available to anyone.
          </div>
        </div>

        {/* ── 5. TSP Mobile ── */}
        <div className="pb" />
        <div className="section-block" style={S.sectionBlock}>
          <div style={S.sectionTitle}>5. TSP Mobile App</div>
          <span style={S.sectionTag}>The Survival Podcast in your pocket — episodes, kits, and V4V tipping on the go</span>

          <p style={S.p}>
            The TSP Mobile app is a companion app for Survival Podcast listeners. It brings the
            most commonly used features of the Stomping Path website into a native mobile
            experience — designed for the moments when you're not at a computer: in the truck,
            in the field, or at the kitchen table with your phone.
          </p>

          <div style={S.featureHead}>What it includes</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}><strong>Episode browser</strong> — Browse, search, and stream all 6,000+ TSP episodes. Download for offline listening when you're out of signal.</li>
            <li style={S.featureItem}><strong>Home feed</strong> — Featured episodes and the daily stomp — what to listen to today.</li>
            <li style={S.featureItem}><strong>Library</strong> — The full curated resource library, organized by topic.</li>
            <li style={S.featureItem}><strong>Zone map</strong> — Visual map of the self-reliance zones, with kit references for each stage.</li>
            <li style={S.featureItem}><strong>Daily stomp tracker</strong> — Track your daily listening habit. Tap to mark episodes done.</li>
            <li style={S.featureItem}><strong>Kit finder</strong> — A five-question wizard that finds the right starter kit for where you are right now. View kit details, episode lists, and gear recommendations on your phone.</li>
            <li style={S.featureItem}><strong>Lightning / V4V wallet</strong> — Send sats (Bitcoin over the Lightning Network) directly to TSP creators as you listen. Value-for-value — pay what it's worth to you, in real time.</li>
          </ul>

          <div style={S.callout}>
            Who it's for: TSP listeners who want to take the content with them. The mobile app
            is the right tool for daily listening, quick episode searches, and sending Bitcoin
            tips without opening a browser.
          </div>
        </div>

        {/* ── 6. The Mill ── */}
        <div className="section-block" style={S.sectionBlock}>
          <div style={S.sectionTitle}>6. The Mill — Shared Infrastructure</div>
          <span style={S.sectionTag}>The invisible backbone that keeps everything running</span>

          <p style={S.p}>
            The Mill is the behind-the-scenes infrastructure that every other tool in the
            watershed depends on. Users never interact with it directly — it's the plumbing,
            the water wheel, and the mill stone running underneath everything else. It is not
            a numbered zone — it's the substrate that makes the zones possible.
          </p>

          <div style={S.featureHead}>What it does</div>
          <ul style={S.featureList}>
            <li style={S.featureItem}><strong>Content sync</strong> — Automatically pulls new TSP episodes from the RSS feed, articles from the WordPress site, and videos from YouTube. Runs in the background every hour. Over 6,000 items are indexed and searchable.</li>
            <li style={S.featureItem}><strong>Full-text search</strong> — Powers the episode and library search across all tools. Uses PostgreSQL full-text indexing for fast, accurate results.</li>
            <li style={S.featureItem}><strong>Login and accounts</strong> — Handles login via Replit Auth for Brigade members, editors, and practitioners.</li>
            <li style={S.featureItem}><strong>Payments</strong> — Processes Brigade subscriptions and kit purchases through Stripe (credit card) and Zaprite (Bitcoin and Lightning). Handles all payment webhooks and confirmation emails.</li>
            <li style={S.featureItem}><strong>Email</strong> — Sends confirmation emails for kit purchases, workshop registrations, cohort enrolments, and RSVP confirmations via SendGrid.</li>
            <li style={S.featureItem}><strong>AI</strong> — Powers the Gord and Trailblazer AI assistants using OpenAI's GPT-4.1. Streams responses in real time so replies appear word by word.</li>
            <li style={S.featureItem}><strong>Headwaters CRM</strong> — Stores and retrieves client records, intake submissions, and business data for the practitioner tool. Protected by the practitioner passphrase on every request.</li>
            <li style={S.featureItem}><strong>Webhooks</strong> — Receives and processes payment confirmations from Stripe and Zaprite. When a payment goes through, the Mill updates records and triggers emails automatically.</li>
          </ul>

          <div style={S.callout}>
            Who it's for: no one interacts with The Mill directly. It's the reason everything
            else works. If The Mill is running, the watershed is flowing.
          </div>
        </div>

        {/* ── Summary table ── */}
        <div className="pb" />
        <h3 style={S.h3}>Quick Reference — All Six Tools</h3>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Tool</th>
              <th style={S.th}>Who uses it</th>
              <th style={S.th}>What it replaces or enables</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Stomping Path (web)", "TSP listeners", "TSP website — better search, learning tracks, community"],
              ["Codetry", "People learning digital sovereignty", "Bitcoin key custody, XRPL tools, code skills"],
              ["Privacy Guide", "Families and co-ops", "Practical privacy — VPN, safety protocols, child protection"],
              ["Headwaters", "Bobbie Parr & practitioners", "Client management, business planning, practitioner tools"],
              ["TSP Mobile", "TSP listeners on the go", "Mobile podcast player + kit finder + Lightning tips"],
              ["The Mill (API Server)", "The system", "The shared backbone powering all other tools"],
            ].map(([tool, who, what]) => (
              <tr key={tool}>
                <td style={S.td}><strong>{tool}</strong></td>
                <td style={S.td}>{who}</td>
                <td style={S.td}>{what}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 style={S.h3}>Payment Methods</h3>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>What</th>
              <th style={S.th}>How</th>
              <th style={S.th}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Brigade membership", "Stripe — credit/debit card", "Monthly subscription · currently test mode"],
              ["Kits", "Stripe (card) or Zaprite (Bitcoin/Lightning)", "Real Bitcoin payments via Zaprite"],
              ["Workshop registration", "Stripe — credit/debit card", "Stripe Connect — payment goes to host"],
              ["Cohort enrolment", "Stripe — credit/debit card", "Managed by instructor"],
              ["Wishing Well tips", "Zaprite — Bitcoin or Lightning", "V4V · any amount · daily prize draw"],
              ["Gord tips", "Zaprite — Bitcoin or Lightning", "Tip the AI guide directly"],
              ["V4V in mobile app", "Lightning Network — sats", "Stream sats as you listen"],
            ].map(([what, how, notes]) => (
              <tr key={what}>
                <td style={S.td}><strong>{what}</strong></td>
                <td style={S.td}>{how}</td>
                <td style={S.td}>{notes}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 style={S.h3}>Access Levels</h3>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Feature</th>
              <th style={S.th}>Who can use it</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Browse episodes, series, zones, tracks", "Everyone — no account needed"],
              ["Full library search", "Brigade members (logged in)"],
              ["Expert Council directory", "Everyone — no account needed"],
              ["Kits — browse and find", "Everyone — no account needed"],
              ["Kits — purchase", "Anyone with a payment method"],
              ["Workshops — browse", "Everyone — no account needed"],
              ["Workshops — register", "Anyone with a payment method"],
              ["Gord AI guide", "Everyone — no account needed"],
              ["Trailblazer AI guide", "Everyone — no account needed"],
              ["Wishing Well", "Everyone — no account needed"],
              ["Stomping Path tools (Compass, Dam Days)", "Everyone — no account needed"],
              ["Headwaters client management", "Practitioners with the passphrase"],
              ["Admin panel", "Editors and administrators only"],
            ].map(([feature, who]) => (
              <tr key={feature}>
                <td style={S.td}>{feature}</td>
                <td style={S.td}>{who}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <hr style={S.hr} />
        <p style={{ ...S.p, color: "#777", fontSize: "11px", textAlign: "center" }}>
          Headwaters Watershed · 807 Food Co-operative Inc. · Dryden, Ontario · June 2026
        </p>
      </div>
    </>
  );
}
