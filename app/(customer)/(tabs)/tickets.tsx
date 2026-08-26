import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TicketCard } from '@/src/features/tickets/components/TicketCard';
import { useTickets } from '@/src/features/tickets/hooks/useTickets';
import { customerLaneOf, CustomerLane } from '@/src/features/tickets/utils/ticketLabels';
import { checkPermission, P } from '@/src/lib/authz';
import { useSessionStore } from '@/src/stores/sessionStore';
import { Colors, Font, Solar } from '@/src/lib/theme';
import { EnergyBackdrop, GlassSurface } from '@/src/features/batteries/components/EnergyBackdrop';
import { FilterChips } from '@/src/shared/components/FilterChips';
import { TicketCardSkeleton } from '@/src/features/tickets/components/TicketCardSkeleton';
import { enterRow, PressableScale } from '@/src/shared/components/motion';

// Six lanes, no "All". They partition all eight backend statuses — the
// `Record<TicketStatusEnum, …>` in ticketLabels.ts is what guarantees no ticket
// becomes unreachable now that there is no catch-all tab.
const LANES: { key: CustomerLane; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'inprocess', label: 'In progress' },
  { key: 'pending', label: 'Scheduled' },
  { key: 'complete', label: 'Completed' },
  { key: 'closed', label: 'Closed' },
  { key: 'reject', label: 'Declined' },
];

const EMPTY_COPY: Record<CustomerLane, string> = {
  new: 'No new tickets',
  inprocess: 'Nothing being worked on',
  pending: 'Nothing scheduled',
  complete: 'Nothing awaiting your review',
  closed: 'Nothing closed yet',
  reject: 'No declined tickets',
};

export default function TicketListScreen() {
  const insets = useSafeAreaInsets();
  // Opens on live work, not on a mixed list with closed tickets in it.
  const [lane, setLane] = useState<CustomerLane>('inprocess');
  const user = useSessionStore((s) => s.user);
  const canCreate = checkPermission(user, P.TICKET_CREATE);

  const { data, isLoading, isError, isRefetching, refetch } = useTickets({ PageSize: 100 });
  const allTickets = useMemo(() => data?.items ?? [], [data]);

  const counts = useMemo(() => {
    const acc: Record<CustomerLane, number> = {
      new: 0,
      inprocess: 0,
      pending: 0,
      complete: 0,
      closed: 0,
      reject: 0,
    };
    for (const ticket of allTickets) {
      const key = customerLaneOf(ticket.status);
      if (key) acc[key] += 1;
    }
    return acc;
  }, [allTickets]);

  const visible = useMemo(
    () => allTickets.filter((t) => customerLaneOf(t.status) === lane),
    [allTickets, lane],
  );

  const chips = LANES.map((l) => ({ ...l, count: counts[l.key] }));

  return (
    <View style={styles.container}>
      <EnergyBackdrop />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Tickets</Text>
          {/* Describes the list underneath, not a mix of every lane. */}
          <Text style={styles.subtitle}>
            {visible.length} {LANES.find((l) => l.key === lane)?.label.toLowerCase()}
          </Text>
        </View>
        {canCreate && (
          <PressableScale
            style={styles.addBtn}
            scaleTo={0.9}
            onPress={() => router.push('/(customer)/tickets/create')}
            accessibilityRole="button"
            accessibilityLabel="Create ticket"
          >
            <Ionicons name="add" size={22} color={Solar.ink} />
          </PressableScale>
        )}
      </View>

      <View style={styles.filterWrap}>
        {/* No `fill`: six chips split evenly would truncate every label at 360dp,
            so the row scrolls instead. */}
        <FilterChips items={chips} value={lane} onChange={setLane} />
      </View>

      {isLoading ? (
        // Skeleton, not a spinner: it reserves the real row shape so the list
        // does not reflow when data lands.
        <View style={styles.list}>
          <TicketCardSkeleton />
        </View>
      ) : isError ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-offline-outline" size={36} color={Solar.mute} />
          <Text style={styles.emptyText}>Unable to load the ticket list</Text>
          <Pressable style={styles.emptyBtn} onPress={() => refetch()}>
            <Text style={styles.emptyBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          // Remount per lane so the stagger replays — makes it read as a new
          // list rather than the same one silently rewritten.
          key={lane}
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            // Rows arrive top-down so the eye lands on the first one.
            <Animated.View entering={enterRow(index)}>
              <TicketCard
                ticket={item}
                audience="customer"
                onPress={() =>
                  router.push({ pathname: '/(customer)/tickets/[id]', params: { id: item.id } })
                }
              />
            </Animated.View>
          )}
          contentContainerStyle={[styles.list, visible.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[Solar.yellowDeep]}
              tintColor={Solar.yellowDeep}
            />
          }
          ListEmptyComponent={
            <Animated.View entering={FadeIn.duration(220)}>
            <GlassSurface style={styles.emptyCard}>
              <Ionicons name="document-text-outline" size={42} color={Solar.faint} />
              <Text style={styles.emptyText}>{EMPTY_COPY[lane]}</Text>
              {canCreate && lane !== 'complete' && (
                <Pressable
                  style={styles.emptyBtn}
                  onPress={() => router.push('/(customer)/tickets/create')}
                >
                  <Text style={styles.emptyBtnText}>Create a ticket</Text>
                </Pressable>
              )}
            </GlassSurface>
            </Animated.View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Solar.bg },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flex: 1 },
  title: { ...Font.display },
  subtitle: { ...Font.meta, marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Solar.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Solar.yellowDeep,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  // No horizontal padding: FilterChips' scrolling row brings its own 20dp inset, and
  // padding here would clip the scroll before the screen edge.
  filterWrap: { marginBottom: 14 },
  list: { paddingHorizontal: 20, paddingBottom: 110, paddingTop: 4 },
  listEmpty: { flexGrow: 1, justifyContent: 'center', paddingBottom: 150 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 80,
    paddingHorizontal: 20,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: { ...Font.meta, fontSize: 13, marginTop: 8 },
  emptyBtn: {
    backgroundColor: Solar.yellow,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 11,
    marginTop: 14,
  },
  emptyBtnText: { color: Colors.accent, fontWeight: '700', fontSize: 14 },
});
