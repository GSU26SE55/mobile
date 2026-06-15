import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Shadow } from '../../../src/lib/theme';
import { useStaffTickets } from '../../../src/features/staff/hooks/useStaffTickets';
import { useStaffProfile } from '../../../src/features/staff/hooks/useStaffProfile';
import { StaffTicketCard } from '../../../src/features/staff/components/StaffTicketCard';
import { TicketStatusEnum } from '../../../src/features/tickets/types/ticket.types';

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


export default function StaffDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const { data: apiTickets, isLoading, refetch } = useStaffTickets();
  const { data: profile } = useStaffProfile();

  const allTickets = apiTickets?.items ?? [];

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

      {isLoading ? (
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
