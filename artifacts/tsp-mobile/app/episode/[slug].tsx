import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useGetEpisode } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
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
import { useDownloads } from "@/context/DownloadContext";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";
import { WishingWellModal } from "@/components/WishingWellModal";

type TransformationDef = {
  slug: string;
  from: string;
  to: string;
  color: string;
  icon: string;
  tags: string[];
  categories: string[];
};

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

function useTransformations() {
  return useQuery<TransformationDef[]>({
    queryKey: ["transformations"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/transformations`);
      if (!res.ok) throw new Error("Failed to load transformations");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });
}

function matchTransformations(
  episodeCategories: string[],
  transformations: TransformationDef[],
): TransformationDef[] {
  const lowerCats = episodeCategories.map((c) => c.toLowerCase());
  return transformations.filter((t) => {
    const tLower = [...t.tags, ...t.categories].map((s) => s.toLowerCase());
    return lowerCats.some((c) => tLower.includes(c));
  });
}

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
  const [wishingWellVisible, setWishingWellVisible] = React.useState(false);

  const { currentEpisode, isPlaying, isLoading, positionMs, durationMs, play, pause, resume, seek } = usePlayer();
  const { isBookmarked, toggleBookmark } = useHistory();
  const { isDownloaded, isDownloading, downloadEpisode, deleteDownload, getLocalUri, progress: downloadProgress } = useDownloads();

  const { data: episode, isLoading: epLoading, error } = useGetEpisode(slug ?? "");
  const { data: transformations } = useTransformations();

  const isThisEpisode = currentEpisode?.slug === slug;
  const activePositionMs = isThisEpisode ? positionMs : 0;
  const activeDurationMs = isThisEpisode ? durationMs : (episode?.durationSeconds ? episode.durationSeconds * 1000 : 0);
  const progress = activeDurationMs > 0 ? activePositionMs / activeDurationMs : 0;
  const bookmarked = isBookmarked(slug ?? "");
  const dlProgress = slug ? (downloadProgress[slug] ?? null) : null;
  const downloaded = slug ? isDownloaded(slug) : false;
  const downloading = slug ? isDownloading(slug) : false;

  const handlePlayPause = useCallback(async () => {
    if (!episode) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isThisEpisode) {
      if (isPlaying) await pause();
      else await resume();
    } else {
      const localUri = slug ? getLocalUri(slug) : null;
      await play({
        slug: episode.slug,
        title: episode.title,
        audioUrl: localUri ?? episode.audioUrl ?? undefined,
        artworkUrl: episode.artworkUrl ?? undefined,
        durationSeconds: episode.durationSeconds ?? undefined,
        episodeNumber: episode.episodeNumber ?? undefined,
      });
    }
  }, [episode, isThisEpisode, isPlaying, play, pause, resume, slug, getLocalUri]);

  const handleDownload = useCallback(async () => {
    if (!episode || !slug) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isDownloaded(slug)) {
      deleteDownload(slug);
    } else if (!isDownloading(slug) && episode.audioUrl) {
      await downloadEpisode({
        slug: episode.slug,
        title: episode.title,
        audioUrl: episode.audioUrl,
        artworkUrl: episode.artworkUrl ?? undefined,
        episodeNumber: episode.episodeNumber ?? undefined,
        durationSeconds: episode.durationSeconds ?? undefined,
      });
    }
  }, [episode, slug, isDownloaded, isDownloading, downloadEpisode, deleteDownload]);

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
  const matchedTransformations =
    episode.categories && transformations
      ? matchTransformations(episode.categories, transformations)
      : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <WishingWellModal
        visible={wishingWellVisible}
        onClose={() => setWishingWellVisible(false)}
        episodeSlug={slug ?? undefined}
      />
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

          {matchedTransformations.length > 0 && (
            <View style={styles.transformationsSection}>
              <Text style={[styles.transformationsLabel, { color: colors.mutedForeground, fontFamily: "DMSans_500Medium" }]}>
                Transformation Paths
              </Text>
              <View style={styles.transformationsRow}>
                {matchedTransformations.map((t) => (
                  <Pressable
                    key={t.slug}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/transformation/${t.slug}` as never);
                    }}
                    style={[
                      styles.transformationBadge,
                      { backgroundColor: t.color + "18", borderColor: t.color + "55" },
                    ]}
                  >
                    <Text style={styles.transformationIcon}>{t.icon}</Text>
                    <Text style={[styles.transformationText, { color: t.color, fontFamily: "DMSans_500Medium" }]}>
                      {t.from} → {t.to}
                    </Text>
                  </Pressable>
                ))}
              </View>
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

          {episode.audioUrl && Platform.OS !== "web" && (
            <View style={styles.downloadRow}>
              <Pressable
                onPress={handleDownload}
                style={[
                  styles.downloadBtn,
                  {
                    backgroundColor: downloaded ? colors.muted : colors.background,
                    borderColor: downloaded ? colors.primary : colors.border,
                  },
                ]}
                testID="episode-download-btn"
              >
                {downloading ? (
                  <>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.downloadText, { color: colors.primary, fontFamily: "DMSans_500Medium" }]}>
                      {dlProgress != null ? `${Math.round(dlProgress * 100)}%` : "Downloading…"}
                    </Text>
                  </>
                ) : downloaded ? (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    <Text style={[styles.downloadText, { color: colors.primary, fontFamily: "DMSans_500Medium" }]}>
                      Downloaded
                    </Text>
                    <Ionicons name="trash-outline" size={16} color={colors.mutedForeground} style={{ marginLeft: 4 }} />
                  </>
                ) : (
                  <>
                    <Ionicons name="cloud-download-outline" size={18} color={colors.foreground} />
                    <Text style={[styles.downloadText, { color: colors.foreground, fontFamily: "DMSans_500Medium" }]}>
                      Download
                    </Text>
                  </>
                )}
              </Pressable>
              {downloading && dlProgress != null && (
                <View style={[styles.dlProgressTrack, { backgroundColor: colors.muted }]}>
                  <View style={[styles.dlProgressFill, { width: `${dlProgress * 100}%`, backgroundColor: colors.primary }]} />
                </View>
              )}
            </View>
          )}
        </View>

        {/* Toss a Coin */}
        <View style={[styles.wellSection, { borderTopColor: colors.border }]}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setWishingWellVisible(true);
            }}
            style={[styles.wellBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
          >
            <Text style={styles.wellBtnEmoji}>🪙</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.wellBtnTitle, { color: colors.foreground, fontFamily: "DMSans_600SemiBold" }]}>
                Toss a Coin into the Well
              </Text>
              <Text style={[styles.wellBtnSub, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                Make a wish · enter today's 50/50 draw
              </Text>
            </View>
          </Pressable>
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
  downloadRow: {
    gap: 8,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  downloadText: {
    fontSize: 14,
  },
  dlProgressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  dlProgressFill: {
    height: 3,
    borderRadius: 2,
  },
  wellSection: {
    borderTopWidth: 1,
    padding: 16,
  },
  wellBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  wellBtnEmoji: { fontSize: 26 },
  wellBtnTitle: { fontSize: 15 },
  wellBtnSub: { fontSize: 12, marginTop: 2 },
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
  transformationsSection: {
    gap: 6,
  },
  transformationsLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  transformationsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  transformationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  transformationIcon: {
    fontSize: 13,
  },
  transformationText: {
    fontSize: 12,
  },
});
