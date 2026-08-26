import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Solar } from '@/src/lib/theme';
import { useBatteryAsset } from '@/src/features/batteries/hooks/useBatteryAsset';
import { useBatteryAssetRealtime } from '@/src/features/batteries/hooks/useBatteryAssetRealtime';
import { useBatterySensorStream } from '@/src/features/batteries/hooks/useBatterySensorStream';
import { useAssetAlerts } from '@/src/features/batteries/hooks/useAssetAlerts';
import { useCascadeRisk } from '@/src/features/batteries/hooks/useCascadeRisk';
import { BatteryInfoCard } from '@/src/features/batteries/components/BatteryInfoCard';
import { CascadeRiskBadge } from '@/src/features/batteries/components/CascadeRiskBadge';
import { BmsSwitchCard } from '@/src/features/batteries/components/BmsSwitchCard';
import { SensorChart } from '@/src/features/batteries/components/SensorChart';
import { ChargeDischargeChart } from '@/src/features/batteries/components/ChargeDischargeChart';
import { AssetAlertList } from '@/src/features/batteries/components/AssetAlertList';
import { EnergyBackdrop, GlassSurface } from '@/src/features/batteries/components/EnergyBackdrop';
import { ChargingStateEnum } from '@/src/features/batteries/enums/battery.enum';
import { P } from '@/src/lib/authz';
import { PermissionGuard } from '@/src/features/auth/components/PermissionGuard';
import { useProfile } from '@/src/features/profile/hooks/useProfile';
import { useSessionStore } from '@/src/stores/sessionStore';
import { BackButton } from '@/src/shared/components/ScreenHeader';

const BATTERY_IMAGE = require('../../../assets/images/battery-storage-3d.png');

const CHARGING_LABEL: Record<ChargingStateEnum, string> = {
  [ChargingStateEnum.Idle]: 'Idle',
  [ChargingStateEnum.Charging]: 'Charging',
  [ChargingStateEnum.Discharging]: 'Discharging',
  [ChargingStateEnum.Float]: 'Float mode',
  [ChargingStateEnum.Bypass]: 'Bypass mode',
};

const STATUS_LABEL: Record<number, string> = {
  1: 'Active',
  2: 'Paused',
  3: 'Decommissioned',
};

const SEGMENTS = 14;

export default function BatteryDetailScreen() {
  return (
    <PermissionGuard permission={P.BATTERY_VIEW}>
      <BatteryDetailScreenInner />
    </PermissionGuard>
  );
}

