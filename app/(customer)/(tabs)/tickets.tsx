import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TicketCard } from '@/src/features/tickets/components/TicketCard';
import { useTickets } from '@/src/features/tickets/hooks/useTickets';
import { checkPermission, P } from '@/src/lib/authz';
import { useSessionStore } from '@/src/stores/sessionStore';
import { Solar } from '@/src/lib/theme';
import { EnergyBackdrop, GlassSurface } from '@/src/features/batteries/components/EnergyBackdrop';

type FilterKey = 'all' | 'open' | 'closed';

export default function TicketListScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterKey>('all');
  const user = useSessionStore((s) => s.user);
  const canCreate = checkPermission(user, P.TICKET_CREATE);

  const { data: allData, isLoading, isError, isRefetching, refetch } = useTickets({ PageSize: 100 });
  const allTickets = allData?.items ?? [];
  const totalCount = allTickets.length;

  const openCount = allTickets.filter((t) =>
    !['Resolved', 'Closed', 'ClosedPendingRate', 'ClosedRejected'].includes(t.status)
  ).length;

  const closedCount = totalCount - openCount;

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
      <EnergyBackdrop />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Tickets</Text>
          <Text style={styles.subtitle}>{openCount} đang mở · {totalCount} tổng</Text>
        </View>
        {canCreate && (
          <Pressable
            style={styles.addBtn}
            onPress={() => router.push('/(customer)/tickets/create')}
          >
            <Ionicons name="add" size={22} color={Solar.ink} />
          </Pressable>
        )}
      </View>

      {/* Filter tabs */}
      <View style={styles.filterWrap}>
        <GlassSurface style={styles.filterBar}>
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
        </GlassSurface>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={Solar.yellowDeep} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.empty}>
          <Ionicons name="alert-circle-outline" size={36} color={Solar.mute} />
          <Text style={styles.emptyText}>Không thể tải danh sách ticket</Text>
          <Pressable style={styles.emptyBtn} onPress={() => refetch()}>
            <Text style={styles.emptyBtnText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : displayedTickets.length === 0 ? (
        <View style={styles.empty}>
          <GlassSurface style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={42} color={Solar.faint} />
            <Text style={styles.emptyText}>Không có ticket nào</Text>
            {canCreate && (
              <Pressable
                style={styles.emptyBtn}
                onPress={() => router.push('/(customer)/tickets/create')}
              >
                <Text style={styles.emptyBtnText}>Tạo ticket đầu tiên</Text>
              </Pressable>
            )}
          </GlassSurface>
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
              colors={[Solar.yellowDeep]}
              tintColor={Solar.yellowDeep}
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
    backgroundColor: Solar.bg,
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
    fontSize: 24,
    fontWeight: '900',
    color: Solar.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: Solar.mute,
    fontWeight: '600',
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#8C7A4B',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  filterWrap: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    borderRadius: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 16,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: Solar.yellow,
    shadowColor: Solar.yellowDeep,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: Solar.mute,
  },
  filterTextActive: {
    color: Solar.ink,
    fontWeight: '900',
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
    paddingHorizontal: 20,
  },
  emptyCard: {
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    width: '100%',
  },
  emptyText: {
    color: Solar.mute,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyBtn: {
    backgroundColor: Solar.yellow,
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 14,
    shadowColor: Solar.yellowDeep,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  emptyBtnText: {
    color: Solar.ink,
    fontWeight: '900',
    fontSize: 13,
  },
});
