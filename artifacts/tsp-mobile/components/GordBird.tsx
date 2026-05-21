import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

const BIRD_SIZE = 36;

function BirdSVG({ size = 36, flipped = false }: { size?: number; flipped?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        transform: flipped ? [{ scaleX: -1 }] : [],
      }}
    >
      <View style={[birdStyles.body, { width: size * 0.55, height: size * 0.36, borderRadius: size * 0.18, top: size * 0.38, left: size * 0.18 }]} />
      <View style={[birdStyles.head, { width: size * 0.3, height: size * 0.28, borderRadius: size * 0.14, top: size * 0.22, left: size * 0.14 }]} />
      <View style={[birdStyles.beak, { width: size * 0.14, height: size * 0.08, borderRadius: size * 0.03, top: size * 0.34, left: size * 0.01 }]} />
      <View style={[birdStyles.wing, { width: size * 0.38, height: size * 0.22, borderRadius: size * 0.1, top: size * 0.36, left: size * 0.3 }]} />
      <View style={[birdStyles.eye, { width: size * 0.06, height: size * 0.06, borderRadius: size * 0.03, top: size * 0.26, left: size * 0.2 }]} />
      <View style={[birdStyles.tail, { width: size * 0.2, height: size * 0.1, borderRadius: size * 0.04, top: size * 0.5, left: size * 0.65 }]} />
      <View style={[birdStyles.crest, { width: size * 0.1, height: size * 0.16, borderRadius: size * 0.05, top: size * 0.1, left: size * 0.2 }]} />
    </View>
  );
}

const birdStyles = StyleSheet.create({
  body: { position: "absolute", backgroundColor: "#7A5C2A" },
  head: { position: "absolute", backgroundColor: "#8B6F47" },
  beak: { position: "absolute", backgroundColor: "#D4A843" },
  wing: { position: "absolute", backgroundColor: "#5C4020", opacity: 0.85 },
  eye: { position: "absolute", backgroundColor: "#1C1008" },
  tail: { position: "absolute", backgroundColor: "#6B4F2A" },
  crest: { position: "absolute", backgroundColor: "#A07840", borderRadius: 5 },
});

interface GordBirdProps {
  mode?: "perch" | "fly-across";
  perchSide?: "left" | "right";
  perchTop?: number;
  delay?: number;
  size?: number;
}

export function GordBird({
  mode = "perch",
  perchSide = "right",
  perchTop = 12,
  delay = 400,
  size = BIRD_SIZE,
}: GordBirdProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const bobY = useRef(new Animated.Value(0)).current;
  const wingFlap = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (mode === "perch") {
      const slideIn = Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(translateY, { toValue: 0, friction: 5, tension: 80, useNativeDriver: true }),
        ]),
      ]);

      Animated.sequence([
        Animated.timing(translateY, { toValue: -16, duration: 0, useNativeDriver: true }),
        slideIn,
      ]).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(bobY, { toValue: -3, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(bobY, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ])
        ).start();
      });
    } else {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(translateX, {
            toValue: 400,
            duration: 3200,
            easing: Easing.bezier(0.25, 0.1, 0.75, 0.9),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(translateY, { toValue: -30, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(translateY, { toValue: -10, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(translateY, { toValue: -25, duration: 800, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          ]),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(wingFlap, { toValue: 1, duration: 160, useNativeDriver: true }),
          Animated.timing(wingFlap, { toValue: 0, duration: 160, useNativeDriver: true }),
        ])
      ).start();
    }

    return () => {
      translateX.stopAnimation();
      translateY.stopAnimation();
      opacity.stopAnimation();
      bobY.stopAnimation();
      wingFlap.stopAnimation();
    };
  }, [mode]);

  const isRight = perchSide === "right";

  return (
    <Animated.View
      style={[
        styles.container,
        isRight ? { right: 12 } : { left: 12 },
        { top: perchTop },
        {
          opacity,
          transform: [
            { translateX: mode === "fly-across" ? translateX : 0 },
            { translateY: mode === "perch" ? Animated.add(translateY, bobY) : translateY },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <BirdSVG size={size} flipped={isRight} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 20,
  },
});
