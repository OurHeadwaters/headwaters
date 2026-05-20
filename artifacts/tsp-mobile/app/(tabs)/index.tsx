import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useGetFeaturedEpisodes, useGetFeed, useListEpisodes } from "@workspace/api-client-react";
import type { Episode } from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EpisodeCard } from "@/components/EpisodeCard";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";

const PAGE_SIZE = 20;
const MINI_PLAYER_HEIGHT = 64;

function FeaturedCard({ episode }: { episode: Episode }) {
  const colors = useColors();

  const handlePress = () => {
    router.push(`/episode/${episode.slug}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.featuredCard,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      {episode.artworkUrl ? (
        <Image
          source={{ uri: episode.artworkUrl }}
          style={styles.featuredArt}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.featuredArt, { backgroundColor: colors.primary }]} />
      )}
      <View style={styles.featuredOverlay} />
      <View style={styles.featuredContent}>
        {episode.episodeNumber != null && (
          <Text style={[styles.featuredEpNum, { color: "#fff", fontFamily: "DMSans_600SemiBold" }]}>
            EP {episode.episodeNumber}
          </Text>
        )}
        <Text style={[styles.featuredTitle, { color: "#fff", fontFamily: "DMSans_700Bold" }]} numberOfLines={2}>
          {episode.title}
        </Text>
        <View style={[styles.featuredPlayChip, { backgroundColor: colors.primary }]}>
          <Ionicons name="play" size={12} color="#fff" />
          <Text style={[styles.featuredPlayText, { color: "#fff", fontFamily: "DMSans_500Medium" }]}>
            Play
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentEpisode } = usePlayer();
  const [page, setPage] = useState(0);
  const [allEpisodes, setAllEpisodes] = useState<Episode[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = currentEpisode
    ? MINI_PLAYER_HEIGHT + (Platform.OS === "web" ? 84 : 49 + insets.bottom) + 16
    : Platform.OS === "web" ? 84 + 16 : 49 + insets.bottom + 16;

  const { data: feed } = useGetFeed();
  const { data: featured } = useGetFeaturedEpisodes();
  const { data: episodesPage, isLoading, refetch } = useListEpisodes(
    { limit: PAGE_SIZE, offset: page * PAGE_SIZE }
  );

  React.useEffect(() => {
    if (episodesPage?.items) {
      if (page === 0) {
        setAllEpisodes(episodesPage.items);
      } else {
        setAllEpisodes(prev => {
          const slugs = new Set(prev.map(e => e.slug));
          const newItems = episodesPage.items.filter(e => !slugs.has(e.slug));
          return [...prev, ...newItems];
        });
      }
    }
  }, [episodesPage, page]);

  const loadMore = () => {
    if (episodesPage && allEpisodes.length < episodesPage.total && !isLoading) {
      setPage(prev => prev + 1);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    setAllEpisodes([]);
    await refetch();
    setRefreshing(false);
  };

  const ListHeader = () => (
    <View>
      <View style={[styles.hero, { backgroundColor: colors.primary, paddingTop: topPadding + 16 }]}>
        <View style={styles.heroRow}>
          {feed?.artworkUrl ? (
            <Image source={{ uri: feed.artworkUrl }} style={styles.heroArt} contentFit="cover" />
          ) : (
            <View style={[styles.heroArt, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
          )}
          <View style={styles.heroText}>
            <Text style={[styles.heroLabel, { color: colors.primaryForeground, opacity: 0.7, fontFamily: "DMSans_400Regular" }]}>
              EST. 2008
            </Text>
            <Text style={[styles.heroTitle, { color: colors.primaryForeground, fontFamily: "DMSans_700Bold" }]}>
              {feed?.title ?? "The Survival Podcast"}
            </Text>
            {feed?.totalEpisodes != null && (
              <Text style={[styles.heroSub, { color: colors.primaryForeground, opacity: 0.75, fontFamily: "DMSans_400Regular" }]}>
                {feed.totalEpisodes}+ episodes
              </Text>
            )}
          </View>
        </View>
      </View>

      {featured && featured.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
            Latest
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          >
            {featured.map(ep => (
              <FeaturedCard key={ep.slug} episode={ep} />
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold", marginHorizontal: 16, marginBottom: 8 }]}>
        All Episodes
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={allEpisodes}
        keyExtractor={item => item.slug}
        renderItem={({ item }) => (
          <EpisodeCard
            slug={item.slug}
            title={item.title}
            pubDate={item.pubDate}
            episodeNumber={item.episodeNumber}
            durationSeconds={item.durationSeconds}
            artworkUrl={item.artworkUrl}
            summary={item.summary}
          />
        )}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View style={styles.center}>
              <Ionicons name="radio-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                No episodes found
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          episodesPage && allEpisodes.length < episodesPage.total ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        scrollEnabled={!!(allEpisodes.length > 0 || isLoading)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroArt: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  heroLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 20,
    lineHeight: 24,
  },
  heroSub: {
    fontSize: 12,
  },
  section: {
    paddingTop: 20,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  featuredList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  featuredCard: {
    width: 220,
    height: 140,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
  },
  featuredArt: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  featuredContent: {
    flex: 1,
    padding: 12,
    justifyContent: "flex-end",
    gap: 4,
  },
  featuredEpNum: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  featuredTitle: {
    fontSize: 13,
    lineHeight: 17,
  },
  featuredPlayChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 2,
  },
  featuredPlayText: {
    fontSize: 11,
  },
  center: {
    padding: 40,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
});
