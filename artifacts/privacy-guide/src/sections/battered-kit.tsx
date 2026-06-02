import { useState } from "react";

export default function BatteredKitSection() {
  const [cardVisible, setCardVisible] = useState(false);

  return (
    <section id="battered-kit" className="trail-section">
      <div className="section-signpost">
        <span className="signpost-emoji" aria-hidden="true">🦆</span>
        <h2 className="signpost-title">The Duck Song Signal</h2>
      </div>

      <div className="journal-card bk-signal-card-intro">
        <div className="bk-signal-phrase" aria-label="The signal phrase">
          "Got any grapes?"
        </div>
        <p className="journal-section-body" style={{ textAlign: "center", marginBottom: 0 }}>
          Three words from a children's song. A community action protocol for mothers who
          cannot safely ask for help directly.
        </p>
      </div>

      <div className="journal-card">
        <h3 className="journal-section-title">Why it works</h3>
        <p className="journal-section-body">
          A mother can say this in any space — to a teacher at drop-off, a shelter worker, a
          clinic receptionist, a grocery clerk, a librarian, a pastor — in front of her children,
          in front of her partner, in a crowd. It sounds like a child quoting a song. It carries
          no risk if said to someone who doesn't know what it means. If said to someone who does,
          it activates an immediate, quiet community response.
        </p>
        <p className="journal-section-body">
          It crosses in plain sight. The abuser cannot recognize it as a threat because it
          doesn't register as one. Children already know the song — their presence is cover,
          not an obstacle. A child saying it gives the mother perfect deniability. The signal
          requires no explanation, no eye contact held longer than normal, no change of tone.
          It is invisible to anyone not trained to receive it.
        </p>
        <div className="tip-callout">
          <span className="tip-quill" aria-hidden="true">✍</span>
          <p>The phrase never changes. The response protocol is simple enough to remember without
          drilling. One prerequisite before any organization joins the network: a single
          designated call number for step three, known to all staff.</p>
        </div>
      </div>

      <div className="journal-card">
        <h3 className="journal-section-title">The Three-Tier Network</h3>
        <p className="journal-section-body">
          Training takes ten minutes: "If a woman with children says this to you, she is asking
          for help. Here is what to do." The network works because it embeds the signal in spaces
          the mother already passes through safely.
        </p>
        <div className="bk-tiers">
          <div className="bk-tier">
            <div className="bk-tier-num">Tier 1</div>
            <div className="bk-tier-body">
              <div className="bk-tier-title">First-contact educators and transport</div>
              <ul className="bk-tier-list">
                <li>Teachers and classroom aides</li>
                <li>Daycare and early-learning workers</li>
                <li>School office staff</li>
                <li>School bus drivers</li>
              </ul>
            </div>
          </div>
          <div className="bk-tier">
            <div className="bk-tier-num">Tier 2</div>
            <div className="bk-tier-body">
              <div className="bk-tier-title">Health and crisis professionals</div>
              <ul className="bk-tier-list">
                <li>Women's shelter intake workers</li>
                <li>Crisis line workers</li>
                <li>Public health nurses</li>
                <li>Pediatric clinic staff</li>
                <li>Family resource centre workers</li>
              </ul>
            </div>
          </div>
          <div className="bk-tier">
            <div className="bk-tier-num">Tier 3</div>
            <div className="bk-tier-body">
              <div className="bk-tier-title">Community anchor points</div>
              <ul className="bk-tier-list">
                <li>Clergy and faith community workers</li>
                <li>Library staff</li>
                <li>Grocery and pharmacy clerks</li>
                <li>Food bank workers</li>
                <li>Recreation program staff</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="journal-grid journal-grid-2">
        <div className="journal-card">
          <h3 className="journal-section-title">The Response Protocol</h3>
          <p className="journal-section-body" style={{ marginBottom: "1rem" }}>
            Five steps. In order. Every time.
          </p>
          <ol className="bk-protocol">
            <li>
              <span className="bk-step-num">1</span>
              <span className="bk-step-body">
                <strong>Do not react visibly.</strong> No change in expression, posture, or
                tone that an observer could read.
              </span>
            </li>
            <li>
              <span className="bk-step-num">2</span>
              <span className="bk-step-body">
                <strong>Acknowledge calmly in plain language.</strong> "Not today, sorry."
                One second of eye contact confirms she was heard.
              </span>
            </li>
            <li>
              <span className="bk-step-num">3</span>
              <span className="bk-step-body">
                <strong>The moment she is out of earshot, make the designated call.</strong>{" "}
                Shelter intake, safety contact, or 911 depending on urgency. This step does
                not wait.
              </span>
            </li>
            <li>
              <span className="bk-step-num">4</span>
              <span className="bk-step-body">
                <strong>Document.</strong> Time, date, what you observed. Written, not
                from memory later.
              </span>
            </li>
            <li>
              <span className="bk-step-num">5</span>
              <span className="bk-step-body">
                <strong>If she left before acknowledgment, still make the call.</strong>{" "}
                The signal was given. That is enough.
              </span>
            </li>
          </ol>
        </div>

        <div className="journal-card">
          <h3 className="journal-section-title">What Not To Do</h3>
          <p className="journal-section-body" style={{ marginBottom: "1rem" }}>
            These responses put her at greater risk.
          </p>
          <ul className="bk-donot">
            <li>Don't ask her to clarify or repeat herself.</li>
            <li>Don't pull her aside visibly.</li>
            <li>Don't ask "are you okay?" in earshot of anyone.</li>
            <li>Don't delay because you're uncertain — if you heard it, respond.</li>
            <li>Don't tell anyone outside the designated response chain.</li>
          </ul>
          <div className="tip-callout" style={{ marginTop: "1.25rem" }}>
            <span className="tip-quill" aria-hidden="true">✍</span>
            <p>Uncertainty is the wrong reason to hesitate. The cost of a false signal is a
            call. The cost of a missed signal is her safety.</p>
          </div>
        </div>
      </div>

      <div className="journal-card">
        <h3 className="journal-section-title">Building the Network</h3>
        <p className="journal-section-body">
          Embed the signal in professional onboarding — it becomes part of how new staff learn
          the space, the same way they learn where the fire extinguisher is. Every organization
          that joins the network increases the number of safe spaces in the mother's daily
          geography. One school joining covers drop-off, pickup, and office hours. One grocery
          store covering the midweek shop. One library covering the afternoon programs.
        </p>
        <p className="journal-section-body">
          One prerequisite before any organization joins: a single designated call number for
          step three, known to all staff before training begins. Without the number, step three
          doesn't happen, and the protocol fails. The number first. The training second.
        </p>
      </div>

      <div className="journal-card bk-card-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 className="journal-section-title">The One-Line Card</h3>
            <p className="journal-section-body" style={{ marginBottom: 0 }}>
              Printable. Slips into any resource folder, package, or envelope with no
              explanation required. No branding, no header — just the signal and the instruction.
            </p>
          </div>
          <button
            className="kk-toggle-btn no-print"
            onClick={() => setCardVisible(!cardVisible)}
          >
            {cardVisible ? "Collapse" : "Show card"}
          </button>
        </div>

        {cardVisible && (
          <div className="bk-slip-wrapper">
            <div className="bk-slip">
              <div className="bk-slip-phrase">"Got any grapes?"</div>
              <div className="bk-slip-body">
                Say this to a teacher, shelter worker, clinic nurse, or resource centre staff,
                and help will be on the way. You don't have to explain anything else.
              </div>
            </div>
            <div className="kk-print-note no-print" style={{ marginTop: "1rem" }}>
              <button onClick={() => window.print()} className="kk-print-btn">
                Print this card
              </button>
              <span>Print, cut out, and distribute without a cover note.</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
