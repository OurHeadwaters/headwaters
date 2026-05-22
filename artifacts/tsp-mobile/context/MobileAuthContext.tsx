import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import Constants from "expo-constants";
import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = "tsp_session_token";
const OIDC_ISSUER = "https://replit.com/oidc";
const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return AsyncStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function storeToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
}

async function clearToken(): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

setAuthTokenGetter(async () => {
  if (Platform.OS === "web") return null;
  return getStoredToken();
});

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface MobileAuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const MobileAuthContext = createContext<MobileAuthContextValue | null>(null);

export function MobileAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const discovery = AuthSession.useAutoDiscovery(OIDC_ISSUER);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "tsp-mobile",
    path: "auth",
  });

  const clientId: string =
    Constants.expoConfig?.extra?.replId ?? process.env.EXPO_PUBLIC_REPL_ID ?? "";

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      scopes: ["openid", "email", "profile", "offline_access"],
      redirectUri,
      usePKCE: true,
    },
    discovery,
  );

  const hydrateUser = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/user`, {
        headers: { Authorization: `Bearer ${sid}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const saved = await getStoredToken();
        if (saved) {
          setToken(saved);
          await hydrateUser(saved);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [hydrateUser]);

  useEffect(() => {
    if (response?.type !== "success") return;
    const { code, state } = response.params;
    if (!code || !request?.codeVerifier) return;

    (async () => {
      try {
        const exchangeRes = await fetch(`${API_BASE}/api/mobile-auth/token-exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            code_verifier: request.codeVerifier,
            redirect_uri: redirectUri,
            state,
          }),
        });
        if (!exchangeRes.ok) return;
        const data = await exchangeRes.json();
        if (data.token) {
          await storeToken(data.token);
          setToken(data.token);
          await hydrateUser(data.token);
        }
      } catch {
      }
    })();
  }, [response, request, redirectUri, hydrateUser]);

  const signIn = useCallback(async () => {
    if (Platform.OS === "web") return;
    if (!discovery || !request) return;
    await promptAsync();
  }, [promptAsync, discovery, request]);

  const signOut = useCallback(async () => {
    if (token) {
      try {
        await fetch(`${API_BASE}/api/mobile-auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
      }
    }
    await clearToken();
    setToken(null);
    setUser(null);
  }, [token]);

  return (
    <MobileAuthContext.Provider
      value={{
        isAuthenticated: !!token,
        isLoading,
        user,
        signIn,
        signOut,
      }}
    >
      {children}
    </MobileAuthContext.Provider>
  );
}

export function useMobileAuth(): MobileAuthContextValue {
  const ctx = useContext(MobileAuthContext);
  if (!ctx) throw new Error("useMobileAuth must be used inside MobileAuthProvider");
  return ctx;
}
