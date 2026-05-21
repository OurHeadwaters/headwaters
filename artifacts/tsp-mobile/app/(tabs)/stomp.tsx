import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useStomp, DEFAULT_INTENT_LABELS } from "@/context/StompContext";
import { WoodCard } from "@/components/homestead/WoodCard";
import { FieldNoteCard } from "@/components/homestead/FieldNoteCard";
import { LanternGauge } from "@/components/homestead/LanternGauge";
import { GordBird } from "@/components/GordBird";
import { EmberBurst } from "@/components/EmberParticles";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

interface GroundEvent {
  id: number;
  title: string;
  description: string;
  hostName: string;
  eventDate: string;
  location: string;
  isOnline: boolean;
  priceDisplay: string;
  seats: number | null;
  rsvpCount: number;
  isFeatured: boolean;
  createdAt: string;
}

const RSVP_KEY = (id: number) => `workshop_rsvp_${id}`;
const SESSION_ID_KEY = "tsp_device_session_id";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

let _cachedSessionId: string | null = null;

async function getSessionId(): Promise<string> {
  if (_cachedSessionId) return _cachedSessionId;
  let id = await AsyncStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = generateUUID();
    await AsyncStorage.setItem(SESSION_ID_KEY, id);
  }
  _cachedSessionId = id;
  return id;
}

async function fetchUpcomingEvents(): Promise<GroundEvent[]> {
  const res = await fetch(`${API_BASE}/api/ground-events?status=upcoming&limit=5`);
  if (!res.ok) throw new Error("Failed to load workshops");
  const data = await res.json();
  return data.events as GroundEvent[];
}

