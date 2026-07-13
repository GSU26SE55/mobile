import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../../../lib/theme';
import { RingStat } from '../../../shared/components/StatTrio';
import { BatteryAssetRealtimeDto } from '../types/battery.types';
import { ChargingStateEnum } from '../enums/battery.enum';

const CHARGING_META: Record<
  ChargingStateEnum,
  { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  [ChargingStateEnum.Idle]: { label: 'Nghỉ', color: Colors.gray, icon: 'pause-circle-outline' },
  [ChargingStateEnum.Charging]: { label: 'Đang sạc', color: Colors.primary, icon: 'flash' },
  [ChargingStateEnum.Discharging]: { label: 'Đang xả', color: Colors.info, icon: 'battery-charging-outline' },
  [ChargingStateEnum.Float]: { label: 'Float', color: Colors.info, icon: 'water-outline' },
  [ChargingStateEnum.Bypass]: { label: 'Bypass', color: Colors.info, icon: 'git-branch-outline' },
};

function socColor(soc: number | null): string {
  if (soc == null) return Colors.gray;
  // Accent trang trí: SOC còn dùng được → xanh lá; chỉ khi cạn (<20%) mới đỏ.
  if (soc >= 20) return Colors.primary;
  return Colors.danger;
}

function fmt(v: number | null, unit: string, digits = 1): string {
  if (v == null) return '—';
  return `${v.toFixed(digits)}${unit}`;
}

export function BatteryRealtimeCard({ data }: { data: BatteryAssetRealtimeDto }) {
  const updatedAt = data.time
    ? new Date(data.time).toLocaleString('vi-VN')
    : 'Chưa có dữ liệu';
  const charging =
    data.chargingState != null ? CHARGING_META[data.chargingState] : undefined;

  return (
    <View style={[styles.card, Shadow]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.liveDot} />
          <Text style={styles.title}>Thông số realtime</Text>
        </View>
        {data.activeAlerts > 0 ? (
          <View style={styles.alertPill}>
            <Ionicons name="warning" size={12} color={Colors.danger} />
            <Text style={styles.alertText}>{data.activeAlerts} cảnh báo</Text>
          </View>
        ) : null}
      </View>

      {/* Hero: vòng SOC + trạng thái sạc */}
      <View style={styles.hero}>
        <RingStat
          percent={data.socPercent ?? 0}
          value={data.socPercent != null ? `${Math.round(data.socPercent)}%` : '—'}
          label="SOC"
          color={socColor(data.socPercent)}
          size={132}
          strokeWidth={12}
        />
        {charging ? (
          <View style={[styles.chargeChip, { backgroundColor: `${charging.color}1A` }]}>
            <Ionicons name={charging.icon} size={14} color={charging.color} />
            <Text style={[styles.chargeText, { color: charging.color }]}>{charging.label}</Text>
          </View>
        ) : null}
      </View>

      {/* Tiles thông số */}
      <View style={styles.grid}>
        <Tile icon="flash-outline" label="Điện áp" value={fmt(data.voltage, ' V', 2)} />
        <Tile icon="swap-vertical-outline" label="Dòng điện" value={fmt(data.current, ' A', 2)} />
        <Tile icon="thermometer-outline" label="Nhiệt độ" value={fmt(data.temperature, ' °C')} />
        <Tile icon="pulse-outline" label="SOH" value={fmt(data.sohPercent, ' %', 0)} />
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="repeat-outline" size={13} color={Colors.textMute} />
          <Text style={styles.footerText}>
            {data.cycleCount != null ? `${data.cycleCount} chu kỳ` : '— chu kỳ'}
          </Text>
        </View>
        <Text style={styles.updatedAt}>Cập nhật {updatedAt}</Text>
      </View>
    </View>
  );
}

function Tile({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.tile}>
      <Ionicons name={icon} size={16} color={Colors.primary} />
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 18,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary },
  title: { fontSize: 15, fontWeight: '800', color: Colors.accent },
  alertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  alertText: { fontSize: 11, fontWeight: '700', color: Colors.danger },

  hero: { alignItems: 'center', paddingVertical: 8 },
  chargeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 10,
  },
  chargeText: { fontSize: 12, fontWeight: '800' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: Colors.bg,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 3,
  },
  tileValue: { fontSize: 15, fontWeight: '800', color: Colors.accent },
  tileLabel: { fontSize: 11, color: Colors.textMute, fontWeight: '600' },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerText: { fontSize: 12, color: Colors.textMute, fontWeight: '700' },
  updatedAt: { fontSize: 11, color: Colors.textFaint, fontWeight: '500' },
});
