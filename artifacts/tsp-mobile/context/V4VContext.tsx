import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking } from "react-native";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const WALLET_KEY = "tsp:v4v_wallet";
const STATS_KEY = "tsp:v4v_stats";
const SUPPORTER_KEY = "tsp:v4v_supporter";

export type WalletType = "lightning" | "xrpl";

export interface WalletState {
  type: WalletType;
  address: string; // Lightning address (user@domain) or XRPL r-address
}

export interface V4VStats {
  totalSatsSent: number;
  totalXrpSent: number;
  episodesBoosted: string[];
  boostCount: number;
}

export interface ValueSplit {
  creatorId: number;
  name: string;
  role: string;
  walletType: string;
  walletAddress: string;
  splitPct: number;
}

export interface BoostParams {
  episodeSlug: string;
  amountSats: number;
  message?: string;
  splits: ValueSplit[];
}

interface V4VState {
  wallet: WalletState | null;
  isSupporter: boolean;
  stats: V4VStats;
  streamingSats: number;
  connectLightning: (address: string) => Promise<{ ok: boolean; error?: string }>;
  connectXrpl: (address: string) => void;
  disconnectWallet: () => void;
  sendBoost: (params: BoostParams) => Promise<boolean>;
  addStreamingSats: (sats: number) => void;
  resetStreamingSats: () => void;
  fetchEpisodeSplits: (slug: string) => Promise<ValueSplit[]>;
}

const V4VContext = createContext<V4VState | null>(null);

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

function isValidLightningAddress(addr: string): boolean {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(addr.trim());
}

function isValidXrplAddress(addr: string): boolean {
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(addr.trim());
}

