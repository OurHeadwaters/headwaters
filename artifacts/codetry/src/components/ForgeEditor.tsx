import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { GordBird } from "@/components/GordBird";

const FORGE_THEME = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [
    { token: "comment", foreground: "5C7A5C", fontStyle: "italic" },
    { token: "keyword", foreground: "D9A066" },
    { token: "string", foreground: "A3C97A" },
    { token: "number", foreground: "F0C07A" },
    { token: "tag", foreground: "7BBFA8" },
    { token: "attribute.name", foreground: "D9A066" },
    { token: "attribute.value", foreground: "A3C97A" },
    { token: "delimiter", foreground: "8BA888" },
    { token: "type", foreground: "89C4A8" },
    { token: "function", foreground: "C4C47A" },
  ],
  colors: {
    "editor.background": "#0E1F10",
    "editor.foreground": "#D4C9B8",
    "editor.lineHighlightBackground": "#1A2E1A",
    "editor.selectionBackground": "#3A5A3A",
    "editorLineNumber.foreground": "#4A6A4A",
    "editorLineNumber.activeForeground": "#D9A066",
    "editorCursor.foreground": "#D9A066",
    "editor.findMatchBackground": "#D9A06640",
    "editorIndentGuide.background1": "#2A3A2A",
    "scrollbarSlider.background": "#2A4A2A80",
    "scrollbarSlider.hoverBackground": "#3A5A3A",
  },
};

