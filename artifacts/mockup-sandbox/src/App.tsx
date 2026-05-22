import { useEffect, useState, type ComponentType } from "react";

import { modules as discoveredModules } from "./.generated/mockup-components";

type ModuleMap = Record<string, () => Promise<Record<string, unknown>>>;

function _resolveComponent(
  mod: Record<string, unknown>,
  name: string,
): ComponentType | undefined {
  const fns = Object.values(mod).filter(
    (v) => typeof v === "function",
  ) as ComponentType[];
  return (
    (mod.default as ComponentType) ||
    (mod.Preview as ComponentType) ||
    (mod[name] as ComponentType) ||
    fns[fns.length - 1]
  );
}

function PreviewRenderer({
  componentPath,
  modules,
}: {
  componentPath: string;
  modules: ModuleMap;
}) {
  const [Component, setComponent] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setComponent(null);
    setError(null);

    async function loadComponent(): Promise<void> {
      const key = `./components/mockups/${componentPath}.tsx`;
      const loader = modules[key];
      if (!loader) {
        setError(`No component found at ${componentPath}.tsx`);
        return;
      }

      try {
        const mod = await loader();
        if (cancelled) {
          return;
        }
        const name = componentPath.split("/").pop()!;
        const comp = _resolveComponent(mod, name);
        if (!comp) {
          setError(
            `No exported React component found in ${componentPath}.tsx\n\nMake sure the file has at least one exported function component.`,
          );
          return;
        }
        setComponent(() => comp);
      } catch (e) {
        if (cancelled) {
          return;
        }

        const message = e instanceof Error ? e.message : String(e);
        setError(`Failed to load preview.\n${message}`);
      }
    }

    void loadComponent();

    return () => {
      cancelled = true;
    };
  }, [componentPath, modules]);

  if (error) {
    return (
      <pre style={{ color: "red", padding: "2rem", fontFamily: "system-ui" }}>
        {error}
      </pre>
    );
  }

  if (!Component) return null;

  return <Component />;
}

function getBasePath(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "");
}

function getPreviewExamplePath(): string {
  const basePath = getBasePath();
  return `${basePath}/preview/ComponentName`;
}

function Gallery() {
  const basePath = getBasePath();
  const mapUrl = `${basePath}/preview/ZoneBubbleMap`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a120a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 24px 48px",
        fontFamily: "'Georgia', serif",
        gap: 24,
      }}
    >
      {/* Canvas board header */}
      <div style={{ textAlign: "center", maxWidth: 700 }}>
        <p style={{ color: "#5a7a5a", fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 8px" }}>
          Prototype · Mockup Canvas
        </p>
        <h1 style={{ color: "#C4A05A", margin: "0 0 10px", fontSize: "1.6rem", fontWeight: 700, letterSpacing: "0.04em" }}>
          Zone Bubble &amp; Gate Map
        </h1>
        <p style={{ color: "#8a9a8a", margin: 0, fontSize: "0.85rem", lineHeight: 1.6 }}>
          A spatial, relational model of the TSP 6-zone territory. Zones are organic overlapping bubbles;
          the overlap regions are interactive <strong style={{ color: "#b0a070" }}>gates</strong> — the membranes where you change
          identity and cross from one zone into the next.
        </p>
      </div>

      {/* Instruction chips */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {[
          "Click a zone bubble to see what lives there",
          "Click a gate (overlap) to gear up for the crossing",
          "Set your position · mark gates as crossed",
        ].map((tip) => (
          <div
            key={tip}
            style={{
              background: "#1a2a1a",
              border: "1px solid #2a3a2a",
              borderRadius: 20,
              padding: "5px 13px",
              color: "#6a8a6a",
              fontSize: "0.72rem",
            }}
          >
            {tip}
          </div>
        ))}
      </div>

      {/* iframe embed */}
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          borderRadius: 10,
          overflow: "hidden",
          border: "1px solid #2a3a2a",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
        }}
      >
        <iframe
          src={mapUrl}
          style={{
            width: "100%",
            height: 620,
            border: "none",
            display: "block",
          }}
          title="Zone Bubble Map"
        />
      </div>

      {/* Direct link */}
      <p style={{ color: "#3a4a3a", fontSize: "0.7rem", margin: 0 }}>
        Full-screen:{" "}
        <a href={mapUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#5a7a5a" }}>
          {mapUrl}
        </a>
      </p>
    </div>
  );
}

function getPreviewPath(): string | null {
  const basePath = getBasePath();
  const { pathname } = window.location;
  const local =
    basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length) || "/"
      : pathname;
  const match = local.match(/^\/preview\/(.+)$/);
  return match ? match[1] : null;
}

function App() {
  const previewPath = getPreviewPath();

  if (previewPath) {
    return (
      <PreviewRenderer
        componentPath={previewPath}
        modules={discoveredModules}
      />
    );
  }

  return <Gallery />;
}

export default App;
