import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDownloads, type DownloadedEpisode } from "@/context/DownloadContext";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";

const MINI_PLAYER_HEIGHT = 64;

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function DownloadItem({ item }: { item: DownloadedEpisode }) {
  const colors = useColors();
  const { deleteDownload } = useDownloads();
  const { play, currentEpisode, isPlaying, pause, resume } = usePlayer();

  const isThisEpisode = currentEpisode?.slug === item.slug;

  const handlePlay = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isThisEpisode) {
      if (isPlaying) await pause();
      else await resume();
    } else {
      await play({
        slug: item.slug,
        title: item.title,
        audioUrl: item.localUri,
        artworkUrl: item.artworkUrl,
        episodeNumber: item.episodeNumber,
        durationSeconds: item.durationSeconds,
      });
    }
  };

  const handleDelete = () => {
    if (Platform.OS === "web") {
      deleteDownload(item.slug);
      return;
    }
    Alert.alert(
      "Remove Download",
      `Remove "${item.title}" from your downloads?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => deleteDownload(item.slug),
        },
      ]
    );
  };

  const handleOpenDetail = () => {
    router.push(`/episode/${item.slug}`);
  };

  return (
    <Pressable onPress={handleOpenDetail} style={[styles.item, { borderBottomColor: colors.border }]}>
      <View style={styles.itemInner}>
        {item.artworkUrl ? (
          <Image source={{ uri: item.artworkUrl }} style={styles.artwork} contentFit="cover" />
        ) : (
          <View style={[styles.artwork, { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }]}>
            <Ionicons name="radio" size={20} color={colors.mutedForeground} />
          </View>
        )}

        <View style={styles.meta}>
          {item.episodeNumber != null && (
            <Text style={[styles.epNum, { color: colors.primary, fontFamily: "DMSans_600SemiBold" }]}>
              EP {item.episodeNumber}
            </Text>
          )}
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "DMSans_600SemiBold" }]} numberOfLines={2}>
            {item.title}
          </Text>
          {item.durationSeconds != null && (
            <Text style={[styles.duration, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              {formatDuration(item.durationSeconds)}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handlePlay}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons
              name={isThisEpisode && isPlaying ? "pause" : "play"}
              size={18}
              color={colors.primaryForeground}
              style={{ marginLeft: isThisEpisode && isPlaying ? 0 : 2 }}
            />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export default function DownloadsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { downloads } = useDownloads();
  const { currentEpisode } = usePlayer();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = currentEpisode
    ? MINI_PLAYER_HEIGHT + (Platform.OS === "web" ? 84 : 49 + insets.bottom) + 16
    : Platform.OS === "web" ? 84 + 16 : 49 + insets.bottom + 16;

  const items = Object.values(downloads).sort((a, b) => b.downloadedAt - a.downloadedAt);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={item => item.slug}
        renderItem={({ item }) => <DownloadItem item={item} />}
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
            <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
              Downloads
            </Text>
            {items.length > 0 && (
              <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                {items.length} episode{items.length !== 1 ? "s" : ""} saved
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cloud-download-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "DMSans_600SemiBold" }]}>
              No downloads yet
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              Open any episode and tap Download to save it for offline listening.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: bottomPadding, flexGrow: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 4,
  },
  headerTitle: {
    fontSize: 28,
  },
  headerSub: {
    fontSize: 13,
  },
  item: {
    borderBottomWidth: 1,
  },
  itemInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  artwork: {
    width: 52,
    height: 52,
    borderRadius: 6,
    flexShrink: 0,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  epNum: {
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 14,
    lineHeight: 19,
  },
  duration: {
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
