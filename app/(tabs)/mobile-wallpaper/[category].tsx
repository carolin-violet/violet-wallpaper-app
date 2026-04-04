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
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

/** 设备类型：1=PC端，2=移动端，3=头像。本页仅查手机端壁纸，与后端约定使用 2 */
const DEVICE_TYPE_PHONE = 2;
const PAGE_SIZE = 10;
/** 安全区之上再留出的标题区高度 */
const HEADER_TOP_PADDING = 12;

type FilterType = 'all' | 'featured';

type PictureItem = components['schemas']['PictureResponseInfo'];

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
  const scheme = colorScheme ?? 'light';
  const palette = Colors[scheme];

  const [records, setRecords] = useState<PictureItem[]>([]);
  const [pageNum, setPageNum] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  /** 筛选：all=全部，featured=精华 */
  const [filterType, setFilterType] = useState<FilterType>('all');
  /** 当前选中要操作的图片，非空时显示操作弹层 */
  const [selectedItem, setSelectedItem] = useState<PictureItem | null>(null);

  const hasMore = records.length < total;

  /** 将图片应用于壁纸/锁屏（Android 使用 react-native-manage-wallpaper；先调详情接口取原图 url） */
  const handleApplyWallpaper = useCallback(
    async (item: PictureItem, mode: 'home' | 'lock' | 'both') => {
      setSelectedItem(null);

      if (Platform.OS !== 'android') {
        Alert.alert(AppCopywriting.mobile.alert.tip, AppCopywriting.mobile.alert.androidOnly);
        return;
      }

      try {
        const detail = await getPictureApiPicturesPictureIdGet({
          params: { path: { picture_id: item.id } },
        });
        const uri = detail.url ?? detail.webp_url ?? detail.thumbnail_url ?? null;
        if (!uri) {
          Alert.alert(AppCopywriting.mobile.alert.fail, AppCopywriting.mobile.alert.noImage);
          return;
        }
        const WallpaperModule = require('react-native-manage-wallpaper');
        const ManageWallpaper = WallpaperModule.default;
        const TYPE = WallpaperModule.TYPE;
        if (!ManageWallpaper?.setWallpaper || TYPE == null) {
          Alert.alert(AppCopywriting.mobile.alert.setFail, AppCopywriting.mobile.alert.unsupported);
          return;
        }
        const wallpaperType = mode === 'home' ? TYPE.HOME : mode === 'lock' ? TYPE.LOCK : TYPE.BOTH;
        ManageWallpaper.setWallpaper(
          { uri },
          (res: { status: string; msg?: string }) => {
            if (res.status === 'success') {
              Alert.alert(AppCopywriting.mobile.alert.success, AppCopywriting.mobile.alert.setSuccess);
            } else {
              Alert.alert(AppCopywriting.mobile.alert.setFail, res.msg ?? AppCopywriting.mobile.alert.setFailedFallback);
            }
          },
          wallpaperType,
        );
      } catch (err) {
        Alert.alert(AppCopywriting.mobile.alert.setFail, (err as Error)?.message ?? AppCopywriting.mobile.alert.retryTip);
      }
    },
    [],
  );

  /**
   * 拉取分页数据
   * @param page 页码
   * @param append 是否追加到现有列表
   * @param nextFilter 当前要使用的筛选条件（用于切换时避免闭包时序问题）
   */
  const fetchPage = useCallback(
    async (
      page: number,
      append: boolean,
      nextFilter: FilterType = filterType,
      isRefresh = false, // 是否为下拉刷新场景
    ) => {
      if (page === 1 && !isRefresh) setLoading(true);
      try {
        const data = await listWallpapersApiPicturesListGet({
          params: {
            query: {
              page_num: page,
              page_size: PAGE_SIZE,
              device_type: DEVICE_TYPE_PHONE,
              ...(categoryCode ? { category: categoryCode } : {}),
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
        if (!isRefresh) setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [categoryCode, filterType],
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
    if (loadingMore || loading || refreshing || !hasMore) return;
    const next = pageNum + 1;
    setPageNum(next);
    setLoadingMore(true);
    fetchPage(next, true);
  }, [loadingMore, loading, refreshing, hasMore, pageNum, fetchPage]);

  /**
   * 下拉刷新列表：保持当前分类与筛选条件，重新请求第一页。
   */
  const handleRefresh = useCallback(() => {
    if (loading || refreshing) return;
    setPageNum(1);
    setTotal(0);
    setLoadingMore(false);
    setRefreshing(true);
    fetchPage(1, false, filterType, true);
  }, [loading, refreshing, filterType, fetchPage]);

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
        refreshing={refreshing}
        onRefresh={handleRefresh}
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
              {categoryTitle}
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
                  {AppCopywriting.mobile.all}
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
                  {AppCopywriting.mobile.featured}
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
                {filterType === 'featured'
                  ? categoryCode
                    ? AppCopywriting.mobile.emptyFeaturedInCategory
                    : AppCopywriting.mobile.emptyFeaturedAll
                  : categoryCode
                    ? AppCopywriting.mobile.emptyInCategory
                    : AppCopywriting.mobile.emptyAll}
              </ThemedText>
              <ThemedText
                type="link"
                style={[styles.backLink, { color: palette.tint }]}
                onPress={() => router.back()}
              >
                {AppCopywriting.mobile.backToCategory}
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
                  <ThemedText style={styles.footerHintText}>{AppCopywriting.mobile.loadingMore}</ThemedText>
                </>
              ) : hasMore ? (
                <ThemedText style={styles.footerHintText}>{AppCopywriting.mobile.loadMore}</ThemedText>
              ) : (
                <ThemedText style={styles.footerHintText}>{AppCopywriting.mobile.noMore}</ThemedText>
              )}
            </View>
          ) : null
        }
        renderItem={({ item }: { item: PictureItem }) => (
          <Pressable
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
            onPress={() => setSelectedItem(item)}
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

      {/* 图片操作弹层：应用于壁纸 / 锁屏 / 同时应用 */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <Pressable
          style={[styles.actionSheetOverlay, { backgroundColor: palette.overlay }]}
          onPress={() => setSelectedItem(null)}
        >
          <Pressable
            style={[
              styles.actionSheetBox,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                paddingBottom: 24 + (insets.bottom || 0),
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedItem ? (
              <>
                <View style={[styles.envelopeFlap, { backgroundColor: palette.surfaceSoft }]} />
                <View style={styles.envelopeHeader}>
                  <View style={[styles.envelopeSeal, { backgroundColor: palette.tint }]}>
                    <ThemedText style={styles.envelopeSealText}>V</ThemedText>
                  </View>
                  <ThemedText type="subtitle" style={[styles.envelopeTitle, { color: palette.tint }]}>
                    {AppCopywriting.mobile.sheet.title}
                  </ThemedText>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionSheetItem,
                    pressed && styles.actionSheetItemPressed,
                  ]}
                  onPress={() => handleApplyWallpaper(selectedItem, 'home')}
                >
                  <ThemedText type="defaultSemiBold">{AppCopywriting.mobile.sheet.home}</ThemedText>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionSheetItem,
                    pressed && styles.actionSheetItemPressed,
                  ]}
                  onPress={() => handleApplyWallpaper(selectedItem, 'lock')}
                >
                  <ThemedText type="defaultSemiBold">{AppCopywriting.mobile.sheet.lock}</ThemedText>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionSheetItem,
                    pressed && styles.actionSheetItemPressed,
                  ]}
                  onPress={() => handleApplyWallpaper(selectedItem, 'both')}
                >
                  <ThemedText type="defaultSemiBold">{AppCopywriting.mobile.sheet.both}</ThemedText>
                </Pressable>
                <View style={[styles.actionSheetDivider, { backgroundColor: palette.border }]} />
                <Pressable
                  style={({ pressed }) => [
                    styles.actionSheetItem,
                    pressed && styles.actionSheetItemPressed,
                  ]}
                  onPress={() => setSelectedItem(null)}
                >
                  <ThemedText style={[styles.actionSheetCancel, { color: palette.tint }]}>
                    {AppCopywriting.mobile.sheet.cancel}
                  </ThemedText>
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
  backLink: {
    marginTop: 12,
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
  actionSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionSheetBox: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  envelopeFlap: {
    height: 56,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    marginHorizontal: -16,
    marginTop: -12,
    marginBottom: 6,
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
    marginTop: -26,
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
