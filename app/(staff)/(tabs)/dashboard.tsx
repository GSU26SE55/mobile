import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeColors, Colors, Solar } from '@/src/lib/theme';
import { useStaffTickets } from '@/src/features/staff/hooks/useStaffTickets';
import { useStaffDashboardStats } from '@/src/features/staff/hooks/useStaffDashboardStats';
import { useStaffProfile } from '@/src/features/staff/hooks/useStaffProfile';
import { useUnreadCount } from '@/src/features/notifications/hooks/useNotifications';
import { TicketStatusEnum, TicketDTO } from '@/src/features/tickets/types/ticket.types';
import { HomeHeader } from '@/src/shared/components/HomeHeader';
import { StatTrio } from '@/src/shared/components/StatTrio';
import { ProgressListItem } from '@/src/shared/components/ProgressListItem';

type FilterTab = 'all' | 'active' | 'waiting' | 'resolved';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang xử lý' },
  { key: 'waiting', label: 'Chờ' },
  { key: 'resolved', label: 'Hoàn thành' },
];

const ACTIVE_STATUSES: TicketStatusEnum[] = ['Assigned', 'InProgress'];
const WAITING_STATUSES: TicketStatusEnum[] = ['WaitingCustomer', 'WaitingParts', 'WaitingOnsiteSchedule'];
const RESOLVED_STATUSES: TicketStatusEnum[] = ['Resolved', 'Escalated'];

// status → nhãn tiếng Việt + badge (palette hiện tại) + % tiến độ trong vòng đời + màu thanh.
const STATUS_META: Record<string, { label: string; badge: keyof typeof BadgeColors; progress: number }> = {
  New: { label: 'Mới', badge: 'new', progress: 10 },
  Open: { label: 'Đang mở', badge: 'open', progress: 15 },
  Assigned: { label: 'Được giao', badge: 'assigned', progress: 30 },
  InProgress: { label: 'Đang xử lý', badge: 'progress', progress: 60 },
  WaitingCustomer: { label: 'Chờ khách', badge: 'waiting', progress: 50 },
  WaitingParts: { label: 'Chờ linh kiện', badge: 'waiting', progress: 50 },
  WaitingOnsiteSchedule: { label: 'Chờ lịch', badge: 'waiting', progress: 50 },
  Resolved: { label: 'Đã xử lý', badge: 'resolved', progress: 100 },
  Escalated: { label: 'Đã escalate', badge: 'escalated', progress: 80 },
  ClosedPendingRate: { label: 'Chờ đánh giá', badge: 'closed', progress: 100 },
  Closed: { label: 'Đã đóng', badge: 'closed', progress: 100 },
  ClosedRejected: { label: 'Bị từ chối', badge: 'crit', progress: 100 },
  Incident: { label: 'Sự cố', badge: 'crit', progress: 40 },
};

const CATEGORY_LABEL: Record<string, string> = {
  Charging: 'Sạc pin',
  Overheat: 'Quá nhiệt',
  NoPower: 'Mất điện',
  Performance: 'Hiệu suất',
  Repair: 'Sửa chữa',
  Other: 'Khác',
};

// Màu vòng tiến độ hôm nay — echo tông cam của mẫu nhưng vẫn trong palette hiện tại.
function progressColor(p: number): string {
  // Accent trang trí (tiến độ, không phải mức nguy hiểm): đạt mức khá → xanh lá.
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

  const allTickets = apiTickets?.items ?? [];

  const filtered = allTickets.filter((t) => {
    if (activeFilter === 'active') return ACTIVE_STATUSES.includes(t.status);
    if (activeFilter === 'waiting') return WAITING_STATUSES.includes(t.status);
    if (activeFilter === 'resolved') return RESOLVED_STATUSES.includes(t.status);
    return true;
  });

  // Tab counts từ stats.countByStatus (single source). Chưa load → null → ẩn số trên tab.
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

  const firstName = profile?.fullName ? profile.fullName.split(' ').slice(-1)[0] : 'bạn';

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
        caption={`${item.code} · ${category}`}
        onPress={() => router.push({ pathname: '/(staff)/tickets/[id]', params: { id: item.id } })}
      />
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.headerWrap}>
        <HomeHeader
          name={firstName}
          subtitle={profile?.department || 'Kỹ thuật viên hiện trường'}
          avatarUrl={profile?.avatarUrl}
          unreadCount={unreadCount}
          onBellPress={() => router.navigate('/(staff)/notifications' as any)}
        />

        <StatTrio
          left={{ value: String(openCount), label: 'Đang xử lý' }}
          center={{ percent: progressPct, label: 'Tiến độ xử lý', color: progressColor(progressPct) }}
          right={{ value: String(resolvedCount), label: 'Hoàn thành' }}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Công việc cần xử lý</Text>
        </View>

        <View style={styles.filterRow}>
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
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.textFaint} />
          <Text style={styles.emptyText}>Không tải được danh sách ticket</Text>
          <Pressable onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Thử lại</Text>
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
              <Text style={styles.emptyText}>Không có ticket nào</Text>
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
  sectionHeader: { marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: Solar.ink, letterSpacing: -0.4 },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 12,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
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
