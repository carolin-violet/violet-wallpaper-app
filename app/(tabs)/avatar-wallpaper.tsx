import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppCopywriting } from '@/constants/copywriting';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  getPictureApiPicturesPictureIdGet,
  listWallpapersApiPicturesListGet,
} from '@/src/api/controllers/pictures';
import type { components } from '@/src/api/openapi-schema';
import { FlashList } from '@shopify/flash-list';
import { File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** 设备类型：1=PC端，2=移动端，3=头像。本页仅查头像，与后端约定使用 3 */
const DEVICE_TYPE_AVATAR = 3;
const PAGE_SIZE = 10;
const HEADER_TOP_PADDING = 12;

type FilterType = 'all' | 'featured';

type PictureItem = components['schemas']['PictureResponseInfo'];

export default function AvatarWallpaperScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const gap = 12;
  const padding = 16;
  const columnWidth = (width - padding * 2 - gap) / 2;
  const topInset = insets.top + HEADER_TOP_PADDING;
  const scheme = colorScheme ?? 'light';
  const palette = Colors[scheme];

  const [records, setRecords] = useState<PictureItem[]>([]);
  const [pageNum, setPageNum] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  /** 筛选：all=全部，featured=精华 */
  const [filterType, setFilterType] = useState<FilterType>('all');
  /** 当前选中的图片，非空时显示操作弹窗 */
  const [selectedItem, setSelectedItem] = useState<PictureItem | null>(null);
  const [downloading, setDownloading] = useState(false);

  const hasMore = records.length < total;

  /** 下载图片并保存到系统相册（先调详情取原图 url，再写入相册，用户可在相册/图库中查看） */
  const handleDownload = useCallback(async () => {
    const item = selectedItem;
    if (!item) return;
    if (Platform.OS === 'web') {
      Alert.alert(AppCopywriting.avatar.alert.tip, AppCopywriting.avatar.alert.webTip);
      return;
    }
    setDownloading(true);
    try {
      const detail = await getPictureApiPicturesPictureIdGet({
        params: { path: { picture_id: item.id } },
      });
      const uri = detail.url ?? detail.webp_url ?? detail.thumbnail_url ?? null;
      if (!uri) {
        Alert.alert(AppCopywriting.avatar.alert.fail, AppCopywriting.avatar.alert.noImage);
        return;
      }
      const ext = uri.includes('.webp') ? 'webp' : 'jpg';
      const dest = new File(Paths.cache, `avatar_${item.id}.${ext}`);
      await File.downloadFileAsync(uri, dest, { idempotent: true });

      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert(AppCopywriting.avatar.alert.needPermission, AppCopywriting.avatar.alert.permissionContent);
        return;
      }
      await MediaLibrary.saveToLibraryAsync(dest.uri);
      Alert.alert(AppCopywriting.avatar.alert.success, AppCopywriting.avatar.alert.saveSuccess);
      setSelectedItem(null);
    } catch (err) {
      Alert.alert(AppCopywriting.avatar.alert.downloadFail, (err as Error)?.message ?? AppCopywriting.avatar.alert.retryTip);
    } finally {
      setDownloading(false);
    }
  }, [selectedItem]);

  /**
   * 拉取分页数据
   * @param page 页码
   * @param append 是否追加到现有列表
   * @param nextFilter 当前要使用的筛选条件（用于切换时避免闭包时序问题）
   */
  const fetchPage = useCallback(
    async (page: number, append: boolean, nextFilter: FilterType = filterType) => {
      if (page === 1) setLoading(true);
      try {
        const data = await listWallpapersApiPicturesListGet({
          params: {
            query: {
              page_num: page,
              page_size: PAGE_SIZE,
              device_type: DEVICE_TYPE_AVATAR,
              ...(nextFilter === 'featured' ? { is_featured: 1 } : {}),
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
    [filterType],
  );

  useEffect(() => {
    setPageNum(1);
    setRecords([]);
    setTotal(0);
    fetchPage(1, false);
  }, [fetchPage]);

  /**
   * 切换筛选：重置列表与分页，并重新拉取第一页
   * @param nextFilter 下一个筛选类型
   */
  const handleChangeFilter = useCallback(
    (nextFilter: FilterType) => {
      if (nextFilter === filterType) return;
      setFilterType(nextFilter);
      setPageNum(1);
      setRecords([]);
      setTotal(0);
      setLoadingMore(false);
      fetchPage(1, false, nextFilter);
    },
    [filterType, fetchPage],
  );

  const loadMore = useCallback(() => {
    if (loadingMore || loading || !hasMore) return;
    const next = pageNum + 1;
    setPageNum(next);
    setLoadingMore(true);
    fetchPage(next, true);
  }, [loadingMore, loading, hasMore, pageNum, fetchPage]);

  const imageUri = (item: PictureItem) =>
    item.thumbnail_url ?? item.webp_url ?? null;

  const isDark = scheme === 'dark';
  const cardBg = palette.elevated;

  const listContentPaddingHorizontal = padding - gap / 2;

  return (
    <ThemedView style={styles.container}>

      <FlashList<PictureItem>
        data={records}
        masonry
        optimizeItemArrangement
        numColumns={2}
        keyExtractor={(item: PictureItem) => String(item.id)}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        contentContainerStyle={{
          paddingTop: padding + topInset,
          paddingBottom: padding + 48,
          paddingHorizontal: listContentPaddingHorizontal,
        }}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: gap / 2 }}>
            <ThemedText type="subtitle" style={[styles.detailTitle, { color: palette.tint }]}>
              {AppCopywriting.avatar.title}
            </ThemedText>
            <View style={[styles.filterRow, { backgroundColor: palette.chip }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.filterItem,
                  filterType === 'all' && styles.filterItemActive,
                  pressed && styles.filterItemPressed,
                ]}
                onPress={() => handleChangeFilter('all')}
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={filterType === 'all' ? styles.filterTextActive : styles.filterText}
                >
                  {AppCopywriting.avatar.all}
                </ThemedText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.filterItem,
                  filterType === 'featured' && styles.filterItemActive,
                  pressed && styles.filterItemPressed,
                ]}
                onPress={() => handleChangeFilter('featured')}
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={filterType === 'featured' ? styles.filterTextActive : styles.filterText}
                >
                  {AppCopywriting.avatar.featured}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={palette.tint} />
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <ThemedText type="defaultSemiBold" style={styles.emptyText}>
                {filterType === 'featured' ? AppCopywriting.avatar.emptyFeatured : AppCopywriting.avatar.emptyAll}
              </ThemedText>
            </View>
          )
        }
        ListFooterComponent={
          records.length > 0 ? (
            <View style={styles.footer}>
              {loadingMore ? (
                <>
                  <ActivityIndicator size="small" color={palette.tint} />
                  <ThemedText style={styles.footerHintText}>{AppCopywriting.avatar.loadingMore}</ThemedText>
                </>
              ) : hasMore ? (
                <ThemedText style={styles.footerHintText}>{AppCopywriting.avatar.loadMore}</ThemedText>
              ) : (
                <ThemedText style={styles.footerHintText}>{AppCopywriting.avatar.noMore}</ThemedText>
              )}
            </View>
          ) : null
        }
        renderItem={({ item }: { item: PictureItem }) => (
          <Pressable
            onPress={() => setSelectedItem(item)}
            style={[
              styles.card,
              {
                width: columnWidth,
                height: columnWidth * (item.height / item.width),
                backgroundColor: cardBg,
                borderColor: palette.border,
                marginHorizontal: gap / 2,
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
            <View
              style={[
                styles.imageOverlay,
                {
                  backgroundColor: isDark ? 'rgba(20,12,30,0.14)' : 'rgba(127,90,166,0.08)',
                },
              ]}
            />
          </Pressable>
        )}
      />

      <Modal
        visible={selectedItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <Pressable
          style={[styles.modalBackdrop, { backgroundColor: palette.overlay }]}
          onPress={() => setSelectedItem(null)}
        >
          <Pressable
            style={[
              styles.modalContent,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
            onPress={() => { }}
          >
            <View style={[styles.envelopeFlap, { backgroundColor: palette.surfaceSoft }]} />
            <View style={styles.envelopeHeader}>
              <View style={[styles.envelopeSeal, { backgroundColor: palette.tint }]}>
                <ThemedText style={styles.envelopeSealText}>V</ThemedText>
              </View>
              <ThemedText type="subtitle" style={[styles.envelopeTitle, { color: palette.tint }]}>
                {AppCopywriting.avatar.sheet.title}
              </ThemedText>
            </View>
            <Pressable
              style={[styles.modalButton, { backgroundColor: palette.tint }]}
              onPress={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={styles.modalButtonPrimaryText}>
                  {AppCopywriting.avatar.sheet.download}
                </ThemedText>
              )}
            </Pressable>
            <Pressable
              style={[
                styles.modalButton,
                { backgroundColor: palette.chip },
              ]}
              onPress={() => setSelectedItem(null)}
              disabled={downloading}
            >
              <ThemedText
                style={[styles.modalButtonText, { color: palette.text }]}
              >
                {AppCopywriting.avatar.sheet.cancel}
              </ThemedText>
            </Pressable>
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
  detailTitle: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderRadius: 9999,
    padding: 4,
    marginBottom: 14,
  },
  filterItem: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  filterItemActive: {
    backgroundColor: 'rgba(127,90,166,0.26)',
  },
  filterItemPressed: {
    opacity: 0.85,
  },
  filterText: {
    opacity: 0.7,
  },
  filterTextActive: {
    opacity: 1,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#2b1b3b',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  emptyText: {
    opacity: 0.6,
  },
  loadingBox: {
    paddingTop: 32,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    paddingTop: 32,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderWidth: 1,
    overflow: 'hidden',
  },
  envelopeFlap: {
    height: 56,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 8,
  },
  envelopeHeader: {
    alignItems: 'center',
    marginBottom: 2,
  },
  envelopeSeal: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    marginBottom: 8,
  },
  envelopeSealText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  envelopeTitle: {
    fontSize: 18,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
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
