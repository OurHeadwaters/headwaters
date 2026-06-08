import { useEffect, useState } from "react";

const S = {
  page: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    background: "#fff",
    color: "#111",
    maxWidth: "680px",
    margin: "0 auto",
    padding: "48px 40px 80px",
    fontSize: "13px",
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

  signal: {
    fontSize: "36px",
    fontWeight: "bold" as const,
    textAlign: "center" as const,
    letterSpacing: "0.01em",
    margin: "0 0 8px",
    lineHeight: "1.2",
  } as React.CSSProperties,

  signalSub: {
    textAlign: "center" as const,
    fontSize: "13px",
    color: "#555",
    marginBottom: "0",
  } as React.CSSProperties,

  hr: {
    border: "none",
    borderTop: "1.5px solid #111",
    margin: "28px 0",
  } as React.CSSProperties,

  hrLight: {
    border: "none",
    borderTop: "1px solid #ccc",
    margin: "22px 0",
  } as React.CSSProperties,

  h2: {
    fontSize: "11px",
    fontWeight: "bold" as const,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    marginBottom: "10px",
    color: "#111",
  } as React.CSSProperties,

  p: {
    marginBottom: "8px",
    color: "#333",
  } as React.CSSProperties,

  tierGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "12px",
  } as React.CSSProperties,

  tierBox: {
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "10px 12px",
  } as React.CSSProperties,

  tierLabel: {
    fontSize: "10px",
    fontWeight: "bold" as const,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "#888",
    marginBottom: "4px",
  } as React.CSSProperties,

  tierTitle: {
    fontSize: "12px",
    fontWeight: "bold" as const,
    marginBottom: "6px",
    color: "#111",
  } as React.CSSProperties,

  tierList: {
    paddingLeft: "14px",
    margin: "0",
    fontSize: "11.5px",
    color: "#444",
    lineHeight: "1.65",
  } as React.CSSProperties,

  protocolList: {
    listStyle: "none",
    padding: "0",
    margin: "0",
  } as React.CSSProperties,

  protocolItem: {
    display: "flex",
    gap: "12px",
    marginBottom: "8px",
    alignItems: "flex-start",
  } as React.CSSProperties,

  stepNum: {
    flexShrink: 0,
    width: "22px",
    height: "22px",
    background: "#111",
    color: "#fff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "bold" as const,
    marginTop: "1px",
  } as React.CSSProperties,

  stepBody: {
    fontSize: "12.5px",
    color: "#222",
    lineHeight: "1.6",
  } as React.CSSProperties,

  donotList: {
    paddingLeft: "18px",
    margin: "0",
    fontSize: "12.5px",
    color: "#333",
    lineHeight: "1.75",
  } as React.CSSProperties,

  callNumberBox: {
    border: "2px solid #111",
    borderRadius: "6px",
    padding: "18px 20px",
    marginTop: "4px",
  } as React.CSSProperties,

  callNumberLabel: {
    fontSize: "11px",
    fontWeight: "bold" as const,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "#555",
    marginBottom: "10px",
  } as React.CSSProperties,

  callNumberNote: {
    fontSize: "11px",
    color: "#666",
    fontStyle: "italic" as const,
    marginTop: "8px",
  } as React.CSSProperties,

  warningBox: {
    background: "#fafafa",
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "10px 14px",
    fontSize: "12px",
    color: "#444",
    fontStyle: "italic" as const,
    marginTop: "10px",
  } as React.CSSProperties,

  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  } as React.CSSProperties,
};

