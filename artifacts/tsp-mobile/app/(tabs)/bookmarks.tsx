import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useHistory, type BookmarkEntry } from "@/context/HistoryContext";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";

const MINI_PLAYER_HEIGHT = 64;

function BookmarkItem({ item }: { item: BookmarkEntry }) {
  const colors = useColors();
  const { play, currentEpisode, isPlaying, pause, resume } = usePlayer();

  const isThisEpisode = currentEpisode?.slug === item.slug;

  const handlePlay = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isThisEpisode) {
      if (isPlaying) await pause();
      else await resume();
    } else {
      await play({
        slug: item.slug, title: item.title, audioUrl: null,
        artworkUrl: item.artworkUrl, episodeNumber: item.episodeNumber, durationSeconds: item.durationSeconds,
      });
    }
  };

  return (
    <Pressable
      onPress={() => router.push(`/episode/${item.slug}`)}
      style={({ pressed }) => [
        styles.item,
        { borderBottomColor: colors.woodBorder, backgroundColor: pressed ? colors.muted : "transparent" },
      ]}
    >
      <View style={styles.itemInner}>
        {item.artworkUrl ? (
          <Image source={{ uri: item.artworkUrl }} style={styles.artwork} contentFit="cover" />
        ) : (
          <View style={[styles.artwork, { backgroundColor: colors.forestMid, alignItems: "center", justifyContent: "center" }]}>
            <Ionicons name="radio" size={20} color={colors.amberGold} />
          </View>
        )}

        <View style={styles.meta}>
          {item.episodeNumber != null && (
            <Text style={[styles.epNum, { color: colors.amberGold, fontFamily: "DMSans_600SemiBold" }]}>
              EP {item.episodeNumber}
            </Text>
          )}
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "DMSans_600SemiBold" }]} numberOfLines={2}>
            {item.title}
          </Text>
        </View>

        <Pressable
          onPress={handlePlay}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.playBtn, { backgroundColor: colors.amberGold }]}
        >
          <Ionicons
            name={isThisEpisode && isPlaying ? "pause" : "play"}
            size={18}
            color="#1C1008"
            style={{ marginLeft: isThisEpisode && isPlaying ? 0 : 2 }}
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function BookmarksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bookmarks } = useHistory();
  const { currentEpisode } = usePlayer();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = currentEpisode
    ? MINI_PLAYER_HEIGHT + (Platform.OS === "web" ? 84 : 49 + insets.bottom) + 16
    : Platform.OS === "web" ? 84 + 16 : 49 + insets.bottom + 16;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.slug}
        renderItem={({ item }) => <BookmarkItem item={item} />}
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: topPadding + 16, borderBottomColor: colors.woodBorder, borderBottomWidth: 1.5 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="bookmark" size={18} color={colors.woodBrown} />
              <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Fraunces_700Bold" }]}>
                Bookmarks
              </Text>
            </View>
            {bookmarks.length > 0 && (
              <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                {bookmarks.length} saved episode{bookmarks.length !== 1 ? "s" : ""}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "DMSans_600SemiBold" }]}>
              No bookmarks yet
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              Tap the bookmark icon on any episode to save it here for later.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: bottomPadding, flexGrow: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, gap: 4, marginBottom: 4 },
  headerTitle: { fontSize: 28 },
  headerSub: { fontSize: 13 },
  item: { borderBottomWidth: 1 },
  itemInner: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  artwork: { width: 52, height: 52, borderRadius: 8, flexShrink: 0 },
  meta: { flex: 1, gap: 2 },
  epNum: { fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" },
  title: { fontSize: 14, lineHeight: 19 },
  playBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyTitle: { fontSize: 17, textAlign: "center" },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
