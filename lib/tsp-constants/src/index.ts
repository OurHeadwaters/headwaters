export const TAGLINE = "We always knew how to fix it; Now we can.";

export const KIT_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function kitStorageKey(slug: string): string {
  return `kit-access-v1:${slug}`;
}