export default function DuckSongTrainingCard() {
  const [callNumber, setCallNumber] = useState("");

  useEffect(() => {
    document.title = "Duck Song Signal — Staff Training Card";
  }, []);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { margin: 0; padding: 0; background: #fff !important; }
          #root { background: #fff !important; }
        }
        @page {
          size: letter;
          margin: 16mm 14mm;
        }
        .print-only { display: none; }
        body, #root { background: #fff !important; }
      `}</style>

      <div style={S.page}>

        {/* Screen-only toolbar */}
        <div className="no-print" style={{ marginBottom: "32px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <button style={S.printBtn} onClick={() => window.print()}>
            Print this training card
          </button>
          <span style={{ fontSize: "12px", color: "#777" }}>
            Letter · one page · leave with staff after training
          </span>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "6px" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", marginBottom: "16px" }}>
            Community Action Protocol — Staff Training Card
          </div>
          <div style={S.signal}>"Got any grapes?"</div>
          <p style={S.signalSub}>
            When a woman with children says this to you, she is asking for help.
            This card tells you what to do.
          </p>
        </div>

        <hr style={S.hr} />

        {/* Three-Tier Network */}
        <div style={{ marginBottom: "20px" }}>
          <div style={S.h2}>The Three-Tier Network</div>
          <p style={{ ...S.p, marginBottom: "12px" }}>
            The signal is safe to use in any space the mother already passes through.
            The network works because it is embedded where she is already seen.
          </p>
          <div style={S.tierGrid}>
            <div style={S.tierBox}>
              <div style={S.tierLabel}>Tier 1</div>
              <div style={S.tierTitle}>Educators &amp; Transport</div>
              <ul style={S.tierList}>
                <li>Teachers &amp; classroom aides</li>
                <li>Daycare workers</li>
                <li>School office staff</li>
                <li>School bus drivers</li>
              </ul>
            </div>
            <div style={S.tierBox}>
              <div style={S.tierLabel}>Tier 2</div>
              <div style={S.tierTitle}>Health &amp; Crisis</div>
              <ul style={S.tierList}>
                <li>Shelter intake workers</li>
                <li>Crisis line workers</li>
                <li>Public health nurses</li>
                <li>Pediatric clinic staff</li>
                <li>Family resource centre</li>
              </ul>
            </div>
            <div style={S.tierBox}>
              <div style={S.tierLabel}>Tier 3</div>
              <div style={S.tierTitle}>Community Anchors</div>
              <ul style={S.tierList}>
                <li>Clergy &amp; faith workers</li>
                <li>Library staff</li>
                <li>Grocery &amp; pharmacy</li>
                <li>Food bank workers</li>
                <li>Recreation staff</li>
              </ul>
            </div>
          </div>
        </div>

        <hr style={S.hrLight} />

        {/* Protocol + What Not To Do */}
        <div style={S.twoCol}>
          <div>
            <div style={S.h2}>The Five-Step Response</div>
            <p style={{ ...S.p, marginBottom: "10px" }}>Five steps. In order. Every time.</p>
            <ol style={S.protocolList}>
              {[
                { n: 1, body: <><strong>Do not react visibly.</strong> No change in expression, posture, or tone.</> },
                { n: 2, body: <><strong>Acknowledge calmly in plain language.</strong> "Not today, sorry." One second of eye contact confirms she was heard.</> },
                { n: 3, body: <><strong>The moment she is out of earshot, make the designated call.</strong> Shelter intake, safety contact, or 911 depending on urgency. This step does not wait.</> },
                { n: 4, body: <><strong>Document.</strong> Time, date, what you observed. Written, not from memory later.</> },
                { n: 5, body: <><strong>If she left before acknowledgment, still make the call.</strong> The signal was given. That is enough.</> },
              ].map(({ n, body }) => (
                <li key={n} style={S.protocolItem}>
                  <div style={S.stepNum}>{n}</div>
                  <div style={S.stepBody}>{body}</div>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <div style={S.h2}>What Not To Do</div>
            <p style={{ ...S.p, marginBottom: "10px" }}>These responses put her at greater risk.</p>
            <ul style={S.donotList}>
              <li>Don't ask her to clarify or repeat herself.</li>
              <li>Don't pull her aside visibly.</li>
              <li>Don't ask "are you okay?" in earshot of anyone.</li>
              <li>Don't delay because you're uncertain — if you heard it, respond.</li>
              <li>Don't tell anyone outside the designated response chain.</li>
            </ul>
            <div style={S.warningBox}>
              The cost of a false signal is a call.
              The cost of a missed signal is her safety.
            </div>
          </div>
        </div>

        <hr style={S.hrLight} />

        {/* Designated call number */}
        <div style={S.callNumberBox}>
          <div style={S.callNumberLabel}>
            This organization's designated call number — Step 3
          </div>

          {/* Screen: editable input */}
          <div className="no-print">
            <input
              type="text"
              placeholder="Type number here before printing…"
              value={callNumber}
              onChange={e => setCallNumber(e.target.value)}
              style={{
                width: "100%",
                border: "none",
                borderBottom: "2px solid #111",
                outline: "none",
                fontFamily: "Georgia, serif",
                fontSize: "20px",
                fontWeight: "bold",
                padding: "4px 0",
                background: "transparent",
                color: "#111",
              }}
            />
          </div>

          {/* Print: shows the number, or a blank rule if nothing was entered */}
          <div
            className="print-only"
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              borderBottom: "2px solid #111",
              paddingBottom: "4px",
              minHeight: "32px",
            }}
          >
            {callNumber || ""}
          </div>

          <div style={S.callNumberNote}>
            This number must be known to all staff before training begins.
            Without it, Step 3 cannot happen and the protocol fails.
          </div>
        </div>

        {/* Footer note */}
        <div style={{ marginTop: "28px", fontSize: "11px", color: "#999", textAlign: "center" }}>
          The phrase never changes &nbsp;·&nbsp; The response is the same at every site &nbsp;·&nbsp; Distribute without a cover note
        </div>

      </div>
    </>
  );
}
