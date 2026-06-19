import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
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
import { useStaffTickets } from '../../../src/features/staff/hooks/useStaffTickets';
import { TicketDTO, TicketStatusEnum } from '../../../src/features/tickets/types/ticket.types';
import { Colors } from '../../../src/lib/theme';

const PALETTE = [
  '#FF6B6B', '#F7A440', '#4ECDC4', '#45B7D1',
  '#7B68EE', '#96CEB4', '#DDA0DD', '#5BA85B',
];

function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function avatarInitials(id: string): string {
  return id.replace(/-/g, '').substring(0, 2).toUpperCase();
}

function displayName(id: string): string {
  return 'Khách ' + (id.split('-')[0] ?? id.substring(0, 8)).toUpperCase();
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'vừa xong';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}p`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h`;
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

const OPEN_STATUSES = new Set<TicketStatusEnum>([
  'New', 'Open', 'Assigned', 'InProgress',
  'WaitingCustomer', 'WaitingParts', 'WaitingOnsiteSchedule', 'Escalated',
]);

interface CustomerGroup {
  customerId: string;
  tickets: TicketDTO[];
  lastTicket: TicketDTO;
  openCount: number;
}

function groupByCustomer(tickets: TicketDTO[]): CustomerGroup[] {
  const map = new Map<string, TicketDTO[]>();
  for (const t of tickets) {
    if (!map.has(t.customerId)) map.set(t.customerId, []);
    map.get(t.customerId)!.push(t);
  }
  const result: CustomerGroup[] = [];
  for (const [customerId, list] of map) {
    const sorted = [...list].sort(
      (a, b) =>
        new Date(b.updatedAt ?? b.createdAt).getTime() -
        new Date(a.updatedAt ?? a.createdAt).getTime(),
    );
    result.push({
      customerId,
      tickets: sorted,
      lastTicket: sorted[0],
      openCount: list.filter((t) => OPEN_STATUSES.has(t.status)).length,
    });
  }
  return result.sort(
    (a, b) =>
      new Date(b.lastTicket.updatedAt ?? b.lastTicket.createdAt).getTime() -
      new Date(a.lastTicket.updatedAt ?? a.lastTicket.createdAt).getTime(),
  );
}

export default function CustomersScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, isRefetching, refetch } = useStaffTickets({ PageSize: 100 });
  const groups = useMemo(() => groupByCustomer(data?.items ?? []), [data]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title}>Khách hàng</Text>
        {!isLoading && !isError && (
          <Text style={styles.subtitle}>{groups.length} cuộc trò chuyện</Text>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.textFaint} />
          <Text style={styles.errMsg}>Không thể tải dữ liệu</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.customerId}
          renderItem={({ item }) => <CustomerRow group={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={48} color={Colors.textFaint} />
              <Text style={styles.errMsg}>Chưa có khách hàng nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function CustomerRow({ group }: { group: CustomerGroup }) {
  const color = avatarColor(group.customerId);
  const time = timeAgo(group.lastTicket.updatedAt ?? group.lastTicket.createdAt);

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.65 }]}
      onPress={() =>
        router.push({
          pathname: '/(staff)/customers/[customerId]',
          params: { customerId: group.customerId },
        })
      }
    >
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={styles.avatarText}>{avatarInitials(group.customerId)}</Text>
        {group.openCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {group.openCount > 9 ? '9+' : group.openCount}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.infoTop}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName(group.customerId)}
          </Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        <View style={styles.infoBot}>
          <Text style={styles.preview} numberOfLines={1}>
            {group.lastTicket.title}
          </Text>
          <View style={styles.countPill}>
            <Text style={styles.countText}>{group.tickets.length}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.bg },
  header:  { paddingHorizontal: 20, paddingBottom: 14 },
  title:   { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  subtitle:{ fontSize: 12, color: Colors.textMute, marginTop: 2 },

  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 80 },
  errMsg:  { color: Colors.textMute, fontSize: 13 },
  retryBtn:{ backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 10, marginTop: 4 },
  retryText:{ color: '#fff', fontWeight: '700', fontSize: 13 },

  list:  { paddingHorizontal: 16, paddingBottom: 100 },
  sep:   { height: 1, backgroundColor: Colors.border, marginLeft: 82 },

  row:   { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 4, paddingVertical: 13 },

  avatar:     { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  badge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.danger, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 2, borderColor: Colors.bg,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  info:    { flex: 1 },
  infoTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  infoBot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name:    { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.text },
  time:    { fontSize: 12, color: Colors.textFaint },
  preview: { flex: 1, fontSize: 13, color: Colors.textMute },
  countPill: { backgroundColor: Colors.card3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  countText: { fontSize: 11, color: Colors.textFaint, fontWeight: '600' },
});