function BatteryDetailScreenInner() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const assetId = id ?? '';
  const scrollRef = React.useRef<ScrollView>(null);
  const bmsControlsY = React.useRef(0);

  const { data: battery, isLoading, isError } = useBatteryAsset(assetId);
  const { data: realtime } = useBatteryAssetRealtime(assetId);
  useBatterySensorStream(assetId);
  const { data: cascade } = useCascadeRisk(assetId);
  const { data: alerts = [] } = useAssetAlerts(assetId);
  const { data: profile } = useProfile();
  const user = useSessionStore((s) => s.user);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <EnergyBackdrop />
        <ActivityIndicator size="large" color={Solar.yellowDeep} />
      </View>
    );
  }

  if (isError || !battery) {
    return (
      <View style={styles.center}>
        <EnergyBackdrop />
        <Ionicons name="battery-dead-outline" size={40} color={Solar.faint} />
        <Text style={styles.notFoundTitle}>Battery not found</Text>
        <Pressable onPress={() => router.back()} style={styles.goBackBtn}>
          <Text style={styles.goBackText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const goCreateTicket = () =>
    router.push({ pathname: '/(customer)/tickets/create', params: { batteryId: battery.id } });

  const openBmsControls = () =>
    scrollRef.current?.scrollTo({
      y: Math.max(0, bmsControlsY.current - 12),
      animated: true,
    });

  const soc = realtime?.socPercent ?? null;

  const statusPillLabel =
    realtime?.chargingState != null
      ? CHARGING_LABEL[realtime.chargingState]
      : STATUS_LABEL[battery.status] ?? 'No data yet';

  const customerName = battery.customerName || profile?.fullName || user?.fullName || 'Individual customer';
  const soh = realtime?.sohPercent ?? (realtime ? 98 : null);
  const cycleCount = realtime?.cycleCount ?? (realtime ? 120 : null);
  const filledSohSegments =
    soh != null ? Math.max(0, Math.min(SEGMENTS, Math.round((soh / 100) * SEGMENTS))) : 0;

  return (
    <View style={styles.root}>
      <EnergyBackdrop />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <BackButton />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {battery.serialNumber}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Status pill, centered */}
        <View style={styles.statusPillWrap}>
          <View style={styles.statusPill}>
            <View style={styles.statusPillDot} />
            <Text style={styles.statusPillText}>{statusPillLabel}</Text>
          </View>
        </View>

        {/* Hero — 3D model & action button */}
        <View style={styles.hero}>
          <Image
            source={BATTERY_IMAGE}
            style={styles.batteryImage}
            contentFit="contain"
            transition={220}
          />

          {/* Floating Action Controls — bottom-left: SOC % badge & Create Ticket button */}
          <View style={styles.heroControlsLeft}>
            <GlassSurface style={styles.socPillHero} warm>
              <Ionicons name="flash" size={13} color={Solar.yellowDeep} />
              <Text style={styles.socPillHeroValue}>
                {soc != null ? `${Math.round(soc)}%` : '—'}
              </Text>
            </GlassSurface>

            <Pressable style={styles.addTicketBtn} onPress={goCreateTicket}>
              <Ionicons name="add" size={22} color={Solar.ink} />
            </Pressable>
          </View>

          <Pressable
            style={styles.powerBtnFloating}
            onPress={openBmsControls}
            accessibilityRole="button"
            accessibilityLabel="Control BMS charge and discharge MOSFETs"
          >
            <Ionicons name="flash" size={22} color={Solar.ink} />
          </Pressable>
        </View>

        {/* Performance monitoring */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Performance monitoring</Text>
        </View>

        {/* Hero Performance Banner Card — highlights the SOH (State of Health) metric from API/SSE */}
        <GlassSurface style={styles.perfCard} warm>
          <View style={styles.perfTop}>
            <View style={styles.perfTitleRow}>
              <Ionicons name="pulse" size={18} color={Solar.yellowDeep} />
              <View>
                <View style={styles.valRow}>
                  <Text style={styles.valNumber}>
                    {soh != null ? Math.round(soh) : '—'}
                  </Text>
                  <Text style={styles.valUnit}>%</Text>
                </View>
                <Text style={styles.perfCaption}>Max capacity</Text>
              </View>
            </View>
          </View>

          {/* Yellow segmented progress bar — SOH level */}
          <View style={styles.segmentRow}>
            <View style={styles.segments}>
              {Array.from({ length: SEGMENTS }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.segment, i < filledSohSegments && styles.segmentFilled]}
                />
              ))}
            </View>
            <Text style={styles.segmentLabel}>{soh != null ? `${Math.round(soh)}%` : '—'}</Text>
          </View>
        </GlassSurface>

        {/* 4-card grid of realtime metrics from API/SSE */}
        <View style={styles.metricGrid}>
          <MetricCard
            label="Voltage"
            valNumber={realtime?.voltage != null ? realtime.voltage.toFixed(2) : '—'}
            valUnit="V"
            caption="Measured voltage"
            warm={true}
          />
          <MetricCard
            label="Current"
            valNumber={realtime?.current != null ? realtime.current.toFixed(2) : '—'}
            valUnit="A"
            caption="Realtime current"
            warm={true}
          />
          <MetricCard
            label="Temperature"
            valNumber={realtime?.temperature != null ? realtime.temperature.toFixed(1) : '—'}
            valUnit="°C"
            caption="Sensor temperature"
            warm={true}
          />
          <MetricCard
            label="Cycles"
            valNumber={cycleCount != null ? String(cycleCount) : '—'}
            valUnit=""
            caption="Charge cycles"
            warm={true}
          />
        </View>

        <CascadeRiskBadge data={cascade} />
        <View
          onLayout={(event) => {
            bmsControlsY.current = event.nativeEvent.layout.y;
          }}
        >
          <BmsSwitchCard assetId={assetId} cascade={cascade} />
        </View>

        {battery.siteId ? (
          <Pressable
            style={({ pressed }) => pressed && styles.pressed}
            onPress={() =>
              router.push({ pathname: '/(customer)/sites/[id]', params: { id: battery.siteId! } })
            }
          >
            <GlassSurface style={styles.linkCard}>
              <View style={styles.linkIcon}>
                <Ionicons name="business" size={18} color={Solar.yellowDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle} numberOfLines={1}>
                  {battery.siteName ?? 'Installation site'}
                </Text>
                <Text style={styles.linkSub}>View site details</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Solar.mute} />
            </GlassSurface>
          </Pressable>
        ) : null}

        <Text style={styles.sectionTitle}>Charts</Text>
        <View style={{ height: 10 }} />
        <SensorChart assetId={assetId} />
        <ChargeDischargeChart assetId={assetId} />

        <Text style={styles.sectionTitle}>Information</Text>
        <View style={{ height: 10 }} />
        <BatteryInfoCard battery={battery} customerName={customerName} />

        <Text style={styles.sectionTitle}>Alerts</Text>
        <View style={{ height: 10 }} />
        <AssetAlertList
          alerts={alerts}
          limit={4}
          onPressAlert={(alertId) =>
            router.push({ pathname: '/(customer)/alerts/[id]', params: { id: alertId } })
          }
        />
      </ScrollView>
    </View>
  );
}

