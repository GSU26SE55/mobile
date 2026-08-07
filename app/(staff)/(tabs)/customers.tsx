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
import { useStaffTickets } from '@/src/features/staff/hooks/useStaffTickets';
import { TicketDTO, TicketStatusEnum } from '@/src/features/tickets/types/ticket.types';
import { Colors, Shadow, Solar } from '@/src/lib/theme';
import { P } from '@/src/lib/authz';
import { PermissionGuard } from '@/src/features/auth/components/PermissionGuard';
import { StaffHeader } from '@/src/features/staff/components/StaffHeader';

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
  return (
    <PermissionGuard permission={P.USER_VIEW}>
      <CustomersScreenInner />
    </PermissionGuard>
  );
}

function CustomersScreenInner() {
  const { data, isLoading, isError, isRefetching, refetch } = useStaffTickets({ PageSize: 100 });
  const groups = useMemo(() => groupByCustomer(data?.items ?? []), [data]);

  return (
    <View style={styles.root}>
      <StaffHeader
        title="Khách hàng"
        subtitle={!isLoading && !isError ? `${groups.length} cuộc trò chuyện` : undefined}
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Solar.yellowDeep} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={Solar.faint} />
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
              tintColor={Solar.yellowDeep}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={48} color={Solar.faint} />
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
      style={({ pressed }) => [styles.card, Shadow, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
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
  root:    { flex: 1, backgroundColor: Solar.bg },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 80 },
  errMsg:  { color: Solar.mute, fontSize: 13, fontWeight: '500' },
  retryBtn:{ backgroundColor: Solar.yellow, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 10, marginTop: 4 },
  retryText:{ color: Solar.ink, fontWeight: '800', fontSize: 13 },

  list:  { paddingHorizontal: 20, paddingBottom: 100 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(235,230,215,0.7)',
  },

  avatar:     { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  badge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.danger, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 2, borderColor: '#FFFFFF',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  info:    { flex: 1 },
  infoTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  infoBot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name:    { flex: 1, fontSize: 15, fontWeight: '800', color: Solar.ink },
  time:    { fontSize: 11, color: Solar.mute, fontWeight: '600' },
  preview: { flex: 1, fontSize: 13, color: Solar.mute },
  countPill: { backgroundColor: Solar.yellowSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { fontSize: 11, color: Solar.yellowDeep, fontWeight: '800' },
});
