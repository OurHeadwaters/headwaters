import { useEffect } from "react";

const S = {
  page: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    background: "#fff",
    color: "#111",
    maxWidth: "720px",
    margin: "0 auto",
    padding: "48px 40px 80px",
    fontSize: "13px",
    lineHeight: "1.65",
  } as React.CSSProperties,

  printBtn: {
    display: "inline-block",
    marginBottom: "40px",
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
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "6px",
    lineHeight: "1.2",
  } as React.CSSProperties,

  coverSub: {
    fontSize: "13px",
    color: "#555",
    marginBottom: "4px",
  } as React.CSSProperties,

  hr: {
    border: "none",
    borderTop: "1px solid #ccc",
    margin: "28px 0",
  } as React.CSSProperties,

  h2: {
    fontSize: "17px",
    fontWeight: "bold",
    marginTop: "36px",
    marginBottom: "8px",
    borderBottom: "1px solid #ddd",
    paddingBottom: "4px",
  } as React.CSSProperties,

  h3: {
    fontSize: "14px",
    fontWeight: "bold",
    marginTop: "22px",
    marginBottom: "6px",
  } as React.CSSProperties,

  p: {
    marginBottom: "10px",
  } as React.CSSProperties,

  blockquote: {
    borderLeft: "3px solid #bbb",
    paddingLeft: "16px",
    margin: "14px 0",
    color: "#444",
    fontStyle: "italic",
  } as React.CSSProperties,

  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    marginBottom: "14px",
    fontSize: "12px",
  },

  th: {
    background: "#f4f4f4",
    textAlign: "left" as const,
    padding: "5px 8px",
    borderBottom: "2px solid #ccc",
    fontWeight: "bold",
  },

  td: {
    padding: "4px 8px",
    borderBottom: "1px solid #e8e8e8",
    verticalAlign: "top" as const,
  },

  code: {
    fontFamily: "Menlo, Consolas, monospace",
    background: "#f4f4f4",
    padding: "1px 4px",
    borderRadius: "3px",
    fontSize: "11px",
  } as React.CSSProperties,

  pre: {
    background: "#f4f4f4",
    padding: "14px 16px",
    borderRadius: "4px",
    fontFamily: "Menlo, Consolas, monospace",
    fontSize: "11px",
    lineHeight: "1.6",
    overflow: "auto",
    marginBottom: "14px",
  } as React.CSSProperties,

  badge: {
    display: "inline-block",
    background: "#f0f0f0",
    border: "1px solid #ddd",
    borderRadius: "3px",
    padding: "1px 6px",
    fontSize: "10px",
    fontFamily: "Menlo, Consolas, monospace",
    marginRight: "4px",
  } as React.CSSProperties,

  warn: {
    background: "#fff8e1",
    border: "1px solid #f0c040",
    borderRadius: "4px",
    padding: "8px 12px",
    marginBottom: "10px",
    fontSize: "12px",
  } as React.CSSProperties,
};

function T({ children }: { children: React.ReactNode }) {
  return <table style={S.table}>{children}</table>;
}
function TH({ children }: { children: React.ReactNode }) {
  return <th style={S.th}>{children}</th>;
}
function TD({ children }: { children: React.ReactNode }) {
  return <td style={S.td}>{children}</td>;
}
function C({ children }: { children: React.ReactNode }) {
  return <code style={S.code}>{children}</code>;
}

