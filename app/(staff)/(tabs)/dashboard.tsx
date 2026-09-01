import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Font, Solar } from "@/src/lib/theme";
import { useStaffTickets } from "@/src/features/staff/hooks/useStaffTickets";
import { useStaffDashboardStats } from "@/src/features/staff/hooks/useStaffDashboardStats";
import { useStaffProfile } from "@/src/features/staff/hooks/useStaffProfile";
import { useUnreadCount } from "@/src/features/notifications/hooks/useNotifications";
import { TicketDTO } from "@/src/features/tickets/types/ticket.types";
import { TicketCard } from "@/src/features/tickets/components/TicketCard";
import {
  staffLaneOf,
  StaffLane,
} from "@/src/features/tickets/utils/ticketLabels";
import {
  EnergyBackdrop,
  GlassSurface,
} from "@/src/features/batteries/components/EnergyBackdrop";
import { HomeHeader } from "@/src/shared/components/HomeHeader";
import { FilterChips } from "@/src/shared/components/FilterChips";
import { TicketCardSkeleton } from "@/src/features/tickets/components/TicketCardSkeleton";
import { enterRow } from "@/src/shared/components/motion";
import { useSessionStore } from "@/src/stores/sessionStore";

// Split by who the ticket is waiting on: work to do now, work parked with
// somebody else (scheduled, held, escalated, being reassigned), and work finished.
const LANES: { key: StaffLane; label: string }[] = [
  { key: "process", label: "In progress" },
  { key: "pending", label: "Pending" },
  { key: "done", label: "Completed" },
];

const EMPTY_COPY: Record<StaffLane, string> = {
  process: "Nothing in progress",
  pending: "Nothing pending",
  done: "Nothing completed yet",
};

const ROLE_BADGES: Record<string, { label: string; bg: string; text: string }> =
  {
    PrimaryHandler: { label: "Primary", bg: Solar.yellowSoft, text: "#B78103" },
    Supporter: { label: "Supporter", bg: "#F3E5F5", text: "#7B1FA2" },
    PreviousPrimaryHandler: {
      label: "Previous",
      bg: Solar.tile,
      text: Solar.ink2,
    },
  };

