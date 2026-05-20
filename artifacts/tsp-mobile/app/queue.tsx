import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { usePlayer, PlayableEpisode } from "@/context/PlayerContext";

const ITEM_HEIGHT = 72;

function formatEpisodeLabel(ep: PlayableEpisode): string {
  if (ep.episodeNumber != null) return `EP ${ep.episodeNumber} · ${ep.title}`;
  return ep.title;
}

interface DraggableItemProps {
  item: PlayableEpisode;
  index: number;
  total: number;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDragStart: (index: number, pageY: number) => void;
  onDragMove: (pageY: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

function QueueItem({
  item,
  index,
  total,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragMove,
  onDragEnd,
  isDragging,
}: DraggableItemProps) {
  const colors = useColors();

  const dragY = useSharedValue(0);
  const dragging = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(150)
    .onStart((e) => {
      dragging.value = true;
      runOnJS(onDragStart)(index, e.absoluteY);
    })
    .onUpdate((e) => {
      dragY.value = e.translationY;
      runOnJS(onDragMove)(e.absoluteY);
    })
    .onEnd(() => {
      dragging.value = false;
      dragY.value = withSpring(0, { duration: 200 });
      runOnJS(onDragEnd)();
    })
    .onFinalize(() => {
      dragging.value = false;
      dragY.value = withSpring(0, { duration: 200 });
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragging.value ? dragY.value : withSpring(0) }],
    zIndex: dragging.value ? 10 : 1,
    shadowOpacity: dragging.value ? 0.2 : 0,
    elevation: dragging.value ? 6 : 0,
  }));

  return (
    <Animated.View
      style={[
        styles.item,
        { borderBottomColor: colors.border, backgroundColor: colors.background },
        animStyle,
        isDragging && styles.itemDragging,
      ]}
    >
      <GestureDetector gesture={panGesture}>
        <View style={styles.dragHandle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="reorder-three" size={22} color={colors.mutedForeground} />
        </View>
      </GestureDetector>

      {item.artworkUrl ? (
        <Image source={{ uri: item.artworkUrl }} style={styles.artwork} contentFit="cover" />
      ) : (
        <View style={[styles.artwork, { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }]}>
          <Ionicons name="radio" size={16} color={colors.mutedForeground} />
        </View>
      )}

      <Text
        style={[styles.title, { color: colors.foreground, fontFamily: "DMSans_500Medium" }]}
        numberOfLines={2}
      >
        {formatEpisodeLabel(item)}
      </Text>

      <View style={styles.controls}>
        <Pressable
          onPress={() => onMoveUp(index)}
          disabled={index === 0}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={({ pressed }) => [styles.arrowBtn, pressed && { opacity: 0.5 }]}
        >
          <Ionicons
            name="chevron-up"
            size={18}
            color={index === 0 ? colors.border : colors.mutedForeground}
          />
        </Pressable>
        <Pressable
          onPress={() => onMoveDown(index)}
          disabled={index === total - 1}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={({ pressed }) => [styles.arrowBtn, pressed && { opacity: 0.5 }]}
        >
          <Ionicons
            name="chevron-down"
            size={18}
            color={index === total - 1 ? colors.border : colors.mutedForeground}
          />
        </Pressable>
        <Pressable
          onPress={() => onRemove(index)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.5 }]}
        >
          <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function QueueScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { queue, currentEpisode, reorderQueue, removeFromQueue, clearQueue } = usePlayer();

  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragToIndex, setDragToIndex] = useState<number | null>(null);
  const containerTopRef = useRef<number>(0);

  const handleDragStart = useCallback((index: number, _pageY: number) => {
    setDragFromIndex(index);
    setDragToIndex(index);
  }, []);

  const handleDragMove = useCallback(
    (pageY: number) => {
      if (dragFromIndex == null) return;
      const offsetFromTop = pageY - containerTopRef.current;
      const targetIndex = Math.max(0, Math.min(queue.length - 1, Math.round(offsetFromTop / ITEM_HEIGHT)));
      setDragToIndex(targetIndex);
    },
    [dragFromIndex, queue.length],
  );

  const handleDragEnd = useCallback(() => {
    if (dragFromIndex != null && dragToIndex != null && dragFromIndex !== dragToIndex) {
      reorderQueue(dragFromIndex, dragToIndex);
    }
    setDragFromIndex(null);
    setDragToIndex(null);
  }, [dragFromIndex, dragToIndex, reorderQueue]);

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index > 0) reorderQueue(index, index - 1);
    },
    [reorderQueue],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index < queue.length - 1) reorderQueue(index, index + 1);
    },
    [reorderQueue],
  );

  const handleRemove = useCallback(
    (index: number) => {
      removeFromQueue(index);
    },
    [removeFromQueue],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-down" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
          Up Next
        </Text>
        {queue.length > 0 ? (
          <Pressable
            onPress={clearQueue}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.clearBtn}
          >
            <Text style={[styles.clearText, { color: colors.primary, fontFamily: "DMSans_500Medium" }]}>
              Clear
            </Text>
          </Pressable>
        ) : (
          <View style={styles.clearBtn} />
        )}
      </View>

      {currentEpisode && (
        <View style={[styles.nowPlaying, { borderBottomColor: colors.border, backgroundColor: colors.muted }]}>
          <Text style={[styles.nowPlayingLabel, { color: colors.mutedForeground, fontFamily: "DMSans_500Medium" }]}>
            NOW PLAYING
          </Text>
          <View style={styles.nowPlayingRow}>
            {currentEpisode.artworkUrl ? (
              <Image source={{ uri: currentEpisode.artworkUrl }} style={styles.nowPlayingArt} contentFit="cover" />
            ) : (
              <View style={[styles.nowPlayingArt, { backgroundColor: colors.border, alignItems: "center", justifyContent: "center" }]}>
                <Ionicons name="radio" size={14} color={colors.mutedForeground} />
              </View>
            )}
            <Text
              style={[styles.nowPlayingTitle, { color: colors.foreground, fontFamily: "DMSans_600SemiBold" }]}
              numberOfLines={1}
            >
              {formatEpisodeLabel(currentEpisode)}
            </Text>
          </View>
        </View>
      )}

      {queue.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="list-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "DMSans_600SemiBold" }]}>
            Queue is empty
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
            Go to Downloads and tap "Play all" to fill the queue.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          onLayout={(e) => {
            containerTopRef.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={[styles.queueCount, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
            {queue.length} episode{queue.length !== 1 ? "s" : ""} in queue
          </Text>
          {queue.map((item, index) => (
            <QueueItem
              key={`${item.slug}-${index}`}
              item={item}
              index={index}
              total={queue.length}
              onRemove={handleRemove}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              isDragging={dragFromIndex === index}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 17,
  },
  clearBtn: {
    width: 44,
    alignItems: "flex-end",
  },
  clearText: {
    fontSize: 15,
  },
  nowPlaying: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 4,
  },
  nowPlayingLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  nowPlayingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  nowPlayingArt: {
    width: 32,
    height: 32,
    borderRadius: 4,
    flexShrink: 0,
  },
  nowPlayingTitle: {
    flex: 1,
    fontSize: 14,
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
  queueCount: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    height: ITEM_HEIGHT,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  itemDragging: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  dragHandle: {
    width: 28,
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 5,
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flexShrink: 0,
  },
  arrowBtn: {
    width: 28,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtn: {
    width: 32,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
