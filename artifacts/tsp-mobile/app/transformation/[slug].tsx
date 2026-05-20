import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useListEpisodes } from "@workspace/api-client-react";
import type { Episode } from "@workspace/api-client-react";
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
import { useColors } from "@/hooks/useColors";

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

const PAGE_SIZE = 20;
const MINI_PLAYER_HEIGHT = 64;

export default function TransformationScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentEpisode } = usePlayer();

  const [page, setPage] = useState(0);
  const [allEpisodes, setAllEpisodes] = useState<Episode[]>([]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = currentEpisode
    ? MINI_PLAYER_HEIGHT + (Platform.OS === "web" ? 84 : 49 + insets.bottom) + 16
    : Platform.OS === "web" ? 84 + 16 : 49 + insets.bottom + 16;

  const { data: transformation, isLoading: tLoading } = useTransformation(slug ?? "");

  const firstCategory = transformation?.categories?.[0] ?? "";

  const { data: episodesPage, isLoading: epLoading } = useListEpisodes({
    category: firstCategory || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  React.useEffect(() => {
    if (!firstCategory) return;
    if (episodesPage?.items) {
      if (page === 0) {
        setAllEpisodes(episodesPage.items);
      } else {
        setAllEpisodes((prev) => {
          const slugs = new Set(prev.map((e) => e.slug));
          const newItems = episodesPage.items.filter((e) => !slugs.has(e.slug));
          return [...prev, ...newItems];
        });
      }
    }
  }, [episodesPage, page, firstCategory]);

  React.useEffect(() => {
    setPage(0);
    setAllEpisodes([]);
  }, [firstCategory]);

  const loadMore = () => {
    if (episodesPage && allEpisodes.length < episodesPage.total && !epLoading) {
      setPage((prev) => prev + 1);
    }
  };

  const isLoading = tLoading || (epLoading && allEpisodes.length === 0);

  const ListHeader = () => (
    <View
      style={[
        styles.header,
        { paddingTop: topPadding + 8, backgroundColor: transformation ? transformation.color + "18" : colors.muted },
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
          <Text style={[styles.fromTo, { color: transformation.color, fontFamily: "DMSans_700Bold" }]}>
            {transformation.from} → {transformation.to}
          </Text>
          {transformation.description ? (
            <Text style={[styles.description, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              {transformation.description}
            </Text>
          ) : null}
          <View style={[styles.divider, { backgroundColor: transformation.color + "30" }]} />
          <Text style={[styles.episodeCount, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
            {episodesPage ? `${episodesPage.total} episodes` : " "}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={allEpisodes}
        keyExtractor={(item) => item.slug}
        renderItem={({ item }) => (
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
        )}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={transformation?.color ?? colors.primary} />
            </View>
          ) : (
            <View style={styles.center}>
              <Ionicons name="albums-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
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
  episodeCount: {
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
});
