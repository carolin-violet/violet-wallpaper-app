import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppCopywriting } from '@/constants/copywriting';
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
    desc: AppCopywriting.home.mobileDesc,
    icon: 'iphone',
    href: '/(tabs)/mobile-wallpaper',
  },
  {
    key: 'avatar',
    title: '头像壁纸',
    desc: AppCopywriting.home.avatarDesc,
    icon: 'person.crop.circle',
    href: '/(tabs)/avatar-wallpaper',
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const topInset = insets.top + HEADER_TOP_PADDING;
  const scheme = colorScheme ?? 'light';
  const palette = Colors[scheme];
  const tintColor = palette.tint;
  const isDark = colorScheme === 'dark';
  const cardBg = palette.elevated;
  const cardBorder = palette.border;
  const heroBg = palette.surfaceSoft;

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
        <View style={[styles.hero, { borderColor: palette.border }]}>
          <View style={[styles.heroBackdrop, { backgroundColor: heroBg }]} />
          <View
            style={[
              styles.heroGlowPrimary,
              { backgroundColor: isDark ? 'rgba(202,166,235,0.25)' : 'rgba(127,90,166,0.16)' },
            ]}
          />
          <View
            style={[
              styles.heroGlowSecondary,
              { backgroundColor: isDark ? 'rgba(211,177,129,0.18)' : 'rgba(185,148,98,0.14)' },
            ]}
          />
          <ThemedText
            type="title"
            style={[styles.brandName, { color: tintColor }]}
          >
            Violet
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: palette.gold }]}>
            {AppCopywriting.home.subtitle}
          </ThemedText>
          <ThemedText style={styles.tagline}>
            {AppCopywriting.home.tagline}
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
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <View style={[styles.entryIconWrap, { backgroundColor: palette.chip }]}>
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
                color={palette.icon}
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
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    gap: 6,
  },
  heroBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  heroGlowPrimary: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -56,
    right: -44,
  },
  heroGlowSecondary: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: -36,
    left: -26,
  },
  brandName: {
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 15,
    opacity: 0.78,
    lineHeight: 23,
  },
  entries: {
    gap: 14,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: CARD_VERTICAL_PADDING,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 16,
    shadowColor: '#2a193a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
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
    opacity: 0.72,
    lineHeight: 20,
  },
});