async function resolveLnurl(lightningAddress: string): Promise<string | null> {
  try {
    const [user, domain] = lightningAddress.split("@");
    const url = `https://${domain}/.well-known/lnurlp/${user}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.callback ?? null;
  } catch {
    return null;
  }
}

async function fetchLightningInvoice(
  callbackUrl: string,
  amountMsat: number,
  comment?: string,
): Promise<string | null> {
  try {
    const url = new URL(callbackUrl);
    url.searchParams.set("amount", String(amountMsat));
    if (comment) url.searchParams.set("comment", comment.slice(0, 144));
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.pr ?? null;
  } catch {
    return null;
  }
}

export function V4VProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [isSupporter, setIsSupporter] = useState(false);
  const [streamingSats, setStreamingSats] = useState(0);
  const [stats, setStats] = useState<V4VStats>({
    totalSatsSent: 0,
    totalXrpSent: 0,
    episodesBoosted: [],
    boostCount: 0,
  });

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(WALLET_KEY),
      AsyncStorage.getItem(STATS_KEY),
      AsyncStorage.getItem(SUPPORTER_KEY),
    ]).then(([walletRaw, statsRaw, supporterRaw]) => {
      if (walletRaw) {
        try { setWallet(JSON.parse(walletRaw)); } catch {}
      }
      if (statsRaw) {
        try { setStats(JSON.parse(statsRaw)); } catch {}
      }
      if (supporterRaw === "true") {
        setIsSupporter(true);
      }
    });
  }, []);

  const persistStats = useCallback((next: V4VStats) => {
    setStats(next);
    AsyncStorage.setItem(STATS_KEY, JSON.stringify(next));
  }, []);

  const markSupporter = useCallback(() => {
    setIsSupporter(true);
    AsyncStorage.setItem(SUPPORTER_KEY, "true");
    // Sync to API server (best-effort, no auth required for this endpoint)
    fetch(`${API_BASE}/api/v4v/supporter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  }, []);

  const connectLightning = useCallback(
    async (address: string): Promise<{ ok: boolean; error?: string }> => {
      const trimmed = address.trim().toLowerCase();
      if (!isValidLightningAddress(trimmed)) {
        return { ok: false, error: "Invalid Lightning address format (user@domain.com)" };
      }
      const callback = await resolveLnurl(trimmed);
      if (!callback) {
        return {
          ok: false,
          error: "Could not reach Lightning wallet. Check the address and try again.",
        };
      }
      const walletState: WalletState = { type: "lightning", address: trimmed };
      setWallet(walletState);
      AsyncStorage.setItem(WALLET_KEY, JSON.stringify(walletState));
      return { ok: true };
    },
    [],
  );

  const connectXrpl = useCallback((address: string) => {
    const trimmed = address.trim();
    const walletState: WalletState = { type: "xrpl", address: trimmed };
    setWallet(walletState);
    AsyncStorage.setItem(WALLET_KEY, JSON.stringify(walletState));
  }, []);

  const disconnectWallet = useCallback(() => {
    setWallet(null);
    AsyncStorage.removeItem(WALLET_KEY);
  }, []);

  const sendBoost = useCallback(
    async (params: BoostParams): Promise<boolean> => {
      if (!wallet) return false;
      const { episodeSlug, amountSats, message, splits } = params;

      if (wallet.type === "lightning") {
        // For multi-recipient splits, send proportional amounts to each creator
        // that has a Lightning address. For simplicity, we send to each in turn.
        let anySuccess = false;
        for (const split of splits) {
          if (split.walletType !== "lightning") continue;
          const shareAmountSats = Math.round((amountSats * split.splitPct) / 100);
          if (shareAmountSats < 1) continue;
          try {
            const callback = await resolveLnurl(split.walletAddress);
            if (!callback) continue;
            const invoice = await fetchLightningInvoice(
              callback,
              shareAmountSats * 1000, // msats
              message,
            );
            if (!invoice) continue;
            // Deep-link to the user's Lightning wallet to pay the invoice
            await Linking.openURL(`lightning:${invoice}`);
            anySuccess = true;
          } catch {}
        }
        if (!anySuccess) {
          // Fallback: try to send to the wallet address the listener connected
          try {
            const callback = await resolveLnurl(wallet.address);
            if (callback) {
              const invoice = await fetchLightningInvoice(callback, amountSats * 1000, message);
              if (invoice) {
                await Linking.openURL(`lightning:${invoice}`);
                anySuccess = true;
              }
            }
          } catch {}
        }
        if (anySuccess) {
          const next: V4VStats = {
            ...stats,
            totalSatsSent: stats.totalSatsSent + amountSats,
            episodesBoosted: stats.episodesBoosted.includes(episodeSlug)
              ? stats.episodesBoosted
              : [...stats.episodesBoosted, episodeSlug],
            boostCount: stats.boostCount + 1,
          };
          persistStats(next);
          markSupporter();
        }
        return anySuccess;
      }

      if (wallet.type === "xrpl") {
        // Construct Xaman deep link for XRP payment
        // Xaman uses xumm:// deep links or https://xumm.app/sign/...
        // We target the primary (highest split) XRPL creator
        const xrplSplits = splits.filter((s) => s.walletType === "xrpl");
        const target = xrplSplits.sort((a, b) => b.splitPct - a.splitPct)[0];
        if (!target) return false;
        const xrpAmount = (amountSats / 100000000).toFixed(6); // rough BTC→XRP (for display)
        const txPayload = {
          txjson: {
            TransactionType: "Payment",
            Destination: target.walletAddress,
            Amount: String(Math.round(Number(xrpAmount) * 1000000)), // drops
            Memos: message
              ? [
                  {
                    Memo: {
                      MemoData: Buffer.from(message).toString("hex").toUpperCase(),
                      MemoType: Buffer.from("text/plain").toString("hex").toUpperCase(),
                    },
                  },
                ]
              : undefined,
          },
        };
        const encoded = encodeURIComponent(JSON.stringify(txPayload));
        await Linking.openURL(`https://xumm.app/sign/${encoded}`);
        const next: V4VStats = {
          ...stats,
          totalXrpSent: stats.totalXrpSent + Number(xrpAmount),
          episodesBoosted: stats.episodesBoosted.includes(episodeSlug)
            ? stats.episodesBoosted
            : [...stats.episodesBoosted, episodeSlug],
          boostCount: stats.boostCount + 1,
        };
        persistStats(next);
        markSupporter();
        return true;
      }

      return false;
    },
    [wallet, stats, persistStats, markSupporter],
  );

  const addStreamingSats = useCallback((sats: number) => {
    setStreamingSats((prev) => prev + sats);
  }, []);

  const resetStreamingSats = useCallback(() => {
    setStreamingSats(0);
  }, []);

  const fetchEpisodeSplits = useCallback(
    async (slug: string): Promise<ValueSplit[]> => {
      try {
        const res = await fetch(`${API_BASE}/api/v4v/episode-splits/${encodeURIComponent(slug)}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return [];
        return await res.json();
      } catch {
        return [];
      }
    },
    [],
  );

  return (
    <V4VContext.Provider
      value={{
        wallet,
        isSupporter,
        stats,
        streamingSats,
        connectLightning,
        connectXrpl,
        disconnectWallet,
        sendBoost,
        addStreamingSats,
        resetStreamingSats,
        fetchEpisodeSplits,
      }}
    >
      {children}
    </V4VContext.Provider>
  );
}

export function useV4V() {
  const ctx = useContext(V4VContext);
  if (!ctx) throw new Error("useV4V must be used within V4VProvider");
  return ctx;
}
