import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { usePlayer } from "@/context/PlayerContext";

const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 49;

export function MiniPlayer() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentEpisode, isPlaying, isLoading, positionMs, durationMs, pause, resume, nextEpisode } = usePlayer();

  if (!currentEpisode) return null;

  const bottomOffset = Platform.OS === "web" ? TAB_BAR_HEIGHT : TAB_BAR_HEIGHT + insets.bottom;
  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  const handlePlayPause = () => {
    if (isPlaying) pause();
    else resume();
  };

  const handleOpen = () => {
    router.push(`/episode/${currentEpisode.slug}`);
  };

  const upNextLabel = nextEpisode
    ? (nextEpisode.episodeNumber != null
        ? `EP ${nextEpisode.episodeNumber} · ${nextEpisode.title}`
        : nextEpisode.title)
    : null;

  return (
    <Pressable
      onPress={handleOpen}
      style={[
        styles.container,
        {
          backgroundColor: colors.primary,
          bottom: bottomOffset,
          borderRadius: 10,
          marginHorizontal: 10,
        },
      ]}
    >
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: colors.primaryForeground,
              opacity: 0.3,
            },
          ]}
        />
      </View>
      <View style={styles.row}>
        {currentEpisode.artworkUrl ? (
          <Image
            source={{ uri: currentEpisode.artworkUrl }}
            style={styles.artwork}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.artwork, { backgroundColor: colors.primaryForeground, opacity: 0.2 }]}>
            <Ionicons name="radio" size={18} color={colors.primaryForeground} />
          </View>
        )}
        <View style={styles.textBlock}>
          <Text
            style={[styles.title, { color: colors.primaryForeground, fontFamily: "DMSans_600SemiBold" }]}
            numberOfLines={1}
          >
            {currentEpisode.title}
          </Text>
          {upNextLabel && (
            <Text
              style={[styles.upNext, { color: colors.primaryForeground, fontFamily: "DMSans_400Regular" }]}
              numberOfLines={1}
            >
              Up next: {upNextLabel}
            </Text>
          )}
        </View>
        <Pressable
          onPress={handlePlayPause}
          style={styles.playBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="mini-player-play-pause"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={24}
              color={colors.primaryForeground}
            />
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: "hidden",
  },
  progressBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  progressFill: {
    height: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  artwork: {
    width: 40,
    height: 40,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
  },
  upNext: {
    fontSize: 11,
    opacity: 0.75,
  },
  playBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
