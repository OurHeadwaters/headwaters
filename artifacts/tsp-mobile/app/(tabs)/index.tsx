import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useGetFeaturedEpisodes, useGetFeed, useListEpisodes, useGetThisDayEpisodes } from "@workspace/api-client-react";
import { TAGLINE } from "@workspace/tsp-constants";
import type { Episode, ThisDayEpisode } from "@workspace/api-client-react";
import React, { useState, useRef, useEffect } from "react";
import { useHistory } from "@/context/HistoryContext";
import type { PlaybackRecord } from "@/context/HistoryContext";
import {
  ActivityIndicator,
  Animated,
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
import { WoodCard } from "@/components/homestead/WoodCard";
import { GordBird } from "@/components/GordBird";
import { EmberParticles } from "@/components/EmberParticles";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";

const PAGE_SIZE = 20;
const MINI_PLAYER_HEIGHT = 64;

function getTimeHeaderColor(hour: number): string {
  if (hour >= 5 && hour < 10)  return "#7a5c2a";
  if (hour >= 10 && hour < 17) return "#2c4a36";
  if (hour >= 17 && hour < 21) return "#7a3a1e";
  return "#1a2814";
}

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
  container: { flex: 1, overflow: "hidden", position: "relative" },
  item: { height: ITEM_HEIGHT, justifyContent: "center", alignItems: "center" },
  selectedItem: {},
  itemText: { fontSize: 16, color: "rgba(199, 210, 254, 0.5)" },
  selectedText: { color: "#e0e7ff", fontSize: 18 },
  highlightTop: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: 2 * ITEM_HEIGHT, backgroundColor: "rgba(30, 27, 75, 0.7)",
  },
  highlightBottom: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: 2 * ITEM_HEIGHT, backgroundColor: "rgba(30, 27, 75, 0.7)",
  },
  selectionBar: {
    position: "absolute", top: 2 * ITEM_HEIGHT, left: 8, right: 8,
    height: 1, backgroundColor: "rgba(99, 102, 241, 0.4)",
  },
});

function yearsAgo(year: number): number {
  return new Date().getFullYear() - year;
}

