import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState, useEffect, useCallback } from "react";
import {
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
import { useColors } from "@/hooks/useColors";
import { useStomp, DEFAULT_INTENT_LABELS } from "@/context/StompContext";

// ─── Time-of-day gradient colours ─────────────────────────────────────────────

function getTimeColors(hour: number): readonly [string, string] {
  if (hour >= 5 && hour < 10)  return ["#7a5c2a", "#4a6822"] as const; // dawn
  if (hour >= 10 && hour < 17) return ["#2c4a36", "#3a6020"] as const; // day
  if (hour >= 17 && hour < 21) return ["#7a3a1e", "#4a2c18"] as const; // dusk
  return ["#1a2814", "#0e1a0a"] as const;                               // night
}

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12)  return "Good morning.";
  if (hour >= 12 && hour < 17) return "Good afternoon.";
  if (hour >= 17 && hour < 21) return "Good evening.";
  return "Still up?";
}

// ─── Reflection prompts ────────────────────────────────────────────────────────

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

// ─── 7-day streak dots ─────────────────────────────────────────────────────────

function StreakDots({
  log,
  streak,
  stompedToday,
  colors,
}: {
  log: { date: string; mode: "quick" | "deep" }[];
  streak: number;
  stompedToday: boolean;
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
    <View style={dotStyles.row}>
      {days.map((d) => {
        const isToday = d === today;
        const mode = logSet.get(d);
        const done = !!mode;
        const isDeep = mode === "deep";
        return (
          <View key={d} style={dotStyles.col}>
            <View
              style={[
                dotStyles.dot,
                done
                  ? { backgroundColor: isDeep ? colors.primary : "#60a5fa" }
                  : isToday
                  ? { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.primary }
                  : { backgroundColor: colors.muted },
              ]}
            >
              {done && (
                <Ionicons
                  name={isDeep ? "footsteps" : "flash"}
                  size={9}
                  color="#fff"
                />
              )}
            </View>
            <Text style={[dotStyles.label, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              {["S","M","T","W","T","F","S"][new Date(d + "T12:00:00").getDay()]}
            </Text>
          </View>
        );
      })}
      <View style={[dotStyles.streakBadge, { backgroundColor: colors.primary + "22" }]}>
        <Ionicons name="flame" size={13} color={colors.primary} />
        <Text style={[dotStyles.streakNum, { color: colors.primary, fontFamily: "DMSans_700Bold" }]}>
          {streak}
        </Text>
      </View>
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  col: { alignItems: "center", gap: 3 },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 9, letterSpacing: 0.5 },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 4,
  },
  streakNum: { fontSize: 14 },
});

