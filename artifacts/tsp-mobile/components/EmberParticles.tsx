import React, { useRef, useEffect } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

export function EmberParticles({ count = 8 }: { count?: number }) {
  const particles = useRef(
    Array.from({ length: count }, () => ({
      x: new Animated.Value(Math.random() * 300),
      y: new Animated.Value(Math.random() * 60),
      opacity: new Animated.Value(0),
      size: 2 + Math.random() * 3,
    }))
  ).current;

  useEffect(() => {
    particles.forEach((p, i) => {
      const animate = () => {
        p.x.setValue(Math.random() * 300);
        p.y.setValue(40 + Math.random() * 40);
        p.opacity.setValue(0);
        Animated.sequence([
          Animated.delay(i * 400 + Math.random() * 600),
          Animated.parallel([
            Animated.timing(p.opacity, { toValue: 0.7, duration: 400, useNativeDriver: true }),
            Animated.timing(p.y, {
              toValue: -10 - Math.random() * 30,
              duration: 2200 + Math.random() * 1200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(p.opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start(animate);
      };
      animate();
    });
    return () => particles.forEach(p => { p.opacity.stopAnimation(); p.y.stopAnimation(); });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: 0,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: "#E8B84B",
            opacity: p.opacity,
            transform: [{ translateY: p.y }],
          }}
        />
      ))}
    </View>
  );
}

const EMBER_COLORS = ["#E8B84B", "#FF7A3D", "#FFD166", "#F4A261", "#E76F51"];

export function EmberBurst({
  visible,
  onHide,
}: {
  visible: boolean;
  onHide: () => void;
}) {
  const PARTICLE_COUNT = 28;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      tx: new Animated.Value(0),
      ty: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.2),
      size: 4 + Math.random() * 6,
      angle: (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.4,
      distance: 90 + Math.random() * 160,
      color: EMBER_COLORS[i % EMBER_COLORS.length],
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;

    overlayOpacity.setValue(1);
    particles.forEach((p) => {
      p.tx.setValue(0);
      p.ty.setValue(0);
      p.opacity.setValue(0);
      p.scale.setValue(0.2);
    });

    const dx = (p: typeof particles[0]) => Math.cos(p.angle) * p.distance;
    const dy = (p: typeof particles[0]) => Math.sin(p.angle) * p.distance - 60;

    const particleAnimations = particles.map((p) =>
      Animated.sequence([
        Animated.parallel([
          Animated.timing(p.opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(p.scale, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(p.tx, {
            toValue: dx(p) * 0.3,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(p.ty, {
            toValue: dy(p) * 0.3,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(p.opacity, { toValue: 0, duration: 900, useNativeDriver: true }),
          Animated.timing(p.scale, { toValue: 0.4, duration: 900, useNativeDriver: true }),
          Animated.timing(p.tx, {
            toValue: dx(p),
            duration: 900,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(p.ty, {
            toValue: dy(p),
            duration: 900,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    Animated.parallel(particleAnimations).start(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => onHide());
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity: overlayOpacity, zIndex: 100 }]}
      pointerEvents="none"
    >
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        pointerEvents="none"
      >
        {particles.map((p, i) => (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: p.color,
              opacity: p.opacity,
              transform: [
                { translateX: p.tx },
                { translateY: p.ty },
                { scale: p.scale },
              ],
            }}
          />
        ))}
      </View>
    </Animated.View>
  );
}
