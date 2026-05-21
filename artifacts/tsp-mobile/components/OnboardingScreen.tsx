import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useRef, useState } from "react";
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
];

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
