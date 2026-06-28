import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../../../src/lib/theme';
import { P } from '../../../src/lib/authz';
import { PermissionGuard } from '../../../src/features/auth/components/PermissionGuard';
import { useSiteDetail } from '../../../src/features/sites/hooks/useSiteDetail';
import { useSiteDashboard } from '../../../src/features/sites/hooks/useSiteDashboard';
import { useSiteAssets } from '../../../src/features/sites/hooks/useSiteAssets';
import { SiteHealthBadge } from '../../../src/features/sites/components/SiteHealthBadge';
import { useAmbientLatest } from '../../../src/features/ambient/hooks/useAmbientLatest';
import { useAmbientTrend } from '../../../src/features/ambient/hooks/useAmbientTrend';
import { AmbientTile } from '../../../src/features/ambient/components/AmbientTile';
import { AmbientTrendChart } from '../../../src/features/ambient/components/AmbientTrendChart';
import { BatteryAssetDto } from '../../../src/features/batteries/types/battery.types';

export default function StaffSiteDetailScreen() {
  return (
    <PermissionGuard permission={P.BATTERY_VIEW}>
      <SiteDetailInner />
    </PermissionGuard>
  );
}

function SiteDetailInner() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const siteId = id ?? '';

  const { data: site, isLoading, isError } = useSiteDetail(siteId);
  const { data: dashboard } = useSiteDashboard(siteId);
  const { data: assets = [] } = useSiteAssets(siteId);
  const { data: ambient } = useAmbientLatest(siteId);
  const trendParams = useMemo(() => ({ granularity: 'day' as const }), []);
  const { data: trend = [] } = useAmbientTrend(siteId, trendParams);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isError || !site) {
    return (
      <View style={styles.center}>
        <Ionicons name="business-outline" size={40} color={Colors.gray} />
        <Text style={styles.notFoundTitle}>Không tìm thấy site</Text>
        <Pressable onPress={() => router.back()} style={styles.goBackBtn}>
          <Text style={styles.goBackText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={[styles.headerBtn, Shadow]}>
          <Ionicons name="chevron-back" size={18} color={Colors.accent} />
        </Pressable>
        <Text style={styles.headerTitle}>Chi tiết site</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.name}>{site.name}</Text>
        {site.address ? <Text style={styles.address}>{site.address}</Text> : null}

        {dashboard ? (
          <View style={[styles.statsCard, Shadow]}>
            <View style={styles.statsTop}>
              <Text style={styles.statsTitle}>Sức khỏe hệ thống</Text>
              <SiteHealthBadge score={dashboard.healthScore} />
            </View>
            <View style={styles.statsRow}>
              <Stat value={dashboard.totalAssets} label="Tổng pin" />
              <View style={styles.statDivider} />
              <Stat value={dashboard.activeAssets} label="Hoạt động" />
              <View style={styles.statDivider} />
              <Stat value={dashboard.assetsWithActiveAlerts} label="Có cảnh báo" />
            </View>
          </View>
        ) : null}

        <AmbientTile data={ambient} />
        <AmbientTrendChart data={trend} />

        <Text style={styles.sectionTitle}>Danh sách pin ({assets.length})</Text>
        {assets.length === 0 ? (
          <Text style={styles.empty}>Site chưa có pin nào.</Text>
        ) : (
          assets.map((item: BatteryAssetDto) => (
            <Pressable
              key={item.id}
              style={[styles.assetRow, Shadow]}
              onPress={() => router.push({ pathname: '/(staff)/batteries/[id]', params: { id: item.id } })}
            >
              <Ionicons name="battery-charging-outline" size={20} color={Colors.primary} />
              <View style={styles.assetInfo}>
                <Text style={styles.assetSerial}>{item.serialNumber}</Text>
                <Text style={styles.assetType}>{item.batteryTypeName}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={Colors.gray} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  name: { fontSize: 22, fontWeight: '800', color: Colors.accent },
  address: { fontSize: 14, color: Colors.gray, fontWeight: '600', marginTop: 2, marginBottom: 16 },

  statsCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 18, marginBottom: 16 },
  statsTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  statsTitle: { fontSize: 15, fontWeight: '800', color: Colors.accent },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statCol: { alignItems: 'center', flex: 1 },
  statVal: { fontSize: 20, fontWeight: '800', color: Colors.accent },
  statLabel: { fontSize: 11, color: Colors.gray, fontWeight: '600', marginTop: 4 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(0,0,0,0.06)' },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.accent, marginBottom: 10, marginTop: 4 },
  empty: { fontSize: 13, color: Colors.textMute, paddingVertical: 12 },
  assetRow: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  assetInfo: { flex: 1 },
  assetSerial: { fontSize: 14, fontWeight: '800', color: Colors.accent },
  assetType: { fontSize: 11, color: Colors.gray, fontWeight: '600', marginTop: 2 },
});
