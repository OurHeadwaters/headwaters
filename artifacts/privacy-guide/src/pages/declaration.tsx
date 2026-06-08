import { useEffect, useState, useRef } from "react";

const S = {
  page: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    background: "#fff",
    color: "#111",
    maxWidth: "680px",
    margin: "0 auto",
    padding: "48px 40px 80px",
    fontSize: "13px",
    lineHeight: "1.65",
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

  backLink: {
    display: "inline-block",
    marginLeft: "16px",
    fontSize: "12px",
    color: "#555",
    textDecoration: "underline",
    cursor: "pointer",
    fontFamily: "Georgia, serif",
    background: "none",
    border: "none",
    padding: 0,
  } as React.CSSProperties,

  hr: {
    border: "none",
    borderTop: "1px solid #ccc",
    margin: "28px 0",
  } as React.CSSProperties,

  declarationHeader: {
    textAlign: "center" as const,
    marginBottom: "28px",
  } as React.CSSProperties,

  declarationTitle: {
    fontSize: "22px",
    fontWeight: "bold",
    letterSpacing: "0.02em",
    marginBottom: "6px",
  } as React.CSSProperties,

  declarationSub: {
    fontSize: "13px",
    color: "#444",
  } as React.CSSProperties,

  body: {
    marginBottom: "14px",
    fontSize: "13px",
  } as React.CSSProperties,

  fieldBlock: {
    margin: "20px 0",
  } as React.CSSProperties,

  fieldRow: {
    display: "flex",
    alignItems: "baseline",
    gap: "8px",
    marginBottom: "14px",
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  fieldLabel: {
    whiteSpace: "nowrap" as const,
    fontSize: "12px",
    color: "#444",
    minWidth: "140px",
  } as React.CSSProperties,

  fieldLine: {
    flex: 1,
    borderBottom: "1px solid #555",
    minWidth: "120px",
    height: "18px",
  } as React.CSSProperties,

  fieldLineShort: {
    flex: "0 0 100px",
    borderBottom: "1px solid #555",
    height: "18px",
  } as React.CSSProperties,

  fieldNote: {
    fontSize: "10px",
    color: "#777",
    fontStyle: "italic",
  } as React.CSSProperties,

  clause: {
    marginBottom: "14px",
    fontSize: "13px",
    lineHeight: "1.7",
  } as React.CSSProperties,

  handoff: {
    borderTop: "1px solid #ddd",
    paddingTop: "14px",
    marginTop: "20px",
    fontSize: "12px",
    color: "#444",
    fontStyle: "italic",
  } as React.CSSProperties,

  filed: {
    marginTop: "28px",
    fontSize: "11px",
    color: "#777",
    display: "flex",
    justifyContent: "space-between",
    borderTop: "1px solid #eee",
    paddingTop: "10px",
  } as React.CSSProperties,

  pdfBtn: {
    display: "inline-block",
    padding: "10px 24px",
    background: "#fff",
    color: "#111",
    border: "1.5px solid #111",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "Georgia, serif",
    marginLeft: "10px",
  } as React.CSSProperties,

  pdfTip: {
    position: "fixed" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "#fff",
    border: "1.5px solid #111",
    borderRadius: "10px",
    padding: "28px 36px",
    zIndex: 9999,
    maxWidth: "420px",
    width: "90vw",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
    fontFamily: "Georgia, serif",
    textAlign: "center" as const,
  } as React.CSSProperties,

  pdfTipOverlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    zIndex: 9998,
  } as React.CSSProperties,

  pdfTipTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "12px",
    color: "#111",
  } as React.CSSProperties,

  pdfTipBody: {
    fontSize: "13px",
    color: "#333",
    lineHeight: "1.65",
    marginBottom: "20px",
  } as React.CSSProperties,

  pdfTipBtn: {
    display: "inline-block",
    padding: "10px 28px",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "Georgia, serif",
  } as React.CSSProperties,

  printNote: {
    marginTop: "32px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap" as const,
    fontSize: "12px",
    color: "#555",
  } as React.CSSProperties,
};

