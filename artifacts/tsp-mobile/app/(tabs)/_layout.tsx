import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { MiniPlayer } from "@/components/MiniPlayer";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  const { currentEpisode } = usePlayer();
  return (
    <View style={{ flex: 1 }}>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf={{ default: "house", selected: "house.fill" }} />
          <Label>Home</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="archive" role="search">
          <Icon sf={{ default: "list.bullet", selected: "list.bullet" }} />
          <Label>Archive</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="history">
          <Icon sf={{ default: "clock", selected: "clock.fill" }} />
          <Label>History</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="downloads">
          <Icon sf={{ default: "arrow.down.circle", selected: "arrow.down.circle.fill" }} />
          <Label>Downloads</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="wishing-well">
          <Icon sf={{ default: "drop.circle", selected: "drop.circle.fill" }} />
          <Label>Well</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="privacy-guide">
          <Icon sf={{ default: "lock.shield", selected: "lock.shield.fill" }} />
          <Label>Privacy</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="bookmarks">
          <Icon sf={{ default: "bookmark", selected: "bookmark.fill" }} />
          <Label>Bookmarks</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
      {currentEpisode && <MiniPlayer />}
    </View>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { currentEpisode } = usePlayer();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            elevation: 0,
            ...(isWeb ? { height: 84 } : {}),
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView
                intensity={100}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            ) : isWeb ? (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: colors.background },
                ]}
              />
            ) : null,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="house" tintColor={color} size={24} />
              ) : (
                <Feather name="home" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="archive"
          options={{
            title: "Archive",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="list.bullet" tintColor={color} size={22} />
              ) : (
                <Feather name="list" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="clock" tintColor={color} size={22} />
              ) : (
                <Feather name="clock" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="downloads"
          options={{
            title: "Downloads",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="arrow.down.circle" tintColor={color} size={24} />
              ) : (
                <Feather name="download" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="wishing-well"
          options={{
            title: "Well",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="drop.circle" tintColor={color} size={24} />
              ) : (
                <Feather name="gift" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="privacy-guide"
          options={{
            title: "Privacy",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="lock.shield" tintColor={color} size={24} />
              ) : (
                <Feather name="shield" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="bookmarks"
          options={{
            title: "Bookmarks",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="bookmark" tintColor={color} size={22} />
              ) : (
                <Feather name="bookmark" size={22} color={color} />
              ),
          }}
        />
      </Tabs>
      {currentEpisode && <MiniPlayer />}
    </View>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
