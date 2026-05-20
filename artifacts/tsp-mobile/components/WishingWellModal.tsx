import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

async function submitTip(data: {
  amountUnits: number;
  wishText: string;
  listenerName: string;
  episodeSlug?: string;
}): Promise<unknown> {
  const res = await fetch(`${API_BASE}/api/wishing-well/tip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ ...data, currency: "XRP" }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error((j as { error?: string }).error ?? "Failed to submit tip");
  return j;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  episodeSlug?: string;
}

export function WishingWellModal({ visible, onClose, episodeSlug }: Props) {
  const colors = useColors();
  const qc = useQueryClient();
  const [amount, setAmount] = useState(1);
  const [wishText, setWishText] = useState("");
  const [listenerName, setListenerName] = useState("");
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () => submitTip({ amountUnits: amount, wishText, listenerName, episodeSlug }),
    onSuccess: () => {
      setDone(true);
      qc.invalidateQueries({ queryKey: ["wishing-well-pot"] });
      qc.invalidateQueries({ queryKey: ["wishing-well-board"] });
    },
  });

  function close() {
    setDone(false);
    setWishText("");
    setListenerName("");
    setAmount(1);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
            🪙 Toss a Coin
          </Text>
          <Pressable onPress={close} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </Pressable>
        </View>

        {done ? (
          <View style={styles.doneContainer}>
            <Text style={styles.doneEmoji}>🪙</Text>
            <Text style={[styles.doneTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
              Your coin is in the well!
            </Text>
            <Text style={[styles.doneBody, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              Your wish is in today's pot. The draw runs at midnight — good luck!
            </Text>
            <Pressable
              onPress={close}
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: colors.primaryForeground, fontFamily: "DMSans_600SemiBold", fontSize: 15 }}>
                Done
              </Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.formScroll}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.desc, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              Each coin enters you into today's 50/50 draw. The winner takes half the pot. The other half supports the show.
            </Text>

            {mutation.isError && (
              <View style={[styles.errorBox, { backgroundColor: colors.muted }]}>
                <Text style={{ color: colors.foreground, fontSize: 13, fontFamily: "DMSans_400Regular" }}>
                  {mutation.error instanceof Error ? mutation.error.message : "Something went wrong"}
                </Text>
              </View>
            )}

            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "DMSans_600SemiBold" }]}>
              YOUR NAME (OPTIONAL)
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border, fontFamily: "DMSans_400Regular" },
              ]}
              value={listenerName}
              onChangeText={setListenerName}
              placeholder="e.g. Jack from Texas"
              placeholderTextColor={colors.mutedForeground}
              maxLength={80}
            />

            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "DMSans_600SemiBold" }]}>
              COINS TO TOSS
            </Text>
            <View style={styles.counterRow}>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAmount((v) => Math.max(1, v - 1));
                }}
                style={[styles.counterBtn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.foreground, fontSize: 20, fontFamily: "DMSans_700Bold" }}>−</Text>
              </Pressable>
              <Text style={[styles.counterVal, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
                {amount}
              </Text>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAmount((v) => Math.min(100, v + 1));
                }}
                style={[styles.counterBtn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.foreground, fontSize: 20, fontFamily: "DMSans_700Bold" }}>+</Text>
              </Pressable>
              <Text style={{ color: colors.mutedForeground, fontSize: 14, marginLeft: 8, fontFamily: "DMSans_400Regular" }}>
                {amount === 1 ? "coin" : "coins"}
              </Text>
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "DMSans_600SemiBold" }]}>
              YOUR WISH <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border, fontFamily: "DMSans_400Regular" },
              ]}
              value={wishText}
              onChangeText={setWishText}
              placeholder="Make a wish — something meaningful to you or your community…"
              placeholderTextColor={colors.mutedForeground}
              maxLength={280}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              {wishText.length}/280
            </Text>

            <Pressable
              onPress={() => {
                if (!wishText.trim() || wishText.trim().length < 3) {
                  Alert.alert("Wish required", "Please enter at least 3 characters for your wish.");
                  return;
                }
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                mutation.mutate();
              }}
              disabled={mutation.isPending}
              style={[
                styles.submitBtn,
                { backgroundColor: colors.primary, opacity: mutation.isPending ? 0.6 : 1 },
              ]}
            >
              {mutation.isPending ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={{ color: colors.primaryForeground, fontSize: 16, fontFamily: "DMSans_600SemiBold" }}>
                  🪙 Toss {amount} coin{amount !== 1 ? "s" : ""} into the Well
                </Text>
              )}
            </Pressable>
            <Text style={[styles.disclaimer, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              Crypto payouts pending legal review. Currency TBA.
            </Text>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17 },
  closeBtn: { padding: 4 },
  formScroll: { padding: 20, gap: 14 },
  desc: { fontSize: 14, lineHeight: 21, marginBottom: 4 },
  label: { fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 4,
  },
  counterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  counterVal: { fontSize: 22, minWidth: 32, textAlign: "center" },
  textArea: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 100,
  },
  charCount: { fontSize: 11, textAlign: "right", marginTop: -8 },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  disclaimer: { fontSize: 11, textAlign: "center", marginTop: -4 },
  errorBox: { borderRadius: 8, padding: 12 },
  doneContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  doneEmoji: { fontSize: 56 },
  doneTitle: { fontSize: 22, textAlign: "center" },
  doneBody: { fontSize: 15, textAlign: "center", lineHeight: 23 },
  doneBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
});