async function postRsvp(id: number): Promise<void> {
  const sessionId = await getSessionId();
  const res = await fetch(`${API_BASE}/api/ground-events/${id}/rsvp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) throw new Error("Failed to RSVP");
}

function formatEventDate(d: string): string {
  try {
    return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function WorkshopCard({ event }: { event: GroundEvent }) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [rsvped, setRsvped] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(RSVP_KEY(event.id)).then((val) => {
      if (val === "1") setRsvped(true);
    });
  }, [event.id]);

  const { mutate: doRsvp, isPending } = useMutation({
    mutationFn: () => postRsvp(event.id),
    onSuccess: async () => {
      await AsyncStorage.setItem(RSVP_KEY(event.id), "1");
      setRsvped(true);
      queryClient.invalidateQueries({ queryKey: ["upcoming-workshops"] });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: () => {
      Alert.alert("Couldn't RSVP", "Please try again in a moment.");
    },
  });

  return (
    <WoodCard style={{ marginBottom: 10 }}>
      {event.isFeatured && (
        <View style={[workshopStyles.featuredBadge, { backgroundColor: colors.amberGold + "22" }]}>
          <Text style={[workshopStyles.featuredText, { color: colors.amberGold, fontFamily: "DMSans_600SemiBold" }]}>
            ⭐ Featured
          </Text>
        </View>
      )}
      <Text style={[workshopStyles.title, { color: colors.foreground, fontFamily: "Fraunces_700Bold" }]}>
        {event.title}
      </Text>
      <Text style={[workshopStyles.meta, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
        📅 {formatEventDate(event.eventDate)}
      </Text>
      <Text style={[workshopStyles.meta, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
        {event.isOnline ? "🌐 Online" : `📍 ${event.location}`}
        {event.seats ? `  ·  ${event.seats} seats` : ""}
      </Text>
      <Text style={[workshopStyles.meta, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
        🎟 {event.priceDisplay}  ·  hosted by {event.hostName}
      </Text>
      <Pressable
        onPress={() => { if (!rsvped && !isPending) doRsvp(); }}
        disabled={rsvped || isPending}
        style={({ pressed }) => [
          workshopStyles.rsvpBtn,
          {
            backgroundColor: rsvped
              ? colors.muted
              : pressed
              ? colors.primary + "cc"
              : colors.primary,
            opacity: isPending ? 0.6 : 1,
          },
        ]}
      >
        {isPending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={[workshopStyles.rsvpText, { color: rsvped ? colors.mutedForeground : "#fff", fontFamily: "DMSans_600SemiBold" }]}>
            {rsvped ? "✓ You're Going" : "I'm Going"}
          </Text>
        )}
      </Pressable>
    </WoodCard>
  );
}

const workshopStyles = StyleSheet.create({
  featuredBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  featuredText: { fontSize: 11, letterSpacing: 0.3 },
  title: { fontSize: 16, marginBottom: 6 },
  meta: { fontSize: 13, lineHeight: 20 },
  rsvpBtn: {
    marginTop: 12,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rsvpText: { fontSize: 15 },
});

function WorkshopsSection() {
  const colors = useColors();

  const { data: events, isLoading, isError } = useQuery({
    queryKey: ["upcoming-workshops"],
    queryFn: fetchUpcomingEvents,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
      <Text style={[sectionStyles.heading, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
        🛠 Upcoming Workshops
      </Text>
      <Text style={[sectionStyles.sub, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
        Community events from the Workshop Board
      </Text>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
      ) : isError ? (
        <WoodCard style={{ marginTop: 8 }}>
          <View style={sectionStyles.emptyInner}>
            <Text style={sectionStyles.emptyEmoji}>🌲</Text>
            <Text style={[sectionStyles.emptyText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              Couldn't load workshops right now
            </Text>
          </View>
        </WoodCard>
      ) : events && events.length > 0 ? (
        events.map((ev) => <WorkshopCard key={ev.id} event={ev} />)
      ) : (
        <WoodCard style={{ marginTop: 8 }}>
          <View style={sectionStyles.emptyInner}>
            <Text style={sectionStyles.emptyEmoji}>🏕</Text>
            <Text style={[sectionStyles.emptyText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              No workshops coming up yet — check back soon.
            </Text>
          </View>
        </WoodCard>
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  heading: { fontSize: 18, marginBottom: 4 },
  sub: { fontSize: 13, marginBottom: 12 },
  emptyInner: { alignItems: "center", paddingVertical: 18, gap: 10 },
  emptyEmoji: { fontSize: 30 },
  emptyText: { fontSize: 14, textAlign: "center" },
});

function getTimeColors(hour: number): readonly [string, string] {
  if (hour >= 5 && hour < 10)  return ["#7a5c2a", "#4a6822"] as const;
  if (hour >= 10 && hour < 17) return ["#2c4a36", "#3a6020"] as const;
  if (hour >= 17 && hour < 21) return ["#7a3a1e", "#4a2c18"] as const;
  return ["#1a2814", "#0e1a0a"] as const;
}

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12)  return "Good morning.";
  if (hour >= 12 && hour < 17) return "Good afternoon.";
  if (hour >= 17 && hour < 21) return "Good evening.";
  return "Still up?";
}

const REFLECT_PROMPTS = [
  "Name one thing you'll do today that nobody can take from you.",
  "What system did you rely on this week that you could replace with a skill?",
  "Which Zone needs the most stomping right now — 0, 1, or further out?",
  "Pick one: plant something, fix something, or learn something.",
  "Whose permission have you stopped waiting for? Whose are you still waiting on?",
  "What's one thing in your life that only runs because you keep feeding it?",
  "What would you do differently if you knew the grid went down next Tuesday?",
];

function getTodayPrompt(): string {
  const day = new Date().getDate();
  return REFLECT_PROMPTS[day % REFLECT_PROMPTS.length];
}

function StreakLanterns({
  log,
  streak,
  colors,
}: {
  log: { date: string; mode: "quick" | "deep" }[];
  streak: number;
  colors: ReturnType<typeof useColors>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const logSet = new Map(log.map((r) => [r.date, r.mode]));

  return (
    <View style={lanternStyles.row}>
      {days.map((d) => {
        const isToday = d === today;
        const mode = logSet.get(d);
        const done = !!mode;
        const isDeep = mode === "deep";
        const fillValue = done ? (isDeep ? 1 : 0.6) : isToday ? 0.1 : 0;
        const dayChar = ["S","M","T","W","T","F","S"][new Date(d + "T12:00:00").getDay()];
        return (
          <LanternGauge
            key={d}
            value={fillValue}
            size={40}
            label={dayChar}
          />
        );
      })}
      <View style={[lanternStyles.streakBadge, { backgroundColor: colors.amberGold + "22" }]}>
        <Ionicons name="flame" size={13} color={colors.amberGold} />
        <Text style={[lanternStyles.streakNum, { color: colors.amberGold, fontFamily: "DMSans_700Bold" }]}>
          {streak}
        </Text>
      </View>
    </View>
  );
}

const lanternStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 6, flexWrap: "wrap" },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 4,
    alignSelf: "center",
  },
  streakNum: { fontSize: 14 },
});

function IntentTile({
  label,
  checked,
  onPress,
  disabled,
  colors,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
  disabled: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        tileStyles.tileWrapper,
        { opacity: pressed ? 0.82 : 1 },
      ]}
    >
      <WoodCard style={{ flex: 1 }} noPadding>
        <View
          style={[
            tileStyles.tileInner,
            { backgroundColor: checked ? colors.primary : colors.card },
          ]}
        >
          <View style={tileStyles.row}>
            <View
              style={[
                tileStyles.check,
                {
                  borderColor: checked ? colors.amberGold : colors.woodBorder,
                  backgroundColor: checked ? colors.amberGold + "33" : "transparent",
                },
              ]}
            >
              {checked && <Ionicons name="checkmark" size={14} color={colors.amberGold} />}
            </View>
            <Text
              style={[
                tileStyles.label,
                {
                  color: checked ? colors.primaryForeground : colors.foreground,
                  fontFamily: "DMSans_500Medium",
                },
              ]}
              numberOfLines={2}
            >
              {label}
            </Text>
          </View>
        </View>
      </WoodCard>
    </Pressable>
  );
}

const tileStyles = StyleSheet.create({
  tileWrapper: { flex: 1, minHeight: 64 },
  tileInner: {
    borderRadius: 11,
    padding: 14,
    justifyContent: "center",
    minHeight: 64,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  check: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  label: { flex: 1, fontSize: 14, lineHeight: 19 },
});

function RenameSheet({
  intents,
  onSave,
  onDismiss,
  colors,
}: {
  intents: [string, string, string];
  onSave: (v: [string, string, string]) => void;
  onDismiss: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [vals, setVals] = useState<[string, string, string]>([...intents]);

  return (
    <WoodCard style={{ margin: 16 }}>
      <View style={[renameStyles.handle, { backgroundColor: colors.woodBorder }]} />
      <Text style={[renameStyles.title, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
        Name Your Three Stomps
      </Text>
      <Text style={[renameStyles.sub, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
        What three things do you want to tend every day?
      </Text>
      {([0, 1, 2] as const).map((i) => (
        <View key={i} style={renameStyles.inputRow}>
          <Text style={[renameStyles.inputNum, { color: colors.amberGold, fontFamily: "DMSans_700Bold" }]}>
            {i + 1}
          </Text>
          <TextInput
            value={vals[i]}
            onChangeText={(t) => {
              const next = [...vals] as [string, string, string];
              next[i] = t;
              setVals(next);
            }}
            placeholder={DEFAULT_INTENT_LABELS[i]}
            placeholderTextColor={colors.mutedForeground}
            style={[
              renameStyles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.muted,
                borderColor: colors.woodBorder,
                fontFamily: "DMSans_400Regular",
              },
            ]}
          />
        </View>
      ))}
      <View style={renameStyles.buttons}>
        <Pressable onPress={onDismiss} style={[renameStyles.btnSecondary, { borderColor: colors.woodBorder }]}>
          <Text style={[renameStyles.btnSecondaryText, { color: colors.mutedForeground, fontFamily: "DMSans_500Medium" }]}>
            Cancel
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            const filled = vals.map((v, i) => v.trim() || DEFAULT_INTENT_LABELS[i]) as [string, string, string];
            onSave(filled);
          }}
          style={[renameStyles.btnPrimary, { backgroundColor: colors.primary }]}
        >
          <Text style={[renameStyles.btnPrimaryText, { color: "#fff", fontFamily: "DMSans_600SemiBold" }]}>
            Save
          </Text>
        </Pressable>
      </View>
    </WoodCard>
  );
}

const renameStyles = StyleSheet.create({
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  title: { fontSize: 18, marginBottom: 4 },
  sub: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  inputNum: { fontSize: 18, width: 20 },
  input: {
    flex: 1, borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
  },
  buttons: { flexDirection: "row", gap: 10, marginTop: 8 },
  btnSecondary: {
    flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center",
  },
  btnSecondaryText: { fontSize: 15 },
  btnPrimary: {
    flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center",
  },
  btnPrimaryText: { fontSize: 15 },
});

export default function StompScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, setIntents, toggleIntent, quickStomp, markReflectShown } = useStomp();

  const [mode, setMode] = useState<"quick" | "deep">("quick");
  const [showRename, setShowRename] = useState(false);
  const [showReflect, setShowReflect] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hour, setHour] = useState(() => new Date().getHours());

  const prevStompedToday = useRef(state.stompedToday);

  const [bgTop, bgBottom] = getTimeColors(hour);
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const usingDefaults = state.intents.every((v, i) => v === DEFAULT_INTENT_LABELS[i]);

  useEffect(() => {
    const id = setInterval(() => setHour(new Date().getHours()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!prevStompedToday.current && state.stompedToday) {
      setShowCelebration(true);
    }
    prevStompedToday.current = state.stompedToday;
  }, [state.stompedToday]);

  useEffect(() => {
    if (state.stompedToday && !state.reflectShown) {
      const timer = setTimeout(() => setShowReflect(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [state.stompedToday, state.reflectShown]);

  const handleQuickStomp = useCallback(() => {
    if (state.stompedToday) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    quickStomp();
  }, [state.stompedToday, quickStomp]);

  const handleDeepToggle = useCallback(
    (idx: 0 | 1 | 2) => {
      if (state.stompedToday && state.intentsChecked[idx]) return;
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleIntent(idx);
    },
    [state, toggleIntent],
  );

  const handleReflectDismiss = useCallback(() => {
    setShowReflect(false);
    markReflectShown();
  }, [markReflectShown]);

  const prompt = getTodayPrompt();
  const allDeepChecked = state.intentsChecked.every(Boolean);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EmberBurst
        visible={showCelebration}
        onHide={() => setShowCelebration(false)}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPadding + 16, backgroundColor: bgTop }]}>
          <View style={[styles.headerGradientOverlay, { backgroundColor: bgBottom + "88" }]} />
          {state.stompedToday && (
            <GordBird mode="perch" perchSide="right" perchTop={topPadding + 4} delay={600} size={38} />
          )}
          <View style={styles.headerContent}>
            <Text style={[styles.greeting, { color: "rgba(255,255,255,0.7)", fontFamily: "DMSans_400Regular" }]}>
              {getGreeting(hour)}
            </Text>
            <Text style={[styles.headerTitle, { color: "#fff", fontFamily: "Fraunces_700Bold" }]}>
              Daily Stomp
            </Text>
            <View style={styles.pointsRow}>
              <Ionicons name="footsteps" size={14} color={colors.amberGold} />
              <Text style={[styles.points, { color: colors.amberGold, fontFamily: "DMSans_600SemiBold" }]}>
                {state.points} pts
              </Text>
              {state.stompedToday && (
                <View style={styles.doneChip}>
                  <Ionicons name="checkmark-circle" size={13} color="#4ade80" />
                  <Text style={[styles.doneText, { fontFamily: "DMSans_600SemiBold" }]}>
                    Stomped
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Streak lanterns */}
        <WoodCard style={{ margin: 16 }}>
          <StreakLanterns log={state.stompLog} streak={state.streak} colors={colors} />
        </WoodCard>

        {/* Default intent nudge */}
        {usingDefaults && !state.stompedToday && (
          <Pressable
            onPress={() => setShowRename(true)}
            style={[styles.nudge, { backgroundColor: colors.amberGold + "18", borderColor: colors.amberGold + "44" }]}
          >
            <Ionicons name="pencil" size={15} color={colors.amberGold} />
            <Text style={[styles.nudgeText, { color: colors.amberGold, fontFamily: "DMSans_500Medium" }]}>
              Name your three stomps to make this yours →
            </Text>
          </Pressable>
        )}

        {/* Mode selector */}
        {!state.stompedToday && (
          <View style={[styles.modeRow, { backgroundColor: colors.muted, borderColor: colors.woodBorder }]}>
            {(["quick", "deep"] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[
                  styles.modeBtn,
                  {
                    backgroundColor: mode === m ? colors.primary : "transparent",
                    borderRadius: 8,
                  },
                ]}
              >
                <Ionicons
                  name={m === "quick" ? "flash" : "footsteps"}
                  size={14}
                  color={mode === m ? "#fff" : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.modeBtnText,
                    { color: mode === m ? "#fff" : colors.mutedForeground, fontFamily: "DMSans_600SemiBold" },
                  ]}
                >
                  {m === "quick" ? "Quick (+10)" : "Deep (+25)"}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Intent tiles */}
        {(!state.stompedToday && mode === "deep") || state.stompedToday ? (
          <View style={styles.tilesGrid}>
            {([0, 1, 2] as const).map((i) => (
              <IntentTile
                key={i}
                label={state.intents[i]}
                checked={state.intentsChecked[i]}
                onPress={() => handleDeepToggle(i)}
                disabled={state.stompedToday}
                colors={colors}
              />
            ))}
          </View>
        ) : null}

        {/* Quick stomp CTA */}
        {!state.stompedToday && mode === "quick" && (
          <Pressable
            onPress={handleQuickStomp}
            style={({ pressed }) => [
              styles.quickBtn,
              { backgroundColor: colors.amberGold, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="flash" size={20} color="#1C1008" />
            <Text style={[styles.quickBtnText, { color: "#1C1008", fontFamily: "DMSans_700Bold" }]}>
              Stomp All Three
            </Text>
          </Pressable>
        )}

        {/* Post-stomp reflection — field note style */}
        {showReflect && (
          <FieldNoteCard
            title="REFLECT — take a moment"
            defaultOpen
            style={{ marginHorizontal: 16, marginTop: 16 }}
          >
            <Text style={[styles.reflectPrompt, { color: colors.woodBrown, fontFamily: "DMSans_400Regular" }]}>
              {prompt}
            </Text>
            <Pressable onPress={handleReflectDismiss} style={styles.reflectDismiss}>
              <Text style={[styles.reflectDismissText, { color: colors.mutedForeground, fontFamily: "DMSans_500Medium" }]}>
                I've thought about it →
              </Text>
            </Pressable>
          </FieldNoteCard>
        )}

        {/* Rename link */}
        {!showRename && (
          <Pressable onPress={() => setShowRename(true)} style={styles.renameLink}>
            <Ionicons name="create-outline" size={14} color={colors.mutedForeground} />
            <Text style={[styles.renameLinkText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              {usingDefaults ? "Rename your intentions" : "Edit intentions"}
            </Text>
          </Pressable>
        )}

        {/* Rename sheet */}
        {showRename && (
          <RenameSheet
            intents={state.intents}
            onSave={(v) => { setIntents(v); setShowRename(false); }}
            onDismiss={() => setShowRename(false)}
            colors={colors}
          />
        )}

        {/* Upcoming Workshops */}
        <WorkshopsSection />

        {/* How it works — field manual */}
        <View style={{ marginTop: 16 }}>
          <FieldNoteCard
            title="Field Manual — How Stomping Works"
            style={{ marginHorizontal: 16 }}
          >
            {[
              { icon: "flash" as const, text: "Quick Stomp: one tap, all three done. +10 pts." },
              { icon: "footsteps" as const, text: "Deep Stomp: tap each intention you actually tended. +25 pts." },
              { icon: "flame" as const, text: "Stomp every day to build your streak — watch the lanterns fill." },
              { icon: "pencil" as const, text: "Name your intentions anything — they're yours, not a curriculum." },
            ].map((r, i) => (
              <View key={i} style={styles.howRow}>
                <Ionicons name={r.icon} size={16} color={colors.woodBrown} style={{ width: 22 }} />
                <Text style={[styles.howText, { color: colors.foreground, fontFamily: "DMSans_400Regular" }]}>
                  {r.text}
                </Text>
              </View>
            ))}
          </FieldNoteCard>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 4,
    overflow: "hidden",
  },
  headerGradientOverlay: { ...StyleSheet.absoluteFillObject, top: "40%" },
  headerContent: { gap: 4, zIndex: 1 },
  greeting: { fontSize: 13 },
  headerTitle: { fontSize: 28 },
  pointsRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  points: { fontSize: 14 },
  doneChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(74, 222, 128, 0.15)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 4,
  },
  doneText: { fontSize: 12, color: "#4ade80" },
  nudge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  nudgeText: { fontSize: 13, flex: 1 },
  modeRow: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 4,
    gap: 4,
    marginHorizontal: 16,
    marginTop: 14,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  modeBtnText: { fontSize: 14 },
  tilesGrid: { marginHorizontal: 16, marginTop: 12, gap: 10 },
  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 18,
    borderRadius: 16,
  },
  quickBtnText: { fontSize: 17 },
  reflectPrompt: { fontSize: 15, lineHeight: 22, marginBottom: 10 },
  reflectDismiss: { alignSelf: "flex-start" },
  reflectDismissText: { fontSize: 13 },
  renameLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    marginTop: 20,
    paddingVertical: 8,
  },
  renameLinkText: { fontSize: 13 },
  howRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  howText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
