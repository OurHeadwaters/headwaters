import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { usePlayer } from "@/context/PlayerContext";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

const MINI_PLAYER_HEIGHT = 64;

type KitDef = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  transformationSlugs: string[];
  trackSlugs: string[];
  gearCategoryTags: string[];
  externalLinks: { label: string; url: string }[];
};

const KIT_META: Record<string, { emoji: string; accent: string }> = {
  "family-kit":      { emoji: "🏠", accent: "#5D9E6C" },
  "producer-kit":    { emoji: "💼", accent: "#B8860B" },
  "practitioner-kit":{ emoji: "🧭", accent: "#4A7FB5" },
  "council-kit":     { emoji: "🌊", accent: "#3A9AA0" },
  "care-kit":        { emoji: "🌿", accent: "#5E9C76" },
  "digital-kit":     { emoji: "🔒", accent: "#7B5EA7" },
  "physical-kit":    { emoji: "⚡", accent: "#C47A35" },
};

function useKits() {
  return useQuery<KitDef[]>({
    queryKey: ["kits"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/kits`);
      if (!res.ok) throw new Error("Failed to load kits");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });
}

function isExternalKit(kit: KitDef) {
  return kit.transformationSlugs.length === 0 && kit.trackSlugs.length === 0 && kit.externalLinks.length > 0;
}

function KitCard({ kit }: { kit: KitDef }) {
  const colors = useColors();
  const meta = KIT_META[kit.slug] ?? { emoji: "📦", accent: colors.amberGold };
  const external = isExternalKit(kit);

  function handlePress() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/kits/${kit.slug}` as never);
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        cardStyles.outer,
        {
          backgroundColor: colors.woodBorder,
          borderColor: meta.accent + "55",
          opacity: pressed ? 0.87 : 1,
          shadowColor: colors.forestDeep,
        },
      ]}
    >
      <View style={[cardStyles.inner, { backgroundColor: colors.card, borderColor: colors.woodBorder }]}>
        <View style={[cardStyles.accentBar, { backgroundColor: meta.accent }]} />
        <View style={cardStyles.body}>
          <View style={cardStyles.row}>
            <View style={[cardStyles.iconWrap, { backgroundColor: meta.accent + "22" }]}>
              <Text style={cardStyles.emoji}>{meta.emoji}</Text>
            </View>
            <View style={cardStyles.textBlock}>
              <Text style={[cardStyles.name, { color: colors.foreground, fontFamily: "Fraunces_700Bold" }]}>
                {kit.name}
              </Text>
              <Text style={[cardStyles.tagline, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                {kit.tagline}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.woodBorder} />
          </View>

          {external && (
            <View style={[cardStyles.externalBadge, { backgroundColor: meta.accent + "18", borderColor: meta.accent + "44" }]}>
              <Ionicons name="open-outline" size={12} color={meta.accent} />
              <Text style={[cardStyles.externalBadgeText, { color: meta.accent, fontFamily: "DMSans_500Medium" }]}>
                External resource
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  outer: {
    borderRadius: 14,
    borderWidth: 1.5,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 3,
    overflow: "hidden",
  },
  inner: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "row",
  },
  accentBar: {
    width: 4,
    alignSelf: "stretch",
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  emoji: { fontSize: 22 },
  textBlock: { flex: 1, gap: 2 },
  name: { fontSize: 16 },
  tagline: { fontSize: 13, lineHeight: 18 },
  externalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  externalBadgeText: { fontSize: 11 },
});

export default function KitsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentEpisode } = usePlayer();
  const { data: kits, isLoading, error, refetch } = useKits();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = currentEpisode
    ? MINI_PLAYER_HEIGHT + (Platform.OS === "web" ? 84 : 49 + insets.bottom) + 16
    : Platform.OS === "web" ? 84 + 16 : 49 + insets.bottom + 16;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding + 8,
            backgroundColor: colors.forestDeep,
            borderBottomColor: colors.woodBorder,
          },
        ]}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.lanternGlow} />
          </Pressable>
        </View>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.lanternGlow, fontFamily: "Fraunces_700Bold" }]}>
            Kits
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
            Curated bundles for every path to self-reliance
          </Text>
        </View>
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.amberGold} size="large" />
          <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
            Loading kits…
          </Text>
        </View>
      )}

      {error && !isLoading && (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.mutedForeground} />
          <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
            Couldn't load kits
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={[styles.retryBtn, { backgroundColor: colors.amberGold }]}
          >
            <Text style={[styles.retryText, { color: colors.forestDeep, fontFamily: "DMSans_700Bold" }]}>
              Try Again
            </Text>
          </Pressable>
        </View>
      )}

      {kits && (
        <FlatList
          data={kits}
          keyExtractor={(item) => item.slug}
          renderItem={({ item }) => <KitCard kit={item} />}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 2,
    gap: 4,
  },
  headerTitle: { fontSize: 26 },
  headerSub: { fontSize: 13 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  hint: { fontSize: 14, textAlign: "center" },
  retryBtn: {
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  retryText: { fontSize: 15 },
});
