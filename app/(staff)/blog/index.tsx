import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/lib/theme';
import { BlogCard } from '@/src/features/blog/components/BlogCard';
import { BlogEmptyState } from '@/src/features/blog/components/BlogEmptyState';
import { useBlogInfiniteList } from '@/src/features/blog/hooks/useBlogInfiniteList';
import type { BlogPostSummaryDTO } from '@/src/features/blog/types/blog.types';
import { BackButton } from '@/src/shared/components/ScreenHeader';
import { SearchBar } from '@/src/shared/components/SearchBar';
import { useDebouncedValue } from '@/src/shared/hooks/useDebouncedValue';

export default function StaffBlogListScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  // Debounce 300ms như màn KB — tránh bắn request mỗi ký tự.
  const debouncedQuery = useDebouncedValue(query, 300);

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isError,
  } = useBlogInfiniteList({ pageSize: 10, q: debouncedQuery || undefined });

  const items = useMemo<BlogPostSummaryDTO[]>(
    () => data?.pages.flatMap((p) => p?.items ?? []) ?? [],
    [data],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Tin tức</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchWrap}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Tìm theo tiêu đề hoặc tóm tắt…"
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <BlogCard
            post={item}
            onPress={() =>
              router.push({
                pathname: '/(staff)/blog/[id]' as never,
                params: { id: item.id },
              } as never)
            }
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : isError ? (
            <View style={styles.errorWrap}>
              <Ionicons name="cloud-offline-outline" size={32} color={Colors.textFaint} />
              <Text style={styles.errorTitle}>Không tải được danh sách</Text>
              <Pressable onPress={() => refetch()} style={styles.retryBtn}>
                <Text style={styles.retryText}>Thử lại</Text>
              </Pressable>
            </View>
          ) : (
            <BlogEmptyState />
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator size="small" color={Colors.primary} style={styles.footerLoader} />
          ) : null
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isFetchingNextPage}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
        initialNumToRender={10}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  headerSpacer: { width: 36 },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  center: { paddingVertical: 48, alignItems: 'center' },
  errorWrap: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  errorTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  retryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: Colors.primaryLight,
  },
  retryText: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark },
  footerLoader: { marginVertical: 16 },
});
