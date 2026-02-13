import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { listWallpapersApiPicturesListGet } from '@/src/api/controllers/pictures';
import type { components } from '@/src/api/openapi-schema';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** 设备类型：1=PC端，2=移动端，3=头像。本页仅查头像，与后端约定使用 3 */
const DEVICE_TYPE_AVATAR = 3;
const PAGE_SIZE = 10;
const HEADER_TOP_PADDING = 12;

type PictureItem = components['schemas']['PictureResponseInfo'];

/** 将列表按高度分配到两列，使两列总高度尽量接近（瀑布流） */
function buildWaterfallColumns(
  records: PictureItem[],
  columnWidth: number,
): { left: PictureItem[]; right: PictureItem[] } {
  const left: PictureItem[] = [];
  const right: PictureItem[] = [];
  let leftH = 0;
  let rightH = 0;
  for (const item of records) {
    const h = columnWidth * (item.height / item.width);
    if (leftH <= rightH) {
      left.push(item);
      leftH += h;
    } else {
      right.push(item);
      rightH += h;
    }
  }
  return { left, right };
}

export default function AvatarWallpaperScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const gap = 12;
  const padding = 16;
  const columnWidth = (width - padding * 2 - gap) / 2;
  const topInset = insets.top + HEADER_TOP_PADDING;

  const [records, setRecords] = useState<PictureItem[]>([]);
  const [pageNum, setPageNum] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const hasMore = records.length < total;

  const fetchPage = useCallback(async (page: number, append: boolean) => {
    if (page === 1) setLoading(true);
    try {
      const data = await listWallpapersApiPicturesListGet({
        params: {
          query: {
            page_num: page,
            page_size: PAGE_SIZE,
            device_type: DEVICE_TYPE_AVATAR,
          },
        },
      } as unknown as Parameters<typeof listWallpapersApiPicturesListGet>[0]);
      setTotal(data.total);
      if (append) {
        setRecords((prev) => [...prev, ...(data.records ?? [])]);
      } else {
        setRecords(data.records ?? []);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loadingMore || loading || !hasMore) return;
    const next = pageNum + 1;
    setPageNum(next);
    setLoadingMore(true);
    fetchPage(next, true);
  }, [loadingMore, loading, hasMore, pageNum, fetchPage]);

  const { left, right } = useMemo(
    () => buildWaterfallColumns(records, columnWidth),
    [records, columnWidth],
  );

  const checkAndLoadMore = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const paddingBottom = 150;
      const isNearBottom =
        contentOffset.y + layoutMeasurement.height >=
        contentSize.height - paddingBottom;
      if (isNearBottom) loadMore();
    },
    [loadMore],
  );

  const imageUri = (item: PictureItem) =>
    item.thumbnail_url ?? item.webp_url ?? null;

  const isDark = colorScheme === 'dark';
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  if (loading && records.length === 0) {
    return (
      <ThemedView style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </ThemedView>
    );
  }

  if (!loading && records.length === 0) {
    return (
      <ThemedView style={[styles.centered, { paddingTop: insets.top }]}>
        <ThemedText type="defaultSemiBold" style={styles.emptyText}>
          暂无头像壁纸
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: padding,
            paddingTop: padding + topInset,
            paddingBottom: padding + 48,
            gap,
          },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        onScroll={checkAndLoadMore}
        onMomentumScrollEnd={checkAndLoadMore}
        scrollEventThrottle={200}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="subtitle" style={styles.detailTitle}>
          头像壁纸
        </ThemedText>
        <View style={[styles.row, { gap }]}>
          <View style={styles.column}>
            {left.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.card,
                  {
                    width: columnWidth,
                    height: columnWidth * (item.height / item.width),
                    backgroundColor: cardBg,
                    marginBottom: gap,
                  },
                ]}
              >
                <Image
                  source={imageUri(item) ? { uri: imageUri(item)! } : undefined}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  recyclingKey={String(item.id)}
                />
              </View>
            ))}
          </View>
          <View style={styles.column}>
            {right.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.card,
                  {
                    width: columnWidth,
                    height: columnWidth * (item.height / item.width),
                    backgroundColor: cardBg,
                    marginBottom: gap,
                  },
                ]}
              >
                <Image
                  source={imageUri(item) ? { uri: imageUri(item)! } : undefined}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  recyclingKey={String(item.id)}
                />
              </View>
            ))}
          </View>
        </View>
        <View style={styles.footer}>
          {loadingMore ? (
            <>
              <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].tint} />
              <ThemedText style={styles.footerHintText}>加载中…</ThemedText>
            </>
          ) : hasMore ? (
            <ThemedText style={styles.footerHintText}>上拉加载更多</ThemedText>
          ) : (
            <ThemedText style={styles.footerHintText}>没有更多了</ThemedText>
          )}
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
  },
  detailTitle: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyText: {
    opacity: 0.6,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerHintText: {
    fontSize: 12,
    opacity: 0.6,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
