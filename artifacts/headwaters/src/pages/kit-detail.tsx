import { useState } from "react";
import { useParams, Link, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";

function apiUrl(path: string): string {
  return `/api${path}`;
}

type KitData = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  priceType: "direct" | "consultative";
  priceCents?: number;
  ctaLabel: string;
};

const S = {
  page: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    background: "#fff",
    color: "#111",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as React.CSSProperties,

  inner: {
    maxWidth: "560px",
    width: "100%",
    padding: "64px 40px 80px",
  } as React.CSSProperties,

  back: {
    display: "inline-block",
    fontSize: "11px",
    letterSpacing: "0.12em",
    color: "#888",
    textDecoration: "none",
    marginBottom: "48px",
    textTransform: "uppercase" as const,
  } as React.CSSProperties,

  label: {
    fontSize: "11px",
    letterSpacing: "0.15em",
    color: "#999",
    textTransform: "uppercase" as const,
    marginBottom: "14px",
    display: "block",
    fontFamily: "'Courier New', monospace",
  } as React.CSSProperties,

  name: {
    fontSize: "28px",
    fontWeight: "normal",
    lineHeight: 1.2,
    marginBottom: "10px",
    color: "#111",
  } as React.CSSProperties,

  tagline: {
    fontSize: "15px",
    color: "#666",
    fontStyle: "italic",
    marginBottom: "28px",
    lineHeight: 1.5,
  } as React.CSSProperties,

  divider: {
    border: "none",
    borderTop: "1px solid #e0e0e0",
    margin: "28px 0",
  } as React.CSSProperties,

  description: {
    fontSize: "14px",
    lineHeight: 1.75,
    color: "#333",
    marginBottom: "36px",
  } as React.CSSProperties,

  price: {
    fontSize: "13px",
    color: "#555",
    marginBottom: "20px",
    fontFamily: "'Courier New', monospace",
    letterSpacing: "0.04em",
  } as React.CSSProperties,

  btn: {
    display: "inline-block",
    padding: "12px 28px",
    background: "#1a1a14",
    color: "#e8dfc0",
    border: "none",
    borderRadius: "4px",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "Georgia, serif",
    letterSpacing: "0.02em",
    transition: "opacity 0.15s",
  } as React.CSSProperties,

  btnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  } as React.CSSProperties,

  error: {
    marginTop: "14px",
    fontSize: "12.5px",
    color: "#b44",
  } as React.CSSProperties,

  success: {
    background: "#f4f8f3",
    borderLeft: "3px solid #6A9C5A",
    padding: "12px 16px",
    marginBottom: "28px",
    fontSize: "13.5px",
    color: "#3a5a30",
    lineHeight: 1.6,
  } as React.CSSProperties,

  notFound: {
    textAlign: "center" as const,
    color: "#888",
    fontSize: "14px",
    padding: "80px 40px",
  } as React.CSSProperties,
};

export default function KitDetail() {
  const { slug } = useParams<{ slug: string }>();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const purchased = params.get("purchased") === "1";

  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const { data: kit, isLoading, isError } = useQuery<KitData>({
    queryKey: ["kit", slug],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/kits/${slug}`));
      if (!res.ok) throw new Error("Kit not found");
      return res.json();
    },
    enabled: Boolean(slug),
    retry: false,
  });

  async function handleCheckout() {
    if (!kit || kit.priceType !== "direct") return;
    setLoading(true);
    setCheckoutError(null);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const successPath = `${base}/kit/${slug}?purchased=1&session_id={CHECKOUT_SESSION_ID}`;
      const cancelPath = `${base}/kit/${slug}`;

      const res = await fetch(apiUrl(`/kits/${slug}/checkout`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ successPath, cancelPath }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not start checkout. Please try again.");
      }
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned.");
      }
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div style={S.page}>
        <div style={{ ...S.inner, color: "#aaa", fontSize: "13px" }}>Loading…</div>
      </div>
    );
  }

  if (isError || !kit) {
    return (
      <div style={S.page}>
        <div style={S.notFound}>
          <p>Kit not found.</p>
          <Link href="/" style={{ color: "#888", fontSize: "12px" }}>← Back</Link>
        </div>
      </div>
    );
  }

  const priceDisplay =
    kit.priceType === "direct" && kit.priceCents
      ? `$${(kit.priceCents / 100).toFixed(0)} CAD`
      : null;

  return (
    <div style={S.page}>
      <div style={S.inner}>
        <Link href="/" style={S.back}>← Headwaters</Link>

        <span style={S.label}>Headwaters Kit</span>

        <h1 style={S.name}>{kit.name}</h1>
        <p style={S.tagline}>{kit.tagline}</p>

        <hr style={S.divider} />

        {purchased && (
          <div style={S.success}>
            Your kit is on its way. Check your inbox — the welcome email has everything you need to get started.
          </div>
        )}

        <p style={S.description}>{kit.description}</p>

        {kit.priceType === "direct" && !purchased && (
          <>
            {priceDisplay && (
              <p style={S.price}>{priceDisplay} · one time</p>
            )}
            <button
              style={{
                ...S.btn,
                ...(loading ? S.btnDisabled : {}),
              }}
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? "Opening checkout…" : kit.ctaLabel}
            </button>
            {checkoutError && (
              <p style={S.error}>{checkoutError}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
