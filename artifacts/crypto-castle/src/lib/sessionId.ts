const LS_KEY = "castle:sessionId";
const COOKIE_NAME = "castle_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function readCookie(): string | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function writeCookie(id: string): void {
  try {
    document.cookie = `${COOKIE_NAME}=${id}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
  } catch {}
}

function persist(id: string): void {
  try { localStorage.setItem(LS_KEY, id); } catch {}
  writeCookie(id);
}

async function createServerSession(): Promise<string> {
  const res = await fetch("/api/castle/session", { method: "POST" });
  if (!res.ok) throw new Error("session create failed");
  const { sessionId } = await res.json() as { sessionId: string };
  return sessionId;
}

let _sessionId: string | null = null;

export async function getSessionId(): Promise<string> {
  if (_sessionId) return _sessionId;

  const fromLS = (() => { try { return localStorage.getItem(LS_KEY); } catch { return null; } })();
  if (fromLS) {
    _sessionId = fromLS;
    writeCookie(fromLS);
    return fromLS;
  }

  const fromCookie = readCookie();
  if (fromCookie) {
    _sessionId = fromCookie;
    try { localStorage.setItem(LS_KEY, fromCookie); } catch {}
    return fromCookie;
  }

  const id = await createServerSession();
  persist(id);
  _sessionId = id;
  return id;
}

export function getSessionIdSync(): string | null {
  if (_sessionId) return _sessionId;
  try { return localStorage.getItem(LS_KEY) ?? readCookie(); } catch { return readCookie(); }
}

export function restoreSession(id: string): void {
  _sessionId = id;
  persist(id);
}
