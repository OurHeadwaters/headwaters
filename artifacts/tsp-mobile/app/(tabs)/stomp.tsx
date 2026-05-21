import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableWithoutFeedback,
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
  hasRsvped: boolean;
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
  const sessionId = await getSessionId();
  const url = `${API_BASE}/api/ground-events?status=upcoming&limit=5&sessionId=${encodeURIComponent(sessionId)}`;
  const res = await fetch(url);
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

function useWorkshopRsvp(event: GroundEvent) {
  const queryClient = useQueryClient();
  // Server is the source of truth — hasRsvped comes from the GET response.
  // AsyncStorage is kept as a write-through cache so the button reflects the
  // RSVP state instantly on next open even before the query resolves.
  const [rsvped, setRsvped] = useState(event.hasRsvped);

  useEffect(() => {
    // Sync: if server says RSVPed, persist locally too so it survives offline opens.
    if (event.hasRsvped) {
      AsyncStorage.setItem(RSVP_KEY(event.id), "1");
    } else {
      // Server didn't find the RSVP — check local cache in case we're offline or
      // the server lost the token (e.g. fresh DB), so at least we don't confuse the user.
      AsyncStorage.getItem(RSVP_KEY(event.id)).then((val) => {
        if (val === "1") setRsvped(true);
      });
    }
  }, [event.id, event.hasRsvped]);

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

  return { rsvped, isPending, doRsvp };
}

function RsvpButton({ event, style }: { event: GroundEvent; style?: object }) {
  const colors = useColors();
  const { rsvped, isPending, doRsvp } = useWorkshopRsvp(event);

  return (
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
        style,
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
  );
}

function WorkshopDetailSheet({
  event,
  visible,
  onDismiss,
}: {
  event: GroundEvent | null;
  visible: boolean;
  onDismiss: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }).start();
    } else {
      translateY.setValue(600);
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100 || g.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: 700,
            duration: 220,
            useNativeDriver: true,
          }).start(onDismiss);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 22,
            stiffness: 220,
          }).start();
        }
      },
    }),
  ).current;

  if (!event) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={workshopStyles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          workshopStyles.sheet,
          { backgroundColor: colors.card, paddingBottom: insets.bottom + 24 },
          { transform: [{ translateY }] },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={[workshopStyles.sheetHandle, { backgroundColor: colors.woodBorder }]} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {event.isFeatured && (
            <View style={[workshopStyles.featuredBadge, { backgroundColor: colors.amberGold + "22" }]}>
              <Text style={[workshopStyles.featuredText, { color: colors.amberGold, fontFamily: "DMSans_600SemiBold" }]}>
                ⭐ Featured
              </Text>
            </View>
          )}

          <Text style={[workshopStyles.sheetTitle, { color: colors.foreground, fontFamily: "Fraunces_700Bold" }]}>
            {event.title}
          </Text>

          <View style={workshopStyles.metaGroup}>
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
          </View>

          <View style={[workshopStyles.divider, { backgroundColor: colors.woodBorder }]} />

          <Text style={[workshopStyles.descriptionLabel, { color: colors.mutedForeground, fontFamily: "DMSans_600SemiBold" }]}>
            About this workshop
          </Text>
          <Text style={[workshopStyles.description, { color: colors.foreground, fontFamily: "DMSans_400Regular" }]}>
            {event.description}
          </Text>

          <RsvpButton event={event} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function WorkshopCard({ event, onPress }: { event: GroundEvent; onPress: () => void }) {
  const colors = useColors();
  const { rsvped } = useWorkshopRsvp(event);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <WoodCard style={{ marginBottom: 10 }}>
        {event.isFeatured && (
          <View style={[workshopStyles.featuredBadge, { backgroundColor: colors.amberGold + "22" }]}>
            <Text style={[workshopStyles.featuredText, { color: colors.amberGold, fontFamily: "DMSans_600SemiBold" }]}>
              ⭐ Featured
            </Text>
          </View>
        )}
        <View style={workshopStyles.cardTitleRow}>
          <Text style={[workshopStyles.title, { color: colors.foreground, fontFamily: "Fraunces_700Bold", flex: 1 }]}>
            {event.title}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} style={{ marginTop: 2 }} />
        </View>
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
        {rsvped && (
          <View style={workshopStyles.rsvpedChip}>
            <Ionicons name="checkmark-circle" size={13} color="#4ade80" />
            <Text style={[workshopStyles.rsvpedChipText, { fontFamily: "DMSans_600SemiBold" }]}>
              You're Going
            </Text>
          </View>
        )}
      </WoodCard>
    </Pressable>
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
  cardTitleRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  title: { fontSize: 16 },
  meta: { fontSize: 13, lineHeight: 20 },
  rsvpBtn: {
    marginTop: 12,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rsvpText: { fontSize: 15 },
  rsvpedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  rsvpedChipText: { fontSize: 12, color: "#4ade80" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "85%",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 22, marginBottom: 12, lineHeight: 28 },
  metaGroup: { gap: 2, marginBottom: 4 },
  divider: { height: 1, marginVertical: 16 },
  descriptionLabel: { fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 },
  description: { fontSize: 15, lineHeight: 23, marginBottom: 4 },
});

