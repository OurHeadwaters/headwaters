import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export const KIT_FINDER_REC_KEY = "kit_finder_rec";

const ACCENT = "#8FA883";

type SituationKey = "individual" | "family" | "others";
type GoalKey = "income" | "health" | "privacy" | "physical" | "community";
type CompanionsKey = "solo" | "partner" | "family" | "community";
type EntryKey = "philosophy" | "action" | "curriculum";
type ReadinessKey = "starting" | "underway" | "advanced";

type AnswerKey = "situation" | "goal" | "companions" | "entry" | "readiness";

type Answers = {
  situation?: SituationKey;
  goal?: GoalKey;
  companions?: CompanionsKey;
  entry?: EntryKey;
  readiness?: ReadinessKey;
};

type Question = {
  id: AnswerKey;
  text: string;
  subtext: string;
  options: { value: string; label: string; description: string }[];
};

const QUESTIONS: Question[] = [
  {
    id: "situation",
    text: "Who are you building resilience for?",
    subtext: "This shapes which kit fits your situation best.",
    options: [
      {
        value: "individual",
        label: "Just myself",
        description: "I'm working on my own independence and preparedness.",
      },
      {
        value: "family",
        label: "My household or family",
        description: "I want resilience for the people I live with and care for.",
      },
      {
        value: "others",
        label: "Clients, community, or an organization",
        description: "I work with others — guiding, advising, or coordinating at scale.",
      },
    ],
  },
  {
    id: "goal",
    text: "What's your most urgent focus?",
    subtext: "Pick the area where you most want to make progress.",
    options: [
      {
        value: "income",
        label: "Income & financial independence",
        description: "Moving from employee income to owner income, debt freedom, real assets.",
      },
      {
        value: "health",
        label: "Health sovereignty",
        description: "Reclaiming your health — food, herbs, home care.",
      },
      {
        value: "privacy",
        label: "Digital privacy & security",
        description: "Protecting your data, securing your finances, reducing your footprint.",
      },
      {
        value: "physical",
        label: "Physical preparedness",
        description: "Hard assets, energy independence, food storage, contingency planning.",
      },
      {
        value: "community",
        label: "Community & watershed resilience",
        description: "Building resilience with neighbors or a regional council.",
      },
    ],
  },
  {
    id: "companions",
    text: "Who's on this journey with you?",
    subtext: "This helps us understand the scale of what you're building.",
    options: [
      {
        value: "solo",
        label: "Just me — going it alone for now",
        description: "I'm making these changes independently.",
      },
      {
        value: "partner",
        label: "My partner or spouse",
        description: "We're working toward resilience together as a couple.",
      },
      {
        value: "family",
        label: "My whole household or family",
        description: "This is a family effort — everyone's involved.",
      },
      {
        value: "community",
        label: "A wider group, network, or community",
        description: "I'm thinking beyond my household — a neighborhood, watershed, or organization.",
      },
    ],
  },
  {
    id: "entry",
    text: "How do you best take action?",
    subtext: "Different kits are structured for different learning styles.",
    options: [
      {
        value: "philosophy",
        label: "Understand the 'why' first",
        description: "I want the mental model before I touch anything practical.",
      },
      {
        value: "action",
        label: "Give me a concrete first step",
        description: "I want to do something useful this week — I'll build the theory as I go.",
      },
      {
        value: "curriculum",
        label: "A complete path from start to finish",
        description: "I want the full curriculum laid out so I can work through it systematically.",
      },
    ],
  },
  {
    id: "readiness",
    text: "Where are you starting from?",
    subtext: "Be honest — the right kit meets you where you are.",
    options: [
      {
        value: "starting",
        label: "Early days — just getting oriented",
        description: "I know I need to make changes but haven't gone deep yet.",
      },
      {
        value: "underway",
        label: "Some steps taken — looking to go further",
        description: "I've made progress and want a structured path to build on it.",
      },
      {
        value: "advanced",
        label: "Well along — refining or helping others",
        description: "I'm fairly prepared and want to level up or guide others.",
      },
    ],
  },
];

const GOAL_LABELS: Record<string, string> = {
  income: "income independence",
  health: "health sovereignty",
  privacy: "digital privacy & security",
  physical: "physical preparedness",
  community: "community resilience",
};

const SITUATION_LABELS: Record<string, string> = {
  individual: "building personal resilience",
  family: "building household resilience",
  others: "guiding others toward resilience",
};

const COMPANIONS_LABELS: Record<string, string> = {
  solo: "going it alone",
  partner: "with a partner",
  family: "as a family",
  community: "with a wider community or group",
};

