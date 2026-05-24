import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WoodCard } from "@/components/homestead/WoodCard";
import { useMobileAuth } from "@/context/MobileAuthContext";
import { useColors } from "@/hooks/useColors";
import { useLifestyleMap } from "@/hooks/useLifestyleMap";

const WEB_MAP_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}/lifestyle-map`;

const ZONE_META: Record<
  string,
  { label: string; emoji: string; description: string }
> = {
  "zone-0": {
    label: "Zone 0 — The Self",
    emoji: "🧠",
    description: "Mindset, money, personal sovereignty, entrepreneurship",
  },
  "zone-1": {
    label: "Zone 1 — The Home",
    emoji: "🏠",
    description: "Food storage, water, emergency planning, community",
  },
  "zone-2": {
    label: "Zone 2 — The Garden",
    emoji: "🌱",
    description: "Gardening, chickens, beekeeping, food production",
  },
  "zone-3": {
    label: "Zone 3 — The Homestead",
    emoji: "🐄",
    description: "Livestock, off-grid systems, alternative energy",
  },
  "zone-4": {
    label: "Zone 4 — The Forest",
    emoji: "🌲",
    description: "Hunting, foraging, bushcraft, wilderness skills",
  },
  "zone-5": {
    label: "Zone 5 — The Wild",
    emoji: "🏕",
    description: "Grid-down survival, bug-out planning, ham radio",
  },
};

const ALL_ZONES = ["zone-0", "zone-1", "zone-2", "zone-3", "zone-4", "zone-5"];

/**
 * Returns the subset of zones a client should see based on their risk profile.
 * Only applied when entryMode === "practitioner" (i.e. Headwaters-placed).
 * riskProfile 1–2 → primary zone only
 * riskProfile 3   → primary + secondary zones
 * riskProfile 4–5 → all zones
 * null / other    → all zones
 */
function visibleZones(
  allZones: string[],
  entryMode: string | null,
  riskProfile: number | null,
  primaryZone: string | null,
  secondaryZone: string | null,
): string[] {
  if (entryMode !== "practitioner" || riskProfile == null) return allZones;
  if (riskProfile <= 2) {
    return primaryZone ? allZones.filter((z) => z === primaryZone) : allZones;
  }
  if (riskProfile === 3) {
    const keep = new Set<string>([
      ...(primaryZone ? [primaryZone] : []),
      ...(secondaryZone ? [secondaryZone] : []),
    ]);
    return allZones.filter((z) => keep.has(z));
  }
  return allZones;
}

function ZoneRow({
  zoneSlug,
  isPrimary,
  isSecondary,
  isVisited,
}: {
  zoneSlug: string;
  isPrimary: boolean;
  isSecondary: boolean;
  isVisited: boolean;
}) {
  const colors = useColors();
  const meta = ZONE_META[zoneSlug];
  if (!meta) return null;

  const bgColor = isPrimary
    ? colors.amberGold + "28"
    : isSecondary
    ? colors.primary + "18"
    : "transparent";

  const borderColor = isPrimary
    ? colors.amberGold
    : isSecondary
    ? colors.primary
    : colors.woodBorder;

  return (
    <View
      style={[
        zoneStyles.row,
        {
          backgroundColor: bgColor,
          borderColor,
          borderWidth: isPrimary || isSecondary ? 1.5 : 1,
        },
      ]}
    >
      <Text style={zoneStyles.emoji}>{meta.emoji}</Text>
      <View style={zoneStyles.textBlock}>
        <View style={zoneStyles.labelRow}>
          <Text
            style={[
              zoneStyles.label,
              {
                color: isPrimary ? colors.amberGold : colors.foreground,
                fontFamily: isPrimary ? "Fraunces_700Bold" : "DMSans_600SemiBold",
              },
            ]}
          >
            {meta.label}
          </Text>
          {isPrimary && (
            <View style={[zoneStyles.badge, { backgroundColor: colors.amberGold + "33" }]}>
              <Text style={[zoneStyles.badgeText, { color: colors.amberGold, fontFamily: "DMSans_600SemiBold" }]}>
                Your Zone
              </Text>
            </View>
          )}
          {isSecondary && !isPrimary && (
            <View style={[zoneStyles.badge, { backgroundColor: colors.primary + "22" }]}>
              <Text style={[zoneStyles.badgeText, { color: colors.primary, fontFamily: "DMSans_600SemiBold" }]}>
                Next Step
              </Text>
            </View>
          )}
          {isVisited && !isPrimary && !isSecondary && (
            <View style={[zoneStyles.badge, { backgroundColor: colors.muted }]}>
              <Text style={[zoneStyles.badgeText, { color: colors.mutedForeground, fontFamily: "DMSans_500Medium" }]}>
                Visited
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[
            zoneStyles.description,
            {
              color: colors.mutedForeground,
              fontFamily: "DMSans_400Regular",
            },
          ]}
        >
          {meta.description}
        </Text>
      </View>
    </View>
  );
}

const zoneStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  emoji: { fontSize: 22, marginTop: 1 },
  textBlock: { flex: 1 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 3,
  },
  label: { fontSize: 15 },
  description: { fontSize: 13, lineHeight: 19 },
  badge: {
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, letterSpacing: 0.2 },
});

function LoadingView() {
  const colors = useColors();
  return (
    <View style={stateStyles.center}>
      <ActivityIndicator color={colors.amberGold} size="large" />
      <Text style={[stateStyles.hint, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
        Loading your map…
      </Text>
    </View>
  );
}

function UnauthenticatedView({ onSignIn }: { onSignIn: () => Promise<void> }) {
  const colors = useColors();
  const [signingIn, setSigningIn] = React.useState(false);

  async function handleSignIn() {
    if (Platform.OS === "web") {
      Linking.openURL(WEB_MAP_URL);
      return;
    }
    setSigningIn(true);
    try {
      await onSignIn();
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <View style={stateStyles.center}>
      <Text style={stateStyles.bigEmoji}>🗺</Text>
      <Text style={[stateStyles.title, { color: colors.foreground, fontFamily: "Fraunces_700Bold" }]}>
        Sign In to See Your Map
      </Text>
      <Text style={[stateStyles.body, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
        {Platform.OS === "web"
          ? "Your Lifestyle Map is tied to your TSP account. Sign in on the website to see your zone."
          : "Your Lifestyle Map is tied to your TSP account. Sign in with Replit to see your zone placement."}
      </Text>
      <Pressable
        onPress={handleSignIn}
        disabled={signingIn}
        style={({ pressed }) => [
          stateStyles.btn,
          {
            backgroundColor: pressed ? colors.amberGold + "cc" : colors.amberGold,
            opacity: signingIn ? 0.7 : 1,
          },
        ]}
      >
        {signingIn ? (
          <ActivityIndicator size="small" color={colors.forestDeep} />
        ) : (
          <Text style={[stateStyles.btnText, { color: colors.forestDeep, fontFamily: "DMSans_700Bold" }]}>
            {Platform.OS === "web" ? "Open on Web" : "Sign In with Replit"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function NoMapView({ onRefresh, refreshing }: { onRefresh: () => void; refreshing: boolean }) {
  const colors = useColors();
  function openWeb() {
    Linking.openURL(WEB_MAP_URL);
  }
  return (
    <ScrollView
      contentContainerStyle={stateStyles.center}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.amberGold}
        />
      }
    >
      <Text style={stateStyles.bigEmoji}>🌿</Text>
      <Text style={[stateStyles.title, { color: colors.foreground, fontFamily: "Fraunces_700Bold" }]}>
        No Map Yet
      </Text>
      <Text style={[stateStyles.body, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
        You haven't completed the Lifestyle Map questionnaire yet. Head to the website to find your starting zone.
      </Text>
      <Pressable
        onPress={openWeb}
        style={({ pressed }) => [
          stateStyles.btn,
          { backgroundColor: pressed ? colors.amberGold + "cc" : colors.amberGold },
        ]}
      >
        <Text style={[stateStyles.btnText, { color: colors.forestDeep, fontFamily: "DMSans_700Bold" }]}>
          Start Questionnaire on Web
        </Text>
      </Pressable>
      <Text style={[stateStyles.hint, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
        Pull down to refresh after completing it
      </Text>
    </ScrollView>
  );
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  const colors = useColors();
  return (
    <View style={stateStyles.center}>
      <Text style={stateStyles.bigEmoji}>⚠️</Text>
      <Text style={[stateStyles.title, { color: colors.foreground, fontFamily: "Fraunces_700Bold" }]}>
        Couldn't Load Map
      </Text>
      <Text style={[stateStyles.body, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [
          stateStyles.btn,
          { backgroundColor: pressed ? colors.primary + "cc" : colors.primary },
        ]}
      >
        <Text style={[stateStyles.btnText, { color: colors.primaryForeground, fontFamily: "DMSans_700Bold" }]}>
          Try Again
        </Text>
      </Pressable>
    </View>
  );
}

const stateStyles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  bigEmoji: { fontSize: 52, marginBottom: 4 },
  title: { fontSize: 22, textAlign: "center" },
  body: { fontSize: 15, lineHeight: 22, textAlign: "center" },
  btn: {
    marginTop: 8,
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { fontSize: 15 },
  hint: { fontSize: 13, textAlign: "center", marginTop: 4 },
});

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, signIn } = useMobileAuth();
  const { state, refetch } = useLifestyleMap();
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    refetch();
  }, [isAuthenticated, refetch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const primaryZone = state.status === "ready" ? (state.map.primaryZone ?? null) : null;
  const secondaryZone = state.status === "ready" ? (state.map.secondaryZone ?? null) : null;
  const visitedZones = state.status === "ready" ? (state.map.visitedZones ?? []) : [];
  const rationale = state.status === "ready" ? state.map.rationale : null;
  const entryMode = state.status === "ready" ? state.map.entryMode : null;
  const riskProfile = state.status === "ready" ? (state.map.riskProfile ?? null) : null;
  const createdAt = state.status === "ready" ? state.map.createdAt : null;

  const shownZones = visibleZones(ALL_ZONES, entryMode, riskProfile, primaryZone, secondaryZone);

  return (
    <View style={[screenStyles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          screenStyles.header,
          {
            paddingTop: insets.top + 12,
            backgroundColor: colors.forestDeep,
            borderBottomColor: colors.woodBorder,
          },
        ]}
      >
        <Text style={[screenStyles.headerTitle, { color: colors.lanternGlow, fontFamily: "Fraunces_700Bold" }]}>
          Lifestyle Map
        </Text>
        <Text style={[screenStyles.headerSub, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
          Your zone on the path to self-reliance
        </Text>
      </View>

      {state.status === "loading" && <LoadingView />}
      {state.status === "unauthenticated" && <UnauthenticatedView onSignIn={signIn} />}
      {state.status === "no_map" && (
        <NoMapView onRefresh={onRefresh} refreshing={refreshing} />
      )}
      {state.status === "error" && (
        <ErrorView message={state.message} onRetry={refetch} />
      )}

      {state.status === "ready" && (
        <ScrollView
          contentContainerStyle={[
            screenStyles.scrollContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.amberGold}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {primaryZone && (
            <WoodCard style={screenStyles.primaryCard}>
              <View style={screenStyles.primaryRow}>
                <Text style={screenStyles.primaryEmoji}>
                  {ZONE_META[primaryZone]?.emoji ?? "🌿"}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      screenStyles.primaryZoneLabel,
                      { color: colors.amberGold, fontFamily: "Fraunces_700Bold" },
                    ]}
                  >
                    {ZONE_META[primaryZone]?.label ?? primaryZone}
                  </Text>
                  <Text
                    style={[
                      screenStyles.primaryZoneSub,
                      { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" },
                    ]}
                  >
                    Your primary zone
                    {entryMode === "guided" ? " · Guided assessment" : " · Self-selected"}
                  </Text>
                </View>
              </View>

              {rationale ? (
                <View
                  style={[
                    screenStyles.rationaleBox,
                    { backgroundColor: colors.fieldNote, borderColor: colors.fieldNoteBorder },
                  ]}
                >
                  <Text
                    style={[
                      screenStyles.rationaleLabel,
                      { color: colors.mutedForeground, fontFamily: "DMSans_600SemiBold" },
                    ]}
                  >
                    Rationale
                  </Text>
                  <Text
                    style={[
                      screenStyles.rationaleText,
                      { color: colors.foreground, fontFamily: "DMSans_400Regular" },
                    ]}
                  >
                    {rationale}
                  </Text>
                  {createdAt != null && (
                    <View style={[screenStyles.sessionDateRow, { borderTopColor: colors.fieldNoteBorder }]}>
                      <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} style={{ marginRight: 5 }} />
                      <Text style={[screenStyles.sessionDateLabel, { color: colors.mutedForeground, fontFamily: "DMSans_500Medium" }]}>
                        Session date:{" "}
                      </Text>
                      <Text style={[screenStyles.sessionDateValue, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                        {new Date(createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}
            </WoodCard>
          )}

          <View style={screenStyles.zonesHeadingRow}>
            <Text
              style={[
                screenStyles.sectionHeading,
                { color: colors.mutedForeground, fontFamily: "DMSans_600SemiBold" },
              ]}
            >
              {entryMode === "practitioner" && shownZones.length < ALL_ZONES.length
                ? "Your Curated Zones"
                : "All Zones"}
            </Text>
            {entryMode === "practitioner" && (
              <View style={[screenStyles.hwPerkBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "33" }]}>
                <Text style={[screenStyles.hwPerkText, { color: colors.primary, fontFamily: "DMSans_600SemiBold" }]}>
                  💧 Headwaters Member
                </Text>
              </View>
            )}
          </View>

          {shownZones.map((slug) => (
            <ZoneRow
              key={slug}
              zoneSlug={slug}
              isPrimary={slug === primaryZone}
              isSecondary={slug === secondaryZone}
              isVisited={visitedZones.includes(slug)}
            />
          ))}

          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/kits" as never);
            }}
            style={({ pressed }) => [
              screenStyles.kitsCard,
              {
                backgroundColor: pressed ? colors.amberGold + "22" : colors.amberGold + "14",
                borderColor: colors.amberGold + "55",
              },
            ]}
          >
            <View style={screenStyles.kitsCardRow}>
              <Text style={screenStyles.kitsEmoji}>📦</Text>
              <View style={screenStyles.kitsTextBlock}>
                <Text style={[screenStyles.kitsTitle, { color: colors.amberGold, fontFamily: "Fraunces_700Bold" }]}>
                  Explore Kits
                </Text>
                <Text style={[screenStyles.kitsSub, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                  Curated bundles for every path to self-reliance
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.amberGold + "99"} />
            </View>
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL(WEB_MAP_URL)}
            style={({ pressed }) => [
              screenStyles.webLink,
              {
                backgroundColor: colors.muted,
                borderColor: colors.woodBorder,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text
              style={[
                screenStyles.webLinkText,
                { color: colors.mutedForeground, fontFamily: "DMSans_500Medium" },
              ]}
            >
              Update your map or redo the questionnaire on the web
            </Text>
            <Feather name="external-link" size={14} color={colors.mutedForeground} />
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const screenStyles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 26, marginBottom: 2 },
  headerSub: { fontSize: 13 },
  scrollContent: { padding: 16 },
  primaryCard: { marginBottom: 20 },
  primaryRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 },
  primaryEmoji: { fontSize: 36 },
  primaryZoneLabel: { fontSize: 18, marginBottom: 2 },
  primaryZoneSub: { fontSize: 12 },
  rationaleBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  rationaleLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  rationaleText: { fontSize: 14, lineHeight: 21 },
  sessionDateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sessionDateLabel: { fontSize: 12 },
  sessionDateValue: { fontSize: 12 },
  zonesHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 4,
    flexWrap: "wrap",
    gap: 6,
  },
  sectionHeading: {
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  hwPerkBadge: {
    borderRadius: 5,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  hwPerkText: { fontSize: 11, letterSpacing: 0.2 },
  webLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  webLinkText: { fontSize: 13 },
  kitsCard: {
    borderRadius: 10,
    borderWidth: 1.5,
    marginTop: 16,
    overflow: "hidden",
  },
  kitsCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  kitsEmoji: { fontSize: 22 },
  kitsTextBlock: { flex: 1, gap: 2 },
  kitsTitle: { fontSize: 15 },
  kitsSub: { fontSize: 12 },
});
