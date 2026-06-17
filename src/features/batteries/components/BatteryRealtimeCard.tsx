import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow } from '../../../lib/theme';
import { BatteryAssetRealtimeDto } from '../types/battery.types';
import { ChargingStateEnum } from '../enums/battery.enum';

const CHARGING_LABEL: Record<ChargingStateEnum, string> = {
  [ChargingStateEnum.Idle]: 'Nghỉ',
  [ChargingStateEnum.Charging]: 'Đang sạc',
  [ChargingStateEnum.Discharging]: 'Đang xả',
  [ChargingStateEnum.Float]: 'Float',
  [ChargingStateEnum.Bypass]: 'Bypass',
};

function fmt(v: number | null, unit: string, digits = 1): string {
  if (v == null) return '—';
  return `${v.toFixed(digits)}${unit}`;
}

export function BatteryRealtimeCard({ data }: { data: BatteryAssetRealtimeDto }) {
  const updatedAt = data.time ? new Date(data.time).toLocaleString() : 'Chưa có dữ liệu';

  return (
    <View style={[styles.card, Shadow]}>
      <View style={styles.header}>
        <Text style={styles.title}>Thông số realtime</Text>
        {data.activeAlerts > 0 ? (
          <View style={styles.alertPill}>
            <Ionicons name="warning" size={12} color={Colors.danger} />
            <Text style={styles.alertText}>{data.activeAlerts} cảnh báo</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.grid}>
        <Metric icon="flash-outline" label="Điện áp" value={fmt(data.voltage, ' V', 2)} />
        <Metric icon="swap-vertical-outline" label="Dòng điện" value={fmt(data.current, ' A', 2)} />
        <Metric icon="thermometer-outline" label="Nhiệt độ" value={fmt(data.temperature, ' °C')} />
        <Metric icon="battery-half-outline" label="SOC" value={fmt(data.socPercent, ' %')} />
        <Metric icon="heart-outline" label="SOH" value={fmt(data.sohPercent, ' %')} />
        <Metric
          icon="repeat-outline"
          label="Chu kỳ"
          value={data.cycleCount != null ? String(data.cycleCount) : '—'}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Trạng thái sạc</Text>
        <Text style={styles.footerValue}>
          {data.chargingState != null ? CHARGING_LABEL[data.chargingState] ?? '—' : '—'}
        </Text>
      </View>
      <Text style={styles.updatedAt}>Cập nhật: {updatedAt}</Text>
    </View>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={18} color={Colors.primary} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
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
    marginBottom: 16,
  },
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
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  metric: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  metricValue: { fontSize: 15, fontWeight: '800', color: Colors.accent },
  metricLabel: { fontSize: 11, color: Colors.textMute, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  footerLabel: { fontSize: 12, color: Colors.textMute, fontWeight: '600' },
  footerValue: { fontSize: 13, fontWeight: '800', color: Colors.accent },
  updatedAt: { fontSize: 11, color: Colors.textFaint, marginTop: 8, textAlign: 'right' },
});
