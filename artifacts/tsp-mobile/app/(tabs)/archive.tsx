import { Ionicons } from "@expo/vector-icons";
import {
  useListCategories,
  useListEpisodes,
  getListEpisodesQueryKey,
  useListSeries,
  getListSeriesQueryKey,
  useSearchLibrary,
  getSearchLibraryQueryKey,
} from "@workspace/api-client-react";
import type { Episode, LibraryItem, SeriesSummary } from "@workspace/api-client-react";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EpisodeCard } from "@/components/EpisodeCard";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";
import { usePulseAnimation } from "@/hooks/usePulseAnimation";

const PAGE_SIZE = 20;
const MINI_PLAYER_HEIGHT = 64;

type CardItem = {
  slug: string;
  title: string;
  pubDate?: string;
  episodeNumber?: number | null;
  durationSeconds?: number | null;
  artworkUrl?: string | null;
  summary?: string;
};

function episodeToCard(e: Episode): CardItem {
  return {
    slug: e.slug,
    title: e.title,
    pubDate: e.pubDate,
    episodeNumber: e.episodeNumber,
    durationSeconds: e.durationSeconds,
    artworkUrl: e.artworkUrl,
    summary: e.summary,
  };
}

function libraryItemToCard(item: LibraryItem): CardItem {
  return {
    slug: item.slug,
    title: item.title,
    pubDate: item.publishedAt,
    episodeNumber: item.episodeNumber ?? null,
    durationSeconds: item.durationSeconds ?? null,
    artworkUrl: item.artworkUrl ?? null,
    summary: item.summary ?? undefined,
  };
}

