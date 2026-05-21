import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface WoodCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  innerStyle?: ViewStyle;
  noPadding?: boolean;
}

export function WoodCard({ children, style, innerStyle, noPadding = false }: WoodCardProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.outer,
        {
          backgroundColor: colors.woodBorder,
          borderColor: colors.woodBrown,
          shadowColor: colors.forestDeep,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            backgroundColor: colors.card,
            borderColor: colors.woodBorder,
          },
          !noPadding && styles.innerPadding,
          innerStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 14,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
    overflow: "hidden",
  },
  inner: {
    borderRadius: 11,
    borderWidth: 1,
  },
  innerPadding: {
    padding: 16,
  },
});
