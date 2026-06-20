import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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
import { Colors } from '../../../src/lib/theme';
import type { TicketCategoryEnum } from '../../../src/shared/enums/ticket.enum';
import { KbArticleCard } from '../../../src/features/kb/components/KbArticleCard';
import { KbCategoryChips } from '../../../src/features/kb/components/KbCategoryChips';
import { KbEmptyState } from '../../../src/features/kb/components/KbEmptyState';
import { KbSearchBar } from '../../../src/features/kb/components/KbSearchBar';
import { useDebouncedValue } from '../../../src/features/kb/hooks/useDebouncedValue';
import { useKbInfiniteList } from '../../../src/features/kb/hooks/useKbInfiniteList';
import type { KbArticleSummaryDTO } from '../../../src/features/kb/types/kb.types';

export default function KbListScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tag?: string }>();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TicketCategoryEnum | null>(null);
  const [activeTag, setActiveTag] = useState<string | undefined>(params.tag);
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
  } = useKbInfiniteList({
    q: debouncedQuery,
    category: category ?? undefined,
    tag: activeTag,
    pageSize: 15,
  });

  const items = useMemo<KbArticleSummaryDTO[]>(
    () => data?.pages.flatMap((p) => p?.items ?? []) ?? [],
    [data],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Bài hướng dẫn</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.filterWrap}>
        <KbSearchBar value={query} onChangeText={setQuery} />
        <KbCategoryChips selected={category} onChange={setCategory} />
        {activeTag && (
          <View style={styles.tagFilterRow}>
            <Text style={styles.tagFilterLabel}>Tag:</Text>
            <Pressable style={styles.tagFilterChip} onPress={() => setActiveTag(undefined)}>
              <Text style={styles.tagFilterChipText}>#{activeTag}</Text>
              <Ionicons name="close-circle" size={14} color={Colors.primary} />
            </Pressable>
          </View>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <KbArticleCard
            article={item}
            onPress={() =>
              router.push({
                pathname: '/(customer)/kb/[id]' as never,
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
            <KbEmptyState query={debouncedQuery} category={category} />
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={{ marginVertical: 16 }}
            />
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
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
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
  headerSpacer: {
    width: 36,
  },
  filterWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  errorWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  errorTitle: {
    fontSize: 14,
    color: Colors.textMute,
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  retryText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  tagFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  tagFilterLabel: {
    fontSize: 12,
    color: Colors.textMute,
    fontWeight: '500',
  },
  tagFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tagFilterChipText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
});
