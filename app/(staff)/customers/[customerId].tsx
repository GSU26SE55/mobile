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
import { useStaffTickets } from '@/src/features/staff/hooks/useStaffTickets';
import { useMyMentions } from '@/src/features/tickets/hooks/useChatInbox';
import { TicketDTO, TicketStatusEnum } from '@/src/features/tickets/types/ticket.types';
import { BadgeColors, Colors, Shadow } from '@/src/lib/theme';
import { P } from '@/src/lib/authz';
import { PermissionGuard } from '@/src/features/auth/components/PermissionGuard';
import { BackButton } from '@/src/shared/components/ScreenHeader';

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
  return (
    <PermissionGuard permission={P.USER_VIEW}>
      <CustomerTicketsScreenInner />
    </PermissionGuard>
  );
}

function CustomerTicketsScreenInner() {
  const insets = useSafeAreaInsets();
  const { customerId } = useLocalSearchParams<{ customerId: string }>();

  const { data, isLoading, isError, isRefetching, refetch } = useStaffTickets({ PageSize: 100 });

  // @mention tới mình — BE trả flat cross-ticket, gom thành Set ticketId để tra O(1).
  // Tách khỏi hasUnreadChat: một ticket có thể tag mình mà mình đã đọc, và ngược lại.
  const { data: mentions } = useMyMentions({ pageSize: 100 });
  const mentionedTicketIds = useMemo(
    () => new Set((mentions ?? []).map((m) => m.ticketId).filter((id): id is string => !!id)),
    [mentions],
  );

  // Ticket có tin chưa đọc / được tag lên đầu — thứ cần xử lý không nên nằm dưới đáy.
  // Cùng nhóm thì mới nhất trước.
  const tickets = useMemo(() => {
    if (!data?.items || !customerId) return [];
    const rank = (t: TicketDTO) =>
      (t.hasUnreadChat ? 2 : 0) + (mentionedTicketIds.has(t.id) ? 1 : 0);
    return [...data.items.filter((t) => t.customerId === customerId)].sort((a, b) => {
      const diff = rank(b) - rank(a);
      if (diff !== 0) return diff;
      return (
        new Date(b.updatedAt ?? b.createdAt).getTime() -
        new Date(a.updatedAt ?? a.createdAt).getTime()
      );
    });
  }, [data, customerId, mentionedTicketIds]);

  const unreadTotal = useMemo(() => tickets.filter((t) => t.hasUnreadChat).length, [tickets]);

  const color = avatarColor(customerId ?? '');

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <BackButton />
        <View style={[styles.hAvatar, { backgroundColor: color }]}>
          <Text style={styles.hAvatarText}>{avatarInitials(customerId ?? '')}</Text>
        </View>
        <View style={styles.hInfo}>
          <Text style={styles.hName}>{displayName(customerId ?? '')}</Text>
          <Text style={styles.hSub}>
            {isLoading ? '…' : `${tickets.length} ticket`}
          </Text>
        </View>
        {unreadTotal > 0 && (
          <View style={styles.hUnreadPill}>
            <Ionicons name="chatbubble-ellipses" size={13} color="#FFF" />
            <Text style={styles.hUnreadText}>{unreadTotal}</Text>
          </View>
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
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TicketRow ticket={item} isMentioned={mentionedTicketIds.has(item.id)} />
          )}
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

function TicketRow({ ticket, isMentioned }: { ticket: TicketDTO; isMentioned: boolean }) {
  const badgeKey = STATUS_BADGE[ticket.status] ?? 'new';
  const badgeStyle = BadgeColors[badgeKey];
  const time = timeAgo(ticket.updatedAt ?? ticket.createdAt);
  const unread = !!ticket.hasUnreadChat;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        Shadow,
        unread && styles.cardUnread,
        pressed && { opacity: 0.7 },
      ]}
      // jumpToUnread: mở thẳng tab chat và cuộn tới tin CŨ NHẤT chưa đọc,
      // thay vì bắt Staff tự lần ngược lịch sử.
      onPress={() =>
        router.push({
          pathname: '/(staff)/tickets/[id]',
          params: { id: ticket.id, ...(unread ? { jumpToUnread: '1' } : {}) },
        })
      }
    >
      {unread && <View style={styles.unreadStripe} />}

      <View style={styles.cardTop}>
        <View style={[styles.priorityPill, ticket.priority === 'P1Critical' && styles.p1Pill, ticket.priority === 'P2High' && styles.p2Pill]}>
          <Text style={[styles.priorityText, ticket.priority === 'P1Critical' && styles.p1Text, ticket.priority === 'P2High' && styles.p2Text]}>
            {ticket.priority === 'P1Critical' ? 'P1' : ticket.priority === 'P2High' ? 'P2' : 'P3'}
          </Text>
        </View>
        <Text style={[styles.code, unread && styles.codeUnread]}>{ticket.code}</Text>
        <View style={{ flex: 1 }} />
        <View style={[styles.statusBadge, { backgroundColor: badgeStyle.bg }]}>
          <Text style={[styles.statusText, { color: badgeStyle.text }]}>
            {STATUS_LABEL[ticket.status] ?? ticket.status}
          </Text>
        </View>
      </View>

      {(unread || isMentioned) && (
        <View style={styles.flagRow}>
          {unread && (
            <View style={styles.unreadChip}>
              <Ionicons name="chatbubble-ellipses" size={12} color="#FFF" />
              <Text style={styles.unreadChipText}>Tin nhắn chưa đọc</Text>
            </View>
          )}
          {isMentioned && (
            <View style={styles.mentionChip}>
              <Ionicons name="at" size={12} color={Colors.primary} />
              <Text style={styles.mentionChipText}>Nhắc tên bạn</Text>
            </View>
          )}
        </View>
      )}

      <Text style={[styles.ticketTitle, unread && styles.ticketTitleUnread]} numberOfLines={2}>
        {ticket.title}
      </Text>

      <View style={styles.cardBot}>
        <Ionicons name="chatbubble-ellipses-outline" size={13} color={Colors.textFaint} />
        <Text style={styles.timeText}>{time}</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.goText}>{unread ? 'Đọc tin mới' : 'Xem chat'}</Text>
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
  hUnreadPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FF3B30', borderRadius: 12,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  hUnreadText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  list: { padding: 16, paddingBottom: 100 },

  card:      { backgroundColor: Colors.card, borderRadius: 16, padding: 14, marginBottom: 10, overflow: 'hidden' },
  // Ticket chưa đọc: viền + nền ấm để bật hẳn khỏi các card đã đọc.
  cardUnread: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.card2,
  },
  unreadStripe: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
    backgroundColor: Colors.primary,
  },

  flagRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 7 },
  unreadChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FF3B30', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  unreadChipText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  mentionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.primaryLight, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  mentionChipText: { color: Colors.primary, fontSize: 11, fontWeight: '800' },
  cardTop:   { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
  cardBot:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },

  priorityPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: Colors.card3 },
  p1Pill:       { backgroundColor: Colors.dangerLight },
  p2Pill:       { backgroundColor: Colors.warningLight },
  priorityText: { fontSize: 11, fontWeight: '800', color: Colors.textMute },
  p1Text:       { color: Colors.dangerDark },
  p2Text:       { color: Colors.warningDark },

  code:         { fontSize: 12, fontWeight: '600', color: Colors.textMute },
  codeUnread:   { color: Colors.text, fontWeight: '800' },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText:   { fontSize: 11, fontWeight: '700' },

  ticketTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, lineHeight: 20 },
  ticketTitleUnread: { fontWeight: '800' },

  timeText: { fontSize: 12, color: Colors.textFaint },
  goText:   { fontSize: 12, fontWeight: '600', color: Colors.primary },
});
