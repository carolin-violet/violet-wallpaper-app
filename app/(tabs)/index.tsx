import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HEADER_TOP_PADDING = 20;
const CARD_VERTICAL_PADDING = 24;

type EntryItem = {
  key: string;
  title: string;
  desc: string;
  icon: 'iphone' | 'person.crop.circle';
  href: '/(tabs)/mobile-wallpaper' | '/(tabs)/avatar-wallpaper';
};

const ENTRIES: EntryItem[] = [
  {
    key: 'mobile',
    title: '手机壁纸',
    desc: '按分类浏览，设为手机壁纸',
    icon: 'iphone',
    href: '/(tabs)/mobile-wallpaper',
  },
  {
    key: 'avatar',
    title: '头像壁纸',
    desc: '精选头像，一键换装',
    icon: 'person.crop.circle',
    href: '/(tabs)/avatar-wallpaper',
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const topInset = insets.top + HEADER_TOP_PADDING;
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const isDark = colorScheme === 'dark';
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';

  const onEntryPress = useCallback(
    (href: EntryItem['href']) => {
      router.push(href as import('expo-router').Href);
    },
    [router],
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset,
            paddingBottom: 24 + (insets.bottom || 0),
          },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <ThemedText
            type="title"
            style={[styles.brandName, { color: tintColor }]}
          >
            Violet
          </ThemedText>
          <ThemedText style={styles.tagline}>
            精选壁纸，随你换
          </ThemedText>
        </View>

        <View style={styles.entries}>
          {ENTRIES.map((entry) => (
            <Pressable
              key={entry.key}
              onPress={() => onEntryPress(entry.href)}
              style={({ pressed }) => [
                styles.entryCard,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <View style={[styles.entryIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                <IconSymbol
                  name={entry.icon}
                  size={32}
                  color={tintColor}
                />
              </View>
              <View style={styles.entryBody}>
                <ThemedText type="defaultSemiBold" style={styles.entryTitle}>
                  {entry.title}
                </ThemedText>
                <ThemedText style={styles.entryDesc}>
                  {entry.desc}
                </ThemedText>
              </View>
              <IconSymbol
                name="chevron.right"
                size={20}
                color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  hero: {
    marginBottom: 32,
    paddingVertical: 8,
  },
  brandName: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 16,
    opacity: 0.72,
    lineHeight: 22,
  },
  entries: {
    gap: 14,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: CARD_VERTICAL_PADDING,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 16,
  },
  entryIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryBody: {
    flex: 1,
    gap: 4,
  },
  entryTitle: {
    fontSize: 17,
  },
  entryDesc: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 18,
  },
});
