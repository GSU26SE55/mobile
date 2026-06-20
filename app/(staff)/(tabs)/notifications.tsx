import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../src/lib/theme';
import { useNotifications } from '../../../src/features/notifications/hooks/useNotifications';
import { NotificationCard } from '../../../src/features/notifications/components/NotificationCard';
import {
  NotificationChannelEnum,
  NotificationDTO,
  NotificationStatusEnum,
  NotificationTypeEnum,
} from '../../../src/features/notifications/types/notification.types';

const NOW = Date.now();
const MOCK_NOTIFICATIONS: NotificationDTO[] = [
  { id: 'n1', userId: 'me', type: NotificationTypeEnum.TicketAssigned, channel: NotificationChannelEnum.InApp, status: NotificationStatusEnum.Sent, title: 'Ticket mới được giao', body: 'TK-0045: Pin BR-003 không nhận sạc từ solar panel. Priority P2 High — SLA 24h.', payloadJson: null, entityType: 'Ticket', entityId: 'staff-mock-2', sentAt: new Date(NOW - 1 * 3600_000).toISOString(), readAt: null, createdAt: new Date(NOW - 1 * 3600_000).toISOString() },
  { id: 'n2', userId: 'me', type: NotificationTypeEnum.SlaWarning, channel: NotificationChannelEnum.InApp, status: NotificationStatusEnum.Sent, title: 'Cảnh báo SLA sắp breach', body: 'TK-0042: Overheat Battery BR-001 — SLA P1 còn 2 giờ.', payloadJson: null, entityType: 'Ticket', entityId: 'staff-mock-1', sentAt: new Date(NOW - 2 * 3600_000).toISOString(), readAt: null, createdAt: new Date(NOW - 2 * 3600_000).toISOString() },
  { id: 'n3', userId: 'me', type: NotificationTypeEnum.TicketStatusChanged, channel: NotificationChannelEnum.InApp, status: NotificationStatusEnum.Read, title: 'Ticket đổi trạng thái', body: 'TK-0042: chuyển sang IN_PROGRESS.', payloadJson: null, entityType: 'Ticket', entityId: 'staff-mock-1', sentAt: new Date(NOW - 3 * 3600_000).toISOString(), readAt: new Date(NOW - 2.5 * 3600_000).toISOString(), createdAt: new Date(NOW - 3 * 3600_000).toISOString() },
  { id: 'n4', userId: 'me', type: NotificationTypeEnum.TicketResolved, channel: NotificationChannelEnum.InApp, status: NotificationStatusEnum.Read, title: 'Ticket đã hoàn thành', body: 'TK-0031: Bảo trì định kỳ đã được Manager approve.', payloadJson: null, entityType: 'Ticket', entityId: 'staff-mock-4', sentAt: new Date(NOW - 24 * 3600_000).toISOString(), readAt: new Date(NOW - 23 * 3600_000).toISOString(), createdAt: new Date(NOW - 24 * 3600_000).toISOString() },
];

export default function StaffNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { data: apiData, isLoading, refetch } = useNotifications();

  const notifications = apiData?.items ?? MOCK_NOTIFICATIONS;

  const handlePress = (notification: NotificationDTO) => {
    if (notification.entityType === 'Ticket' && notification.entityId) {
      router.push({ pathname: '/(staff)/tickets/[id]', params: { id: notification.entityId } });
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Thông báo</Text>
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
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 14, color: Colors.textFaint, fontWeight: '600' },
});