export default function DeclarationPage() {
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const [showPdfTip, setShowPdfTip] = useState(false);

  useEffect(() => {
    document.title = "Standing Protective Declaration — Keeper's Kit";
    document.documentElement.setAttribute("data-route", "declaration");
    return () => {
      document.documentElement.removeAttribute("data-route");
    };
  }, []);

  function handleSaveAsPdf() {
    setShowPdfTip(true);
  }

  function confirmPrint() {
    setShowPdfTip(false);
    setTimeout(() => window.print(), 80);
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          html, body {
            background: white !important;
            margin: 0;
            padding: 0;
            overflow: visible;
          }
          #root { background: white !important; }
          @page {
            size: letter portrait;
            margin: 18mm 18mm 22mm;
          }
          .prefilled-date {
            color: #555 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {showPdfTip && (
        <>
          <div style={S.pdfTipOverlay} onClick={() => setShowPdfTip(false)} />
          <div style={S.pdfTip} role="dialog" aria-modal="true">
            <div style={S.pdfTipTitle}>Save as PDF</div>
            <p style={S.pdfTipBody}>
              When the print dialog opens, set the <strong>Destination</strong> (or
              Printer) to <strong>"Save as PDF"</strong>, then click{" "}
              <strong>Save</strong>. The file will match exactly what you see on
              screen — white page, Georgia text, all fill-in lines included.
            </p>
            <button style={S.pdfTipBtn} onClick={confirmPrint}>
              Open print dialog →
            </button>
          </div>
        </>
      )}

      <div style={S.page}>

        <div className="no-print" style={{ marginBottom: "32px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <button style={S.printBtn} onClick={() => window.print()}>
            Print this declaration
          </button>
          <button style={S.pdfBtn} onClick={handleSaveAsPdf}>
            Save as PDF
          </button>
          <button
            style={S.backLink}
            onClick={() => window.history.back()}
          >
            ← Back to guide
          </button>
        </div>

        <div style={S.declarationHeader}>
          <div style={S.declarationTitle}>Standing Protective Declaration</div>
          <div style={S.declarationSub}>Child Likeness, Voice, and Words — Minor's Record</div>
        </div>

        <hr style={S.hr} />

        <p style={S.body}>
          I, the undersigned Keeper, place this declaration on behalf of the child named
          below. This declaration is standing, permanent, and not conditional on
          jurisdiction, platform, or the legal status of any technology at the time of
          any future use.
        </p>

        <div style={S.fieldBlock}>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Child's full name</span>
            <span style={S.fieldLine}></span>
          </div>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Date of birth</span>
            <span style={S.fieldLineShort}></span>
            <span style={{ ...S.fieldLabel, marginLeft: "2rem" }}>Date of majority</span>
            <span style={S.fieldLineShort}></span>
          </div>
        </div>

        <hr style={S.hr} />

        <p style={S.clause}>
          <strong>Standing Declaration —</strong> The child named above was a minor at
          the time of every recording, capture, and publication covered by this
          declaration. Their likeness, voice, image, body, and words in any medium during
          their minority cannot constitute consent of any kind for adult, sexual, or
          exploitative content or context. No public domain argument, open space claim,
          reconstructed context, AI-generated derivation, or synthetic media supersedes
          this declaration.
        </p>

        <p style={S.clause}>
          <strong>Refused Shelf Entry —</strong> The child's play language — including
          but not limited to water language, touch language, and physical play requests —
          is permanently refused as source material for any adult or exploitative mapping,
          regardless of the medium of original capture or the technology used for
          derivation.
        </p>

        <p style={S.clause}>
          <strong>Age Anchor —</strong> The child's date of birth is recorded above. They
          were a minor at the time of all recordings covered by this declaration. This is
          a matter of verifiable record.
        </p>

        <hr style={S.hr} />

        <div style={S.fieldBlock}>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Keeper's full name</span>
            <span style={S.fieldLine}></span>
          </div>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Keeper's signature</span>
            <span style={S.fieldLine}></span>
            <span style={{ ...S.fieldLabel, marginLeft: "2rem" }}>Date</span>
            <span style={{ ...S.fieldLineShort, display: "flex", alignItems: "flex-end", paddingBottom: "1px" }}>
              <span className="prefilled-date" style={{ fontSize: "11px", color: "#999", fontStyle: "italic", lineHeight: 1 }}>{today}</span>
            </span>
          </div>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Witness name</span>
            <span style={S.fieldLine}></span>
          </div>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Witness signature</span>
            <span style={S.fieldLine}></span>
            <span style={{ ...S.fieldLabel, marginLeft: "2rem" }}>Date</span>
            <span style={S.fieldLineShort}></span>
          </div>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Secondary keeper (optional)</span>
            <span style={S.fieldLine}></span>
          </div>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Filing location</span>
            <span style={S.fieldLine}></span>
          </div>
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>On-chain anchor (optional)</span>
            <span style={S.fieldLine}></span>
            <span style={S.fieldNote}>XRPL transaction hash, when available</span>
          </div>
        </div>

        <p style={S.handoff}>
          <strong>Handoff at majority —</strong> This declaration transfers to the child
          at the date of majority listed above. The Keeper will perform a named handoff:{" "}
          <em>"I held this on your behalf. Here is what I witnessed. This is yours now."</em>
        </p>

        <div style={S.filed}>
          <span>Compiled {today}</span>
          <span>Clearing &amp; Lodge Family Privacy Guide</span>
        </div>

        <div className="no-print" style={S.printNote}>
          <span>Complete the blanks by hand after printing. File one copy, give one to each keeper.</span>
        </div>

      </div>
    </>
  );
}
