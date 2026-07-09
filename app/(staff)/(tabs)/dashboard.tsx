import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../../src/lib/theme';
import { useStaffTickets } from '../../../src/features/staff/hooks/useStaffTickets';
import { useStaffDashboardStats } from '../../../src/features/staff/hooks/useStaffDashboardStats';
import { StaffTicketCard } from '../../../src/features/staff/components/StaffTicketCard';
import { StaffDashboardStats } from '../../../src/features/staff/components/StaffDashboardStats';
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
  // BE default PageSize=10 (PaginationRequest) → phải truyền để đếm/list không bị cắt còn 10.
  // BE clamp max=100; counts dưới tính client-side trên trang này. Nếu staff vượt 100 ticket
  // cần đếm bằng totalItems + filter status server-side (BE chưa hỗ trợ multi-status filter).
  const { data: apiTickets, isLoading, isError, isRefetching, refetch } = useStaffTickets({ PageSize: 100 });
  // GH-67 — counts đọc từ endpoint dashboard/stats (server-side, chính xác) thay vì đếm
  // client-side trên trang cap-100. Query dùng chung cache với StaffDashboardStats (dedup).
  const { data: stats } = useStaffDashboardStats();

  const allTickets = apiTickets?.items ?? [];

  const filtered = allTickets.filter((t) => {
    if (activeFilter === 'active')   return ACTIVE_STATUSES.includes(t.status);
    if (activeFilter === 'waiting')  return WAITING_STATUSES.includes(t.status);
    if (activeFilter === 'resolved') return RESOLVED_STATUSES.includes(t.status);
    return true;
  });

  // Tab counts từ stats.countByStatus (single source). Chưa load → null → ẩn số trên tab.
  const cbs = stats?.countByStatus;
  const sumOf = (statuses: TicketStatusEnum[]) => statuses.reduce((s, k) => s + (cbs?.[k] ?? 0), 0);
  const counts: Record<FilterTab, number | null> = {
    all:      cbs ? Object.values(cbs).reduce((s, v) => s + v, 0) : null,
    active:   cbs ? sumOf(ACTIVE_STATUSES) : null,
    waiting:  cbs ? sumOf(WAITING_STATUSES) : null,
    resolved: cbs ? sumOf(RESOLVED_STATUSES) : null,
  };

  // KPI + filter cuộn cùng list (ListHeaderComponent) → không ép vùng list; trạng thái
  // load/lỗi của list nằm trong ListEmptyComponent để KPI (query riêng) luôn hiển thị.
  const header = (
    <>
      <StaffDashboardStats />
      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <Text style={[styles.filterText, activeFilter === tab.key && styles.filterTextActive]} numberOfLines={1}>
              {tab.label}{counts[tab.key] != null ? ` (${counts[tab.key]})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );

  return (
    <View style={styles.root}>
      <StaffHeader showGreeting />
      <FlatList
        data={isLoading || isError ? [] : filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <StaffTicketCard
              ticket={item}
              onPress={() => router.push({ pathname: '/(staff)/tickets/[id]', params: { id: item.id } })}
            />
          </View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={Colors.primary} size="large" />
            </View>
          ) : isError ? (
            <View style={styles.stateBox}>
              <Ionicons name="cloud-offline-outline" size={48} color={Colors.textFaint} />
              <Text style={styles.emptyText}>Không tải được danh sách ticket</Text>
              <Pressable onPress={() => refetch()} style={styles.retryBtn}>
                <Text style={styles.retryText}>Thử lại</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.stateBox}>
              <Ionicons name="checkmark-done-circle-outline" size={48} color={Colors.textFaint} />
              <Text style={styles.emptyText}>Không có ticket nào</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg },
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
    paddingBottom: 100,
  },
  cardWrap: {
    paddingHorizontal: 20,
  },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textFaint,
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
