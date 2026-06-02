import { useState } from "react";

export default function KeepersKitSection() {
  const [showDeclaration, setShowDeclaration] = useState(false);
  const today = new Date().toLocaleDateString("en-CA");

  return (
    <section id="keepers-kit" className="trail-section">
      <div className="section-signpost">
        <span className="signpost-emoji" aria-hidden="true">🗂️</span>
        <h2 className="signpost-title">The Keeper's Kit</h2>
      </div>

      <div className="journal-card">
        <h3 className="journal-section-title">What this is for</h3>
        <p className="journal-section-body">
          A standing protective declaration for parents placing a record on behalf of their
          children's likeness, voice, and words — specifically against future
          manufactured-consent attacks using reconstructive AI or deepfake technology.
        </p>
        <p className="journal-section-body">
          The threat is specific: innocent play language captured in public spaces — water play,
          outdoor recreation, family video — could be recontextualized by technology that is
          arriving faster than law can respond to it. A child's voice at a lake asking to be
          splashed could, with today's tools, be used to construct something it was never part of.
          The kit places the refusal in the record before any threat materializes, not after.
          This is the legal equivalent of a fence: it marks the boundary before the trespass, not
          during it.
        </p>
        <div className="tip-callout">
          <span className="tip-quill" aria-hidden="true">✍</span>
          <p>File the declaration before any threat appears. A fence built after a trespass is
          a patch. A fence built before is a boundary.</p>
        </div>
      </div>

      <h3 className="kk-instruments-heading">The Five Instruments</h3>

      <div className="kk-instruments">
        <div className="kk-instrument">
          <div className="kk-num">1</div>
          <div className="kk-body">
            <h4 className="kk-title">The Standing Declaration</h4>
            <p className="kk-text">
              A plain-language, dated, witnessed statement that the child's likeness, voice,
              image, body, and words in any medium during their minority cannot constitute consent
              of any kind for adult, sexual, or exploitative content or context. No public domain
              argument, open space claim, or reconstructed context supersedes it. Filed before
              any threat materializes.
            </p>
          </div>
        </div>

        <div className="kk-instrument">
          <div className="kk-num">2</div>
          <div className="kk-body">
            <h4 className="kk-title">The Refused Shelf Entry</h4>
            <p className="kk-text">
              A permanent declaration that the child's play language — water language, touch
              language, physical play requests — is refused as source material for any adult or
              exploitative mapping, in advance, permanently. The refusal is not conditional on
              where the capture happened. Public space capture does not override it.
            </p>
          </div>
        </div>

        <div className="kk-instrument">
          <div className="kk-num">3</div>
          <div className="kk-body">
            <h4 className="kk-title">The Contextual Fabric Stamp</h4>
            <p className="kk-text">
              A dated log for occasions where public-domain capture is likely — lakes, parks,
              community events. Each entry: date and location, ages present, what the children
              were doing (specific), what words meant in the child's vocabulary at that age, who
              was present, one-sentence keeper witness statement. One paragraph per occasion.
              The discipline is the date and the witness — those two things together establish
              context that cannot be retroactively reassigned.
            </p>
          </div>
        </div>

        <div className="kk-instrument">
          <div className="kk-num">4</div>
          <div className="kk-body">
            <h4 className="kk-title">The Age Anchor</h4>
            <p className="kk-text">
              A standing record stating the child's date of birth and that they were a minor at
              the time of every relevant recording. Minority is structural, not moral — it cannot
              be argued away in court or in content moderation. The Age Anchor establishes this
              as a matter of verifiable record, independent of any other instrument in the kit.
            </p>
          </div>
        </div>

        <div className="kk-instrument">
          <div className="kk-num">5</div>
          <div className="kk-body">
            <h4 className="kk-title">The Keeper Chain</h4>
            <p className="kk-text">
              Name two or more people who hold the same record independently. An attacker must
              contradict every keeper simultaneously. As the chain grows, the attack becomes less
              viable — not because of legal force alone, but because the record is distributed
              across people who know the child and know what they witnessed. The chain is a
              community structure, not a legal one. It uses the same logic as the community
              itself: resilience through multiplication.
            </p>
          </div>
        </div>
      </div>

      <div className="journal-card" style={{ marginTop: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 className="journal-section-title">Printable Declaration</h3>
            <p className="journal-section-body" style={{ marginBottom: 0 }}>
              A one-page standing declaration. Print, complete, witness, and file. The declaration
              transfers to the child at majority — the keeper names the handoff.
            </p>
          </div>
          <button
            className="kk-toggle-btn no-print"
            onClick={() => setShowDeclaration(!showDeclaration)}
          >
            {showDeclaration ? "Collapse" : "Show declaration template"}
          </button>
        </div>

        {showDeclaration && (
          <div className="kk-declaration-wrapper">
            <div className="kk-declaration">
              <div className="kk-declaration-header">
                <div className="kk-declaration-title">Standing Protective Declaration</div>
                <div className="kk-declaration-sub">Child Likeness, Voice, and Words — Minor's Record</div>
              </div>

              <p className="kk-declaration-body">
                I, the undersigned Keeper, place this declaration on behalf of the child named
                below. This declaration is standing, permanent, and not conditional on
                jurisdiction, platform, or the legal status of any technology at the time of
                any future use.
              </p>

              <div className="kk-field-block">
                <div className="kk-field-row">
                  <span className="kk-field-label">Child's full name</span>
                  <span className="kk-field-line"></span>
                </div>
                <div className="kk-field-row">
                  <span className="kk-field-label">Date of birth</span>
                  <span className="kk-field-line kk-field-short"></span>
                  <span className="kk-field-label" style={{ marginLeft: "2rem" }}>Date of majority</span>
                  <span className="kk-field-line kk-field-short"></span>
                </div>
              </div>

              <div className="kk-declaration-clause">
                <strong>Standing Declaration —</strong> The child named above was a minor at
                the time of every recording, capture, and publication covered by this
                declaration. Their likeness, voice, image, body, and words in any medium during
                their minority cannot constitute consent of any kind for adult, sexual, or
                exploitative content or context. No public domain argument, open space claim,
                reconstructed context, AI-generated derivation, or synthetic media supersedes
                this declaration.
              </div>

              <div className="kk-declaration-clause">
                <strong>Refused Shelf Entry —</strong> The child's play language — including
                but not limited to water language, touch language, and physical play requests —
                is permanently refused as source material for any adult or exploitative mapping,
                regardless of the medium of original capture or the technology used for
                derivation.
              </div>

              <div className="kk-declaration-clause">
                <strong>Age Anchor —</strong> The child's date of birth is recorded above. They
                were a minor at the time of all recordings covered by this declaration. This is
                a matter of verifiable record.
              </div>

              <div className="kk-field-block" style={{ marginTop: "1.5rem" }}>
                <div className="kk-field-row">
                  <span className="kk-field-label">Keeper's full name</span>
                  <span className="kk-field-line"></span>
                </div>
                <div className="kk-field-row">
                  <span className="kk-field-label">Keeper's signature</span>
                  <span className="kk-field-line"></span>
                  <span className="kk-field-label" style={{ marginLeft: "2rem" }}>Date</span>
                  <span className="kk-field-line kk-field-short"></span>
                </div>
                <div className="kk-field-row">
                  <span className="kk-field-label">Witness name</span>
                  <span className="kk-field-line"></span>
                </div>
                <div className="kk-field-row">
                  <span className="kk-field-label">Witness signature</span>
                  <span className="kk-field-line"></span>
                  <span className="kk-field-label" style={{ marginLeft: "2rem" }}>Date</span>
                  <span className="kk-field-line kk-field-short"></span>
                </div>
                <div className="kk-field-row">
                  <span className="kk-field-label">Secondary keeper (optional)</span>
                  <span className="kk-field-line"></span>
                </div>
                <div className="kk-field-row">
                  <span className="kk-field-label">Filing location</span>
                  <span className="kk-field-line"></span>
                </div>
                <div className="kk-field-row">
                  <span className="kk-field-label">On-chain anchor (optional)</span>
                  <span className="kk-field-line"></span>
                  <span className="kk-field-note">XRPL transaction hash, when available</span>
                </div>
              </div>

              <div className="kk-declaration-clause kk-declaration-handoff">
                <strong>Handoff at majority —</strong> This declaration transfers to the child
                at the date of majority listed above. The Keeper will perform a named handoff:
                <em> "I held this on your behalf. Here is what I witnessed. This is yours now."</em>
              </div>

              <div className="kk-declaration-filed">
                <span>Compiled {today}</span>
                <span>Clearing &amp; Lodge Family Privacy Guide</span>
              </div>
            </div>

            <div className="kk-print-note no-print">
              <button onClick={() => window.print()} className="kk-print-btn">
                Print this declaration
              </button>
              <span>Complete the blanks by hand after printing. File one copy, give one to each keeper.</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
