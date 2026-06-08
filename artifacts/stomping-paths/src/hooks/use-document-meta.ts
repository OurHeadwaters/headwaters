import { useEffect } from "react";

interface DocumentMeta {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
}

function getMeta(property: string, attr: "name" | "property" = "property"): string {
  const el = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement | null;
  return el?.getAttribute("content") ?? "";
}

function setMeta(property: string, content: string, attr: "name" | "property" = "property") {
  let el = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function useDocumentMeta(meta: DocumentMeta) {
  useEffect(() => {
    if (!meta.title && !meta.ogTitle) return;

    const prevTitle = document.title;
    const prevDescription = getMeta("description", "name");
    const prevOgTitle = getMeta("og:title");
    const prevOgDescription = getMeta("og:description");
    const prevOgImage = getMeta("og:image");
    const prevOgUrl = getMeta("og:url");
    const prevOgType = getMeta("og:type");
    const prevTwitterTitle = getMeta("twitter:title", "name");
    const prevTwitterDescription = getMeta("twitter:description", "name");
    const prevTwitterImage = getMeta("twitter:image", "name");

    if (meta.title) document.title = meta.title;
    if (meta.description) setMeta("description", meta.description, "name");
    if (meta.ogTitle) setMeta("og:title", meta.ogTitle);
    if (meta.ogDescription) setMeta("og:description", meta.ogDescription);
    if (meta.ogImage) setMeta("og:image", meta.ogImage);
    if (meta.ogUrl) setMeta("og:url", meta.ogUrl);
    if (meta.ogType) setMeta("og:type", meta.ogType);
    if (meta.ogTitle) setMeta("twitter:title", meta.ogTitle, "name");
    if (meta.ogDescription) setMeta("twitter:description", meta.ogDescription, "name");
    if (meta.ogImage) setMeta("twitter:image", meta.ogImage, "name");

    return () => {
      document.title = prevTitle;
      setMeta("description", prevDescription, "name");
      setMeta("og:title", prevOgTitle);
      setMeta("og:description", prevOgDescription);
      setMeta("og:image", prevOgImage);
      setMeta("og:url", prevOgUrl);
      setMeta("og:type", prevOgType);
      setMeta("twitter:title", prevTwitterTitle, "name");
      setMeta("twitter:description", prevTwitterDescription, "name");
      setMeta("twitter:image", prevTwitterImage, "name");
    };
  }, [
    meta.title,
    meta.description,
    meta.ogTitle,
    meta.ogDescription,
    meta.ogImage,
    meta.ogUrl,
    meta.ogType,
  ]);
}
