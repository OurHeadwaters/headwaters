import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const FABRIC_LOG_KEY = "sandbox-handbook-fabric-stamp-log";

interface FabricEntry {
  id: string;
  date: string;
  location: string;
  agesPresent: string;
  activity: string;
  wordMeaning: string;
  present: string;
  keeperStatement: string;
}

function loadFabricLog(): FabricEntry[] {
  try {
    const raw = localStorage.getItem(FABRIC_LOG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveFabricLog(entries: FabricEntry[]) {
  localStorage.setItem(FABRIC_LOG_KEY, JSON.stringify(entries));
}

const EMPTY_FORM: Omit<FabricEntry, "id"> = {
  date: "",
  location: "",
  agesPresent: "",
  activity: "",
  wordMeaning: "",
  present: "",
  keeperStatement: "",
};

export default function KeepersKitSection() {
  const [showDeclaration, setShowDeclaration] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [entries, setEntries] = useState<FabricEntry[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM>>({});
  const [, navigate] = useLocation();
  const today = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    setEntries(loadFabricLog());
  }, []);

  function handleFormChange(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<typeof EMPTY_FORM> = {};
    if (!form.date.trim()) e.date = "Required";
    if (!form.location.trim()) e.location = "Required";
    if (!form.activity.trim()) e.activity = "Required";
    if (!form.keeperStatement.trim()) e.keeperStatement = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleAddEntry() {
    if (!validate()) return;
    const next: FabricEntry[] = [
      { ...form, id: crypto.randomUUID() },
      ...entries,
    ];
    setEntries(next);
    saveFabricLog(next);
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  function handleDeleteEntry(id: string) {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    saveFabricLog(next);
  }

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

            <div className="cfs-log-panel" style={{ marginTop: "1.25rem" }}>
              <div className="cfs-log-header">
                <div className="cfs-log-meta">
                  <span className="cfs-log-count">
                    {entries.length === 0
                      ? "No entries yet"
                      : `${entries.length} entr${entries.length === 1 ? "y" : "ies"}`}
                  </span>
                </div>
                <button
                  className="kk-toggle-btn no-print"
                  onClick={() => setShowLog((v) => !v)}
                >
                  {showLog ? "Collapse log" : "Start a log"}
                </button>
              </div>

              {showLog && (
                <div className="no-print">
                  {!showForm ? (
                    <button
                      className="cfs-add-btn"
                      onClick={() => setShowForm(true)}
                    >
                      + Add entry
                    </button>
                  ) : (
                    <div className="cfs-form">
                      <div className="cfs-form-title">New occasion entry</div>

                      <div className="cfs-form-row">
                        <label className="cfs-label" htmlFor="cfs-date">
                          Date <span className="cfs-required">*</span>
                        </label>
                        <input
                          id="cfs-date"
                          className={`cfs-input${errors.date ? " cfs-input-error" : ""}`}
                          type="date"
                          value={form.date}
                          onChange={(e) => handleFormChange("date", e.target.value)}
                        />
                        {errors.date && <span className="cfs-error">{errors.date}</span>}
                      </div>

                      <div className="cfs-form-row">
                        <label className="cfs-label" htmlFor="cfs-location">
                          Location <span className="cfs-required">*</span>
                        </label>
                        <input
                          id="cfs-location"
                          className={`cfs-input${errors.location ? " cfs-input-error" : ""}`}
                          type="text"
                          placeholder="e.g. Brohm Lake, north shore"
                          value={form.location}
                          onChange={(e) => handleFormChange("location", e.target.value)}
                        />
                        {errors.location && <span className="cfs-error">{errors.location}</span>}
                      </div>

                      <div className="cfs-form-row">
                        <label className="cfs-label" htmlFor="cfs-ages">
                          Ages present
                        </label>
                        <input
                          id="cfs-ages"
                          className="cfs-input"
                          type="text"
                          placeholder="e.g. Elias age 4, Nora age 7"
                          value={form.agesPresent}
                          onChange={(e) => handleFormChange("agesPresent", e.target.value)}
                        />
                      </div>

                      <div className="cfs-form-row">
                        <label className="cfs-label" htmlFor="cfs-activity">
                          What children were doing (specific) <span className="cfs-required">*</span>
                        </label>
                        <textarea
                          id="cfs-activity"
                          className={`cfs-textarea${errors.activity ? " cfs-input-error" : ""}`}
                          rows={3}
                          placeholder="e.g. Elias (4) and Nora (7) were building a dam with rocks along the shoreline. Nora asked to be splashed and Elias obliged."
                          value={form.activity}
                          onChange={(e) => handleFormChange("activity", e.target.value)}
                        />
                        {errors.activity && <span className="cfs-error">{errors.activity}</span>}
                      </div>

                      <div className="cfs-form-row">
                        <label className="cfs-label" htmlFor="cfs-word-meaning">
                          What words meant at that age
                        </label>
                        <textarea
                          id="cfs-word-meaning"
                          className="cfs-textarea"
                          rows={2}
                          placeholder="e.g. 'Splash me' meant play between siblings. 'More water' meant fill the bucket. No adult connotation present or possible."
                          value={form.wordMeaning}
                          onChange={(e) => handleFormChange("wordMeaning", e.target.value)}
                        />
                      </div>

                      <div className="cfs-form-row">
                        <label className="cfs-label" htmlFor="cfs-present">
                          Who was present
                        </label>
                        <input
                          id="cfs-present"
                          className="cfs-input"
                          type="text"
                          placeholder="e.g. Both parents, grandmother, two neighbour families"
                          value={form.present}
                          onChange={(e) => handleFormChange("present", e.target.value)}
                        />
                      </div>

                      <div className="cfs-form-row">
                        <label className="cfs-label" htmlFor="cfs-statement">
                          Keeper witness statement (one sentence) <span className="cfs-required">*</span>
                        </label>
                        <textarea
                          id="cfs-statement"
                          className={`cfs-textarea${errors.keeperStatement ? " cfs-input-error" : ""}`}
                          rows={2}
                          placeholder="e.g. I, the undersigned Keeper, witnessed this occasion and attest that all activity was ordinary childhood play in a family context."
                          value={form.keeperStatement}
                          onChange={(e) => handleFormChange("keeperStatement", e.target.value)}
                        />
                        {errors.keeperStatement && <span className="cfs-error">{errors.keeperStatement}</span>}
                      </div>

                      <div className="cfs-form-actions">
                        <button className="cfs-save-btn" onClick={handleAddEntry}>
                          Save entry
                        </button>
                        <button
                          className="cfs-cancel-btn"
                          onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setErrors({}); }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Entries — always in DOM so they print regardless of collapsed state */}
              <div className={showLog ? "cfs-log-body" : "cfs-log-body cfs-log-body-collapsed"}>
                {entries.length === 0 ? (
                  <p className="cfs-empty-state">
                    No entries yet. Each occasion you log becomes a dated, contextual record
                    that cannot be retroactively reassigned.
                  </p>
                ) : (
                  <div className="cfs-entries">
                    {entries.map((entry, i) => (
                      <div key={entry.id} className="cfs-entry">
                        <div className="cfs-entry-header">
                          <div className="cfs-entry-meta">
                            <span className="cfs-entry-date">
                              {new Date(entry.date + "T12:00:00").toLocaleDateString("en-CA", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                            {entry.location && (
                              <span className="cfs-entry-location">— {entry.location}</span>
                            )}
                          </div>
                          <button
                            className="cfs-delete-btn no-print"
                            aria-label="Delete entry"
                            onClick={() => handleDeleteEntry(entry.id)}
                            title="Remove this entry"
                          >
                            ×
                          </button>
                        </div>

                        <div className="cfs-entry-body">
                          {entry.agesPresent && (
                            <div className="cfs-entry-field">
                              <span className="cfs-entry-label">Ages present</span>
                              <span className="cfs-entry-value">{entry.agesPresent}</span>
                            </div>
                          )}
                          {entry.activity && (
                            <div className="cfs-entry-field">
                              <span className="cfs-entry-label">Activity</span>
                              <span className="cfs-entry-value">{entry.activity}</span>
                            </div>
                          )}
                          {entry.wordMeaning && (
                            <div className="cfs-entry-field">
                              <span className="cfs-entry-label">Words at this age</span>
                              <span className="cfs-entry-value">{entry.wordMeaning}</span>
                            </div>
                          )}
                          {entry.present && (
                            <div className="cfs-entry-field">
                              <span className="cfs-entry-label">Present</span>
                              <span className="cfs-entry-value">{entry.present}</span>
                            </div>
                          )}
                          {entry.keeperStatement && (
                            <div className="cfs-entry-statement">
                              <span className="cfs-statement-quill" aria-hidden="true">✍</span>
                              <em>{entry.keeperStatement}</em>
                            </div>
                          )}
                        </div>

                        {i < entries.length - 1 && (
                          <div className="cfs-entry-divider" aria-hidden="true" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {entries.length > 0 && !showLog && (
                <p className="cfs-collapsed-hint no-print">
                  {entries.length} saved entr{entries.length === 1 ? "y" : "ies"} — expand to view or add.
                </p>
              )}
            </div>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
            <button
              className="kk-toggle-btn no-print"
              onClick={() => setShowDeclaration(!showDeclaration)}
            >
              {showDeclaration ? "Collapse" : "Show declaration template"}
            </button>
            <a
              href="/headwaters/print#keepers-kit-declaration"
              target="_blank"
              rel="noopener noreferrer"
              className="kk-print-link no-print"
            >
              Standalone filing copy →
            </a>
          </div>
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
              <button onClick={() => navigate("/declaration")} className="kk-print-btn">
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