type FinderResult = {
  primary: string;
  secondary?: string;
  reason: string;
};

function resolveKit(answers: Required<Answers>): FinderResult {
  const { situation, goal, companions, readiness } = answers;
  const communitySignal = companions === "community" || goal === "community";

  if (situation === "others") {
    if (communitySignal || readiness === "advanced") {
      return {
        primary: "council-kit",
        secondary: "practitioner-kit",
        reason: `You're focused on ${GOAL_LABELS[goal]} while ${SITUATION_LABELS[situation]} — ${COMPANIONS_LABELS[companions]}. The Council Kit is built for people organizing at the watershed or community scale.`,
      };
    }
    return {
      primary: "practitioner-kit",
      secondary: "council-kit",
      reason: `You're ${SITUATION_LABELS[situation]} with a focus on ${GOAL_LABELS[goal]}. The Practitioner Kit gives you the framework and tools to guide clients through resilience transitions.`,
    };
  }

  if (situation === "family" || companions === "family") {
    if (goal === "income") {
      return {
        primary: "producer-kit",
        secondary: "family-kit",
        reason: `You're building ${GOAL_LABELS[goal]} for your household. The Producer Kit provides the financial foundation. Pair it with the Family Kit for whole-home preparedness.`,
      };
    }
    if (goal === "health") {
      return {
        primary: "care-kit",
        secondary: "family-kit",
        reason: `You want ${GOAL_LABELS[goal]} for your household. The Care Kit covers home health, herbalism, and functional medicine for the whole family.`,
      };
    }
    if (goal === "privacy") {
      return {
        primary: "digital-kit",
        secondary: "family-kit",
        reason: `You're focused on ${GOAL_LABELS[goal]} for your household. The Digital Kit covers crypto-asset security, privacy tools, and financial sovereignty.`,
      };
    }
    if (communitySignal) {
      return {
        primary: "family-kit",
        secondary: "council-kit",
        reason: `A prepared household is the building block of any strong community network. The Family Kit is your foundation — with the Council Kit as the natural next step.`,
      };
    }
    return {
      primary: "family-kit",
      secondary: "physical-kit",
      reason: `For a household focused on ${GOAL_LABELS[goal]}, the Family Kit is your foundation. The Physical Kit adds energy independence and hard-asset strategy.`,
    };
  }

  if (communitySignal) {
    return {
      primary: "council-kit",
      secondary: "practitioner-kit",
      reason: `You're building ${GOAL_LABELS[goal]} ${COMPANIONS_LABELS[companions]}. The Council Kit covers the 4-phase community engagement model for watershed-scale work.`,
    };
  }

  if (goal === "income") {
    return {
      primary: "producer-kit",
      reason: `You're building ${GOAL_LABELS[goal]} for yourself. The Producer Kit covers the full arc from employee income to owner income — debt freedom and assets that work while you sleep.`,
    };
  }
  if (goal === "health") {
    return {
      primary: "care-kit",
      reason: `You're reclaiming ${GOAL_LABELS[goal]}. The Care Kit takes you toward root-cause health — nutrition, herbal medicine, and home treatment skills.`,
    };
  }
  if (goal === "privacy") {
    return {
      primary: "digital-kit",
      reason: `You're focused on ${GOAL_LABELS[goal]}. The Digital Kit covers hardware wallets, cold storage, VPNs, and encrypted communications.`,
    };
  }
  return {
    primary: "physical-kit",
    reason: `You're building ${GOAL_LABELS[goal]} for yourself. The Physical Kit covers hard assets, energy independence, water, heat, and the contingency planning most people skip.`,
  };
}