function formatFullDate(pubDate: string): string {
  const d = new Date(pubDate);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function ThisDayCard({ episode }: { episode: ThisDayEpisode }) {
  const colors = useColors();
  const { play, seek } = usePlayer();
  const year = new Date(episode.pubDate).getUTCFullYear();
  const ago = yearsAgo(year);
  const fullDate = formatFullDate(episode.pubDate);

  const handlePlay = async () => {
    if (!episode.audioUrl) return;
    await play({
      slug: episode.slug, title: episode.title, audioUrl: episode.audioUrl,
      artworkUrl: episode.artworkUrl, durationSeconds: episode.durationSeconds,
      episodeNumber: episode.episodeNumber,
    });
    if (episode.historyTimestamp && episode.historyTimestamp > 0) {
      setTimeout(() => seek(episode.historyTimestamp! * 1000), 800);
    }
  };

  return (
    <Pressable
      onPress={() => router.push(`/episode/${episode.slug}`)}
      style={({ pressed }) => [
        styles.thisDayCard,
        { backgroundColor: colors.woodBrown + "22", borderColor: colors.woodBorder, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.thisDayCardTop}>
        <View style={styles.thisDayYearCol}>
          <View style={styles.thisDayYearRow}>
            <Text style={[styles.thisDayYear, { color: colors.amberGold, fontFamily: "DMSans_700Bold" }]}>
              {year}
            </Text>
            {episode.episodeNumber != null && (
              <View style={[styles.thisDayEpBadge, { backgroundColor: colors.woodBrown + "33", borderColor: colors.woodBrown + "55" }]}>
                <Text style={[styles.thisDayEpNum, { color: colors.woodLight, fontFamily: "DMSans_600SemiBold" }]}>
                  EP {episode.episodeNumber}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.thisDayFullDate, { color: colors.amberGold, fontFamily: "DMSans_500Medium" }]}>
            {fullDate}
          </Text>
          {ago > 0 && (
            <Text style={[styles.thisDayAgoText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              {ago === 1 ? "1 year ago" : `${ago} years ago`}
            </Text>
          )}
        </View>
        {episode.artworkUrl ? (
          <Image source={{ uri: episode.artworkUrl }} style={styles.thisDayArt} contentFit="cover" />
        ) : null}
      </View>
      <Text style={[styles.thisDayTitle, { color: colors.foreground, fontFamily: "DMSans_600SemiBold" }]} numberOfLines={2}>
        {episode.title}
      </Text>
      <Pressable
        onPress={handlePlay}
        style={({ pressed }) => [
          styles.thisDayPlayBtn,
          { backgroundColor: pressed ? colors.woodBrown : colors.amberGold },
        ]}
      >
        <Ionicons name="play" size={11} color="#1C1008" />
        <Text style={[styles.thisDayPlayText, { color: "#1C1008", fontFamily: "DMSans_600SemiBold" }]}>
          {episode.historyTimestamp && episode.historyTimestamp > 0
            ? `Play @ ${formatTimestamp(episode.historyTimestamp)}`
            : "Play"}
        </Text>
      </Pressable>
    </Pressable>
  );
}

function formatProgress(positionMs: number): string {
  const totalSec = Math.floor(positionMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ContinueListeningCard({ record }: { record: PlaybackRecord }) {
  const colors = useColors();
  const { play } = usePlayer();

  const progress = record.durationSeconds && record.durationSeconds > 0
    ? Math.min(1, record.positionMs / (record.durationSeconds * 1000))
    : 0;

  return (
    <WoodCard style={{ marginBottom: 10 }}>
      <Pressable
        onPress={() => router.push(`/episode/${record.slug}`)}
        style={({ pressed }) => [
          styles.continueCardInner,
          { opacity: pressed ? 0.85 : 1 },
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
            <Text style={[styles.continueEpNum, { color: colors.amberGold, fontFamily: "DMSans_600SemiBold" }]}>
              EP {record.episodeNumber}
            </Text>
          )}
          <Text style={[styles.continueTitle, { color: colors.foreground, fontFamily: "DMSans_500Medium" }]} numberOfLines={2}>
            {record.title}
          </Text>
          <View style={[styles.continueProgressTrack, { backgroundColor: colors.muted }]}>
            <View
              style={[styles.continueProgressFill, { width: `${progress * 100}%`, backgroundColor: colors.lanternGlow }]}
            />
          </View>
          <Text style={[styles.continueTime, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
            {record.durationSeconds && record.durationSeconds > 0
              ? `${formatProgress(Math.max(0, record.durationSeconds * 1000 - record.positionMs))} left`
              : `${formatProgress(record.positionMs)} played`}
          </Text>
        </View>
        <Pressable
          onPress={() => play({ slug: record.slug, title: record.title, audioUrl: record.audioUrl, artworkUrl: record.artworkUrl, durationSeconds: record.durationSeconds, episodeNumber: record.episodeNumber })}
          style={[styles.continuePlayBtn, { backgroundColor: colors.primary }]}
          hitSlop={8}
        >
          <Ionicons name="play" size={14} color="#fff" />
        </Pressable>
      </Pressable>
    </WoodCard>
  );
}

function FeaturedCard({ episode }: { episode: Episode }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={() => router.push(`/episode/${episode.slug}`)}
      style={({ pressed }) => [
        styles.featuredCard,
        { borderColor: colors.woodBorder, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      {episode.artworkUrl ? (
        <Image source={{ uri: episode.artworkUrl }} style={styles.featuredArt} contentFit="cover" />
      ) : (
        <View style={[styles.featuredArt, { backgroundColor: colors.forestMid }]} />
      )}
      <View style={styles.featuredOverlay} />
      <View style={styles.featuredContent}>
        {episode.episodeNumber != null && (
          <Text style={[styles.featuredEpNum, { color: colors.lanternWarm, fontFamily: "DMSans_600SemiBold" }]}>
            EP {episode.episodeNumber}
          </Text>
        )}
        <Text style={[styles.featuredTitle, { color: "#fff", fontFamily: "DMSans_700Bold" }]} numberOfLines={2}>
          {episode.title}
        </Text>
        <View style={[styles.featuredPlayChip, { backgroundColor: colors.amberGold }]}>
          <Ionicons name="play" size={12} color="#1C1008" />
          <Text style={[styles.featuredPlayText, { color: "#1C1008", fontFamily: "DMSans_600SemiBold" }]}>
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
  const { continueListening, isReady: historyReady } = useHistory();
  const [page, setPage] = useState(0);
  const [allEpisodes, setAllEpisodes] = useState<Episode[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [hour, setHour] = useState(() => new Date().getHours());
  const [showProgressHint, setShowProgressHint] = useState(false);
  const progressHintOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setInterval(() => setHour(new Date().getHours()), 60_000);
    return () => clearInterval(id);
  }, []);

  const skeletonOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (historyReady) {
      skeletonOpacity.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonOpacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(skeletonOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [historyReady]);

  useEffect(() => {
    if (historyReady) {
      setShowProgressHint(false);
      progressHintOpacity.setValue(0);
      return;
    }
    const timer = setTimeout(() => {
      setShowProgressHint(true);
      Animated.timing(progressHintOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 1500);
    return () => clearTimeout(timer);
  }, [historyReady]);

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
    month: selectedMonth, day: selectedDay,
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

  const isToday = selectedMonth === today.getMonth() + 1 && selectedDay === today.getDate();
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
      {/* Full-bleed Hero */}
      <View
        style={[
          styles.hero,
          { backgroundColor: getTimeHeaderColor(hour), paddingTop: topPadding + 16 },
        ]}
      >
        <EmberParticles count={10} />
        <GordBird mode="perch" perchSide="right" perchTop={topPadding + 8} delay={800} size={40} />
        <View style={styles.heroRow}>
          {feed?.artworkUrl ? (
            <Image source={{ uri: feed.artworkUrl }} style={styles.heroArt} contentFit="cover" />
          ) : (
            <View style={[styles.heroArt, { backgroundColor: "rgba(255,255,255,0.12)" }]} />
          )}
          <View style={styles.heroText}>
            <Text style={[styles.heroLabel, { color: "rgba(255,255,255,0.6)", fontFamily: "DMSans_400Regular" }]}>
              EST. 2008 · THE STOMPING PATH
            </Text>
            <Text style={[styles.heroHeading, { color: "#F5C842", fontFamily: "Fraunces_700Bold" }]}>
              Mobile on the{"\n"}Stomping Path
            </Text>
            <Text style={[styles.heroTagline, { color: "rgba(255,255,255,0.8)", fontFamily: "DMSans_400Regular" }]}>
              {TAGLINE}
            </Text>
          </View>
        </View>
        {feed?.totalEpisodes != null && (
          <View style={[styles.heroBadge, { backgroundColor: "rgba(0,0,0,0.25)" }]}>
            <Ionicons name="radio" size={12} color={colors.lanternWarm} />
            <Text style={[styles.heroBadgeText, { color: colors.lanternWarm, fontFamily: "DMSans_600SemiBold" }]}>
              {feed.totalEpisodes}+ episodes in the archive
            </Text>
          </View>
        )}
      </View>

      {/* This Day in History — tool station */}
      <View style={[styles.toolStation, { backgroundColor: colors.forestDeep }]}>
        <View style={styles.stationLabel}>
          <Ionicons name="time" size={13} color={colors.amberGold} />
          <Text style={[styles.stationLabelText, { color: colors.amberGold, fontFamily: "DMSans_600SemiBold" }]}>
            THIS DAY IN HISTORY
          </Text>
        </View>
        <View style={styles.thisDaySectionHeader}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={openDatePicker} style={styles.dateLabelRow} activeOpacity={0.7}>
              <Text style={[styles.thisDaySectionDate, { color: colors.lanternWarm, fontFamily: "DMSans_700Bold" }]}>
                {dateLabel}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.amberGold} style={{ marginTop: 3 }} />
            </TouchableOpacity>
            {!isToday && (
              <TouchableOpacity onPress={resetToToday} style={styles.backToTodayBtn} activeOpacity={0.7}>
                <Ionicons name="refresh" size={11} color={colors.amberGold} />
                <Text style={[styles.backToTodayText, { color: colors.amberGold, fontFamily: "DMSans_400Regular" }]}>
                  Back to today
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {thisDayLoading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thisDayList}>
            {Array.from({ length: 3 }).map((_, i) => (
              <View key={i} style={[styles.thisDayCard, { backgroundColor: colors.woodBrown + "15", borderColor: colors.woodBorder }]} />
            ))}
          </ScrollView>
        ) : !thisDayEpisodes || thisDayEpisodes.length === 0 ? (
          <View style={styles.thisDayEmpty}>
            <Ionicons name="time-outline" size={28} color={colors.mutedForeground} />
            <Text style={[styles.thisDayEmptyText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              No episodes on {MONTHS[selectedMonth - 1]} {selectedDay}
              {isToday ? " — check back tomorrow." : "."}
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thisDayList}>
            {[...thisDayEpisodes]
              .sort((a, b) => new Date(a.pubDate).getUTCFullYear() - new Date(b.pubDate).getUTCFullYear())
              .map(ep => (
                <ThisDayCard key={ep.slug} episode={ep} />
              ))}
          </ScrollView>
        )}
      </View>

      {/* Continue Listening — tool station */}
      {!historyReady ? (
        <View style={[styles.section, { paddingHorizontal: 16 }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="headset" size={15} color={colors.woodBrown} />
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
              Continue Listening
            </Text>
          </View>
          <Animated.View style={{ opacity: skeletonOpacity }}>
            {[0, 1].map((i) => (
              <View key={i} style={[styles.continueSkeletonRow, { backgroundColor: colors.muted }]}>
                <View style={[styles.continueSkeletonArt, { backgroundColor: colors.woodBorder }]} />
                <View style={styles.continueSkeletonInfo}>
                  <View style={[styles.continueSkeletonLine, { width: "60%", backgroundColor: colors.woodBorder }]} />
                  <View style={[styles.continueSkeletonLine, { width: "85%", backgroundColor: colors.woodBorder, marginTop: 6 }]} />
                  <View style={[styles.continueSkeletonBar, { backgroundColor: colors.woodBorder }]} />
                </View>
                <View style={[styles.continueSkeletonBtn, { backgroundColor: colors.woodBorder }]} />
              </View>
            ))}
          </Animated.View>
          {showProgressHint && (
            <Animated.Text style={[styles.progressHintLabel, { opacity: progressHintOpacity, color: colors.woodBrown }]}>
              Fetching your progress…
            </Animated.Text>
          )}
        </View>
      ) : continueListening.length > 0 ? (
        <View style={[styles.section, { paddingHorizontal: 16 }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="headset" size={15} color={colors.woodBrown} />
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
              Continue Listening
            </Text>
          </View>
          {continueListening.map((record) => (
            <ContinueListeningCard key={record.slug} record={record} />
          ))}
        </View>
      ) : null}

      {/* Latest Episodes — radio shack corner */}
      {featured && featured.length > 0 && (
        <View style={styles.section}>
          <View style={[styles.sectionHeaderRow, { paddingHorizontal: 16 }]}>
            <Ionicons name="radio" size={15} color={colors.woodBrown} />
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
              Latest from the Path
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredList}>
            {featured.map(ep => (
              <FeaturedCard key={ep.slug} episode={ep} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Ambient Listening Callout */}
      <TouchableOpacity
        onPress={() => router.push("/(tabs)/stomp")}
        activeOpacity={0.85}
        style={[styles.ambientCallout, { backgroundColor: colors.forestDeep, borderColor: colors.woodBorder }]}
      >
        <View style={[styles.ambientIconWrap, { backgroundColor: colors.forestMid }]}>
          <Ionicons name="mic" size={18} color={colors.amberGold} />
        </View>
        <View style={styles.ambientBody}>
          <Text style={[styles.ambientLabel, { color: colors.amberGold, fontFamily: "DMSans_700Bold" }]}>
            SIGNAL → EXTINGUISHER
          </Text>
          <Text style={[styles.ambientText, { color: colors.woodLight, fontFamily: "DMSans_400Regular" }]}>
            No new meetings. No pitch deck. Bobbie observes through the channels your community already uses — listening for friction before it becomes a crisis.
          </Text>
          <Text style={[styles.ambientSub, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
            Zero disruption. Problems surface the moment they happen.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.amberGold} style={styles.ambientChevron} />
      </TouchableOpacity>

      <View style={[styles.sectionHeaderRow, { paddingHorizontal: 16, marginBottom: 8 }]}>
        <Ionicons name="albums" size={15} color={colors.woodBrown} />
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
          All Episodes
        </Text>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={datePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDatePickerVisible(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.forestDeep, borderColor: colors.woodBorder }]} onPress={() => {}}>
            <View style={[styles.modalHandle, { backgroundColor: colors.woodBorder }]} />
            <Text style={[styles.modalTitle, { color: colors.lanternWarm, fontFamily: "DMSans_700Bold" }]}>
              Browse Any Date
            </Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              Scroll to pick a month and day
            </Text>

            <View style={[styles.wheelRow, { borderColor: colors.woodBorder + "55", backgroundColor: colors.forestMid }]}>
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
                style={[styles.modalBtnSecondary, { borderColor: colors.woodBorder }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalBtnSecondaryText, { color: colors.mutedForeground, fontFamily: "DMSans_500Medium" }]}>
                  Today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={applyDate}
                style={[styles.modalBtnPrimary, { backgroundColor: colors.amberGold }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalBtnPrimaryText, { color: "#1C1008", fontFamily: "DMSans_600SemiBold" }]}>
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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        scrollEnabled={!!(allEpisodes.length > 0 || isLoading)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    overflow: "hidden",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 12,
  },
  heroArt: {
    width: 70,
    height: 70,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(212,168,67,0.5)",
  },
  heroText: { flex: 1, gap: 4 },
  heroLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  heroHeading: {
    fontSize: 22,
    lineHeight: 26,
  },
  heroTagline: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 4,
  },
  heroBadgeText: { fontSize: 11 },
  toolStation: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  stationLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  stationLabelText: {
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  thisDaySectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  dateLabelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  thisDaySectionDate: { fontSize: 22, lineHeight: 26 },
  backToTodayBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  backToTodayText: { fontSize: 11 },
  thisDayList: { paddingHorizontal: 16, gap: 10 },
  thisDayCard: {
    width: 220,
    minHeight: 130,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1.5,
    padding: 12,
    gap: 6,
  },
  thisDayCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  thisDayYearCol: { flexDirection: "column", gap: 2, flex: 1 },
  thisDayYearRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  thisDayFullDate: { fontSize: 11, lineHeight: 14, opacity: 0.9 },
  thisDayAgoText: { fontSize: 10, lineHeight: 13 },
  thisDayYear: { fontSize: 20, lineHeight: 24 },
  thisDayEpBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2 },
  thisDayEpNum: { fontSize: 9, letterSpacing: 0.5, textTransform: "uppercase" },
  thisDayArt: { width: 36, height: 36, borderRadius: 6 },
  thisDayTitle: { fontSize: 12, lineHeight: 16, flex: 1 },
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
  thisDayPlayText: { fontSize: 11 },
  thisDayEmpty: { paddingHorizontal: 16, paddingVertical: 20, alignItems: "center", gap: 8 },
  thisDayEmptyText: { fontSize: 13, textAlign: "center" },
  section: { paddingTop: 20, paddingBottom: 4 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16 },
  featuredList: { paddingHorizontal: 16, gap: 10 },
  featuredCard: {
    width: 220,
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
  },
  featuredArt: { ...StyleSheet.absoluteFillObject },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  featuredContent: {
    flex: 1,
    padding: 12,
    justifyContent: "flex-end",
    gap: 4,
  },
  featuredEpNum: { fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
  featuredTitle: { fontSize: 13, lineHeight: 17 },
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
  featuredPlayText: { fontSize: 11 },
  continueCardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
  },
  continueArt: { width: 52, height: 52, borderRadius: 8, flexShrink: 0 },
  continueInfo: { flex: 1, gap: 3 },
  continueEpNum: { fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase" },
  continueTitle: { fontSize: 13, lineHeight: 17 },
  continueProgressTrack: { height: 4, borderRadius: 2, marginTop: 4, overflow: "hidden" },
  continueProgressFill: { position: "absolute", top: 0, left: 0, bottom: 0, borderRadius: 2 },
  continueTime: { fontSize: 10, marginTop: 2 },
  continuePlayBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  continueSkeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    opacity: 0.6,
  },
  continueSkeletonArt: { width: 52, height: 52, borderRadius: 8, flexShrink: 0 },
  continueSkeletonInfo: { flex: 1, gap: 0 },
  continueSkeletonLine: { height: 10, borderRadius: 5 },
  continueSkeletonBar: { height: 4, borderRadius: 2, marginTop: 10, width: "100%" },
  continueSkeletonBtn: { width: 32, height: 32, borderRadius: 16, flexShrink: 0 },
  progressHintLabel: { fontSize: 12, textAlign: "center", marginTop: 10, fontFamily: "DMSans_400Regular" },
  center: { padding: 40, alignItems: "center", gap: 8 },
  emptyText: { fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: "center", marginBottom: 20,
  },
  modalTitle: { fontSize: 20, marginBottom: 4 },
  modalSub: { fontSize: 13, marginBottom: 24 },
  wheelRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    padding: 8,
  },
  modalButtons: { flexDirection: "row", gap: 12 },
  modalBtnSecondary: {
    flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center",
  },
  modalBtnSecondaryText: { fontSize: 15 },
  modalBtnPrimary: { flex: 2, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  modalBtnPrimaryText: { fontSize: 15 },
  ambientCallout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  ambientIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  ambientBody: { flex: 1, gap: 4 },
  ambientLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  ambientText: { fontSize: 12, lineHeight: 17 },
  ambientSub: { fontSize: 11, lineHeight: 15 },
  ambientChevron: { flexShrink: 0, marginTop: 2 },
});
