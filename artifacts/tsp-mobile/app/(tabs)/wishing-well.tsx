import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { WishingWellModal } from "@/components/WishingWellModal";
import { WoodCard } from "@/components/homestead/WoodCard";
import { GordBird } from "@/components/GordBird";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

interface PotToday {
  date: string;
  tipCount: number;
  totalUnits: number;
  currency: string;
  drawn: boolean;
}

interface Distribution {
  id: number;
  drawDate: string;
  totalUnits: number;
  creatorShareUnits: number;
  winnerShareUnits: number;
  winnerWishText: string | null;
  winnerListenerName: string | null;
  winnerImpactNote: string | null;
  payoutStatus: string;
  currency: string;
  createdAt: string;
}

interface Board {
  todayWinner: Distribution | null;
  past: Distribution[];
}

async function fetchPotToday(): Promise<PotToday> {
  const res = await fetch(`${API_BASE}/api/wishing-well/pot/today`);
  if (!res.ok) throw new Error("Failed to load today's pot");
  return res.json();
}

async function fetchBoard(): Promise<Board> {
  const res = await fetch(`${API_BASE}/api/wishing-well/board`);
  if (!res.ok) throw new Error("Failed to load board");
  return res.json();
}

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
  } catch {
    return d;
  }
}

function WinnerCard({ dist }: { dist: Distribution }) {
  const colors = useColors();
  return (
    <WoodCard style={{ marginBottom: 12 }}>
      <View style={cardStyles.row}>
        <Text style={cardStyles.trophy}>🏆</Text>
        <View style={{ flex: 1 }}>
          <Text style={[cardStyles.name, { color: colors.foreground, fontFamily: "DMSans_600SemiBold" }]}>
            {dist.winnerListenerName ?? "Anonymous"}
          </Text>
          <Text style={[cardStyles.date, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
            {formatDate(dist.drawDate)} · won {dist.winnerShareUnits} coins
          </Text>
        </View>
      </View>
      {dist.winnerWishText ? (
        <Text style={[cardStyles.wish, { color: colors.foreground, fontFamily: "DMSans_400Regular" }]}>
          "{dist.winnerWishText}"
        </Text>
      ) : null}
      {dist.winnerImpactNote ? (
        <View style={[cardStyles.impactBox, { backgroundColor: colors.muted }]}>
          <Text style={[cardStyles.impactText, { color: colors.foreground, fontFamily: "DMSans_400Regular" }]}>
            ❤️ {dist.winnerImpactNote}
          </Text>
        </View>
      ) : null}
    </WoodCard>
  );
}

export default function WishingWellScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);

  const { data: pot, isLoading: potLoading } = useQuery({
    queryKey: ["wishing-well-pot"],
    queryFn: fetchPotToday,
    refetchInterval: 30_000,
  });

  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ["wishing-well-board"],
    queryFn: fetchBoard,
  });

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <WishingWellModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.forestDeep, paddingTop: topPadding + 16 }]}>
          <GordBird mode="perch" perchSide="right" perchTop={topPadding + 4} delay={700} size={38} />
          <Text style={styles.heroEmoji}>🪙</Text>
          <Text style={[styles.heroTitle, { color: colors.lanternWarm, fontFamily: "Fraunces_700Bold" }]}>
            The Wishing Well
          </Text>
          <Text style={[styles.heroSub, { color: "rgba(255,255,255,0.7)", fontFamily: "DMSans_400Regular" }]}>
            Toss a coin, make a wish. Win half the day's pot.
          </Text>
        </View>

        <View style={styles.content}>
          {/* Legal notice */}
          <WoodCard>
            <View style={[styles.notice, { backgroundColor: colors.amberGold + "18" }]}>
              <Text style={[styles.noticeText, { color: colors.woodBrown, fontFamily: "DMSans_400Regular" }]}>
                Preview feature — crypto payouts pending legal review (Ontario). Currency TBA.
              </Text>
            </View>
          </WoodCard>

          {/* Today's Pot */}
          <WoodCard>
            <Text style={[styles.potLabel, { color: colors.amberGold, fontFamily: "DMSans_600SemiBold" }]}>
              TODAY'S POT
            </Text>
            {potLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
            ) : pot ? (
              <>
                <Text style={[styles.potTotal, { color: colors.foreground, fontFamily: "Fraunces_700Bold" }]}>
                  {pot.totalUnits}{" "}
                  <Text style={[styles.potUnit, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                    coins
                  </Text>
                </Text>
                <Text style={[styles.potSub, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                  from {pot.tipCount} {pot.tipCount === 1 ? "wish" : "wishes"} today
                  {pot.drawn ? " · Draw complete!" : " · Draw runs at midnight"}
                </Text>
              </>
            ) : (
              <Text style={{ color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }}>Unable to load</Text>
            )}
          </WoodCard>

          {/* Toss Button */}
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.tossBtn,
              { backgroundColor: colors.amberGold, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.tossBtnText, { color: "#1C1008", fontFamily: "DMSans_700Bold" }]}>
              🪙 Toss a Coin
            </Text>
          </Pressable>

          {/* Today's Winner */}
          {board?.todayWinner && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
                🎉 Today's Winner
              </Text>
              <WinnerCard dist={board.todayWinner} />
            </>
          )}

          {/* Past Winners */}
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "DMSans_700Bold" }]}>
            Past Winners
          </Text>
          {boardLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : board && board.past.length > 0 ? (
            board.past.map((dist) => (
              <WinnerCard key={dist.id} dist={dist} />
            ))
          ) : (
            <WoodCard>
              <View style={styles.emptyInner}>
                <Text style={styles.emptyEmoji}>🪙</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                  No draws yet — be the first to toss a coin!
                </Text>
              </View>
            </WoodCard>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: "center",
    overflow: "hidden",
  },
  heroEmoji: { fontSize: 44, marginBottom: 8 },
  heroTitle: { fontSize: 26, marginBottom: 6 },
  heroSub: { fontSize: 14, textAlign: "center", maxWidth: 260 },
  content: { padding: 16, gap: 14 },
  notice: {
    padding: 12,
    borderRadius: 8,
  },
  noticeText: { fontSize: 12, lineHeight: 18 },
  potLabel: { fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
  potTotal: { fontSize: 36 },
  potUnit: { fontSize: 16 },
  potSub: { fontSize: 13, marginTop: 4 },
  tossBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  tossBtnText: { fontSize: 18 },
  sectionTitle: { fontSize: 18, marginTop: 8, marginBottom: 4 },
  emptyInner: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 10,
  },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: 14, textAlign: "center" },
});

const cardStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  trophy: { fontSize: 22, marginTop: 1 },
  name: { fontSize: 15 },
  date: { fontSize: 12, marginTop: 2 },
  wish: { fontSize: 14, lineHeight: 21, fontStyle: "italic", marginBottom: 8 },
  impactBox: { borderRadius: 8, padding: 10 },
  impactText: { fontSize: 13, lineHeight: 20 },
});
