import React, { useEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useProfile } from '../../../src/features/profile/hooks/useProfile';
import { useTickets } from '../../../src/features/tickets/hooks/useTickets';
import { useMyBatteryAssets } from '../../../src/features/batteries/hooks/useMyBatteryAssets';
import { useMyAlerts } from '../../../src/features/batteries/hooks/useMyAlerts';
import { AlertStatusEnum } from '../../../src/shared/enums/alert.enum';
import { BatteryAssetDto } from '../../../src/features/batteries/types/battery.types';
import { PopularKbSection } from '../../../src/features/kb/components/PopularKbSection';
import { Colors, Shadow } from '../../../src/lib/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const BATTERY_STATUS_MAP: Record<number, { label: string; color: string }> = {
  1: { label: 'Active', color: '#10B981' },
  2: { label: 'Inactive', color: Colors.gray },
  3: { label: 'Ngừng sử dụng', color: Colors.danger },
};

function BatteryCard({ item, onPress }: { item: BatteryAssetDto; onPress: () => void }) {
  const statusInfo = BATTERY_STATUS_MAP[item.status] ?? { label: 'Unknown', color: Colors.gray };

  return (
    <Pressable style={[styles.batteryCard, Shadow]} onPress={onPress}>
      <View style={styles.batteryIconBg}>
        <Ionicons name="battery-charging" size={20} color={statusInfo.color} />
      </View>
      <View style={styles.batteryInfo}>
        <Text style={styles.batteryName}>{item.batteryTypeName}</Text>
        <Text style={styles.batterySub}>{item.serialNumber}</Text>
        {item.siteName && <Text style={styles.batterySite}>{item.siteName}</Text>}
      </View>
      <View style={styles.batteryStatusWrap}>
        <Text style={[styles.batteryStatus, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        <Ionicons name="chevron-forward" size={14} color={Colors.gray} />
      </View>
    </Pressable>
  );
}

function EnergyFlowDiagram() {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - 40;
  const cx = cardWidth / 2;
  const cy = 150;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const solarToHomeLength = 86;
  const solarToHomeCycle = solarToHomeLength + 8;

  const solarToGridLength = cx - 76;
  const solarToGridCycle = solarToGridLength + 8;

  const gridToHomeLength = cx - 76;
  const gridToHomeCycle = gridToHomeLength + 8;

  const solarToHomeProps = useAnimatedProps(() => ({
    strokeDashoffset: -progress.value * solarToHomeCycle,
  }));

  const solarToGridProps = useAnimatedProps(() => ({
    strokeDashoffset: -progress.value * solarToGridCycle,
  }));

  const gridToHomeProps = useAnimatedProps(() => ({
    strokeDashoffset: -progress.value * gridToHomeCycle,
  }));

  const crossBorderPath = `M ${cx - 17} 107 L ${cx + 17} 107 L ${cx + 17} ${cy - 31} Q ${cx + 17} ${cy - 17} ${cx + 31} ${cy - 17} L ${cardWidth - 94} ${cy - 17} L ${cardWidth - 94} ${cy + 17} L ${cx + 31} ${cy + 17} Q ${cx + 17} ${cy + 17} ${cx + 17} ${cy + 31} L ${cx + 17} 193 L ${cx - 17} 193 L ${cx - 17} ${cy + 31} Q ${cx - 17} ${cy + 17} ${cx - 31} ${cy + 17} L 94 ${cy + 17} L 94 ${cy - 17} L ${cx - 31} ${cy - 17} Q ${cx - 17} ${cy - 17} ${cx - 17} ${cy - 31} Z`;
  const crossFillPath = `M ${cx - 15} 107 L ${cx + 15} 107 L ${cx + 15} ${cy - 27} Q ${cx + 15} ${cy - 15} ${cx + 27} ${cy - 15} L ${cardWidth - 94} ${cy - 15} L ${cardWidth - 94} ${cy + 15} L ${cx + 27} ${cy + 15} Q ${cx + 15} ${cy + 15} ${cx + 15} ${cy + 27} L ${cx + 15} 193 L ${cx - 15} 193 L ${cx - 15} ${cy + 27} Q ${cx - 15} ${cy + 15} ${cx - 27} ${cy + 15} L 94 ${cy + 15} L 94 ${cy - 15} L ${cx - 27} ${cy - 15} Q ${cx - 15} ${cy - 15} ${cx - 15} ${cy - 27} Z`;

  return (
    <View style={[styles.energyFlowCard, Shadow]}>
      <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Path d={crossBorderPath} fill="#F3F4F6" />
        <Path d={crossFillPath} fill="#FCFCFD" />

        {/* Solar to Home */}
        <Path d={`M ${cx} 107 L ${cx} 193`} stroke="#FBBF24" strokeWidth={1.5} opacity={0.25} fill="none" />
        <AnimatedPath
          d={`M ${cx} 107 L ${cx} 193`}
          stroke="#D97706"
          strokeWidth={4.5}
          strokeDasharray={`8, ${solarToHomeLength}`}
          strokeLinecap="round"
          fill="none"
          animatedProps={solarToHomeProps}
        />

        {/* Solar to Grid */}
        <Path
          d={`M ${cx + 10} 107 L ${cx + 10} ${cy - 22} Q ${cx + 10} ${cy - 10} ${cx + 22} ${cy - 10} L ${cardWidth - 94} ${cy - 10}`}
          stroke="#F97316" strokeWidth={1.5} opacity={0.25} fill="none"
        />
        <AnimatedPath
          d={`M ${cx + 10} 107 L ${cx + 10} ${cy - 22} Q ${cx + 10} ${cy - 10} ${cx + 22} ${cy - 10} L ${cardWidth - 94} ${cy - 10}`}
          stroke="#EA580C"
          strokeWidth={4.5}
          strokeDasharray={`8, ${solarToGridLength}`}
          strokeLinecap="round"
          fill="none"
          animatedProps={solarToGridProps}
        />

        {/* Grid to Home */}
        <Path
          d={`M ${cardWidth - 94} ${cy + 10} L ${cx + 22} ${cy + 10} Q ${cx + 10} ${cy + 10} ${cx + 10} ${cy + 22} L ${cx + 10} 193`}
          stroke="#10B981" strokeWidth={1.5} opacity={0.25} fill="none"
        />
        <AnimatedPath
          d={`M ${cardWidth - 94} ${cy + 10} L ${cx + 22} ${cy + 10} Q ${cx + 10} ${cy + 10} ${cx + 10} ${cy + 22} L ${cx + 10} 193`}
          stroke="#059669"
          strokeWidth={4.5}
          strokeDasharray={`8, ${gridToHomeLength}`}
          strokeLinecap="round"
          fill="none"
          animatedProps={gridToHomeProps}
        />
      </Svg>

      {/* Solar (Top) */}
      <View style={[styles.flowPillContainer, { top: 15, left: '50%', transform: [{ translateX: -37 }] }]}>
        <Text style={styles.flowLabelOutside}>Solar</Text>
        <View style={[styles.flowPill, { borderColor: '#F59E0B' }]}>
          <Ionicons name="sunny" size={20} color="#F59E0B" />
          <Text style={styles.flowPillValue}>1.86 kW</Text>
        </View>
      </View>

      {/* Battery (Left) */}
      <View style={[styles.flowPillContainer, { top: 150, left: 20, transform: [{ translateY: -55 }] }]}>
        <Text style={styles.flowLabelOutside}>Battery</Text>
        <View style={[styles.flowPill, { borderColor: '#CBD5E1' }]}>
          <Ionicons name="flash" size={20} color="#9CA3AF" />
          <Text style={styles.flowPillValue}>100%</Text>
        </View>
      </View>

      {/* Grid (Right) */}
      <View style={[styles.flowPillContainer, { top: 150, right: 20, transform: [{ translateY: -55 }] }]}>
        <Text style={styles.flowLabelOutside}>Grid</Text>
        <View style={[styles.flowPill, { borderColor: '#3B82F6' }]}>
          <Ionicons name="pulse" size={20} color="#3B82F6" />
          <Text style={styles.flowPillValue}>2.37 kW</Text>
        </View>
      </View>

      {/* Home (Bottom) */}
      <View style={[styles.flowPillContainer, { bottom: 15, left: '50%', transform: [{ translateX: -37 }] }]}>
        <View style={[styles.flowPill, { borderColor: '#1E3A8A' }]}>
          <Ionicons name="home" size={20} color="#1E3A8A" />
          <Text style={styles.flowPillValue}>512 W</Text>
        </View>
        <Text style={[styles.flowLabelOutside, { marginTop: 6, marginBottom: 0 }]}>Home</Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { data: account, isLoading: profileLoading } = useProfile();
  const { data: ticketsData, isLoading: ticketsLoading } = useTickets({ PageSize: 100 });
  const { data: batteries = [], isLoading: batteriesLoading } = useMyBatteryAssets();
  const { data: alerts = [] } = useMyAlerts();

  const openAlertsCount = alerts.filter((a) => a.status === AlertStatusEnum.Open).length;

  const isLoading = profileLoading || ticketsLoading;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const tickets = ticketsData?.items ?? [];
  const openTicketsCount = tickets.filter((t) =>
    !['Resolved', 'Closed', 'ClosedPendingRate', 'ClosedRejected'].includes(t.status)
  ).length;

  const firstName = account?.fullName ? account.fullName.split(' ')[0] : '';

  return (
    <View style={styles.root}>
      <FlatList
        data={batteries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.greetingText}>Hi, {firstName}</Text>
                <Text style={styles.welcomeText}>Welcome back</Text>
              </View>
              <Pressable style={styles.bellBtn} onPress={() => router.push('/(customer)/(tabs)/alerts')}>
                <Ionicons name="notifications-outline" size={20} color={Colors.accent} />
                {openAlertsCount > 0 && <View style={styles.bellDot} />}
              </Pressable>
            </View>

            {/* Energy Flow Diagram */}
            <EnergyFlowDiagram />

            {/* Stats Row */}
            <View style={[styles.statsCard, Shadow]}>
              <View style={styles.statCol}>
                <Text style={styles.statVal}>{batteries.length}</Text>
                <Text style={styles.statLabel}>Devices</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statVal}>{openTicketsCount}</Text>
                <Text style={styles.statLabel}>Open Tickets</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statVal}>{openAlertsCount}</Text>
                <Text style={styles.statLabel}>Alerts</Text>
              </View>
            </View>

            {/* Section Title */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Devices</Text>
              <Text style={styles.sectionCount}>Total {batteries.length}</Text>
            </View>

            {batteriesLoading && (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
            )}
          </>
        }
        renderItem={({ item }) => (
          <BatteryCard
            item={item}
            onPress={() => router.push({ pathname: '/(customer)/batteries/[id]', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          !batteriesLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="battery-dead-outline" size={48} color={Colors.gray} />
              <Text style={styles.emptyTitle}>No devices yet</Text>
              <Text style={styles.emptySub}>Your battery devices will appear here once assigned.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={<PopularKbSection limit={5} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  headerTitleWrap: { flex: 1 },
  greetingText: { fontSize: 20, fontWeight: '800', color: Colors.accent },
  welcomeText: { fontSize: 13, color: Colors.gray, marginTop: 2, fontWeight: '500' },
  bellBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF9500' },

  energyFlowCard: {
    height: 300,
    backgroundColor: Colors.white,
    borderRadius: 28,
    padding: 0,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  flowPillContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: 74,
  },
  flowLabelOutside: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  flowPill: {
    width: 74,
    height: 74,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow,
  },
  flowPillValue: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.accent,
    marginTop: 6,
    textAlign: 'center',
  },

  statsCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statCol: { alignItems: 'center', flex: 1 },
  statVal: { fontSize: 20, fontWeight: '800', color: Colors.accent },
  statLabel: { fontSize: 11, color: Colors.gray, fontWeight: '600', marginTop: 4 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(0,0,0,0.06)' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.accent },
  sectionCount: { fontSize: 13, color: Colors.gray, fontWeight: '600' },

  batteryCard: { backgroundColor: Colors.white, borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  batteryIconBg: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  batteryInfo: { flex: 1 },
  batteryName: { fontSize: 14, fontWeight: '800', color: Colors.accent },
  batterySub: { fontSize: 11, color: Colors.gray, fontWeight: '600', marginTop: 2 },
  batterySite: { fontSize: 11, color: Colors.gray, fontWeight: '500', marginTop: 2 },
  batteryStatusWrap: { alignItems: 'flex-end', gap: 4 },
  batteryStatus: { fontSize: 11, fontWeight: '800' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.accent, marginTop: 12 },
  emptySub: { fontSize: 13, color: Colors.gray, textAlign: 'center', marginTop: 6, paddingHorizontal: 40 },
});
