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
import { formatDateShort } from '@/src/lib/date';
import { Colors, Shadow, Solar } from '@/src/lib/theme';
import { P } from '@/src/lib/authz';
import { PermissionGuard } from '@/src/features/auth/components/PermissionGuard';
import { StaffHeader } from '@/src/features/staff/components/StaffHeader';
import { useUnreadByCustomer } from '@/src/features/tickets/hooks/useChatInbox';

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
 *
 * These used to be built from the GUID alone, so every row read "Customer 3F2B1A9C" with two
 * hex characters for an avatar — wrong on every render, not just an edge case. `customerName`
 * was already on TicketDTO and sitting right there in `lastTicket`.
 *
 * The id fallback still exists because `customerName` is nullable while the staff read model
 * catches up, and a customer with tickets must stay reachable in this list either way.
 */
function avatarInitials(name: string | null | undefined, id: string): string {
  const trimmed = name?.trim();
  if (!trimmed) return id.replace(/-/g, '').substring(0, 2).toUpperCase();

  // Two initials from the first and last word: "Nguyen Van An" → "NA".
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

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h`;
  return formatDateShort(iso);
}

const OPEN_STATUSES = new Set<TicketStatusEnum>([
  'Open', 'Pending', 'InProgress', 'Request', 'ReAssign', 'Completed',
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
  // Unread count comes from a separate call — errors/latency here don't block the customer list.
  const { data: unreadMap } = useUnreadByCustomer();

  return (
    <View style={styles.root}>
      <StaffHeader
        title="Customers"
        subtitle={!isLoading && !isError ? `${groups.length} conversations` : undefined}
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Solar.yellowDeep} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={Solar.faint} />
          <Text style={styles.errMsg}>Unable to load data</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.customerId}
          renderItem={({ item }) => (
            <CustomerRow group={item} unread={unreadMap?.get(item.customerId) ?? 0} />
          )}
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
              <Text style={styles.errMsg}>No customers yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function CustomerRow({ group, unread }: { group: CustomerGroup; unread: number }) {
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
        <Text style={styles.avatarText}>
          {avatarInitials(group.lastTicket.customerName, group.customerId)}
        </Text>
        {/* Red badge = number of UNREAD MESSAGES (already includes messages that @mention me).
            Different from the yellow pill below — that one is the count of open tickets. */}
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.infoTop}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName(group.lastTicket.customerName, group.customerId)}
          </Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        <View style={styles.infoBot}>
          <Text style={styles.preview} numberOfLines={1}>
            {group.lastTicket.title}
          </Text>
          {/* Yellow pill = number of open tickets for this customer. */}
          <View style={styles.countPill}>
            <Text style={styles.countText}>{group.openCount}</Text>
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
