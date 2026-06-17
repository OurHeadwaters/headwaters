import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { EpisodeCard } from "@/components/EpisodeCard";
import { useColors } from "@/hooks/useColors";
import { usePlayer } from "@/context/PlayerContext";
import { KIT_FINDER_REC_KEY } from "./find";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
const MINI_PLAYER_HEIGHT = 64;
const RSVP_SESSION_KEY = "rsvp_session_id";

const KIT_META: Record<string, { emoji: string; accent: string }> = {
  "family-kit":      { emoji: "🏠", accent: "#5D9E6C" },
  "producer-kit":    { emoji: "💼", accent: "#B8860B" },
  "practitioner-kit":{ emoji: "🧭", accent: "#4A7FB5" },
  "council-kit":     { emoji: "🌊", accent: "#3A9AA0" },
  "care-kit":        { emoji: "🌿", accent: "#5E9C76" },
  "digital-kit":     { emoji: "🔒", accent: "#7B5EA7" },
  "physical-kit":    { emoji: "⚡", accent: "#C47A35" },
};

type KitEpisode = {
  id: number;
  source: string;
  kind: string;
  slug: string;
  title: string;
  link: string;
  summary: string | null;
  publishedAt: string;
  episodeNumber: number | null;
  durationSeconds: number | null;
  audioUrl: string | null;
  audioType: string | null;
  artworkUrl: string | null;
  categories: string[];
  tags: string[];
};

type KitGear = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  categoryTags: string[];
};

type KitDetail = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  transformationSlugs: string[];
  trackSlugs: string[];
  gearCategoryTags: string[];
  externalLinks: { label: string; url: string }[];
  priceType: "direct" | "consultative";
  priceCents?: number;
  ctaLabel: string;
  transformations: { slug: string; from: string; to: string; description: string; color: string; icon: string }[];
  tracks: { slug: string; name: string; description: string }[];
  episodes: KitEpisode[];
  gear: KitGear[];
};

type GroundEvent = {
  id: number;
  title: string;
  description: string | null;
  hostName: string;
  eventDate: string;
  location: string | null;
  isOnline: boolean;
  priceDisplay: string | null;
  ticketPriceCents: number | null;
  rsvpCount: number;
  seats: number | null;
  familyFriendly: boolean;
  hasRsvped?: boolean;
};

