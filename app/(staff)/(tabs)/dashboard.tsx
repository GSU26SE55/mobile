import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../../src/lib/theme';
import { useStaffTickets } from '../../../src/features/staff/hooks/useStaffTickets';
import { StaffTicketCard } from '../../../src/features/staff/components/StaffTicketCard';
import { StaffHeader } from '../../../src/features/staff/components/StaffHeader';
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
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const { data: apiTickets, isLoading, refetch } = useStaffTickets();

  const allTickets = apiTickets?.items ?? [];

  const filtered = allTickets.filter((t) => {
    if (activeFilter === 'active')   return ACTIVE_STATUSES.includes(t.status);
    if (activeFilter === 'waiting')  return WAITING_STATUSES.includes(t.status);
    if (activeFilter === 'resolved') return RESOLVED_STATUSES.includes(t.status);
    return true;
  });

  const counts: Record<FilterTab, number> = {
    all:      allTickets.length,
    active:   allTickets.filter((t) => ACTIVE_STATUSES.includes(t.status)).length,
    waiting:  allTickets.filter((t) => WAITING_STATUSES.includes(t.status)).length,
    resolved: allTickets.filter((t) => RESOLVED_STATUSES.includes(t.status)).length,
  };

  return (
    <View style={styles.root}>
      <StaffHeader showGreeting />

      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <Text style={[styles.filterText, activeFilter === tab.key && styles.filterTextActive]} numberOfLines={1}>
              {tab.label} ({counts[tab.key]})
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
  root:   { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 16,
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
