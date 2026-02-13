import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  getPictureApiPicturesPictureIdGet,
  listWallpapersApiPicturesListGet,
} from '@/src/api/controllers/pictures';
import type { components } from '@/src/api/openapi-schema';
import { File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
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
  /** 当前选中的图片，非空时显示操作弹窗 */
  const [selectedItem, setSelectedItem] = useState<PictureItem | null>(null);
  const [downloading, setDownloading] = useState(false);

  const hasMore = records.length < total;

  /** 下载图片到本地（先调详情接口取原图 url，再写入应用文档目录） */
  const handleDownload = useCallback(async () => {
    const item = selectedItem;
    if (!item) return;
    if (Platform.OS === 'web') {
      Alert.alert('提示', '请使用手机 App 下载到本地');
      return;
    }
    setDownloading(true);
    try {
      const detail = await getPictureApiPicturesPictureIdGet({
        params: { path: { picture_id: item.id } },
      });
      const uri = detail.url ?? detail.webp_url ?? detail.thumbnail_url ?? null;
      if (!uri) {
        Alert.alert('失败', '无法获取图片地址');
        return;
      }
      const ext = uri.includes('.webp') ? 'webp' : 'jpg';
      const dest = new File(Paths.document, `avatar_${item.id}.${ext}`);
      await File.downloadFileAsync(uri, dest, { idempotent: true });
      Alert.alert('成功', '已保存到本地');
      setSelectedItem(null);
    } catch (err) {
      Alert.alert('下载失败', (err as Error)?.message ?? '请稍后重试');
    } finally {
      setDownloading(false);
    }
  }, [selectedItem]);

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
              <Pressable
                key={item.id}
                onPress={() => setSelectedItem(item)}
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
              </Pressable>
            ))}
          </View>
          <View style={styles.column}>
            {right.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setSelectedItem(item)}
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
              </Pressable>
            ))}
          </View>
        </View>
        <Modal
          visible={selectedItem !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedItem(null)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setSelectedItem(null)}
          >
            <Pressable
              style={[
                styles.modalContent,
                { backgroundColor: isDark ? Colors.dark.background : '#fff' },
              ]}
              onPress={() => {}}
            >
              <ThemedText type="subtitle" style={styles.modalTitle}>
                保存图片
              </ThemedText>
              <Pressable
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.modalButtonPrimaryText}>
                    下载到本地
                  </ThemedText>
                )}
              </Pressable>
              <Pressable
                style={[
                  styles.modalButton,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' },
                ]}
                onPress={() => setSelectedItem(null)}
                disabled={downloading}
              >
                <ThemedText
                  style={[styles.modalButtonText, { color: isDark ? Colors.dark.text : '#333' }]}
                >
                  取消
                </ThemedText>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    marginBottom: 4,
    textAlign: 'center',
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: Colors.light?.tint ?? '#6366f1',
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonText: {
    fontSize: 16,
  },
});