export default function KitFinderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [selected, setSelected] = useState<string | null>(null);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const question = QUESTIONS[step];
  const total = QUESTIONS.length;
  const progressFraction = step / total;

  function handleSelect(value: string) {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSelected(value);
  }

  function handleNext() {
    if (!selected) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newAnswers = { ...answers, [question.id]: selected } as Answers;
    setAnswers(newAnswers);
    setSelected(null);

    if (step < total - 1) {
      setStep(step + 1);
    } else {
      const full = newAnswers as Required<Answers>;
      const result = resolveKit(full);
      AsyncStorage.setItem(
        KIT_FINDER_REC_KEY,
        JSON.stringify({ slug: result.primary, reason: result.reason, secondary: result.secondary ?? null }),
      ).catch(() => {});
      const params: Record<string, string> = {
        from_finder: "1",
        situation: full.situation,
        goal: full.goal,
        companions: full.companions,
        entry: full.entry,
        readiness: full.readiness,
        reason: result.reason,
      };
      if (result.secondary) params.secondary = result.secondary;
      const qs = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
      router.push(`/kits/${result.primary}?${qs}` as never);
    }
  }

  function handleBack() {
    if (step === 0) {
      router.back();
      return;
    }
    const prev = QUESTIONS[step - 1];
    setSelected((answers[prev.id] as string) ?? null);
    setStep(step - 1);
  }

  function handleRestart() {
    setStep(0);
    setAnswers({});
    setSelected(null);
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          s.header,
          {
            paddingTop: topPadding + 8,
            backgroundColor: colors.forestDeep,
            borderBottomColor: colors.woodBorder,
          },
        ]}
      >
        <View style={s.topBar}>
          <Pressable onPress={handleBack} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={ACCENT} />
          </Pressable>
          {step > 0 && (
            <Pressable onPress={handleRestart} style={s.restartBtn}>
              <Ionicons name="refresh-outline" size={18} color={colors.mutedForeground} />
              <Text style={[s.restartText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
                Start over
              </Text>
            </Pressable>
          )}
        </View>
        <View style={s.headerContent}>
          <View style={[s.compassBadge, { backgroundColor: ACCENT + "20" }]}>
            <Ionicons name="compass-outline" size={16} color={ACCENT} />
            <Text style={[s.compassLabel, { color: ACCENT, fontFamily: "DMSans_700Bold" }]}>
              Kit Finder
            </Text>
          </View>
          <Text style={[s.headerTitle, { color: colors.lanternGlow, fontFamily: "Fraunces_700Bold" }]}>
            Find your kit.
          </Text>
          <Text style={[s.headerSub, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
            {total} questions — your kit, no browsing.
          </Text>
        </View>

        <View style={[s.progressTrack, { backgroundColor: colors.woodBorder }]}>
          <View
            style={[
              s.progressFill,
              {
                width: `${progressFraction * 100}%` as any,
                backgroundColor: ACCENT,
              },
            ]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[s.stepLabel, { color: colors.mutedForeground, fontFamily: "DMSans_600SemiBold" }]}>
          Question {step + 1} of {total}
        </Text>

        <Text style={[s.questionText, { color: colors.foreground, fontFamily: "Fraunces_700Bold" }]}>
          {question.text}
        </Text>
        <Text style={[s.questionSub, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
          {question.subtext}
        </Text>

        <View style={s.options}>
          {question.options.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => handleSelect(opt.value)}
                style={({ pressed }) => [
                  s.optionCard,
                  {
                    backgroundColor: isSelected ? ACCENT + "14" : colors.card,
                    borderColor: isSelected ? ACCENT : colors.woodBorder,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    s.radio,
                    {
                      borderColor: isSelected ? ACCENT : colors.woodBorder,
                      backgroundColor: isSelected ? ACCENT : "transparent",
                    },
                  ]}
                >
                  {isSelected && <View style={s.radioDot} />}
                </View>
                <View style={s.optionText}>
                  <Text
                    style={[
                      s.optionLabel,
                      {
                        color: isSelected ? ACCENT : colors.foreground,
                        fontFamily: "DMSans_600SemiBold",
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text
                    style={[
                      s.optionDesc,
                      { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" },
                    ]}
                  >
                    {opt.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleNext}
          disabled={!selected}
          style={({ pressed }) => [
            s.nextBtn,
            {
              backgroundColor: selected ? ACCENT : ACCENT + "50",
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Text style={[s.nextBtnText, { fontFamily: "DMSans_700Bold" }]}>
            {step === total - 1 ? "Find my kit" : "Next"}
          </Text>
          <Ionicons
            name={step === total - 1 ? "compass-outline" : "arrow-forward"}
            size={18}
            color="#fff"
          />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingBottom: 0,
    borderBottomWidth: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
    paddingHorizontal: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  restartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    height: 44,
  },
  restartText: { fontSize: 13 },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
    gap: 6,
  },
  compassBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  compassLabel: { fontSize: 11, letterSpacing: 0.5 },
  headerTitle: { fontSize: 26 },
  headerSub: { fontSize: 13 },
  progressTrack: { height: 3, width: "100%" },
  progressFill: { height: 3 },
  scroll: {
    padding: 20,
    gap: 0,
  },
  stepLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 4,
  },
  questionText: {
    fontSize: 22,
    lineHeight: 30,
    marginBottom: 6,
  },
  questionSub: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  options: {
    gap: 10,
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  optionText: { flex: 1, gap: 3 },
  optionLabel: { fontSize: 14, lineHeight: 20 },
  optionDesc: { fontSize: 12, lineHeight: 17 },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 12,
  },
  nextBtnText: { fontSize: 16, color: "#fff" },
});
