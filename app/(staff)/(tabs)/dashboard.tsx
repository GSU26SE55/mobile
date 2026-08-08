import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeColors, Colors, Solar } from '@/src/lib/theme';
import { useStaffTickets } from '@/src/features/staff/hooks/useStaffTickets';
import { useStaffDashboardStats } from '@/src/features/staff/hooks/useStaffDashboardStats';
import { useStaffProfile } from '@/src/features/staff/hooks/useStaffProfile';
import { useUnreadCount } from '@/src/features/notifications/hooks/useNotifications';
import { useChatUnreadCount } from '@/src/features/tickets/hooks/useChatInbox';
import { TicketStatusEnum, TicketDTO } from '@/src/features/tickets/types/ticket.types';
import { HomeHeader } from '@/src/shared/components/HomeHeader';
import { StatTrio } from '@/src/shared/components/StatTrio';
import { ProgressListItem } from '@/src/shared/components/ProgressListItem';

type FilterTab = 'all' | 'active' | 'waiting' | 'resolved';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'In progress' },
  { key: 'waiting', label: 'Waiting' },
  { key: 'resolved', label: 'Completed' },
];

const ACTIVE_STATUSES: TicketStatusEnum[] = ['Assigned', 'InProgress'];
const WAITING_STATUSES: TicketStatusEnum[] = ['WaitingCustomer', 'WaitingParts', 'WaitingOnsiteSchedule'];
const RESOLVED_STATUSES: TicketStatusEnum[] = ['Resolved', 'Escalated'];

// status → English label + badge (current palette) + % progress in the lifecycle + bar color.
const STATUS_META: Record<string, { label: string; badge: keyof typeof BadgeColors; progress: number }> = {
  New: { label: 'New', badge: 'new', progress: 10 },
  Open: { label: 'Open', badge: 'open', progress: 15 },
  Assigned: { label: 'Assigned', badge: 'assigned', progress: 30 },
  InProgress: { label: 'In progress', badge: 'progress', progress: 60 },
  WaitingCustomer: { label: 'Waiting customer', badge: 'waiting', progress: 50 },
  WaitingParts: { label: 'Waiting parts', badge: 'waiting', progress: 50 },
  WaitingOnsiteSchedule: { label: 'Waiting schedule', badge: 'waiting', progress: 50 },
  Resolved: { label: 'Resolved', badge: 'resolved', progress: 100 },
  Escalated: { label: 'Escalated', badge: 'escalated', progress: 80 },
  ClosedPendingRate: { label: 'Pending rating', badge: 'closed', progress: 100 },
  Closed: { label: 'Closed', badge: 'closed', progress: 100 },
  ClosedRejected: { label: 'Rejected', badge: 'crit', progress: 100 },
  Incident: { label: 'Incident', badge: 'crit', progress: 40 },
};

const CATEGORY_LABEL: Record<string, string> = {
  Charging: 'Charging',
  Overheat: 'Overheat',
  NoPower: 'No power',
  Performance: 'Performance',
  Repair: 'Repair',
  Other: 'Other',
};

// Today's progress ring color — echoes the mockup's orange tone but stays within the current palette.
function progressColor(p: number): string {
  // Decorative accent (progress, not a severity indicator): reasonable level → green.
  if (p >= 40) return Colors.primary;
  return Colors.danger;
}

