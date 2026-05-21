import React, { useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface FieldNoteCardProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  style?: ViewStyle;
}

export function FieldNoteCard({ title, children, defaultOpen = false, style }: FieldNoteCardProps) {
  const colors = useColors();
  const [open, setOpen] = useState(defaultOpen);
  const rotation = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;
  const heightAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const toggle = () => {
    const toValue = open ? 0 : 1;
    Animated.parallel([
      Animated.timing(rotation, {
        toValue,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(heightAnim, {
        toValue,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
    setOpen(!open);
  };

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.fieldNote,
          borderColor: colors.fieldNoteBorder,
        },
        style,
      ]}
    >
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.header, { opacity: pressed ? 0.75 : 1 }]}
      >
        <Text
          style={[
            styles.title,
            {
              color: colors.woodBrown,
              fontFamily: "DMSans_600SemiBold",
            },
          ]}
        >
          {title}
        </Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-forward" size={16} color={colors.woodBrown} />
        </Animated.View>
      </Pressable>

      <Animated.View
        style={{
          maxHeight: heightAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 400],
          }),
          opacity: heightAnim,
          overflow: "hidden",
        }}
      >
        <View style={styles.body}>{children}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  title: {
    fontSize: 14,
    flex: 1,
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
});