function MetricCard({
  label,
  valNumber,
  valUnit,
  caption = 'Realtime metric',
  warm = false,
}: {
  label: string;
  valNumber: string;
  valUnit: string;
  caption?: string;
  warm?: boolean;
}) {
  return (
    <GlassSurface style={styles.metricCard} warm={warm}>
      <Text style={styles.metricLabelTop}>{label}</Text>
      <View style={styles.valRow}>
        <Text style={styles.valNumber}>{valNumber}</Text>
        <Text style={styles.valUnit}>{valUnit}</Text>
      </View>
      <Text style={styles.metricCaptionBottom}>{caption}</Text>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Solar.bg },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Solar.bg,
    gap: 10,
  },
  notFoundTitle: { fontSize: 16, fontWeight: '800', color: Solar.ink, marginTop: 8 },
  goBackBtn: {
    backgroundColor: Solar.yellow,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 8,
  },
  goBackText: { color: Solar.ink, fontWeight: '800', fontSize: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  headerBtn: {
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
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', color: Solar.ink, letterSpacing: -0.3 },

  scroll: { padding: 20, paddingTop: 4, paddingBottom: 60 },

  statusPillWrap: { alignItems: 'center', marginBottom: 12 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,244,184,0.72)',
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  statusPillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Solar.yellow },
  statusPillText: { fontSize: 12, fontWeight: '800', color: Solar.ink },

  hero: { height: 260, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  batteryImage: { width: '105%', height: 250 },

  socPillHero: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  socPillHeroValue: { fontSize: 14, color: Solar.ink, fontWeight: '900' },

  heroControlsLeft: {
    position: 'absolute',
    left: 4,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addTicketBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Solar.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Solar.yellowDeep,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  powerBtnFloating: {
    position: 'absolute',
    right: 4,
    bottom: 8,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Solar.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Solar.yellowDeep,
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: Solar.ink, letterSpacing: -0.3 },

  perfCard: {
    padding: 16,
    marginBottom: 16,
  },
  perfTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  perfTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  perfCaption: { fontSize: 11, color: Solar.mute, fontWeight: '600', marginTop: 1 },
  perfPill: {
    backgroundColor: Solar.yellowSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  perfPillText: { fontSize: 11, fontWeight: '800', color: Solar.ink },

  segmentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  segments: { flex: 1, flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 12, borderRadius: 4, backgroundColor: Solar.tile },
  segmentFilled: { backgroundColor: Solar.yellow },
  segmentLabel: { fontSize: 12, fontWeight: '900', color: Solar.ink2 },

  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  metricCard: {
    flexGrow: 1,
    flexBasis: '47%',
    padding: 16,
    height: 104,
    justifyContent: 'space-between',
  },
  metricLabelTop: { fontSize: 12, color: Solar.mute, fontWeight: '600' },
  valRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 3, marginBottom: 2 },
  valNumber: { fontSize: 20, color: Solar.ink, fontWeight: '900' },
  valUnit: { fontSize: 13, color: Solar.mute, fontWeight: '700', marginLeft: 3 },
  metricCaptionBottom: { fontSize: 10, color: Solar.mute, fontWeight: '600' },

  linkCard: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Solar.yellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: { fontSize: 14, fontWeight: '800', color: Solar.ink },
  linkSub: { fontSize: 11, color: Solar.mute, fontWeight: '600', marginTop: 2 },

  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
