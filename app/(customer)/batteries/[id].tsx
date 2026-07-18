import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow, Solar } from '../../../src/lib/theme';
import { useBatteryAsset } from '../../../src/features/batteries/hooks/useBatteryAsset';
import { useBatteryAssetRealtime } from '../../../src/features/batteries/hooks/useBatteryAssetRealtime';
import { useBatterySensorStream } from '../../../src/features/batteries/hooks/useBatterySensorStream';
import { useAssetAlerts } from '../../../src/features/batteries/hooks/useAssetAlerts';
import { useCascadeRisk } from '../../../src/features/batteries/hooks/useCascadeRisk';
import { BatteryInfoCard } from '../../../src/features/batteries/components/BatteryInfoCard';
import { CascadeRiskBadge } from '../../../src/features/batteries/components/CascadeRiskBadge';
import { SensorChart } from '../../../src/features/batteries/components/SensorChart';
import { AssetAlertList } from '../../../src/features/batteries/components/AssetAlertList';
import { RingStat } from '../../../src/shared/components/StatTrio';
import { ChargingStateEnum } from '../../../src/features/batteries/enums/battery.enum';
import { P } from '../../../src/lib/authz';
import { PermissionGuard } from '../../../src/features/auth/components/PermissionGuard';

const CHARGING_LABEL: Record<ChargingStateEnum, string> = {
  [ChargingStateEnum.Idle]: 'Đang nghỉ',
  [ChargingStateEnum.Charging]: 'Đang sạc',
  [ChargingStateEnum.Discharging]: 'Đang xả',
  [ChargingStateEnum.Float]: 'Chế độ float',
  [ChargingStateEnum.Bypass]: 'Chế độ bypass',
};

const STATUS_LABEL: Record<number, string> = {
  1: 'Đang hoạt động',
  2: 'Tạm ngưng',
  3: 'Ngừng sử dụng',
};

const SEGMENTS = 14; // số ô của thanh tiến độ vàng như thiết kế

