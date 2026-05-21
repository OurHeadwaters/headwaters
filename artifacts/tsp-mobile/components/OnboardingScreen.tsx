import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GordBird } from "@/components/GordBird";
import { WoodCard } from "@/components/homestead/WoodCard";
import { useHistory } from "@/context/HistoryContext";
import { useColors } from "@/hooks/useColors";

export const ONBOARDING_KEY = "hasSeenOnboarding_v1";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Slide {
  id: string;
  heading: string;
  body: string;
  gordMode: "perch" | "fly-across";
  gordSide: "left" | "right";
  gordTop: number;
  gordSize: number;
  gordDelay: number;
  icon: string;
  showTrail?: boolean;
}

const SLIDES: Slide[] = [
  {
    id: "welcome",
    heading: "Welcome to the\nStomping Path",
    body: "The Survival Podcast has helped over 3,000 episodes worth of listeners become more self-reliant. You're about to walk that path.",
    gordMode: "perch",
    gordSide: "right",
    gordTop: 14,
    gordSize: 48,
    gordDelay: 600,
    icon: "🌿",
  },
  {
    id: "stomp",
    heading: "Your Daily Stomp",
    body: "Each day a new episode lands — Jack calls it a \"stomp\". Mark your listens, build your streak, and let the archive be your guide through the homestead way of life.",
    gordMode: "fly-across",
    gordSide: "left",
    gordTop: 10,
    gordSize: 42,
    gordDelay: 300,
    icon: "👣",
  },
  {
    id: "v4v",
    heading: "Value for Value",
    body: "No ads, no paywalls. If the show adds value to your life, send some back — time, talent, or treasure. That's the deal that keeps the homestead running.",
    gordMode: "perch",
    gordSide: "left",
    gordTop: 14,
    gordSize: 48,
    gordDelay: 500,
    icon: "⚡",
  },
  {
    id: "journey",
    heading: "Your Journey",
    body: "Every stomp moves you forward. Walk the trail — from your first listen to a thousand episodes.",
    gordMode: "perch",
    gordSide: "right",
    gordTop: 228,
    gordSize: 36,
    gordDelay: 900,
    icon: "🗺️",
    showTrail: true,
  },
];

const MILESTONES = [
  { label: "10", sub: "stomps", value: 10 },
  { label: "100", sub: "episodes", value: 100 },
  { label: "1,000", sub: "episodes", value: 1000 },
];

function FencePost({
  color,
  capColor,
  passed,
  glowColor,
}: {
  color: string;
  capColor: string;
  passed?: boolean;
  glowColor?: string;
}) {
  return (
    <View style={fenceStyles.postGroup}>
      <View
        style={[
          fenceStyles.cap,
          { backgroundColor: capColor },
          passed && glowColor
            ? {
                shadowColor: glowColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 6,
                elevation: 6,
              }
            : undefined,
        ]}
      />
      <View
        style={[
          fenceStyles.post,
          { backgroundColor: color },
          passed && glowColor
            ? {
                shadowColor: glowColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 8,
                elevation: 4,
              }
            : undefined,
        ]}
      />
    </View>
  );
}

