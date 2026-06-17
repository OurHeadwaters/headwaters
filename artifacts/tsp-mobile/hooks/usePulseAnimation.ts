import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export function usePulseAnimation(active: boolean): Animated.Value {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(1);
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [active]);

  return opacity;
}