// ─── Intent tile ───────────────────────────────────────────────────────────────

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
        tileStyles.tile,
        {
          backgroundColor: checked ? colors.primary : colors.muted,
          borderColor: checked ? colors.primary : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={tileStyles.row}>
        <View
          style={[
            tileStyles.check,
            {
              borderColor: checked ? "#fff" : colors.mutedForeground,
              backgroundColor: checked ? "#ffffff33" : "transparent",
            },
          ]}
        >
          {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        <Text
          style={[
            tileStyles.label,
            {
              color: checked ? "#fff" : colors.foreground,
              fontFamily: "DMSans_500Medium",
            },
          ]}
          numberOfLines={2}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const tileStyles = StyleSheet.create({
  tile: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flex: 1,
    minHeight: 64,
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { flex: 1, fontSize: 14, lineHeight: 19 },
});

// ─── Rename sheet ──────────────────────────────────────────────────────────────

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
    <View style={[renameStyles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={renameStyles.handle} />
      <Text style={[renameStyles.title, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
        Name Your Three Stomps
      </Text>
      <Text style={[renameStyles.sub, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
        What three things do you want to tend every day? Name them anything.
      </Text>
      {([0, 1, 2] as const).map((i) => (
        <View key={i} style={renameStyles.inputRow}>
          <Text style={[renameStyles.inputNum, { color: colors.primary, fontFamily: "DMSans_700Bold" }]}>
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
                borderColor: colors.border,
                fontFamily: "DMSans_400Regular",
              },
            ]}
          />
        </View>
      ))}
      <View style={renameStyles.buttons}>
        <Pressable
          onPress={onDismiss}
          style={[renameStyles.btnSecondary, { borderColor: colors.border }]}
        >
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
    </View>
  );
}

const renameStyles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 24,
    paddingTop: 12,
    gap: 14,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(128,128,128,0.3)",
    marginBottom: 8,
  },
  title: { fontSize: 18 },
  sub: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  inputNum: { fontSize: 18, width: 20 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  buttons: { flexDirection: "row", gap: 10, marginTop: 4 },
  btnSecondary: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnSecondaryText: { fontSize: 15 },
  btnPrimary: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnPrimaryText: { fontSize: 15 },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function StompScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, setIntents, toggleIntent, quickStomp, markReflectShown } = useStomp();

  const [mode, setMode] = useState<"quick" | "deep">("quick");
  const [showRename, setShowRename] = useState(false);
  const [showReflect, setShowReflect] = useState(false);
  const [hour, setHour] = useState(() => new Date().getHours());

  const [bgTop, bgBottom] = getTimeColors(hour);
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const usingDefaults = state.intents.every(
    (v, i) => v === DEFAULT_INTENT_LABELS[i],
  );

  useEffect(() => {
    const id = setInterval(() => setHour(new Date().getHours()), 60_000);
    return () => clearInterval(id);
  }, []);

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {/* ── Header ── */}
        <View
          style={[
            styles.header,
            { paddingTop: topPadding + 16, backgroundColor: bgTop },
          ]}
        >
          <View style={[styles.headerGradientOverlay, { backgroundColor: bgBottom + "88" }]} />
          <View style={styles.headerContent}>
            <Text
              style={[styles.greeting, { color: "rgba(255,255,255,0.7)", fontFamily: "DMSans_400Regular" }]}
            >
              {getGreeting(hour)}
            </Text>
            <Text style={[styles.headerTitle, { color: "#fff", fontFamily: "DMSans_700Bold" }]}>
              Daily Stomp
            </Text>
            <View style={styles.pointsRow}>
              <Ionicons name="footsteps" size={14} color="#D9A066" />
              <Text style={[styles.points, { color: "#D9A066", fontFamily: "DMSans_600SemiBold" }]}>
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

        {/* ── Streak dots ── */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <StreakDots
            log={state.stompLog}
            streak={state.streak}
            stompedToday={state.stompedToday}
            colors={colors}
          />
        </View>

        {/* ── Default intent nudge ── */}
        {usingDefaults && !state.stompedToday && (
          <Pressable
            onPress={() => setShowRename(true)}
            style={[styles.nudge, { backgroundColor: "#D9A066" + "22", borderColor: "#D9A066" + "55" }]}
          >
            <Ionicons name="pencil" size={15} color="#D9A066" />
            <Text style={[styles.nudgeText, { color: "#D9A066", fontFamily: "DMSans_500Medium" }]}>
              Name your three stomps to make this yours →
            </Text>
          </Pressable>
        )}

        {/* ── Mode selector ── */}
        {!state.stompedToday && (
          <View style={[styles.modeRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
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
                    {
                      color: mode === m ? "#fff" : colors.mutedForeground,
                      fontFamily: "DMSans_600SemiBold",
                    },
                  ]}
                >
                  {m === "quick" ? "Quick (+10)" : "Deep (+25)"}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Intent tiles (deep mode) ── */}
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

        {/* ── Quick stomp CTA ── */}
        {!state.stompedToday && mode === "quick" && (
          <Pressable
            onPress={handleQuickStomp}
            style={({ pressed }) => [
              styles.quickBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="flash" size={20} color="#fff" />
            <Text style={[styles.quickBtnText, { color: "#fff", fontFamily: "DMSans_700Bold" }]}>
              Stomp All Three
            </Text>
          </Pressable>
        )}

        {/* ── Post-stomp reflection ── */}
        {showReflect && (
          <View style={[styles.reflectCard, { backgroundColor: colors.card, borderColor: colors.primary + "44" }]}>
            <Text style={[styles.reflectLabel, { color: colors.primary, fontFamily: "DMSans_600SemiBold" }]}>
              REFLECT
            </Text>
            <Text style={[styles.reflectPrompt, { color: colors.foreground, fontFamily: "DMSans_400Regular" }]}>
              {prompt}
            </Text>
            <Pressable onPress={handleReflectDismiss} style={styles.reflectDismiss}>
              <Text style={[styles.reflectDismissText, { color: colors.mutedForeground, fontFamily: "DMSans_500Medium" }]}>
                I've thought about it →
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── Rename / rename link ── */}
        {!showRename && (
          <Pressable
            onPress={() => setShowRename(true)}
            style={styles.renameLink}
          >
            <Ionicons name="create-outline" size={14} color={colors.mutedForeground} />
            <Text style={[styles.renameLinkText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              {usingDefaults ? "Rename your intentions" : "Edit intentions"}
            </Text>
          </Pressable>
        )}

        {/* ── Rename sheet ── */}
        {showRename && (
          <RenameSheet
            intents={state.intents}
            onSave={(v) => { setIntents(v); setShowRename(false); }}
            onDismiss={() => setShowRename(false)}
            colors={colors}
          />
        )}

        {/* ── How it works ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
            How it works
          </Text>
          <View style={[styles.howCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            {[
              { icon: "flash" as const, text: "Quick Stomp: one tap, all three done. +10 pts." },
              { icon: "footsteps" as const, text: "Deep Stomp: tap each intention you actually tended. +25 pts." },
              { icon: "flame" as const, text: "Stomp every day to build your streak." },
              { icon: "pencil" as const, text: "Name your intentions anything — they're yours, not a curriculum." },
            ].map((r, i) => (
              <View key={i} style={styles.howRow}>
                <Ionicons name={r.icon} size={16} color={colors.primary} style={{ width: 22 }} />
                <Text style={[styles.howText, { color: colors.foreground, fontFamily: "DMSans_400Regular" }]}>
                  {r.text}
                </Text>
              </View>
            ))}
          </View>
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
  headerGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: "40%",
  },
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
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  sectionTitle: { fontSize: 16, marginBottom: 2 },
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
    borderWidth: 1,
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
  tilesGrid: {
    marginHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
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
  reflectCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  reflectLabel: { fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" },
  reflectPrompt: { fontSize: 15, lineHeight: 22 },
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
  howCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  howRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  howText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
