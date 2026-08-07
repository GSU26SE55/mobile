import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../../lib/theme';
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllRead,
} from '../hooks/useNotifications';
import { NotificationCard } from './NotificationCard';
import { isUnread, NotificationDTO } from '../types/notification.types';
import { notificationHref, ticketIdFromPayload } from '../lib/notificationHref';
import { useSessionStore } from '../../../stores/sessionStore';

export function NotificationList() {
  const role = useSessionStore((s) => s.user?.role);
  const { data, isLoading, isError, refetch, isRefetching } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  const items = data?.items ?? [];

  // Dùng chung notificationHref với luồng bấm-từ-banner (useNotificationTap) để 2 đường
  // không điều hướng lệch nhau. Trước đây chỗ này chỉ xử lý entityType === 'Ticket'.
  const handlePress = (n: NotificationDTO) => {
    if (isUnread(n)) markRead.mutate(n.id);
    const href = notificationHref(
      n.entityType,
      n.entityId,
      role,
      ticketIdFromPayload(n.payloadJson),
    );
    if (href) router.push(href);
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
