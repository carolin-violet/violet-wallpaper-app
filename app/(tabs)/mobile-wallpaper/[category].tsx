import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  getPictureApiPicturesPictureIdGet,
  listWallpapersApiPicturesListGet,
} from '@/src/api/controllers/pictures';
import ManageWallpaper, { TYPE } from 'react-native-manage-wallpaper';
import type { components } from '@/src/api/openapi-schema';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** 设备类型：1=PC端，2=移动端，3=头像。本页仅查手机端壁纸，与后端约定使用 2 */
const DEVICE_TYPE_PHONE = 2;
const PAGE_SIZE = 10;
/** 安全区之上再留出的标题区高度 */
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

export default function MobileWallpaperDetailScreen() {
  const { category: categoryParam, title: titleParam } = useLocalSearchParams<{
    category?: string;
    title?: string;
  }>();
  const router = useRouter();
  /** 接口查询用：code，全部或未传时为 null */
  const categoryCode =
    !categoryParam || categoryParam === 'all' ? null : decodeURIComponent(categoryParam);
  /** 详情页展示用：中文标题 */
  const categoryTitle = titleParam ? decodeURIComponent(titleParam) : categoryCode ?? '全部';

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
  /** 当前选中要操作的图片，非空时显示操作弹层 */
  const [selectedItem, setSelectedItem] = useState<PictureItem | null>(null);

  const hasMore = records.length < total;

  /** 将图片应用于壁纸/锁屏（Android 使用 react-native-manage-wallpaper；先调详情接口取原图 url） */
  const handleApplyWallpaper = useCallback(
    async (item: PictureItem, mode: 'home' | 'lock' | 'both') => {
      setSelectedItem(null);

      if (Platform.OS !== 'android') {
        Alert.alert('提示', '设置壁纸当前仅支持 Android 设备，请使用 Android 手机尝试。');
        return;
      }

      try {
        const detail = await getPictureApiPicturesPictureIdGet({
          params: { path: { picture_id: item.id } },
        });
        const uri = detail.url ?? detail.webp_url ?? detail.thumbnail_url ?? null;
        if (!uri) {
          Alert.alert('失败', '无法获取图片地址');
          return;
        }
        const wallpaperType = mode === 'home' ? TYPE.HOME : mode === 'lock' ? TYPE.LOCK : TYPE.BOTH;
        ManageWallpaper.setWallpaper(
          { uri },
          (res: { status: string; msg?: string }) => {
            if (res.status === 'success') {
              Alert.alert('成功', '壁纸已设置');
            } else {
              Alert.alert('设置失败', res.msg ?? '设置壁纸失败');
            }
          },
          wallpaperType,
        );
      } catch (err) {
        Alert.alert('设置失败', (err as Error)?.message ?? '请使用开发版或正式包重试（Expo Go 不支持）');
      }
    },
    [],
  );

  const fetchPage = useCallback(
    async (page: number, append: boolean) => {
      if (page === 1) setLoading(true);
      try {
        const data = await listWallpapersApiPicturesListGet({
          params: {
            query: {
              page_num: page,
              page_size: PAGE_SIZE,
              device_type: DEVICE_TYPE_PHONE,
              ...(categoryCode ? { category: categoryCode } : {}),
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
    },
    [categoryCode],
  );

  useEffect(() => {
    setPageNum(1);
    setRecords([]);
    setTotal(0);
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
          {categoryCode ? `该分类暂无壁纸` : '暂无手机壁纸'}
        </ThemedText>
        <ThemedText
          type="link"
          style={styles.backLink}
          onPress={() => router.back()}
        >
          返回分类
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
          {categoryTitle}
        </ThemedText>
        <View style={[styles.row, { gap }]}>
          <View style={styles.column}>
            {left.map((item) => (
              <Pressable
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
                onPress={() => setSelectedItem(item)}
              >
                <Image
                  source={imageUri(item) ? { uri: imageUri(item)! } : undefined}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  recyclingKey={String(item.id)}
                />
              </Pressable>
            ))}
          </View>
          <View style={styles.column}>
            {right.map((item) => (
              <Pressable
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
                onPress={() => setSelectedItem(item)}
              >
                <Image
                  source={imageUri(item) ? { uri: imageUri(item)! } : undefined}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  recyclingKey={String(item.id)}
                />
              </Pressable>
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

      {/* 图片操作弹层：应用于壁纸 / 锁屏 / 同时应用 */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <Pressable
          style={styles.actionSheetOverlay}
          onPress={() => setSelectedItem(null)}
        >
          <Pressable
            style={[
              styles.actionSheetBox,
              {
                backgroundColor: isDark ? '#1e293b' : '#fff',
                paddingBottom: 24 + (insets.bottom || 0),
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedItem ? (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionSheetItem,
                    pressed && styles.actionSheetItemPressed,
                  ]}
                  onPress={() => handleApplyWallpaper(selectedItem, 'home')}
                >
                  <ThemedText type="defaultSemiBold">将图片应用于壁纸</ThemedText>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionSheetItem,
                    pressed && styles.actionSheetItemPressed,
                  ]}
                  onPress={() => handleApplyWallpaper(selectedItem, 'lock')}
                >
                  <ThemedText type="defaultSemiBold">将图片应用于锁屏</ThemedText>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionSheetItem,
                    pressed && styles.actionSheetItemPressed,
                  ]}
                  onPress={() => handleApplyWallpaper(selectedItem, 'both')}
                >
                  <ThemedText type="defaultSemiBold">同时应用于壁纸与锁屏</ThemedText>
                </Pressable>
                <View style={[styles.actionSheetDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />
                <Pressable
                  style={({ pressed }) => [
                    styles.actionSheetItem,
                    pressed && styles.actionSheetItemPressed,
                  ]}
                  onPress={() => setSelectedItem(null)}
                >
                  <ThemedText style={styles.actionSheetCancel}>取消</ThemedText>
                </Pressable>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
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
  backLink: {
    marginTop: 12,
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
  actionSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  actionSheetBox: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  actionSheetItem: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionSheetItemPressed: {
    opacity: 0.7,
  },
  actionSheetDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  actionSheetCancel: {
    opacity: 0.8,
  },
});
