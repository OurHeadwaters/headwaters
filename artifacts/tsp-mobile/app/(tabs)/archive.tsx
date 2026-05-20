import { Ionicons } from "@expo/vector-icons";
import { useListCategories, useListEpisodes } from "@workspace/api-client-react";
import type { Episode } from "@workspace/api-client-react";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
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

const PAGE_SIZE = 20;
const MINI_PLAYER_HEIGHT = 64;

export default function ArchiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentEpisode } = usePlayer();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [allEpisodes, setAllEpisodes] = useState<Episode[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = currentEpisode
    ? MINI_PLAYER_HEIGHT + (Platform.OS === "web" ? 84 : 49 + insets.bottom) + 16
    : Platform.OS === "web" ? 84 + 16 : 49 + insets.bottom + 16;

  const { data: categories } = useListCategories();

  const { data: episodesPage, isLoading, refetch } = useListEpisodes({
    q: debouncedSearch || undefined,
    category: selectedCategory ?? undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

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

  const handleSearchChange = (text: string) => {
    setSearch(text);
    setPage(0);
    setAllEpisodes([]);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 400);
  };

  const handleCategoryPress = (name: string) => {
    setPage(0);
    setAllEpisodes([]);
    setSelectedCategory(prev => (prev === name ? null : name));
  };

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

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedCategory(null);
    setPage(0);
    setAllEpisodes([]);
  };

  const ListHeader = () => (
    <View>
      <View style={[styles.headerSection, { paddingTop: topPadding + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
          Archive
        </Text>
        <View style={[styles.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
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
          contentContainerStyle={styles.categoryList}
        >
          {categories.slice(0, 20).map(cat => (
            <Pressable
              key={cat.name}
              onPress={() => handleCategoryPress(cat.name)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedCategory === cat.name ? colors.primary : colors.muted,
                  borderColor: selectedCategory === cat.name ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: selectedCategory === cat.name ? colors.primaryForeground : colors.foreground,
                    fontFamily: "DMSans_500Medium",
                  },
                ]}
              >
                {cat.name}
              </Text>
              <Text
                style={[
                  styles.categoryCount,
                  {
                    color: selectedCategory === cat.name ? colors.primaryForeground : colors.mutedForeground,
                    fontFamily: "DMSans_400Regular",
                  },
                ]}
              >
                {cat.count}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={[styles.resultRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.resultCount, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
          {episodesPage ? `${episodesPage.total} episodes` : " "}
        </Text>
        {(debouncedSearch || selectedCategory) && (
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
            compact
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
  categoryList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
  },
  categoryCount: {
    fontSize: 11,
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
  resultCount: {
    fontSize: 12,
  },
  clearBtn: {
    paddingVertical: 4,
  },
  clearText: {
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
  emptyHint: {
    fontSize: 13,
  },
});
