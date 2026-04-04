import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppCopywriting } from '@/constants/copywriting';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAllDictionariesApiDictionariesGet } from '@/src/api/controllers/dictionaries';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
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
  const [refreshing, setRefreshing] = useState(false);

  /**
   * 拉取分类数据。
   * @param isRefresh 是否为下拉刷新场景，为 true 时不触发首屏 loading
   */
  const fetchCategories = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await getAllDictionariesApiDictionariesGet({
        params: { query: { type: 0 } },
      } as unknown as Parameters<typeof getAllDictionariesApiDictionariesGet>[0]);
      const data = res as unknown as { records?: CategoryItem[] };
      if (Array.isArray(data?.records)) {
        setList(data.records);
      }
    } catch {
    } finally {
      if (!isRefresh) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  /**
   * 触发分类页下拉刷新。
   */
  const refreshCategories = useCallback(() => {
    if (loading || refreshing) return;
    setRefreshing(true);
    void fetchCategories(true);
  }, [loading, refreshing, fetchCategories]);

  return { categories: list, loading, refreshing, refreshCategories };
}

const HEADER_TOP_PADDING = 12;

export default function MobileWallpaperCategoryScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { categories, loading, refreshing, refreshCategories } = useCategories();

  const padding = 16;
  const gap = 12;
  const numColumns = 2;
  const cardWidth = (width - padding * 2 - gap) / numColumns;
  const topInset = insets.top + HEADER_TOP_PADDING;
  const scheme = colorScheme ?? 'light';
  const palette = Colors[scheme];

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

  const cardBg = palette.elevated;

  if (loading) {
    return (
      <ThemedView style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={palette.tint} />
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshCategories}
            tintColor={palette.tint}
            colors={[palette.tint]}
          />
        }
      >
        <View
          style={[
            styles.hero,
            { backgroundColor: palette.surfaceSoft, borderColor: palette.border },
          ]}
        >
          <ThemedText type="title" style={[styles.heroTitle, { color: palette.tint }]}>
            手机壁纸
          </ThemedText>
          <ThemedText style={styles.heroText}>
            {AppCopywriting.mobile.heroText}
          </ThemedText>
        </View>
        <ThemedText type="subtitle" style={styles.title}>
          {AppCopywriting.mobile.pickCategory}
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
                  borderColor: palette.border,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
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
    marginBottom: 10,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 6,
  },
  heroText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.78,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2b1a3a',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
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
