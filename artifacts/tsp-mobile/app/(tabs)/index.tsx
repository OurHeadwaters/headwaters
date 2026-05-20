import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useGetFeaturedEpisodes, useGetFeed, useListEpisodes, useGetThisDayEpisodes } from "@workspace/api-client-react";
import type { Episode, ThisDayEpisode } from "@workspace/api-client-react";
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

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ThisDayCard({ episode }: { episode: ThisDayEpisode }) {
  const colors = useColors();
  const { play, seek } = usePlayer();
  const year = new Date(episode.pubDate).getUTCFullYear();

  const handlePlay = async () => {
    if (!episode.audioUrl) return;
    await play({
      slug: episode.slug,
      title: episode.title,
      audioUrl: episode.audioUrl,
      artworkUrl: episode.artworkUrl,
      durationSeconds: episode.durationSeconds,
      episodeNumber: episode.episodeNumber,
    });
    if (episode.historyTimestamp && episode.historyTimestamp > 0) {
      setTimeout(() => {
        seek(episode.historyTimestamp! * 1000);
      }, 800);
    }
  };

  const handlePress = () => {
    router.push(`/episode/${episode.slug}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.thisDayCard,
        { backgroundColor: "rgba(79, 70, 229, 0.25)", borderColor: "rgba(99, 102, 241, 0.3)", opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.thisDayCardTop}>
        <View style={styles.thisDayYearRow}>
          <Text style={[styles.thisDayYear, { color: "#c7d2fe", fontFamily: "DMSans_700Bold" }]}>
            {year}
          </Text>
          {episode.episodeNumber != null && (
            <View style={[styles.thisDayEpBadge, { backgroundColor: "rgba(79, 70, 229, 0.4)", borderColor: "rgba(99, 102, 241, 0.4)" }]}>
              <Text style={[styles.thisDayEpNum, { color: "#a5b4fc", fontFamily: "DMSans_600SemiBold" }]}>
                EP {episode.episodeNumber}
              </Text>
            </View>
          )}
        </View>
        {episode.artworkUrl ? (
          <Image source={{ uri: episode.artworkUrl }} style={styles.thisDayArt} contentFit="cover" />
        ) : null}
      </View>
      <Text style={[styles.thisDayTitle, { color: "#e0e7ff", fontFamily: "DMSans_600SemiBold" }]} numberOfLines={2}>
        {episode.title}
      </Text>
      <Pressable
        onPress={handlePlay}
        style={({ pressed }) => [
          styles.thisDayPlayBtn,
          { backgroundColor: pressed ? "#4338ca" : "#4f46e5" },
        ]}
      >
        <Ionicons name="play" size={11} color="#fff" />
        <Text style={[styles.thisDayPlayText, { color: "#fff", fontFamily: "DMSans_600SemiBold" }]}>
          {episode.historyTimestamp && episode.historyTimestamp > 0
            ? `Play @ ${formatTimestamp(episode.historyTimestamp)}`
            : "Play"}
        </Text>
      </Pressable>
    </Pressable>
  );
}

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
  const { data: thisDayEpisodes, isLoading: thisDayLoading } = useGetThisDayEpisodes();
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

  const todayLabel = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });

  const ListHeader = () => (
    <View>
      {/* This Day in History */}
      <View style={[styles.thisDaySection, { backgroundColor: "#1e1b4b" }]}>
        <View style={styles.thisDaySectionHeader}>
          <View>
            <Text style={[styles.thisDaySectionLabel, { color: "#818cf8", fontFamily: "DMSans_600SemiBold" }]}>
              THIS DAY IN HISTORY
            </Text>
            <Text style={[styles.thisDaySectionDate, { color: "#e0e7ff", fontFamily: "DMSans_700Bold" }]}>
              {todayLabel}
            </Text>
          </View>
        </View>

        {thisDayLoading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thisDayList}>
            {Array.from({ length: 3 }).map((_, i) => (
              <View key={i} style={[styles.thisDayCard, { backgroundColor: "rgba(79, 70, 229, 0.15)", borderColor: "rgba(99, 102, 241, 0.2)" }]} />
            ))}
          </ScrollView>
        ) : !thisDayEpisodes || thisDayEpisodes.length === 0 ? (
          <View style={styles.thisDayEmpty}>
            <Ionicons name="time-outline" size={28} color="#818cf8" />
            <Text style={[styles.thisDayEmptyText, { color: "#818cf8", fontFamily: "DMSans_400Regular" }]}>
              No episodes on this date — check back tomorrow.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thisDayList}
          >
            {thisDayEpisodes.map(ep => (
              <ThisDayCard key={ep.slug} episode={ep} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Hero */}
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
  thisDaySection: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  thisDaySectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  thisDaySectionLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  thisDaySectionDate: {
    fontSize: 22,
    lineHeight: 26,
  },
  thisDayList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  thisDayCard: {
    width: 220,
    minHeight: 130,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  thisDayCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  thisDayYearRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  thisDayYear: {
    fontSize: 20,
    lineHeight: 24,
  },
  thisDayEpBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  thisDayEpNum: {
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  thisDayArt: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  thisDayTitle: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  thisDayPlayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 4,
  },
  thisDayPlayText: {
    fontSize: 11,
  },
  thisDayEmpty: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: "center",
    gap: 8,
  },
  thisDayEmptyText: {
    fontSize: 13,
    textAlign: "center",
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