function WorkshopsSection() {
  const colors = useColors();
  const [selectedEvent, setSelectedEvent] = useState<GroundEvent | null>(null);

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
        events.map((ev) => (
          <WorkshopCard
            key={ev.id}
            event={ev}
            onPress={() => setSelectedEvent(ev)}
          />
        ))
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

      <WorkshopDetailSheet
        event={selectedEvent}
        visible={selectedEvent !== null}
        onDismiss={() => setSelectedEvent(null)}
      />
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

interface WorkshopFormState {
  title: string;
  description: string;
  hostName: string;
  eventDate: string;
  location: string;
  isOnline: boolean;
  priceDisplay: string;
  seats: string;
}

const EMPTY_FORM: WorkshopFormState = {
  title: "",
  description: "",
  hostName: "",
  eventDate: "",
  location: "",
  isOnline: false,
  priceDisplay: "",
  seats: "",
};

async function postWorkshopSubmission(form: WorkshopFormState): Promise<void> {
  const body: Record<string, unknown> = {
    title: form.title.trim(),
    description: form.description.trim(),
    hostName: form.hostName.trim(),
    eventDate: form.eventDate.trim(),
    location: form.isOnline ? "Online" : form.location.trim(),
    isOnline: form.isOnline,
    priceDisplay: form.priceDisplay.trim() || "Free",
  };
  const seatsNum = parseInt(form.seats, 10);
  if (seatsNum > 0) body.seats = seatsNum;

  const res = await fetch(`${API_BASE}/api/ground-events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || "Failed to submit");
  }
}

function HostWorkshopModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<WorkshopFormState>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  const { mutate: submit, isPending, error } = useMutation({
    mutationFn: () => postWorkshopSubmission(form),
    onSuccess: () => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setSubmitted(true);
    },
  });

  function handleClose() {
    setForm(EMPTY_FORM);
    setSubmitted(false);
    onClose();
  }

  function set(field: keyof WorkshopFormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const errMsg = error instanceof Error ? error.message : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[hostFormStyles.flex, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            hostFormStyles.header,
            {
              backgroundColor: colors.card,
              borderBottomColor: colors.woodBorder,
              paddingTop: insets.top + 16,
            },
          ]}
        >
          <Text style={[hostFormStyles.headerTitle, { color: colors.foreground, fontFamily: "Fraunces_700Bold" }]}>
            Host a Workshop
          </Text>
          <Pressable onPress={handleClose} hitSlop={10} style={hostFormStyles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {submitted ? (
          <View style={hostFormStyles.successWrap}>
            <Text style={hostFormStyles.successEmoji}>🏕</Text>
            <Text style={[hostFormStyles.successTitle, { color: colors.foreground, fontFamily: "Fraunces_700Bold" }]}>
              Workshop Submitted!
            </Text>
            <Text style={[hostFormStyles.successBody, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              Your workshop is pending review. The team will approve it shortly and it'll appear on the Workshop Board.
            </Text>
            <Pressable
              onPress={handleClose}
              style={[hostFormStyles.doneBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[hostFormStyles.doneBtnText, { fontFamily: "DMSans_600SemiBold" }]}>
                Done
              </Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[
              hostFormStyles.formScroll,
              { paddingBottom: insets.bottom + 32 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[hostFormStyles.intro, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              Fill in the details below and we'll review your submission before it goes live.
            </Text>

            <FormField label="Workshop Title *" colors={colors}>
              <TextInput
                value={form.title}
                onChangeText={(v) => set("title", v)}
                placeholder="e.g. Intro to Food Preservation"
                placeholderTextColor={colors.mutedForeground}
                maxLength={120}
                style={[hostFormStyles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.woodBorder, fontFamily: "DMSans_400Regular" }]}
              />
            </FormField>

            <FormField label="Description *" colors={colors}>
              <TextInput
                value={form.description}
                onChangeText={(v) => set("description", v)}
                placeholder="What will attendees learn or do?"
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={4}
                maxLength={2000}
                style={[hostFormStyles.input, hostFormStyles.multilineInput, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.woodBorder, fontFamily: "DMSans_400Regular" }]}
              />
            </FormField>

            <FormField label="Your Name *" colors={colors}>
              <TextInput
                value={form.hostName}
                onChangeText={(v) => set("hostName", v)}
                placeholder="Host name"
                placeholderTextColor={colors.mutedForeground}
                style={[hostFormStyles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.woodBorder, fontFamily: "DMSans_400Regular" }]}
              />
            </FormField>

            <FormField label="Date *" colors={colors} hint="YYYY-MM-DD">
              <TextInput
                value={form.eventDate}
                onChangeText={(v) => set("eventDate", v)}
                placeholder="2026-09-15"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                style={[hostFormStyles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.woodBorder, fontFamily: "DMSans_400Regular" }]}
              />
            </FormField>

            <View style={hostFormStyles.toggleRow}>
              <Text style={[hostFormStyles.label, { color: colors.foreground, fontFamily: "DMSans_500Medium" }]}>
                Online Event
              </Text>
              <Switch
                value={form.isOnline}
                onValueChange={(v) => set("isOnline", v)}
                trackColor={{ false: colors.muted, true: colors.primary + "88" }}
                thumbColor={form.isOnline ? colors.primary : colors.mutedForeground}
              />
            </View>

            {!form.isOnline && (
              <FormField label="Location *" colors={colors}>
                <TextInput
                  value={form.location}
                  onChangeText={(v) => set("location", v)}
                  placeholder="City, State or venue name"
                  placeholderTextColor={colors.mutedForeground}
                  style={[hostFormStyles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.woodBorder, fontFamily: "DMSans_400Regular" }]}
                />
              </FormField>
            )}

            <FormField label="Price" colors={colors} hint="Leave blank for Free">
              <TextInput
                value={form.priceDisplay}
                onChangeText={(v) => set("priceDisplay", v)}
                placeholder="Free · $25 · Donation"
                placeholderTextColor={colors.mutedForeground}
                maxLength={40}
                style={[hostFormStyles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.woodBorder, fontFamily: "DMSans_400Regular" }]}
              />
            </FormField>

            <FormField label="Seats Available" colors={colors} hint="Leave blank for unlimited">
              <TextInput
                value={form.seats}
                onChangeText={(v) => set("seats", v.replace(/[^0-9]/g, ""))}
                placeholder="e.g. 20"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                maxLength={5}
                style={[hostFormStyles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.woodBorder, fontFamily: "DMSans_400Regular" }]}
              />
            </FormField>

            {errMsg && (
              <View style={[hostFormStyles.errorBox, { backgroundColor: "#7f1d1d22", borderColor: "#f87171" }]}>
                <Ionicons name="alert-circle-outline" size={16} color="#f87171" />
                <Text style={[hostFormStyles.errorText, { fontFamily: "DMSans_400Regular" }]}>
                  {errMsg}
                </Text>
              </View>
            )}

            <Pressable
              onPress={() => submit()}
              disabled={isPending}
              style={({ pressed }) => [
                hostFormStyles.submitBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: isPending || pressed ? 0.7 : 1,
                },
              ]}
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[hostFormStyles.submitBtnText, { fontFamily: "DMSans_600SemiBold" }]}>
                  Submit Workshop
                </Text>
              )}
            </Pressable>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FormField({
  label,
  hint,
  children,
  colors,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={hostFormStyles.fieldWrap}>
      <View style={hostFormStyles.labelRow}>
        <Text style={[hostFormStyles.label, { color: colors.foreground, fontFamily: "DMSans_500Medium" }]}>
          {label}
        </Text>
        {hint && (
          <Text style={[hostFormStyles.hint, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
            {hint}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

const hostFormStyles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    position: "relative",
  },
  headerTitle: { fontSize: 20 },
  closeBtn: { position: "absolute", right: 20, bottom: 16 },
  formScroll: { paddingHorizontal: 20, paddingTop: 20, gap: 4 },
  intro: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  fieldWrap: { marginBottom: 16 },
  labelRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 6 },
  label: { fontSize: 14 },
  hint: { fontSize: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingVertical: 4,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: "#f87171" },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitBtnText: { fontSize: 16, color: "#fff" },
  successWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  successEmoji: { fontSize: 56 },
  successTitle: { fontSize: 24, textAlign: "center" },
  successBody: { fontSize: 15, lineHeight: 22, textAlign: "center" },
  doneBtn: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 14,
    marginTop: 8,
  },
  doneBtnText: { fontSize: 16, color: "#fff" },
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
  const [showHostForm, setShowHostForm] = useState(false);
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

        {/* Host a Workshop CTA */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <Pressable
            onPress={() => setShowHostForm(true)}
            style={({ pressed }) => [
              styles.hostBtn,
              {
                borderColor: colors.woodBorder,
                backgroundColor: pressed ? colors.muted : colors.card,
              },
            ]}
          >
            <Ionicons name="hammer-outline" size={18} color={colors.amberGold} />
            <Text style={[styles.hostBtnText, { color: colors.foreground, fontFamily: "DMSans_600SemiBold" }]}>
              Host a Workshop
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <HostWorkshopModal
          visible={showHostForm}
          onClose={() => setShowHostForm(false)}
        />

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
  hostBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  hostBtnText: { flex: 1, fontSize: 15 },
});
