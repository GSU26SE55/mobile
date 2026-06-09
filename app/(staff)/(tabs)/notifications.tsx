import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Shadow } from '../../../src/lib/theme';
import { useNotifications } from '../../../src/features/notifications/hooks/useNotifications';
import { useMarkNotificationRead, useMarkAllNotificationsRead } from '../../../src/features/notifications/hooks/useMarkNotificationRead';
import { NotificationCard } from '../../../src/features/notifications/components/NotificationCard';
import { NotificationDTO } from '../../../src/features/notifications/types/notification.types';

const NOW = Date.now();
const MOCK_NOTIFICATIONS: NotificationDTO[] = [
  { id: 'n1', userId: 'me', type: 'TicketAssigned', title: 'Ticket mới được giao', body: 'TK-0045: Pin BR-003 không nhận sạc từ solar panel. Priority P2 High — SLA 24h.', referenceId: 'staff-mock-2', referenceType: 'Ticket', isRead: false, createdAt: new Date(NOW - 1 * 3600_000).toISOString() },
  { id: 'n2', userId: 'me', type: 'SlaWarning', title: 'Cảnh báo SLA sắp breach', body: 'TK-0042: Overheat Battery BR-001 — SLA P1 còn 2 giờ.', referenceId: 'staff-mock-1', referenceType: 'Ticket', isRead: false, createdAt: new Date(NOW - 2 * 3600_000).toISOString() },
  { id: 'n3', userId: 'me', type: 'TicketCommented', title: 'Khách hàng phản hồi', body: 'TK-0042: "Nhiệt độ đã giảm chưa? Thiết bị có an toàn không?"', referenceId: 'staff-mock-1', referenceType: 'Ticket', isRead: true, createdAt: new Date(NOW - 3 * 3600_000).toISOString() },
  { id: 'n4', userId: 'me', type: 'TicketResolved', title: 'Ticket đã hoàn thành', body: 'TK-0031: Bảo trì định kỳ đã được Manager approve.', referenceId: 'staff-mock-4', referenceType: 'Ticket', isRead: true, createdAt: new Date(NOW - 24 * 3600_000).toISOString() },
];

export default function StaffNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { data: apiData, isLoading, refetch } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();

  const notifications = apiData?.items ?? MOCK_NOTIFICATIONS;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handlePress = (notification: NotificationDTO) => {
    if (!notification.isRead) markRead(notification.id);
    if (notification.referenceType === 'Ticket' && notification.referenceId) {
      router.push({ pathname: '/(staff)/tickets/[id]', params: { id: notification.referenceId } });
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Thông báo</Text>
        {unreadCount > 0 && (
          <Pressable
            style={[styles.markAllBtn, Shadow]}
            onPress={() => markAllRead()}
            disabled={isMarkingAll}
          >
            {isMarkingAll ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={16} color={Colors.primary} />
                <Text style={styles.markAllText}>Đọc tất cả</Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      {isLoading && notifications === MOCK_NOTIFICATIONS ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationCard notification={item} onPress={() => handlePress(item)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={Colors.textFaint} />
              <Text style={styles.emptyText}>Chưa có thông báo</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  markAllText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 14, color: Colors.textFaint, fontWeight: '600' },
});
