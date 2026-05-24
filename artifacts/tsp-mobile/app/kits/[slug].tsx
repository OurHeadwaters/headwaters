import { Ionicons } from "@expo/vector-icons";
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

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
const MINI_PLAYER_HEIGHT = 64;

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

  const appStateRef = useRef(AppState.currentState);

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

  if (isDirect && hasAccess && !welcomeDismissed) {
    return <KitWelcomeInline kit={kit} accent={accent} onDismiss={() => setWelcomeDismissed(true)} />;
  }

  if (isDirect && hasAccess && welcomeDismissed) {
    return null;
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

export default function KitDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentEpisode } = usePlayer();
  const [familyEdition, setFamilyEdition] = useState<"general" | "homeschool">("general");

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

        {/* ── User Manual ── */}
        <View style={{ paddingTop: 20 }}>
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

        {/* ── Purchase / Inquiry CTA ── */}
        <KitPurchaseCTA kit={kit} accent={accent} />

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
