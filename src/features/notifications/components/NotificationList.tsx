import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/src/lib/theme';
import { useNotificationCategoryMap } from '../hooks/useNotificationMatrix';
import {
  useInfiniteNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkNotificationOpened,
  useMarkAllRead,
} from '../hooks/useNotifications';
import { NotificationCategoryEnum } from '../enums/notification.enum';
import { NotificationCard } from './NotificationCard';
import { CategoryFilter, CategoryFilterChips } from './CategoryFilterChips';
import { isUnread, NotificationDTO } from '../types/notification.types';
import { notificationHref, ticketIdFromPayload } from '../lib/notificationHref';
import { useSessionStore } from '../../../stores/sessionStore';

export function NotificationList() {
  const role = useSessionStore((s) => s.user?.role);
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: categoryMap } = useNotificationCategoryMap();
  const [category, setCategory] = useState<CategoryFilter>(null);
  const markRead = useMarkNotificationRead();
  const markOpened = useMarkNotificationOpened();
  const markAllRead = useMarkAllRead();

  const allItems = useMemo(
    () => data?.pages.flatMap((p) => p?.items ?? []) ?? [],
    [data],
  );

  // type → category comes from BE (`GET /notification-preferences/categories`), NOT duplicated client-side:
  // adding a new NotificationType while the client keeps its own table would go stale immediately.
  const typeToCategory = useMemo(() => {
    const map = new Map<number, NotificationCategoryEnum>();
    categoryMap?.forEach((e) => map.set(e.typeValue, e.categoryValue as NotificationCategoryEnum));
    return map;
  }, [categoryMap]);

  // A BE type not yet declared in the map falls back to `Account` — matches the default branch of
  // `NotificationCategoryMap.Resolve()` on the BE, so that row doesn't disappear from every chip.
  const categoryOf = useCallback(
    (n: NotificationDTO): NotificationCategoryEnum =>
      typeToCategory.get(n.type) ?? NotificationCategoryEnum.Account,
    [typeToCategory],
  );

  const counts = useMemo(() => {
    const acc: Record<string, number> = {};
    allItems.forEach((n) => {
      const key = String(categoryOf(n));
      acc[key] = (acc[key] ?? 0) + 1;
    });
    return acc;
  }, [allItems, categoryOf]);

  const items = useMemo(
    () => (category === null ? allItems : allItems.filter((n) => categoryOf(n) === category)),
    [allItems, category, categoryOf],
  );

  // Shares notificationHref with the tap-from-banner flow (useNotificationTap) so the two paths
  // don't navigate differently. Previously this only handled entityType === 'Ticket'.
  const handlePress = (n: NotificationDTO) => {
    // GH-83 — a deep-link that opens real content counts as "Opened" (proof the user actively opened it).
    // Tapping a row that leads nowhere is just "Read". Split into 2 branches so open-rate isn't diluted —
    // matches why BE separates /opened from /read, and matches the web logic (NotificationBell).
    //
    // Destination comes from notificationHref (not ticketHref like the original GH-83 version) to also
    // cover chat/mention, and to match the tap-from-banner flow — see the comment right above.
    const deepLink = notificationHref(
      n.entityType,
      n.entityId,
      role,
      ticketIdFromPayload(n.payloadJson),
    );

    if (isUnread(n)) {
      // BE auto-sets ReadAt when transitioning to Opened ⇒ do NOT also call markRead, that would be an extra request.
      if (deepLink) markOpened.mutate(n.id);
      else markRead.mutate(n.id);
    }

    if (deepLink) router.push(deepLink);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.textFaint} />
        <Text style={styles.emptyText}>Could not load notifications</Text>
        <Pressable style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {unreadCount > 0 && (
        <View style={styles.actionRow}>
          <Text style={styles.unreadText}>{unreadCount} unread</Text>
          <Pressable
            onPress={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            style={styles.markAllBtn}
          >
            <Ionicons name="checkmark-done-outline" size={15} color={Colors.primary} />
            <Text style={styles.markAllText}>Mark all as read</Text>
          </Pressable>
        </View>
      )}

      <CategoryFilterChips
        value={category}
        onChange={setCategory}
        counts={counts}
        total={allItems.length}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationCard notification={item} onPress={() => handlePress(item)} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
        }
        // Filtering runs client-side so a page may end up with no rows in the selected category.
        // Wide threshold + keep loading even when `items` is empty, so a rare category chip doesn't get stuck on an empty screen.
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator style={styles.footer} color={Colors.primary} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={Colors.textFaint} />
            <Text style={styles.emptyText}>
              {category === null ? 'No notifications yet' : 'No notifications in this category'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.bg },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  unreadText: { fontSize: 13, color: Colors.textMute, fontWeight: '600' },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAllText: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  footer: { paddingVertical: 16 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 14, color: Colors.textFaint, fontWeight: '600' },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
