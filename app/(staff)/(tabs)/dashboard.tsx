import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Shadow } from '../../../src/lib/theme';
import { useStaffTickets } from '../../../src/features/staff/hooks/useStaffTickets';
import { useStaffProfile } from '../../../src/features/staff/hooks/useStaffProfile';
import { StaffTicketCard } from '../../../src/features/staff/components/StaffTicketCard';
import { TicketDTO, TicketStatusEnum } from '../../../src/features/tickets/types/ticket.types';

type FilterTab = 'all' | 'active' | 'waiting' | 'resolved';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',      label: 'Tất cả' },
  { key: 'active',   label: 'Đang xử lý' },
  { key: 'waiting',  label: 'Chờ' },
  { key: 'resolved', label: 'Hoàn thành' },
];

const ACTIVE_STATUSES: TicketStatusEnum[] = ['Assigned', 'InProgress'];
const WAITING_STATUSES: TicketStatusEnum[] = ['WaitingCustomer', 'WaitingParts', 'WaitingOnsiteSchedule'];
const RESOLVED_STATUSES: TicketStatusEnum[] = ['Resolved', 'Escalated'];

const NOW = Date.now();
const MOCK_TICKETS: TicketDTO[] = [
  {
    id: 'staff-mock-1', code: 'TK-0042', batteryAssetId: 'ba-001', customerId: 'cust-1',
    assignedStaffId: 'me', title: 'Overheat - Battery BR-001 nhiệt độ vượt ngưỡng',
    category: 'Overheat', priority: 'P1Critical', impactScope: 'SingleAsset', urgencyLevel: 'High',
    status: 'InProgress', origin: 'AutoFromAlert', reopenCount: 0, isIncident: false,
    createdAt: new Date(NOW - 2 * 3600_000).toISOString(), updatedAt: new Date(NOW - 30 * 60_000).toISOString(),
    slaTimer: { id: 'sla-1', priority: 'P1Critical', startedAt: new Date(NOW - 2 * 3600_000).toISOString(), dueAt: new Date(NOW + 2 * 3600_000).toISOString(), originalDueAt: new Date(NOW + 2 * 3600_000).toISOString(), totalPausedMinutes: 0, warningSentAt: null, breachAt: null, status: 'Running', remainingPercent: 50 },
  },
  {
    id: 'staff-mock-2', code: 'TK-0045', batteryAssetId: 'ba-003', customerId: 'cust-2',
    assignedStaffId: 'me', title: 'Pin BR-003 không nhận sạc từ solar panel',
    category: 'Charging', priority: 'P2High', impactScope: 'SingleAsset', urgencyLevel: 'Medium',
    status: 'Assigned', origin: 'ManualByCustomer', reopenCount: 0, isIncident: false,
    createdAt: new Date(NOW - 1 * 3600_000).toISOString(), updatedAt: null,
    slaTimer: { id: 'sla-2', priority: 'P2High', startedAt: new Date(NOW - 1 * 3600_000).toISOString(), dueAt: new Date(NOW + 23 * 3600_000).toISOString(), originalDueAt: new Date(NOW + 23 * 3600_000).toISOString(), totalPausedMinutes: 0, warningSentAt: null, breachAt: null, status: 'Running', remainingPercent: 96 },
  },
  {
    id: 'staff-mock-3', code: 'TK-0039', batteryAssetId: 'ba-002', customerId: 'cust-1',
    assignedStaffId: 'me', title: 'Chờ khách cung cấp thông tin model inverter',
    category: 'Performance', priority: 'P3Normal', impactScope: 'SingleAsset', urgencyLevel: 'Low',
    status: 'WaitingCustomer', origin: 'ManualByCustomer', reopenCount: 0, isIncident: false,
    createdAt: new Date(NOW - 24 * 3600_000).toISOString(), updatedAt: new Date(NOW - 3 * 3600_000).toISOString(),
    slaTimer: { id: 'sla-3', priority: 'P3Normal', startedAt: new Date(NOW - 24 * 3600_000).toISOString(), dueAt: new Date(NOW + 48 * 3600_000).toISOString(), originalDueAt: new Date(NOW + 48 * 3600_000).toISOString(), totalPausedMinutes: 180, warningSentAt: null, breachAt: null, status: 'Paused', remainingPercent: 67 },
  },
  {
    id: 'staff-mock-4', code: 'TK-0031', batteryAssetId: null, customerId: 'cust-3',
    assignedStaffId: 'me', title: 'Bảo trì định kỳ hệ thống pin site D',
    category: 'Repair', priority: 'P3Normal', impactScope: 'Site', urgencyLevel: 'Low',
    status: 'Resolved', origin: 'ManualByCustomer', reopenCount: 0, isIncident: false,
    createdAt: new Date(NOW - 3 * 86400_000).toISOString(), updatedAt: new Date(NOW - 86400_000).toISOString(),
    slaTimer: null,
  },
];

export default function StaffDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const { data: apiTickets, isLoading, refetch } = useStaffTickets();
  const { data: profile } = useStaffProfile();

  const allTickets = apiTickets?.items ?? MOCK_TICKETS;

  const filtered = allTickets.filter((t) => {
    if (activeFilter === 'active')   return ACTIVE_STATUSES.includes(t.status);
    if (activeFilter === 'waiting')  return WAITING_STATUSES.includes(t.status);
    if (activeFilter === 'resolved') return RESOLVED_STATUSES.includes(t.status);
    return true;
  });

  const activeCount  = allTickets.filter((t) => ACTIVE_STATUSES.includes(t.status)).length;
  const waitingCount = allTickets.filter((t) => WAITING_STATUSES.includes(t.status)).length;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.greeting}>Xin chào,</Text>
          <Text style={styles.name}>{profile?.fullName ?? 'Staff'}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statChip, { backgroundColor: Colors.warningLight }]}>
            <Text style={[styles.statNum, { color: Colors.warningDark }]}>{activeCount}</Text>
            <Text style={[styles.statLabel, { color: Colors.warningDark }]}>đang xử lý</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: Colors.infoLight }]}>
            <Text style={[styles.statNum, { color: Colors.infoDark }]}>{waitingCount}</Text>
            <Text style={[styles.statLabel, { color: Colors.infoDark }]}>đang chờ</Text>
          </View>
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <Text style={[styles.filterText, activeFilter === tab.key && styles.filterTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading && allTickets === MOCK_TICKETS ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StaffTicketCard
              ticket={item}
              onPress={() => router.push({ pathname: '/(staff)/tickets/[id]', params: { id: item.id } })}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={Colors.primary} />}
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
  root:    { flex: 1, backgroundColor: Colors.bg },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:  { paddingHorizontal: 20, paddingBottom: 16 },
  greeting:{ fontSize: 14, fontWeight: '500', color: Colors.textMute },
  name:    { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 2 },
  statsRow:{ flexDirection: 'row', gap: 8, marginTop: 14 },
  statChip:{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statNum: { fontSize: 18, fontWeight: '800' },
  statLabel:{ fontSize: 12, fontWeight: '600' },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.card2,
  },
  filterTabActive: {
    backgroundColor: Colors.text,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMute,
  },
  filterTextActive: {
    color: '#FFFFFF',
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
    color: Colors.textFaint,
    fontWeight: '600',
  },
});