function JourneyTrail({ isVisible }: { isVisible: boolean }) {
  const colors = useColors();
  const { history } = useHistory();

  const episodeCount = Object.keys(history).length;
  const hasProgress = episodeCount > 0;

  const passed = MILESTONES.map((m) => episodeCount >= m.value);

  // seg 0 = leading (1–9), seg 1 = rail 0→1 (10–99),
  // seg 2 = rail 1→2 (100–999), seg 3 = trailing (1000+)
  let footprintSeg = -1;
  if (episodeCount >= 1000) footprintSeg = 3;
  else if (episodeCount >= 100) footprintSeg = 2;
  else if (episodeCount >= 10) footprintSeg = 1;
  else if (episodeCount > 0) footprintSeg = 0;

  const trailLabel = hasProgress
    ? `${episodeCount} episode${episodeCount === 1 ? "" : "s"} stomped`
    : "The Stomping Trail";

  // Animation slots (in stagger order):
  //  0: post0, 1: label0, 2: rails0,
  //  3: post1, 4: label1, 5: rails1,
  //  6: post2, 7: label2,
  //  8: trailEnd, 9: groundLine, 10: trailLabel
  const anims = useRef(
    Array.from({ length: 11 }, () => new Animated.Value(0))
  ).current;

  // Each post slides up slightly as it fades in
  const postTranslates = useRef(
    Array.from({ length: 3 }, () => new Animated.Value(14))
  ).current;

  useEffect(() => {
    if (isVisible) {
      anims.forEach((a) => a.setValue(0));
      postTranslates.forEach((a) => a.setValue(14));

      Animated.stagger(110, [
        Animated.parallel([
          Animated.timing(anims[0], { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(postTranslates[0], { toValue: 0, duration: 280, useNativeDriver: true }),
        ]),
        Animated.timing(anims[1], { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(anims[2], { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(anims[3], { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(postTranslates[1], { toValue: 0, duration: 280, useNativeDriver: true }),
        ]),
        Animated.timing(anims[4], { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(anims[5], { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(anims[6], { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(postTranslates[2], { toValue: 0, duration: 280, useNativeDriver: true }),
        ]),
        Animated.timing(anims[7], { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(anims[8], { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(anims[9], { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(anims[10], { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    } else {
      anims.forEach((a) => a.setValue(0));
      postTranslates.forEach((a) => a.setValue(14));
    }
  }, [isVisible]);

  const postAnims = [anims[0], anims[3], anims[6]];
  const labelAnims = [anims[1], anims[4], anims[7]];
  const railAnims = [anims[2], anims[5]];

  return (
    <View style={fenceStyles.wrapper}>
      <View style={fenceStyles.trailRow}>
        {/* Leading segment (before first milestone) */}
        <View style={fenceStyles.leadingWrapper}>
          <View style={[fenceStyles.rail, { backgroundColor: colors.woodBorder }]} />
          <View style={[fenceStyles.rail, fenceStyles.railLower, { backgroundColor: colors.woodBorder }]} />
          {footprintSeg === 0 && (
            <Text style={fenceStyles.footprint}>👣</Text>
          )}
        </View>

        {MILESTONES.map((m, i) => (
          <React.Fragment key={i}>
            <Animated.View
              style={[
                fenceStyles.postAndLabel,
                {
                  opacity: postAnims[i],
                  transform: [{ translateY: postTranslates[i] }],
                },
              ]}
            >
              <FencePost
                color={passed[i] ? colors.amberGold : colors.woodBrown}
                capColor={passed[i] ? colors.amberGold : colors.woodLight}
                passed={passed[i]}
                glowColor={colors.amberGold}
              />
              <Animated.Text
                style={[
                  fenceStyles.milestoneNum,
                  {
                    color: colors.amberGold,
                    fontFamily: "Fraunces_700Bold",
                    opacity: labelAnims[i],
                  },
                ]}
              >
                {m.label}
              </Animated.Text>
              <Animated.Text
                style={[
                  fenceStyles.milestoneSub,
                  {
                    color: colors.mutedForeground,
                    fontFamily: "DMSans_400Regular",
                    opacity: Animated.multiply(labelAnims[i], 0.75) as any,
                  },
                ]}
              >
                {m.sub}
              </Animated.Text>
              {passed[i] && (
                <Text style={[fenceStyles.checkmark, { color: colors.amberGold }]}>✓</Text>
              )}
            </Animated.View>
            {i < MILESTONES.length - 1 && (
              <Animated.View style={[fenceStyles.railWrapper, { opacity: railAnims[i] }]}>
                <View style={[fenceStyles.rail, { backgroundColor: colors.woodBorder }]} />
                <View style={[fenceStyles.rail, fenceStyles.railLower, { backgroundColor: colors.woodBorder }]} />
                {footprintSeg === i + 1 && (
                  <Text style={fenceStyles.footprint}>👣</Text>
                )}
              </Animated.View>
            )}
          </React.Fragment>
        ))}
        <Animated.View style={[fenceStyles.trailEnd, { opacity: anims[8] }]}>
          <View style={[fenceStyles.trailEndLine, { backgroundColor: colors.woodBorder }]} />
          {footprintSeg === 3 && (
            <Text style={fenceStyles.footprint}>👣</Text>
          )}
        </Animated.View>
      </View>

      <Animated.View
        style={[fenceStyles.groundLine, { backgroundColor: colors.woodBorder, opacity: anims[9] }]}
      />

      <Animated.Text
        style={[
          fenceStyles.trailLabel,
          { color: colors.mutedForeground, fontFamily: "DMSans_400Regular", opacity: anims[10] },
        ]}
      >
        {trailLabel}
      </Animated.Text>
    </View>
  );
}

const fenceStyles = StyleSheet.create({
  wrapper: {
    marginTop: 20,
    paddingBottom: 4,
  },
  trailRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 4,
  },
  postAndLabel: {
    alignItems: "center",
    width: 60,
  },
  postGroup: {
    alignItems: "center",
    marginBottom: 6,
  },
  cap: {
    width: 18,
    height: 6,
    borderRadius: 3,
  },
  post: {
    width: 10,
    height: 44,
    borderRadius: 3,
  },
  railWrapper: {
    flex: 1,
    paddingBottom: 18,
    gap: 8,
    justifyContent: "flex-end",
    paddingHorizontal: 2,
  },
  rail: {
    height: 4,
    borderRadius: 2,
    opacity: 0.7,
  },
  railLower: {
    marginBottom: 2,
  },
  leadingWrapper: {
    flex: 0.4,
    paddingBottom: 18,
    gap: 8,
    justifyContent: "flex-end",
    paddingHorizontal: 2,
  },
  trailEnd: {
    flex: 0.4,
    paddingBottom: 18,
    justifyContent: "flex-end",
    paddingHorizontal: 2,
  },
  trailEndLine: {
    height: 4,
    borderRadius: 2,
    opacity: 0.45,
  },
  footprint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 14,
  },
  checkmark: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    marginTop: 1,
  },
  groundLine: {
    height: 3,
    borderRadius: 2,
    marginTop: 2,
    opacity: 0.4,
  },
  milestoneNum: {
    fontSize: 15,
    lineHeight: 20,
  },
  milestoneSub: {
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.75,
    textAlign: "center",
  },
  trailLabel: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 8,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    opacity: 0.6,
  },
});

interface SlideItemProps {
  slide: Slide;
  isVisible: boolean;
}

function SlideItem({ slide, isVisible }: SlideItemProps) {
  const colors = useColors();

  return (
    <View style={[styles.slideOuter, { width: SCREEN_WIDTH }]}>
      <View style={styles.slideInner}>
        <WoodCard style={styles.card}>
          <View style={styles.iconRow}>
            <Text style={styles.iconEmoji}>{slide.icon}</Text>
          </View>

          <Text style={[styles.heading, { color: colors.amberGold, fontFamily: "Fraunces_700Bold" }]}>
            {slide.heading}
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.woodBorder }]} />

          <Text style={[styles.body, { color: colors.foreground, fontFamily: "DMSans_400Regular" }]}>
            {slide.body}
          </Text>

          {slide.showTrail && <JourneyTrail isVisible={isVisible} />}

          {isVisible && (
            <GordBird
              mode={slide.gordMode}
              perchSide={slide.gordSide}
              perchTop={slide.gordTop}
              size={slide.gordSize}
              delay={slide.gordDelay}
            />
          )}
        </WoodCard>
      </View>
    </View>
  );
}

interface DotsProps {
  count: number;
  activeIndex: number;
}

function Dots({ count, activeIndex }: DotsProps) {
  const colors = useColors();
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i === activeIndex ? colors.amberGold : colors.woodBorder,
              width: i === activeIndex ? 20 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

interface OnboardingScreenProps {
  visible: boolean;
  onDone: () => void;
}

export function OnboardingScreen({ visible, onDone }: OnboardingScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(1);
      setActiveIndex(0);
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToIndex({ index: 0, animated: false });
      });
    }
  }, [visible, fadeAnim]);

  const dismiss = useCallback(async () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(async () => {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      onDone();
    });
  }, [fadeAnim, onDone]);

  const handleNext = useCallback(() => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      dismiss();
    }
  }, [activeIndex, dismiss]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: colors.forestDeep, opacity: fadeAnim },
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={dismiss} hitSlop={12} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}>
              Skip
            </Text>
          </Pressable>
        </View>

        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item, index }) => (
            <SlideItem slide={item} isVisible={index === activeIndex} />
          )}
          style={styles.list}
          bounces={false}
        />

        <View style={styles.footer}>
          <Dots count={SLIDES.length} activeIndex={activeIndex} />

          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.nextBtn,
              {
                backgroundColor: colors.amberGold,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.nextText, { color: colors.forestDeep, fontFamily: "DMSans_700Bold" }]}>
              {isLast ? "Let's Go" : "Next"}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 15,
    opacity: 0.8,
  },
  list: {
    flex: 1,
  },
  slideOuter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  slideInner: {
    width: "100%",
  },
  card: {
    position: "relative",
    overflow: "visible",
  },
  iconRow: {
    marginBottom: 14,
  },
  iconEmoji: {
    fontSize: 42,
  },
  heading: {
    fontSize: 30,
    lineHeight: 36,
    marginBottom: 14,
  },
  divider: {
    height: 2,
    width: 48,
    borderRadius: 2,
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    lineHeight: 25,
    opacity: 0.9,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 16,
    gap: 20,
    alignItems: "center",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  nextText: {
    fontSize: 17,
    letterSpacing: 0.3,
  },
});