function useKit(slug: string) {
  return useQuery<KitDetail>({
    queryKey: ["kits", slug],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/kits/${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error("Kit not found");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!slug,
  });
}

function useWorkshops(sessionId: string | null) {
  return useQuery<GroundEvent[]>({
    queryKey: ["ground-events", "family", sessionId],
    queryFn: async () => {
      const params = new URLSearchParams({
        familyFriendly: "true",
        status: "upcoming",
        limit: "3",
      });
      if (sessionId) params.set("sessionId", sessionId);
      const res = await fetch(`${API_BASE}/api/ground-events?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load workshops");
      const data = await res.json();
      return (data.events ?? []).filter(
        (e: GroundEvent) => !e.ticketPriceCents,
      );
    },
    staleTime: 5 * 60 * 1000,
  });
}

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function WorkshopCard({
  event,
  accent,
  sessionId,
  onRsvp,
}: {
  event: GroundEvent;
  accent: string;
  sessionId: string | null;
  onRsvp: (eventId: number) => void;
}) {
  const colors = useColors();
  const [rsvping, setRsvping] = useState(false);
  const [confirmed, setConfirmed] = useState(event.hasRsvped ?? false);
  const [localCount, setLocalCount] = useState(event.rsvpCount);
  const [error, setError] = useState<string | null>(null);

  async function handleRsvp() {
    if (confirmed || !sessionId) return;
    setRsvping(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/ground-events/${event.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "RSVP failed");
      }
      setConfirmed(true);
      setLocalCount((n) => n + 1);
      onRsvp(event.id);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setRsvping(false);
    }
  }

  return (
    <View style={[workshopStyles.card, { backgroundColor: colors.card, borderColor: colors.woodBorder }]}>
      <View style={workshopStyles.cardBody}>
        <Text style={[workshopStyles.title, { color: colors.foreground, fontFamily: "DMSans_600SemiBold" }]}>
          {event.title}
        </Text>
        <Text style={[workshopStyles.host, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
          Hosted by {event.hostName}
        </Text>

        <View style={workshopStyles.metaRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
          <Text style={[workshopStyles.metaText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
            {formatEventDate(event.eventDate)}
          </Text>
        </View>

        <View style={workshopStyles.metaRow}>
          <Ionicons name={event.isOnline ? "globe-outline" : "location-outline"} size={12} color={colors.mutedForeground} />
          <Text style={[workshopStyles.metaText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
            {event.isOnline ? "Online" : (event.location ?? "Location TBD")}
          </Text>
        </View>

        {localCount > 0 && (
          <View style={workshopStyles.metaRow}>
            <Ionicons name="people-outline" size={12} color={accent} />
            <Text style={[workshopStyles.metaText, { color: accent, fontFamily: "DMSans_500Medium" }]}>
              {localCount} going
            </Text>
          </View>
        )}
      </View>

      <View style={[workshopStyles.footer, { borderTopColor: colors.woodBorder }]}>
        {error ? (
          <Text style={[workshopStyles.errorText, { color: "#ef4444", fontFamily: "DMSans_400Regular" }]}>
            {error}
          </Text>
        ) : null}
        {confirmed ? (
          <View style={[workshopStyles.confirmedBadge, { backgroundColor: accent + "18", borderColor: accent + "44" }]}>
            <Ionicons name="checkmark-circle" size={14} color={accent} />
            <Text style={[workshopStyles.confirmedText, { color: accent, fontFamily: "DMSans_600SemiBold" }]}>
              You're in!
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={handleRsvp}
            disabled={rsvping || !sessionId}
            style={({ pressed }) => [
              workshopStyles.rsvpBtn,
              { backgroundColor: rsvping || pressed ? accent + "bb" : accent, opacity: rsvping ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="hand-left-outline" size={13} color="#fff" />
            <Text style={[workshopStyles.rsvpBtnText, { fontFamily: "DMSans_700Bold" }]}>
              {rsvping ? "Reserving…" : "RSVP — Free"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const workshopStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 10,
  },
  cardBody: { padding: 14, gap: 6 },
  title: { fontSize: 14, lineHeight: 20 },
  host: { fontSize: 12, lineHeight: 16 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12 },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rsvpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rsvpBtnText: { fontSize: 13, color: "#fff" },
  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  confirmedText: { fontSize: 13 },
  errorText: { fontSize: 11, marginBottom: 6 },
});

function WorkshopsSection({
  accent,
  sessionId,
  onRsvp,
}: {
  accent: string;
  sessionId: string | null;
  onRsvp: (eventId: number) => void;
}) {
  const colors = useColors();
  const { data: workshops, isLoading } = useWorkshops(sessionId);

  if (isLoading) {
    return (
      <View style={workshopSectionStyles.section}>
        <Text style={[workshopSectionStyles.label, { color: colors.mutedForeground, fontFamily: "DMSans_600SemiBold" }]}>
          UPCOMING WORKSHOPS
        </Text>
        <ActivityIndicator color={accent} size="small" style={{ marginTop: 8 }} />
      </View>
    );
  }

  if (!workshops || workshops.length === 0) return null;

  return (
    <View style={workshopSectionStyles.section}>
      <View style={workshopSectionStyles.headerRow}>
        <Text style={[workshopSectionStyles.label, { color: colors.mutedForeground, fontFamily: "DMSans_600SemiBold" }]}>
          UPCOMING WORKSHOPS
        </Text>
        <View style={[workshopSectionStyles.badge, { backgroundColor: accent + "18" }]}>
          <Text style={[workshopSectionStyles.badgeText, { color: accent, fontFamily: "DMSans_600SemiBold" }]}>
            Free
          </Text>
        </View>
      </View>
      {workshops.map((event) => (
        <WorkshopCard
          key={event.id}
          event={event}
          accent={accent}
          sessionId={sessionId}
          onRsvp={onRsvp}
        />
      ))}
    </View>
  );
}

const workshopSectionStyles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    paddingTop: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.9,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: { fontSize: 10, letterSpacing: 0.3 },
});

function resolveUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${process.env.EXPO_PUBLIC_DOMAIN}${url}`;
}

function ManualSection({
  kit,
  accent,
}: {
  kit: KitDetail;
  accent: string;
}) {
  const colors = useColors();
  const hasContent = kit.episodes.length > 0 || kit.gear.length > 0;

  return (
    <View style={[manualStyles.card, { backgroundColor: colors.card, borderColor: colors.woodBorder }]}>
      <View style={[manualStyles.headerRow, { borderBottomColor: colors.woodBorder }]}>
        <Ionicons name="book-outline" size={16} color={accent} />
        <Text style={[manualStyles.heading, { color: colors.foreground, fontFamily: "DMSans_600SemiBold" }]}>
          User Manual
        </Text>
      </View>

      <ManualRow
        icon="archive-outline"
        label="What's in this kit"
        value={kit.description}
        accent={accent}
      />

      {hasContent && (
        <ManualRow
          icon="play-circle-outline"
          label="What to do first"
          value={
            kit.transformations.length > 0
              ? `Start with the ${kit.transformations[0].from} → ${kit.transformations[0].to} transformation. ${kit.transformations[0].description ?? ""}`
              : kit.tracks.length > 0
              ? `Begin the "${kit.tracks[0].name}" track — ${kit.tracks[0].description ?? "curated episodes to guide your next steps."}`
              : "Listen to the featured episodes below to get started."
          }
          accent={accent}
        />
      )}

      {hasContent && (
        <ManualRow
          icon="arrow-forward-circle-outline"
          label="What to do next"
          value={
            kit.tracks.length > 0 || kit.transformations.length > 0
              ? `Work through the curated episodes in order, then explore the gear recommendations to put your knowledge into practice.`
              : kit.externalLinks.length > 0
              ? `Follow the link${kit.externalLinks.length > 1 ? "s" : ""} below to continue your journey with the full ${kit.name} resources.`
              : "Revisit these episodes as your situation changes and your skills grow."
          }
          accent={accent}
        />
      )}

      {kit.externalLinks.length > 0 && !hasContent && (
        <ManualRow
          icon="open-outline"
          label="Where to go"
          value="This kit lives primarily as an external resource. Tap the link below to access the full kit."
          accent={accent}
        />
      )}
    </View>
  );
}

function ManualRow({ icon, label, value, accent }: { icon: string; label: string; value: string; accent: string }) {
  const colors = useColors();
  return (
    <View style={manualStyles.row}>
      <View style={[manualStyles.iconDot, { backgroundColor: accent + "22" }]}>
        <Ionicons name={icon as any} size={14} color={accent} />
      </View>
      <View style={manualStyles.manualText}>
        <Text style={[manualStyles.rowLabel, { color: colors.mutedForeground, fontFamily: "DMSans_600SemiBold" }]}>
          {label}
        </Text>
        <Text style={[manualStyles.rowValue, { color: colors.foreground, fontFamily: "DMSans_400Regular" }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const manualStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  heading: { fontSize: 13, letterSpacing: 0.3 },
  row: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  iconDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  manualText: { flex: 1, gap: 4, paddingBottom: 10 },
  rowLabel: { fontSize: 10, letterSpacing: 0.7, textTransform: "uppercase" },
  rowValue: { fontSize: 13, lineHeight: 20 },
});

function GearCard({ item, accent }: { item: KitGear; accent: string }) {
  const colors = useColors();

  function handlePress() {
    if (item.externalUrl) Linking.openURL(item.externalUrl);
  }

  return (
    <Pressable
      onPress={item.externalUrl ? handlePress : undefined}
      style={({ pressed }) => [
        gearStyles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.woodBorder,
          opacity: pressed && item.externalUrl ? 0.85 : 1,
        },
      ]}
    >
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={gearStyles.image}
          contentFit="cover"
        />
      )}
      {!item.imageUrl && (
        <View style={[gearStyles.image, { backgroundColor: accent + "22", alignItems: "center", justifyContent: "center" }]}>
          <Ionicons name="cube-outline" size={24} color={accent} />
        </View>
      )}
      <View style={gearStyles.gearBody}>
        <Text
          style={[gearStyles.gearTitle, { color: colors.foreground, fontFamily: "DMSans_600SemiBold" }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        {item.description && (
          <Text
            style={[gearStyles.gearDesc, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}
        {item.externalUrl && (
          <View style={[gearStyles.linkRow]}>
            <Ionicons name="open-outline" size={12} color={accent} />
            <Text style={[gearStyles.linkText, { color: accent, fontFamily: "DMSans_500Medium" }]}>
              View product
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const gearStyles = StyleSheet.create({
  card: {
    width: 160,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 10,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 110,
  },
  gearBody: { padding: 10, gap: 4 },
  gearTitle: { fontSize: 13, lineHeight: 18 },
  gearDesc: { fontSize: 11, lineHeight: 16 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  linkText: { fontSize: 11 },
});

const KIT_ACCESS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function kitAccessKey(slug: string) {
  return `kit-access-v1:${slug}`;
}

async function loadStoredKitAccess(slug: string): Promise<{ email: string; savedAt: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(kitAccessKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email: string; savedAt: number };
    if (Date.now() - parsed.savedAt > KIT_ACCESS_TTL_MS) {
      await AsyncStorage.removeItem(kitAccessKey(slug));
      return null;
    }
    return { email: parsed.email, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

async function saveStoredKitAccess(slug: string, email: string) {
  try {
    await AsyncStorage.setItem(kitAccessKey(slug), JSON.stringify({ email, savedAt: Date.now() }));
  } catch {}
}

async function clearStoredKitAccess(slug: string) {
  try {
    await AsyncStorage.removeItem(kitAccessKey(slug));
  } catch {}
}

function KitWelcomeInline({
  kit,
  accent,
  onDismiss,
}: {
  kit: KitDetail;
  accent: string;
  onDismiss?: () => void;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        ctaStyles.section,
        {
          backgroundColor: accent + "0E",
          borderColor: accent + "55",
          borderWidth: 1,
          borderRadius: 12,
          marginHorizontal: 16,
          marginBottom: 16,
          padding: 16,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <Ionicons name="checkmark-circle" size={24} color={accent} />
        <Text style={[ctaStyles.successTitle, { color: colors.foreground, fontFamily: "Fraunces_700Bold", marginTop: 0, marginBottom: 0, textAlign: "left" }]}>
          Access confirmed!
        </Text>
      </View>
      <Text style={[ctaStyles.ctaLabel, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular", marginBottom: 14 }]}>
        You're in. Here's how to get the most from the {kit.name}:
      </Text>
      {kit.tracks.length > 0 && (
        <View style={welcomeInlineStyles.step}>
          <View style={[welcomeInlineStyles.dot, { backgroundColor: accent }]}>
            <Text style={welcomeInlineStyles.dotNum}>1</Text>
          </View>
          <Text style={[welcomeInlineStyles.stepText, { color: colors.foreground, fontFamily: "DMSans_400Regular" }]}>
            Start the <Text style={{ fontFamily: "DMSans_600SemiBold" }}>{kit.tracks[0].name}</Text> track — {kit.tracks[0].description ?? "your first curated learning path."}
          </Text>
        </View>
      )}
      {kit.transformations.length > 0 && kit.tracks.length === 0 && (
        <View style={welcomeInlineStyles.step}>
          <View style={[welcomeInlineStyles.dot, { backgroundColor: accent }]}>
            <Text style={welcomeInlineStyles.dotNum}>1</Text>
          </View>
          <Text style={[welcomeInlineStyles.stepText, { color: colors.foreground, fontFamily: "DMSans_400Regular" }]}>
            Work through the <Text style={{ fontFamily: "DMSans_600SemiBold" }}>{kit.transformations[0].from} → {kit.transformations[0].to}</Text> transformation path.
          </Text>
        </View>
      )}
      <View style={welcomeInlineStyles.step}>
        <View style={[welcomeInlineStyles.dot, { backgroundColor: accent }]}>
          <Text style={welcomeInlineStyles.dotNum}>{kit.tracks.length > 0 || kit.transformations.length > 0 ? "2" : "1"}</Text>
        </View>
        <Text style={[welcomeInlineStyles.stepText, { color: colors.foreground, fontFamily: "DMSans_400Regular" }]}>
          Explore the curated episodes and gear recommendations below.
        </Text>
      </View>
      {onDismiss && (
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => [welcomeInlineStyles.dismissBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[welcomeInlineStyles.dismissText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
            Got it, scroll down ↓
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const welcomeInlineStyles = StyleSheet.create({
  step: { flexDirection: "row", gap: 10, marginBottom: 10, alignItems: "flex-start" },
  dot: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 },
  dotNum: { color: "#fff", fontSize: 11, fontWeight: "700" },
  stepText: { flex: 1, fontSize: 13, lineHeight: 20 },
  dismissBtn: { marginTop: 8, alignSelf: "center" },
  dismissText: { fontSize: 12 },
});

function KitPurchaseCTA({ kit, accent }: { kit: KitDetail; accent: string }) {
  const colors = useColors();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inquiryName, setInquiryName] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryNotes, setInquiryNotes] = useState("");
  const [inquirySent, setInquirySent] = useState(false);

  const [checkoutOpened, setCheckoutOpened] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [backgroundCheckWarning, setBackgroundCheckWarning] = useState(false);
  const [accessLoadedFromCache, setAccessLoadedFromCache] = useState(false);
  const [sessionDaysRemaining, setSessionDaysRemaining] = useState<number | null>(null);

  const appStateRef = useRef(AppState.currentState);
  const backgroundRecheckDoneRef = useRef(false);

  useEffect(() => {
    loadStoredKitAccess(kit.slug).then((cached) => {
      if (cached) {
        setVerifyEmail(cached.email);
        setHasAccess(true);
        setAccessLoadedFromCache(true);
        const msRemaining = KIT_ACCESS_TTL_MS - (Date.now() - cached.savedAt);
        const days = msRemaining / (24 * 60 * 60 * 1000);
        if (days <= 2) {
          setSessionDaysRemaining(Math.max(0, Math.ceil(days)));
        }
      }
    });
  }, [kit.slug]);

  useEffect(() => {
    if (!accessLoadedFromCache || backgroundRecheckDoneRef.current) return;
    backgroundRecheckDoneRef.current = true;
    const email = verifyEmail;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/kits/${encodeURIComponent(kit.slug)}/access?email=${encodeURIComponent(email)}`,
        );
        if (!res.ok) {
          setBackgroundCheckWarning(true);
          return;
        }
        const data = await res.json();
        if (data.hasAccess) {
          await saveStoredKitAccess(kit.slug, email);
          setSessionDaysRemaining(null);
        } else {
          await clearStoredKitAccess(kit.slug);
          setHasAccess(false);
          setVerifyEmail("");
        }
      } catch {
        setBackgroundCheckWarning(true);
      }
    })();
  }, [accessLoadedFromCache]);

  useEffect(() => {
    if (!checkoutOpened) return;
    const sub = AppState.addEventListener("change", (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === "active") {
        appStateRef.current = nextState;
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [checkoutOpened]);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/kits/${encodeURIComponent(kit.slug)}/checkout`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      if (data.url) {
        await Linking.openURL(data.url);
        setCheckoutOpened(true);
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyAccess() {
    const email = verifyEmail.trim().toLowerCase();
    if (!email) { setError("Enter the email you used at checkout."); return; }
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/kits/${encodeURIComponent(kit.slug)}/access?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.hasAccess) {
        setHasAccess(true);
        await saveStoredKitAccess(kit.slug, email);
        setSessionDaysRemaining(null);
        AsyncStorage.removeItem(KIT_FINDER_REC_KEY).catch(() => {});
      } else {
        setError("No purchase found for that email. If you just paid, try again in a moment.");
      }
    } catch {
      setError("Could not verify — check your connection and try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleInquiry() {
    if (!inquiryName.trim() || !inquiryEmail.trim()) {
      setError("Name and email are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/kits/${encodeURIComponent(kit.slug)}/inquire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: inquiryName, email: inquiryEmail, notes: inquiryNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setInquirySent(true);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isDirect = kit.priceType === "direct";

  const expiryLabel =
    sessionDaysRemaining !== null
      ? sessionDaysRemaining === 0
        ? "Access expires today — visit again to auto-renew."
        : sessionDaysRemaining === 1
        ? "Access expires in 1 day — visit again to auto-renew."
        : `Access expires in ${sessionDaysRemaining} days — visit again to auto-renew.`
      : null;

  if (isDirect && hasAccess && !welcomeDismissed) {
    return (
      <>
        {backgroundCheckWarning && (
          <View
            style={[
              connectionWarningStyles.wrap,
              { backgroundColor: "#78350F0A", borderColor: "#92400E33" },
            ]}
          >
            <Ionicons name="wifi-outline" size={15} color="#92400E" style={connectionWarningStyles.icon} />
            <Text style={[connectionWarningStyles.text, { fontFamily: "DMSans_400Regular" }]}>
              Couldn't verify your access — check your connection. Your cached access is still active.
            </Text>
            <Pressable
              onPress={() => setBackgroundCheckWarning(false)}
              hitSlop={8}
              style={({ pressed }) => [{ opacity: pressed ? 0.5 : 0.6 }]}
            >
              <Ionicons name="close" size={16} color="#92400E" />
            </Pressable>
          </View>
        )}
        {expiryLabel && (
          <View style={[expiryStyles.wrap, { backgroundColor: "#78350F08", borderColor: "#92400E2A" }]}>
            <Ionicons name="time-outline" size={14} color="#92400E" style={{ flexShrink: 0 }} />
            <Text style={[expiryStyles.text, { fontFamily: "DMSans_400Regular" }]}>
              {expiryLabel}
            </Text>
          </View>
        )}
        <KitWelcomeInline kit={kit} accent={accent} onDismiss={() => setWelcomeDismissed(true)} />
      </>
    );
  }

  if (isDirect && hasAccess && welcomeDismissed) {
    if (!backgroundCheckWarning && !expiryLabel) return null;
    return (
      <>
        {backgroundCheckWarning && (
          <View
            style={[
              connectionWarningStyles.wrap,
              connectionWarningStyles.standalone,
              { backgroundColor: "#78350F0A", borderColor: "#92400E33" },
            ]}
          >
            <Ionicons name="wifi-outline" size={15} color="#92400E" style={connectionWarningStyles.icon} />
            <Text style={[connectionWarningStyles.text, { fontFamily: "DMSans_400Regular" }]}>
              Couldn't verify your access — check your connection. Your cached access is still active.
            </Text>
            <Pressable
              onPress={() => setBackgroundCheckWarning(false)}
              hitSlop={8}
              style={({ pressed }) => [{ opacity: pressed ? 0.5 : 0.6 }]}
            >
              <Ionicons name="close" size={16} color="#92400E" />
            </Pressable>
          </View>
        )}
        {expiryLabel && (
          <View
            style={[
              expiryStyles.wrap,
              expiryStyles.standalone,
              { backgroundColor: "#78350F08", borderColor: "#92400E2A" },
            ]}
          >
            <Ionicons name="time-outline" size={14} color="#92400E" style={{ flexShrink: 0 }} />
            <Text style={[expiryStyles.text, { fontFamily: "DMSans_400Regular" }]}>
              {expiryLabel}
            </Text>
          </View>
        )}
      </>
    );
  }

  if (isDirect && checkoutOpened) {
    return (
      <View style={[ctaStyles.section, { backgroundColor: accent + "0E", borderColor: accent + "33", borderWidth: 1, borderRadius: 12, marginHorizontal: 16, marginBottom: 16, padding: 16 }]}>
        <Text style={[ctaStyles.inquiryTitle, { color: colors.foreground, fontFamily: "Fraunces_700Bold", marginBottom: 6 }]}>
          Back from checkout?
        </Text>
        <Text style={[ctaStyles.ctaLabel, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular", marginBottom: 14 }]}>
          Enter the email you used to confirm your access.
        </Text>
        <Text style={[ctaStyles.fieldLabel, { color: colors.mutedForeground, fontFamily: "DMSans_600SemiBold" }]}>Email used at checkout</Text>
        <View style={[ctaStyles.inputRow, { borderColor: accent + "55", backgroundColor: colors.card }]}>
          <Ionicons name="mail-outline" size={14} color={colors.mutedForeground} style={{ marginRight: 8 }} />
          <TextInput
            value={verifyEmail}
            onChangeText={setVerifyEmail}
            placeholder="your@email.com"
            placeholderTextColor={colors.mutedForeground + "88"}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[ctaStyles.input, { color: colors.foreground, fontFamily: "DMSans_400Regular", flex: 1 }]}
          />
        </View>
        {error ? (
          <Text style={[ctaStyles.errorText, { color: "#ef4444", fontFamily: "DMSans_400Regular", marginTop: 6 }]}>
            {error}
          </Text>
        ) : null}
        <Pressable
          onPress={handleVerifyAccess}
          disabled={verifying}
          style={({ pressed }) => [
            ctaStyles.buyBtn,
            { marginTop: 12, backgroundColor: verifying || pressed ? accent + "bb" : accent, opacity: verifying ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
          <Text style={[ctaStyles.buyBtnText, { fontFamily: "DMSans_700Bold" }]}>
            {verifying ? "Checking…" : "Confirm Access"}
          </Text>
        </Pressable>
        <Pressable onPress={() => setCheckoutOpened(false)} style={{ marginTop: 10, alignSelf: "center" }}>
          <Text style={[ctaStyles.hint, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
            ← Back to purchase
          </Text>
        </Pressable>
      </View>
    );
  }

  if (isDirect) {
    const priceLabel = kit.priceCents ? `$${Math.round(kit.priceCents / 100)}` : null;
    return (
      <View style={[ctaStyles.section, { backgroundColor: accent + "0E", borderColor: accent + "33", borderWidth: 1, borderRadius: 12, marginHorizontal: 16, marginBottom: 16, padding: 16 }]}>
        {priceLabel && (
          <View style={ctaStyles.priceRow}>
            <Text style={[ctaStyles.price, { color: colors.foreground, fontFamily: "Fraunces_700Bold" }]}>
              {priceLabel}
            </Text>
            <Text style={[ctaStyles.priceUnit, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              {" "}one-time
            </Text>
          </View>
        )}
        <Text style={[ctaStyles.ctaLabel, { color: colors.foreground, fontFamily: "DMSans_400Regular", marginBottom: 12 }]}>
          Purchase includes episodes, gear, and resources — organized for your transformation.
        </Text>
        {error ? (
          <Text style={[ctaStyles.errorText, { color: "#ef4444", fontFamily: "DMSans_400Regular" }]}>
            {error}
          </Text>
        ) : null}
        <Pressable
          onPress={handleCheckout}
          disabled={loading}
          style={({ pressed }) => [
            ctaStyles.buyBtn,
            { backgroundColor: loading || pressed ? accent + "bb" : accent, opacity: loading ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="card-outline" size={16} color="#fff" />
          <Text style={[ctaStyles.buyBtnText, { fontFamily: "DMSans_700Bold" }]}>
            {loading ? "Opening checkout…" : (kit.ctaLabel ?? "Get This Kit")}
          </Text>
        </Pressable>
        <Text style={[ctaStyles.hint, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
          Secure checkout via Stripe
        </Text>
      </View>
    );
  }

  if (inquirySent) {
    return (
      <View style={[ctaStyles.section, { backgroundColor: accent + "0E", borderColor: accent + "33", borderWidth: 1, borderRadius: 12, marginHorizontal: 16, marginBottom: 16, padding: 16, alignItems: "center" }]}>
        <Ionicons name="checkmark-circle-outline" size={36} color={accent} />
        <Text style={[ctaStyles.successTitle, { color: colors.foreground, fontFamily: "Fraunces_700Bold" }]}>
          Inquiry received!
        </Text>
        <Text style={[ctaStyles.ctaLabel, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular", textAlign: "center" }]}>
          You'll hear back within a few business days about the {kit.name}.
        </Text>
      </View>
    );
  }

  return (
    <View style={[ctaStyles.section, { backgroundColor: accent + "0E", borderColor: accent + "33", borderWidth: 1, borderRadius: 12, marginHorizontal: 16, marginBottom: 16, padding: 16 }]}>
      <Text style={[ctaStyles.inquiryTitle, { color: colors.foreground, fontFamily: "Fraunces_700Bold", marginBottom: 4 }]}>
        {kit.ctaLabel ?? `Apply for ${kit.name}`}
      </Text>
      <Text style={[ctaStyles.ctaLabel, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular", marginBottom: 14 }]}>
        This kit works best with a conversation first. Leave your details and you'll hear back soon.
      </Text>

      <Text style={[ctaStyles.fieldLabel, { color: colors.mutedForeground, fontFamily: "DMSans_600SemiBold" }]}>Name</Text>
      <View style={[ctaStyles.inputRow, { borderColor: accent + "55", backgroundColor: colors.card }]}>
        <Ionicons name="person-outline" size={14} color={colors.mutedForeground} style={{ marginRight: 8 }} />
        <TextInput
          value={inquiryName}
          onChangeText={setInquiryName}
          placeholder="Your name"
          placeholderTextColor={colors.mutedForeground + "88"}
          style={[ctaStyles.input, { color: colors.foreground, fontFamily: "DMSans_400Regular", flex: 1 }]}
        />
      </View>

      <Text style={[ctaStyles.fieldLabel, { color: colors.mutedForeground, fontFamily: "DMSans_600SemiBold", marginTop: 10 }]}>Email</Text>
      <View style={[ctaStyles.inputRow, { borderColor: accent + "55", backgroundColor: colors.card }]}>
        <Ionicons name="mail-outline" size={14} color={colors.mutedForeground} style={{ marginRight: 8 }} />
        <TextInput
          value={inquiryEmail}
          onChangeText={setInquiryEmail}
          placeholder="your@email.com"
          placeholderTextColor={colors.mutedForeground + "88"}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[ctaStyles.input, { color: colors.foreground, fontFamily: "DMSans_400Regular", flex: 1 }]}
        />
      </View>

      <Text style={[ctaStyles.fieldLabel, { color: colors.mutedForeground, fontFamily: "DMSans_600SemiBold", marginTop: 10 }]}>Notes (optional)</Text>
      <View style={[ctaStyles.inputRow, { borderColor: accent + "55", backgroundColor: colors.card, alignItems: "flex-start", minHeight: 70 }]}>
        <TextInput
          value={inquiryNotes}
          onChangeText={setInquiryNotes}
          placeholder="Tell us about your situation…"
          placeholderTextColor={colors.mutedForeground + "88"}
          multiline
          numberOfLines={3}
          style={[ctaStyles.input, { color: colors.foreground, fontFamily: "DMSans_400Regular", flex: 1 }]}
        />
      </View>

      {error ? (
        <Text style={[ctaStyles.errorText, { color: "#ef4444", fontFamily: "DMSans_400Regular", marginTop: 8 }]}>
          {error}
        </Text>
      ) : null}

      <Pressable
        onPress={handleInquiry}
        disabled={loading}
        style={({ pressed }) => [
          ctaStyles.buyBtn,
          { marginTop: 14, backgroundColor: loading || pressed ? accent + "bb" : accent, opacity: loading ? 0.7 : 1 },
        ]}
      >
        <Ionicons name="send-outline" size={16} color="#fff" />
        <Text style={[ctaStyles.buyBtnText, { fontFamily: "DMSans_700Bold" }]}>
          {loading ? "Sending…" : "Send Inquiry"}
        </Text>
      </Pressable>
    </View>
  );
}

const ctaStyles = StyleSheet.create({
  section: { gap: 4 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 4 },
  price: { fontSize: 32, lineHeight: 38 },
  priceUnit: { fontSize: 13 },
  ctaLabel: { fontSize: 13, lineHeight: 19 },
  inquiryTitle: { fontSize: 17, lineHeight: 22 },
  fieldLabel: { fontSize: 10, letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 6 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 2,
  },
  input: { fontSize: 13, paddingVertical: 0 },
  buyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  buyBtnText: { fontSize: 15, color: "#fff" },
  hint: { fontSize: 11, textAlign: "center", marginTop: 8 },
  errorText: { fontSize: 12, marginTop: 4 },
  successTitle: { fontSize: 17, marginTop: 8, marginBottom: 6, textAlign: "center" },
});

const connectionWarningStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  standalone: {
    marginBottom: 16,
  },
  icon: { flexShrink: 0 },
  text: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: "#92400E",
  },
});

const expiryStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  standalone: {
    marginBottom: 16,
  },
  text: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: "#92400E",
  },
});

function FamilyEditionToggle({
  edition,
  onChange,
  accent,
}: {
  edition: "general" | "homeschool";
  onChange: (v: "general" | "homeschool") => void;
  accent: string;
}) {
  const colors = useColors();
  return (
    <View style={[toggleStyles.wrap, { backgroundColor: colors.muted, borderColor: colors.woodBorder }]}>
      <Pressable
        onPress={() => onChange("general")}
        style={[
          toggleStyles.btn,
          edition === "general" && { backgroundColor: accent },
        ]}
      >
        <Text
          style={[
            toggleStyles.label,
            {
              color: edition === "general" ? "#fff" : colors.mutedForeground,
              fontFamily: "DMSans_600SemiBold",
            },
          ]}
        >
          General
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange("homeschool")}
        style={[
          toggleStyles.btn,
          edition === "homeschool" && { backgroundColor: accent },
        ]}
      >
        <Text
          style={[
            toggleStyles.label,
            {
              color: edition === "homeschool" ? "#fff" : colors.mutedForeground,
              fontFamily: "DMSans_600SemiBold",
            },
          ]}
        >
          Homeschool
        </Text>
      </Pressable>
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  btn: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 9,
  },
  label: { fontSize: 13 },
});

const KIT_NAMES: Record<string, string> = {
  "family-kit":       "Family Kit",
  "producer-kit":     "Producer Kit",
  "practitioner-kit": "Practitioner Kit",
  "council-kit":      "Council Kit",
  "care-kit":         "Care Kit",
  "digital-kit":      "Digital Kit",
  "physical-kit":     "Physical Kit",
};

function FinderBanner({
  reason,
  secondary,
  accent,
  onDismiss,
  priceType,
  kitSlug,
}: {
  reason: string;
  secondary?: string;
  accent: string;
  onDismiss: () => void;
  priceType?: string;
  kitSlug?: string;
}) {
  const colors = useColors();
  const FINDER_GREEN = "#4A8C5C";

  return (
    <View
      style={[
        finderBannerStyles.wrap,
        { backgroundColor: FINDER_GREEN + "15", borderColor: FINDER_GREEN + "55" },
      ]}
    >
      <View style={finderBannerStyles.topRow}>
        <View style={[finderBannerStyles.badge, { backgroundColor: FINDER_GREEN + "22" }]}>
          <Ionicons name="compass-outline" size={13} color={FINDER_GREEN} />
          <Text style={[finderBannerStyles.badgeLabel, { color: FINDER_GREEN, fontFamily: "DMSans_700Bold" }]}>
            Recommended for you
          </Text>
        </View>
        <View style={finderBannerStyles.topActions}>
          <Pressable
            onPress={() => router.replace("/kits/find" as never)}
            style={({ pressed }) => [finderBannerStyles.retakeBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="refresh-outline" size={12} color={colors.mutedForeground} />
            <Text style={[finderBannerStyles.retakeText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              Retake
            </Text>
          </Pressable>
          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => [finderBannerStyles.dismissBtn, { opacity: pressed ? 0.6 : 1 }]}
            hitSlop={8}
          >
            <Ionicons name="close" size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      <Text style={[finderBannerStyles.reason, { color: colors.foreground, fontFamily: "DMSans_400Regular" }]}>
        {reason}
      </Text>

      {priceType === "direct" && kitSlug && (
        <Pressable
          onPress={() => Linking.openURL(`https://${process.env.EXPO_PUBLIC_DOMAIN}/headwaters/kit/${encodeURIComponent(kitSlug)}`).catch(() => {})}
          style={({ pressed }) => [
            finderBannerStyles.getKitRow,
            { backgroundColor: FINDER_GREEN + "22", opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="bag-handle-outline" size={14} color={FINDER_GREEN} />
          <Text style={[finderBannerStyles.getKitText, { color: FINDER_GREEN, fontFamily: "DMSans_600SemiBold" }]}>
            Get this kit
          </Text>
          <Ionicons name="arrow-forward" size={13} color={FINDER_GREEN} style={{ marginLeft: "auto" }} />
        </Pressable>
      )}

      {secondary && KIT_NAMES[secondary] && (
        <Pressable
          onPress={() => router.replace(`/kits/${secondary}` as never)}
          style={({ pressed }) => [
            finderBannerStyles.secondaryRow,
            { borderTopColor: FINDER_GREEN + "33", opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Ionicons name="arrow-forward-circle-outline" size={14} color={FINDER_GREEN} />
          <Text style={[finderBannerStyles.secondaryText, { color: FINDER_GREEN, fontFamily: "DMSans_500Medium" }]}>
            Also consider: {KIT_NAMES[secondary]}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const finderBannerStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 4,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeLabel: { fontSize: 11, letterSpacing: 0.3 },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  retakeText: { fontSize: 12 },
  dismissBtn: {
    padding: 2,
  },
  reason: { fontSize: 13, lineHeight: 20 },
  getKitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  getKitText: { fontSize: 13 },
  secondaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
    marginTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  secondaryText: { fontSize: 13 },
});

export default function KitDetailScreen() {
  const { slug, from_finder, reason, secondary } = useLocalSearchParams<{
    slug: string;
    from_finder?: string;
    reason?: string;
    secondary?: string;
  }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentEpisode } = usePlayer();
  const [familyEdition, setFamilyEdition] = useState<"general" | "homeschool">("general");
  const [storedRec, setStoredRec] = useState<{ reason: string; secondary?: string } | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [rsvpSessionId, setRsvpSessionId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(RSVP_SESSION_KEY).then(async (existing) => {
      if (existing) {
        setRsvpSessionId(existing);
      } else {
        const id = Crypto.randomUUID();
        await AsyncStorage.setItem(RSVP_SESSION_KEY, id).catch(() => {});
        setRsvpSessionId(id);
      }
    });
  }, []);

  useEffect(() => {
    setBannerDismissed(false);
    setStoredRec(null);
    AsyncStorage.getItem(KIT_FINDER_REC_KEY).then((raw) => {
      if (!raw) { setStoredRec(null); return; }
      try {
        const parsed = JSON.parse(raw) as { slug: string; reason: string; secondary?: string | null };
        if (parsed.slug === slug) {
          setStoredRec({ reason: parsed.reason, secondary: parsed.secondary ?? undefined });
        } else {
          setStoredRec(null);
        }
      } catch {
        setStoredRec(null);
      }
    });
  }, [slug]);

  async function handleDismissBanner() {
    setBannerDismissed(true);
    await AsyncStorage.removeItem(KIT_FINDER_REC_KEY).catch(() => {});
  }

  const fromFinder = !bannerDismissed && ((from_finder === "1" && !!reason) || !!storedRec);
  const bannerReason = (from_finder === "1" && reason) ? reason : storedRec?.reason ?? "";
  const bannerSecondary = (from_finder === "1" && secondary) ? secondary : storedRec?.secondary;

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = currentEpisode
    ? MINI_PLAYER_HEIGHT + (Platform.OS === "web" ? 84 : 49 + insets.bottom) + 16
    : Platform.OS === "web" ? 84 + 16 : 49 + insets.bottom + 16;

  const { data: kit, isLoading, error } = useKit(slug ?? "");

  const meta = KIT_META[slug ?? ""] ?? { emoji: "📦", accent: colors.amberGold };
  const accent = meta.accent;

  const isExternal = kit
    ? kit.transformationSlugs.length === 0 && kit.trackSlugs.length === 0 && kit.externalLinks.length > 0
    : false;

  const isFamilyKit = slug === "family-kit";

  function renderListItem({ item, index }: { item: KitEpisode; index: number }) {
    return (
      <View style={{ position: "relative" }}>
        <EpisodeCard
          slug={item.slug}
          title={item.title}
          pubDate={item.publishedAt}
          episodeNumber={item.episodeNumber ?? undefined}
          durationSeconds={item.durationSeconds ?? undefined}
          artworkUrl={item.artworkUrl}
          summary={item.summary ?? undefined}
          compact
        />
      </View>
    );
  }

  const ListHeader = () => {
    if (!kit) return null;

    return (
      <View>
        {/* ── Kit Header ── */}
        <View
          style={[
            headerStyles.banner,
            { paddingTop: topPadding + 8, backgroundColor: accent + "18" },
          ]}
        >
          <View style={headerStyles.topBar}>
            <Pressable onPress={() => router.back()} style={headerStyles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={accent} />
            </Pressable>
          </View>
          <View style={headerStyles.bannerContent}>
            <Text style={headerStyles.emoji}>{meta.emoji}</Text>
            <Text
              style={[headerStyles.name, { color: accent, fontFamily: "Fraunces_700Bold" }]}
            >
              {kit.name}
            </Text>
            <Text
              style={[headerStyles.tagline, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}
            >
              {kit.tagline}
            </Text>

            {isFamilyKit && (
              <FamilyEditionToggle
                edition={familyEdition}
                onChange={setFamilyEdition}
                accent={accent}
              />
            )}
          </View>
        </View>

        {/* ── Kit Finder recommendation banner ── */}
        {fromFinder && bannerReason && (
          <FinderBanner
            reason={bannerReason}
            secondary={bannerSecondary}
            accent={accent}
            onDismiss={handleDismissBanner}
            priceType={kit.priceType}
            kitSlug={slug}
          />
        )}

        {/* ── Purchase / Inquiry CTA ── */}
        <KitPurchaseCTA kit={kit} accent={accent} />

        {/* ── User Manual ── */}
        <View style={{ paddingTop: 4 }}>
          <ManualSection kit={kit} accent={accent} />
        </View>

        {/* ── Homeschool note ── */}
        {isFamilyKit && familyEdition === "homeschool" && (
          <View style={[infoStyles.note, { backgroundColor: accent + "14", borderColor: accent + "44" }]}>
            <Ionicons name="school-outline" size={16} color={accent} />
            <Text style={[infoStyles.noteText, { color: colors.foreground, fontFamily: "DMSans_400Regular" }]}>
              The Homeschool edition includes additional resources for families who educate at home. Look for homeschool-tagged episodes and the Family Privacy Guide for digital safety guidance.
            </Text>
          </View>
        )}

        {/* ── Upcoming Workshops (Family Kit only) ── */}
        {isFamilyKit && (
          <View style={[infoStyles.workshopsWrap, { borderTopColor: colors.woodBorder }]}>
            <WorkshopsSection
              accent={accent}
              sessionId={rsvpSessionId}
              onRsvp={() => {}}
            />
          </View>
        )}

        {/* ── External CTAs ── */}
        {kit.externalLinks.length > 0 && (
          <View style={infoStyles.section}>
            <Text style={[infoStyles.sectionLabel, { color: colors.mutedForeground, fontFamily: "DMSans_600SemiBold" }]}>
              RESOURCES
            </Text>
            {kit.externalLinks.map((link, i) => (
              <Pressable
                key={i}
                onPress={() => Linking.openURL(resolveUrl(link.url))}
                style={({ pressed }) => [
                  infoStyles.ctaBtn,
                  { backgroundColor: accent, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name="open-outline" size={16} color="#fff" />
                <Text style={[infoStyles.ctaBtnText, { fontFamily: "DMSans_700Bold" }]}>
                  {link.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Episodes section heading ── */}
        {kit.episodes.length > 0 && (
          <View style={[infoStyles.sectionRow, { borderTopColor: colors.woodBorder }]}>
            <Text style={[infoStyles.sectionLabel, { color: colors.mutedForeground, fontFamily: "DMSans_600SemiBold" }]}>
              FEATURED EPISODES
            </Text>
            <Text style={[infoStyles.episodeCount, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              {kit.episodes.length} episodes
            </Text>
          </View>
        )}
      </View>
    );
  };

  const ListFooter = () => {
    if (!kit || kit.gear.length === 0) return null;
    return (
      <View style={gearSectionStyles.section}>
        <Text style={[infoStyles.sectionLabel, { color: colors.mutedForeground, fontFamily: "DMSans_600SemiBold", paddingHorizontal: 16 }]}>
          RECOMMENDED GEAR
        </Text>
        <FlatList
          data={kit.gear}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <GearCard item={item} accent={accent} />}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={gearSectionStyles.gearList}
        />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[headerStyles.banner, { paddingTop: topPadding + 8, backgroundColor: accent + "18" }]}>
          <View style={headerStyles.topBar}>
            <Pressable onPress={() => router.back()} style={headerStyles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={accent} />
            </Pressable>
          </View>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={accent} size="large" />
          <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
            Loading kit…
          </Text>
        </View>
      </View>
    );
  }

  if (error || !kit) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[headerStyles.banner, { paddingTop: topPadding + 8, backgroundColor: accent + "18" }]}>
          <View style={headerStyles.topBar}>
            <Pressable onPress={() => router.back()} style={headerStyles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={accent} />
            </Pressable>
          </View>
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.mutedForeground} />
          <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
            Couldn't load this kit
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={isExternal ? [] : kit.episodes}
        keyExtractor={(item) => item.slug}
        renderItem={renderListItem}
        ListHeaderComponent={<ListHeader />}
        ListFooterComponent={<ListFooter />}
        ListEmptyComponent={
          isExternal ? null : (
            <View style={styles.emptyEpisodes}>
              <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                No featured episodes yet
              </Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  hint: { fontSize: 14, textAlign: "center" },
  emptyEpisodes: {
    padding: 24,
    alignItems: "center",
  },
});

const headerStyles = StyleSheet.create({
  banner: { paddingBottom: 20 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 8,
  },
  emoji: { fontSize: 36 },
  name: { fontSize: 24, lineHeight: 30 },
  tagline: { fontSize: 14, lineHeight: 20 },
});

const infoStyles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  workshopsWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 20,
    marginTop: 4,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 0.9,
  },
  episodeCount: { fontSize: 12 },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  ctaBtnText: {
    fontSize: 15,
    color: "#fff",
  },
  purchaseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  purchaseBtnText: { fontSize: 15 },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 19 },
});

const gearSectionStyles = StyleSheet.create({
  section: {
    paddingTop: 20,
    paddingBottom: 8,
    gap: 12,
  },
  gearList: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
});
