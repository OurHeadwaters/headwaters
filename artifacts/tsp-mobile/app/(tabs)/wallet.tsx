import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useV4V } from "@/context/V4VContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { WoodCard } from "@/components/homestead/WoodCard";

export default function WalletScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { wallet, isSupporter, stats, connectLightning, connectXrpl, disconnectWallet } = useV4V();
  const { replayTour } = useOnboarding();

  const [tab, setTab] = useState<"lightning" | "xrpl">("lightning");
  const [lightningInput, setLightningInput] = useState("");
  const [xrplInput, setXrplInput] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const handleConnectLightning = async () => {
    if (!lightningInput.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConnecting(true);
    setConnectError(null);
    const result = await connectLightning(lightningInput);
    setConnecting(false);
    if (result.ok) {
      setLightningInput("");
    } else {
      setConnectError(result.error ?? "Connection failed");
    }
  };

  const handleConnectXrpl = () => {
    const addr = xrplInput.trim();
    if (!addr) return;
    if (!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(addr)) {
      setConnectError("Invalid XRPL address (must start with 'r')");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConnectError(null);
    connectXrpl(addr);
    setXrplInput("");
  };

  const handleConnectXaman = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { await Linking.openURL("https://xumm.app"); } catch {}
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Disconnect Wallet",
      "Remove your connected wallet from this device?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            disconnectWallet();
          },
        },
      ],
    );
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 16, backgroundColor: colors.forestDeep }]}>
        <Text style={[styles.headerTitle, { color: colors.lanternWarm, fontFamily: "Fraunces_700Bold" }]}>
          ⚡ Value Wallet
        </Text>
        <Text style={[styles.headerSub, { color: "rgba(255,255,255,0.7)", fontFamily: "DMSans_400Regular" }]}>
          Support creators you love — pay what you want
        </Text>
        {isSupporter && (
          <View style={[styles.supporterBadge, { backgroundColor: colors.amberGold + "22", borderColor: colors.amberGold + "55" }]}>
            <Text style={[styles.supporterText, { color: colors.amberGold, fontFamily: "DMSans_600SemiBold" }]}>
              ⚡ Supporter
            </Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        {/* Connected wallet */}
        {wallet ? (
          <WoodCard>
            <View style={styles.cardRow}>
              <View style={styles.cardLeft}>
                <Text style={[styles.cardLabel, { color: colors.amberGold, fontFamily: "DMSans_500Medium" }]}>
                  CONNECTED WALLET
                </Text>
                <Text style={[styles.cardValue, { color: colors.foreground, fontFamily: "DMSans_600SemiBold" }]}>
                  {wallet.type === "lightning" ? "⚡ Lightning" : "🔷 XRPL"}
                </Text>
                <Text
                  style={[styles.cardAddress, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}
                  numberOfLines={1}
                >
                  {wallet.address}
                </Text>
              </View>
              <Pressable
                onPress={handleDisconnect}
                style={[styles.disconnectBtn, { borderColor: colors.woodBorder }]}
              >
                <Ionicons name="log-out-outline" size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </WoodCard>
        ) : (
          <WoodCard>
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
              Connect Your Wallet
            </Text>
            <Text style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              Value-for-value is peer-to-peer — your wallet sends payments directly to creators.
              No middlemen, no locked content.
            </Text>

            {/* Tab switcher */}
            <View style={[styles.tabRow, { backgroundColor: colors.muted, borderColor: colors.woodBorder }]}>
              {(["lightning", "xrpl"] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => { setTab(t); setConnectError(null); }}
                  style={[
                    styles.tabBtn,
                    { backgroundColor: tab === t ? colors.primary : "transparent", borderRadius: 8 },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: tab === t ? colors.primaryForeground : colors.mutedForeground,
                        fontFamily: "DMSans_600SemiBold",
                      },
                    ]}
                  >
                    {t === "lightning" ? "⚡ Lightning" : "🔷 XRPL"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {tab === "lightning" ? (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                  Enter your Lightning address (e.g. you@getalby.com)
                </Text>
                <TextInput
                  value={lightningInput}
                  onChangeText={(t) => { setLightningInput(t); setConnectError(null); }}
                  placeholder="you@wallet.domain"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  style={[
                    styles.input,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.muted,
                      borderColor: colors.woodBorder,
                      fontFamily: "DMSans_400Regular",
                    },
                  ]}
                />
                <Pressable
                  onPress={handleConnectLightning}
                  disabled={connecting || !lightningInput.trim()}
                  style={[
                    styles.connectBtn,
                    {
                      backgroundColor: lightningInput.trim() ? colors.amberGold : colors.muted,
                      opacity: connecting ? 0.7 : 1,
                    },
                  ]}
                >
                  {connecting ? (
                    <ActivityIndicator color="#1C1008" />
                  ) : (
                    <Text style={[styles.connectBtnText, {
                      color: lightningInput.trim() ? "#1C1008" : colors.mutedForeground,
                      fontFamily: "DMSans_600SemiBold",
                    }]}>
                      Connect
                    </Text>
                  )}
                </Pressable>
                <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                  Works with Alby, Strike, Wallet of Satoshi, Phoenix, and any Lightning wallet with LNURL support.
                </Text>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                  Paste your XRPL wallet address (starts with r)
                </Text>
                <TextInput
                  value={xrplInput}
                  onChangeText={(t) => { setXrplInput(t); setConnectError(null); }}
                  placeholder="rXXXXXXXXXXXXXXXXXXXXXXX"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.input,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.muted,
                      borderColor: colors.woodBorder,
                      fontFamily: "DMSans_400Regular",
                    },
                  ]}
                />
                <Pressable
                  onPress={handleConnectXrpl}
                  disabled={!xrplInput.trim()}
                  style={[
                    styles.connectBtn,
                    { backgroundColor: xrplInput.trim() ? colors.amberGold : colors.muted },
                  ]}
                >
                  <Text style={[styles.connectBtnText, {
                    color: xrplInput.trim() ? "#1C1008" : colors.mutedForeground,
                    fontFamily: "DMSans_600SemiBold",
                  }]}>
                    Connect Address
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleConnectXaman}
                  style={[styles.xamanBtn, { borderColor: colors.woodBorder }]}
                >
                  <Text style={[styles.xamanText, { color: colors.foreground, fontFamily: "DMSans_500Medium" }]}>
                    🔷 Open Xaman to sign in
                  </Text>
                </Pressable>
                <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                  XRP is decentralized with no central issuer — like Bitcoin, it's a tool for sovereign value transfer.
                </Text>
              </View>
            )}

            {connectError && (
              <Text style={[styles.error, { color: "#ef4444", fontFamily: "DMSans_400Regular" }]}>
                {connectError}
              </Text>
            )}
          </WoodCard>
        )}

        {/* Value Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
            Your Value
          </Text>
          <View style={styles.statsGrid}>
            <StatCard label="Total Sats Sent" value={stats.totalSatsSent.toLocaleString()} icon="flash" colors={colors} />
            <StatCard label="Episodes Boosted" value={String(stats.episodesBoosted.length)} icon="radio" colors={colors} />
            <StatCard label="Boost Count" value={String(stats.boostCount)} icon="heart" colors={colors} />
            {stats.totalXrpSent > 0 && (
              <StatCard label="XRP Sent" value={stats.totalXrpSent.toFixed(4)} icon="diamond" colors={colors} />
            )}
          </View>
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
            How Value-for-Value Works
          </Text>
          <WoodCard>
            {[
              { icon: "🎙️", text: "Jack creates freely available content — no paywalls, ever." },
              { icon: "⚡", text: "You connect your Lightning or XRPL wallet." },
              { icon: "🚀", text: "Hit Boost to send sats directly to creators while you listen." },
              { icon: "📡", text: "Streaming sats flow automatically per minute as you play." },
              { icon: "🔑", text: "Payments are peer-to-peer. The app never touches your funds." },
            ].map((item, i) => (
              <View key={i} style={styles.howRow}>
                <Text style={styles.howIcon}>{item.icon}</Text>
                <Text style={[styles.howText, { color: colors.foreground, fontFamily: "DMSans_400Regular" }]}>
                  {item.text}
                </Text>
              </View>
            ))}
          </WoodCard>
        </View>

        {/* Podcasting 2.0 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
            Podcasting 2.0
          </Text>
          <Text style={[styles.p2pText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
            The Stomping Path is part of the Podcasting 2.0 movement. Open the feed in Fountain, Breez, or Podverse
            to stream sats natively with full V4V support.
          </Text>
          <Pressable
            onPress={() => Linking.openURL("https://podcastindex.org/podcast/thesurvivalpodcast")}
            style={[styles.p2pBtn, { borderColor: colors.woodBorder }]}
          >
            <Text style={[styles.p2pBtnText, { color: colors.primary, fontFamily: "DMSans_500Medium" }]}>
              Open in Fountain / Podverse →
            </Text>
          </Pressable>
        </View>

        {/* About / Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
            About
          </Text>
          <WoodCard>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                replayTour();
              }}
              style={styles.aboutRow}
            >
              <Ionicons name="play-circle-outline" size={20} color={colors.amberGold} />
              <View style={styles.aboutRowText}>
                <Text style={[styles.aboutRowLabel, { color: colors.foreground, fontFamily: "DMSans_600SemiBold" }]}>
                  Replay welcome tour
                </Text>
                <Text style={[styles.aboutRowSub, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                  See the intro again from the beginning
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </Pressable>
          </WoodCard>
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  icon,
  colors,
}: {
  label: string;
  value: string;
  icon: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <WoodCard style={{ flex: 1 }}>
      <View style={{ alignItems: "center", gap: 4 }}>
        <Ionicons name={icon as any} size={20} color={colors.amberGold} />
        <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
          {value}
        </Text>
        <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
          {label}
        </Text>
      </View>
    </WoodCard>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 6,
  },
  headerTitle: { fontSize: 26 },
  headerSub: { fontSize: 14, opacity: 0.85 },
  supporterBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 4,
  },
  supporterText: { fontSize: 13 },
  body: { padding: 16, gap: 14 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardLeft: { flex: 1, gap: 3 },
  cardLabel: { fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8 },
  cardTitle: { fontSize: 18, marginBottom: 6 },
  cardValue: { fontSize: 16 },
  cardAddress: { fontSize: 13 },
  cardBody: { fontSize: 14, lineHeight: 21, marginBottom: 8 },
  disconnectBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  tabRow: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 4,
    gap: 4,
    marginBottom: 6,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabText: { fontSize: 14 },
  inputGroup: { gap: 10 },
  inputLabel: { fontSize: 13, lineHeight: 18 },
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
  },
  connectBtn: {
    borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center",
  },
  connectBtnText: { fontSize: 15 },
  xamanBtn: {
    borderRadius: 12, borderWidth: 1, paddingVertical: 14, alignItems: "center",
  },
  xamanText: { fontSize: 14 },
  hint: { fontSize: 12, lineHeight: 17 },
  error: { fontSize: 13, marginTop: 4 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statValue: { fontSize: 22 },
  statLabel: { fontSize: 11, textAlign: "center" },
  howRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  howIcon: { fontSize: 16, width: 24 },
  howText: { flex: 1, fontSize: 14, lineHeight: 20 },
  p2pText: { fontSize: 14, lineHeight: 20 },
  p2pBtn: {
    borderRadius: 12, borderWidth: 1, paddingVertical: 14, alignItems: "center",
  },
  p2pBtnText: { fontSize: 14 },
  aboutRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  aboutRowText: { flex: 1, gap: 2 },
  aboutRowLabel: { fontSize: 15 },
  aboutRowSub: { fontSize: 12 },
});
