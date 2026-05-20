import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useGetEpisode } from "@workspace/api-client-react";
import React, { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useHistory } from "@/context/HistoryContext";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function EpisodeDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const progressBarRef = useRef<View>(null);
  const progressBarWidth = useRef(0);

  const { currentEpisode, isPlaying, isLoading, positionMs, durationMs, play, pause, resume, seek } = usePlayer();
  const { isBookmarked, toggleBookmark } = useHistory();

  const { data: episode, isLoading: epLoading, error } = useGetEpisode(slug ?? "");

  const isThisEpisode = currentEpisode?.slug === slug;
  const activePositionMs = isThisEpisode ? positionMs : 0;
  const activeDurationMs = isThisEpisode ? durationMs : (episode?.durationSeconds ? episode.durationSeconds * 1000 : 0);
  const progress = activeDurationMs > 0 ? activePositionMs / activeDurationMs : 0;
  const bookmarked = isBookmarked(slug ?? "");

  const handlePlayPause = useCallback(async () => {
    if (!episode) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isThisEpisode) {
      if (isPlaying) await pause();
      else await resume();
    } else {
      await play({
        slug: episode.slug,
        title: episode.title,
        audioUrl: episode.audioUrl ?? undefined,
        artworkUrl: episode.artworkUrl ?? undefined,
        durationSeconds: episode.durationSeconds ?? undefined,
        episodeNumber: episode.episodeNumber ?? undefined,
      });
    }
  }, [episode, isThisEpisode, isPlaying, play, pause, resume]);

  const handleSkip = async (deltaMs: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newPos = Math.max(0, Math.min(activeDurationMs, activePositionMs + deltaMs));
    await seek(newPos);
  };

  const handleProgressPress = useCallback(
    async (e: GestureResponderEvent) => {
      if (progressBarWidth.current === 0) return;
      const { locationX } = e.nativeEvent;
      const ratio = Math.max(0, Math.min(1, locationX / progressBarWidth.current));
      const newPos = ratio * activeDurationMs;
      await seek(newPos);
    },
    [activeDurationMs, seek],
  );

  const handleProgressLayout = useCallback((e: LayoutChangeEvent) => {
    progressBarWidth.current = e.nativeEvent.layout.width;
  }, []);

  const handleToggleBookmark = useCallback(async () => {
    if (!episode) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleBookmark({
      slug: episode.slug,
      title: episode.title,
      artworkUrl: episode.artworkUrl,
      durationSeconds: episode.durationSeconds,
      episodeNumber: episode.episodeNumber,
      pubDate: episode.pubDate,
    });
  }, [episode, toggleBookmark]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  if (epLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { paddingTop: topPadding }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error || !episode) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { paddingTop: topPadding }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.center}>
          <Ionicons name="warning-outline" size={40} color={colors.mutedForeground} />
          <Text style={[styles.errorText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
            Episode not found
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[{ color: colors.primaryForeground, fontFamily: "DMSans_600SemiBold", fontSize: 14 }]}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const showNotes = episode.descriptionHtml ? stripHtml(episode.descriptionHtml) : episode.summary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <View style={[styles.artworkSection, { backgroundColor: colors.primary, paddingTop: topPadding + 8 }]}>
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} testID="episode-back-btn">
              <Ionicons name="chevron-back" size={24} color={colors.primaryForeground} />
            </Pressable>
            <Text
              style={[styles.topBarTitle, { color: colors.primaryForeground, fontFamily: "DMSans_600SemiBold" }]}
              numberOfLines={1}
            >
              Episode
            </Text>
            <Pressable onPress={handleToggleBookmark} style={styles.backBtn} testID="episode-bookmark-btn">
              <Ionicons
                name={bookmarked ? "bookmark" : "bookmark-outline"}
                size={22}
                color={bookmarked ? "#fbbf24" : colors.primaryForeground}
              />
            </Pressable>
          </View>

          <View style={styles.artworkContainer}>
            {episode.artworkUrl ? (
              <Image
                source={{ uri: episode.artworkUrl }}
                style={styles.artwork}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.artwork, { backgroundColor: colors.primaryForeground, opacity: 0.15 }]}>
                <Ionicons name="radio" size={48} color={colors.primaryForeground} />
              </View>
            )}
          </View>
        </View>

        <View style={styles.playerSection}>
          <View style={styles.episodeMeta}>
            {episode.episodeNumber != null && (
              <Text style={[styles.epNum, { color: colors.primary, fontFamily: "DMSans_600SemiBold" }]}>
                EPISODE {episode.episodeNumber}
              </Text>
            )}
            {episode.pubDate && (
              <Text style={[styles.epDate, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                {formatDate(episode.pubDate)}
              </Text>
            )}
          </View>

          <Text style={[styles.title, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
            {episode.title}
          </Text>

          {episode.categories && episode.categories.length > 0 && (
            <View style={styles.categoriesRow}>
              {episode.categories.slice(0, 3).map((cat) => (
                <View key={cat} style={[styles.catBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.catText, { color: colors.mutedForeground, fontFamily: "DMSans_500Medium" }]}>
                    {cat}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.progressContainer}>
            <Pressable
              ref={progressBarRef}
              onPress={handleProgressPress}
              onLayout={handleProgressLayout}
              style={[styles.progressTrack, { backgroundColor: colors.muted }]}
              testID="episode-progress-bar"
            >
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%`, backgroundColor: colors.primary },
                ]}
              />
              <View
                style={[
                  styles.progressThumb,
                  { left: `${progress * 100}%`, backgroundColor: colors.primary },
                ]}
              />
            </Pressable>
            <View style={styles.timeRow}>
              <Text style={[styles.timeText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                {formatDuration(activePositionMs)}
              </Text>
              <Text style={[styles.timeText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                -{formatDuration(Math.max(0, activeDurationMs - activePositionMs))}
              </Text>
            </View>
          </View>

          <View style={styles.controls}>
            <Pressable onPress={() => handleSkip(-30000)} style={styles.skipBtn} testID="episode-skip-back">
              <Ionicons name="play-back" size={26} color={colors.foreground} />
              <Text style={[styles.skipLabel, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                30
              </Text>
            </Pressable>

            <Pressable
              onPress={handlePlayPause}
              style={[styles.playBtn, { backgroundColor: colors.primary }]}
              testID="episode-play-pause"
            >
              {isLoading && isThisEpisode ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Ionicons
                  name={isThisEpisode && isPlaying ? "pause" : "play"}
                  size={30}
                  color={colors.primaryForeground}
                  style={{ marginLeft: isThisEpisode && isPlaying ? 0 : 3 }}
                />
              )}
            </Pressable>

            <Pressable onPress={() => handleSkip(30000)} style={styles.skipBtn} testID="episode-skip-forward">
              <Ionicons name="play-forward" size={26} color={colors.foreground} />
              <Text style={[styles.skipLabel, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                30
              </Text>
            </Pressable>
          </View>
        </View>

        {showNotes && (
          <View style={[styles.notesSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.notesTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
              Show Notes
            </Text>
            <Text style={[styles.notesBody, { color: colors.foreground, fontFamily: "DMSans_400Regular" }]}>
              {showNotes}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 40,
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  artworkSection: {
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    height: 48,
  },
  topBarTitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  artworkContainer: {
    alignItems: "center",
    paddingHorizontal: 48,
    paddingTop: 8,
  },
  artwork: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    maxWidth: 280,
    alignItems: "center",
    justifyContent: "center",
  },
  playerSection: {
    padding: 20,
    gap: 12,
  },
  episodeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  epNum: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  epDate: {
    fontSize: 12,
  },
  title: {
    fontSize: 20,
    lineHeight: 27,
  },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  catText: {
    fontSize: 11,
  },
  progressContainer: {
    marginTop: 8,
    gap: 6,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    position: "relative",
  },
  progressFill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 2,
  },
  progressThumb: {
    position: "absolute",
    top: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    fontSize: 11,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    marginTop: 8,
  },
  skipBtn: {
    alignItems: "center",
    gap: 2,
  },
  skipLabel: {
    fontSize: 10,
  },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  notesSection: {
    margin: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  notesTitle: {
    fontSize: 16,
  },
  notesBody: {
    fontSize: 14,
    lineHeight: 22,
  },
});