export default function Print() {
  useEffect(() => {
    document.title = "Headwaters Watershed — Context Pack";
  }, []);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          h2 { page-break-after: avoid; }
          h3 { page-break-after: avoid; }
          table { page-break-inside: avoid; }
          .pb { page-break-before: always; }
        }
      `}</style>

      <div style={S.page}>

        {/* Print button */}
        <div className="no-print" style={{ marginBottom: "32px" }}>
          <button style={S.printBtn} onClick={() => window.print()}>
            Print / Save as PDF
          </button>
          <span style={{ marginLeft: "14px", fontSize: "12px", color: "#777" }}>
            Cmd+P → Save as PDF, or print to paper
          </span>
        </div>

        {/* Cover */}
        <div style={S.coverTitle}>Headwaters Watershed — Context Pack</div>
        <p style={S.coverSub}>807 Food Co-operative Inc. · Dryden, Ontario</p>
        <p style={S.coverSub}>Compiled May 30, 2026 · All zones · All artifacts</p>
        <hr style={S.hr} />

        {/* 1. Mission */}
        <h2 style={S.h2}>1. Mission</h2>
        <blockquote style={S.blockquote}>
          Help make Headwaters feel like one coherent, living watershed where Zone 0 stays warm,
          the water flows visibly between zones, and the Mill keeps everything reliable — all rooted
          in northern Ontario self-reliance.
        </blockquote>
        <p style={S.p}><strong>Circuit paragraph — use everywhere:</strong></p>
        <blockquote style={S.blockquote}>
          "From the Hearth (Zone 0) water rises at the Spring (1), runs the Worn Path (2), gathers
          in the Greenhouse (3), flows through the Clearing (4), and is held at the Edge (5). The Aquifer
          keeps the entire watershed cycling."
        </blockquote>

        {/* 2. What this is */}
        <h2 style={S.h2}>2. What This Project Is</h2>
        <p style={S.p}>
          Headwaters is a northern Ontario self-reliance project network — a living watershed, not a
          product company. It connects people, tools, knowledge, and local economy through the
          water-cycle metaphor. Every participant is inside the cycle.
        </p>
        <p style={S.p}><strong>Two on-ramps from the TSP audience:</strong></p>
        <ul style={{ paddingLeft: "20px", marginBottom: "10px" }}>
          <li>Trail 1 — The Ron Paul Route: Doom Crowd → Ron Paul Pivot → Headwaters Kitchen Table</li>
          <li>Trail 2 — The Ramsey Route: Consumer debt → Baby Steps discipline → Headwaters Kitchen Table</li>
        </ul>
        <p style={S.p}>
          Both arrive at the same kitchen table. Individual sovereignty (Paul, Ramsey) is the <strong>floor</strong>.
          The watershed — community institutions, collective ownership, local economy — is the <strong>ceiling</strong>.
        </p>

        {/* 3. Zone Chain */}
        <h2 style={S.h2}>3. Canonical Zone Chain (LOCKED)</h2>
        <T>
          <thead>
            <tr><TH>Zone</TH><TH>Name</TH><TH>Tagline</TH><TH>Core Focus</TH></tr>
          </thead>
          <tbody>
            <tr><TD>0</TD><TD>Saltbox</TD><TD>The Hearth · Home Center</TD><TD>Kitchen, preservation, Eave, Forge, root cellar</TD></tr>
            <tr><TD>1</TD><TD>Kitchen Table</TD><TD>The Spring · Daily Tools</TD><TD>Learning, handbook, library, practitioner intake</TD></tr>
            <tr><TD>2</TD><TD>Workbench</TD><TD>The Worn Path · Transition</TD><TD>Stomping Path, privacy, Codetry tools</TD></tr>
            <tr><TD>3</TD><TD>Greenhouse</TD><TD>The Clearing · Circle</TD><TD>Creative, storytelling, making</TD></tr>
            <tr><TD>4</TD><TD>Clearing</TD><TD>The Market Square · Exchange</TD><TD>Knowledge hub, grants, market, Deadfall</TD></tr>
            <tr><TD>5</TD><TD>Edge</TD><TD>The Ridge · Long View</TD><TD>X-Buckets vision, horizon planning</TD></tr>
          </tbody>
        </T>
        <p style={S.p}>
          <strong>The Aquifer</strong> = cross-zone substrate (un-numbered). Not a zone — the hidden infrastructure
          backbone. Water table metaphor. In this repo: the shared API server.
        </p>
        <div style={S.warn}>
          <strong>Two zone frameworks coexist — do not conflate:</strong><br />
          System zones 0–5 above = Headwaters system architecture.<br />
          TSP practitioner journey zones (Z0=Self, Z1=Home, Z2=Garden, Z3=Homestead, Z4=Forest, Z5=Wild) = listener journey for Stomping Path content.
        </div>

        {/* 4. Artifacts */}
        <h2 style={S.h2}>4. Artifacts in This Repo</h2>
        <T>
          <thead>
            <tr><TH>Artifact</TH><TH>Zone</TH><TH>URL Prefix</TH><TH>Role</TH></tr>
          </thead>
          <tbody>
            <tr><TD>stomping-paths</TD><TD>2 — Bench/Trail</TD><TD>/</TD><TD>The Stomping Paths — multi-producer media platform</TD></tr>
            <tr><TD>codetry</TD><TD>2 — Bench/Trail</TD><TD>/codetry/</TD><TD>Digital sovereignty workbench</TD></tr>
            <tr><TD>privacy-guide</TD><TD>2 — Bench/Trail</TD><TD>/privacy-guide/</TD><TD>Clearing & Lodge family guide</TD></tr>
            <tr><TD>headwaters</TD><TD>1 — Lodge</TD><TD>/headwaters/</TD><TD>Practitioner intake tool (Bobbie Parr)</TD></tr>
            <tr><TD>tsp-mobile</TD><TD>2 — Bench/Trail</TD><TD>Expo domain</TD><TD>TSP Mobile companion app</TD></tr>
            <tr><TD>api-server</TD><TD>The Mill</TD><TD>/api/</TD><TD>Shared Express API backbone</TD></tr>
          </tbody>
        </T>
        <p style={{ ...S.p, fontStyle: "italic", color: "#555" }}>
          7-artifact limit is reached. New features must be added as routes inside existing artifacts.
        </p>

        {/* 5. Tech Stack */}
        <div className="pb" />
        <h2 style={S.h2}>5. Tech Stack</h2>
        <h3 style={S.h3}>Runtime</h3>
        <p style={S.p}>Node.js 24 · TypeScript 5.9 · pnpm workspaces</p>
        <h3 style={S.h3}>All Web Frontends</h3>
        <p style={S.p}>React 19 · Vite 7 · wouter 3 · TanStack Query 5 · Tailwind v4 · shadcn/ui + Radix UI · Framer Motion 12 · Lucide React</p>
        <h3 style={S.h3}>Backend (api-server)</h3>
        <p style={S.p}>Express 5 · Drizzle ORM · Zod v4 · Pino logging · fast-xml-parser (RSS) · OpenAI gpt-5 (streaming SSE for Gord and Trailblazer) · Stripe (test mode only) · Zaprite (real Bitcoin/Lightning payments)</p>
        <h3 style={S.h3}>Mobile</h3>
        <p style={S.p}>Expo (React Native) · Expo Router (file-based navigation) · Replit Auth OAuth</p>
        <h3 style={S.h3}>Database</h3>
        <p style={S.p}>PostgreSQL (Replit-managed) · Drizzle ORM · GIN + tsvector full-text search on content_items · Schema in lib/db/src/schema/</p>
        <h3 style={S.h3}>API Contract</h3>
        <p style={S.p}>Single OpenAPI spec (lib/api-spec/openapi.yaml) → Orval codegen → React Query hooks (lib/api-client-react) + Zod schemas (lib/api-zod). <strong>Never hand-write API types or hooks.</strong></p>

        {/* 6. Shared Lib Packages */}
        <h2 style={S.h2}>6. Shared Library Packages (lib/)</h2>
        <T>
          <thead><tr><TH>Package</TH><TH>Purpose</TH></tr></thead>
          <tbody>
            <tr><TD>lib/api-spec</TD><TD>OpenAPI 3.0 spec — single source of truth for all API contracts</TD></tr>
            <tr><TD>lib/api-client-react</TD><TD>Orval-generated React Query hooks</TD></tr>
            <tr><TD>lib/api-zod</TD><TD>Orval-generated Zod schemas for runtime validation</TD></tr>
            <tr><TD>lib/db</TD><TD>Drizzle ORM schema definitions + DB connection</TD></tr>
            <tr><TD>lib/replit-auth-web</TD><TD>React hooks for Replit Auth (useAuth)</TD></tr>
            <tr><TD>lib/integrations-openai-ai-server</TD><TD>Server-side OpenAI/OpenRouter client</TD></tr>
            <tr><TD>lib/integrations-openai-ai-react</TD><TD>React Query wrappers for AI endpoints</TD></tr>
            <tr><TD>lib/gord-bird</TD><TD>Shared Gord mascot animation logic</TD></tr>
          </tbody>
        </T>

        {/* 7. Database */}
        <div className="pb" />
        <h2 style={S.h2}>7. Database Schema — All Tables</h2>
        <h3 style={S.h3}>Content & Sync</h3>
        <T>
          <thead><tr><TH>Table</TH><TH>Purpose</TH></tr></thead>
          <tbody>
            <tr><TD>content_items</TD><TD>Unified store — all TSP episodes, articles, YouTube. JSONB categories/tags. tsvector FTS.</TD></tr>
            <tr><TD>sync_runs</TD><TD>RSS/WP/YouTube sync tracking — status, counts, errors</TD></tr>
            <tr><TD>category_descriptions</TD><TD>Editor-managed category copy</TD></tr>
            <tr><TD>curated_items</TD><TD>Hand-curated library items</TD></tr>
          </tbody>
        </T>
        <h3 style={S.h3}>Auth & Users</h3>
        <T>
          <thead><tr><TH>Table</TH><TH>Purpose</TH></tr></thead>
          <tbody>
            <tr><TD>users</TD><TD>Replit Auth users — id, email, name, avatar</TD></tr>
            <tr><TD>sessions</TD><TD>Replit Auth sessions — JSONB sess, expire</TD></tr>
          </tbody>
        </T>
        <h3 style={S.h3}>Community & Events</h3>
        <T>
          <thead><tr><TH>Table</TH><TH>Purpose</TH></tr></thead>
          <tbody>
            <tr><TD>ground_events</TD><TD>Workshops & events — Stripe Connect fields, zone slugs</TD></tr>
            <tr><TD>ground_event_rsvps</TD><TD>RSVPs — email, name, payment status, Stripe session</TD></tr>
          </tbody>
        </T>
        <h3 style={S.h3}>Courses & Cohorts</h3>
        <T>
          <thead><tr><TH>Table</TH><TH>Purpose</TH></tr></thead>
          <tbody>
            <tr><TD>cohorts</TD><TD>Instructor-led cohort programs</TD></tr>
            <tr><TD>cohort_enrollments</TD><TD>Student enrollments + Stripe session</TD></tr>
            <tr><TD>cohort_waitlist</TD><TD>Pre-launch email capture</TD></tr>
          </tbody>
        </T>
        <h3 style={S.h3}>Monetization</h3>
        <T>
          <thead><tr><TH>Table</TH><TH>Purpose</TH></tr></thead>
          <tbody>
            <tr><TD>wishing_well_tips</TD><TD>V4V listener tips — amount, currency, payment method, wish text</TD></tr>
            <tr><TD>wishing_well_distributions</TD><TD>Daily prize draw records</TD></tr>
            <tr><TD>memberships</TD><TD>Brigade subscription status (Stripe)</TD></tr>
            <tr><TD>gord_tips</TD><TD>Direct tips to Gord AI</TD></tr>
            <tr><TD>kit_purchases</TD><TD>Completed kit purchases — Stripe or Zaprite</TD></tr>
            <tr><TD>kit_inquiries</TD><TD>Consultative kit inquiry submissions</TD></tr>
          </tbody>
        </T>
        <h3 style={S.h3}>Directory</h3>
        <T>
          <thead><tr><TH>Table</TH><TH>Purpose</TH></tr></thead>
          <tbody>
            <tr><TD>expert_council</TD><TD>TSP Expert Council members</TD></tr>
            <tr><TD>listing_applications</TD><TD>Self-serve expert listing applications</TD></tr>
            <tr><TD>ulg_businesses</TD><TD>Unloose the Goose affiliated businesses</TD></tr>
            <tr><TD>practitioners</TD><TD>General practitioner directory</TD></tr>
          </tbody>
        </T>
        <h3 style={S.h3}>User Tools</h3>
        <T>
          <thead><tr><TH>Table</TH><TH>Purpose</TH></tr></thead>
          <tbody>
            <tr><TD>user_lifestyle_maps</TD><TD>Zone/lifestyle assessment results — JSONB answers and zone assignments</TD></tr>
            <tr><TD>track_progress</TD><TD>User progress through learning tracks — JSONB completed items</TD></tr>
            <tr><TD>wisdom_nuggets</TD><TD>Admin-authored wisdom quotes keyed to tracks</TD></tr>
          </tbody>
        </T>
        <h3 style={S.h3}>Headwaters CRM (Zone 1 — passphrase-gated)</h3>
        <T>
          <thead><tr><TH>Table</TH><TH>Purpose</TH></tr></thead>
          <tbody>
            <tr><TD>headwaters_clients</TD><TD>Practitioner client records</TD></tr>
            <tr><TD>headwaters_business_data</TD><TD>Business financials and priorities</TD></tr>
            <tr><TD>headwaters_intake_submissions</TD><TD>Raw intake notes from the tool</TD></tr>
          </tbody>
        </T>
        <h3 style={S.h3}>Feature / Niche Tables</h3>
        <T>
          <thead><tr><TH>Table</TH><TH>Purpose</TH></tr></thead>
          <tbody>
            <tr><TD>castle_sessions, castle_members, castle_lesson_progress</TD><TD>Gamified learning/community features</TD></tr>
            <tr><TD>nostr_ingestion_log</TD><TD>Nostr relay ingestion tracking</TD></tr>
            <tr><TD>conversations, messages</TD><TD>AI chat history (Gord, Trailblazer)</TD></tr>
            <tr><TD>water_wheel_state</TD><TD>Water Wheel interactive feature state</TD></tr>
            <tr><TD>reviewed_products</TD><TD>TSP-reviewed products/gear</TD></tr>
            <tr><TD>value_v4v_nodes</TD><TD>V4V Lightning payment nodes</TD></tr>
            <tr><TD>fireside_chats</TD><TD>Fireside Chat episode records</TD></tr>
            <tr><TD>wisdom_gems</TD><TD>Extracted wisdom gems from episodes</TD></tr>
            <tr><TD>stomping_path_handles</TD><TD>Geospatial community handles for the Compass feature</TD></tr>
            <tr><TD>content_gaps</TD><TD>Requested topic tracking and resolution</TD></tr>
          </tbody>
        </T>

        {/* 8. API Routes */}
        <div className="pb" />
        <h2 style={S.h2}>8. API Routes — Complete Inventory</h2>
        <p style={{ ...S.p, fontSize: "11px", color: "#555" }}>
          Auth levels: None = public · requireBrigade = active Brigade member · requireEditor = editor role · x-hw-passphrase = Headwaters passphrase header
        </p>
        <T>
          <thead><tr><TH>Route Group</TH><TH>Base Path</TH><TH>Auth</TH><TH>Purpose</TH></tr></thead>
          <tbody>
            <tr><TD>Health</TD><TD>/healthz</TD><TD>None</TD><TD>System health check</TD></tr>
            <tr><TD>Auth</TD><TD>/auth, /login, /callback, /logout</TD><TD>None</TD><TD>Replit Auth web + Expo OAuth</TD></tr>
            <tr><TD>Episodes</TD><TD>/episodes, /feed, /categories</TD><TD>None</TD><TD>RSS + DB; full-text search</TD></tr>
            <tr><TD>Library</TD><TD>/library, /library/:slug</TD><TD>requireBrigade (search)</TD><TD>Full archive 6,000+ items</TD></tr>
            <tr><TD>Series</TD><TD>/series, /series/:slug</TD><TD>None</TD><TD>Curated episode series</TD></tr>
            <tr><TD>Zones</TD><TD>/zones, /zones/:slug</TD><TD>None</TD><TD>Zone-filtered content</TD></tr>
            <tr><TD>Tracks</TD><TD>/tracks, /tracks/:slug</TD><TD>None</TD><TD>Learning track sequences</TD></tr>
            <tr><TD>Track Progress</TD><TD>/track-progress</TD><TD>requireBrigade</TD><TD>User episode completion</TD></tr>
            <tr><TD>Transformations</TD><TD>/transformations</TD><TD>None</TD><TD>Content by life transformation</TD></tr>
            <tr><TD>Experts</TD><TD>/experts, /experts/:slug</TD><TD>None</TD><TD>Expert council directory</TD></tr>
            <tr><TD>Expert Listings</TD><TD>/expert-listings</TD><TD>None</TD><TD>Self-serve listing applications</TD></tr>
            <tr><TD>Admin Expert Listings</TD><TD>/admin/expert-listings</TD><TD>requireEditor</TD><TD>Application approval/rejection</TD></tr>
            <tr><TD>Wishing Well</TD><TD>/wishing-well</TD><TD>None / requireEditor (admin)</TD><TD>V4V tips, wishes, leaderboard</TD></tr>
            <tr><TD>V4V</TD><TD>/v4v, /admin/v4v</TD><TD>None / admin</TD><TD>Payment splits, creator management</TD></tr>
            <tr><TD>OG Images</TD><TD>/og</TD><TD>None</TD><TD>Open Graph image generation</TD></tr>
            <tr><TD>Content Gaps</TD><TD>/gaps, /admin/gaps</TD><TD>None / requireEditor</TD><TD>Topic request tracking</TD></tr>
            <tr><TD>Wisdom</TD><TD>/wisdom</TD><TD>None</TD><TD>Wisdom gems</TD></tr>
            <tr><TD>Admin Wisdom</TD><TD>/admin/wisdom</TD><TD>requireEditor</TD><TD>Gem management</TD></tr>
            <tr><TD>Admin Nuggets</TD><TD>/admin/nuggets</TD><TD>requireEditor</TD><TD>Wisdom nugget CRUD</TD></tr>
            <tr><TD>Gear</TD><TD>/gear, /admin/gear</TD><TD>None / requireEditor</TD><TD>Reviewed products</TD></tr>
            <tr><TD>Water Wheel</TD><TD>/water-wheel</TD><TD>None</TD><TD>Interactive feature state</TD></tr>
            <tr><TD>Admin Categories</TD><TD>/admin/categories</TD><TD>requireEditor</TD><TD>Category management</TD></tr>
            <tr><TD>Admin Council</TD><TD>/admin/council</TD><TD>requireEditor</TD><TD>Expert Council CRUD</TD></tr>
            <tr><TD>Ground Events</TD><TD>/ground-events</TD><TD>None</TD><TD>Community events, RSVP</TD></tr>
            <tr><TD>Admin Ground Events</TD><TD>/admin/ground-events</TD><TD>requireEditor</TD><TD>Host and RSVP oversight</TD></tr>
            <tr><TD>Stripe Workshops</TD><TD>/ground-events/:id/connect</TD><TD>None</TD><TD>Stripe Connect for workshop hosts</TD></tr>
            <tr><TD>Field Notes</TD><TD>/field-notes</TD><TD>None</TD><TD>Public field notes</TD></tr>
            <tr><TD>Admin Field Notes</TD><TD>/admin/field-notes</TD><TD>requireEditor</TD><TD>Field note management</TD></tr>
            <tr><TD>Admin Sync Status</TD><TD>/admin/sync-status</TD><TD>requireEditor</TD><TD>Background sync monitoring</TD></tr>
            <tr><TD>Map</TD><TD>/map</TD><TD>None</TD><TD>Interactive map, zone assessment</TD></tr>
            <tr><TD>Codetry Assess</TD><TD>POST /codetry/assess</TD><TD>None</TD><TD>gpt-4o-mini skills assessment</TD></tr>
            <tr><TD>Headwaters</TD><TD>/headwaters/*</TD><TD>x-hw-passphrase</TD><TD>CRM: clients, intake, AI review, dashboard, business</TD></tr>
            <tr><TD>Fireside Chats</TD><TD>/fireside-flames</TD><TD>None / requireEditor</TD><TD>Fireside Chat episode management</TD></tr>
            <tr><TD>Brigade</TD><TD>/brigade, /admin/brigade</TD><TD>requireEditor</TD><TD>Membership status, stats, MRR</TD></tr>
            <tr><TD>Cohorts</TD><TD>/cohorts, /admin/cohorts</TD><TD>None / requireEditor</TD><TD>Browse, enroll, manage cohorts</TD></tr>
            <tr><TD>Admin XRP Rate</TD><TD>/admin/xrp-rate</TD><TD>None</TD><TD>XRP rate health monitor</TD></tr>
            <tr><TD>Kits</TD><TD>/kits, /kits/:slug</TD><TD>None</TD><TD>Discovery, Stripe/Zaprite checkout, inquiry</TD></tr>
            <tr><TD>Admin Kit Purchases</TD><TD>/admin/kit-purchases</TD><TD>requireEditor</TD><TD>Purchase and inquiry tracking</TD></tr>
            <tr><TD>Admin Gord Tips</TD><TD>/admin/gord-tips</TD><TD>requireEditor</TD><TD>Gord tip tracking</TD></tr>
            <tr><TD>Practitioners</TD><TD>/practitioners</TD><TD>None</TD><TD>Practitioner directory</TD></tr>
            <tr><TD>Trailblazer</TD><TD>POST /trailblazer/chat</TD><TD>None</TD><TD>SSE streaming AI trail guide</TD></tr>
            <tr><TD>Gord</TD><TD>/gord/chat, /gord/tip</TD><TD>None</TD><TD>Gord AI guide + tipping</TD></tr>
            <tr><TD>Zaprite Webhook</TD><TD>POST /zaprite/webhook</TD><TD>HMAC signature</TD><TD>Bitcoin/Lightning/XRP/RLUSD payments</TD></tr>
            <tr><TD>Stripe Webhook</TD><TD>POST /stripe/webhook</TD><TD>Stripe signature</TD><TD>Checkout events — kits, brigade, cohorts, workshops</TD></tr>
            <tr><TD>Stomping Path API</TD><TD>/stomping-path/*</TD><TD>Varies</TD><TD>Compass clustering, dam days, practitioner handles</TD></tr>
          </tbody>
        </T>

        {/* 9. Page Routes */}
        <div className="pb" />
        <h2 style={S.h2}>9. Frontend Page Routes</h2>

        <h3 style={S.h3}>The Stomping Paths (stomping-paths) — prefix: /</h3>
        <T>
          <thead><tr><TH>Route</TH><TH>What it does</TH></tr></thead>
          <tbody>
            {[
              ["/", "Home — hero, daily stomp, featured episodes, Stomping Grounds"],
              ["/episodes", "Searchable archive — 6,000+ episodes"],
              ["/episodes/:slug", "Episode — audio player, transcript, show notes"],
              ["/library", "Full resource library browser"],
              ["/library/:slug", "Library item detail"],
              ["/series", "Curated series index"],
              ["/series/unloose-the-goose", "Dedicated Unloose the Goose landing"],
              ["/series/:slug", "Series detail with episode list"],
              ["/zones", "Lifestyle zones introduction"],
              ["/zones/:slug", "Content filtered by zone"],
              ["/tracks", "Learning tracks index"],
              ["/tracks/:slug", "Step-by-step track episode list"],
              ["/start", "New listener onboarding"],
              ["/transform", "Interactive transformation guides"],
              ["/about", "About the podcast and mission"],
              ["/council", "Expert Council public directory"],
              ["/council/join", "Expert Council application"],
              ["/council/:slug", "Individual council member profile"],
              ["/workshops", "Workshop discovery"],
              ["/workshops/host", "Host a workshop"],
              ["/workshops/dashboard", "Attendee management"],
              ["/wishing-well", "V4V listener support / tipping"],
              ["/wisdom-dig", "Extracted wisdom nugget search"],
              ["/stomping-grounds", "Map-based community events"],
              ["/history", "Episode timeline"],
              ["/map", "Interactive Homestead Map (auth-gated)"],
              ["/brigade", "Brigade membership landing"],
              ["/cohorts", "Browse cohorts"],
              ["/cohorts/founding", "Founding cohort waitlist"],
              ["/cohorts/:id", "Cohort detail and registration"],
              ["/headwaters", "Headwaters integration page — lifestyle map"],
              ["/kits", "All 8 kits grid"],
              ["/kits/find", "5-question kit finder wizard"],
              ["/kits/:slug", "Kit detail — episodes, gear, pricing"],
              ["/kits/:slug/welcome", "Post-purchase welcome + user manual"],
              ["/practitioners", "Practitioner directory"],
              ["/admin/brigade", "Subscription and membership stats"],
              ["/admin/categories", "Category management"],
              ["/admin/content-gaps", "Topic request tracking"],
              ["/admin/gear", "Gear catalog management"],
              ["/admin/ground-events", "Events and meetup management"],
              ["/admin/wisdom", "Wisdom extraction management"],
              ["/admin/kit-purchases", "Kit sales and inquiry tracking"],
              ["/admin/series-health", "Series consistency monitoring"],
              ["/admin/expert-listings", "Expert application review"],
              ["/admin/cohorts", "Cohort management"],
            ].map(([r, d]) => <tr key={r}><TD><C>{r}</C></TD><TD>{d}</TD></tr>)}
          </tbody>
        </T>

        <h3 style={S.h3}>Codetry — prefix: /codetry/</h3>
        <T>
          <thead><tr><TH>Route</TH><TH>What it does</TH></tr></thead>
          <tbody>
            {[
              ["/", "Landing — Code Literacy + Crypto Keys entry doors; ForgeHero Monaco editor"],
              ["/services", "Council Kit — three tiers: Zone Assessment, Hub Implementation, Regional Platform"],
              ["/work", "Portfolio — 807 Food Co-op, Parr's Jars, community case studies"],
              ["/discover", "7-step AI sovereignty assessment → Stage 1–6 result"],
              ["/workbench", "Stack Map, Bitcoin BIP39 ceremony, XRPL wallet ceremony, The Machine"],
            ].map(([r, d]) => <tr key={r}><TD><C>{r}</C></TD><TD>{d}</TD></tr>)}
          </tbody>
        </T>

        <h3 style={S.h3}>Headwaters Field Journal — prefix: /headwaters/</h3>
        <p style={{ ...S.p, fontSize: "11px", color: "#555" }}>Unguarded routes accessible to anyone. Guarded routes require the HEADWATERS_PASSPHRASE.</p>
        <T>
          <thead><tr><TH>Route</TH><TH>Guard</TH><TH>What it does</TH></tr></thead>
          <tbody>
            {[
              ["/", "None", "Gate landing — Field Journal fork / The Trail fork"],
              ["/overview", "None", "The Full Map — 49-feature inventory across all artifacts"],
              ["/print", "None", "This document"],
              ["/stomping-path", "None", "Zone 2 tools hub"],
              ["/stomping-path/compass", "None", "Decision-making — where are you on the path?"],
              ["/stomping-path/dam-days", "None", "Project log — progress capture, export"],
              ["/stomping-path/creator", "None", "Personal journey builder"],
              ["/stomping-path/share/:id", "None", "Shareable practitioner trail card"],
              ["/shallows", "None", "Zone 5 still-water — leave a name"],
              ["/clients", "Passphrase", "Searchable client list"],
              ["/clients/new", "Passphrase", "New client intake form"],
              ["/clients/:id", "Passphrase", "Client profile — contact, status, notes"],
              ["/intake/:id", "Passphrase", "Free-form notes dump"],
              ["/intake/:id/review", "Passphrase", "AI-assisted intake review"],
              ["/business/priorities", "Passphrase", "Strategic planning grid"],
              ["/business/financials", "Passphrase", "Monthly income modelling — low/high projections"],
              ["/business/notes", "Passphrase", "Archival notes"],
              ["/business/online-engine", "Passphrase", "Marketing channel tracking"],
              ["/settings", "Passphrase", "Practitioner profile (localStorage)"],
              ["/submissions", "Passphrase", "External form submission log"],
            ].map(([r, g, d]) => <tr key={r}><TD><C>{r}</C></TD><TD>{g}</TD><TD>{d}</TD></tr>)}
          </tbody>
        </T>

        <h3 style={S.h3}>Privacy Guide — prefix: /privacy-guide/</h3>
        <p style={S.p}>Single-page React app. Sections: Core Principles · Family & Lodge (Clearing/Lodge distinction) · Threat Clearing · Satellite & Drone · Keeper's Kit · Duck Song Signal · Tools & Workshop · Resources. Checklist state in localStorage. Zone 0 stewardship framing. Print/PDF supported. The Keeper's Kit Standing Protective Declaration is reproduced in full in <strong>Appendix A</strong> of this document for standalone filing.</p>

        <h3 style={S.h3}>TSP Mobile (Expo)</h3>
        <T>
          <thead><tr><TH>Tab/Route</TH><TH>What it does</TH></tr></thead>
          <tbody>
            {[
              ["(tabs)/index", "Home — featured episodes, daily stomp"],
              ["(tabs)/episodes", "Full episode library — streamable/downloadable"],
              ["(tabs)/library", "Curated resource library"],
              ["(tabs)/map", "Zone map, kit references"],
              ["(tabs)/stomp", "Daily stomp tracker"],
              ["(tabs)/wallet", "Lightning/V4V — stream sats to creators"],
              ["kits/index", "Kit list"],
              ["kits/[slug]", "Kit detail"],
              ["kits/find", "Kit finder wizard"],
              ["episodes/[slug]", "Episode detail"],
              ["library/[slug]", "Library item detail"],
            ].map(([r, d]) => <tr key={r}><TD><C>{r}</C></TD><TD>{d}</TD></tr>)}
          </tbody>
        </T>

        {/* 10. Constitutional Framework */}
        <div className="pb" />
        <h2 style={S.h2}>10. Constitutional Framework</h2>

        <h3 style={S.h3}>The Eave Rule (poured concrete, non-negotiable)</h3>
        <blockquote style={{ ...S.blockquote, borderLeftColor: "#c00", fontStyle: "normal" }}>
          No table, no foreign key, no join, no query path, and no stored reference may ever connect
          a Zone 3 wallet address to a Zone 1 household record. Any feature that would create such a
          path must be refused or redesigned.
        </blockquote>

        <h3 style={S.h3}>The Three-Table Model</h3>
        <T>
          <thead><tr><TH>Table</TH><TH>Zone</TH><TH>Register</TH></tr></thead>
          <tbody>
            <tr><TD>Kitchen table</TD><TD>Z0–Z1</TD><TD>Inside. Curtains. Deciding, curing, posture.</TD></tr>
            <tr><TD>The Deck</TD><TD>Z2</TD><TD>Your property, facing outward. Working in the open air.</TD></tr>
            <tr><TD>Picnic table</TD><TD>Z3+</TD><TD>Community land. No roof. You carried it out here.</TD></tr>
          </tbody>
        </T>

        <h3 style={S.h3}>The Three-Stage Trail</h3>
        <T>
          <thead><tr><TH>Stage</TH><TH>Name</TH><TH>What's true</TH><TH>The ceiling</TH></tr></thead>
          <tbody>
            <tr><TD>1</TD><TD>Doom Crowd</TD><TD>Diagnosis correct — extraction is real</TD><TD>Fear without a watershed</TD></tr>
            <tr><TD>2</TD><TD>Ron Paul Pivot</TD><TD>Sound money, household sovereignty, opt out</TD><TD>Stops at household — no community rung</TD></tr>
            <tr><TD>3</TD><TD>Headwaters Kitchen Table</TD><TD>Household sovereignty → watershed → community institutions</TD><TD>The floor, not the ceiling</TD></tr>
          </tbody>
        </T>

        <h3 style={S.h3}>Stage Bridge Language</h3>
        <T>
          <thead><tr><TH>From</TH><TH>To</TH><TH>The bridge</TH></tr></thead>
          <tbody>
            <tr><TD>Doom Crowd</TD><TD>Ron Paul Pivot</TD><TD>"The diagnosis is right. The exit is wrong. Fear is still making someone else rich."</TD></tr>
            <tr><TD>Ron Paul Pivot</TD><TD>Kitchen Table</TD><TD>"Paul got you to the household. The watershed is the next rung. Individual sovereignty is the floor, not the ceiling."</TD></tr>
            <tr><TD>Ramsey</TD><TD>Kitchen Table</TD><TD>"You plugged the household leak. Now where does the surplus actually go? Outside institutions is still a leak."</TD></tr>
            <tr><TD>Any stage</TD><TD>Crypto Corner</TD><TD>"Key custody is a Zone 0 practice. Same shelf as the pantry. Either you hold it or someone else does."</TD></tr>
            <tr><TD>Stage 3</TD><TD>Codetry Ship</TD><TD>"You walked the trail. Here's the crew."</TD></tr>
          </tbody>
        </T>

        <h3 style={S.h3}>The Watershed Compact — Six Principles</h3>
        <ol style={{ paddingLeft: "20px", marginBottom: "10px" }}>
          <li style={{ marginBottom: "6px" }}><strong>Stop the leak first.</strong> Patch before planting. A leaking household cannot build a watershed.</li>
          <li style={{ marginBottom: "6px" }}><strong>Own the ground.</strong> Tangible ownership over financial instruments. Cryptographic key custody over exchange custody.</li>
          <li style={{ marginBottom: "6px" }}><strong>We do not build dependency.</strong> Every tool we build must outlast us. If it requires us to function, it is not a community asset.</li>
          <li style={{ marginBottom: "6px" }}><strong>Seven-generation stewardship.</strong> Generation 0 stabilizes. Generations 1+ build the institutions and relationships.</li>
          <li style={{ marginBottom: "6px" }}><strong>The community layer is the ceiling.</strong> Individual sovereignty is the floor. Wealth that stays in the household still leaks if community institutions are not owned.</li>
          <li style={{ marginBottom: "6px" }}><strong>Hard boundaries.</strong> Outside capital, governance, ownership = extraction in a different coat.</li>
        </ol>

        {/* 11. Key People */}
        <h2 style={S.h2}>11. Key People</h2>
        <T>
          <thead><tr><TH>Name</TH><TH>Role</TH><TH>Notes</TH></tr></thead>
          <tbody>
            <tr><TD>Bobbie Parr</TD><TD>Practitioner, project author</TD><TD>Owns Headwaters intake tool. Zone 1 practitioner.</TD></tr>
            <tr><TD>Jack Spirko</TD><TD>The Survival Podcast host</TD><TD>Bitcoin-only. XRP = "shit coin." Keep XRPL off TSP pages unless explicitly asked.</TD></tr>
            <tr><TD>Gord</TD><TD>AI mascot — owl/partridge</TD><TD>Deadpan. Zone 2 guide. Present on TSP and Codetry. Powered by gpt-5.</TD></tr>
          </tbody>
        </T>

        {/* 12. Language Rules */}
        <h2 style={S.h2}>12. Language & Framing Rules</h2>
        <ul style={{ paddingLeft: "20px", marginBottom: "10px" }}>
          <li style={{ marginBottom: "4px" }}>Lead always with watershed / water-cycle + permaculture lens.</li>
          <li style={{ marginBottom: "4px" }}>Saltbox = Zone 0 is the unambiguous centre of the whole system.</li>
          <li style={{ marginBottom: "4px" }}>The Aquifer = infrastructure substrate, never a numbered zone. Never brand it after any external company.</li>
          <li style={{ marginBottom: "4px" }}>Tone: practitioner, warm northern, quiet competence, grounded poetry. No hype, no corporate gloss.</li>
          <li style={{ marginBottom: "4px" }}>Avoid: "platform," "onboarding," "ecosystem," "stakeholder," "synergy," "scalable," "user acquisition."</li>
          <li style={{ marginBottom: "4px" }}>Wayfinding: every artifact should carry "Zone X of 5" somewhere visible.</li>
          <li style={{ marginBottom: "4px" }}>Bitcoin: sovereignty infrastructure, not speculation. Key custody is a Zone 0 practice.</li>
          <li style={{ marginBottom: "4px" }}>Payments: Stripe = test mode only. Real payments = Zaprite (Bitcoin/Lightning).</li>
        </ul>
        <p style={S.p}><strong>Codetry explainer (use wherever Codetry appears):</strong></p>
        <blockquote style={S.blockquote}>
          "the digital sovereignty workbench for Stomping Path practitioners — XRPL tools, key custody,
          community payment rails, and the code skills to run them yourself."
        </blockquote>

        {/* 13. Environment Variables */}
        <div className="pb" />
        <h2 style={S.h2}>13. Environment Variables</h2>
        <T>
          <thead><tr><TH>Variable</TH><TH>Used by</TH><TH>Purpose</TH><TH>Status</TH></tr></thead>
          <tbody>
            <tr><TD>DATABASE_URL</TD><TD>api-server, lib/db</TD><TD>PostgreSQL connection</TD><TD>Set</TD></tr>
            <tr><TD>HEADWATERS_PASSPHRASE</TD><TD>api-server</TD><TD>Headwaters gate passphrase</TD><TD>Set</TD></tr>
            <tr><TD>OPENAI_API_KEY</TD><TD>api-server</TD><TD>Gord, Trailblazer, intake AI review</TD><TD>Set</TD></tr>
            <tr><TD>STRIPE_SECRET_KEY</TD><TD>api-server</TD><TD>Stripe payment processing (test mode)</TD><TD>Set</TD></tr>
            <tr><TD>STRIPE_WEBHOOK_SECRET</TD><TD>api-server</TD><TD>Stripe webhook signature verification</TD><TD>Set</TD></tr>
            <tr><TD>ZAPRITE_WEBHOOK_SECRET</TD><TD>api-server</TD><TD>Zaprite webhook HMAC verification</TD><TD>⚠ NOT SET</TD></tr>
            <tr><TD>ZAPRITE_API_KEY</TD><TD>api-server</TD><TD>Zaprite Bitcoin/Lightning payments</TD><TD>Set</TD></tr>
            <tr><TD>SENDGRID_API_KEY</TD><TD>api-server</TD><TD>Transactional emails (RSVPs, kit confirmations)</TD><TD>Set</TD></tr>
            <tr><TD>KIT_STRIPE_PRICE_IDS</TD><TD>api-server</TD><TD>Stripe product IDs for kits</TD><TD>⚠ NOT SET</TD></tr>
          </tbody>
        </T>

        {/* 14. Workflow Commands */}
        <h2 style={S.h2}>14. Workflow Commands</h2>
        <pre style={S.pre}>{`# Dev servers
