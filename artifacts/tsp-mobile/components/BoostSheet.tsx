import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useV4V, type BoostParams, type ValueSplit } from "@/context/V4VContext";

interface BoostSheetProps {
  visible: boolean;
  episodeSlug: string;
  episodeTitle: string;
  splits: ValueSplit[];
  defaultAmount?: number;
  onClose: () => void;
  onSuccess?: (amountSats: number) => void;
}

const PRESET_SATS = [100, 500, 1000, 5000];

export function BoostSheet({
  visible,
  episodeSlug,
  episodeTitle,
  splits,
  defaultAmount,
  onClose,
  onSuccess,
}: BoostSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { wallet, sendBoost } = useV4V();
  const [selectedAmount, setSelectedAmount] = useState(defaultAmount ?? 100);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (defaultAmount) setSelectedAmount(defaultAmount);
  }, [defaultAmount]);

  useEffect(() => {
    if (visible) {
      setError(null);
      setMessage("");
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleSend = async () => {
    if (!wallet) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSending(true);
    setError(null);
    const params: BoostParams = {
      episodeSlug,
      amountSats: selectedAmount,
      message: message.trim() || undefined,
      splits,
    };
    const ok = await sendBoost(params);
    setSending(false);
    if (ok) {
      onSuccess?.(selectedAmount);
      onClose();
    } else {
      setError("Could not send payment. Make sure your Lightning wallet app is installed.");
    }
  };

  const walletLabel =
    wallet?.type === "lightning"
      ? `⚡ ${wallet.address}`
      : wallet?.type === "xrpl"
        ? `🔷 ${wallet.address.slice(0, 8)}…`
        : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.kav}
        >
          <Pressable>
            <Animated.View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.background,
                  paddingBottom: insets.bottom + 16,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Handle */}
              <View style={[styles.handle, { backgroundColor: colors.border }]} />

              {/* Header */}
              <View style={styles.header}>
                <Ionicons name="flash" size={22} color="#f59e0b" />
                <Text style={[styles.title, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
                  Boost Episode
                </Text>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Ionicons name="close" size={22} color={colors.mutedForeground} />
                </Pressable>
              </View>

              {/* Episode */}
              <Text
                style={[styles.episodeTitle, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}
                numberOfLines={1}
              >
                {episodeTitle}
              </Text>

              {/* Wallet */}
              {walletLabel && (
                <View style={[styles.walletBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.walletText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                    Paying from: {walletLabel}
                  </Text>
                </View>
              )}

              {/* Amount presets */}
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "DMSans_500Medium" }]}>
                Amount (sats)
              </Text>
              <View style={styles.presets}>
                {PRESET_SATS.map((amt) => (
                  <Pressable
                    key={amt}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.selectionAsync();
                      setSelectedAmount(amt);
                    }}
                    style={[
                      styles.preset,
                      {
                        backgroundColor:
                          selectedAmount === amt ? colors.primary : colors.muted,
                        borderColor:
                          selectedAmount === amt ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        {
                          color:
                            selectedAmount === amt
                              ? colors.primaryForeground
                              : colors.foreground,
                          fontFamily: "DMSans_600SemiBold",
                        },
                      ]}
                    >
                      {amt.toLocaleString()}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Message / Boostagram */}
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "DMSans_500Medium" }]}>
                Message (optional)
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Add a Boostagram…"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.muted,
                    borderColor: colors.border,
                    fontFamily: "DMSans_400Regular",
                  },
                ]}
                maxLength={144}
                multiline
              />

              {/* Split preview */}
              {splits.length > 0 && (
                <View style={styles.splitPreview}>
                  <Text style={[styles.splitLabel, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                    Split:{" "}
                    {splits
                      .map((s) => `${s.name} ${Math.round(s.splitPct)}%`)
                      .join(" · ")}
                  </Text>
                </View>
              )}

              {error && (
                <Text style={[styles.error, { color: "#ef4444", fontFamily: "DMSans_400Regular" }]}>
                  {error}
                </Text>
              )}

              {/* Send button */}
              <Pressable
                onPress={handleSend}
                disabled={sending || !wallet}
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor:
                      !wallet ? colors.muted : colors.primary,
                    opacity: sending ? 0.7 : 1,
                  },
                ]}
              >
                {sending ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <>
                    <Ionicons name="flash" size={18} color={!wallet ? colors.mutedForeground : colors.primaryForeground} />
                    <Text
                      style={[
                        styles.sendBtnText,
                        {
                          color: !wallet ? colors.mutedForeground : colors.primaryForeground,
                          fontFamily: "DMSans_600SemiBold",
                        },
                      ]}
                    >
                      {!wallet
                        ? "Connect wallet to boost"
                        : `Boost ${selectedAmount.toLocaleString()} sats`}
                    </Text>
                  </>
                )}
              </Pressable>
            </Animated.View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  kav: {
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    flex: 1,
  },
  episodeTitle: {
    fontSize: 13,
    marginTop: -4,
  },
  walletBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  walletText: {
    fontSize: 12,
  },
  sectionLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 4,
  },
  presets: {
    flexDirection: "row",
    gap: 8,
    marginTop: -4,
  },
  preset: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  presetText: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: "top",
    marginTop: -4,
  },
  splitPreview: {
    marginTop: -4,
  },
  splitLabel: {
    fontSize: 12,
  },
  error: {
    fontSize: 13,
    marginTop: -4,
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
  },
  sendBtnText: {
    fontSize: 16,
  },
});
