import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface LanternGaugeProps {
  value: number;
  size?: number;
  label?: string;
  showPercent?: boolean;
}

export function LanternGauge({
  value,
  size = 52,
  label,
  showPercent = false,
}: LanternGaugeProps) {
  const colors = useColors();
  const fillAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const clamped = Math.min(1, Math.max(0, value));

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: clamped,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    if (clamped > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [clamped]);

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, size * 0.75],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0.9],
  });

  const lanternWidth = size * 0.5;
  const lanternHeight = size * 0.75;

  return (
    <View style={styles.wrapper}>
      <View style={{ width: size, alignItems: "center" }}>
        <View style={[styles.cap, { width: lanternWidth * 0.7, backgroundColor: colors.woodBrown }]} />
        <View
          style={[
            styles.lanternOuter,
            {
              width: lanternWidth,
              height: lanternHeight,
              borderColor: colors.woodBrown,
              backgroundColor: colors.muted,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.lanternFill,
              {
                width: "100%",
                height: fillHeight,
                backgroundColor: colors.lanternGlow,
                opacity: glowOpacity,
              },
            ]}
          />
          {showPercent && (
            <Text
              style={[
                styles.percentText,
                { color: clamped > 0.4 ? "#1C1008" : colors.foreground, fontFamily: "DMSans_700Bold" },
              ]}
            >
              {Math.round(clamped * 100)}%
            </Text>
          )}
        </View>
        <View style={[styles.base, { width: lanternWidth * 0.8, backgroundColor: colors.woodBrown }]} />
      </View>
      {label && (
        <Text
          style={[styles.label, { color: colors.mutedForeground, fontFamily: "DMSans_400Regular" }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: 4,
  },
  cap: {
    height: 5,
    borderRadius: 2,
    marginBottom: 1,
  },
  lanternOuter: {
    borderRadius: 6,
    borderWidth: 2,
    overflow: "hidden",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  lanternFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  percentText: {
    position: "absolute",
    fontSize: 10,
    bottom: 4,
    zIndex: 2,
  },
  base: {
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
  label: {
    fontSize: 10,
    textAlign: "center",
    letterSpacing: 0.3,
  },
});