const TEMPLATES: { label: string; lang: "html"; code: string }[] = [
  {
    label: "Homestead Greeting",
    lang: "html",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, serif;
      background: #0E1F10;
      color: #D4C9B8;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      flex-direction: column;
      gap: 20px;
      overflow: hidden;
    }
    h1 { color: #D9A066; font-size: 2rem; text-align: center; }
    p { color: #8A9E8A; max-width: 380px; text-align: center; line-height: 1.6; }
    button {
      background: #D9A066;
      color: #2B2825;
      border: none;
      padding: 12px 32px;
      border-radius: 6px;
      font-size: 1.05rem;
      cursor: pointer;
      font-family: Georgia, serif;
      font-weight: bold;
      transition: background 0.15s, transform 0.08s;
    }
    button:hover { background: #C88E55; }
    button:active { transform: scale(0.94) translateY(2px); }
    .count { color: #D9A066; font-size: 0.8rem; letter-spacing: 0.08em; min-height: 1.2rem; }
    .spark {
      position: fixed;
      width: 7px; height: 7px;
      border-radius: 50%;
      pointer-events: none;
      animation: fly var(--d,0.6s) ease-out forwards;
    }
    @keyframes fly {
      0%   { opacity: 1; transform: translate(0,0) scale(1); }
      100% { opacity: 0; transform: translate(var(--x),var(--y)) scale(0.15); }
    }
    .flash {
      position: fixed; inset: 0;
      background: rgba(217,160,102,0.12);
      pointer-events: none;
      animation: flash 0.25s ease-out forwards;
    }
    @keyframes flash { to { opacity: 0; } }
    @keyframes thud {
      0%,100% { transform: scale(1); }
      40%      { transform: scale(0.91) translateY(3px); }
    }
    button.striking { animation: thud 0.18s ease-in-out; }
  </style>
</head>
<body>
  <h1>Welcome to the Forge 🔥</h1>
  <p>Your ideas, your tools, your craft. Start building something real.</p>
  <button id="btn" onclick="strike(this)">Strike the Anvil</button>
  <div class="count" id="tally"></div>
  <script>
    var hits = 0;
    var palette = ['#D9A066','#F0C040','#FF8C00','#FFD700','#FF6040'];
    function strike(btn) {
      hits++;
      btn.classList.remove('striking');
      void btn.offsetWidth;
      btn.classList.add('striking');
      btn.textContent = hits === 1 ? 'Forged!' : 'Strike again!';
      document.getElementById('tally').textContent =
        hits === 1 ? 'First strike — something is taking shape.' :
        hits < 5   ? hits + ' strikes — keep going.' :
                     hits + ' strikes — a true smith never stops.';
      sparks(btn); flash();
    }
    function sparks(btn) {
      var r = btn.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      for (var i = 0; i < 18; i++) {
        var el = document.createElement('div');
        el.className = 'spark';
        var a = Math.PI * 2 * i / 18 + (Math.random() - .5) * .9;
        var d = 55 + Math.random() * 90;
        var dur = (.38 + Math.random() * .38).toFixed(2);
        el.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;' +
          'background:' + palette[i % palette.length] + ';' +
          '--x:' + (Math.cos(a)*d).toFixed(1) + 'px;' +
          '--y:' + (Math.sin(a)*d - 18).toFixed(1) + 'px;' +
          '--d:' + dur + 's';
        document.body.appendChild(el);
        el.addEventListener('animationend', function(){ this.remove(); });
      }
    }
    function flash() {
      var el = document.createElement('div');
      el.className = 'flash';
      document.body.appendChild(el);
      el.addEventListener('animationend', function(){ this.remove(); });
    }
  </script>
</body>
</html>`,
  },
  {
    label: "Animated Cards",
    lang: "html",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, serif;
      background: #111B0F;
      color: #D4C9B8;
      padding: 24px;
      min-height: 100vh;
    }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-top: 20px; }
    .card {
      background: #1A2E1A;
      border: 1px solid #2A4A2A;
      border-radius: 8px;
      padding: 20px 16px;
      text-align: center;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(217,160,102,0.2); }
    .card .icon { font-size: 2rem; margin-bottom: 8px; }
    .card h3 { color: #D9A066; font-size: 1rem; }
    h1 { color: #D9A066; }
  </style>
</head>
<body>
  <h1>Your Homestead Skills</h1>
  <div class="grid">
    <div class="card"><div class="icon">🌱</div><h3>Growing</h3></div>
    <div class="card"><div class="icon">🔥</div><h3>Preserving</h3></div>
    <div class="card"><div class="icon">🪵</div><h3>Building</h3></div>
    <div class="card"><div class="icon">💧</div><h3>Water</h3></div>
  </div>
</body>
</html>`,
  },
  {
    label: "Zone Progress Tracker",
    lang: "html",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <style>
    body { font-family: Georgia, serif; background: #0E1F10; color: #D4C9B8; padding: 24px; }
    h2 { color: #D9A066; margin-bottom: 16px; }
    .zone { margin-bottom: 14px; }
    .label { display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 4px; }
    .bar-bg { background: #1A2E1A; border-radius: 99px; height: 12px; overflow: hidden; }
    .bar { height: 12px; border-radius: 99px; background: linear-gradient(90deg, #2C4A36, #D9A066); transition: width 0.8s ease; }
  </style>
</head>
<body>
  <h2>Community Zone Progress</h2>
  <div id="zones"></div>
  <script>
    const zones = [
      { name: "Z0 — Household", pct: 85 },
      { name: "Z1 — Neighbourhood", pct: 60 },
      { name: "Z2 — Community", pct: 42 },
      { name: "Z3 — District", pct: 28 },
      { name: "Z4 — Bioregion", pct: 15 },
      { name: "Z5 — Regional", pct: 5 },
    ];
    const container = document.getElementById("zones");
    zones.forEach(z => {
      container.innerHTML += \`<div class="zone">
        <div class="label"><span>\${z.name}</span><span>\${z.pct}%</span></div>
        <div class="bar-bg"><div class="bar" style="width:0" data-pct="\${z.pct}"></div></div>
      </div>\`;
    });
    setTimeout(() => {
      document.querySelectorAll(".bar").forEach(b => {
        b.style.width = b.dataset.pct + "%";
      });
    }, 100);
  </script>
</body>
</html>`,
  },
  {
    label: "Blank Canvas",
    lang: "html",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Georgia, serif;
      background: #0E1F10;
      color: #D4C9B8;
      margin: 0;
      padding: 24px;
    }
  </style>
</head>
<body>
  <h1>Start forging...</h1>
</body>
</html>`,
  },
];

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

function SparkBurst({ trigger }: { trigger: number }) {
  return (
    <AnimatePresence>
      {trigger > 0 && (
        <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
          {Array.from({ length: 18 }).map((_, i) => {
            const angle = (i / 18) * Math.PI * 2;
            const dist = 60 + Math.random() * 80;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            const colors = ["#D9A066", "#F0C07A", "#4A8C5C", "#A3C97A", "#C07840"];
            const color = colors[i % colors.length];
            return (
              <motion.div
                key={`${trigger}-${i}`}
                className="absolute rounded-full"
                style={{
                  left: "50%",
                  top: "40px",
                  width: 6 + Math.random() * 6,
                  height: 6 + Math.random() * 6,
                  background: color,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x, y, opacity: 0, scale: 0 }}
                transition={{ duration: 0.9 + Math.random() * 0.4, ease: "easeOut" }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}

export default function ForgeEditor() {
  const [code, setCode] = useState(TEMPLATES[0].code);
  const [previewSrc, setPreviewSrc] = useState(TEMPLATES[0].code);
  const [isRunning, setIsRunning] = useState(false);
  const [sparkTrigger, setSparkTrigger] = useState(0);
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [gordPerching, setGordPerching] = useState(false);
  const [showToolWallMobile, setShowToolWallMobile] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showMobileEditor, setShowMobileEditor] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setGordPerching(true), 8000);
    const t2 = setTimeout(() => setGordPerching(false), 14000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      setPreviewSrc(code);
      setIsRunning(false);
      setSparkTrigger(n => n + 1);
    }, 300);
  }, [code]);

  const handleReset = useCallback(() => {
    const tpl = TEMPLATES[activeTemplate];
    setCode(tpl.code);
    setPreviewSrc(tpl.code);
  }, [activeTemplate]);

  const handleTemplateSelect = useCallback((idx: number) => {
    setActiveTemplate(idx);
    setCode(TEMPLATES[idx].code);
    setPreviewSrc(TEMPLATES[idx].code);
    setShowToolWallMobile(false);
  }, []);

  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    monaco.editor.defineTheme("forge-dark", FORGE_THEME);
    monaco.editor.setTheme("forge-dark");
  }, []);

  return (
    <section className="w-full px-4 md:px-8 py-10" id="forge">
      <div className="max-w-7xl mx-auto">
        <div className="forge-workbench relative">
          <div className="forge-workbench-header flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#D9A066]">
                <path d="M14.5 3.5C14.5 3.5 14.5 5 13 6.5L8 11.5L5 14.5L3.5 17L7 20.5L9.5 19L12.5 16L17.5 11C19 9.5 20.5 9.5 20.5 9.5L14.5 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2" />
                <circle cx="6" cy="18" r="1.5" fill="currentColor" />
              </svg>
              <span className="text-[#D9A066] font-medium text-sm tracking-wide">The Forge</span>
              <div className="flex gap-1 ml-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3A1A1A] border border-[#5A2A2A]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#2A3A1A] border border-[#3A5A2A]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#2A2A3A] border border-[#3A3A5A]" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile-only controls */}
              <button
                className="md:hidden text-[#8A9E8A] hover:text-[#D9A066] text-xs border border-[#2A4A2A] px-3 py-1.5 rounded transition-colors"
                onClick={() => setShowToolWallMobile(v => !v)}
              >
                Templates
              </button>
              {showMobileEditor && (
                <button
                  onClick={handleReset}
                  className="md:hidden forge-btn-secondary text-xs px-3 py-1.5 rounded transition-all"
                >
                  Reset
                </button>
              )}
              {showMobileEditor && (
                <motion.button
                  onClick={handleRun}
                  className="md:hidden forge-btn-run text-sm px-4 py-1.5 rounded font-medium relative overflow-hidden"
                  whileTap={{ scale: 0.95 }}
                  animate={isRunning ? { scale: [1, 0.97, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {isRunning ? (
                    <span className="flex items-center gap-1.5">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                        className="inline-block"
                      >⚙</motion.span>
                      Running…
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z" /></svg>
                      Run
                    </span>
                  )}
                  <motion.div
                    className="absolute inset-0 rounded bg-[#F0C07A]/20"
                    initial={{ scale: 0, opacity: 0.8 }}
                    animate={isRunning ? { scale: 1.5, opacity: 0 } : { scale: 0, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                </motion.button>
              )}

              {/* Desktop-only controls */}
              <button
                onClick={() => setShowEditor(v => !v)}
                className="hidden md:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition-colors"
                style={{
                  borderColor: showEditor ? "#4A8C5C" : "#2A4A2A",
                  color: showEditor ? "#A3C97A" : "#5A7A5A",
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                </svg>
                {showEditor ? "Hide code" : "Edit code"}
              </button>

              {showEditor && (
                <button
                  onClick={handleReset}
                  className="hidden md:inline-flex forge-btn-secondary text-xs px-3 py-1.5 rounded transition-all"
                >
                  Reset
                </button>
              )}

              {showEditor && (
              <motion.button
                onClick={handleRun}
                className="hidden md:inline-flex forge-btn-run text-sm px-5 py-1.5 rounded font-medium relative overflow-hidden"
                whileTap={{ scale: 0.95 }}
                animate={isRunning ? { scale: [1, 0.97, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {isRunning ? (
                  <span className="flex items-center gap-1.5">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >⚙</motion.span>
                    Running…
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z" /></svg>
                    Run
                  </span>
                )}

                <motion.div
                  className="absolute inset-0 rounded bg-[#F0C07A]/20"
                  initial={{ scale: 0, opacity: 0.8 }}
                  animate={isRunning ? { scale: 1.5, opacity: 0 } : { scale: 0, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                />
              </motion.button>
              )}
            </div>
          </div>

          <div className="relative flex gap-0">
            {/* Tool wall — only show when editor is open on desktop */}
            {showEditor && (
              <div className="hidden md:flex flex-col w-[200px] shrink-0 forge-toolwall-panel">
                <div className="px-4 py-3 border-b border-[#1E3820]">
                  <span className="text-[10px] font-bold tracking-widest text-[#5A7A5A] uppercase">Tool Wall</span>
                </div>
                <div className="flex flex-col gap-1 p-3">
                  {TEMPLATES.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => handleTemplateSelect(i)}
                      className={`forge-plaque text-left text-xs px-3 py-2.5 rounded transition-all ${activeTemplate === i ? "forge-plaque-active" : ""}`}
                    >
                      <span className="block font-medium text-[#C4B49A]">{t.label}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-auto px-4 py-3 border-t border-[#1E3820]">
                  <div className="text-[10px] font-bold tracking-widest text-[#5A7A5A] uppercase mb-2">Resources</div>
                  {[
                    { label: "MDN Web Docs", url: "https://developer.mozilla.org" },
                    { label: "CSS Tricks", url: "https://css-tricks.com" },
                    { label: "JS.info", url: "https://javascript.info" },
                  ].map((r) => (
                    <a
                      key={r.url}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-[#8A9E8A] hover:text-[#D9A066] py-1 transition-colors"
                    >
                      → {r.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {showToolWallMobile && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="md:hidden absolute top-0 left-0 right-0 z-30 forge-toolwall-panel rounded-b-md p-3 flex flex-wrap gap-2 border-b border-[#2A4A2A]"
                >
                  {TEMPLATES.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => handleTemplateSelect(i)}
                      className={`forge-plaque text-xs px-3 py-2 rounded transition-all ${activeTemplate === i ? "forge-plaque-active" : ""}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 min-w-0">
              {/* Desktop: preview-only by default, split when editor is open */}
              <div className="hidden md:block">
                {showEditor ? (
                  <ResizablePanelGroup direction="horizontal" className="forge-panels-h">
                    <ResizablePanel defaultSize={42} minSize={28}>
                      <div className="forge-editor-pane h-full">
                        <div className="forge-pane-label">editor</div>
                        <Editor
                          height="460px"
                          language="html"
                          value={code}
                          onChange={(v) => setCode(v ?? "")}
                          onMount={handleEditorMount}
                          theme="forge-dark"
                          options={{
                            fontSize: 13,
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                            lineNumbers: "on",
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            wordWrap: "on",
                            padding: { top: 12, bottom: 12 },
                            renderLineHighlight: "line",
                            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                          }}
                        />
                      </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle className="forge-resize-handle" />

                    <ResizablePanel defaultSize={58} minSize={30}>
                      <div className="forge-preview-pane h-full relative">
                        <div className="forge-pane-label">preview</div>
                        <SparkBurst trigger={sparkTrigger} />
                        <iframe
                          key={previewSrc}
                          srcDoc={previewSrc}
                          sandbox="allow-scripts"
                          className="w-full h-[460px] border-0 bg-white"
                          title="Live preview"
                        />
                        <AnimatePresence>
                          {gordPerching && (
                            <motion.div
                              initial={{ x: 20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              exit={{ x: 20, opacity: 0 }}
                              className="absolute bottom-2 right-2 pointer-events-none"
                            >
                              <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                                <GordBird size={42} variant="head" eyeTarget={{ dx: -0.3, dy: -0.2 }} />
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                ) : (
                  /* Preview-only state */
                  <div className="forge-preview-pane relative">
                    <div className="forge-pane-label">preview</div>
                    <SparkBurst trigger={sparkTrigger} />
                    <iframe
                      key={previewSrc}
                      srcDoc={previewSrc}
                      sandbox="allow-scripts"
                      className="w-full h-[460px] border-0 bg-white"
                      title="Live preview"
                    />
                    {/* Subtle "Edit code" nudge overlay */}
                    <div className="absolute bottom-4 right-4 pointer-events-none">
                      <div className="text-[11px] text-[#4A6A4A] flex items-center gap-1.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                        </svg>
                        Peek behind the curtain
                      </div>
                    </div>
                    <AnimatePresence>
                      {gordPerching && (
                        <motion.div
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: 20, opacity: 0 }}
                          className="absolute bottom-2 right-2 pointer-events-none"
                        >
                          <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                            <GordBird size={42} variant="head" eyeTarget={{ dx: -0.3, dy: -0.2 }} />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Mobile: preview-first by default, editor revealed on toggle */}
              <div className="md:hidden flex flex-col">
                <AnimatePresence>
                  {showMobileEditor && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="forge-editor-pane">
                        <div className="forge-pane-label">craft</div>
                        <Editor
                          height="260px"
                          language="html"
                          value={code}
                          onChange={(v) => setCode(v ?? "")}
                          onMount={handleEditorMount}
                          theme="forge-dark"
                          options={{
                            fontSize: 12,
                            fontFamily: "ui-monospace, monospace",
                            lineNumbers: "off",
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            wordWrap: "on",
                            padding: { top: 8, bottom: 8 },
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="forge-preview-pane relative">
                  <div className="forge-pane-label">preview</div>
                  <SparkBurst trigger={sparkTrigger} />
                  <iframe
                    key={previewSrc}
                    srcDoc={previewSrc}
                    sandbox="allow-scripts"
                    className="w-full h-[300px] border-0 bg-white"
                    title="Live preview"
                  />
                </div>
                {/* Peek behind the curtain toggle */}
                <button
                  onClick={() => setShowMobileEditor(v => !v)}
                  className="flex items-center justify-center gap-2 py-2.5 text-[11px] transition-colors border-t border-[#1E3820]"
                  style={{ color: showMobileEditor ? "#D9A066" : "#4A6A4A" }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                  </svg>
                  {showMobileEditor ? "Hide the craft" : "Peek behind the curtain"}
                </button>
              </div>
            </div>
          </div>

          <div className="forge-workbench-footer px-5 py-2 flex items-center gap-3 text-[10px] text-[#5A7A5A]">
            <span>Your words. Your craft.</span>
            <span className="w-1 h-1 rounded-full bg-[#3A5A3A]" />
            <span>Everything runs in your browser</span>
            <span className="w-1 h-1 rounded-full bg-[#3A5A3A]" />
            <span>Nothing leaves your hands</span>
          </div>
        </div>
      </div>
    </section>
  );
}
