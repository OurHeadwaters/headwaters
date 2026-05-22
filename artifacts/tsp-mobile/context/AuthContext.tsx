import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = "tsp:auth_token";
const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
const ISSUER = "https://replit.com/oidc";
const CLIENT_ID = process.env.EXPO_PUBLIC_REPL_ID ?? "";

const REDIRECT_URI = AuthSession.makeRedirectUri({ scheme: "tsp-mobile" });

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  const discovery = AuthSession.useAutoDiscovery(ISSUER);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ["openid", "email", "profile", "offline_access"],
      responseType: AuthSession.ResponseType.Code,
      redirectUri: REDIRECT_URI,
      usePKCE: true,
    },
    discovery,
  );

  const fetchUser = useCallback(async (tok: string): Promise<AuthUser | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/user`, {
        headers: { Authorization: `Bearer ${tok}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { user: AuthUser | null };
      return data.user;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    AsyncStorage.getItem(TOKEN_KEY).then(async (stored) => {
      if (!mountedRef.current) return;
      if (stored) {
        const u = await fetchUser(stored);
        if (!mountedRef.current) return;
        if (u) {
          setToken(stored);
          setUser(u);
        } else {
          await AsyncStorage.removeItem(TOKEN_KEY);
        }
      }
      setIsLoading(false);
    });
    return () => {
      mountedRef.current = false;
    };
  }, [fetchUser]);

  useEffect(() => {
    if (!response || response.type !== "success" || !request?.codeVerifier) return;

    const { code, state } = response.params;

    (async () => {
      try {
        const exchangeRes = await fetch(`${API_BASE}/api/mobile-auth/token-exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            code_verifier: request.codeVerifier,
            redirect_uri: REDIRECT_URI,
            state: state ?? request.state ?? "",
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (!exchangeRes.ok) return;

        const { token: newToken } = (await exchangeRes.json()) as { token: string };
        const u = await fetchUser(newToken);
        if (!u) return;

        await AsyncStorage.setItem(TOKEN_KEY, newToken);
        if (mountedRef.current) {
          setToken(newToken);
          setUser(u);
        }
      } catch {
      }
    })();
  }, [response, request, fetchUser]);

  const login = useCallback(async () => {
    if (!request) return;
    await promptAsync();
  }, [request, promptAsync]);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await fetch(`${API_BASE}/api/mobile-auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(8000),
        });
      } catch {
      }
    }
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
