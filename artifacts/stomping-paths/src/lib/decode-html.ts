const textarea =
  typeof document !== "undefined" ? document.createElement("textarea") : null;

export function decodeHtml(html: string): string {
  if (!textarea) return html;
  textarea.innerHTML = html;
  return textarea.value;
}
