import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const scheme = colorScheme ?? 'light';
  const palette = Colors[scheme];
  const tabBarBottomPadding = 10 + insets.bottom;
  const tabBarHeight = 56 + tabBarBottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.tabIconSelected,
        tabBarInactiveTintColor: palette.tabIconDefault,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: tabBarBottomPadding,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "首页",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mobile-wallpaper"
        options={{
          title: "手机壁纸",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="iphone" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="avatar-wallpaper"
        options={{
          title: "头像壁纸",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.crop.circle" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
