import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
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

import { useHistory, type PlaybackRecord } from "@/context/HistoryContext";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";

const MINI_PLAYER_HEIGHT = 64;

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function HistoryItem({ record }: { record: PlaybackRecord }) {
  const colors = useColors();
  const isFinished = record.positionMs === 0;
  const progress =
    !isFinished && record.durationSeconds && record.durationSeconds > 0
      ? record.positionMs / (record.durationSeconds * 1000)
      : null;

  return (
    <Pressable
      onPress={() => router.push(`/episode/${record.slug}`)}
      style={({ pressed }) => [
        styles.item,
        { borderBottomColor: colors.border, opacity: pressed ? 0.75 : 1 },
      ]}
    >
      {record.artworkUrl ? (
        <Image source={{ uri: record.artworkUrl }} style={styles.artwork} contentFit="cover" />
      ) : (
        <View style={[styles.artwork, { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }]}>
          <Ionicons name="radio" size={20} color={colors.mutedForeground} />
        </View>
      )}

      <View style={styles.meta}>
        {record.episodeNumber != null && (
          <Text style={[styles.epNum, { color: colors.primary, fontFamily: "DMSans_600SemiBold" }]}>
            EP {record.episodeNumber}
          </Text>
        )}
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "DMSans_600SemiBold" }]} numberOfLines={2}>
          {record.title}
        </Text>
        <Text style={[styles.timestamp, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
          {formatRelativeTime(record.updatedAt)}
        </Text>
        {progress !== null && (
          <ProgressBar progress={progress} color={colors.primary} />
        )}
      </View>

      {isFinished ? (
        <View style={[styles.badge, { backgroundColor: colors.muted }]}>
          <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.primary, fontFamily: "DMSans_500Medium" }]}>
            Played
          </Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} style={styles.chevron} />
      )}
    </Pressable>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { history } = useHistory();
  const { currentEpisode } = usePlayer();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = currentEpisode
    ? MINI_PLAYER_HEIGHT + (Platform.OS === "web" ? 84 : 49 + insets.bottom) + 16
    : Platform.OS === "web" ? 84 + 16 : 49 + insets.bottom + 16;

  const records = Object.values(history).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={records}
        keyExtractor={(item) => item.slug}
        renderItem={({ item }) => <HistoryItem record={item} />}
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
            <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
              History
            </Text>
            {records.length > 0 && (
              <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                {records.length} episode{records.length !== 1 ? "s" : ""} played
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "DMSans_600SemiBold" }]}>
              No history yet
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              Episodes you start will appear here so you can easily find them again.
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  artwork: {
    width: 52,
    height: 52,
    borderRadius: 6,
    flexShrink: 0,
  },
  meta: {
    flex: 1,
    gap: 3,
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
  timestamp: {
    fontSize: 11,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(128,128,128,0.2)",
    marginTop: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 11,
  },
  chevron: {
    flexShrink: 0,
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