function fmt(v: number | null | undefined, unit: string, digits = 1): string {
  if (v == null) return '—';
  return `${v.toFixed(digits)}${unit}`;
}

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
  // SSE realtime — merge vào cache realtime(assetId); polling là seed + fallback.
  useBatterySensorStream(assetId);
  const { data: cascade } = useCascadeRisk(assetId);
  const { data: alerts = [] } = useAssetAlerts(assetId);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Solar.yellowDeep} />
      </View>
    );
  }

  if (isError || !battery) {
    return (
      <View style={styles.center}>
        <Ionicons name="battery-dead-outline" size={40} color={Solar.faint} />
        <Text style={styles.notFoundTitle}>Không tìm thấy pin</Text>
        <Pressable onPress={() => router.back()} style={styles.goBackBtn}>
          <Text style={styles.goBackText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const goCreateTicket = () =>
    router.push({ pathname: '/(customer)/tickets/create', params: { batteryId: battery.id } });

  const soc = realtime?.socPercent ?? null;
  const filledSegments =
    soc != null ? Math.max(0, Math.min(SEGMENTS, Math.round((soc / 100) * SEGMENTS))) : 0;

  // Pill trạng thái giữa màn: ưu tiên trạng thái sạc realtime, fallback trạng thái pin.
  const statusPillLabel =
    realtime?.chargingState != null
      ? CHARGING_LABEL[realtime.chargingState]
      : STATUS_LABEL[battery.status] ?? 'Chưa có dữ liệu';

  const updatedAt = realtime?.time
    ? new Date(realtime.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={18} color={Solar.ink} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {battery.serialNumber}
        </Text>
        <Pressable onPress={goCreateTicket} style={styles.headerBtn}>
          <Ionicons name="ellipsis-vertical" size={16} color={Solar.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Pill trạng thái giữa màn như "Connected to 20 devices" */}
        <View style={styles.statusPillWrap}>
          <View style={styles.statusPill}>
            <View style={styles.statusPillDot} />
            <Text style={styles.statusPillText}>{statusPillLabel}</Text>
          </View>
        </View>

        {/* Hero — vòng SOC lớn trên nền kem */}
        <View style={styles.hero}>
          <RingStat
            percent={soc ?? 0}
            value={soc != null ? `${Math.round(soc)}%` : '—'}
            label="SOC"
            color={Solar.yellow}
            trackColor={Solar.tile}
            size={176}
            strokeWidth={14}
          />
        </View>

        <View style={styles.heroActions}>
          <View style={styles.heroMeta}>
            {realtime && realtime.activeAlerts > 0 ? (
              <View style={styles.alertPill}>
                <Ionicons name="warning" size={12} color={Colors.danger} />
                <Text style={styles.alertPillText}>{realtime.activeAlerts} cảnh báo</Text>
              </View>
            ) : (
              <Text style={styles.updatedText}>
                {updatedAt ? `Cập nhật lúc ${updatedAt}` : 'Chưa có dữ liệu realtime'}
              </Text>
            )}
          </View>
          <Pressable style={styles.powerBtn} onPress={goCreateTicket}>
            <Ionicons name="flash" size={22} color={Solar.ink} />
          </Pressable>
        </View>

        {/* Giám sát hiệu năng */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Giám sát hiệu năng</Text>
          {battery.siteId ? (
            <Pressable
              hitSlop={8}
              onPress={() =>
                router.push({ pathname: '/(customer)/sites/[id]', params: { id: battery.siteId! } })
              }
            >
              <Text style={styles.sectionAction}>Quản lý</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.perfCard, Shadow]}>
          <View style={styles.perfTop}>
            <View style={styles.perfTitleRow}>
              <Ionicons name="flash" size={16} color={Solar.yellowDeep} />
              <Text style={styles.perfValue}>{fmt(realtime?.voltage, ' V', 2)}</Text>
            </View>
            <View style={styles.perfPill}>
              <Text style={styles.perfPillText}>
                {realtime?.cycleCount != null ? `${realtime.cycleCount} chu kỳ` : '— chu kỳ'}
              </Text>
            </View>
          </View>
          <Text style={styles.perfCaption}>Điện áp hiện tại</Text>

          {/* Thanh tiến độ ô vàng — mức SOC */}
          <View style={styles.segmentRow}>
            <View style={styles.segments}>
              {Array.from({ length: SEGMENTS }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.segment, i < filledSegments && styles.segmentFilled]}
                />
              ))}
            </View>
            <Text style={styles.segmentLabel}>{soc != null ? `${Math.round(soc)}%` : '—'}</Text>
          </View>
        </View>

        {/* Lưới thông số 2 cột như các thẻ thiết bị */}
        <View style={styles.metricGrid}>
          <MetricCard icon="flash-outline" label="Điện áp" value={fmt(realtime?.voltage, ' V', 2)} />
          <MetricCard
            icon="swap-vertical-outline"
            label="Dòng điện"
            value={fmt(realtime?.current, ' A', 2)}
          />
          <MetricCard
            icon="thermometer-outline"
            label="Nhiệt độ"
            value={fmt(realtime?.temperature, ' °C')}
          />
          <MetricCard icon="pulse-outline" label="SOH" value={fmt(realtime?.sohPercent, ' %', 0)} />
        </View>

        <CascadeRiskBadge data={cascade} />

        {battery.siteId ? (
          <Pressable
            style={[styles.linkCard, Shadow]}
            onPress={() =>
              router.push({ pathname: '/(customer)/sites/[id]', params: { id: battery.siteId! } })
            }
          >
            <View style={styles.linkIcon}>
              <Ionicons name="business" size={18} color={Solar.yellowDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle} numberOfLines={1}>
                {battery.siteName ?? 'Trạm lắp đặt'}
              </Text>
              <Text style={styles.linkSub}>Xem chi tiết trạm</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Solar.mute} />
          </Pressable>
        ) : null}

        <Text style={styles.sectionTitle}>Biểu đồ</Text>
        <View style={{ height: 10 }} />
        <SensorChart assetId={assetId} />

        <Text style={styles.sectionTitle}>Thông tin</Text>
        <View style={{ height: 10 }} />
        <BatteryInfoCard battery={battery} />

        <Text style={styles.sectionTitle}>Cảnh báo</Text>
        <View style={{ height: 10 }} />
        <AssetAlertList
          alerts={alerts}
          limit={4}
          onPressAlert={(alertId) =>
            router.push({ pathname: '/(customer)/alerts/[id]', params: { id: alertId } })
          }
        />

        {/* Create ticket CTA — nút vàng như "Sell Electricity" */}
        <Pressable style={styles.ctaCard} onPress={goCreateTicket}>
          <Ionicons name="add-circle-outline" size={20} color={Solar.ink} />
          <Text style={styles.ctaText}>Tạo ticket hỗ trợ cho pin này</Text>
          <Ionicons name="chevron-forward" size={14} color={Solar.ink} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={[styles.metricCard, Shadow]}>
      <View style={styles.metricTop}>
        <View style={styles.metricIcon}>
          <Ionicons name={icon} size={15} color={Solar.yellowDeep} />
        </View>
        <Ionicons name="ellipsis-vertical" size={13} color={Solar.faint} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
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
    backgroundColor: Solar.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Solar.border,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: Solar.ink },

  scroll: { padding: 20, paddingTop: 6, paddingBottom: 60 },

  statusPillWrap: { alignItems: 'center', marginBottom: 8 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Solar.yellowSoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Solar.border,
  },
  statusPillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Solar.yellow },
  statusPillText: { fontSize: 12, fontWeight: '700', color: Solar.ink },

  hero: { alignItems: 'center', paddingVertical: 16 },

  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  heroMeta: { flex: 1 },
  updatedText: { fontSize: 12, color: Solar.mute, fontWeight: '600' },
  alertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  alertPillText: { fontSize: 11, fontWeight: '700', color: Colors.danger },
  powerBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Solar.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Solar.ink },
  sectionAction: { fontSize: 13, fontWeight: '600', color: Solar.mute },

  perfCard: {
    backgroundColor: Solar.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Solar.border,
  },
  perfTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  perfTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  perfValue: { fontSize: 17, fontWeight: '800', color: Solar.ink },
  perfPill: {
    backgroundColor: Solar.yellowSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  perfPillText: { fontSize: 11, fontWeight: '700', color: Solar.ink },
  perfCaption: { fontSize: 11, color: Solar.mute, fontWeight: '600', marginTop: 3 },

  segmentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  segments: { flex: 1, flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 14, borderRadius: 4, backgroundColor: Solar.tile },
  segmentFilled: { backgroundColor: Solar.yellow },
  segmentLabel: { fontSize: 12, fontWeight: '800', color: Solar.mute },

  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  metricCard: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: Solar.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Solar.border,
  },
  metricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Solar.yellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: { fontSize: 17, fontWeight: '800', color: Solar.ink },
  metricLabel: { fontSize: 11, color: Solar.mute, fontWeight: '600', marginTop: 2 },

  linkCard: {
    backgroundColor: Solar.card,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Solar.border,
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

  ctaCard: {
    backgroundColor: Solar.yellow,
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  ctaText: { flex: 1, fontSize: 13, fontWeight: '800', color: Solar.ink },
});