export default function ArchiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentEpisode } = usePlayer();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [allItems, setAllItems] = useState<CardItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = currentEpisode
    ? MINI_PLAYER_HEIGHT + (Platform.OS === "web" ? 84 : 49 + insets.bottom) + 16
    : Platform.OS === "web" ? 84 + 16 : 49 + insets.bottom + 16;

  const { data: categories } = useListCategories();
  const { data: seriesList } = useListSeries(undefined, {
    query: { queryKey: getListSeriesQueryKey() },
  });

  const listEpisodesParams = {
    q: debouncedSearch || undefined,
    category: selectedCategory ?? undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  };

  const searchLibraryParams = {
    q: debouncedSearch || undefined,
    category: selectedCategory ?? undefined,
    series: selectedSeries ?? undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  };

  const { data: episodesPage, isLoading: listLoading, refetch: refetchList } = useListEpisodes(
    listEpisodesParams,
    { query: { enabled: !selectedSeries, queryKey: getListEpisodesQueryKey(listEpisodesParams) } },
  );

  const { data: searchPage, isLoading: searchLoading, refetch: refetchSearch } = useSearchLibrary(
    searchLibraryParams,
    { query: { enabled: !!selectedSeries, queryKey: getSearchLibraryQueryKey(searchLibraryParams) } },
  );

  const isLoading = selectedSeries ? searchLoading : listLoading;
  const totalItems = selectedSeries ? (searchPage?.total ?? 0) : (episodesPage?.total ?? 0);
  const archiveSkeletonOpacity = usePulseAnimation(isLoading && allItems.length === 0);

  React.useEffect(() => {
    if (!selectedSeries && episodesPage?.items) {
      if (page === 0) {
        setAllItems(episodesPage.items.map(episodeToCard));
      } else {
        setAllItems(prev => {
          const slugs = new Set(prev.map(e => e.slug));
          const newItems = episodesPage.items
            .filter(e => !slugs.has(e.slug))
            .map(episodeToCard);
          return [...prev, ...newItems];
        });
      }
    }
  }, [episodesPage, page, selectedSeries]);

  React.useEffect(() => {
    if (selectedSeries && searchPage?.items) {
      if (page === 0) {
        setAllItems(searchPage.items.map(libraryItemToCard));
      } else {
        setAllItems(prev => {
          const slugs = new Set(prev.map(e => e.slug));
          const newItems = searchPage.items
            .filter(e => !slugs.has(e.slug))
            .map(libraryItemToCard);
          return [...prev, ...newItems];
        });
      }
    }
  }, [searchPage, page, selectedSeries]);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    setPage(0);
    setAllItems([]);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 400);
  };

  const handleCategoryPress = (name: string) => {
    setPage(0);
    setAllItems([]);
    setSelectedCategory(prev => (prev === name ? null : name));
  };

  const handleSeriesPress = (slug: string) => {
    setPage(0);
    setAllItems([]);
    setSelectedSeries(prev => (prev === slug ? null : slug));
  };

  const loadMore = () => {
    if (allItems.length < totalItems && !isLoading) {
      setPage(prev => prev + 1);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    setAllItems([]);
    if (selectedSeries) {
      await refetchSearch();
    } else {
      await refetchList();
    }
    setRefreshing(false);
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedCategory(null);
    setSelectedSeries(null);
    setPage(0);
    setAllItems([]);
  };

  const hasFilters = !!(debouncedSearch || selectedCategory || selectedSeries);

  const selectedSeriesInfo = selectedSeries
    ? seriesList?.find((s: SeriesSummary) => s.slug === selectedSeries)
    : null;

  const ListHeader = () => (
    <View>
      <View style={[styles.headerSection, { paddingTop: topPadding + 16, backgroundColor: colors.background }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Fraunces_700Bold" }]}>
            Archive
          </Text>
        </View>
        <View style={[styles.searchBar, { backgroundColor: colors.muted, borderColor: colors.woodBorder }]}>
          <Ionicons name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            testID="archive-search"
            value={search}
            onChangeText={handleSearchChange}
            placeholder="Search episodes…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground, fontFamily: "DMSans_400Regular" }]}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {search.length > 0 && Platform.OS !== "ios" && (
            <Pressable onPress={() => handleSearchChange("")}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {categories && categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={styles.chipList}
        >
          {categories.slice(0, 20).map(cat => {
            const active = selectedCategory === cat.name;
            return (
              <Pressable
                key={cat.name}
                onPress={() => handleCategoryPress(cat.name)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.woodBrown : colors.muted,
                    borderColor: active ? colors.woodBrown : colors.woodBorder,
                  },
                ]}
              >
                <View style={styles.chipHeader}>
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: active ? "#fff" : colors.foreground,
                        fontFamily: "DMSans_500Medium",
                        flex: 1,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                  <Text
                    style={[
                      styles.chipCount,
                      {
                        color: active ? "rgba(255,255,255,0.8)" : colors.mutedForeground,
                        fontFamily: "DMSans_400Regular",
                      },
                    ]}
                  >
                    {cat.count}
                  </Text>
                </View>
                {cat.description ? (
                  <Text
                    style={[
                      styles.chipDescription,
                      {
                        color: active ? colors.primaryForeground + "cc" : colors.mutedForeground,
                        fontFamily: "DMSans_400Regular",
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {cat.description}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {seriesList && seriesList.length > 0 && (
        <>
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.mutedForeground, fontFamily: "DMSans_500Medium", backgroundColor: colors.background },
            ]}
          >
            Series
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ backgroundColor: colors.background }}
            contentContainerStyle={styles.chipList}
          >
            {seriesList.map((s: SeriesSummary) => {
              const active = selectedSeries === s.slug;
              return (
                <Pressable
                  key={s.slug}
                  onPress={() => handleSeriesPress(s.slug)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.woodBrown : colors.muted,
                      borderColor: active ? colors.woodBrown : colors.woodBorder,
                    },
                  ]}
                >
                  <View style={styles.chipHeader}>
                    <Text style={styles.chipEmoji}>{s.iconEmoji}</Text>
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: active ? "#fff" : colors.foreground,
                          fontFamily: "DMSans_500Medium",
                          flex: 1,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {s.title}
                    </Text>
                    <Text
                      style={[
                        styles.chipCount,
                        {
                          color: active ? "rgba(255,255,255,0.8)" : colors.mutedForeground,
                          fontFamily: "DMSans_400Regular",
                        },
                      ]}
                    >
                      {s.episodeCount}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      )}

      <View style={[styles.resultRow, { borderBottomColor: colors.border }]}>
        <View style={styles.resultLeft}>
          <Text style={[styles.resultCount, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
            {totalItems > 0 || !isLoading ? `${totalItems} episodes` : " "}
          </Text>
          {selectedSeriesInfo && (
            <View style={[styles.seriesBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
              <Text style={[styles.seriesBadgeText, { color: colors.primary, fontFamily: "DMSans_500Medium" }]}>
                {selectedSeriesInfo.iconEmoji} {selectedSeriesInfo.title}
              </Text>
            </View>
          )}
        </View>
        {hasFilters && (
          <Pressable onPress={clearFilters} style={styles.clearBtn}>
            <Text style={[styles.clearText, { color: colors.primary, fontFamily: "DMSans_500Medium" }]}>
              Clear filters
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={allItems}
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
            compact
          />
        )}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={
          isLoading ? (
            <Animated.View style={{ opacity: archiveSkeletonOpacity }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <View key={i} style={[styles.skeletonOuter, { borderColor: colors.woodBorder, backgroundColor: colors.woodBorder }]}>
                  <View style={[styles.skeletonInner, { backgroundColor: colors.card, borderColor: colors.woodBorder }]}>
                    <View style={[styles.skeletonArt, { backgroundColor: colors.muted }]} />
                    <View style={styles.skeletonContent}>
                      <View style={[styles.skeletonMeta, { backgroundColor: colors.muted }]} />
                      <View style={[styles.skeletonTitle1, { backgroundColor: colors.muted }]} />
                      <View style={[styles.skeletonTitle2, { backgroundColor: colors.muted }]} />
                      <View style={[styles.skeletonFooter, { backgroundColor: colors.muted }]} />
                    </View>
                  </View>
                </View>
              ))}
            </Animated.View>
          ) : (
            <View style={styles.center}>
              <Ionicons name="albums-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                No episodes found
              </Text>
              <Text style={[styles.emptyHint, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                Try a different search or filter
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          allItems.length < totalItems ? (
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
        scrollEnabled={!!(allItems.length > 0 || isLoading)}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 2,
  },
  chipList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    flexDirection: "column",
    width: 160,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  chipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipEmoji: {
    fontSize: 13,
  },
  chipText: {
    fontSize: 12,
  },
  chipCount: {
    fontSize: 11,
  },
  chipDescription: {
    fontSize: 11,
    lineHeight: 15,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  resultLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  resultCount: {
    fontSize: 12,
  },
  seriesBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  seriesBadgeText: {
    fontSize: 11,
  },
  clearBtn: {
    paddingVertical: 4,
    paddingLeft: 8,
  },
  clearText: {
    fontSize: 12,
  },
  skeletonOuter: {
    borderRadius: 14,
    borderWidth: 2,
    marginHorizontal: 16,
    marginBottom: 10,
    overflow: "hidden",
  },
  skeletonInner: {
    borderRadius: 11,
    borderWidth: 1,
    overflow: "hidden",
    padding: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  skeletonArt: {
    width: 56,
    height: 56,
    borderRadius: 6,
    flexShrink: 0,
  },
  skeletonContent: {
    flex: 1,
    gap: 6,
  },
  skeletonMeta: {
    width: "40%",
    height: 10,
    borderRadius: 5,
  },
  skeletonTitle1: {
    width: "90%",
    height: 12,
    borderRadius: 5,
  },
  skeletonTitle2: {
    width: "70%",
    height: 12,
    borderRadius: 5,
  },
  skeletonFooter: {
    width: "20%",
    height: 10,
    borderRadius: 5,
    marginTop: 2,
  },
  center: {
    padding: 40,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
  },
  emptyHint: {
    fontSize: 13,
  },
});
