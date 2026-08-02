import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../../lib/theme';
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkNotificationOpened,
  useMarkAllRead,
} from '../hooks/useNotifications';
import { NotificationCard } from './NotificationCard';
import { isUnread, NotificationDTO } from '../types/notification.types';

type TicketHref = (id: string) => Parameters<typeof router.push>[0];

interface Props {
  /** Build deep-link tới ticket detail theo role (staff/customer). */
  ticketHref: TicketHref;
}

export function NotificationList({ ticketHref }: Props) {
  const { data, isLoading, isError, refetch, isRefetching } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markOpened = useMarkNotificationOpened();
  const markAllRead = useMarkAllRead();

  const items = data?.items ?? [];

  const handlePress = (n: NotificationDTO) => {
    // GH-83 — deep-link = mở được nội dung thật, mới tính là "Opened" (bằng chứng user chủ động mở).
    // Bấm dòng không dẫn đi đâu chỉ là "Read". Tách 2 nhánh để open-rate không bị loãng — đúng lý do
    // BE tách /opened khỏi /read, và khớp với logic web (NotificationBell).
    const deepLink = n.entityType === 'Ticket' && n.entityId ? ticketHref(n.entityId) : null;

    if (isUnread(n)) {
      // BE tự set ReadAt khi chuyển Opened ⇒ KHÔNG gọi kèm markRead, sẽ thừa một request.
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
        <Text style={styles.emptyText}>Không tải được thông báo</Text>
        <Pressable style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {unreadCount > 0 && (
        <View style={styles.actionRow}>
          <Text style={styles.unreadText}>{unreadCount} chưa đọc</Text>
          <Pressable
            onPress={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            style={styles.markAllBtn}
          >
            <Ionicons name="checkmark-done-outline" size={15} color={Colors.primary} />
            <Text style={styles.markAllText}>Đánh dấu tất cả đã đọc</Text>
          </Pressable>
        </View>
      )}

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
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={Colors.textFaint} />
            <Text style={styles.emptyText}>Chưa có thông báo</Text>
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
