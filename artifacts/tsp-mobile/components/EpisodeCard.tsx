import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface EpisodeCardProps {
  slug: string;
  title: string;
  pubDate?: string;
  episodeNumber?: number | null;
  durationSeconds?: number | null;
  artworkUrl?: string | null;
  summary?: string;
  categories?: string[];
  compact?: boolean;
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function EpisodeCard({ slug, title, pubDate, episodeNumber, durationSeconds, artworkUrl, summary, categories, compact = false }: EpisodeCardProps) {
  const colors = useColors();

  const handlePress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/episode/${slug}`);
  };

  return (
    <Pressable
      testID={`episode-card-${slug}`}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.outer,
        {
          backgroundColor: colors.woodBorder,
          borderColor: colors.woodBrown,
          opacity: pressed ? 0.88 : 1,
          shadowColor: colors.forestDeep,
        },
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            backgroundColor: colors.card,
            borderColor: colors.woodBorder,
          },
        ]}
      >
        <View style={styles.row}>
          {artworkUrl ? (
            <Image
              source={{ uri: artworkUrl }}
              style={[styles.artwork, compact && styles.artworkCompact]}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.artwork, compact && styles.artworkCompact, { backgroundColor: colors.forestMid, borderRadius: 6 }]}>
              <Ionicons name="radio" size={compact ? 18 : 24} color={colors.amberGold} />
            </View>
          )}
          <View style={styles.content}>
            <View style={styles.meta}>
              {episodeNumber != null && (
                <View style={[styles.epBadge, { backgroundColor: colors.amberGold + "22", borderColor: colors.amberGold + "55" }]}>
                  <Text style={[styles.epNum, { color: colors.amberGold, fontFamily: "DMSans_600SemiBold" }]}>
                    EP {episodeNumber}
                  </Text>
                </View>
              )}
              {pubDate && (
                <Text style={[styles.date, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                  {formatDate(pubDate)}
                </Text>
              )}
            </View>
            <Text
              style={[styles.title, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}
              numberOfLines={compact ? 2 : 3}
            >
              {title}
            </Text>
            {!compact && summary && (
              <Text
                style={[styles.summary, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}
                numberOfLines={2}
              >
                {summary}
              </Text>
            )}
            <View style={styles.footer}>
              {durationSeconds != null && (
                <View style={styles.durationRow}>
                  <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.duration, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                    {formatDuration(durationSeconds)}
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={colors.woodBorder} />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 14,
    borderWidth: 2,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
    overflow: "hidden",
  },
  inner: {
    borderRadius: 11,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    padding: 12,
    gap: 12,
    alignItems: "flex-start",
  },
  artwork: {
    width: 72,
    height: 72,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  artworkCompact: {
    width: 56,
    height: 56,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  epBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  epNum: {
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  date: {
    fontSize: 11,
  },
  title: {
    fontSize: 14,
    lineHeight: 19,
  },
  summary: {
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  duration: {
    fontSize: 11,
  },
});
