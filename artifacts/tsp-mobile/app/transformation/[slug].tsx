import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
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

import { EpisodeCard } from "@/components/EpisodeCard";
import { usePlayer } from "@/context/PlayerContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useTrackProgress } from "@/hooks/useTrackProgress";

type TransformationDef = {
  slug: string;
  from: string;
  to: string;
  description: string;
  color: string;
  icon: string;
  tags: string[];
  categories: string[];
};

type TransformationEpisode = {
  id: number;
  source: string;
  kind: string;
  slug: string;
  title: string;
  link: string;
  summary: string | null;
  pubDate: string;
  episodeNumber: number | null;
  durationSeconds: number | null;
  audioUrl: string | null;
  audioType: string | null;
  artworkUrl: string | null;
  categories: string[];
  tags: string[];
};

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

function useTransformation(slug: string) {
  return useQuery<TransformationDef>({
    queryKey: ["transformations", slug],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/transformations/${slug}`);
      if (!res.ok) throw new Error("Transformation not found");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!slug,
  });
}

function useTransformationEpisodes(slug: string, page: number, enabled: boolean) {
  const limit = 20;
  const offset = page * limit;
  return useQuery<{ items: TransformationEpisode[]; total: number }>({
    queryKey: ["transformation-episodes", slug, page],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/transformations/${encodeURIComponent(slug)}/episodes?limit=${limit}&offset=${offset}`,
      );
      if (!res.ok) throw new Error("Episodes not found");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!slug && enabled,
  });
}

const PAGE_SIZE = 20;
const MINI_PLAYER_HEIGHT = 64;

export default function TransformationScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentEpisode } = usePlayer();
  const { isAuthenticated, login, isLoading: authLoading } = useAuth();

  const [page, setPage] = useState(0);
  const [allEpisodes, setAllEpisodes] = useState<TransformationEpisode[]>([]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = currentEpisode
    ? MINI_PLAYER_HEIGHT + (Platform.OS === "web" ? 84 : 49 + insets.bottom) + 16
    : Platform.OS === "web" ? 84 + 16 : 49 + insets.bottom + 16;

  const { data: transformation, isLoading: tLoading } = useTransformation(slug ?? "");
  const { data: episodesPage, isLoading: epLoading } = useTransformationEpisodes(
    slug ?? "",
    page,
    !!transformation,
  );

  const progress = useTrackProgress(slug ?? "");

  React.useEffect(() => {
    if (!episodesPage?.items) return;
    if (page === 0) {
      setAllEpisodes(episodesPage.items);
    } else {
      setAllEpisodes((prev) => {
        const slugs = new Set(prev.map((e) => e.slug));
        const newItems = episodesPage.items.filter((e) => !slugs.has(e.slug));
        return [...prev, ...newItems];
      });
    }
  }, [episodesPage, page]);

  React.useEffect(() => {
    setPage(0);
    setAllEpisodes([]);
  }, [slug]);

  const loadMore = () => {
    if (episodesPage && allEpisodes.length < episodesPage.total && !epLoading) {
      setPage((prev) => prev + 1);
    }
  };

  const isLoading = tLoading || (epLoading && allEpisodes.length === 0);

  const doneCount = progress.doneCount;
  const totalCount = episodesPage?.total ?? 0;

  const ListHeader = () => (
    <View
      style={[
        styles.header,
        {
          paddingTop: topPadding + 8,
          backgroundColor: transformation ? transformation.color + "18" : colors.muted,
        },
      ]}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={transformation?.color ?? colors.foreground} />
        </Pressable>
      </View>
      {transformation && (
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>{transformation.icon}</Text>
          <Text
            style={[
              styles.fromTo,
              { color: transformation.color, fontFamily: "DMSans_700Bold" },
            ]}
          >
            {transformation.from} → {transformation.to}
          </Text>
          {transformation.description ? (
            <Text
              style={[
                styles.description,
                { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" },
              ]}
            >
              {transformation.description}
            </Text>
          ) : null}
          <View style={[styles.divider, { backgroundColor: transformation.color + "30" }]} />
          <View style={styles.statsRow}>
            <Text
              style={[
                styles.episodeCount,
                { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" },
              ]}
            >
              {totalCount > 0 ? `${totalCount} episodes` : " "}
            </Text>
            {doneCount > 0 && totalCount > 0 && (
              <Text
                style={[
                  styles.progressLabel,
                  { color: transformation.color, fontFamily: "DMSans_700Bold" },
                ]}
              >
                {doneCount}/{totalCount} done
              </Text>
            )}
          </View>
          {!authLoading && !isAuthenticated && (
            <Pressable
              onPress={login}
              style={[styles.loginBtn, { borderColor: transformation.color + "60" }]}
            >
              <Ionicons name="sync-outline" size={14} color={transformation.color} />
              <Text
                style={[
                  styles.loginBtnText,
                  { color: transformation.color, fontFamily: "DMSans_500Medium" },
                ]}
              >
                Sign in to sync progress
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={allEpisodes}
        keyExtractor={(item) => item.slug}
        renderItem={({ item }) => {
          const done = progress.isDone(item.id);
          return (
            <View style={styles.episodeRow}>
              <View style={styles.episodeCardWrap}>
                <EpisodeCard
                  slug={item.slug}
                  title={item.title}
                  pubDate={item.pubDate ?? undefined}
                  episodeNumber={item.episodeNumber ?? undefined}
                  durationSeconds={item.durationSeconds ?? undefined}
                  artworkUrl={item.artworkUrl}
                  summary={item.summary ?? undefined}
                  compact
                />
              </View>
              <Pressable
                onPress={() => progress.toggleDone(item.id)}
                style={styles.doneBtn}
                accessibilityLabel={done ? "Mark episode not done" : "Mark episode done"}
              >
                <Ionicons
                  name={done ? "checkmark-circle" : "checkmark-circle-outline"}
                  size={28}
                  color={done ? (transformation?.color ?? colors.primary) : colors.mutedForeground}
                />
              </Pressable>
            </View>
          );
        }}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={transformation?.color ?? colors.primary} />
            </View>
          ) : (
            <View style={styles.center}>
              <Ionicons name="albums-outline" size={40} color={colors.mutedForeground} />
              <Text
                style={[
                  styles.emptyText,
                  { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" },
                ]}
              >
                No episodes found
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          episodesPage && allEpisodes.length < episodesPage.total ? (
            <View style={styles.center}>
              <ActivityIndicator color={transformation?.color ?? colors.primary} />
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
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
    paddingTop: 4,
    gap: 8,
  },
  headerIcon: {
    fontSize: 32,
  },
  fromTo: {
    fontSize: 22,
    lineHeight: 30,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  episodeCount: {
    fontSize: 12,
  },
  progressLabel: {
    fontSize: 12,
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 20,
    marginTop: 4,
  },
  loginBtnText: {
    fontSize: 12,
  },
  center: {
    padding: 40,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
  },
  episodeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  episodeCardWrap: {
    flex: 1,
  },
  doneBtn: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 8,
  },
});
