import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow } from '../../../src/lib/theme';
import { useBatteryAsset } from '../../../src/features/batteries/hooks/useBatteryAsset';
import { useBatteryAssetRealtime } from '../../../src/features/batteries/hooks/useBatteryAssetRealtime';
import { useSensorReadingAggregate } from '../../../src/features/batteries/hooks/useSensorReadingAggregate';
import { useAssetAlerts } from '../../../src/features/batteries/hooks/useAssetAlerts';
import { BatteryInfoCard } from '../../../src/features/batteries/components/BatteryInfoCard';
import { BatteryRealtimeCard } from '../../../src/features/batteries/components/BatteryRealtimeCard';
import { SensorChart } from '../../../src/features/batteries/components/SensorChart';
import { AssetAlertList } from '../../../src/features/batteries/components/AssetAlertList';
import { P } from '../../../src/lib/authz';
import { PermissionGuard } from '../../../src/features/auth/components/PermissionGuard';

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

  const { data: battery, isLoading, isError } = useBatteryAsset(assetId);
  const { data: realtime } = useBatteryAssetRealtime(assetId);

  // Aggregate 24h gần nhất, bucket 1h cho chart.
  const aggregateParams = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: to.toISOString(), interval: '1h' as const };
  }, []);
  const { data: aggregate = [] } = useSensorReadingAggregate(assetId, aggregateParams);
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
        <Text style={styles.notFoundTitle}>Không tìm thấy pin</Text>
        <Pressable onPress={() => router.back()} style={styles.goBackBtn}>
          <Text style={styles.goBackText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, Shadow]}>
          <Ionicons name="chevron-back" size={18} color={Colors.accent} />
        </Pressable>
        <Text style={styles.headerTitle}>Chi tiết pin</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.serial}>{battery.serialNumber}</Text>
        <Text style={styles.typeName}>{battery.batteryTypeName}</Text>

        {realtime ? <BatteryRealtimeCard data={realtime} /> : null}

        <Text style={styles.sectionTitle}>Biểu đồ</Text>
        <SensorChart data={aggregate} />

        <Text style={styles.sectionTitle}>Thông tin</Text>
        <BatteryInfoCard battery={battery} />

        <Text style={styles.sectionTitle}>Cảnh báo</Text>
        <AssetAlertList
          alerts={alerts}
          onPressAlert={(alertId) =>
            router.push({ pathname: '/(customer)/alerts/[id]', params: { id: alertId } })
          }
        />

        {/* Create ticket CTA */}
        <Pressable
          style={[styles.ctaCard, Shadow]}
          onPress={() => router.push({
            pathname: '/(customer)/tickets/create',
            params: { batteryId: battery.id },
          })}
        >
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.ctaText}>Tạo ticket hỗ trợ cho pin này</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.textMute} />
        </Pressable>
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
  serial: { fontSize: 22, fontWeight: '800', color: Colors.accent },
  typeName: { fontSize: 14, color: Colors.gray, fontWeight: '600', marginTop: 2, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.accent, marginBottom: 10 },

  ctaCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  ctaText: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.text },
});
