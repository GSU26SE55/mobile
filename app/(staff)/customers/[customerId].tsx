import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
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

/**
 * Name and initials come from the ticket's `customerName`; the id is only a last resort.
 * Same reasoning as the customers list — this header used to read "Customer 3F2B1A9C" for
 * every customer. Kept as a local copy to match the list screen it was copied from.
 */
function avatarInitials(name: string | null | undefined, id: string): string {
  const trimmed = name?.trim();
  if (!trimmed) return id.replace(/-/g, '').substring(0, 2).toUpperCase();

  const words = trimmed.split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

function displayName(name: string | null | undefined, id: string): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  return 'Customer ' + (id.split('-')[0] ?? id.substring(0, 8)).toUpperCase();
}

const STATUS_LABEL: Partial<Record<TicketStatusEnum, string>> = {
  Open: 'Open',
  Pending: 'Pending',
  InProgress: 'In progress',
  Request: 'Escalation requested',
  ReAssign: 'Awaiting reassignment',
  Completed: 'Awaiting review',
  Closed: 'Closed',
  ClosedRejected: 'Rejected',
};

type BadgeKey = keyof typeof BadgeColors;

const STATUS_BADGE: Partial<Record<TicketStatusEnum, BadgeKey>> = {
  Open: 'open', Pending: 'waiting', InProgress: 'progress',
  Request: 'escalated', ReAssign: 'escalated', Completed: 'resolved',
  Closed: 'closed', ClosedRejected: 'escalated',
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

  const {
    data,
    isLoading,
    isError,
    isRefetching: isTicketsRefetching,
    refetch: refetchTickets,
  } = useStaffTickets({ PageSize: 100 });

  // @mentions of me — BE returns a flat cross-ticket list, gathered into a Set of ticketId for O(1) lookup.
  // Separate from hasUnreadChat: a ticket can tag me while I've already read it, and vice versa.
  const {
    data: mentions,
    isRefetching: isMentionsRefetching,
    refetch: refetchMentions,
  } = useMyMentions({ pageSize: 100 });
  const isRefreshing = isTicketsRefetching || isMentionsRefetching;
  const handleRefresh = useCallback(() => {
    void Promise.all([refetchTickets(), refetchMentions()]);
  }, [refetchMentions, refetchTickets]);
  const mentionedTicketIds = useMemo(
    () => new Set((mentions ?? []).map((m) => m.ticketId).filter((id): id is string => !!id)),
    [mentions],
  );

  // Tickets with unread messages / tagged mentions rise to the top — things needing action shouldn't
  // sit at the bottom. Within the same group, most recent first.
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

  // Every ticket here belongs to this one customer, so any of them carries the name. Scan for
  // the first non-empty one rather than trusting tickets[0]: `customerName` is nullable while
  // the staff read model catches up, and one stale row must not blank out the header.
  const customerName = useMemo(
    () => tickets.find((t) => t.customerName?.trim())?.customerName ?? null,
    [tickets],
  );

  const color = avatarColor(customerId ?? '');

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <BackButton />
        <View style={[styles.hAvatar, { backgroundColor: color }]}>
          <Text style={styles.hAvatarText}>
            {avatarInitials(customerName, customerId ?? '')}
          </Text>
        </View>
        <View style={styles.hInfo}>
          <Text style={styles.hName} numberOfLines={1}>
            {displayName(customerName, customerId ?? '')}
          </Text>
          <Text style={styles.hSub}>
            {isLoading ? '…' : `${tickets.length} ticket`}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Refresh page"
          accessibilityRole="button"
          accessibilityState={{ busy: isRefreshing, disabled: isRefreshing }}
          disabled={isRefreshing}
          hitSlop={6}
          onPress={handleRefresh}
          style={({ pressed }) => [
            styles.refreshBtn,
            (pressed || isRefreshing) && styles.refreshBtnMuted,
          ]}
        >
          {isRefreshing ? (
            <ActivityIndicator color={Colors.primaryDark} size="small" />
          ) : (
            <Ionicons name="refresh-outline" size={20} color={Colors.primaryDark} />
          )}
        </Pressable>
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
          <Text style={styles.errMsg}>Unable to load data</Text>
          <Pressable style={styles.retryBtn} onPress={handleRefresh}>
            <Text style={styles.retryText}>Retry</Text>
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
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="ticket-outline" size={48} color={Colors.textFaint} />
              <Text style={styles.errMsg}>No tickets yet</Text>
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
  const unread = !!ticket.hasUnreadChat;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        Shadow,
        unread && styles.cardUnread,
        pressed && { opacity: 0.7 },
      ]}
      // jumpToUnread: opens the chat tab directly and scrolls to the OLDEST unread message,
      // instead of making Staff manually scroll back through history.
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
              <Text style={styles.unreadChipText}>Unread message</Text>
            </View>
          )}
          {isMentioned && (
            <View style={styles.mentionChip}>
              <Ionicons name="at" size={12} color={Colors.primary} />
              <Text style={styles.mentionChipText}>Mentioned you</Text>
            </View>
          )}
        </View>
      )}

      <Text style={[styles.ticketTitle, unread && styles.ticketTitleUnread]} numberOfLines={2}>
        {ticket.title}
      </Text>

      <View style={styles.cardBot}>
        <View style={{ flex: 1 }} />
        <Text style={styles.goText}>{unread ? 'Read new message' : 'View chat'}</Text>
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
  refreshBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.card2,
    borderWidth: 1, borderColor: Colors.border,
  },
  refreshBtnMuted: { opacity: 0.55 },
  hUnreadPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FF3B30', borderRadius: 12,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  hUnreadText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  list: { padding: 16, paddingBottom: 100 },

  card:      { backgroundColor: Colors.card, borderRadius: 16, padding: 14, marginBottom: 10, overflow: 'hidden' },
  // Unread ticket: border + warm background so it stands out from read cards.
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
