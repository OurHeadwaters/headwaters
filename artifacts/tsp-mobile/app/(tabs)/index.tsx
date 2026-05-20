import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useGetFeaturedEpisodes, useGetFeed, useListEpisodes, useGetThisDayEpisodes } from "@workspace/api-client-react";
import type { Episode, ThisDayEpisode } from "@workspace/api-client-react";
import React, { useState, useRef } from "react";
import { useHistory } from "@/context/HistoryContext";
import type { PlaybackRecord } from "@/context/HistoryContext";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EpisodeCard } from "@/components/EpisodeCard";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";

const PAGE_SIZE = 20;
const MINI_PLAYER_HEIGHT = 64;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function daysInMonth(month: number): number {
  return new Date(2000, month, 0).getDate();
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const ITEM_HEIGHT = 44;

function WheelPicker({
  items,
  selectedIndex,
  onSelect,
}: {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const VISIBLE = 5;
  const PAD = Math.floor(VISIBLE / 2);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
  }, [selectedIndex]);

  return (
    <View style={wheelStyles.container}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          onSelect(Math.max(0, Math.min(idx, items.length - 1)));
        }}
        contentContainerStyle={{ paddingVertical: PAD * ITEM_HEIGHT }}
        style={{ height: VISIBLE * ITEM_HEIGHT }}
      >
        {items.map((label, i) => (
          <Pressable
            key={label}
            onPress={() => {
              scrollRef.current?.scrollTo({ y: i * ITEM_HEIGHT, animated: true });
              onSelect(i);
            }}
            style={[wheelStyles.item, i === selectedIndex && wheelStyles.selectedItem]}
          >
            <Text
              style={[
                wheelStyles.itemText,
                i === selectedIndex && wheelStyles.selectedText,
                { fontFamily: i === selectedIndex ? "DMSans_600SemiBold" : "DMSans_400Regular" },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={wheelStyles.highlightTop} pointerEvents="none" />
      <View style={wheelStyles.highlightBottom} pointerEvents="none" />
      <View style={wheelStyles.selectionBar} pointerEvents="none" />
      <View style={[wheelStyles.selectionBar, { top: (PAD + 1) * ITEM_HEIGHT }]} pointerEvents="none" />
    </View>
  );
}

const wheelStyles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedItem: {},
  itemText: {
    fontSize: 16,
    color: "rgba(199, 210, 254, 0.5)",
  },
  selectedText: {
    color: "#e0e7ff",
    fontSize: 18,
  },
  highlightTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2 * ITEM_HEIGHT,
    background: "linear-gradient(to bottom, #1e1b4b, transparent)",
    backgroundColor: "rgba(30, 27, 75, 0.7)",
  },
  highlightBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2 * ITEM_HEIGHT,
    backgroundColor: "rgba(30, 27, 75, 0.7)",
  },
  selectionBar: {
    position: "absolute",
    top: 2 * ITEM_HEIGHT,
    left: 8,
    right: 8,
    height: 1,
    backgroundColor: "rgba(99, 102, 241, 0.4)",
  },
});

