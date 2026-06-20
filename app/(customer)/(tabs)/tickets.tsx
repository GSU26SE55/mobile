import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TicketCard } from '../../../src/features/tickets/components/TicketCard';
import { useTickets } from '../../../src/features/tickets/hooks/useTickets';
import { Colors, Shadow, ShadowPrimary } from '../../../src/lib/theme';

type FilterKey = 'all' | 'open' | 'closed';

export default function TicketListScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterKey>('all');

  // Fetch all tickets from API
  const { data: allData, isLoading, isError, isRefetching, refetch } = useTickets({ PageSize: 100 });
  const allTickets = allData?.items ?? [];
  const totalCount = allTickets.length;

  const openCount = allTickets.filter((t) =>
    !['Resolved', 'Closed', 'ClosedPendingRate', 'ClosedRejected'].includes(t.status)
  ).length;

  const closedCount = totalCount - openCount;

  // Filter local items based on state
  const displayedTickets = allTickets.filter((t) => {
    if (filter === 'open') {
      return !['Resolved', 'Closed', 'ClosedPendingRate', 'ClosedRejected'].includes(t.status);
    }
    if (filter === 'closed') {
      return ['Resolved', 'Closed', 'ClosedPendingRate', 'ClosedRejected'].includes(t.status);
    }
    return true;
  });

  const handleFilterChange = (key: FilterKey) => {
    setFilter(key);
  };

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: `Tất cả (${totalCount})` },
    { key: 'open', label: `Đang mở (${openCount})` },
    { key: 'closed', label: `Đã đóng (${closedCount})` },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Tickets</Text>
          <Text style={styles.subtitle}>{openCount} đang mở · {totalCount} tổng</Text>
        </View>
        <Pressable
          style={[styles.addBtn, Shadow]}
          onPress={() => router.push('/(customer)/tickets/create')}
        >
          <Ionicons name="add" size={20} color="#34C759" />
        </Pressable>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterWrap}>
        <View style={[styles.filterBar, Shadow]}>
          {filters.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
              onPress={() => handleFilterChange(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator color="#34C759" size="large" />
        </View>
      ) : isError ? (
        <View style={styles.empty}>
          <Ionicons name="alert-circle-outline" size={36} color={Colors.textFaint} />
          <Text style={styles.emptyText}>Không thể tải danh sách ticket</Text>
          <Pressable style={[styles.emptyBtn, ShadowPrimary]} onPress={() => refetch()}>
            <Text style={styles.emptyBtnText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : displayedTickets.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={36} color={Colors.textFaint} />
          <Text style={styles.emptyText}>Không có ticket nào</Text>
          <Pressable
            style={[styles.emptyBtn, ShadowPrimary]}
            onPress={() => router.push('/(customer)/tickets/create')}
          >
            <Text style={styles.emptyBtnText}>Tạo ticket đầu tiên</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={displayedTickets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TicketCard
              ticket={item}
              onPress={() => router.push({ pathname: '/(customer)/tickets/[id]', params: { id: item.id } })}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={['#34C759']}
              tintColor="#34C759"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMute,
    marginTop: 2,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  filterWrap: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#34C759',
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
    paddingBottom: 110,
    paddingTop: 4,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 80,
  },
  emptyText: {
    color: Colors.textMute,
    fontSize: 13,
  },
  emptyBtn: {
    backgroundColor: '#34C759',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
