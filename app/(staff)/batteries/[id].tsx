import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BadgeColors, Colors, Shadow } from '@/src/lib/theme';
import { useBatteryAsset } from '@/src/features/batteries/hooks/useBatteryAsset';
import { useBatteryAssetRealtime } from '@/src/features/batteries/hooks/useBatteryAssetRealtime';
import { useBatterySensorStream } from '@/src/features/batteries/hooks/useBatterySensorStream';
import { useAssetAlerts } from '@/src/features/batteries/hooks/useAssetAlerts';
import { useCascadeRisk } from '@/src/features/batteries/hooks/useCascadeRisk';
import { BatteryInfoCard } from '@/src/features/batteries/components/BatteryInfoCard';
import { BatteryRealtimeCard } from '@/src/features/batteries/components/BatteryRealtimeCard';
import { CascadeRiskBadge } from '@/src/features/batteries/components/CascadeRiskBadge';
import { BmsSwitchCard } from '@/src/features/batteries/components/BmsSwitchCard';
import { SensorChart } from '@/src/features/batteries/components/SensorChart';
import { ChargeDischargeChart } from '@/src/features/batteries/components/ChargeDischargeChart';
import { AssetAlertList } from '@/src/features/batteries/components/AssetAlertList';
import { P } from '@/src/lib/authz';
import { PermissionGuard } from '@/src/features/auth/components/PermissionGuard';
import { BackButton } from '@/src/shared/components/ScreenHeader';

const STATUS_META: Record<number, { label: string; bg: string; text: string }> = {
  1: { label: 'Active', bg: BadgeColors.ok.bg, text: BadgeColors.ok.text },
  2: { label: 'Suspended', bg: BadgeColors.new.bg, text: BadgeColors.new.text },
  3: { label: 'Decommissioned', bg: BadgeColors.crit.bg, text: BadgeColors.crit.text },
};

export default function StaffBatteryViewScreen() {
  return (
    <PermissionGuard permission={P.BATTERY_VIEW}>
      <StaffBatteryViewScreenInner />
    </PermissionGuard>
  );
}

function StaffBatteryViewScreenInner() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const assetId = id ?? '';

  const { data: battery, isLoading, isError } = useBatteryAsset(assetId);
  const { data: realtime } = useBatteryAssetRealtime(assetId);
  // SSE realtime — merges into the realtime(assetId) cache; polling is the seed + fallback.
  useBatterySensorStream(assetId);
  const { data: cascade } = useCascadeRisk(assetId);
  const { data: alerts = [] } = useAssetAlerts(assetId);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isError || !battery) {
    return (
      <View style={styles.center}>
        <Ionicons name="battery-dead-outline" size={40} color={Colors.gray} />
        <Text style={styles.notFoundTitle}>Battery not found</Text>
        <Pressable onPress={() => router.back()} style={styles.goBackBtn}>
          <Text style={styles.goBackText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <BackButton />
        <Text style={styles.headerTitle}>Battery Info</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Title block: icon + serial/type + status */}
        <View style={styles.titleBlock}>
          <View style={styles.batteryIcon}>
            <Ionicons name="battery-charging" size={24} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.serial}>{battery.serialNumber}</Text>
            <Text style={styles.typeName}>{battery.batteryTypeName}</Text>
          </View>
          {STATUS_META[battery.status] ? (
            <View style={[styles.statusBadge, { backgroundColor: STATUS_META[battery.status].bg }]}>
              <Text style={[styles.statusText, { color: STATUS_META[battery.status].text }]}>
                {STATUS_META[battery.status].label}
              </Text>
            </View>
          ) : null}
        </View>

        {realtime ? <BatteryRealtimeCard data={realtime} /> : null}

        <CascadeRiskBadge data={cascade} />
        <BmsSwitchCard assetId={assetId} cascade={cascade} />

        {battery.siteId ? (
          <Pressable
            style={[styles.linkCard, Shadow]}
            onPress={() =>
              router.push({ pathname: '/(staff)/sites/[id]', params: { id: battery.siteId! } })
            }
          >
            <View style={styles.linkIcon}>
              <Ionicons name="business" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle} numberOfLines={1}>
                {battery.siteName ?? 'Installation site'}
              </Text>
              <Text style={styles.linkSub}>View site details</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMute} />
          </Pressable>
        ) : null}

        <Text style={styles.sectionTitle}>Charts</Text>
        <SensorChart assetId={assetId} />
        <ChargeDischargeChart assetId={assetId} />

        <Text style={styles.sectionTitle}>Details</Text>
        <BatteryInfoCard battery={battery} />

        <Text style={styles.sectionTitle}>Alerts</Text>
        <AssetAlertList
          alerts={alerts}
          limit={4}
          onPressAlert={(alertId) =>
            router.push({ pathname: '/(staff)/alerts/[id]', params: { id: alertId } })
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg, gap: 10 },
  notFoundTitle: { fontSize: 16, fontWeight: '800', color: Colors.accent, marginTop: 8 },
  goBackBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 10, marginTop: 8 },
  goBackText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.accent },
  scroll: { padding: 20, paddingBottom: 60 },
  titleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  batteryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serial: { fontSize: 20, fontWeight: '800', color: Colors.accent },
  typeName: { fontSize: 13, color: Colors.gray, fontWeight: '600', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '800' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.accent, marginBottom: 10 },
  linkCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: { fontSize: 14, fontWeight: '800', color: Colors.accent },
  linkSub: { fontSize: 11, color: Colors.textMute, fontWeight: '600', marginTop: 2 },
});
