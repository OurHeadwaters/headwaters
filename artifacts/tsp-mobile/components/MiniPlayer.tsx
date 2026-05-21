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
  const { currentEpisode, isPlaying, isLoading, isError, positionMs, durationMs, pause, resume, retry, nextEpisode } = usePlayer();

  if (!currentEpisode) return null;

  const bottomOffset = Platform.OS === "web" ? TAB_BAR_HEIGHT : TAB_BAR_HEIGHT + insets.bottom;
  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  const handlePlayPause = () => {
    if (isError) { retry(); return; }
    if (isPlaying) pause();
    else resume();
  };

  const handleOpen = () => {
    router.push(`/episode/${currentEpisode.slug}`);
  };

  const handleOpenQueue = () => {
    router.push("/queue");
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
          backgroundColor: isError ? colors.destructive ?? "#7f1d1d" : colors.forestDeep,
          bottom: bottomOffset,
          borderColor: colors.woodBorder,
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
              backgroundColor: colors.lanternGlow,
              opacity: 0.8,
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
          <View style={[styles.artwork, { backgroundColor: colors.woodBrown + "44", alignItems: "center", justifyContent: "center" }]}>
            <Ionicons name="radio" size={18} color={colors.amberGold} />
          </View>
        )}
        <View style={styles.textBlock}>
          <Text
            style={[styles.title, { color: "#F5F1EB", fontFamily: "DMSans_600SemiBold" }]}
            numberOfLines={1}
          >
            {isError ? "Playback error — tap to retry" : currentEpisode.title}
          </Text>
          {!isError && upNextLabel && (
            <Pressable
              onPress={(e) => { e.stopPropagation?.(); handleOpenQueue(); }}
              hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
            >
              <Text
                style={[styles.upNext, { color: colors.amberGold, fontFamily: "DMSans_400Regular" }]}
                numberOfLines={1}
              >
                Up next: {upNextLabel}
              </Text>
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={handlePlayPause}
          style={[styles.playBtn, { backgroundColor: colors.amberGold }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="mini-player-play-pause"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#1C1008" />
          ) : isError ? (
            <Ionicons name="refresh" size={20} color="#1C1008" />
          ) : (
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={20}
              color="#1C1008"
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
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1.5,
  },
  progressBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  progressFill: {
    height: 3,
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
    borderRadius: 6,
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
    opacity: 0.85,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