export default function StaffDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const { data: apiTickets, isLoading, isError, isRefetching, refetch } = useStaffTickets({ PageSize: 100 });
  const { data: stats } = useStaffDashboardStats();
  const { data: profile } = useStaffProfile();
  const { data: unreadCount = 0 } = useUnreadCount();
  // Unread chats — distinct from unreadCount above (that one is notifications).
  const { data: chatUnread = 0 } = useChatUnreadCount();

  const allTickets = apiTickets?.items ?? [];

  const filtered = allTickets.filter((t) => {
    if (activeFilter === 'active') return ACTIVE_STATUSES.includes(t.status);
    if (activeFilter === 'waiting') return WAITING_STATUSES.includes(t.status);
    if (activeFilter === 'resolved') return RESOLVED_STATUSES.includes(t.status);
    return true;
  });

  // Tab counts from stats.countByStatus (single source). Not loaded yet → null → hide the number on the tab.
  const cbs = stats?.countByStatus;
  const sumOf = (statuses: TicketStatusEnum[]) => statuses.reduce((s, k) => s + (cbs?.[k] ?? 0), 0);
  const counts: Record<FilterTab, number | null> = {
    all: cbs ? Object.values(cbs).reduce((s, v) => s + v, 0) : null,
    active: cbs ? sumOf(ACTIVE_STATUSES) : null,
    waiting: cbs ? sumOf(WAITING_STATUSES) : null,
    resolved: cbs ? sumOf(RESOLVED_STATUSES) : null,
  };

  const openCount = stats?.openCount ?? 0;
  const resolvedCount = stats?.resolvedCount ?? 0;
  const total = openCount + resolvedCount;
  const progressPct = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  const firstName = profile?.fullName ? profile.fullName.split(' ').slice(-1)[0] : 'you';

  const renderTicket = ({ item }: { item: TicketDTO }) => {
    const meta = STATUS_META[item.status] ?? { label: item.status, badge: 'new' as const, progress: 10 };
    const bc = BadgeColors[meta.badge];
    const category = CATEGORY_LABEL[item.category] ?? item.category;
    return (
      <ProgressListItem
        title={item.title || item.code}
        dotColor={bc.text}
        badge={{ label: meta.label, bg: bc.bg, text: bc.text }}
        percent={meta.progress}
        barColor={bc.text}
        caption={
          item.hasUnreadChat
            ? `${item.code} · ${category} · 💬 new message`
            : `${item.code} · ${category}`
        }
        onPress={() =>
          router.push({
            pathname: '/(staff)/tickets/[id]',
            params: { id: item.id, ...(item.hasUnreadChat ? { jumpToUnread: '1' } : {}) },
          })
        }
      />
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.headerWrap}>
        <HomeHeader
          name={firstName}
          subtitle={profile?.department || 'Field technician'}
          avatarUrl={profile?.avatarUrl}
          unreadCount={unreadCount}
          onBellPress={() => router.navigate('/(staff)/notifications' as any)}
        />

        <StatTrio
          left={{ value: String(openCount), label: 'In progress' }}
          center={{ percent: progressPct, label: 'Progress', color: progressColor(progressPct) }}
          right={{ value: String(resolvedCount), label: 'Completed' }}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Work to handle</Text>
          {/* Total unread chats across ALL tickets — different from the notification bell in the
              header (useUnreadCount = notifications). Tapping opens the customer list directly. */}
          {chatUnread > 0 && (
            <Pressable
              style={styles.unreadPill}
              onPress={() => router.navigate('/(staff)/(tabs)/customers' as any)}
              accessibilityLabel={`${chatUnread} unread messages`}
            >
              <Ionicons name="chatbubble-ellipses" size={13} color="#FFF" />
              <Text style={styles.unreadPillText}>
                {chatUnread > 99 ? '99+' : chatUnread} unread
              </Text>
            </Pressable>
          )}
        </View>

        {/* Horizontal scroll instead of flex:1 even split — long labels ("In progress (3)") no longer
            get squeezed against the right edge. Chips size to their content so adding a new filter doesn't break the layout. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_TABS.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <Text
                style={[styles.filterText, activeFilter === tab.key && styles.filterTextActive]}
                numberOfLines={1}
              >
                {tab.label}
                {counts[tab.key] != null ? ` (${counts[tab.key]})` : ''}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.textFaint} />
          <Text style={styles.emptyText}>Failed to load ticket list</Text>
          <Pressable onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderTicket}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-circle-outline" size={48} color={Colors.textFaint} />
              <Text style={styles.emptyText}>No tickets</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Solar.bg },
  headerWrap: { paddingHorizontal: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: Solar.ink, letterSpacing: -0.4 },
  unreadPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FF3B30', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  unreadPillText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  // Stretched to both edges to offset headerWrap's paddingHorizontal:20 — chips scroll the full
  // screen width instead of being cut off at the edge; start/end padding is restored via contentContainerStyle.
  filterScroll: {
    marginHorizontal: -20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterTab: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(235,230,215,0.7)',
  },
  filterTabActive: {
    backgroundColor: Solar.yellow,
    borderColor: Solar.yellow,
    shadowColor: Solar.yellowDeep,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Solar.mute,
  },
  filterTextActive: {
    color: Solar.ink,
    fontWeight: '800',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Solar.faint,
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: Solar.yellow,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '800',
    color: Solar.ink,
  },
});
