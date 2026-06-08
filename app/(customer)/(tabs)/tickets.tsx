import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TicketCard } from '../../../src/features/tickets/components/TicketCard';
import { useTickets } from '../../../src/features/tickets/hooks/useTickets';
import { TicketStatusEnum } from '../../../src/features/tickets/types/ticket.types';

const STATUS_FILTERS: { label: string; value: TicketStatusEnum | undefined }[] = [
  { label: 'Tất cả',        value: undefined },
  { label: 'Mới',           value: 'New' },
  { label: 'Đang xử lý',   value: 'InProgress' },
  { label: 'Chờ đánh giá', value: 'ClosedPendingRate' },
  { label: 'Đã đóng',      value: 'Closed' },
];

const PAGE_SIZE = 10;

export default function TicketListScreen() {
  const [status, setStatus] = useState<TicketStatusEnum | undefined>(undefined);
  const [page, setPage]     = useState(1);

  const { data, isLoading, isRefetching, refetch } = useTickets({
    Status: status,
    PageNumber: page,
    PageSize: PAGE_SIZE,
  });

  const tickets = data?.items ?? [];
  const hasNext = data?.hasNextPage ?? false;

  const handleLoadMore = () => {
    if (hasNext && !isLoading) setPage((p) => p + 1);
  };

  const handleFilterChange = (value: TicketStatusEnum | undefined) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <SafeAreaView style={styles.safe}>
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ticket hỗ trợ</Text>
        <Pressable style={styles.createBtn} onPress={() => router.push('/(customer)/tickets/create')}>
          <Text style={styles.createBtnText}>+ Tạo mới</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        {STATUS_FILTERS.map((f) => (
          <Pressable
            key={String(f.value)}
            style={[styles.filterChip, status === f.value && styles.filterChipActive]}
            onPress={() => handleFilterChange(f.value)}
          >
            <Text style={[styles.filterText, status === f.value && styles.filterTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading && page === 1 ? (
        <ActivityIndicator style={styles.loader} />
      ) : tickets.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Chưa có ticket nào.</Text>
          <Pressable onPress={() => router.push('/(customer)/tickets/create')}>
            <Text style={styles.emptyLink}>Tạo ticket đầu tiên</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TicketCard
              ticket={item}
              onPress={() => router.push({ pathname: '/(customer)/tickets/[id]', params: { id: item.id } })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={hasNext ? <ActivityIndicator style={styles.loader} /> : null}
        />
      )}
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#F5F7FA' },
  container:        { flex: 1, backgroundColor: '#F5F7FA' },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title:            { fontSize: 20, fontWeight: '700', color: '#111' },
  createBtn:        { backgroundColor: '#1976D2', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  createBtnText:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  filterBar:        { flexGrow: 0, paddingHorizontal: 12, marginBottom: 8 },
  filterContent:    { gap: 8, paddingVertical: 4 },
  filterChip:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#E8EAF6', borderWidth: 1, borderColor: 'transparent' },
  filterChipActive: { backgroundColor: '#1976D2', borderColor: '#1976D2' },
  filterText:       { fontSize: 13, color: '#555' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  list:             { paddingHorizontal: 16, paddingBottom: 24 },
  loader:           { marginVertical: 20 },
  empty:            { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText:        { color: '#888', fontSize: 15 },
  emptyLink:        { color: '#1976D2', fontWeight: '600', fontSize: 14 },
});