function ThisDayCard({ episode }: { episode: ThisDayEpisode }) {
  const { play, seek } = usePlayer();
  const year = new Date(episode.pubDate).getUTCFullYear();

  const handlePlay = async () => {
    if (!episode.audioUrl) return;
    await play({
      slug: episode.slug,
      title: episode.title,
      audioUrl: episode.audioUrl,
      artworkUrl: episode.artworkUrl,
      durationSeconds: episode.durationSeconds,
      episodeNumber: episode.episodeNumber,
    });
    if (episode.historyTimestamp && episode.historyTimestamp > 0) {
      setTimeout(() => {
        seek(episode.historyTimestamp! * 1000);
      }, 800);
    }
  };

  const handlePress = () => {
    router.push(`/episode/${episode.slug}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.thisDayCard,
        { backgroundColor: "rgba(79, 70, 229, 0.25)", borderColor: "rgba(99, 102, 241, 0.3)", opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.thisDayCardTop}>
        <View style={styles.thisDayYearRow}>
          <Text style={[styles.thisDayYear, { color: "#c7d2fe", fontFamily: "DMSans_700Bold" }]}>
            {year}
          </Text>
          {episode.episodeNumber != null && (
            <View style={[styles.thisDayEpBadge, { backgroundColor: "rgba(79, 70, 229, 0.4)", borderColor: "rgba(99, 102, 241, 0.4)" }]}>
              <Text style={[styles.thisDayEpNum, { color: "#a5b4fc", fontFamily: "DMSans_600SemiBold" }]}>
                EP {episode.episodeNumber}
              </Text>
            </View>
          )}
        </View>
        {episode.artworkUrl ? (
          <Image source={{ uri: episode.artworkUrl }} style={styles.thisDayArt} contentFit="cover" />
        ) : null}
      </View>
      <Text style={[styles.thisDayTitle, { color: "#e0e7ff", fontFamily: "DMSans_600SemiBold" }]} numberOfLines={2}>
        {episode.title}
      </Text>
      <Pressable
        onPress={handlePlay}
        style={({ pressed }) => [
          styles.thisDayPlayBtn,
          { backgroundColor: pressed ? "#4338ca" : "#4f46e5" },
        ]}
      >
        <Ionicons name="play" size={11} color="#fff" />
        <Text style={[styles.thisDayPlayText, { color: "#fff", fontFamily: "DMSans_600SemiBold" }]}>
          {episode.historyTimestamp && episode.historyTimestamp > 0
            ? `Play @ ${formatTimestamp(episode.historyTimestamp)}`
            : "Play"}
        </Text>
      </Pressable>
    </Pressable>
  );
}

function formatProgress(positionMs: number, durationSeconds?: number | null): string {
  const totalSec = Math.floor(positionMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pos = h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
  return pos;
}

function ContinueListeningCard({ record }: { record: PlaybackRecord }) {
  const colors = useColors();
  const { play } = usePlayer();

  const progress = record.durationSeconds && record.durationSeconds > 0
    ? Math.min(1, record.positionMs / (record.durationSeconds * 1000))
    : 0;

  const handlePress = () => {
    router.push(`/episode/${record.slug}`);
  };

  const handleResume = async () => {
    await play({
      slug: record.slug,
      title: record.title,
      audioUrl: record.audioUrl,
      artworkUrl: record.artworkUrl,
      durationSeconds: record.durationSeconds,
      episodeNumber: record.episodeNumber,
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.continueCard,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      {record.artworkUrl ? (
        <Image source={{ uri: record.artworkUrl }} style={styles.continueArt} contentFit="cover" />
      ) : (
        <View style={[styles.continueArt, { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }]}>
          <Ionicons name="radio" size={20} color={colors.mutedForeground} />
        </View>
      )}
      <View style={styles.continueInfo}>
        {record.episodeNumber != null && (
          <Text style={[styles.continueEpNum, { color: colors.primary, fontFamily: "DMSans_600SemiBold" }]}>
            EP {record.episodeNumber}
          </Text>
        )}
        <Text style={[styles.continueTitle, { color: colors.foreground, fontFamily: "DMSans_500Medium" }]} numberOfLines={2}>
          {record.title}
        </Text>
        <View style={[styles.continueProgressTrack, { backgroundColor: colors.muted }]}>
          <View
            style={[styles.continueProgressFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]}
          />
        </View>
        <Text style={[styles.continueTime, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
          {record.durationSeconds && record.durationSeconds > 0
            ? `${formatProgress(Math.max(0, record.durationSeconds * 1000 - record.positionMs))} left`
            : `${formatProgress(record.positionMs)} played`}
        </Text>
      </View>
      <Pressable
        onPress={handleResume}
        style={[styles.continuePlayBtn, { backgroundColor: colors.primary }]}
        hitSlop={8}
      >
        <Ionicons name="play" size={14} color="#fff" />
      </Pressable>
    </Pressable>
  );
}

function FeaturedCard({ episode }: { episode: Episode }) {
  const colors = useColors();

  const handlePress = () => {
    router.push(`/episode/${episode.slug}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.featuredCard,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      {episode.artworkUrl ? (
        <Image
          source={{ uri: episode.artworkUrl }}
          style={styles.featuredArt}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.featuredArt, { backgroundColor: colors.primary }]} />
      )}
      <View style={styles.featuredOverlay} />
      <View style={styles.featuredContent}>
        {episode.episodeNumber != null && (
          <Text style={[styles.featuredEpNum, { color: "#fff", fontFamily: "DMSans_600SemiBold" }]}>
            EP {episode.episodeNumber}
          </Text>
        )}
        <Text style={[styles.featuredTitle, { color: "#fff", fontFamily: "DMSans_700Bold" }]} numberOfLines={2}>
          {episode.title}
        </Text>
        <View style={[styles.featuredPlayChip, { backgroundColor: colors.primary }]}>
          <Ionicons name="play" size={12} color="#fff" />
          <Text style={[styles.featuredPlayText, { color: "#fff", fontFamily: "DMSans_500Medium" }]}>
            Play
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentEpisode } = usePlayer();
  const { continueListening } = useHistory();
  const [page, setPage] = useState(0);
  const [allEpisodes, setAllEpisodes] = useState<Episode[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [draftMonthIdx, setDraftMonthIdx] = useState(today.getMonth());
  const [draftDayIdx, setDraftDayIdx] = useState(today.getDate() - 1);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = currentEpisode
    ? MINI_PLAYER_HEIGHT + (Platform.OS === "web" ? 84 : 49 + insets.bottom) + 16
    : Platform.OS === "web" ? 84 + 16 : 49 + insets.bottom + 16;

  const { data: feed } = useGetFeed();
  const { data: featured } = useGetFeaturedEpisodes();
  const { data: thisDayEpisodes, isLoading: thisDayLoading } = useGetThisDayEpisodes({
    month: selectedMonth,
    day: selectedDay,
  });
  const { data: episodesPage, isLoading, refetch } = useListEpisodes(
    { limit: PAGE_SIZE, offset: page * PAGE_SIZE }
  );

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

  const isToday =
    selectedMonth === today.getMonth() + 1 && selectedDay === today.getDate();

  const dateLabel = `${MONTHS[selectedMonth - 1]} ${selectedDay}`;

  const openDatePicker = () => {
    setDraftMonthIdx(selectedMonth - 1);
    setDraftDayIdx(selectedDay - 1);
    setDatePickerVisible(true);
  };

  const applyDate = () => {
    const maxDay = daysInMonth(draftMonthIdx + 1);
    const clampedDayIdx = Math.min(draftDayIdx, maxDay - 1);
    setSelectedMonth(draftMonthIdx + 1);
    setSelectedDay(clampedDayIdx + 1);
    setDatePickerVisible(false);
  };

  const resetToToday = () => {
    setSelectedMonth(today.getMonth() + 1);
    setSelectedDay(today.getDate());
    setDraftMonthIdx(today.getMonth());
    setDraftDayIdx(today.getDate() - 1);
    setDatePickerVisible(false);
  };

  const dayLabels = Array.from(
    { length: daysInMonth(draftMonthIdx + 1) },
    (_, i) => String(i + 1),
  );

  const ListHeader = () => (
    <View>
      {/* This Day in History */}
      <View style={[styles.thisDaySection, { backgroundColor: "#1e1b4b" }]}>
        <View style={styles.thisDaySectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.thisDaySectionLabel, { color: "#818cf8", fontFamily: "DMSans_600SemiBold" }]}>
              THIS DAY IN HISTORY
            </Text>
            <TouchableOpacity onPress={openDatePicker} style={styles.dateLabelRow} activeOpacity={0.7}>
              <Text style={[styles.thisDaySectionDate, { color: "#e0e7ff", fontFamily: "DMSans_700Bold" }]}>
                {dateLabel}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#818cf8" style={{ marginTop: 3 }} />
            </TouchableOpacity>
            {!isToday && (
              <TouchableOpacity onPress={resetToToday} style={styles.backToTodayBtn} activeOpacity={0.7}>
                <Ionicons name="refresh" size={11} color="#818cf8" />
                <Text style={[styles.backToTodayText, { color: "#818cf8", fontFamily: "DMSans_400Regular" }]}>
                  Back to today
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {thisDayLoading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thisDayList}>
            {Array.from({ length: 3 }).map((_, i) => (
              <View key={i} style={[styles.thisDayCard, { backgroundColor: "rgba(79, 70, 229, 0.15)", borderColor: "rgba(99, 102, 241, 0.2)" }]} />
            ))}
          </ScrollView>
        ) : !thisDayEpisodes || thisDayEpisodes.length === 0 ? (
          <View style={styles.thisDayEmpty}>
            <Ionicons name="time-outline" size={28} color="#818cf8" />
            <Text style={[styles.thisDayEmptyText, { color: "#818cf8", fontFamily: "DMSans_400Regular" }]}>
              No episodes on {MONTHS[selectedMonth - 1]} {selectedDay}
              {isToday ? " — check back tomorrow." : "."}
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thisDayList}
          >
            {thisDayEpisodes.map(ep => (
              <ThisDayCard key={ep.slug} episode={ep} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: colors.primary, paddingTop: topPadding + 16 }]}>
        <View style={styles.heroRow}>
          {feed?.artworkUrl ? (
            <Image source={{ uri: feed.artworkUrl }} style={styles.heroArt} contentFit="cover" />
          ) : (
            <View style={[styles.heroArt, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
          )}
          <View style={styles.heroText}>
            <Text style={[styles.heroLabel, { color: colors.primaryForeground, opacity: 0.7, fontFamily: "DMSans_400Regular" }]}>
              EST. 2008
            </Text>
            <Text style={[styles.heroTitle, { color: colors.primaryForeground, fontFamily: "DMSans_700Bold" }]}>
              {feed?.title ?? "The Survival Podcast"}
            </Text>
            {feed?.totalEpisodes != null && (
              <Text style={[styles.heroSub, { color: colors.primaryForeground, opacity: 0.75, fontFamily: "DMSans_400Regular" }]}>
                {feed.totalEpisodes}+ episodes
              </Text>
            )}
          </View>
        </View>
      </View>

      {continueListening.length > 0 && (
        <View style={[styles.section, { paddingHorizontal: 16 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
            Continue Listening
          </Text>
          {continueListening.map((record) => (
            <ContinueListeningCard key={record.slug} record={record} />
          ))}
        </View>
      )}

      {featured && featured.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
            Latest
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          >
            {featured.map(ep => (
              <FeaturedCard key={ep.slug} episode={ep} />
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold", marginHorizontal: 16, marginBottom: 8 }]}>
        All Episodes
      </Text>

      {/* Date Picker Modal */}
      <Modal
        visible={datePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDatePickerVisible(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: "#1e1b4b" }]} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: "#e0e7ff", fontFamily: "DMSans_700Bold" }]}>
              Browse Any Date
            </Text>
            <Text style={[styles.modalSub, { color: "#818cf8", fontFamily: "DMSans_400Regular" }]}>
              Scroll to pick a month and day
            </Text>

            <View style={styles.wheelRow}>
              <WheelPicker
                items={MONTHS}
                selectedIndex={draftMonthIdx}
                onSelect={(i) => {
                  setDraftMonthIdx(i);
                  const max = daysInMonth(i + 1);
                  if (draftDayIdx >= max) setDraftDayIdx(max - 1);
                }}
              />
              <WheelPicker
                items={dayLabels}
                selectedIndex={Math.min(draftDayIdx, dayLabels.length - 1)}
                onSelect={setDraftDayIdx}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={resetToToday}
                style={[styles.modalBtnSecondary, { borderColor: "rgba(99, 102, 241, 0.4)" }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalBtnSecondaryText, { color: "#818cf8", fontFamily: "DMSans_500Medium" }]}>
                  Today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={applyDate}
                style={[styles.modalBtnPrimary, { backgroundColor: "#4f46e5" }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalBtnPrimaryText, { color: "#fff", fontFamily: "DMSans_600SemiBold" }]}>
                  Show Episodes
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
              <Ionicons name="radio-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                No episodes found
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  thisDaySection: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  thisDaySectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  thisDaySectionLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  dateLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  thisDaySectionDate: {
    fontSize: 22,
    lineHeight: 26,
  },
  backToTodayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  backToTodayText: {
    fontSize: 11,
  },
  thisDayList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  thisDayCard: {
    width: 220,
    minHeight: 130,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  thisDayCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  thisDayYearRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  thisDayYear: {
    fontSize: 20,
    lineHeight: 24,
  },
  thisDayEpBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  thisDayEpNum: {
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  thisDayArt: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  thisDayTitle: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  thisDayPlayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 4,
  },
  thisDayPlayText: {
    fontSize: 11,
  },
  thisDayEmpty: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: "center",
    gap: 8,
  },
  thisDayEmptyText: {
    fontSize: 13,
    textAlign: "center",
  },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroArt: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  heroLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 20,
    lineHeight: 24,
  },
  heroSub: {
    fontSize: 12,
  },
  section: {
    paddingTop: 20,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  featuredList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  featuredCard: {
    width: 220,
    height: 140,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
  },
  featuredArt: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  featuredContent: {
    flex: 1,
    padding: 12,
    justifyContent: "flex-end",
    gap: 4,
  },
  featuredEpNum: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  featuredTitle: {
    fontSize: 13,
    lineHeight: 17,
  },
  featuredPlayChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 2,
  },
  featuredPlayText: {
    fontSize: 11,
  },
  continueCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  continueArt: {
    width: 52,
    height: 52,
    borderRadius: 8,
    flexShrink: 0,
  },
  continueInfo: {
    flex: 1,
    gap: 3,
  },
  continueEpNum: {
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  continueTitle: {
    fontSize: 13,
    lineHeight: 17,
  },
  continueProgressTrack: {
    height: 3,
    borderRadius: 2,
    marginTop: 4,
    overflow: "hidden",
  },
  continueProgressFill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 2,
  },
  continueTime: {
    fontSize: 10,
    marginTop: 2,
  },
  continuePlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  center: {
    padding: 40,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(99, 102, 241, 0.4)",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    marginBottom: 24,
  },
  wheelRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
    padding: 8,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtnSecondary: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalBtnSecondaryText: {
    fontSize: 15,
  },
  modalBtnPrimary: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalBtnPrimaryText: {
    fontSize: 15,
  },
});
