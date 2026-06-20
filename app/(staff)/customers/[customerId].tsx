import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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
import { BadgeColors, Colors, Shadow } from '../../../src/lib/theme';

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
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}p trước`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h trước`;
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

const STATUS_LABEL: Partial<Record<TicketStatusEnum, string>> = {
  New: 'Mới',
  Open: 'Đang mở',
  Assigned: 'Đã gán',
  InProgress: 'Đang xử lý',
  WaitingCustomer: 'Chờ KH',
  WaitingParts: 'Chờ phụ tùng',
  WaitingOnsiteSchedule: 'Chờ lịch',
  Resolved: 'Đã giải quyết',
  Escalated: 'Leo thang',
  Closed: 'Đã đóng',
  ClosedPendingRate: 'Chờ đánh giá',
  ClosedRejected: 'Từ chối',
};

type BadgeKey = keyof typeof BadgeColors;

const STATUS_BADGE: Partial<Record<TicketStatusEnum, BadgeKey>> = {
  New: 'new', Open: 'open', Assigned: 'assigned', InProgress: 'progress',
  WaitingCustomer: 'waiting', WaitingParts: 'waiting', WaitingOnsiteSchedule: 'waiting',
  Resolved: 'resolved', Escalated: 'escalated',
  Closed: 'closed', ClosedPendingRate: 'closed', ClosedRejected: 'escalated',
};

export default function CustomerTicketsScreen() {
  const insets = useSafeAreaInsets();
  const { customerId } = useLocalSearchParams<{ customerId: string }>();

  const { data, isLoading, isError, isRefetching, refetch } = useStaffTickets({ PageSize: 100 });

  const tickets = useMemo(() => {
    if (!data?.items || !customerId) return [];
    return [...data.items.filter((t) => t.customerId === customerId)].sort(
      (a, b) =>
        new Date(b.updatedAt ?? b.createdAt).getTime() -
        new Date(a.updatedAt ?? a.createdAt).getTime(),
    );
  }, [data, customerId]);

  const color = avatarColor(customerId ?? '');

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <View style={[styles.hAvatar, { backgroundColor: color }]}>
          <Text style={styles.hAvatarText}>{avatarInitials(customerId ?? '')}</Text>
        </View>
        <View style={styles.hInfo}>
          <Text style={styles.hName}>{displayName(customerId ?? '')}</Text>
          <Text style={styles.hSub}>
            {isLoading ? '…' : `${tickets.length} ticket`}
          </Text>
        </View>
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
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TicketRow ticket={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="ticket-outline" size={48} color={Colors.textFaint} />
              <Text style={styles.errMsg}>Chưa có ticket nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function TicketRow({ ticket }: { ticket: TicketDTO }) {
  const badgeKey = STATUS_BADGE[ticket.status] ?? 'new';
  const badgeStyle = BadgeColors[badgeKey];
  const time = timeAgo(ticket.updatedAt ?? ticket.createdAt);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, Shadow, pressed && { opacity: 0.7 }]}
      onPress={() =>
        router.push({ pathname: '/(staff)/tickets/[id]', params: { id: ticket.id } })
      }
    >
      <View style={styles.cardTop}>
        <View style={[styles.priorityPill, ticket.priority === 'P1Critical' && styles.p1Pill, ticket.priority === 'P2High' && styles.p2Pill]}>
          <Text style={[styles.priorityText, ticket.priority === 'P1Critical' && styles.p1Text, ticket.priority === 'P2High' && styles.p2Text]}>
            {ticket.priority === 'P1Critical' ? 'P1' : ticket.priority === 'P2High' ? 'P2' : 'P3'}
          </Text>
        </View>
        <Text style={styles.code}>{ticket.code}</Text>
        <View style={{ flex: 1 }} />
        <View style={[styles.statusBadge, { backgroundColor: badgeStyle.bg }]}>
          <Text style={[styles.statusText, { color: badgeStyle.text }]}>
            {STATUS_LABEL[ticket.status] ?? ticket.status}
          </Text>
        </View>
      </View>

      <Text style={styles.ticketTitle} numberOfLines={2}>
        {ticket.title}
      </Text>

      <View style={styles.cardBot}>
        <Ionicons name="chatbubble-ellipses-outline" size={13} color={Colors.textFaint} />
        <Text style={styles.timeText}>{time}</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.goText}>Xem chat</Text>
        <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 80 },
  errMsg: { color: Colors.textMute, fontSize: 13 },
  retryBtn:  { backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 10, marginTop: 4 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  backBtn:     { padding: 4 },
  hAvatar:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  hAvatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  hInfo:   { flex: 1 },
  hName:   { fontSize: 16, fontWeight: '700', color: Colors.text },
  hSub:    { fontSize: 12, color: Colors.textMute, marginTop: 1 },

  list: { padding: 16, paddingBottom: 100 },

  card:      { backgroundColor: Colors.card, borderRadius: 16, padding: 14, marginBottom: 10 },
  cardTop:   { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
  cardBot:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },

  priorityPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: Colors.card3 },
  p1Pill:       { backgroundColor: Colors.dangerLight },
  p2Pill:       { backgroundColor: Colors.warningLight },
  priorityText: { fontSize: 11, fontWeight: '800', color: Colors.textMute },
  p1Text:       { color: Colors.dangerDark },
  p2Text:       { color: Colors.warningDark },

  code:         { fontSize: 12, fontWeight: '600', color: Colors.textMute },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText:   { fontSize: 11, fontWeight: '700' },

  ticketTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, lineHeight: 20 },

  timeText: { fontSize: 12, color: Colors.textFaint },
  goText:   { fontSize: 12, fontWeight: '600', color: Colors.primary },
});