/** Three numbers, no gauge. Overdue in red is what a technician needs above the fold. */
function StatStrip({
  open,
  overdue,
  done,
}: {
  open: number;
  overdue: number;
  done: number;
}) {
  const cells = [
    { value: open, label: "In progress", color: Solar.ink },
    {
      value: overdue,
      label: "Overdue",
      color: overdue > 0 ? Colors.danger : Solar.faint,
    },
    { value: done, label: "Completed", color: Solar.ink },
  ];
  return (
    <GlassSurface style={styles.strip}>
      {cells.map((cell, i) => (
        <React.Fragment key={cell.label}>
          {i > 0 && <View style={styles.stripDivider} />}
          <View style={styles.stripCell}>
            <Text style={[styles.stripValue, { color: cell.color }]}>
              {cell.value}
            </Text>
            <Text style={styles.stripLabel}>{cell.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </GlassSurface>
  );
}

export default function StaffDashboardScreen() {
  const insets = useSafeAreaInsets();
  // Opens on the work in flight, not on a list mixing closed tickets in.
  const [lane, setLane] = useState<StaffLane>("process");
  const {
    data: apiTickets,
    isLoading,
    isError,
    isRefetching: isTicketsRefetching,
    refetch: refetchTickets,
  } = useStaffTickets({ PageSize: 100 });
  const {
    data: stats,
    isRefetching: isStatsRefetching,
    refetch: refetchStats,
  } = useStaffDashboardStats();
  const {
    data: profile,
    isRefetching: isProfileRefetching,
    refetch: refetchProfile,
  } = useStaffProfile();
  const {
    data: unreadCount = 0,
    isRefetching: isUnreadRefetching,
    refetch: refetchUnread,
  } = useUnreadCount();
  const accountId = useSessionStore((s) => s.user?.accountId);

  const isRefreshing =
    isTicketsRefetching ||
    isStatsRefetching ||
    isProfileRefetching ||
    isUnreadRefetching;
  const handleRefresh = useCallback(() => {
    void Promise.all([
      refetchTickets(),
      refetchStats(),
      refetchProfile(),
      refetchUnread(),
    ]);
  }, [refetchProfile, refetchStats, refetchTickets, refetchUnread]);

  const allTickets = useMemo(() => apiTickets?.items ?? [], [apiTickets]);

  const counts = useMemo(() => {
    const acc: Record<StaffLane, number> = { process: 0, pending: 0, done: 0 };
    const byStatus = stats?.countByStatus;
    if (byStatus) {
      for (const [status, n] of Object.entries(byStatus)) {
        const key = staffLaneOf(status as TicketDTO["status"]);
        if (key) acc[key] += n;
      }
      return acc;
    }
    for (const ticket of allTickets) {
      const key = staffLaneOf(ticket.status);
      if (key) acc[key] += 1;
    }
    return acc;
  }, [stats, allTickets]);

  const visible = useMemo(
    () => allTickets.filter((t) => staffLaneOf(t.status) === lane),
    [allTickets, lane],
  );

  const displayName = profile?.fullName?.trim() || "there";
  const chips = LANES.map((l) => ({ ...l, count: counts[l.key] }));

  const renderTicket = ({
    item,
    index,
  }: {
    item: TicketDTO;
    index: number;
  }) => {
    const myRole = accountId
      ? item.assignments?.find((a) => a.staffId === accountId)?.role
      : undefined;
    return (
      // Rows arrive top-down so the eye lands on the first one.
      <Animated.View entering={enterRow(index)}>
        <TicketCard
          ticket={item}
          audience="staff"
          roleBadge={myRole ? (ROLE_BADGES[myRole] ?? null) : null}
          showAssignee={false}
          onPress={() =>
            router.push({
              pathname: "/(staff)/tickets/[id]",
              params: {
                id: item.id,
                ...(item.hasUnreadChat ? { jumpToUnread: "1" } : {}),
              },
            })
          }
        />
      </Animated.View>
    );
  };

  return (
    <View style={styles.root}>
      <EnergyBackdrop />

      <View style={[styles.headerWrap, { paddingTop: insets.top + 10 }]}>
        <HomeHeader
          name={displayName}
          avatarUrl={profile?.avatarUrl}
          unreadCount={unreadCount}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onBellPress={() => router.navigate("/(staff)/notifications" as any)}
        />

        <StatStrip
          open={stats?.openCount ?? 0}
          overdue={stats?.breachedCount ?? 0}
          done={stats?.resolvedCount ?? 0}
        />

        <Text style={styles.sectionTitle}>Work to handle</Text>

        {/* No `fill`: three chips split evenly leave ~90dp of text at 360dp, which
            clips "In progress" once its count is appended. Scrolls instead — and the
            negative margin cancels headerWrap's inset so it can scroll to the edge,
            since FilterChips' own row already carries the same 20dp. */}
        <View style={styles.chipRow}>
          <FilterChips items={chips} value={lane} onChange={setLane} />
        </View>
      </View>

      {isLoading ? (
        // Skeleton, not a spinner: it reserves the real row shape so the list
        // does not reflow when data lands.
        <View style={styles.list}>
          <TicketCardSkeleton count={3} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={44}
            color={Solar.faint}
          />
          <Text style={styles.emptyText}>Failed to load the ticket list</Text>
          <Pressable onPress={handleRefresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          // Remount per lane so the stagger replays — makes it read as a new
          // list rather than the same one silently rewritten.
          key={lane}
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={renderTicket}
          contentContainerStyle={[
            styles.list,
            visible.length === 0 && styles.listEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Solar.yellowDeep}
            />
          }
          ListEmptyComponent={
            <Animated.View
              entering={FadeIn.duration(220)}
              style={styles.emptyCard}
            >
              <Ionicons
                name="checkmark-done-circle-outline"
                size={44}
                color={Solar.faint}
              />
              <Text style={styles.emptyText}>{EMPTY_COPY[lane]}</Text>
            </Animated.View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Solar.bg },
  headerWrap: { paddingHorizontal: 20 },
  chipRow: { marginHorizontal: -20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },

  strip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    marginBottom: 20,
  },
  stripCell: { flex: 1, alignItems: "center", gap: 2 },
  stripDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  stripValue: { fontSize: 26, fontWeight: "700", letterSpacing: -0.6 },
  stripLabel: { ...Font.meta, fontSize: 11 },

  sectionTitle: { ...Font.title, marginBottom: 12 },

  list: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 110 },
  listEmpty: { flexGrow: 1, justifyContent: "center", paddingBottom: 150 },
  emptyCard: { padding: 30, alignItems: "center" },
  emptyText: { ...Font.meta, fontSize: 13, marginTop: 8 },
  retryBtn: {
    marginTop: 12,
    paddingVertical: 11,
    paddingHorizontal: 22,
    backgroundColor: Solar.yellow,
  },
  retryText: { fontSize: 14, fontWeight: "700", color: Colors.accent },
});
