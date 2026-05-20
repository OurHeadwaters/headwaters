import { useEffect, useRef } from "react";

const STORAGE_KEY = "sandbox-handbook-community-name";

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || "";
    if (inputRef.current) inputRef.current.value = saved;
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    localStorage.setItem(STORAGE_KEY, e.target.value);
  }

  return (
    <div className="page-root">
      {/* HEADER */}
      <header className="page-header">
        <div className="header-left">
          <span className="header-title">Family Privacy Guide</span>
          <span className="header-subtitle">The Clearing &amp; The Lodge — Homeschool Digital Handbook</span>
        </div>
        <div className="header-right">
          <label className="community-label">Community</label>
          <input
            ref={inputRef}
            className="community-input"
            type="text"
            placeholder="Your community name"
            onChange={handleChange}
            maxLength={40}
          />
        </div>
      </header>

      {/* BODY */}
      <div className="page-body">
        {/* LEFT COLUMN */}
        <div className="col-left">

          <Section color="terracotta" label="The Clearing">
            The Clearing is your family's private sandbox — a locally-run workspace
            where children compose, draft, and experiment without anything leaving
            your home network. Notes, voice memos, and sketches stay on your device
            unless you deliberately share them. Think of it as a fenced garden: the
            gate is closed by default, and only you hold the latch.
          </Section>

          <Section color="moss" label="The Lodge">
            The Lodge is your community's shared meeting hall — a Saltbox instance
            hosted by your co-op coordinator. Families post announcements, share
            curriculum links, and hold threaded discussions here. Everything posted
            in The Lodge is visible to all enrolled families and stored on the
            coordinator's server. Post here as you would on a community bulletin board:
            thoughtfully, and without sensitive personal details.
          </Section>

          <Section color="moss" label="The key on the hook">
            Every family receives one login per household, protected by a passphrase
            chosen at enrollment. Your passphrase is never stored in plain text. Do
            not share it with other families — if a child needs separate access,
            ask the coordinator to create a junior account. Rotate your passphrase
            once per school year or immediately if you suspect it has been seen
            by someone outside your household.
          </Section>

          <Section color="moss" label="The mailbox">
            Direct messages sent through The Lodge travel encrypted in transit but
            are stored on the coordinator's server in readable form for moderation.
            Do not use Lodge messages for sensitive matters: medical details,
            financial arrangements, or disciplinary conversations belong in a
            separate end-to-end encrypted channel such as Signal. The Lodge
            mailbox is for logistics — field trips, book orders, scheduling.
          </Section>

          <Section color="moss" label="Three simple habits">
            <strong>Lock before you leave.</strong> Enable your device's auto-lock
            after two minutes of inactivity so The Clearing is never open on an
            unattended screen.{" "}
            <strong>One task, one tab.</strong> Close The Lodge session when you
            step away from community work; a stray open tab can expose your session
            token.{" "}
            <strong>Updates are not optional.</strong> When The Clearing or Lodge
            app prompts for an update, apply it within 48 hours — security patches
            are the fastest fix for known risks.
          </Section>

          <Section color="terracotta" label="Zone identity">
            Treat The Clearing as Zone 0 — intimate, personal, and fully under
            your control. Treat The Lodge as Zone 2 — shared with trusted neighbours
            but open to the whole co-op. Never place Zone 0 material (personal
            journals, health notes, financial records) into a Zone 2 space. When
            in doubt, ask yourself: "Would I pin this to the co-op noticeboard?"
            If the answer is no, keep it in The Clearing.
          </Section>

          <Section color="moss" label="The covered wagon route">
            A VPN (Virtual Private Network) encrypts the road between your device
            and the internet, hiding your family's browsing from your internet
            provider and from coffee-shop networks. A VPN does not make you
            anonymous — the VPN provider still sees your traffic — but it does
            prevent casual surveillance. The comparison panel on the right lists
            four vetted providers suitable for family use. Choose one with a
            published no-log audit and a jurisdiction outside the Five Eyes
            intelligence alliance.
          </Section>

          <Section color="moss" label="The Canadian legal landscape" noMargin>
            Canada's <em>Personal Information Protection and Electronic Documents
            Act</em> (PIPEDA) gives you the right to know what data an organization
            holds about you and to request its correction or deletion. Quebec's
            Law 25 strengthens these rights for residents of that province. If your
            co-op collects enrolment data, the coordinator must have a written
            privacy policy, obtain meaningful consent, and delete records when no
            longer needed. You may file a complaint with the Office of the Privacy
            Commissioner of Canada at priv.gc.ca at no cost.
          </Section>

        </div>

        {/* RIGHT COLUMN */}
        <div className="col-right">

          {/* Panel 1: What's stored where */}
          <div className="panel">
            <div className="panel-heading moss">What&rsquo;s stored where</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="th-label"></th>
                  <th className="th-terracotta">Clearing</th>
                  <th className="th-moss">Lodge</th>
                  <th className="th-brown">Cloud</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="row-label">Notes &amp; drafts</td>
                  <td className="td-check">Your device</td>
                  <td className="td-no">No</td>
                  <td className="td-no">No</td>
                </tr>
                <tr>
                  <td className="row-label">Posts &amp; replies</td>
                  <td className="td-no">No</td>
                  <td className="td-check">Co-op server</td>
                  <td className="td-no">No</td>
                </tr>
                <tr>
                  <td className="row-label">Direct messages</td>
                  <td className="td-no">No</td>
                  <td className="td-check">Co-op server</td>
                  <td className="td-no">No</td>
                </tr>
                <tr>
                  <td className="row-label">Enrolment info</td>
                  <td className="td-no">No</td>
                  <td className="td-check">Co-op server</td>
                  <td className="td-no">No</td>
                </tr>
                <tr>
                  <td className="row-label">Curriculum files</td>
                  <td className="td-check">Your device</td>
                  <td className="td-opt">Optional</td>
                  <td className="td-no">No</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Panel 2: VPN comparison */}
          <div className="panel">
            <div className="panel-heading moss">VPN provider comparison</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="th-label">Provider</th>
                  <th className="th-moss">No-log audit</th>
                  <th className="th-moss">Jurisdiction</th>
                  <th className="th-moss">Family plan</th>
                </tr>
              </thead>
              <tbody>
                <tr className="row-good">
                  <td className="row-label">Mullvad</td>
                  <td className="td-check">Yes</td>
                  <td className="td-neutral">Sweden</td>
                  <td className="td-neutral">5 devices</td>
                </tr>
                <tr className="row-good">
                  <td className="row-label">ProtonVPN</td>
                  <td className="td-check">Yes</td>
                  <td className="td-neutral">Switzerland</td>
                  <td className="td-neutral">10 devices</td>
                </tr>
                <tr>
                  <td className="row-label">IVPN</td>
                  <td className="td-check">Yes</td>
                  <td className="td-neutral">Gibraltar</td>
                  <td className="td-neutral">7 devices</td>
                </tr>
                <tr>
                  <td className="row-label">Windscribe</td>
                  <td className="td-neutral">Partial</td>
                  <td className="td-neutral">Canada</td>
                  <td className="td-neutral">Unlimited</td>
                </tr>
              </tbody>
            </table>
            <p className="panel-note">Shaded rows have independently audited no-log policies.</p>
          </div>

          {/* Panel 3: Metaphor key */}
          <div className="panel">
            <div className="panel-heading moss">Metaphor key</div>
            <dl className="metaphor-list">
              <div className="metaphor-row">
                <dt>The Clearing</dt>
                <dd>Your private Sandbox workspace</dd>
              </div>
              <div className="metaphor-row">
                <dt>The Lodge</dt>
                <dd>Your co-op Saltbox instance</dd>
              </div>
              <div className="metaphor-row">
                <dt>Zone 0</dt>
                <dd>Intimate, device-only space</dd>
              </div>
              <div className="metaphor-row">
                <dt>Zone 2</dt>
                <dd>Shared with trusted co-op families</dd>
              </div>
              <div className="metaphor-row">
                <dt>Covered wagon</dt>
                <dd>A VPN tunnel</dd>
              </div>
              <div className="metaphor-row">
                <dt>Key on the hook</dt>
                <dd>Your household passphrase</dd>
              </div>
            </dl>
          </div>

          {/* Panel 4: Questions */}
          <div className="panel panel-questions">
            <div className="panel-heading moss">Questions?</div>
            <p className="questions-body">
              Bring concerns to your co-op privacy steward at the next gathering,
              or send a Signal message to the coordinator. For escalations, contact
              the Office of the Privacy Commissioner of Canada:
            </p>
            <p className="questions-url">priv.gc.ca &nbsp;·&nbsp; 1-800-282-1376</p>
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <footer className="page-footer">
        <span className="footer-disclaimer">
          This guide provides general privacy information for homeschool families and does not constitute legal advice.
          Consult a qualified privacy professional for advice specific to your situation.
        </span>
        <span className="footer-credit">Prepared for The Clearing &amp; The Lodge communities</span>
      </footer>
    </div>
  );
}

function Section({
  color,
  label,
  children,
  noMargin,
}: {
  color: "terracotta" | "moss";
  label: string;
  children: React.ReactNode;
  noMargin?: boolean;
}) {
  return (
    <div className={`section${noMargin ? " section-no-margin" : ""}`}>
      <div className={`section-label label-${color}`}>{label}</div>
      <div className={`section-rule rule-${color}`} />
      <p className="section-body">{children}</p>
    </div>
  );
}
