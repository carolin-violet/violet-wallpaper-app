import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAllDictionariesApiDictionariesGet } from '@/src/api/controllers/dictionaries';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type CategoryItem = { code: string; name_cn: string };

/** 默认分类列表（接口失败时使用） */
const DEFAULT_CATEGORIES: CategoryItem[] = [];

/** 从字典接口获取分类列表，失败则用默认 */
function useCategories() {
  const [list, setList] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAllDictionariesApiDictionariesGet({
      params: { query: { type: 0 } },
    } as unknown as Parameters<typeof getAllDictionariesApiDictionariesGet>[0])
      .then((res) => {
        if (cancelled) return;
        const data = res as unknown as { records?: CategoryItem[] };
        if (Array.isArray(data?.records) && data.records.length > 0) {
          setList(data.records);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories: list, loading };
}

const HEADER_TOP_PADDING = 12;

export default function MobileWallpaperCategoryScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { categories, loading } = useCategories();

  const padding = 16;
  const gap = 12;
  const numColumns = 2;
  const cardWidth = (width - padding * 2 - gap) / numColumns;
  const topInset = insets.top + HEADER_TOP_PADDING;

  const onCategoryPress = useCallback(
    (category: CategoryItem) => {
      const code = encodeURIComponent(category.code);
      const title = encodeURIComponent(category.name_cn);
      router.push(
        `/(tabs)/mobile-wallpaper/${code}?title=${title}` as import('expo-router').Href,
      );
    },
    [router],
  );

  const isDark = colorScheme === 'dark';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  if (loading) {
    return (
      <ThemedView style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { padding, paddingTop: padding + topInset, gap },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="subtitle" style={styles.title}>
          选择分类
        </ThemedText>
        <View style={[styles.grid, { gap }]}>
          {categories.map((category) => (
            <Pressable
              key={category.code}
              onPress={() => onCategoryPress(category)}
              style={({ pressed }) => [
                styles.card,
                {
                  width: cardWidth,
                  backgroundColor: cardBg,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <ThemedText type="defaultSemiBold" style={styles.cardText}>
                {category.name_cn}
              </ThemedText>
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
    paddingBottom: 32,
  },
  title: {
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    fontSize: 15,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