pnpm --filter @workspace/api-server run dev        # API (port 8080)
pnpm --filter @workspace/stomping-paths run dev    # TSP web
pnpm --filter @workspace/codetry run dev           # Codetry
pnpm --filter @workspace/privacy-guide run dev     # Privacy Guide
pnpm --filter @workspace/headwaters run dev        # Headwaters (port 21502)
pnpm --filter @workspace/tsp-mobile run dev        # Expo mobile

# Build
pnpm run build                      # typecheck + build all
pnpm run typecheck                  # full typecheck

# API codegen (run after any openapi.yaml change — mandatory)
pnpm --filter @workspace/api-spec run codegen

# Database (run after any schema change)
pnpm --filter @workspace/db run db:push`}</pre>

        {/* 15. Gotchas */}
        <h2 style={S.h2}>15. Build-Time Patterns & Gotchas</h2>
        <ol style={{ paddingLeft: "20px", marginBottom: "10px" }}>
          <li style={{ marginBottom: "6px" }}><strong>OpenAPI first.</strong> After any API change: edit openapi.yaml → run codegen → use generated hooks. Never hand-write types.</li>
          <li style={{ marginBottom: "6px" }}><strong>Drizzle.</strong> Use inArray(col, arr) not SQL template ANY() syntax — the latter serialises incorrectly.</li>
          <li style={{ marginBottom: "6px" }}><strong>RSS duplicate categories.</strong> "friday flashbacks" vs "Friday Flashbacks" — upstream in Jack's feed. Surfaced as-is.</li>
          <li style={{ marginBottom: "6px" }}><strong>Library backfill.</strong> Fresh DBs show ~30s partial state on boot (background fill runs on startup).</li>
          <li style={{ marginBottom: "6px" }}><strong>API server port must be 8080.</strong> Previous collision fixed; be aware if touching config.</li>
          <li style={{ marginBottom: "6px" }}><strong>Stripe webhook raw body.</strong> Must be registered BEFORE express.json() — raw Buffer required for signature verification.</li>
          <li style={{ marginBottom: "6px" }}><strong>YouTube graceful degradation.</strong> Per-channel RSS currently 404s — logs zero items, does not fail the whole sync.</li>
          <li style={{ marginBottom: "6px" }}><strong>WP REST upsert.</strong> Jack's WP server intermittently 500s on deep pages — retries with backoff, skips unrecoverable.</li>
          <li style={{ marginBottom: "6px" }}><strong>Codetry XRPL.</strong> xrpl.js and bip39 lazy-loaded (browser-only). Buffer polyfill in main.tsx. define: global: "globalThis" in vite.config.ts.</li>
          <li style={{ marginBottom: "6px" }}><strong>7-artifact limit reached.</strong> New pages/features must go inside existing artifacts as new routes.</li>
          <li style={{ marginBottom: "6px" }}><strong>pnpm supply-chain.</strong> minimumReleaseAge: 1440 — packages must be 24h old before install. Replit-scoped packages are excluded.</li>
        </ol>

        {/* 16. Open Items */}
        <h2 style={S.h2}>16. Open Items (as of May 30, 2026)</h2>
        <ol style={{ paddingLeft: "20px", marginBottom: "10px" }}>
          <li style={{ marginBottom: "6px" }}><strong>/aquifer framing page</strong> — public cross-zone substrate explanation. Not built.</li>
          <li style={{ marginBottom: "6px" }}><strong>Consistent "Zone X of 5" wayfinding</strong> — present on hero badges; missing from many interior pages.</li>
          <li style={{ marginBottom: "6px" }}><strong>Domain hygiene</strong> — Zone 2 now live at stomping-paths.replit.app. Custom domain migration still optional.</li>
          <li style={{ marginBottom: "6px" }}><strong>Zone 5 population</strong> — Edge / Ridge is thin.</li>
          <li style={{ marginBottom: "6px" }}><strong>Gord cross-door links</strong> — Greenhouse ↔ Portal not wired.</li>
          <li style={{ marginBottom: "6px" }}><strong>Deadfall archiving</strong> — Renamed from "Deadhead." Not built.</li>
          <li style={{ marginBottom: "6px" }}><strong>ZAPRITE_WEBHOOK_SECRET not set</strong> — signature check skipped. Must be set before real Bitcoin payments go live.</li>
          <li style={{ marginBottom: "6px" }}><strong>KIT_STRIPE_PRICE_IDS not set</strong> — Stripe auto-creates products on cold start (wasteful).</li>
          <li style={{ marginBottom: "6px" }}><strong>Kit content gating</strong> — /api/kits/:slug/access exists but frontend never calls it. All kit content publicly visible.</li>
          <li style={{ marginBottom: "6px" }}><strong>Visual language alignment</strong> — celestial sky + earth terrain not consistently applied across all artifacts.</li>
        </ol>

        {/* Footer */}
        <hr style={S.hr} />
        <p style={{ ...S.p, color: "#777", fontSize: "11px", textAlign: "center" }}>
          Headwaters Watershed · 807 Food Co-operative Inc. · Dryden, Ontario · May 30, 2026
        </p>

        {/* Appendix A: Keeper's Kit Declaration */}
        <div className="pb" />
        <div id="keepers-kit-declaration">
        <h2 style={S.h2}>Appendix A — Keeper's Kit: Standing Protective Declaration</h2>
        <p style={S.p}>
          A standing protective declaration for parents placing a record on behalf of their
          children's likeness, voice, and words — specifically against future manufactured-consent
          attacks using reconstructive AI or deepfake technology. Print, complete by hand, witness,
          and file. Give one copy to each keeper. The declaration transfers to the child at majority.
        </p>

        <h3 style={S.h3}>The Five Instruments</h3>
        <T>
          <thead><tr><TH>#</TH><TH>Instrument</TH><TH>What it does</TH></tr></thead>
          <tbody>
            <tr><TD>1</TD><TD>The Standing Declaration</TD><TD>Dated, witnessed statement that the child's likeness, voice, image, body, and words in any medium during their minority cannot constitute consent of any kind for adult, sexual, or exploitative content. No public domain argument, open space claim, or reconstructed context supersedes it.</TD></tr>
            <tr><TD>2</TD><TD>The Refused Shelf Entry</TD><TD>Permanent declaration that the child's play language — water language, touch language, physical play requests — is refused as source material for any adult or exploitative mapping. The refusal is not conditional on where the capture happened.</TD></tr>
            <tr><TD>3</TD><TD>The Contextual Fabric Stamp</TD><TD>Dated log for occasions where public-domain capture is likely. Each entry: date and location, ages present, what the children were doing, what words meant in the child's vocabulary at that age, who was present, one-sentence keeper witness statement.</TD></tr>
            <tr><TD>4</TD><TD>The Age Anchor</TD><TD>Standing record stating the child's date of birth and that they were a minor at the time of every relevant recording. Minority is structural, not moral — it cannot be argued away in court or content moderation.</TD></tr>
            <tr><TD>5</TD><TD>The Keeper Chain</TD><TD>Name two or more people who hold the same record independently. An attacker must contradict every keeper simultaneously. Resilience through multiplication.</TD></tr>
          </tbody>
        </T>

        <div style={{
          border: "1.5px solid #bbb",
          borderRadius: "4px",
          padding: "28px 32px 24px",
          marginTop: "28px",
          marginBottom: "10px",
          pageBreakInside: "avoid" as const,
        }}>
          <div style={{ textAlign: "center", marginBottom: "18px" }}>
            <div style={{ fontSize: "17px", fontWeight: "bold", marginBottom: "4px", letterSpacing: "0.01em" }}>
              Standing Protective Declaration
            </div>
            <div style={{ fontSize: "12px", color: "#555" }}>
              Child Likeness, Voice, and Words — Minor's Record
            </div>
          </div>

          <p style={{ ...S.p, marginBottom: "18px" }}>
            I, the undersigned Keeper, place this declaration on behalf of the child named
            below. This declaration is standing, permanent, and not conditional on
            jurisdiction, platform, or the legal status of any technology at the time of
            any future use.
          </p>

          <div style={{ marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", whiteSpace: "nowrap", minWidth: "130px" }}>Child's full name</span>
              <span style={{ flex: 1, borderBottom: "1px solid #555", display: "block", height: "18px" }} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", whiteSpace: "nowrap", minWidth: "130px" }}>Date of birth</span>
              <span style={{ width: "120px", borderBottom: "1px solid #555", display: "block", height: "18px" }} />
              <span style={{ fontSize: "12px", whiteSpace: "nowrap", marginLeft: "24px" }}>Date of majority</span>
              <span style={{ width: "120px", borderBottom: "1px solid #555", display: "block", height: "18px" }} />
            </div>
          </div>

          <div style={{ background: "#f8f8f8", borderLeft: "3px solid #bbb", padding: "10px 14px", marginBottom: "12px", fontSize: "12px", lineHeight: "1.6" }}>
            <strong>Standing Declaration —</strong> The child named above was a minor at
            the time of every recording, capture, and publication covered by this
            declaration. Their likeness, voice, image, body, and words in any medium during
            their minority cannot constitute consent of any kind for adult, sexual, or
            exploitative content or context. No public domain argument, open space claim,
            reconstructed context, AI-generated derivation, or synthetic media supersedes
            this declaration.
          </div>

          <div style={{ background: "#f8f8f8", borderLeft: "3px solid #bbb", padding: "10px 14px", marginBottom: "12px", fontSize: "12px", lineHeight: "1.6" }}>
            <strong>Refused Shelf Entry —</strong> The child's play language — including
            but not limited to water language, touch language, and physical play requests —
            is permanently refused as source material for any adult or exploitative mapping,
            regardless of the medium of original capture or the technology used for
            derivation.
          </div>

          <div style={{ background: "#f8f8f8", borderLeft: "3px solid #bbb", padding: "10px 14px", marginBottom: "18px", fontSize: "12px", lineHeight: "1.6" }}>
            <strong>Age Anchor —</strong> The child's date of birth is recorded above. They
            were a minor at the time of all recordings covered by this declaration. This is
            a matter of verifiable record.
          </div>

          <div style={{ marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", whiteSpace: "nowrap", minWidth: "130px" }}>Keeper's full name</span>
              <span style={{ flex: 1, borderBottom: "1px solid #555", display: "block", height: "18px" }} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", whiteSpace: "nowrap", minWidth: "130px" }}>Keeper's signature</span>
              <span style={{ flex: 1, borderBottom: "1px solid #555", display: "block", height: "18px" }} />
              <span style={{ fontSize: "12px", whiteSpace: "nowrap", marginLeft: "24px" }}>Date</span>
              <span style={{ width: "100px", borderBottom: "1px solid #555", display: "block", height: "18px" }} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", whiteSpace: "nowrap", minWidth: "130px" }}>Witness name</span>
              <span style={{ flex: 1, borderBottom: "1px solid #555", display: "block", height: "18px" }} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", whiteSpace: "nowrap", minWidth: "130px" }}>Witness signature</span>
              <span style={{ flex: 1, borderBottom: "1px solid #555", display: "block", height: "18px" }} />
              <span style={{ fontSize: "12px", whiteSpace: "nowrap", marginLeft: "24px" }}>Date</span>
              <span style={{ width: "100px", borderBottom: "1px solid #555", display: "block", height: "18px" }} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", whiteSpace: "nowrap", minWidth: "130px" }}>Secondary keeper</span>
              <span style={{ flex: 1, borderBottom: "1px solid #555", display: "block", height: "18px" }} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", whiteSpace: "nowrap", minWidth: "130px" }}>Filing location</span>
              <span style={{ flex: 1, borderBottom: "1px solid #555", display: "block", height: "18px" }} />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "12px", whiteSpace: "nowrap", minWidth: "130px" }}>On-chain anchor</span>
              <span style={{ flex: 1, borderBottom: "1px solid #555", display: "block", height: "18px" }} />
            </div>
            <div style={{ fontSize: "10px", color: "#777", marginLeft: "138px" }}>XRPL transaction hash, when available</div>
          </div>

          <div style={{ background: "#f8f8f8", borderLeft: "3px solid #bbb", padding: "10px 14px", marginBottom: "18px", fontSize: "12px", lineHeight: "1.6", fontStyle: "italic" }}>
            <strong style={{ fontStyle: "normal" }}>Handoff at majority —</strong> This declaration transfers to the child
            at the date of majority listed above. The Keeper will perform a named handoff:{" "}
            <em>"I held this on your behalf. Here is what I witnessed. This is yours now."</em>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#777", borderTop: "1px solid #e0e0e0", paddingTop: "10px" }}>
            <span>Clearing &amp; Lodge Family Privacy Guide — Keeper's Kit</span>
            <span>Headwaters Watershed · 807 Food Co-operative Inc. · Dryden, Ontario</span>
          </div>
        </div>

        <p style={{ ...S.p, fontSize: "11px", color: "#777", fontStyle: "italic" }}>
          Complete all blanks by hand after printing. File one copy; give one copy to each keeper named above.
          A fence built before the trespass is a boundary. A fence built after is a patch.
        </p>
        </div>

        <hr style={S.hr} />
        <p style={{ ...S.p, color: "#777", fontSize: "11px", textAlign: "center" }}>
          Headwaters Watershed · 807 Food Co-operative Inc. · Dryden, Ontario · May 30, 2026
        </p>
      </div>
    </>
  );
}
